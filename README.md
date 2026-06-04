# 2026 NBA Finals Predictor

 This project runs three independent prediction engines side by side to forecast the 2026 NBA Finals between the New York Knicks and San Antonio Spurs. Each engine runs **10,000 Monte Carlo simulations** for a best of 7 games and then returns the probability that each team will win the finals along with other metrics such as the series length distribution, team elo ratings, team pythagorean expectation and each player's individual efficiency rating. After every game in the series is played, the model is updated with the new game data which influences its predictions. The results have been launched to an ***interactive, publicly available dashboard: https://2026-nba-finals-predictor.vercel.app/*** 


 <p>
    <img width=49% height=48%  alt="image" src="https://github.com/user-attachments/assets/d124c42f-8a3a-403b-9d45-dfe7d02be416" />
    <img width=49% height=48%  alt="image" src="https://github.com/user-attachments/assets/bf094ddf-1757-47af-9c04-b3ec04faf0f7" />
    <img width=49% height=48% alt="image" src="https://github.com/user-attachments/assets/d3485195-facd-414f-86ad-793956ff2f2c" />
    <img width=49% height=48%  alt="image" src="https://github.com/user-attachments/assets/9b08983f-d381-4b6c-a446-d5227231e1d8" />
 </p>


## <br>Tech Stack

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

## <br>Prediction Engines

