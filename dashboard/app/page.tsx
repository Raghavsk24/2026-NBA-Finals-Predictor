/*
  the one page dashboard. the three engines stack on top of one another, simplest first, with
  the interactive engine last.
*/

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EngineSection } from "@/components/EngineSection";
import { LayerList } from "@/components/LayerList";
import { Engine1Section } from "@/components/Engine1Section";
import { Engine2Section } from "@/components/Engine2Section";
import { Engine3Section } from "@/components/Engine3Section";

const ENGINE1_DESC =
  "This is engine 1: the pace-adjusted efficiency model. It is the simplest of the three predictors. It uses only each team's offensive rating, defensive rating and pacing to predict the each team's probability of winning the 2026 NBA Finals after running 10,000 monte carlo simulations.";

const ENGINE2_DESC =
  'This is engine 2: the elo power rating model. It rates every team with an elo system built game by game across the 2025-26 season. It then combines that with each finals team\'s pythagorean expectation (an estimate of how many games a team "should win" based on their offesive and defensive ratings) to predict each team\'s probability of winning the series after running 10,000 monte carlo simulations. The elo system is a better metric than engine 1 because it rewards beating good teams with higher power ratings and it adjusts for margin of victory.';

const ENGINE3_DESC =
  "This is engine 3: the four factor player-impact model. This is the most complex of the three predictors. It layers player-level projections on top of team-level four factors to produce a more granular prediction that can also be used to explore how the outcome of the series is affected when players are injured or playing time varies.";

export default function Home() {
  return (
    <main className="flex-1">
      <Header />

      <EngineSection
        id="engine-1"
        topFlush
        number="01"
        title="PACE-ADJUSTED EFFICIENCY MODEL"
        description={<p className="leading-relaxed">{ENGINE1_DESC}</p>}
      >
        <Engine1Section />
      </EngineSection>

      <EngineSection
        id="engine-2"
        number="02"
        title="ELO POWER RATING MODEL"
        description={<p className="leading-relaxed">{ENGINE2_DESC}</p>}
      >
        <Engine2Section />
      </EngineSection>

      <EngineSection
        id="engine-3"
        number="03"
        title="FOUR-FACTOR PLAYER IMPACT"
        description={
          <>
            <p className="leading-relaxed">{ENGINE3_DESC}</p>
            <LayerList />
          </>
        }
      >
        <Engine3Section />
      </EngineSection>

      <Footer />
    </main>
  );
}
