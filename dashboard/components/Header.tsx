/*
  the page hero. it titles the matchup knicks v spurs with both team marks, carries the project
  subtext and the medium link, and ends with the current series status.
*/

import { SeriesStatus } from "@/components/SeriesStatus";
import { TeamMark } from "@/components/Marks";
import { TEAMS } from "@/lib/teams";

export function Header() {
  return (
    <header className="relative overflow-hidden">
      {/* soft team colored glows top left and top right for atmosphere */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-knicks/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-spurs/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-12 md:pt-16">
        <div className="text-center">
          <p className="eyebrow text-xs text-walnut sm:text-sm">2026 NBA Finals Prediction Engine</p>

          <div className="mt-3 flex items-center justify-center gap-2 sm:gap-7">
            <TeamMark
              abbr={TEAMS.NYK.abbr}
              color={TEAMS.NYK.color}
              className="h-10 w-10 rounded-xl text-xs sm:h-20 sm:w-20 sm:rounded-2xl sm:text-2xl"
            />
            <h1 className="stat-display text-4xl text-ink sm:text-7xl md:text-8xl">
              <span style={{ color: TEAMS.NYK.color }}>KNICKS</span>
              {/* the vs between the team names, walnut, a quarter smaller than the names */}
              <span className="mx-2 text-[0.75em] text-walnut sm:mx-8">vs.</span>
              <span style={{ color: TEAMS.SAS.color }}>SPURS</span>
            </h1>
            <TeamMark
              abbr={TEAMS.SAS.abbr}
              color={TEAMS.SAS.color}
              className="h-10 w-10 rounded-xl text-xs sm:h-20 sm:w-20 sm:rounded-2xl sm:text-2xl"
            />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            We use three different prediction engines to simulate the 2026 NBA Finals between the
            New York Knicks and San Antonio Spurs. See how we created the prediction models on{" "}
            <a
              href="https://medium.com/@senthilkumaraghav/week-2-of-13-predicting-the-2026-nba-finals-194bdfdb1530"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-knicks underline underline-offset-2 hover:text-knicks-blue"
            >
              Medium
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          </p>

          <SeriesStatus />
        </div>
      </div>
    </header>
  );
}
