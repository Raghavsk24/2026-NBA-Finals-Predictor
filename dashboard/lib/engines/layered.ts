// browser port of engine 3, the four factor player impact model. it mirrors the five layers
// in engines/four_factor_player_impact_model.py so the dashboard can recompute the prediction
// live as the user injures players or changes their minutes. the exported base indices from
// python are reused so the default lineup here lands on the exact same numbers.

import { sigmoid, monteCarlo, round1 } from "@/lib/stats";

export interface LayeredPlayer {
  name: string;
  pos: string;
  id: number;
  injured: boolean;
  headshot: string;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  ts: number;
  usg: number;
  stl: number;
  blk: number;
  drtg: number;
  dreb_pct: number;
  efg: number;
  tov: number;
  oreb: number;
  ftr: number;
}

export interface LayeredTeam {
  name: string;
  abbr: string;
  id: number;
  logo: string;
  color: string;
  starters: LayeredPlayer[];
  bench: LayeredPlayer[];
  injured: string[];
}

export interface Constants {
  league_avg_drtg: number;
  rep_ts: number;
  rep_usg: number;
  rep_reb_rate: number;
  usage_base: number;
  usage_bonus: number;
  efg_sens: number;
  oreb_sens: number;
  matchup_ts_sens: number;
  matchup_pts_sens: number;
}

export interface Model {
  features: string[];
  coef: number[];
  intercept: number;
  scaler_mean: number[];
  scaler_scale: number[];
  train_accuracy: number;
  n_games: number;
}

export interface FourFactors {
  efg: number;
  tov: number;
  oreb: number;
  ftr: number;
}

export interface BaseInfo {
  starter_target: number;
  offense_index: number;
  reb_index: number;
}

export interface Engine3Data {
  model: Model;
  schedule: boolean[];
  constants: Constants;
  base: { NYK: BaseInfo; SAS: BaseInfo };
  team_stats: { NYK: FourFactors; SAS: FourFactors };
  players: {
    NYK: LayeredTeam;
    SAS: LayeredTeam;
    matchups: { pos: string; nyk: string; sas: string }[];
  };
  default_injured: string[];
}

export interface LayeredConfig {
  injured: Set<string>;
  minutes: Record<string, number>;
}

export interface Projection {
  name: string;
  pos: string;
  headshot: string;
  minutes: number;
  pts: number;
  reb: number;
  ast: number;
}

export interface LayeredResult {
  series: { NYK: number; SAS: number };
  perGame: { nykHome: number; nykAway: number };
  seriesLength: Record<string, number>;
  effectiveFactors: { NYK: FourFactors; SAS: FourFactors };
  projections: { NYK: Projection[]; SAS: Projection[] };
}

type Alloc = { p: LayeredPlayer; minutes: number }[];

// map each starter to the man across from him, used by the matchup layer
export function buildDefenders(data: Engine3Data): Record<string, LayeredPlayer> {
  const defenders: Record<string, LayeredPlayer> = {};
  const sasByPos: Record<string, LayeredPlayer> = {};
  for (const p of data.players.SAS.starters) sasByPos[p.pos] = p;
  for (const nyk of data.players.NYK.starters) {
    const sas = sasByPos[nyk.pos];
    if (sas) {
      defenders[nyk.name] = sas;
      defenders[sas.name] = nyk;
    }
  }
  return defenders;
}

// layer 3 helper: a small positive number where higher means a tougher defender
function defenderStrength(defender: LayeredPlayer | null, c: Constants): number {
  if (!defender) return 0;
  const ratingPart = (c.league_avg_drtg - defender.drtg) / 100;
  const stocksPart = (defender.stl + defender.blk) * 0.01;
  return ratingPart + stocksPart;
}

// the man guarding this player, unless he is hurt, in which case no one is really on him
function matchupDefender(
  name: string,
  defenders: Record<string, LayeredPlayer>,
  injured: Set<string>
): LayeredPlayer | null {
  const d = defenders[name];
  if (!d || injured.has(d.name)) return null;
  return d;
}

// the available players for a team and the minutes they will play
function teamPool(team: LayeredTeam, injured: Set<string>, minutes: Record<string, number>): Alloc {
  const pool: Alloc = [];
  for (const p of [...team.starters, ...team.bench]) {
    if (injured.has(p.name)) continue;
    const mins = p.name in minutes ? minutes[p.name] : p.min;
    pool.push({ p, minutes: mins });
  }
  return pool;
}

// layer 4: conserve a fixed pool of starter minutes by scaling down overflow or filling a
// shortfall with replacement level minutes
function allocateMinutes(pool: Alloc, starterTarget: number): { alloc: Alloc; rep: number } {
  const desired = pool.reduce((s, x) => s + x.minutes, 0);
  if (desired > starterTarget && desired > 0) {
    const scale = starterTarget / desired;
    return { alloc: pool.map((x) => ({ p: x.p, minutes: x.minutes * scale })), rep: 0 };
  }
  return { alloc: pool, rep: Math.max(0, starterTarget - desired) };
}