I collected all data from [nba_api](https://github.com/swar/nba_api) to train the three different prediction models. The table below explains the three different prediction engines I built. All the models were built using Python. 

| Engine | Description | 
| ------ | --------- | 
| Pace-Adjusted Efficiency Model | A simple prediction model that uses only each team's offensive rating, defensive rating and pacing to forecast how many points each team will score in the finals adjusted for their opponent. It then runs 10,000 monte carlo simulations to predict who will win the finals and graphs a series length distribution bar chart.
| Elo Power Rating Model|  This model rates both the Knicks and Spurs strength using an ELO system, which is built on data from all 82 games in the 2025-2026 regular season. It then combines that with each finals team's pythagorean expectation (an estimate of how many games a team "should win" based on their offensive and defensive ratings) to give each team a power rating. Using the power rating the model then predicts which team will win the finals and graphs a series length distribution bar chart.
| Four Factor Player-Impact Model| The Four Factor Player Impact Model uses 5 different layers to calculate each player's individual player efficiency rating and estimate their impact on the finals. It then aggregates the five layers into a single vector using ***logistic regression*** to predict each team's probability of winning the finals and graphs a series length distribution bar chart. Finally it has an interactive roster lab, where users can play around with each player's minutes, injury status and performance ratings to see how that will affect the outcome of the finals.


### <br>1. Pace-Adjusted Efficiency Model

The Pace-Adjusted Efficiency Model is the simplest of the three engines. The model uses only three statistics: Offensive Rating, Defensive Rating, and Pace.

1. **Offensive Rating (ORtg):** How many points a team scores on average. The New York Knicks had the highest this season at 123.3
2. **Defensive Rating (DRtg):** How many points the team’s opponents scored on average. The San Antonio Spurs had the best this season at 104.4.
3. **Pace:** How many possessions a team had per game
   
Using these three quantities I calculated the expected number of points the Knicks and Spurs were expected to score this series. I did this by adjusting each team’s offense by the strength of the opponent’s defense relative to the league average, converted that adjusted efficiency into an expected point total by scaling it to the expected pace of the game and finally I added a three point bump to whichever team is at home. I then calculated each team's expected points in the finals series. You can view the code block below.

```
adjusted_ortg = ortg + (opponent_drtg - league_avg_drtg)
expected_points = (adjusted_ortg / 100) * expected_pace
```

The Knicks and Spurs are expected to score **113.5 - 115.4 points** in this series adjusted for each other's offense, defense and pacing. Finally, I ran 10,000 monte carlo simulations which produced a distribution with a series win probability of roughly ***65 percent*** for the Spurs and ***35 percent*** for the Knicks. The model also predicts that the series will most likely be 6 or 7 games long, which means we’re in for quite a ride!

### <br>2. ELO Power Rating Model

The ELO Power Rating Model addresses the largest blind spot of the baseline, namely that trying to estimate a team's expected points only using their offensive rating and defensive rating doesn’t take into account their performance against teams of different strength.The ELO system repairs this by maintaining a single rating per team that is updated after every game. Every team begins at 1500 elo, and after each game the rating moves by an amount proportional to how significant the result was. That means beating a heavily favored opponent moves a team’s rating far more than beating a weak one. Moreover, I scaled each update by a margin of victory multiplier, so that a blowout win of 20+ points has far more weightage than a narrow win of only 2 points. The graph below shows both team's ELO across the entire 2025–26 season: the Knicks have a final rating of ***1657.5 ELO*** and the Spurs have a final rating of ***1800.2 ELO***.

<img width="1708" height="769" alt="image" src="https://github.com/user-attachments/assets/87e1f212-546e-4cc5-ae83-970850e73568" />

<br>However, an ELO rating alone can be distorted by a team that wins an unusual number of close games. To address this, I combined the ELO estimate with the **Pythagorean expectation**, which estimates the win rate a team deserved based purely on points scored and points allowed. Essentially, the Pythagorean theorem calculates the total number of points the Knicks and Spurs scored this season and the total number of points their opponents scored on them.

Using the standard basketball exponent of 16.5, the Knicks earned a Pythagorean expectation of about ***71.5 percent*** and the Spurs about ***76.6 percent***. For the final win probabilities, I weighted the ELO rating at 60 percent and the Pythagorean expectation at 40 percent (you can adjust the weightage on the live dashboard to see how that affects the win probability). I ran the numbers across the same 10,000 monte carlo simulations, and the model gave the Spurs an ***~80% probability*** of winning the finals.

### <br>3. Four Factor Player-Impact Model

The Four Factors Player Impact Model is the most complex of the three engines. Unlike the other two, this model aims to be an interactive sandbox in which the user can ask what happens to the series when a specific player is injured or his minutes change. That helps assess and visualize each player's individual impact on the series. For example, if a player like Wembanyama suddenly becomes injured, the odds of winning the series flips to the Knicks.

The foundation of this model is based on Oliver Dean’s four factors, namely ***effective field goal percentage***, ***turnover rate***, ***offensive rebounding rate***, and ***free throw rate***, which together explain the large majority of the variance in basketball outcomes and which I weighted roughly 40%, 25%, 20%, and 15% in line with their established importance. You can view the code below:

```
def effective_four_factors(team_stats, offense_index, reb_index, base_offense, base_reb):
    # layer 1 adjusted by the player layers
    efg = team_stats["efg"] + EFG_SENS * (offense_index - base_offense)
    oreb = team_stats["oreb"] + OREB_SENS * (reb_index - base_reb)
    return {"efg": efg, "tov": team_stats["tov"], "oreb": oreb, "ftr": team_stats["ftr"]}
```

The overall model comprises 5 layers:

1. **Layer One:** We calculate each team's efficiency rating using Oliver Dean's four factors: Effective Field Goal Percentage (eFG%), Turnover Percentage (TOV%), Offensive Rebounding Percentage (ORB%), Free Throw Attempt Rate (FTA Rate).
2. **Layer Two:** We score each player's individual offensive efficiency using their true shooting percentage and usage rate.
3. **Layer Three:** We adjust each player's individual offensive efficiency against the strength of their defender. You can view the matchups below.
4. **Layer Four:** We weight each player based on the number of minutes they are expected to play in the finals. You can adjust each player's minutes to see how the series win probability for each team changes.
5. **Layer Five:** We combine layers 1-4 into a a single win probability for both teams using a logistic regression model. We then run 10,000 monte carlo simulations to simulate the series.

This model gives the Spurs the lowest chances of winning at ***about 62 percent***. In the live dashboard you can play around with different variables that this model uses. For example, if you decide to injure Victor Webanyama, you will see that the probability of winning the series for the Knicks increases from 38 percent to 78 percent.

## <br>Getting Started

### Prerequisites

- **Python 3.11 or newer.** 
- **Node.js 20 or newer.** 

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

## Disclaimer

This is an unofficial, educational project and is not affiliated with, endorsed by, or sponsored by the National Basketball Association, the New York Knicks, the San Antonio Spurs, or any of their players. All team names, logos, and player images are the property of their respective owners. Data is sourced from public NBA statistics through the nba_api project. Predictions are estimates for entertainment only.
