"use client";

// a radar that overlays the two teams' effective four factors. the numbers come straight from
// engine 3, so when a player is injured or his minutes change the shape flexes with it.

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from "recharts";
import type { FourFactors } from "@/lib/engines/layered";
import { TEAMS } from "@/lib/teams";
import { ChartBox } from "@/components/ChartBox";

export function FourFactorRadar({ nyk, sas }: { nyk: FourFactors; sas: FourFactors }) {
  // turnover percent is flipped into ball security so that higher is better on every axis
  const data = [
    { factor: "Shooting", NYK: nyk.efg * 100, SAS: sas.efg * 100 },
    { factor: "Ball Security", NYK: (1 - nyk.tov) * 100, SAS: (1 - sas.tov) * 100 },
    { factor: "Off. Boards", NYK: nyk.oreb * 100, SAS: sas.oreb * 100 },
    { factor: "Free Throws", NYK: nyk.ftr * 100, SAS: sas.ftr * 100 },
  ];

  return (
    <ChartBox height={288}>
      {(width, height) => (
        <RadarChart width={width} height={height} data={data} outerRadius="72%">
          <PolarGrid stroke="#e6e6e8" />
          <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "#666" }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e6e6e8", fontSize: 12 }}
            formatter={(value) => `${Number(value).toFixed(1)}`}
          />
          <Radar name="Knicks" dataKey="NYK" stroke={TEAMS.NYK.color} fill={TEAMS.NYK.color} fillOpacity={0.35} />
          <Radar name="Spurs" dataKey="SAS" stroke={TEAMS.SAS.color} fill={TEAMS.SAS.color} fillOpacity={0.3} />
        </RadarChart>
      )}
    </ChartBox>
  );
}
