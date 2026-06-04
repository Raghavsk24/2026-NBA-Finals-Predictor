// browser port of engine 2, the elo power rating model. the season elo and pythagorean win
// rates are fixed numbers computed in python, so here we only re blend them and re run the
// monte carlo when the user slides how much to trust elo versus pythagorean.

import { monteCarlo, round1, type SeriesStart } from "@/lib/stats";

const ELO_HOME_ADVANTAGE = 100.0;
const PYTH_HOME_BUMP = 0.035;

// bill james log5 turns two win rates into a head to head probability for the first team
function log5(a: number, b: number): number {
  const denom = a + b - 2 * a * b;
  if (denom === 0) return 0.5;
  return (a - a * b) / denom;
}

function perGameNykProb(
  nykHome: boolean,
  nykElo: number,
  sasElo: number,
  pythNyk: number,
  pythSas: number,
  blendElo: number
): number {
  const diff = nykElo - sasElo + (nykHome ? ELO_HOME_ADVANTAGE : -ELO_HOME_ADVANTAGE);
  const eloP = 1 / (1 + Math.pow(10, -diff / 400));

  let pythP = log5(pythNyk, pythSas) + (nykHome ? PYTH_HOME_BUMP : -PYTH_HOME_BUMP);
  pythP = Math.min(0.99, Math.max(0.01, pythP));

  return blendElo * eloP + (1 - blendElo) * pythP;
}

export interface EloResult {
  series: { NYK: number; SAS: number };
  perGame: { nykHome: number; nykAway: number; sasHome: number; sasAway: number };
  seriesLength: Record<string, number>;
}

// recompute the series for a given elo versus pythagorean blend weight
export function runEloEngine(
  nykElo: number,
  sasElo: number,
  pythNyk: number,
  pythSas: number,
  blendElo: number,
  numSims = 10000,
  seed = 1,
  start?: SeriesStart
): EloResult {
  const pNykHome = perGameNykProb(true, nykElo, sasElo, pythNyk, pythSas, blendElo);
  const pNykAway = perGameNykProb(false, nykElo, sasElo, pythNyk, pythSas, blendElo);
  const { series, seriesLength } = monteCarlo(pNykHome, pNykAway, numSims, seed, start);

  return {
    series,
    perGame: {
      nykHome: round1(pNykHome * 100),
      nykAway: round1(pNykAway * 100),
      sasHome: round1((1 - pNykAway) * 100),
      sasAway: round1((1 - pNykHome) * 100),
    },
    seriesLength,
  };
}
