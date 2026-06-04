import random
import json
import os
from statistics import NormalDist, mean, stdev

""" This is engine 1: the pace-adjusted efficiency model. It is the simplest of the three predictors. 
It uses only each team's offensive rating, defensive rating and pacing to predict the each team's probability
of winning the 2026 NBA Finals after running 10,000 monte carlo simulations."""

# Writes path to team stats and output json files
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEAM_STATS_PATH = os.path.join(ROOT, "data", "processed", "team_stats.json")
GAMES_PATH = os.path.join(ROOT, "data", "processed", "games.json")
OUTPUT_PATH = os.path.join(ROOT, "data", "processed", "engine1.json")
SERIES_PATH = os.path.join(ROOT, "data", "processed", "series.json")

# team ids used to pull these two teams' games out of the scraped season log
NYK_ID = 1610612752
SAS_ID = 1610612759

# 2026 regular season stats: offensive rating, defensive rating, pace
NYK = {"name": "New York Knicks", "ortg": 118.7, "drtg": 112.3, "pace": 97.71}
SAS = {"name": "San Antonio Spurs", "ortg": 118.7, "drtg": 110.4, "pace": 100.72}

# Mean defensive rating across all 30 teams calculated by hand from the scraped stats
LEAGUE_AVG_DRTG = 114.73

# Model constants
HOME_COURT_POINTS = 3.0 # The boost in points we give to the home team in each game, based on historical home court advantage
NUM_SIMULATIONS = 10000

# Series venue by game: Games 1, 2, 5, 7 in San Antonio; Games 3, 4, 6 in New York
SAS_HOME_BY_GAME = [True, True, False, False, True, False, True]


def load_team_stats():
    # pull the real scraped ortg, drtg and pace into NYK and SAS if collection has run
    global LEAGUE_AVG_DRTG
    if not os.path.exists(TEAM_STATS_PATH):
        return
    with open(TEAM_STATS_PATH, "r", encoding="utf-8") as f:
        stats = json.load(f)
    for key, team in (("NYK", NYK), ("SAS", SAS)):
        if key in stats:
            team["ortg"] = stats[key]["ortg"]
            team["drtg"] = stats[key]["drtg"]
            team["pace"] = stats[key]["pace"]
    if "league_avg_drtg" in stats:
        LEAGUE_AVG_DRTG = stats["league_avg_drtg"]


def load_margin_sd():
    # compute Knicks and Spurs game margin standard deviation from the scraped game results
    global GAME_MARGIN_SD
    if not os.path.exists(GAMES_PATH):
        return
    with open(GAMES_PATH, "r", encoding="utf-8") as f:
        games = json.load(f)

    def team_margins(team_id):
        # the point margin from this team's point of view in every game it played
        margins = []
        for g in games:
            if g["home_id"] == team_id:
                margins.append(g["home_pts"] - g["away_pts"])
            elif g["away_id"] == team_id:
                margins.append(g["away_pts"] - g["home_pts"])
        return margins

    nyk_margins = team_margins(NYK_ID)
    sas_margins = team_margins(SAS_ID)
    if len(nyk_margins) < 2 or len(sas_margins) < 2:
        return

    nyk_mean = mean(nyk_margins)
    sas_mean = mean(sas_margins)
    residuals = [m - nyk_mean for m in nyk_margins] + [m - sas_mean for m in sas_margins]
    GAME_MARGIN_SD = round(stdev(residuals), 2)


def expected_pace(team_a, team_b):
    # Average the two teams' season pace
    return (team_a["pace"] + team_b["pace"]) / 2


def adjusted_ortg(team, opponent):
    # Adjusts a team's offense by how good the opponent's defense is versus league average
    return team["ortg"] + (opponent["drtg"] - LEAGUE_AVG_DRTG)


def expected_points(team, opponent, pace):
    # Convert efficiency and pace into a predicted point total
    return (adjusted_ortg(team, opponent) / 100) * pace


def nyk_win_probability(nyk_home):
    # Predict one game and return the probability the Knicks win it
    pace = expected_pace(NYK, SAS)
    nyk_pts = expected_points(NYK, SAS, pace)
    sas_pts = expected_points(SAS, NYK, pace)
    if nyk_home:
        nyk_pts += HOME_COURT_POINTS
    else:
        sas_pts += HOME_COURT_POINTS
    margin = nyk_pts - sas_pts
    return NormalDist(0, GAME_MARGIN_SD).cdf(margin)


