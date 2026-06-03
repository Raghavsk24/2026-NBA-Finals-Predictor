// the one page dashboard. the three engines stack on top of one another, simplest first, with
// the interactive engine last.

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EngineSection } from "@/components/EngineSection";
import { Engine1Section } from "@/components/Engine1Section";
import { Engine2Section } from "@/components/Engine2Section";
import { Engine3Section } from "@/components/Engine3Section";

export default function Home() {
  return (
    <main className="flex-1">
      <Header />

      <EngineSection
        id="engine-1"
        number="01"
        tier="Engine 01 . Baseline"
        title="Pace-Adjusted Efficiency Model"
        blurb="The simplest engine. It turns each team's offensive rating, defensive rating and pace into an expected score, then plays the best of seven 10,000 times. A clean baseline before the models get more opinionated."
        badge="10,000 Monte Carlo sims"
      >
        <Engine1Section />
      </EngineSection>

      <EngineSection
        id="engine-2"
        number="02"
        tier="Engine 02 . Power Ratings"
        title="Elo Power Rating Model"
        blurb="Every team is rated with an Elo system built game by game across the season, rewarding wins over strong opponents and margin of victory. It is then blended with each team's Pythagorean win expectation from points scored and allowed."
        badge="Elo + Pythagorean"
      >
        <Engine2Section />
      </EngineSection>

      <EngineSection
        id="engine-3"
        number="03"
        tier="Engine 03 . Interactive"
        title="Four Factor Player-Impact Model"
        blurb="Five stacked layers: team four factors, a per player efficiency score, the head to head positional matchups, projected minutes, and a ridge logistic regression that ties it together. The most complex and, by design, the most overfit. Built for exploring what ifs."
        badge="5 layers . live"
      >
        <Engine3Section />
      </EngineSection>

      <Footer />
    </main>
  );
}
