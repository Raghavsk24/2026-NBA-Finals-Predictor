/*
  the five layers of engine 3, shown as a simple numbered list under the engine description. the
  wording is kept in sync with the module docstring in
  engines/four_factor_player_impact_model.py.
*/

export function LayerList() {
  return (
    <div className="mt-5">
      <p className="font-semibold text-ink">The layers are as follows:</p>
      <ol className="mt-3 space-y-3 pl-6 text-sm">
        <li>
          <span className="font-bold text-black">1. Layer One:</span> We calculate each team's efficiency rating using Oliver Dean's four factors: Effective Field Goal Percentage (eFG%), Turnover Percentage (TOV%), Offensive Rebounding Percentage (ORB%), Free Throw Attempt Rate (FTA Rate).
        </li>
        <li>
          <span className="font-bold text-black">2. Layer Two:</span> We score each player's individual offensive efficiency using their true shooting percentage and usage rate.
        </li>
        <li>
          <span className="font-bold text-black">3. Layer Three:</span> We adjust each player's individual offensive efficiency against the strength of their defender. You can view the matchups below.
        </li>
        <li>
          <span className="font-bold text-black">4. Layer Four:</span> We weight each player based on the number of minutes they are expected to play in the finals. You can adjust each players minutes to see how the series win probability for each team changes.
        </li>
        <li>
          <span className="font-bold text-black">5. Layer Five:</span> We combine layers 1-4 into a a single win probability for both teams using a logistic regression model. We then run 10,000 monte carlo simulations to simulate the series.
        </li>
      </ol>
    </div>
  );
}
