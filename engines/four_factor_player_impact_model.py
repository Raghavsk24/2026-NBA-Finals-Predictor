import os
import json
import math
import random

"""This is engine 3: the four factor player-impact model. This is the most complex of the three predictors.
 It layers player-level projections on top of team-level four factors to produce a more granular prediction 
 that can also be used to explore what-if scenarios with injuries and minute changes between starters.

 The layers are as follows:
    layer 1: team four factors. start from each team's season four factors, effective field goal percent,
             turnover rate, offensive rebound percent and free throw rate, which set the baseline efficiency
             the rest of the model adjusts.
    layer 2: player efficiency. score every available player's offense by combining how efficiently he scores
             (true shooting) with how much of the offense he creates (usage), so a high usage star still
             matters even when his efficiency is only average. injured players are left out.
    layer 3: matchup adjustment. lower each player's efficiency by the strength of the defender lined up across
             from him, read from that defender's defensive rating, steals and blocks, so an elite defender
             drags his man down.
    layer 4: minutes. weight every player by his projected minutes inside a fixed pool of starter minutes.
             injuries and minute changes redistribute that pool, with any shortfall filled by replacement
             level production, which is what powers the what-if scenarios.
    layer 5: aggregation. turn the adjusted four factor edges into a single game win probability with a ridge
             logistic regression, then run 10,000 monte carlo simulations of the best of seven to produce the
             series odds and length. """

# Writes path to team stats, players, model and output json files
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROCESSED = os.path.join(ROOT, "data", "processed")
TEAM_STATS_PATH = os.path.join(PROCESSED, "team_stats.json")
PLAYERS_PATH = os.path.join(PROCESSED, "players.json")
MODEL_PATH = os.path.join(PROCESSED, "engine3_model.json")
OUTPUT_PATH = os.path.join(PROCESSED, "engine3.json")

# Number of Simulations and series schedule constants
NUM_SIMULATIONS = 10000
SAS_HOME_BY_GAME = [True, True, False, False, True, False, True]

# constants that tune how strongly the player layers move the team four factors.
LEAGUE_AVG_DRTG = 114.73
REP_TS = 0.520          # a replacement level scorer's true shooting
REP_USG = 0.180         # a replacement level usage rate
REP_REB_RATE = 0.13     # rebounds per minute for replacement minutes
USAGE_BASE = 0.200      # the usage rate we treat as neutral shot creation
USAGE_BONUS = 0.300     # how much extra shot creation adds to a player's offensive quality
EFG_SENS = 0.30         # how much the scoring layer moves effective field goal percent
OREB_SENS = 0.08        # how much the rebounding layer moves offensive rebound percent
MATCHUP_TS_SENS = 0.12  # how much a strong defender suppresses an attacker's true shooting
MATCHUP_PTS_SENS = 0.55 # how much a strong defender suppresses an attacker's projected points


def sigmoid(z):
    # sigmoid function that squashes a number into a probability between zero and one
    return 1.0 / (1.0 + math.exp(-z))


def defender_strength(defender):
    # layer 3 helper: turn a defender's metrics into a small positive number where higher is a tougher defender. 
    if defender is None:
        return 0.0
    rating_part = (LEAGUE_AVG_DRTG - defender["drtg"]) / 100.0
    stocks_part = (defender["stl"] + defender["blk"]) * 0.01
    return rating_part + stocks_part # Combines DRtng with stocks (steals and blocks) to get a single defender strength number


def build_matchup_map(players):
    # map each starter to the player guarding them, using the fixed positional pairings
    nyk_by_pos = {p["pos"]: p for p in players["NYK"]["starters"]}
    sas_by_pos = {p["pos"]: p for p in players["SAS"]["starters"]}
    # walk both starting fives by position so each player points at the man across from them
    defenders = {}
    for pos, nyk_p in nyk_by_pos.items():
        sas_p = sas_by_pos.get(pos)
        if sas_p:
            defenders[nyk_p["name"]] = sas_p
            defenders[sas_p["name"]] = nyk_p
    return defenders


def team_pool(team, injured_names, minutes_overrides):
    # build the list of available players for a team with the minutes they will play
    pool = []
    for p in team["starters"] + team.get("bench", []):
        if p["name"] in injured_names:
            continue
        minutes = minutes_overrides.get(p["name"], p["min"])
        pool.append((p, minutes))
    return pool


def allocate_minutes(pool, starter_target):
    """ layer 4: conserve a fixed pool of starter minutes. if the active players want more than
     the pool we scale everyone down, if they want less the gap is filled by replacement level
     minutes. this stops adding or removing a player from inflating a team, a change mostly
     redistributes the same minutes rather than inventing new ones. """
    desired = sum(minutes for _, minutes in pool)
    if desired > starter_target and desired > 0:
        scale = starter_target / desired
        alloc = [(p, minutes * scale) for p, minutes in pool]
        return alloc, 0.0
    alloc = [(p, minutes) for p, minutes in pool]
    return alloc, max(0.0, starter_target - desired)


def matchup_defender(name, defenders, injured_names):
    # the man guarding this player, unless he is hurt, in which case no one is really on him
    defender = defenders.get(name)
    if defender is None or defender["name"] in injured_names:
        return None
    return defender


