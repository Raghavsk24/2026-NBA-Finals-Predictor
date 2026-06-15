/*
  a compact banner under the hero that shows the live finals standing and the score of every game
  already played. it renders nothing until at least one finals game has been recorded.
*/

import { seriesData } from "@/lib/data";
import { TEAMS } from "@/lib/teams";

export function SeriesStatus() {
  const { nyk_wins, sas_wins, display } = seriesData;
  if (!display || display.length === 0) return null;

  const champion = nyk_wins === 4 ? "NYK" : sas_wins === 4 ? "SAS" : null;

  if (champion) {
    const team = TEAMS[champion];
    const name = champion === "NYK" ? "Knicks" : "Spurs";
    const record = champion === "NYK" ? `${nyk_wins}-${sas_wins}` : `${sas_wins}-${nyk_wins}`;
    return (
      <div className="mt-6 flex justify-center">
        <div
          className="flex items-center gap-2.5 rounded-full border px-5 py-2 shadow-sm backdrop-blur"
          style={{ borderColor: team.color + "55", backgroundColor: team.color + "18" }}
        >
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: team.color }}>
            {name} Win the 2026 NBA Championship
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: team.color }}
          >
            {record}
          </span>
        </div>
      </div>
    );
  }

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
