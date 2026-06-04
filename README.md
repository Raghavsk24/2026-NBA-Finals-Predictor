# 2026 NBA Finals Predictor

 This project runs three independent prediction engines side by side to forecast the 2026 NBA Finals between the New York Knicks and San Antonio Spurs. Each engine runs **10,000 Monte Carlo simulations** for the best of 7 games and outputs the probability that each team will wi the finals. The results have been launched to an interactive, publicly available dashboard. Users can change different variables to see how each player will affect the outcome of the 2026 NBA finals. 

 <table>
  <tr>
    <img width=49% height=49% <img width="1726" height="944" alt="image" src="https://github.com/user-attachments/assets/d124c42f-8a3a-403b-9d45-dfe7d02be416" />
    <img width=49% height=49% <img width="1723" height="943" alt="image" src="https://github.com/user-attachments/assets/bf094ddf-1757-47af-9c04-b3ec04faf0f7" />


  </tr>
  <tr>
    <img width=49% height=49% <img width="1708" height="769" alt="image" src="https://github.com/user-attachments/assets/87e1f212-546e-4cc5-ae83-970850e73568" />
    <img width=49% height=49% <img width="1659" height="755" alt="image" src="https://github.com/user-attachments/assets/bf7a0ffd-1f1e-4375-9c9f-0f093b11f3b2" />

  </tr>
</table>

**Live App:** https://2026-nba-finals-predictor.vercel.app/

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

I collected all my data from [nba_api](https://github.com/swar/nba_api) to train three different prediction models using Pythons. The table below explains the three different prediction engines I built.

| Engine | Technique | 
| ------ | --------- | 
| Pace-Adjusted Efficiency Model | A simple prediction model that uses only each team's offensive rating, defensive rating and pacing to predict the each team's probability of winning the 2026 NBA Finals after running 10,000 monte carlo simulations.
| Elo Power Rating Model|  It rates every team with an elo system built game by game across the 2025-26 season. It then combines that with each finals team's pythagorean expectation (an estimate of how many games a team "should win" based on their offesive and defensive ratings) to predict each team's probability of winning the series after running 10,000 monte carlo simulations. 
| Four Factor Player-Impact Model| It layers a player-level projections on top of team-level four factors efficiency rating to produce a more granular prediction that can also be used to explore how the outcome of the series is affected when players are injured or playing time varies. The model composes off five layers and is aggregated using logistic regression

### 1. Pace-Adjusted Efficiency Model

This is the baseline prediction model. Each team's offense is adjusted by the opponent's defense relative to the league, then scaled by the expected pace of the game.

```
adjusted_ortg = ortg + (opponent_drtg - league_avg_drtg)
expected_points = (adjusted_ortg / 100) * expected_pace
```

The point margin is treated as a normal distribution whose standard deviation is computed directly from the Knicks' and Spurs' actual game results this season, which is about **15.25** points. If a team plays on their home court they are given a boost of **3 points**. The model runs 10,000 simulations using the team expected points and ultimately forecasts that the Spurs are the favorites to win this series with a **~65% win probability**.

### 2. ELO Power Rating Model

Every team is rated game by game across the 2025-26 season by their ELO, starting at **1500** with a K factor of **20**, a margin of victory multiplier, and a **100** point home court bump. The ELO gap is blended with each team's Pythagorean win expectation, computed from points scored and allowed with an exponent of **16.5**, then combined head to head with the Bill James log5 formula. The default blend weights Elo **60%** and Pythagorean **40%**. Users can adjust the weighting on the dashboard to see how that affects the model's predictions.

This model also forecasts that the Spurs will win the series but with a much higher win probability of **~80 percent** becuase the Spur's ELO rating is much higher than the Knicks.

### 3. Four Factor Player-Impact Model

The most complex engine stacks five layers:

1. **Layer One** We calculate each team's efficiency rating using Oliver Dean's four factors: Effective Field Goal Percentage (eFG%), Turnover Percentage (TOV%), Offensive Rebounding Percentage (ORB%), Free Throw Attempt Rate (FTA Rate).
2. **Layer Two** We score each player's individual offensive efficiency using their true shooting percentage and usage rate.
3. **Layer Three** We adjust each player's individual offensive efficiency against the strength of their defender. You can view the matchups below.
4. **Layer Four** We weight each player based on the number of minutes they are expected to play in the finals. You can adjust each players minutes to see how the series win probability for each team changes.
5. **Layer Five** We combine layers 1-4 into a a single win probability for both teams using a logistic regression model. We then run 10,000 monte carlo simulations to simulate the series.

```
P(Knicks win game) = sigmoid(b0 + sum(b_i * z_i))
```

Again, this model forecasts that the Spurs win the series but it gives them the lowest win probability at **~ 60 percent**.

## Features

1. Live win probability, series length distribution, and per game odds for every engine.
2. An interactive Roster Lab where injuring a player or dragging his minutes rebuilds the prediction in real time.
3. Projected points, rebounds, and assists for every rotation player, and efficiency graph for each player
4. A season long Elo trajectory chart and a four factor radar that flexes with the current lineup.

## Getting Started

### Prerequisites

- **Python 3.11 or newer.** Runs the data collection and the three prediction engines. https://www.python.org/downloads/
- **Node.js 20 or newer.** Runs the dashboard. https://nodejs.org/

### Setup

1. Clone the repository.

```bash
git clone https://github.com/Raghavsk24/2026-NBA-Finals-Predictor.git
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
python engines/pace_adjusted_efficiency_model.py
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