def offensive_quality(adj_ts, usg):
    # layer 2: a player's offensive value combines shooting efficiency with shot creation, solosing a high usage engine hurts even if his efficiency is only average
    return adj_ts + USAGE_BONUS * (usg - USAGE_BASE)


def team_indices(alloc, rep_minutes, defenders, injured_names):
    # layers 2, 3 and 4 combined: a scoring index and a rebounding index for a team
    minute_sum = 0.0
    quality_minutes = 0.0
    reb_minutes = 0.0
    for p, minutes in alloc:
        # layer 3: a tougher defender lowers this attacker's effective true shooting
        adj_ts = p["ts"] - MATCHUP_TS_SENS * defender_strength(matchup_defender(p["name"], defenders, injured_names))
        minute_sum += minutes
        quality_minutes += offensive_quality(adj_ts, p["usg"]) * minutes
        reb_per_min = p["reb"] / p["min"] if p["min"] else 0.0
        reb_minutes += reb_per_min * minutes

    # replacement minutes contribute at a flat, league bottom level
    rep_quality = offensive_quality(REP_TS, REP_USG)
    minute_sum += rep_minutes
    quality_minutes += rep_quality * rep_minutes
    reb_minutes += REP_REB_RATE * rep_minutes

    if minute_sum == 0:
        return rep_quality, REP_REB_RATE
    return quality_minutes / minute_sum, reb_minutes / minute_sum


def effective_four_factors(team_stats, offense_index, reb_index, base_offense, base_reb):
    # layer 1 adjusted by the player layers
    efg = team_stats["efg"] + EFG_SENS * (offense_index - base_offense)
    oreb = team_stats["oreb"] + OREB_SENS * (reb_index - base_reb)
    return {"efg": efg, "tov": team_stats["tov"], "oreb": oreb, "ftr": team_stats["ftr"]}


def nyk_game_probability(nyk_factors, sas_factors, model, nyk_home):
    # layer 5: assemble the four factor edges from the knicks point of view, standardize them the same way training did, and run the logistic regression to get a single game win odds
    efg_diff = nyk_factors["efg"] - sas_factors["efg"]
    tov_diff = sas_factors["tov"] - nyk_factors["tov"]
    oreb_diff = nyk_factors["oreb"] - sas_factors["oreb"]
    ftr_diff = nyk_factors["ftr"] - sas_factors["ftr"]
    home = 1.0 if nyk_home else 0.0
    raw = [efg_diff, tov_diff, oreb_diff, ftr_diff, home]

    logit = model["intercept"]
    for value, mean, scale, coef in zip(raw, model["scaler_mean"], model["scaler_scale"], model["coef"]):
        z = (value - mean) / scale if scale else 0.0
        logit += coef * z
    return sigmoid(logit)


def simulate_series(p_nyk_home, p_nyk_away):
    # run the best of seven with the 2-2-1-1-1 venue pattern until a team gets to four wins
    nyk_wins = sas_wins = 0
    for game_index in range(7):
        sas_home = SAS_HOME_BY_GAME[game_index]
        p_nyk = p_nyk_away if sas_home else p_nyk_home
        if random.random() < p_nyk:
            nyk_wins += 1
        else:
            sas_wins += 1
        if nyk_wins == 4 or sas_wins == 4:
            break
    return nyk_wins, sas_wins


def player_projections(alloc, defenders, injured_names):
    # produce a projected finals stat line for each available player, scaled by their allocated minutes and softened when a healthy defender is assigned to them
    projections = []
    for p, minutes in alloc:
        min_scale = minutes / p["min"] if p["min"] else 0.0
        d_strength = defender_strength(matchup_defender(p["name"], defenders, injured_names))
        pts = p["pts"] * min_scale * (1.0 - MATCHUP_PTS_SENS * d_strength)
        reb = p["reb"] * min_scale
        ast = p["ast"] * min_scale
        projections.append({
            "name": p["name"], "pos": p["pos"], "headshot": p["headshot"],
            "minutes": round(minutes, 1),
            "pts": round(max(0.0, pts), 1),
            "reb": round(max(0.0, reb), 1),
            "ast": round(max(0.0, ast), 1),
        })
    return projections


