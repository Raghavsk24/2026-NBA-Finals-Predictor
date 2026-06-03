import os
import json
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

""" This trains the aggregation model that sits at layer 5 of engine 3. it learns, from every team game this 
season, how a team's four factor edge over its opponent maps to winning. we use an l2 regularized (ridge) binary 
logistic regression because it is accurate enough, stays interpretable, and its coefficients export cleanly so 
the browser can run the same math without a server."""

# Writes path to team stats, players, model and output json files
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROCESSED = os.path.join(ROOT, "data", "processed")
FF_GAMES_PATH = os.path.join(PROCESSED, "four_factor_games.json")
MODEL_PATH = os.path.join(PROCESSED, "engine3_model.json")

# the four factor edges plus a home flag are the features the model learns on
FEATURES = ["efg_diff", "tov_diff", "oreb_diff", "ftr_diff", "home"]


def build_dataset(rows):
    # turn each team game into one training example of four factor edges and a win/loss label
    X, y = [], []
    for r in rows:
        if r.get("WL") not in ("W", "L"):
            continue
        efg_diff = r["EFG_PCT"] - r["OPP_EFG_PCT"]
        # forcing more turnovers than you commit is good, so we flip the sign
        tov_diff = r["OPP_TOV_PCT"] - r["TM_TOV_PCT"]
        oreb_diff = r["OREB_PCT"] - r["OPP_OREB_PCT"]
        ftr_diff = r["FTA_RATE"] - r["OPP_FTA_RATE"]
        home = 1.0 if "vs." in r["MATCHUP"] else 0.0
        X.append([efg_diff, tov_diff, oreb_diff, ftr_diff, home])
        y.append(1 if r["WL"] == "W" else 0)
    return np.array(X), np.array(y)


def train():
    with open(FF_GAMES_PATH, "r", encoding="utf-8") as f:
        rows = json.load(f)

    X, y = build_dataset(rows)

    # standardize so the coefficients are comparable and the ridge penalty is fair
    scaler = StandardScaler().fit(X)
    Xs = scaler.transform(X)

    # lbfgs with the default penalty is l2 ridge regularization, the C term sets its strength
    model = LogisticRegression(solver="lbfgs", C=1.0, max_iter=1000)
    model.fit(Xs, y)

    accuracy = round(float(model.score(Xs, y)), 4)

    artifact = {
        "features": FEATURES,
        "coef": [round(float(c), 6) for c in model.coef_[0]],
        "intercept": round(float(model.intercept_[0]), 6),
        "scaler_mean": [round(float(m), 6) for m in scaler.mean_],
        "scaler_scale": [round(float(s), 6) for s in scaler.scale_],
        "train_accuracy": accuracy,
        "n_games": int(len(y)),
    }

    os.makedirs(PROCESSED, exist_ok=True)
    with open(MODEL_PATH, "w", encoding="utf-8") as f:
        json.dump(artifact, f, indent=2)

    print("trained ridge logistic regression on", len(y), "team games")
    print("training accuracy:", accuracy)
    for name, coef in zip(FEATURES, artifact["coef"]):
        print("  ", name.ljust(10), round(coef, 3))
    print("wrote", MODEL_PATH)
    return artifact


if __name__ == "__main__":
    train()
