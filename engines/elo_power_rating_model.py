import os
import json
import random
import math

""" This is engine 2: the elo power rating model. It rates every team with an elo system built game by game
across the 2025-26 season. It then combines that with each finals team's pythagorean expectation (an estimate of
how many games a team "should win" based on their offesive and defensive ratings) to predict each team's probability
of winning the series after running 10,000 monte carlo simulations.The elo system is a better metric than engine 1 
becuase it rewards beating good teams with higher power ratings and it adjusts for margin of victory."""

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROCESSED = os.path.join(ROOT, "data", "processed")
GAMES_PATH = os.path.join(PROCESSED, "games.json")
TEAM_STATS_PATH = os.path.join(PROCESSED, "team_stats.json")
OUTPUT_PATH = os.path.join(PROCESSED, "engine2.json")
SERIES_PATH = os.path.join(PROCESSED, "series.json")

NYK_ID = 1610612752
SAS_ID = 1610612759

# elo settings: standard starting rating, a k factor and a home court bump in elo points
ELO_START = 1500.0
K_FACTOR = 20.0
ELO_HOME_ADVANTAGE = 100.0

# pythagorean exponent for basketball (hollinger's classic value)
PYTHAGOREAN_EXP = 16.5
PYTH_HOME_BUMP = 0.035

# how much we trust elo versus pythagorean when blending the per-game probability
BLEND_ELO = 0.6
BLEND_PYTH = 0.4

NUM_SIMULATIONS = 10000

# Series venue by game: Games 1, 2, 5, 7 in San Antonio; Games 3, 4, 6 in New York
SAS_HOME_BY_GAME = [True, True, False, False, True, False, True]


def win_expectancy(team_elo, opp_elo):
    # the classic elo formula for the chance the first team beats the second
    return 1.0 / (1.0 + 10 ** ((opp_elo - team_elo) / 400.0))


def mov_multiplier(point_margin, elo_diff_winner):
    # margin of victory multiplier so blowouts move the rating more than close games. second term dampens the effect when a strong favorite was already expected to win.
    return math.log(abs(point_margin) + 1.0) * (2.2 / (elo_diff_winner * 0.001 + 2.2))


def build_elo(games):
    # walk the whole season in date order and update every team's elo after each game.
    elo = {}
    nyk_traj = []
    sas_traj = []

    for g in games:
        home, away = g["home_id"], g["away_id"]
        elo.setdefault(home, ELO_START)
        elo.setdefault(away, ELO_START)

        # expected result for the home team, including its home court bump
        exp_home = win_expectancy(elo[home] + ELO_HOME_ADVANTAGE, elo[away])
        result_home = g["home_win"]

        margin = g["home_pts"] - g["away_pts"]
        if result_home == 1:
            elo_diff_winner = (elo[home] + ELO_HOME_ADVANTAGE) - elo[away]
        else:
            elo_diff_winner = elo[away] - (elo[home] + ELO_HOME_ADVANTAGE)
        mult = mov_multiplier(margin, elo_diff_winner)

        change = K_FACTOR * mult * (result_home - exp_home)
        elo[home] += change
        elo[away] -= change

        if home == NYK_ID or away == NYK_ID:
            nyk_traj.append(round(elo[NYK_ID], 1))
        if home == SAS_ID or away == SAS_ID:
            sas_traj.append(round(elo[SAS_ID], 1))

    return elo, nyk_traj, sas_traj


def pythagorean(games):
    # season points for and against for each finals team, turned into an expected win rate
    totals = {NYK_ID: [0, 0], SAS_ID: [0, 0]}
    for g in games:
        for team_id, pf, pa in (
            (g["home_id"], g["home_pts"], g["away_pts"]),
            (g["away_id"], g["away_pts"], g["home_pts"]),
        ):
            if team_id in totals:
                totals[team_id][0] += pf
                totals[team_id][1] += pa

    out = {}
    for key, team_id in (("NYK", NYK_ID), ("SAS", SAS_ID)):
        pf, pa = totals[team_id]
        winpct = pf ** PYTHAGOREAN_EXP / (pf ** PYTHAGOREAN_EXP + pa ** PYTHAGOREAN_EXP)
        out[key] = {"pf": pf, "pa": pa, "winpct": round(winpct, 4)}
    return out


def log5(a, b):
    # bill james log5 turns two win rates into a head to head probability for team a
    denom = a + b - 2 * a * b
    if denom == 0:
        return 0.5
    return (a - a * b) / denom


def per_game_nyk_prob(nyk_home, nyk_elo, sas_elo, pyth):
    # blend the elo based probability with the pythagorean based probability for one game
    diff = nyk_elo - sas_elo + (ELO_HOME_ADVANTAGE if nyk_home else -ELO_HOME_ADVANTAGE)
    elo_p = 1.0 / (1.0 + 10 ** (-diff / 400.0))

    pyth_neutral = log5(pyth["NYK"]["winpct"], pyth["SAS"]["winpct"])
    pyth_p = pyth_neutral + (PYTH_HOME_BUMP if nyk_home else -PYTH_HOME_BUMP)
    pyth_p = min(0.99, max(0.01, pyth_p))

    return BLEND_ELO * elo_p + BLEND_PYTH * pyth_p