def load_series():
    # the finals games already played, with the current standing and the next game to play
    if os.path.exists(SERIES_PATH):
        with open(SERIES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"nyk_wins": 0, "sas_wins": 0, "next_game_index": 0}


def simulate_series(p_nyk_home, p_nyk_away, start_nyk=0, start_sas=0, start_game=0):
    # play out the rest of the series from the current standing until one team reaches 4 wins
    nyk_wins = start_nyk
    sas_wins = start_sas
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


def run_simulation():
    # run the whole model and return a dictionary of every result we want to show
    pace = expected_pace(NYK, SAS)
    nyk_pts = expected_points(NYK, SAS, pace)
    sas_pts = expected_points(SAS, NYK, pace)

    # Per-game win probabilities computed once, since the matchup is fixed
    p_nyk_home = nyk_win_probability(nyk_home=True)
    p_nyk_away = nyk_win_probability(nyk_home=False)

    # start the series from the current finals standing
    series = load_series()
    start_nyk = series.get("nyk_wins", 0)
    start_sas = series.get("sas_wins", 0)
    start_game = series.get("next_game_index", 0)

    # Run the Monte Carlo Simulations
    nyk_series_wins = 0
    series_length_counts = {4: 0, 5: 0, 6: 0, 7: 0}
    for _ in range(NUM_SIMULATIONS):
        nyk_w, sas_w = simulate_series(p_nyk_home, p_nyk_away, start_nyk, start_sas, start_game)
        if nyk_w == 4:
            nyk_series_wins += 1
        series_length_counts[nyk_w + sas_w] += 1

    nyk_pct = nyk_series_wins / NUM_SIMULATIONS * 100
    sas_pct = 100 - nyk_pct

    return {
        "engine": "Pace-Adjusted Efficiency Model",
        "simulations": NUM_SIMULATIONS,
        "expected_pace": round(pace, 2),
        "expected_score": {"NYK": round(nyk_pts, 1), "SAS": round(sas_pts, 1)},
        "per_game": {
            "nyk_home": round(p_nyk_home * 100, 1),
            "nyk_away": round(p_nyk_away * 100, 1),
            "sas_home": round((1 - p_nyk_away) * 100, 1),
            "sas_away": round((1 - p_nyk_home) * 100, 1),
        },
        "series": {"NYK": round(nyk_pct, 1), "SAS": round(sas_pct, 1)},
        "series_length": {
            str(length): round(series_length_counts[length] / NUM_SIMULATIONS * 100, 1)
            for length in (4, 5, 6, 7)
        },
        "inputs": {"NYK": dict(NYK), "SAS": dict(SAS), "league_avg_drtg": LEAGUE_AVG_DRTG,
                   "game_margin_sd": GAME_MARGIN_SD},
    }


def main():
    load_team_stats()
    load_margin_sd()
    result = run_simulation()

    print("2026 NBA Finals: New York Knicks vs San Antonio Spurs")
    print("-" * 55)
    print("Expected pace:", result["expected_pace"], "possessions")
    print("Game margin standard deviation:", GAME_MARGIN_SD, "points")
    print("Neutral-stadium expected score:")
    print("  Knicks", result["expected_score"]["NYK"], "  Spurs", result["expected_score"]["SAS"])
    print()
    # Knicks win probability
    print("Per-game Knicks win probability:")
    print("  Knicks at home:", result["per_game"]["nyk_home"], "%")
    print("  Knicks on road:", result["per_game"]["nyk_away"], "%")
    print()
    # Spurs win probability
    print("Per-game Spurs win probability:")
    print("  Spurs at home:", result["per_game"]["sas_home"], "%")
    print("  Spurs on road:", result["per_game"]["sas_away"], "%")
    print()
    # Series prediction win probability
    print("Series prediction over", NUM_SIMULATIONS, "simulations:")
    print("  Knicks win series:", result["series"]["NYK"], "%")
    print("  Spurs win series: ", result["series"]["SAS"], "%")
    print()
    # Series length distribution probability
    print("Series length distribution:")
    for length in ("4", "5", "6", "7"):
        print("  ", length, "games:", result["series_length"][length], "%")

    # write the results out so the dashboard can read them
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print()
    print("wrote", OUTPUT_PATH)


if __name__ == "__main__":
    main()
