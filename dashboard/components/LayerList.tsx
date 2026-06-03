/*
  the five layers of engine 3, shown as a simple numbered list under the engine description.
  the explanations here are kept in sync with the module docstring in
  engines/four_factor_player_impact_model.py.
*/

const LAYERS = [
  {
    title: "Team four factors",
    body: "Start from each team's season four factors, effective field goal percent, turnover rate, offensive rebound percent and free throw rate, which set the baseline efficiency the rest of the model adjusts.",
  },
  {
    title: "Player efficiency",
    body: "Score every available player's offense by combining how efficiently he scores (true shooting) with how much of the offense he creates (usage), so a high usage star still matters even when his efficiency is only average. Injured players are left out.",
  },
  {
    title: "Matchup adjustment",
    body: "Lower each player's efficiency by the strength of the defender lined up across from him, read from that defender's defensive rating, steals and blocks, so an elite defender drags his man down.",
  },
  {
    title: "Minutes",
    body: "Weight every player by his projected minutes inside a fixed pool of starter minutes. Injuries and minute changes redistribute that pool, with any shortfall filled by replacement level production, which is what powers the what-if scenarios.",
  },
  {
    title: "Aggregation",
    body: "Turn the adjusted four factor edges into a single game win probability with a ridge logistic regression, then run 10,000 monte carlo simulations of the best of seven to produce the series odds and length.",
  },
];

export function LayerList() {
  return (
    <div className="mt-5">
      <p className="font-semibold text-ink">The layers are as follows:</p>
      <ol className="mt-3 space-y-3 pl-6 text-sm">
        <li>
          <span className="font-semibold">1. Layer One:</span> We calculate each team's efficiency rating using Oliver Dean's four factors: Effective Field Goal Percentage (eFG%), Turnover Percentage (TOV%), Offensive Rebounding Percentage (ORB%), Free Throw Attempt Rate (FTA Rate).
        </li>
        <li>
          <span className="font-semibold">2. Layer Two:</span> We score each player's individual offensive efficiency using their true shooting percentage and usage rate.
        </li>
        <li>
          <span className="font-semibold">3. Layer Three:</span> We adjust each player's individual offensive efficiency against the strength of their defender. You can view the matchups below.
        </li>
        <li>
          <span className="font-semibold">4. Layer Four:</span> We weight each player based on the number of minutes they are expected to play in the finals. You can adjust each players minutes to see how the series win probability for each team changes.
        </li>
        <li>
          <span className="font-semibold">5. Layer Five:</span> We combine layers 1-4 into a a single win probability for both teams using a logistic regression model. We then run 10,000 monte carlo simulations to simulate the series.
        </li>
      </ol>
    </div>
  );
}
