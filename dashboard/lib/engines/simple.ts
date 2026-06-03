// browser port of engine 1, the pace adjusted efficiency model. it mirrors the python in
// engines/Simple_Efficiency_Prediction_Model.py so a user can move the home court slider and
// re run the 10,000 monte carlo simulations live.

import { normalCdf, monteCarlo, round1 } from "@/lib/stats";

export interface TeamEff {
  name: string;
  ortg: number;
  drtg: number;
  pace: number;
}

const GAME_MARGIN_SD = 13.0;

function expectedPace(a: TeamEff, b: TeamEff): number {
  return (a.pace + b.pace) / 2;
}

function adjustedOrtg(team: TeamEff, opp: TeamEff, leagueAvgDrtg: number): number {
  return team.ortg + (opp.drtg - leagueAvgDrtg);
}

function expectedPoints(team: TeamEff, opp: TeamEff, pace: number, leagueAvgDrtg: number): number {
  return (adjustedOrtg(team, opp, leagueAvgDrtg) / 100) * pace;
}

function nykWinProbability(
  nyk: TeamEff,
  sas: TeamEff,
  leagueAvgDrtg: number,
  homeCourtPoints: number,
  nykHome: boolean
): number {
  const pace = expectedPace(nyk, sas);
  let nykPts = expectedPoints(nyk, sas, pace, leagueAvgDrtg);
  let sasPts = expectedPoints(sas, nyk, pace, leagueAvgDrtg);
  if (nykHome) nykPts += homeCourtPoints;
  else sasPts += homeCourtPoints;
  return normalCdf(nykPts - sasPts, 0, GAME_MARGIN_SD);
}

export interface SimpleResult {
  series: { NYK: number; SAS: number };
  perGame: { nykHome: number; nykAway: number; sasHome: number; sasAway: number };
  seriesLength: Record<string, number>;
  expectedScore: { NYK: number; SAS: number };
  expectedPace: number;
}

// recompute the full engine for a given home court edge and number of simulations
export function runSimpleEngine(
  nyk: TeamEff,
  sas: TeamEff,
  leagueAvgDrtg: number,
  homeCourtPoints: number,
  numSims = 10000
): SimpleResult {
  const pace = expectedPace(nyk, sas);
  const pNykHome = nykWinProbability(nyk, sas, leagueAvgDrtg, homeCourtPoints, true);
  const pNykAway = nykWinProbability(nyk, sas, leagueAvgDrtg, homeCourtPoints, false);
  const { series, seriesLength } = monteCarlo(pNykHome, pNykAway, numSims);

  return {
    series,
    perGame: {
      nykHome: round1(pNykHome * 100),
      nykAway: round1(pNykAway * 100),
      sasHome: round1((1 - pNykAway) * 100),
      sasAway: round1((1 - pNykHome) * 100),
    },
    seriesLength,
    expectedScore: {
      NYK: round1(expectedPoints(nyk, sas, pace, leagueAvgDrtg)),
      SAS: round1(expectedPoints(sas, nyk, pace, leagueAvgDrtg)),
    },
    expectedPace: round1(pace),
  };
}