def predict(team_stats, players, model, defenders, base, injured, minutes_overrides):
    # run the full layered model for one configuration of injuries and minutes
    nyk_alloc, nyk_rep = allocate_minutes(team_pool(players["NYK"], injured, minutes_overrides), base["NYK"]["starter_target"])
    sas_alloc, sas_rep = allocate_minutes(team_pool(players["SAS"], injured, minutes_overrides), base["SAS"]["starter_target"])

    nyk_off, nyk_reb = team_indices(nyk_alloc, nyk_rep, defenders, injured)
    sas_off, sas_reb = team_indices(sas_alloc, sas_rep, defenders, injured)

    nyk_factors = effective_four_factors(
        team_stats["NYK"], nyk_off, nyk_reb, base["NYK"]["offense_index"], base["NYK"]["reb_index"])
    sas_factors = effective_four_factors(
        team_stats["SAS"], sas_off, sas_reb, base["SAS"]["offense_index"], base["SAS"]["reb_index"])

    p_nyk_home = nyk_game_probability(nyk_factors, sas_factors, model, True)
    p_nyk_away = nyk_game_probability(nyk_factors, sas_factors, model, False)

    nyk_series_wins = 0
    series_length_counts = {4: 0, 5: 0, 6: 0, 7: 0}
    for _ in range(NUM_SIMULATIONS):
        nyk_w, sas_w = simulate_series(p_nyk_home, p_nyk_away)
        if nyk_w == 4:
            nyk_series_wins += 1
        series_length_counts[nyk_w + sas_w] += 1

    nyk_pct = nyk_series_wins / NUM_SIMULATIONS * 100
    return {
        "series": {"NYK": round(nyk_pct, 1), "SAS": round(100 - nyk_pct, 1)},
        "per_game": {
            "nyk_home": round(p_nyk_home * 100, 1),
            "nyk_away": round(p_nyk_away * 100, 1),
        },
        "series_length": {
            str(length): round(series_length_counts[length] / NUM_SIMULATIONS * 100, 1)
            for length in (4, 5, 6, 7)
        },
        "effective_factors": {
            "NYK": {k: round(v, 4) for k, v in nyk_factors.items()},
            "SAS": {k: round(v, 4) for k, v in sas_factors.items()},
        },
        "projections": {
            "NYK": player_projections(nyk_alloc, defenders, injured),
            "SAS": player_projections(sas_alloc, defenders, injured),
        },
    }


def compute_base(players, defenders):
    # the default lineup baseline. computing the indices here means the default reproduces each team's real season four factors exactly, and every change is measured against this point.
    base = {}
    for key in ("NYK", "SAS"):
        starters = players[key]["starters"]
        starter_target = sum(p["min"] for p in starters)
        injured_default = set(players[key].get("injured", []))
        alloc, rep = allocate_minutes(team_pool(players[key], injured_default, {}), starter_target)
        off, reb = team_indices(alloc, rep, defenders, injured_default)
        base[key] = {"starter_target": starter_target, "offense_index": off, "reb_index": reb}
    return base


def main():
    with open(TEAM_STATS_PATH, "r", encoding="utf-8") as f:
        team_stats = json.load(f)
    with open(PLAYERS_PATH, "r", encoding="utf-8") as f:
        players = json.load(f)

    # train the model on demand if it has not been built yet
    if not os.path.exists(MODEL_PATH):
        from train_four_factor_model import train
        train()
    with open(MODEL_PATH, "r", encoding="utf-8") as f:
        model = json.load(f)

    defenders = build_matchup_map(players)
    base = compute_base(players, defenders)

    # the default configuration: mitchell robinson injured, everyone else at their season minutes
    default_injured = set(players["NYK"].get("injured", [])) | set(players["SAS"].get("injured", []))
    baseline = predict(team_stats, players, model, defenders, base, default_injured, {})

    result = {
        "engine": "Four Factor Player-Impact Model",
        "simulations": NUM_SIMULATIONS,
        "model": model,
        "schedule": SAS_HOME_BY_GAME,
        "constants": {
            "league_avg_drtg": LEAGUE_AVG_DRTG,
            "rep_ts": REP_TS, "rep_usg": REP_USG, "rep_reb_rate": REP_REB_RATE,
            "usage_base": USAGE_BASE, "usage_bonus": USAGE_BONUS,
            "efg_sens": EFG_SENS, "oreb_sens": OREB_SENS,
            "matchup_ts_sens": MATCHUP_TS_SENS, "matchup_pts_sens": MATCHUP_PTS_SENS,
        },
        "base": {k: {kk: round(vv, 4) for kk, vv in v.items()} for k, v in base.items()},
        "team_stats": {k: team_stats[k] for k in ("NYK", "SAS")},
        "players": players,
        "default_injured": sorted(default_injured),
        "baseline": baseline,
    }

    os.makedirs(PROCESSED, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print("2026 NBA Finals: Four Factor Player-Impact Model")
    print("-" * 55)
    print("Layer 5 training accuracy:", model["train_accuracy"])
    print()
    print("Default lineup (Mitchell Robinson injured):")
    print("  Knicks win series:", baseline["series"]["NYK"], "%")
    print("  Spurs win series: ", baseline["series"]["SAS"], "%")
    print()
    print("Projected scoring (default lineup):")
    for key in ("NYK", "SAS"):
        line = ", ".join(pr["name"].split()[-1] + " " + str(pr["pts"]) for pr in baseline["projections"][key][:5])
        print("  " + key + ":", line)
    print()

    # a quick what-if to confirm the injury lever moves the prediction
    no_wemba = predict(team_stats, players, model, defenders, base,
                       default_injured | {"Victor Wembanyama"}, {})
    print("What if Victor Wembanyama is injured:")
    print("  Knicks win series:", no_wemba["series"]["NYK"], "% (was", str(baseline["series"]["NYK"]) + "%)")
    print()
    print("wrote", OUTPUT_PATH)


if __name__ == "__main__":
    main()