def load_series():
    # load the finals games already played, with the current standing and the next game to play
    if os.path.exists(SERIES_PATH):
        with open(SERIES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"nyk_wins": 0, "sas_wins": 0, "next_game_index": 0, "games": []}


def simulate_series(p_nyk_home, p_nyk_away, start_nyk=0, start_sas=0, start_game=0):
    # play out the rest of the best of seven from the current standing until a team reaches four wins
    nyk_wins, sas_wins = start_nyk, start_sas
    for game_index in range(start_game, 7):
        sas_home = SAS_HOME_BY_GAME[game_index]
        p_nyk = p_nyk_away if sas_home else p_nyk_home
        if random.random() < p_nyk:
            nyk_wins += 1
        else:
            sas_wins += 1
        if nyk_wins == 4 or sas_wins == 4:
            break
    return nyk_wins, sas_wins


def run():
    # load the season games, fall back to team stats if for some reason games are missing
    if os.path.exists(GAMES_PATH):
        with open(GAMES_PATH, "r", encoding="utf-8") as f:
            games = json.load(f)
    else:
        games = None

    with open(TEAM_STATS_PATH, "r", encoding="utf-8") as f:
        team_stats = json.load(f)

    # fold any finals games already played into the season so elo and pythagorean reflect them
    series = load_series()

    if games:
        games = games + series.get("games", [])
        elo, nyk_traj, sas_traj = build_elo(games)
        nyk_elo = round(elo[NYK_ID], 1)
        sas_elo = round(elo[SAS_ID], 1)
        pyth = pythagorean(games)
    else:
        # fallback: seed elo from net rating and pythagorean from a default win rate
        nyk_net = team_stats["NYK"]["ortg"] - team_stats["NYK"]["drtg"]
        sas_net = team_stats["SAS"]["ortg"] - team_stats["SAS"]["drtg"]
        nyk_elo = round(ELO_START + nyk_net * 25, 1)
        sas_elo = round(ELO_START + sas_net * 25, 1)
        nyk_traj, sas_traj = [nyk_elo], [sas_elo]
        pyth = {"NYK": {"pf": 0, "pa": 0, "winpct": 0.62},
                "SAS": {"pf": 0, "pa": 0, "winpct": 0.70}}

    p_nyk_home = per_game_nyk_prob(True, nyk_elo, sas_elo, pyth)
    p_nyk_away = per_game_nyk_prob(False, nyk_elo, sas_elo, pyth)

    start_nyk = series.get("nyk_wins", 0)
    start_sas = series.get("sas_wins", 0)
    start_game = series.get("next_game_index", 0)

    nyk_series_wins = 0
    series_length_counts = {4: 0, 5: 0, 6: 0, 7: 0}
    for _ in range(NUM_SIMULATIONS):
        nyk_w, sas_w = simulate_series(p_nyk_home, p_nyk_away, start_nyk, start_sas, start_game)
        if nyk_w == 4:
            nyk_series_wins += 1
        series_length_counts[nyk_w + sas_w] += 1

    nyk_pct = nyk_series_wins / NUM_SIMULATIONS * 100
    return {
        "engine": "Elo Power Rating Model",
        "simulations": NUM_SIMULATIONS,
        "series_state": {"nyk_wins": start_nyk, "sas_wins": start_sas},
        "elo": {"NYK": nyk_elo, "SAS": sas_elo, "start": ELO_START},
        "elo_trajectory": {"NYK": nyk_traj, "SAS": sas_traj},
        "pythagorean": pyth,
        "per_game": {
            "nyk_home": round(p_nyk_home * 100, 1),
            "nyk_away": round(p_nyk_away * 100, 1),
            "sas_home": round((1 - p_nyk_away) * 100, 1),
            "sas_away": round((1 - p_nyk_home) * 100, 1),
        },
        "series": {"NYK": round(nyk_pct, 1), "SAS": round(100 - nyk_pct, 1)},
        "series_length": {
            str(length): round(series_length_counts[length] / NUM_SIMULATIONS * 100, 1)
            for length in (4, 5, 6, 7)
        },
    }


def main():
    result = run()
    print("2026 NBA Finals: Elo Power Rating Model")
    print("-" * 55)
    print("Final season elo:")
    print("  Knicks", result["elo"]["NYK"], "  Spurs", result["elo"]["SAS"])
    print("Pythagorean win expectation:")
    print("  Knicks", round(result["pythagorean"]["NYK"]["winpct"] * 100, 1), "%",
          "  Spurs", round(result["pythagorean"]["SAS"]["winpct"] * 100, 1), "%")
    print()
    print("Series prediction over", NUM_SIMULATIONS, "simulations:")
    print("  Knicks win series:", result["series"]["NYK"], "%")
    print("  Spurs win series: ", result["series"]["SAS"], "%")
    print()
    print("Series length distribution:")
    for length in ("4", "5", "6", "7"):
        print("  ", length, "games:", result["series_length"][length], "%")

    os.makedirs(PROCESSED, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print()
    print("wrote", OUTPUT_PATH)


if __name__ == "__main__":
    main()
