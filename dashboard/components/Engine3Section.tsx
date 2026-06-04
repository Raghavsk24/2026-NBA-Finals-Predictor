"use client";

/*
  engine 3 on the dashboard: the four factor player impact model and the interactive heart of the
  project. toggling a starter to injured or dragging his minutes reruns all five layers and the
  10,000 monte carlo simulations in the browser, so the prediction, the four factor radar and every
  projected stat line update live. the roster lab lines the two starting fives up by position so
  each knicks player sits across from the spur who guards him.
*/

import { Fragment, useMemo, useState } from "react";
import {
  predictLayered,
  buildDefenders,
  type LayeredPlayer,
  type Projection,
} from "@/lib/engines/layered";
import { engine3Data, seriesStart } from "@/lib/data";
import { TEAMS, type TeamKey } from "@/lib/teams";
import { WinProbabilityBar } from "@/components/WinProbabilityBar";
import { SeriesLengthBars } from "@/components/SeriesLengthBars";
import { FourFactorRadar } from "@/components/FourFactorRadar";
import { PlayerFourFactorRadar } from "@/components/PlayerFourFactorRadar";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fourFactorScores, PLAYER_BANDS } from "@/lib/fourfactors";
import { firstNum } from "@/lib/utils";

const defenders = buildDefenders(engine3Data);
const DEFAULT_INJURED = engine3Data.default_injured;
const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

// only the starting fives are exposed in the roster lab, indexed by position for the matchup grid
function startersByPos(key: TeamKey): Record<string, LayeredPlayer> {
  const map: Record<string, LayeredPlayer> = {};
  engine3Data.players[key].starters.forEach((p) => (map[p.pos] = p));
  return map;
}
const nykByPos = startersByPos("NYK");
const sasByPos = startersByPos("SAS");

