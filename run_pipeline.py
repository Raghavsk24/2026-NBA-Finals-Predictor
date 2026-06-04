"""Run the whole data and modeling pipeline in one command. It scrapes the latest data, trains and
runs the three prediction engines, then copies the json the dashboard reads into dashboard/data.
This replaces the manual copy step so the dashboard always reflects the engine outputs.

Usage: python run_pipeline.py
"""

import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PROCESSED = os.path.join(ROOT, "data", "processed")
DASHBOARD_DATA = os.path.join(ROOT, "dashboard", "data")

# the scripts to run in order, each in its own process so the engines/ directory stays on the
# import path exactly as it does when a script is run directly
STEPS = [
    os.path.join("data", "collect_data.py"),
    os.path.join("engines", "train_four_factor_model.py"),
    os.path.join("engines", "pace_adjusted_efficiency_model.py"),
    os.path.join("engines", "elo_power_rating_model.py"),
    os.path.join("engines", "four_factor_player_impact_model.py"),
]

# the processed files the dashboard imports at build time
DASHBOARD_FILES = ["engine1.json", "engine2.json", "engine3.json", "players.json", "series.json"]


def run_step(script):
    # run one pipeline script and stop the pipeline if it fails
    print("running", script)
    subprocess.run([sys.executable, os.path.join(ROOT, script)], check=True)


def sync_dashboard():
    # copy the processed json the dashboard imports into dashboard/data
    os.makedirs(DASHBOARD_DATA, exist_ok=True)
    for name in DASHBOARD_FILES:
        source = os.path.join(PROCESSED, name)
        if os.path.exists(source):
            shutil.copy2(source, os.path.join(DASHBOARD_DATA, name))
            print("synced", name)


def main():
    for script in STEPS:
        run_step(script)
    sync_dashboard()
    print("pipeline complete")


if __name__ == "__main__":
    main()
