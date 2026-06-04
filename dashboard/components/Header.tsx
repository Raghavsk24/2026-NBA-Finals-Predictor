/*
  the page hero. it titles the matchup knicks v spurs, shows both team logos, lays out the
  starting five for each team with headshots and names underneath, and ends with a scroll cue
  that drops the user into the first engine.
*/

import { RosterCard } from "@/components/RosterCard";
import { ScrollCue } from "@/components/ScrollCue";
import { SeriesStatus } from "@/components/SeriesStatus";
import { playersData } from "@/lib/data";
import { TEAMS } from "@/lib/teams";

function TeamRoster({ teamKey }: { teamKey: "NYK" | "SAS" }) {
  const team = TEAMS[teamKey];
  const starters = playersData[teamKey].starters;
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">
        <img src={team.logo} alt={`${team.name} logo`} className="h-7 w-7 object-contain" />
        <span className="text-sm font-bold uppercase tracking-wide">{team.name}</span>
        {/* regular season record in parentheses, in solid black */}
        <span className="text-xs text-black">
          ({team.record.w}-{team.record.l})
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {starters.map((p) => (
          <RosterCard key={p.id} player={p} color={team.color} />
        ))}
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="relative overflow-hidden">
      {/* soft team colored glows top left and top right for atmosphere */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-knicks/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-spurs/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-12 md:pt-16">
        <div className="text-center">
          <p className="eyebrow text-xs text-walnut sm:text-sm">2026 NBA Finals Prediction Engine</p>

          <div className="mt-3 flex items-center justify-center gap-4 sm:gap-7">
            <img
              src={TEAMS.NYK.logo}
              alt="New York Knicks logo"
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />
            <h1 className="stat-display text-5xl text-ink sm:text-7xl md:text-8xl">
              <span style={{ color: TEAMS.NYK.color }}>KNICKS</span>
              {/* the vs between the team names, walnut, a quarter smaller than the names */}
              <span className="mx-5 text-[0.75em] text-walnut sm:mx-8">vs.</span>
              <span style={{ color: TEAMS.SAS.color }}>SPURS</span>
            </h1>
            <img
              src={TEAMS.SAS.logo}
              alt="San Antonio Spurs logo"
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            We use three different prediction engines to simulate the 2026 NBA Finals between the
            New York Knicks and San Antonio Spurs. See how we created prediction models on{" "}
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

        {/*
          rosters laid out in three columns on desktop with the vs centered between them. the
          items-center alignment lands the vs on the headshot row, so it sits between karl-anthony
          towns and de'aaron fox rather than at the top of the columns.
        */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
          <TeamRoster teamKey="NYK" />
          <div className="flex justify-center">
            <span className="stat-display text-3xl text-black sm:text-4xl">VS</span>
          </div>
          <TeamRoster teamKey="SAS" />
        </div>

        <ScrollCue />
      </div>
    </header>
  );
}
