// the page hero. it titles the matchup knicks v spurs, shows both team logos, and lays out the
// starting five for each team with headshots and names underneath.

import { RosterCard } from "@/components/RosterCard";
import { playersData } from "@/lib/data";
import { TEAMS } from "@/lib/teams";

function TeamRoster({ teamKey }: { teamKey: "NYK" | "SAS" }) {
  const team = TEAMS[teamKey];
  const starters = playersData[teamKey].starters;
  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">
        <img src={team.logo} alt={`${team.name} logo`} className="h-7 w-7 object-contain" />
        <span className="text-sm font-bold uppercase tracking-wide">{team.name}</span>
        <span className="text-xs text-muted-foreground">
          {team.record.w}-{team.record.l}
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
    <header className="court-grid relative overflow-hidden border-b border-border">
      {/* soft team colored glows top left and top right for atmosphere */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-knicks/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-spurs/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-12 md:pt-16">
        <div className="text-center">
          <p className="eyebrow text-xs text-muted-foreground sm:text-sm">
            2026 NBA Finals &middot; Prediction Engine
          </p>

          <div className="mt-3 flex items-center justify-center gap-4 sm:gap-7">
            <img
              src={TEAMS.NYK.logo}
              alt="New York Knicks logo"
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />
            <h1 className="stat-display text-5xl text-ink sm:text-7xl md:text-8xl">
              <span style={{ color: TEAMS.NYK.color }}>KNICKS</span>
              <span className="mx-2 text-muted-foreground sm:mx-3">v</span>
              <span style={{ color: TEAMS.SAS.color }}>SPURS</span>
            </h1>
            <img
              src={TEAMS.SAS.logo}
              alt="San Antonio Spurs logo"
              className="h-14 w-14 object-contain sm:h-20 sm:w-20"
            />
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Three prediction engines simulate the best of seven Finals. Scroll through each one,
            then play with injuries and minutes in the last engine to see the series shift.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">
          <TeamRoster teamKey="NYK" />
          <div className="flex items-center justify-center">
            <span className="stat-display rounded-full border border-border px-4 py-2 text-lg text-muted-foreground">
              VS
            </span>
          </div>
          <TeamRoster teamKey="SAS" />
        </div>
      </div>
    </header>
  );
}
