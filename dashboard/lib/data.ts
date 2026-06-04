// typed access to the precomputed engine outputs. the json files are produced by the python
// engines and copied into dashboard/data, then imported here so they are baked into the build.

import engine1 from "@/data/engine1.json";
import engine2 from "@/data/engine2.json";
import engine3 from "@/data/engine3.json";
import players from "@/data/players.json";
import series from "@/data/series.json";
import type { Engine3Data } from "@/lib/engines/layered";
import type { SeriesStart } from "@/lib/stats";

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

export interface SeriesGame {
  game: number;
  home: string;
  nyk: number;
  sas: number;
  winner: string;
}

export interface SeriesData {
  nyk_wins: number;
  sas_wins: number;
  games_played: number;
  next_game_index: number;
  display: SeriesGame[];
}

export const engine1Data = engine1 as unknown as Engine1Data;
export const engine2Data = engine2 as unknown as Engine2Data;
export const engine3Data = engine3 as unknown as Engine3Data;
export const playersData = players as unknown as PlayersData;
export const seriesData = series as unknown as SeriesData;

// the standing the dashboard simulations start from, so every engine continues the live series
export const seriesStart: SeriesStart = {
  nyk: seriesData.nyk_wins,
  sas: seriesData.sas_wins,
  game: seriesData.next_game_index,
};
