"use client";

/*
  engine 2 on the dashboard: the elo power rating model. it shows each team's season long elo
  trajectory and pythagorean expectation, and lets the user reweight how much elo versus
  pythagorean drives the prediction.
*/

import { useMemo, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { runEloEngine } from "@/lib/engines/elo";
import { engine2Data } from "@/lib/data";
import { TEAMS } from "@/lib/teams";
import { WinProbabilityBar } from "@/components/WinProbabilityBar";
import { SeriesLengthBars } from "@/components/SeriesLengthBars";
import { StatTile } from "@/components/StatTile";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { firstNum } from "@/lib/utils";
import { ChartBox } from "@/components/ChartBox";

const elo = engine2Data.elo;
const pyth = engine2Data.pythagorean;

// stitch the two elo trajectories into one series for the line chart
const trajectory = engine2Data.elo_trajectory.NYK.map((nyk, i) => ({
  game: i + 1,
  NYK: nyk,
  SAS: engine2Data.elo_trajectory.SAS[i],
}));

export function Engine2Section() {
  const [blend, setBlend] = useState(0.6);
  const result = useMemo(
    () => runEloEngine(elo.NYK, elo.SAS, pyth.NYK.winpct, pyth.SAS.winpct, blend, 10000, 1),
    [blend]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-6">
          <WinProbabilityBar nyk={result.series.NYK} sas={result.series.SAS} />
          <div className="mt-8">
            <SeriesLengthBars data={result.seriesLength} />
          </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Knicks Elo" value={`${elo.NYK}`} color={TEAMS.NYK.color} sub="final season rating" />
            <StatTile label="Spurs Elo" value={`${elo.SAS}`} color={TEAMS.SAS.color} sub="final season rating" />
            <StatTile
              label="Knicks Pythagorean Expectation"
              value={`${(pyth.NYK.winpct * 100).toFixed(1)}%`}
              color={TEAMS.NYK.color}
              sub="expected win rate"
            />
            <StatTile
              label="Spurs Pythagorean Expectation"
              value={`${(pyth.SAS.winpct * 100).toFixed(1)}%`}
              color={TEAMS.SAS.color}
              sub="expected win rate"
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[11px] text-walnut">Power Rating</p>
              <span className="text-xs font-medium text-muted-foreground">
                <span className="text-ink">{Math.round(blend * 100)}%</span> ELO Rating /{" "}
                <span className="text-ink">{Math.round((1 - blend) * 100)}%</span> Pythagorean Expectation
              </span>
            </div>
            <Slider
              className="mt-4 [&_[data-slot=slider-range]]:bg-walnut [&_[data-slot=slider-thumb]]:border-walnut"
              min={0}
              max={1}
              step={0.05}
              value={[blend]}
              onValueChange={(v) => setBlend(firstNum(v))}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Slide toward ELO Rating to give more weight to season ELO ratings and toward
              Pythagorean Expectation to give more weight to scoring volume.
            </p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <p className="stat-display mb-5 text-center text-base text-walnut md:text-lg">
          Knicks v Spurs Season Elo Trajectory
        </p>
        <ChartBox height={256}>
          {(width, height) => (
            <LineChart width={width} height={height} data={trajectory} margin={{ top: 5, right: 14, left: 6, bottom: 4 }}>
              <CartesianGrid stroke="#eee" vertical={false} />
              <XAxis
                dataKey="game"
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                axisLine={false}
                interval={13}
                label={{ value: "game number", position: "insideBottom", offset: -2, fontSize: 11, fill: "#aaa" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#888" }}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 30", "dataMax + 30"]}
                tickFormatter={(v) => `${Math.round(v)}`}
                width={48}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e6e6e8", fontSize: 12 }}
                labelFormatter={(g) => `Game ${g}`}
              />
              <Line type="monotone" dataKey="SAS" name="Spurs" stroke={TEAMS.SAS.color} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="NYK" name="Knicks" stroke={TEAMS.NYK.color} strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </ChartBox>
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Legend color={TEAMS.SAS.color} label="Spurs" />
          <Legend color={TEAMS.NYK.color} label="Knicks" />
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
