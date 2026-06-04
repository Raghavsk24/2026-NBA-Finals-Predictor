import os
import json
import time

# This script collects the 2025-26 data the three engines need from the nba_api.
# stats.nba.com is rate limited and sometimes times out, so every call is wrapped in a
# retry helper and cached to data/raw. if a call still fails we fall back to curated values
# so the rest of the pipeline always has something to work with.

from nba_api.stats.endpoints import (
    leaguedashteamstats,
    leaguegamelog,
    teamgamelogs,
    commonteamroster,
    leaguedashplayerstats,
)

SEASON = "2025-26"
NYK_ID = 1610612752
SAS_ID = 1610612759

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(HERE, "raw")
PROCESSED_DIR = os.path.join(HERE, "processed")
DASHBOARD_DATA_DIR = os.path.join(os.path.dirname(HERE), "dashboard", "public", "data")

# the five starters the user pinned, with the positional matchup that drives engine 3.
# player ids are filled in from the live roster when available, these are the fallbacks.
NYK_STARTERS = [
    {"name": "Jalen Brunson", "pos": "PG", "id": 1628973},
    {"name": "Mikal Bridges", "pos": "SG", "id": 1628969},
    {"name": "Josh Hart", "pos": "SF", "id": 1628404},
    {"name": "OG Anunoby", "pos": "PF", "id": 1628384},
    {"name": "Karl-Anthony Towns", "pos": "C", "id": 1626157},
]
SAS_STARTERS = [
    {"name": "De'Aaron Fox", "pos": "PG", "id": 1628368},
    {"name": "Stephon Castle", "pos": "SG", "id": 1641411},
    {"name": "Julian Champagnie", "pos": "SF", "id": 1630577},
    {"name": "Harrison Barnes", "pos": "PF", "id": 203084},
    {"name": "Victor Wembanyama", "pos": "C", "id": 1641705},
]

# mitchell robinson is injured, so engine 3 leaves him out of the player efficiency layer.
# we still carry him on the roster so the dashboard can let users toggle him back healthy.
INJURED_DEFAULT = ["Mitchell Robinson"]
NYK_BENCH = [
    {"name": "Mitchell Robinson", "pos": "C", "id": 1629011,
     "fallback": {"min": 27.0, "pts": 6.0, "reb": 9.0, "ast": 1.0, "ts": 0.620, "usg": 0.120,
                  "stl": 0.7, "blk": 1.2, "drtg": 108.0, "dreb_pct": 0.230}},
]


def retry_fetch(name, build_endpoint, retries=4, base_timeout=45):
    # try one nba_api endpoint a few times, caching the raw rows to disk on success.
    # returns a list of row dicts, or None if every attempt failed.
    cache_path = os.path.join(RAW_DIR, name + ".json")
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            print("  cached", name)
            return json.load(f)

    for attempt in range(1, retries + 1):
        try:
            endpoint = build_endpoint(base_timeout + attempt * 10)
            df = endpoint.get_data_frames()[0]
            rows = json.loads(df.to_json(orient="records"))
            os.makedirs(RAW_DIR, exist_ok=True)
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(rows, f)
            print("  fetched", name, "(" + str(len(rows)) + " rows)")
            time.sleep(1.5)
            return rows
        except Exception as exc:
            print("  attempt", attempt, "failed for", name, ":", type(exc).__name__)
            time.sleep(3 * attempt)
    print("  giving up on", name, "- will use fallback")
    return None


def row_for_team(rows, team_id):
    # find a single team's row in a league wide table
    if not rows:
        return None
    for r in rows:
        if r.get("TEAM_ID") == team_id:
            return r
    return None


