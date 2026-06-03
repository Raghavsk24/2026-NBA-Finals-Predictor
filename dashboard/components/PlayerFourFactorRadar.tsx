"use client";

/*
  a small per player four factor radar shown inside a hover tooltip. each axis is normalized to a
  sensible per player band so the four factors share one readable scale, and the title is drawn in
  brown walnut to match the rest of the page.
*/

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import type { LayeredPlayer } from "@/lib/engines/layered";

// squash a raw value into a 0 to 100 score across a chosen band, lo and hi may be inverted
function norm(value: number, lo: number, hi: number): number {
  const scaled = ((value - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, scaled));
}

export function PlayerFourFactorRadar({
  player,
  color,
}: {
  player: LayeredPlayer;
  color: string;
}) {
  // player turnover percent is on a 0 to 100 scale, the other three factors are fractions
  const data = [
    { factor: "Field Goals", v: norm(player.efg, 0.45, 0.65) },
    { factor: "Defense", v: norm(player.tov, 13, 5) },
    { factor: "Off. Rebounds", v: norm(player.oreb, 0, 0.12) },
    { factor: "Free Throws", v: norm(player.ftr, 0.1, 0.5) },
  ];

  return (
    <div>
      <p className="stat-display mb-1 max-w-[230px] text-center text-sm leading-tight text-walnut">
        {player.name.toUpperCase()} FOUR FACTOR EFFICIENCY
      </p>
      <RadarChart width={240} height={180} data={data} outerRadius="68%">
        <PolarGrid stroke="#e6e6e8" />
        <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: "#555" }} />
        <Radar dataKey="v" stroke={color} fill={color} fillOpacity={0.4} />
      </RadarChart>
    </div>
  );
}
