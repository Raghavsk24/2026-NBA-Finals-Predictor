"""Shared helpers for the three prediction engines. The finals teams, the venue schedule, the
current series standing and the monte carlo that plays out the rest of the best of seven were
copied into every engine, so this module holds the single copy that each engine imports."""

import os
import json
import random

# the two finals teams and the number of series simulations every engine runs
NYK_ID = 1610612752
SAS_ID = 1610612759
NUM_SIMULATIONS = 10000

# Series venue by game: Games 1, 2, 5, 7 in San Antonio; Games 3, 4, 6 in New York
SAS_HOME_BY_GAME = [True, True, False, False, True, False, True]

# the processed data directory, resolved relative to this file so every engine agrees on it
PROCESSED = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "processed"
)


def processed_path(name):
    # absolute path to a file inside data/processed
    return os.path.join(PROCESSED, name)


def load_json(name, default=None):
    # read a processed json file, returning the default when it has not been generated yet
    path = processed_path(name)
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(name, payload):
    # write a processed json file, creating the directory if it does not exist
    os.makedirs(PROCESSED, exist_ok=True)
    with open(processed_path(name), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def load_series():
    # the finals games already played, with the current standing and the next game to play
    return load_json(
        "series.json", {"nyk_wins": 0, "sas_wins": 0, "next_game_index": 0, "games": []}
    )


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


def run_series_monte_carlo(p_nyk_home, p_nyk_away, series=None, num_simulations=NUM_SIMULATIONS):
    # run the monte carlo from the current standing and summarize the series odds and how long it lasts
    series = series or {}
    start_nyk = series.get("nyk_wins", 0)
    start_sas = series.get("sas_wins", 0)
    start_game = series.get("next_game_index", 0)

    nyk_series_wins = 0
    length_counts = {4: 0, 5: 0, 6: 0, 7: 0}
    for _ in range(num_simulations):
        nyk_w, sas_w = simulate_series(p_nyk_home, p_nyk_away, start_nyk, start_sas, start_game)
        if nyk_w == 4:
            nyk_series_wins += 1
        length_counts[nyk_w + sas_w] += 1

    nyk_pct = nyk_series_wins / num_simulations * 100
    return {
        "series": {"NYK": round(nyk_pct, 1), "SAS": round(100 - nyk_pct, 1)},
        "series_length": {
            str(length): round(length_counts[length] / num_simulations * 100, 1)
            for length in (4, 5, 6, 7)
        },
    }
