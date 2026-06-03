"use client";

// engine 1 on the dashboard: the pace adjusted efficiency model. it recomputes its 10,000
// monte carlo simulations in the browser so the user can slide the home court edge and resim.

import { useMemo, useState } from "react";
import { runSimpleEngine, type TeamEff } from "@/lib/engines/simple";
import { engine1Data } from "@/lib/data";
import { TEAMS } from "@/lib/teams";
import { WinProbabilityBar } from "@/components/WinProbabilityBar";
import { SeriesLengthBars } from "@/components/SeriesLengthBars";
import { StatTile } from "@/components/StatTile";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { firstNum } from "@/lib/utils";

const nyk: TeamEff = { ...engine1Data.inputs.NYK };
const sas: TeamEff = { ...engine1Data.inputs.SAS };
const leagueAvg = engine1Data.inputs.league_avg_drtg;

export function Engine1Section() {
  const [homeCourt, setHomeCourt] = useState(3);
  const [token, setToken] = useState(0);
  const result = useMemo(
    () => runSimpleEngine(nyk, sas, leagueAvg, homeCourt),
    [homeCourt, token]
  );

  return (
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
          <StatTile
            label="Proj. score"
            value={`${result.expectedScore.NYK} - ${result.expectedScore.SAS}`}
            sub="Knicks - Spurs, neutral floor"
          />
          <StatTile label="Pace" value={`${result.expectedPace}`} sub="possessions per game" />
        </div>

        <Card className="p-5">
          <p className="eyebrow mb-3 text-[11px] text-muted-foreground">per game win odds</p>
          <div className="space-y-2 text-sm">
            <OddsRow color={TEAMS.NYK.color} team="Knicks" home={result.perGame.nykHome} road={result.perGame.nykAway} />
            <OddsRow color={TEAMS.SAS.color} team="Spurs" home={result.perGame.sasHome} road={result.perGame.sasAway} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-[11px] text-muted-foreground">home court edge</p>
            <span className="stat-display text-lg text-ink">+{homeCourt.toFixed(1)} pts</span>
          </div>
          <Slider
            className="mt-4"
            min={0}
            max={6}
            step={0.5}
            value={[homeCourt]}
            onValueChange={(v) => setHomeCourt(firstNum(v))}
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Inputs: ORtg, DRtg and pace from the 2025-26 season.
            </p>
            <Button size="sm" variant="outline" onClick={() => setToken((t) => t + 1)}>
              Re-simulate
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OddsRow({
  color,
  team,
  home,
  road,
}: {
  color: string;
  team: string;
  home: number;
  road: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 font-medium">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {team}
      </span>
      <span className="font-mono text-muted-foreground">
        home <span className="font-semibold text-ink">{home}%</span>
        <span className="mx-2 text-border">|</span>
        road <span className="font-semibold text-ink">{road}%</span>
      </span>
    </div>
  );
}