export function Engine3Section() {
  const [injured, setInjured] = useState<Set<string>>(() => new Set(DEFAULT_INJURED));
  const [minutes, setMinutes] = useState<Record<string, number>>({});

  const result = useMemo(
    () => predictLayered(engine3Data, defenders, { injured, minutes }, 10000, 1, seriesStart),
    [injured, minutes]
  );

  const projByName = useMemo(() => {
    const map = new Map<string, Projection>();
    [...result.projections.NYK, ...result.projections.SAS].forEach((p) => map.set(p.name, p));
    return map;
  }, [result]);

  function toggleHealthy(name: string, healthy: boolean) {
    setInjured((prev) => {
      const next = new Set(prev);
      if (healthy) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function setPlayerMinutes(name: string, value: number) {
    setMinutes((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-4 sm:p-6 lg:col-span-3">
            <WinProbabilityBar nyk={result.series.NYK} sas={result.series.SAS} />
            <div className="mt-8">
              <SeriesLengthBars data={result.seriesLength} />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 lg:col-span-2">
            <p className="eyebrow text-[11px] text-walnut">Four Factor Efficiency</p>
            <FourFactorRadar nyk={result.effectiveFactors.NYK} sas={result.effectiveFactors.SAS} />
          </Card>
        </div>

        <Card className="p-4 sm:p-6">
          <div>
            <p className="stat-display text-2xl text-ink">Roster Lab</p>
            <p className="text-sm text-muted-foreground">
              Flip a starter to injured or drag his minutes to rebuild the series. Each Knick is
              lined up against the Spur who guards him.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
            {/* team headers act as the two column headers on larger screens only */}
            {(["NYK", "SAS"] as TeamKey[]).map((key) => (
              <div key={key} className="hidden items-center gap-2 sm:flex">
                <img src={TEAMS[key].logo} alt="" className="h-5 w-5 object-contain" />
                <span className="text-sm font-bold uppercase tracking-wide">{TEAMS[key].name}</span>
              </div>
            ))}

            {POSITIONS.map((pos) => {
              const nykP = nykByPos[pos];
              const sasP = sasByPos[pos];
              return (
                <Fragment key={pos}>
                  <PlayerCard
                    player={nykP}
                    teamKey="NYK"
                    teamColor={TEAMS.NYK.color}
                    injured={injured.has(nykP.name)}
                    minutesValue={nykP.name in minutes ? minutes[nykP.name] : nykP.min}
                    proj={projByName.get(nykP.name)}
                    onToggle={(healthy) => toggleHealthy(nykP.name, healthy)}
                    onMinutes={(m) => setPlayerMinutes(nykP.name, m)}
                  />
                  <PlayerCard
                    player={sasP}
                    teamKey="SAS"
                    teamColor={TEAMS.SAS.color}
                    injured={injured.has(sasP.name)}
                    minutesValue={sasP.name in minutes ? minutes[sasP.name] : sasP.min}
                    proj={projByName.get(sasP.name)}
                    onToggle={(healthy) => toggleHealthy(sasP.name, healthy)}
                    onMinutes={(m) => setPlayerMinutes(sasP.name, m)}
                  />
                </Fragment>
              );
            })}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function PlayerCard({
  player,
  teamKey,
  teamColor,
  injured,
  minutesValue,
  proj,
  onToggle,
  onMinutes,
}: {
  player: LayeredPlayer;
  teamKey: TeamKey;
  teamColor: string;
  injured: boolean;
  minutesValue: number;
  proj?: Projection;
  onToggle: (healthy: boolean) => void;
  onMinutes: (m: number) => void;
}) {
  const rating = fourFactorScores(player.efg, player.tov, player.oreb, player.ftr, PLAYER_BANDS).rating;
  return (
    <div
      className={`rounded-xl border p-3 transition-opacity ${injured ? "opacity-55" : ""}`}
      style={{ borderColor: injured ? "var(--border)" : teamColor + "55" }}
    >
      <div className="flex items-center gap-3">
        <img
          src={player.headshot}
          alt={player.name}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-full border border-border object-cover object-top"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{player.name}</span>
            <Tooltip>
              <TooltipTrigger
                aria-label={`${player.name} four factor efficiency chart`}
                className="inline-flex shrink-0 text-muted-foreground transition-colors hover:text-walnut"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
              </TooltipTrigger>
              <TooltipContent className="block w-auto max-w-none border border-border bg-white p-3 text-ink shadow-lg">
                <PlayerFourFactorRadar player={player} color={teamColor} />
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <img src={TEAMS[teamKey].logo} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
            <span>
              {player.pos} &middot; {(player.usg * 100).toFixed(0)}% usage &middot; Rating {rating}
            </span>
          </div>
        </div>
        <Switch
          checked={!injured}
          onCheckedChange={onToggle}
          aria-label={`${player.name} healthy`}
          className={teamKey === "SAS" ? "data-checked:bg-spurs" : undefined}
        />
      </div>

      {injured ? (
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            Injured
          </Badge>
          <span className="text-xs text-muted-foreground">toggle to add back</span>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="w-9 text-xs text-muted-foreground">MIN</span>
            <Slider
              min={0}
              max={42}
              step={1}
              value={[minutesValue]}
              onValueChange={(v) => onMinutes(firstNum(v))}
              className={
                teamKey === "SAS"
                  ? "[&_[data-slot=slider-range]]:bg-spurs [&_[data-slot=slider-thumb]]:border-spurs"
                  : undefined
              }
            />
            <span className="stat-display w-7 text-right text-base text-ink">
              {Math.round(minutesValue)}
            </span>
          </div>
          {proj && (
            <div className="mt-3 grid grid-cols-3 gap-1 text-center">
              <ProjStat label="PTS" value={proj.pts} color={teamColor} />
              <ProjStat label="REB" value={proj.reb} />
              <ProjStat label="AST" value={proj.ast} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProjStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-md bg-secondary py-1">
      <div className="stat-display text-base" style={{ color: color ?? "var(--ink)" }}>
        {value.toFixed(1)}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

