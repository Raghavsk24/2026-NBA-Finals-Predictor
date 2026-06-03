"use client";

// engine 2 on the dashboard: the elo power rating model. it shows each team's season long elo
// trajectory and pythagorean win rate, and lets the user reweight how much elo versus
// pythagorean drives the prediction.

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
    () => runEloEngine(elo.NYK, elo.SAS, pyth.NYK.winpct, pyth.SAS.winpct, blend),
    [blend]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-6">
          <WinProbabilityBar nyk={result.series.NYK} sas={result.series.SAS} />
          <div className="mt-8">
            <p className="eyebrow mb-3 text-[11px] text-muted-foreground">how long the series runs</p>
            <SeriesLengthBars data={result.seriesLength} />
          </div>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Knicks Elo" value={`${elo.NYK}`} color={TEAMS.NYK.color} sub="final season rating" />
            <StatTile label="Spurs Elo" value={`${elo.SAS}`} color={TEAMS.SAS.color} sub="final season rating" />
            <StatTile
              label="Knicks Pythag"
              value={`${(pyth.NYK.winpct * 100).toFixed(1)}%`}
              color={TEAMS.NYK.color}
              sub="expected win rate"
            />
            <StatTile
              label="Spurs Pythag"
              value={`${(pyth.SAS.winpct * 100).toFixed(1)}%`}
              color={TEAMS.SAS.color}
              sub="expected win rate"
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-[11px] text-muted-foreground">signal blend</p>
              <span className="text-xs font-medium text-muted-foreground">
                <span className="text-ink">{Math.round(blend * 100)}%</span> Elo /{" "}
                <span className="text-ink">{Math.round((1 - blend) * 100)}%</span> Pythag
              </span>
            </div>
            <Slider
              className="mt-4"
              min={0}
              max={1}
              step={0.05}
              value={[blend]}
              onValueChange={(v) => setBlend(firstNum(v))}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Slide toward Elo to trust head to head power ratings, toward Pythagorean to trust
              points scored and allowed.
            </p>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <p className="eyebrow mb-4 text-[11px] text-muted-foreground">season elo trajectory</p>
        <ChartBox height={256}>
          {(width, height) => (
            <LineChart width={width} height={height} data={trajectory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
                width={44}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e6e6e8", fontSize: 12 }}
                labelFormatter={(g) => `Game ${g}`}
              />
              <Line type="monotone" dataKey="NYK" name="Knicks" stroke={TEAMS.NYK.color} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="SAS" name="Spurs" stroke={TEAMS.SAS.color} strokeWidth={2.5} dot={false} />
            </LineChart>
          )}
        </ChartBox>
        <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
          <Legend color={TEAMS.NYK.color} label="Knicks" />
          <Legend color={TEAMS.SAS.color} label="Spurs" />
          <span>Both teams start the season at 1500.</span>
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