// layer 2: offensive value blends shooting efficiency with shot creation
function offensiveQuality(adjTs: number, usg: number, c: Constants): number {
  return adjTs + c.usage_bonus * (usg - c.usage_base);
}

// layers 2, 3 and 4 combined into a scoring index and a rebounding index, both per minute
function teamIndices(
  alloc: Alloc,
  rep: number,
  defenders: Record<string, LayeredPlayer>,
  injured: Set<string>,
  c: Constants
): { offense: number; reb: number } {
  let minuteSum = 0;
  let qualityMinutes = 0;
  let rebMinutes = 0;
  for (const { p, minutes } of alloc) {
    const adjTs = p.ts - c.matchup_ts_sens * defenderStrength(matchupDefender(p.name, defenders, injured), c);
    minuteSum += minutes;
    qualityMinutes += offensiveQuality(adjTs, p.usg, c) * minutes;
    const rebPerMin = p.min ? p.reb / p.min : 0;
    rebMinutes += rebPerMin * minutes;
  }
  const repQuality = offensiveQuality(c.rep_ts, c.rep_usg, c);
  minuteSum += rep;
  qualityMinutes += repQuality * rep;
  rebMinutes += c.rep_reb_rate * rep;

  if (minuteSum === 0) return { offense: repQuality, reb: c.rep_reb_rate };
  return { offense: qualityMinutes / minuteSum, reb: rebMinutes / minuteSum };
}

// layer 1 shifted by the player layers, measured against the default lineup baseline
function effectiveFourFactors(
  teamStats: FourFactors,
  offense: number,
  reb: number,
  baseOffense: number,
  baseReb: number,
  c: Constants
): FourFactors {
  return {
    efg: teamStats.efg + c.efg_sens * (offense - baseOffense),
    tov: teamStats.tov,
    oreb: teamStats.oreb + c.oreb_sens * (reb - baseReb),
    ftr: teamStats.ftr,
  };
}

// layer 5: the ridge logistic regression turns the four factor edges into a single game odds
function nykGameProbability(nyk: FourFactors, sas: FourFactors, model: Model, nykHome: boolean): number {
  const raw = [
    nyk.efg - sas.efg,
    sas.tov - nyk.tov,
    nyk.oreb - sas.oreb,
    nyk.ftr - sas.ftr,
    nykHome ? 1 : 0,
  ];
  let logit = model.intercept;
  for (let i = 0; i < raw.length; i++) {
    const scale = model.scaler_scale[i];
    const z = scale ? (raw[i] - model.scaler_mean[i]) / scale : 0;
    logit += model.coef[i] * z;
  }
  return sigmoid(logit);
}

// projected finals stat lines, scaled by allocated minutes and softened by a healthy defender
function playerProjections(
  alloc: Alloc,
  defenders: Record<string, LayeredPlayer>,
  injured: Set<string>,
  c: Constants
): Projection[] {
  return alloc.map(({ p, minutes }) => {
    const minScale = p.min ? minutes / p.min : 0;
    const dStrength = defenderStrength(matchupDefender(p.name, defenders, injured), c);
    return {
      name: p.name,
      pos: p.pos,
      headshot: p.headshot,
      minutes: round1(minutes),
      pts: round1(Math.max(0, p.pts * minScale * (1 - c.matchup_pts_sens * dStrength))),
      reb: round1(Math.max(0, p.reb * minScale)),
      ast: round1(Math.max(0, p.ast * minScale)),
    };
  });
}

// run the full layered model for one configuration of injuries and minutes
export function predictLayered(
  data: Engine3Data,
  defenders: Record<string, LayeredPlayer>,
  config: LayeredConfig,
  numSims = 10000,
  seed = 1
): LayeredResult {
  const c = data.constants;
  const result: Partial<Record<"NYK" | "SAS", { factors: FourFactors; proj: Projection[] }>> = {};

  for (const key of ["NYK", "SAS"] as const) {
    const pool = teamPool(data.players[key], config.injured, config.minutes);
    const { alloc, rep } = allocateMinutes(pool, data.base[key].starter_target);
    const { offense, reb } = teamIndices(alloc, rep, defenders, config.injured, c);
    const factors = effectiveFourFactors(
      data.team_stats[key],
      offense,
      reb,
      data.base[key].offense_index,
      data.base[key].reb_index,
      c
    );
    result[key] = { factors, proj: playerProjections(alloc, defenders, config.injured, c) };
  }

  const nyk = result.NYK!.factors;
  const sas = result.SAS!.factors;
  const pNykHome = nykGameProbability(nyk, sas, data.model, true);
  const pNykAway = nykGameProbability(nyk, sas, data.model, false);
  const { series, seriesLength } = monteCarlo(pNykHome, pNykAway, numSims, seed);

  return {
    series,
    perGame: { nykHome: round1(pNykHome * 100), nykAway: round1(pNykAway * 100) },
    seriesLength,
    effectiveFactors: { NYK: nyk, SAS: sas },
    projections: { NYK: result.NYK!.proj, SAS: result.SAS!.proj },
  };
}
