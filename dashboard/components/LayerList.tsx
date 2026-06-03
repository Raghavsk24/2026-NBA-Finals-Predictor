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
      <ol className="mt-3 list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-ink">
        {LAYERS.map((layer, i) => (
          <li key={i} className="pl-1 leading-relaxed">
            <span className="font-semibold text-ink">{layer.title}.</span> {layer.body}
          </li>
        ))}
      </ol>
    </div>
  );
}
