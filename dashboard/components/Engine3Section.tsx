"use client";

// engine 3 on the dashboard: the four factor player impact model and the interactive heart of
// the project. toggling a player to injured or dragging his minutes reruns all five layers and
// the 10,000 monte carlo simulations in the browser, so the prediction, the four factor radar
// and every projected stat line update live.

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  predictLayered,
  buildDefenders,
  type LayeredPlayer,
  type Projection,
} from "@/lib/engines/layered";
import { engine3Data } from "@/lib/data";
import { TEAMS, type TeamKey } from "@/lib/teams";
import { WinProbabilityBar } from "@/components/WinProbabilityBar";
import { SeriesLengthBars } from "@/components/SeriesLengthBars";
import { FourFactorRadar } from "@/components/FourFactorRadar";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { firstNum } from "@/lib/utils";

const defenders = buildDefenders(engine3Data);
const DEFAULT_INJURED = engine3Data.default_injured;
const accuracy = engine3Data.model.train_accuracy;

function teamPlayers(key: TeamKey): LayeredPlayer[] {
  return [...engine3Data.players[key].starters, ...engine3Data.players[key].bench];
}

export function Engine3Section() {
  const [injured, setInjured] = useState<Set<string>>(() => new Set(DEFAULT_INJURED));
  const [minutes, setMinutes] = useState<Record<string, number>>({});

  const result = useMemo(
    () => predictLayered(engine3Data, defenders, { injured, minutes }, 10000, 1),
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

  function reset() {
    setInjured(new Set(DEFAULT_INJURED));
    setMinutes({});
  }

  const injuredList = [...injured];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-6">
          <WinProbabilityBar nyk={result.series.NYK} sas={result.series.SAS} />
          <div className="mt-8">
            <SeriesLengthBars data={result.seriesLength} />
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-[11px] text-muted-foreground">effective four factors</p>
            <Badge variant="outline" className="text-[11px]">
              model fit {(accuracy * 100).toFixed(1)}%
            </Badge>
          </div>
          <FourFactorRadar nyk={result.effectiveFactors.NYK} sas={result.effectiveFactors.SAS} />
          <div className="mt-1 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <Legend color={TEAMS.NYK.color} label="Knicks" />
            <Legend color={TEAMS.SAS.color} label="Spurs" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="stat-display text-2xl text-ink">Roster Lab</p>
            <p className="text-sm text-muted-foreground">
              Flip a player to injured or drag his minutes to rebuild the series.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {injuredList.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Out:{" "}
                <span className="font-semibold text-ink">{injuredList.join(", ")}</span>
              </span>
            )}
            <Button size="sm" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {(["NYK", "SAS"] as TeamKey[]).map((key) => (
            <div key={key}>
              <div className="mb-3 flex items-center gap-2">
                <img src={TEAMS[key].logo} alt="" className="h-5 w-5 object-contain" />
                <span className="text-sm font-bold uppercase tracking-wide">{TEAMS[key].name}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {teamPlayers(key).map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    teamColor={TEAMS[key].color}
                    injured={injured.has(player.name)}
                    minutesValue={player.name in minutes ? minutes[player.name] : player.min}
                    proj={projByName.get(player.name)}
                    onToggle={(healthy) => toggleHealthy(player.name, healthy)}
                    onMinutes={(m) => setPlayerMinutes(player.name, m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="eyebrow mb-4 text-[11px] text-muted-foreground">key matchups, projected points</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {engine3Data.players.matchups.map((m) => (
            <MatchupCard
              key={m.pos}
              pos={m.pos}
              nyk={projByName.get(m.nyk)}
              sas={projByName.get(m.sas)}
              nykName={m.nyk}
              sasName={m.sas}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlayerCard({
  player,
  teamColor,
  injured,
  minutesValue,
  proj,
  onToggle,
  onMinutes,
}: {
  player: LayeredPlayer;
  teamColor: string;
  injured: boolean;
  minutesValue: number;
  proj?: Projection;
  onToggle: (healthy: boolean) => void;
  onMinutes: (m: number) => void;
}) {
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
          <div className="truncate text-sm font-bold">{player.name}</div>
          <div className="text-xs text-muted-foreground">
            {player.pos} &middot; {player.usg ? `${(player.usg * 100).toFixed(0)}% usg` : ""}
          </div>
        </div>
        <Switch checked={!injured} onCheckedChange={onToggle} aria-label={`${player.name} healthy`} />
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

function MatchupCard({
  pos,
  nyk,
  sas,
  nykName,
  sasName,
}: {
  pos: string;
  nyk?: Projection;
  sas?: Projection;
  nykName: string;
  sasName: string;
}) {
  const nykPts = nyk?.pts ?? 0;
  const sasPts = sas?.pts ?? 0;
  const total = nykPts + sasPts || 1;
  const nykShare = (nykPts / total) * 100;

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {pos}
      </div>
      <MatchupSide name={nykName} proj={nyk} color={TEAMS.NYK.color} />
      <div className="my-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full"
          style={{ backgroundColor: TEAMS.NYK.color }}
          initial={false}
          animate={{ width: `${nykShare}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <MatchupSide name={sasName} proj={sas} color={TEAMS.SAS.color} />
    </div>
  );
}

function MatchupSide({
  name,
  proj,
  color,
}: {
  name: string;
  proj?: Projection;
  color: string;
}) {
  const last = name.split(" ").slice(-1)[0];
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {last}
      </span>
      {proj ? (
        <span className="stat-display text-lg" style={{ color }}>
          {proj.pts.toFixed(1)}
        </span>
      ) : (
        <span className="text-xs font-semibold text-destructive">OUT</span>
      )}
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
