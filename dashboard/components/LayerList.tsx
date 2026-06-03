/*
  the five layers of engine 3, shown as a labeled list under the engine description. the wording
  is kept verbatim, only the layer labels are pulled out into orange badges for readability.
*/

const LAYERS = [
  "Calculates the team's efficiency using Oliver Dean's four factors: effective field goal percent, turnover rate, offensive rebounding percent and free throw rate.",
  "Calculates each individual player's efficiency using Oliver Dean's four factors",
  "a matchup adjustment that adjusts each player's efficiency based on the strength of the defender",
  "Each player's predicted minutes, allows adjustments to visualize how changing minutes can affect the series.",
  "a ridge logistic regression that aggregates everything into a win probability, then runs 10,000 monte carlo simulations to predict each team's probability of winning the series.",
];

export function LayerList() {
  return (
    <div className="mt-5">
      <p className="font-semibold text-ink">The layers are as follows:</p>
      <ol className="mt-3 space-y-2.5">
        {LAYERS.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-[68px] shrink-0 items-center justify-center rounded-full bg-knicks/15 text-[11px] font-bold uppercase tracking-wide text-knicks">
              Layer {i + 1}
            </span>
            <span className="leading-relaxed">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