def collect_team_stats():
    # offensive rating, defensive rating, pace and the four factors for both finals teams
    adv = retry_fetch(
        "team_advanced",
        lambda t: leaguedashteamstats.LeagueDashTeamStats(
            season=SEASON, measure_type_detailed_defense="Advanced", timeout=t
        ),
    )
    four = retry_fetch(
        "team_four_factors",
        lambda t: leaguedashteamstats.LeagueDashTeamStats(
            season=SEASON, measure_type_detailed_defense="Four Factors", timeout=t
        ),
    )

    # curated fallback values used only if a call could not be completed
    fallback = {
        "NYK": {"name": "New York Knicks", "ortg": 118.7, "drtg": 112.3, "pace": 97.71,
                "efg": 0.547, "tov": 0.123, "oreb": 0.272, "ftr": 0.196,
                "opp_efg": 0.523, "opp_tov": 0.121, "opp_oreb": 0.276, "opp_ftr": 0.188},
        "SAS": {"name": "San Antonio Spurs", "ortg": 118.7, "drtg": 110.4, "pace": 100.72,
                "efg": 0.552, "tov": 0.131, "oreb": 0.268, "ftr": 0.205,
                "opp_efg": 0.515, "opp_tov": 0.133, "opp_oreb": 0.271, "opp_ftr": 0.182},
        "league_avg_drtg": 114.73,
    }

    out = {"league_avg_drtg": fallback["league_avg_drtg"]}
    if adv:
        out["league_avg_drtg"] = round(sum(r["DEF_RATING"] for r in adv) / len(adv), 2)

    for key, team_id, name in (("NYK", NYK_ID, "New York Knicks"), ("SAS", SAS_ID, "San Antonio Spurs")):
        team = dict(fallback[key])
        a = row_for_team(adv, team_id)
        if a:
            team["ortg"] = round(a["OFF_RATING"], 1)
            team["drtg"] = round(a["DEF_RATING"], 1)
            team["pace"] = round(a["PACE"], 2)
            team["wins"] = a.get("W")
            team["losses"] = a.get("L")
        f = row_for_team(four, team_id)
        if f:
            team["efg"] = round(f["EFG_PCT"], 3)
            team["tov"] = round(f["TM_TOV_PCT"], 3)
            team["oreb"] = round(f["OREB_PCT"], 3)
            team["ftr"] = round(f["FTA_RATE"], 3)
            team["opp_efg"] = round(f["OPP_EFG_PCT"], 3)
            team["opp_tov"] = round(f["OPP_TOV_PCT"], 3)
            team["opp_oreb"] = round(f["OPP_OREB_PCT"], 3)
            team["opp_ftr"] = round(f["OPP_FTA_RATE"], 3)
        out[key] = team
    return out


def collect_games():
    # every team's game log for the season, used to build elo and to train the logistic model
    rows = retry_fetch(
        "league_game_log",
        lambda t: leaguegamelog.LeagueGameLog(season=SEASON, timeout=t),
    )
    if not rows:
        return None

    # each game appears twice (one row per team). pair them up by game id into a single record
    by_game = {}
    for r in rows:
        gid = r["GAME_ID"]
        by_game.setdefault(gid, []).append(r)

    games = []
    for gid, pair in by_game.items():
        if len(pair) != 2:
            continue
        # the home team is the one whose matchup string uses "vs."
        home = next((p for p in pair if "vs." in p["MATCHUP"]), pair[0])
        away = pair[1] if home is pair[0] else pair[0]
        games.append({
            "game_id": gid,
            "date": home["GAME_DATE"],
            "home_id": home["TEAM_ID"],
            "home_abbr": home["TEAM_ABBREVIATION"],
            "home_pts": home["PTS"],
            "away_id": away["TEAM_ID"],
            "away_abbr": away["TEAM_ABBREVIATION"],
            "away_pts": away["PTS"],
            "home_win": 1 if home["WL"] == "W" else 0,
        })
    games.sort(key=lambda g: g["date"])
    return games


def collect_four_factor_games():
    # per game four factors for every team, the feature source for the logistic regression
    rows = retry_fetch(
        "team_game_four_factors",
        lambda t: teamgamelogs.TeamGameLogs(
            season_nullable=SEASON, measure_type_player_game_logs_nullable="Four Factors", timeout=t
        ),
    )
    return rows


