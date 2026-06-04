"use client";

/*
  a radar that overlays the two teams' four factor efficiency, namely shooting, turnovers,
  rebounding and free throws. each axis is a 0 to 100 efficiency score, and below the radar each
  team carries an overall four factor rating. the values come from engine 3, so the shape and the
  ratings flex when a player is injured or his minutes change.
*/

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from "recharts";
import type { FourFactors } from "@/lib/engines/layered";
import { TEAMS } from "@/lib/teams";
import { ChartBox } from "@/components/ChartBox";
import { fourFactorScores, TEAM_BANDS } from "@/lib/fourfactors";

export function FourFactorRadar({ nyk, sas }: { nyk: FourFactors; sas: FourFactors }) {
  const nykScore = fourFactorScores(nyk.efg, nyk.tov, nyk.oreb, nyk.ftr, TEAM_BANDS);
  const sasScore = fourFactorScores(sas.efg, sas.tov, sas.oreb, sas.ftr, TEAM_BANDS);

  const data = [
    { factor: "Shooting", NYK: nykScore.shooting, SAS: sasScore.shooting },
    { factor: "Turnovers", NYK: nykScore.turnovers, SAS: sasScore.turnovers },
    { factor: "Rebounding", NYK: nykScore.rebounding, SAS: sasScore.rebounding },
    { factor: "Free Throws", NYK: nykScore.freeThrows, SAS: sasScore.freeThrows },
  ];

  return (
    <div>
      <ChartBox height={272}>
        {(width, height) => (
          <RadarChart width={width} height={height} data={data} outerRadius="72%">
            <PolarGrid stroke="#e6e6e8" />
            <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "#666" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e6e6e8", fontSize: 12 }}
              formatter={(value) => `${Number(value).toFixed(0)}`}
            />
            <Radar name="Knicks" dataKey="NYK" stroke={TEAMS.NYK.color} fill={TEAMS.NYK.color} fillOpacity={0.35} />
            <Radar name="Spurs" dataKey="SAS" stroke={TEAMS.SAS.color} fill={TEAMS.SAS.color} fillOpacity={0.3} />
          </RadarChart>
        )}
      </ChartBox>
      <div className="mt-2 flex items-center justify-center gap-8">
        <TeamRating color={TEAMS.NYK.color} label="Knicks" rating={nykScore.rating} />
        <TeamRating color={TEAMS.SAS.color} label="Spurs" rating={sasScore.rating} />
      </div>
    </div>
  );
}

function TeamRating({ color, label, rating }: { color: string; label: string; rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="stat-display text-xl" style={{ color }}>
        {rating}
      </span>
    </div>
  );
}
