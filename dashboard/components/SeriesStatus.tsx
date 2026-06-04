/*
  a compact banner under the hero that shows the live finals standing and the score of every game
  already played. it renders nothing until at least one finals game has been recorded.
*/

import { seriesData } from "@/lib/data";
import { TEAMS } from "@/lib/teams";

export function SeriesStatus() {
  const { nyk_wins, sas_wins, display } = seriesData;
  if (!display || display.length === 0) return null;

  return (
    <div className="mt-6 flex justify-center">
      <div className="flex items-center gap-3 rounded-full border border-border bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur">
        <span className="eyebrow text-[11px] text-walnut">NBA Finals:</span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-semibold" style={{ color: TEAMS.NYK.color }}>
            Knicks
          </span>
          <span className="stat-display text-lg" style={{ color: TEAMS.NYK.color }}>
            {nyk_wins}
          </span>
        </span>
        <span className="text-muted-foreground">-</span>
        <span className="flex items-center gap-1.5">
          <span className="stat-display text-lg" style={{ color: TEAMS.SAS.color }}>
            {sas_wins}
          </span>
          <span className="text-sm font-semibold" style={{ color: TEAMS.SAS.color }}>
            Spurs
          </span>
        </span>
      </div>
    </div>
  );
}
