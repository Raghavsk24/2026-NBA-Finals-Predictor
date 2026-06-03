// one player in the starting five header: a framed headshot with the name and position under it

import type { RosterPlayer } from "@/lib/data";

export function RosterCard({
  player,
  color,
}: {
  player: RosterPlayer;
  color: string;
}) {
  const last = player.name.split(" ").slice(-1)[0];
  const first = player.name.split(" ").slice(0, -1).join(" ");

  return (
    <div className="group flex flex-col items-center text-center">
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border bg-secondary"
        style={{ borderColor: color }}
      >
        <img
          src={player.headshot}
          alt={player.name}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {player.pos}
        </span>
      </div>
      <div className="mt-2 leading-tight">
        <div className="text-[11px] text-muted-foreground">{first}</div>
        <div className="text-sm font-bold tracking-tight">{last}</div>
      </div>
    </div>
  );
}
