"use client";

/*
  a small per player four factor radar shown inside a hover tooltip. the four axes are shooting,
  turnovers, rebounding and free throws, each a 0 to 100 efficiency score, and the player's overall
  four factor rating is printed underneath. the title is drawn in brown walnut to match the page.
*/

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import type { LayeredPlayer } from "@/lib/engines/layered";
import { fourFactorScores, PLAYER_BANDS } from "@/lib/fourfactors";

export function PlayerFourFactorRadar({
  player,
  color,
}: {
  player: LayeredPlayer;
  color: string;
}) {
  const s = fourFactorScores(player.efg, player.tov, player.oreb, player.ftr, PLAYER_BANDS);
  const data = [
    { factor: "Shooting", v: s.shooting },
    { factor: "Turnovers", v: s.turnovers },
    { factor: "Rebounding", v: s.rebounding },
    { factor: "Free Throws", v: s.freeThrows },
  ];

  return (
    <div>
      <p className="stat-display mb-1 max-w-[230px] text-center text-sm leading-tight text-walnut">
        {player.name.toUpperCase()} FOUR FACTOR EFFICIENCY
      </p>
      <RadarChart width={240} height={170} data={data} outerRadius="66%">
        <PolarGrid stroke="#e6e6e8" />
        <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: "#555" }} />
        <Radar dataKey="v" stroke={color} fill={color} fillOpacity={0.4} />
      </RadarChart>
      <p className="text-center text-xs text-muted-foreground">
        Four Factor Rating:{" "}
        <span className="stat-display text-base" style={{ color }}>
          {s.rating}
        </span>{" "}
        / 100
      </p>
    </div>
  );
}