def collect_finals_games():
    # the finals games between the knicks and the spurs that have already been played. we pull the
    # postseason log and keep only the games where both finals teams appear, which leaves the finals
    rows = retry_fetch(
        "finals_game_log",
        lambda t: leaguegamelog.LeagueGameLog(
            season=SEASON, season_type_all_star="Playoffs", timeout=t
        ),
    )
    if not rows:
        return []

    by_game = {}
    for r in rows:
        if r.get("TEAM_ID") in (NYK_ID, SAS_ID):
            by_game.setdefault(r["GAME_ID"], []).append(r)

    finals = []
    for gid, pair in by_game.items():
        if len(pair) != 2:
            continue
        home = next((p for p in pair if "vs." in p["MATCHUP"]), pair[0])
        away = pair[1] if home is pair[0] else pair[0]
        finals.append({
            "game_id": gid,
            "date": home["GAME_DATE"],
            "home_id": home["TEAM_ID"],
            "home_abbr": home["TEAM_ABBREVIATION"],
            "home_pts": home["PTS"],
            "away_id": away["TEAM_ID"],
            "away_abbr": away["TEAM_ABBREVIATION"],
            "away_pts": away["PTS"],
            "home_win": 1 if home["WL"] == "W" else 0,
        })
    finals.sort(key=lambda g: g["date"])
    return finals


def build_series(finals):
    # turn the played finals games into the current series standing plus a small display record
    nyk_wins = sas_wins = 0
    display = []
    for i, g in enumerate(finals):
        nyk_pts = g["home_pts"] if g["home_id"] == NYK_ID else g["away_pts"]
        sas_pts = g["home_pts"] if g["home_id"] == SAS_ID else g["away_pts"]
        winner = "NYK" if nyk_pts > sas_pts else "SAS"
        if winner == "NYK":
            nyk_wins += 1
        else:
            sas_wins += 1
        display.append({
            "game": i + 1,
            "home": "SAS" if g["home_id"] == SAS_ID else "NYK",
            "nyk": nyk_pts,
            "sas": sas_pts,
            "winner": winner,
        })
    return {
        "nyk_wins": nyk_wins,
        "sas_wins": sas_wins,
        "games_played": len(finals),
        "next_game_index": len(finals),
        "games": finals,
        "display": display,
    }


def collect_roster(team_id, label):
    # the active roster for a team so we have real player ids for headshots
    rows = retry_fetch(
        "roster_" + label,
        lambda t: commonteamroster.CommonTeamRoster(team_id=team_id, season=SEASON, timeout=t),
    )
    return rows


def collect_player_stats():
    # per game scoring lines plus advanced efficiency for every player in the league
    base = retry_fetch(
        "player_base",
        lambda t: leaguedashplayerstats.LeagueDashPlayerStats(
            season=SEASON, per_mode_detailed="PerGame", measure_type_detailed_defense="Base", timeout=t
        ),
    )
    adv = retry_fetch(
        "player_advanced",
        lambda t: leaguedashplayerstats.LeagueDashPlayerStats(
            season=SEASON, per_mode_detailed="PerGame", measure_type_detailed_defense="Advanced", timeout=t
        ),
    )
    return base, adv


