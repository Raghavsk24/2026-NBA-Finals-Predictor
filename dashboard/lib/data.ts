// typed access to the precomputed engine outputs. the json files are produced by the python
// engines and copied into dashboard/data, then imported here so they are baked into the build.

import engine1 from "@/data/engine1.json";
import engine2 from "@/data/engine2.json";
import engine3 from "@/data/engine3.json";
import players from "@/data/players.json";
import type { Engine3Data } from "@/lib/engines/layered";

export interface SeriesOdds {
  NYK: number;
  SAS: number;
}

export interface Engine1Data {
  engine: string;
  simulations: number;
  expected_pace: number;
  expected_score: SeriesOdds;
  per_game: { nyk_home: number; nyk_away: number; sas_home: number; sas_away: number };
  series: SeriesOdds;
  series_length: Record<string, number>;
  inputs: {
    NYK: { name: string; ortg: number; drtg: number; pace: number };
    SAS: { name: string; ortg: number; drtg: number; pace: number };
    league_avg_drtg: number;
  };
}

export interface Engine2Data {
  engine: string;
  simulations: number;
  elo: { NYK: number; SAS: number; start: number };
  elo_trajectory: { NYK: number[]; SAS: number[] };
  pythagorean: {
    NYK: { pf: number; pa: number; winpct: number };
    SAS: { pf: number; pa: number; winpct: number };
  };
  per_game: { nyk_home: number; nyk_away: number; sas_home: number; sas_away: number };
  series: SeriesOdds;
  series_length: Record<string, number>;
}

export interface RosterPlayer {
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
}

export interface PlayersData {
  NYK: {
    name: string;
    abbr: string;
    id: number;
    logo: string;
    color: string;
    starters: RosterPlayer[];
    bench: RosterPlayer[];
    injured: string[];
  };
  SAS: PlayersData["NYK"];
  matchups: { pos: string; nyk: string; sas: string }[];
}

export const engine1Data = engine1 as unknown as Engine1Data;
export const engine2Data = engine2 as unknown as Engine2Data;
export const engine3Data = engine3 as unknown as Engine3Data;
export const playersData = players as unknown as PlayersData;
