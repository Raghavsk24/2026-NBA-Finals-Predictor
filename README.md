# 2026 NBA Finals Predictor

Picking a Finals winner usually means trusting a single number from a single model. This project runs three independent prediction engines side by side, from a clean efficiency baseline to a layered player impact model, to forecast the 2026 NBA Finals between the New York Knicks and San Antonio Spurs. Each engine runs **10,000 Monte Carlo simulations** of the best of seven, and the most complex engine is fully interactive: injure a player or change his minutes in the browser and the series rebuilds instantly. The aggregation layer of that engine is a ridge logistic regression trained to **94.1% accuracy** on the 2025-26 season.

**Live App:** https://2026-nba-finals-predictor.vercel.app

<table>
  <tr>
    <td><img src="" alt="Knicks v Spurs header and rosters" width="100%"/></td>
    <td><img src="" alt="Pace-adjusted efficiency engine" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="" alt="Elo power rating engine" width="100%"/></td>
    <td><img src="" alt="Interactive four factor player impact engine" width="100%"/></td>
  </tr>
</table>
<!-- Add screenshot URLs above -->

## Tech Stack

### Frontend

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn--ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://recharts.org/)

### Backend

[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![pandas](https://img.shields.io/badge/pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)](https://numpy.org/)
[![nba_api](https://img.shields.io/badge/nba__api-D2122E?style=for-the-badge&logo=nba&logoColor=white)](https://github.com/swar/nba_api)

### Infrastructure

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)

## Prediction Engines

Python is the source of truth. The engines collect data, train models, and export compact JSON, then the dashboard ports the same math to TypeScript so every engine runs live in the browser with no backend.

| Engine | Technique | What it answers |
| ------ | --------- | --------------- |
| Pace-Adjusted Efficiency | Offensive and defensive rating plus pace, Monte Carlo | A clean baseline series probability |
| Elo Power Rating | Season long Elo blended with Pythagorean expectation | How much the full season body of work favors each team |
| Four Factor Player-Impact | Five stacked layers plus a ridge logistic regression | How injuries, matchups, and minutes reshape the series |

### 1. Pace-Adjusted Efficiency Model

The baseline. Each team's offense is adjusted by the opponent's defense relative to the league, then scaled by the expected pace of the game.

```
adjusted_ortg = ortg + (opponent_drtg - league_avg_drtg)
expected_points = (adjusted_ortg / 100) * expected_pace
```

The point margin is treated as a normal distribution with a standard deviation of **13** points, home court is worth **3** points, and the model plays the 2-2-1-1-1 series **10,000** times.

### 2. Elo Power Rating Model

Every team is rated game by game across the 2025-26 season, starting at **1500** with a K factor of **20**, a margin of victory multiplier, and a **100** point home court bump. The Elo gap is blended with each team's Pythagorean win expectation, computed from points scored and allowed with an exponent of **16.5**, then combined head to head with the Bill James log5 formula. The default blend trusts Elo **60%** and Pythagorean **40%**.

### 3. Four Factor Player-Impact Model

The most complex engine, and by design the most overfit. It stacks five layers:

1. **Team four factors.** Oliver Dean's effective field goal percentage, turnover rate, offensive rebound rate, and free throw rate, weighted roughly 40, 25, 20, 15.
2. **Player efficiency.** A per minute offensive quality that blends true shooting with usage, so losing a high usage creator hurts even when his efficiency is only average. Injured players drop out of the calculation.
3. **Matchup adjustment.** Each starter is scaled by the defender across from him, using that defender's defensive rating, steals, and blocks. A healthy Victor Wembanyama suppresses the man he guards.
4. **Minutes.** A fixed pool of starter minutes is conserved. Injuries and minute changes redistribute that pool, with any shortfall filled by replacement level production.
5. **Aggregation.** The four factor edges feed a ridge regularized L2 logistic regression trained on every team game of the season:

```
P(Knicks win game) = sigmoid(b0 + sum(b_i * z_i))
```

where each `z_i` is a standardized four factor differential plus a home flag. The model trains to **94.1%** accuracy, then the series is resolved with **10,000** Monte Carlo runs. The browser recomputes all five layers on every injury toggle and minutes change.

## Features

1. Three prediction engines stacked on a single scrolling dashboard, simplest first.
2. Live win probability, series length distribution, and per game odds for every engine.
3. An interactive Roster Lab where injuring a player or dragging his minutes rebuilds the prediction in real time.
4. Projected points, rebounds, and assists for every rotation player, updated live with the matchups.
5. A season long Elo trajectory chart and a four factor radar that flexes with the current lineup.
6. Real 2025-26 data, team logos, and player headshots pulled from public NBA sources.

## Getting Started

### Prerequisites

- **Python 3.11 or newer.** Runs the data collection and the three prediction engines. https://www.python.org/downloads/
- **Node.js 20 or newer.** Runs the dashboard. https://nodejs.org/

### Setup

1. Clone the repository.

```bash
git clone https://github.com/RaghavSenthilKumar/2026-NBA-Finals-Predictor.git
cd 2026-NBA-Finals-Predictor
```

2. Install the Python dependencies.

```bash
pip install -r requirements.txt
```

3. Collect the 2025-26 season data. This writes the JSON the engines and dashboard read.

```bash
python data/collect_data.py
```

4. Run the engines. Each one prints its prediction and writes its output to data/processed.

```bash
python engines/Simple_Efficiency_Prediction_Model.py
python engines/elo_power_rating_model.py
python engines/train_four_factor_model.py
python engines/four_factor_player_impact_model.py
```

5. Start the dashboard.

```bash
cd dashboard
npm install
cp .env.example .env.local
npm run dev
```

The dashboard reads the precomputed JSON from dashboard/data, so it runs without any secret keys. The only environment variable is NEXT_PUBLIC_SITE_URL, used to build social share metadata after deployment.

## Disclaimer

This is an unofficial, educational project and is not affiliated with, endorsed by, or sponsored by the National Basketball Association, the New York Knicks, the San Antonio Spurs, or any of their players. All team names, logos, and player images are the property of their respective owners. Data is sourced from public NBA statistics through the nba_api project. Predictions are estimates for entertainment only.