def build_player(name, pos, fallback_id, base, adv, roster_rows, fallback_line=None, injured=False):
    # assemble one player's projection record from the live tables, falling back as needed
    player_id = fallback_id
    if roster_rows:
        match = next((r for r in roster_rows if r.get("PLAYER") == name), None)
        if match:
            player_id = match.get("PLAYER_ID", fallback_id)

    record = {
        "name": name,
        "pos": pos,
        "id": player_id,
        "injured": injured,
        "headshot": "https://cdn.nba.com/headshots/nba/latest/1040x760/" + str(player_id) + ".png",
        # curated baseline lines, replaced below when the live tables are present.
        # ts and usg drive the offense, drtg/stl/blk drive the defensive matchup layer.
        "min": 32.0, "pts": 15.0, "reb": 5.0, "ast": 4.0, "ts": 0.560, "usg": 0.220,
        "stl": 0.8, "blk": 0.5, "drtg": 114.0, "dreb_pct": 0.150,
        # the player's own four factors, used by the per player efficiency chart in the dashboard
        "efg": 0.520, "tov": 0.130, "oreb": 0.040, "ftr": 0.250,
    }
    # a curated line lets us carry an injured player who has no usable season stats
    if fallback_line:
        record.update(fallback_line)

    b = None
    if base:
        b = next((r for r in base if r.get("PLAYER_ID") == player_id), None)
    if b:
        record["min"] = round(b.get("MIN", record["min"]), 1)
        record["pts"] = round(b.get("PTS", record["pts"]), 1)
        record["reb"] = round(b.get("REB", record["reb"]), 1)
        record["ast"] = round(b.get("AST", record["ast"]), 1)
        record["stl"] = round(b.get("STL", record["stl"]), 2)
        record["blk"] = round(b.get("BLK", record["blk"]), 2)
        # free throw rate is free throw attempts over field goal attempts, and turnover rate is
        # turnovers over the player's estimated possessions used, both kept as clean fractions
        if b.get("FGA"):
            record["ftr"] = round(b["FTA"] / b["FGA"], 3)
            possessions = b["FGA"] + 0.44 * b.get("FTA", 0) + b.get("TOV", 0)
            if possessions:
                record["tov"] = round(b.get("TOV", 0) / possessions, 3)

    a = None
    if adv:
        a = next((r for r in adv if r.get("PLAYER_ID") == player_id), None)
    if a:
        record["ts"] = round(a.get("TS_PCT", record["ts"]), 3)
        record["usg"] = round(a.get("USG_PCT", record["usg"]), 3)
        record["drtg"] = round(a.get("DEF_RATING", record["drtg"]), 1)
        record["dreb_pct"] = round(a.get("DREB_PCT", record["dreb_pct"]), 3)
        record["efg"] = round(a.get("EFG_PCT", record["efg"]), 3)
        record["oreb"] = round(a.get("OREB_PCT", record["oreb"]), 3)
    return record


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    print("collecting team stats...")
    team_stats = collect_team_stats()

    print("collecting season games...")
    games = collect_games()

    print("collecting per game four factors...")
    four_factor_games = collect_four_factor_games()

    print("collecting finals games played so far...")
    series = build_series(collect_finals_games())

    print("collecting rosters...")
    nyk_roster = collect_roster(NYK_ID, "nyk")
    sas_roster = collect_roster(SAS_ID, "sas")

    print("collecting player stats...")
    base, adv = collect_player_stats()

    nyk_players = [build_player(p["name"], p["pos"], p["id"], base, adv, nyk_roster) for p in NYK_STARTERS]
    sas_players = [build_player(p["name"], p["pos"], p["id"], base, adv, sas_roster) for p in SAS_STARTERS]

    # the knicks bench carries mitchell robinson, injured by default but toggleable
    nyk_bench = [
        build_player(p["name"], p["pos"], p["id"], base, adv, nyk_roster,
                     fallback_line=p.get("fallback"), injured=True)
        for p in NYK_BENCH
    ]

    # the five head to head matchups engine 3 adjusts each player against
    matchups = [
        {"pos": nyk["pos"], "nyk": nyk["name"], "sas": sas["name"]}
        for nyk, sas in zip(nyk_players, sas_players)
    ]

    players = {
        "NYK": {
            "name": "New York Knicks", "abbr": "NYK", "id": NYK_ID,
            "logo": "https://cdn.nba.com/logos/nba/" + str(NYK_ID) + "/global/L/logo.svg",
            "color": "#F58426", "starters": nyk_players, "bench": nyk_bench,
            "injured": INJURED_DEFAULT,
        },
        "SAS": {
            "name": "San Antonio Spurs", "abbr": "SAS", "id": SAS_ID,
            "logo": "https://cdn.nba.com/logos/nba/" + str(SAS_ID) + "/global/L/logo.svg",
            "color": "#A1A1A4", "starters": sas_players, "bench": [], "injured": [],
        },
        "matchups": matchups,
    }

    # write the processed files the engines and dashboard read
    write_json(os.path.join(PROCESSED_DIR, "team_stats.json"), team_stats)
    write_json(os.path.join(PROCESSED_DIR, "players.json"), players)
    if games:
        write_json(os.path.join(PROCESSED_DIR, "games.json"), games)
    if four_factor_games:
        write_json(os.path.join(PROCESSED_DIR, "four_factor_games.json"), four_factor_games)
    write_json(os.path.join(PROCESSED_DIR, "series.json"), series)

    print()
    print("done. team_stats and players are ready in", PROCESSED_DIR)
    if not games:
        print("warning: season games missing, elo and training will use a fallback")


def write_json(path, payload):
    # small helper so every file is written the same way
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print("  wrote", os.path.basename(path))


if __name__ == "__main__":
    main()
