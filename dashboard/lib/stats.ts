// small numerical helpers shared by the browser side engine ports

// the 2-2-1-1-1 finals venue pattern, true means the game is played in san antonio
export const SAS_HOME_BY_GAME = [true, true, false, false, true, false, true];

// abramowitz and stegun approximation of the error function, accurate enough for win odds
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

// cumulative normal distribution, the engine 1 game model leans on this
export function normalCdf(x: number, mean = 0, sd = 1): number {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/*
  mulberry32, a tiny seeded pseudo random generator. using a fixed seed makes the monte carlo
  deterministic, which keeps the server rendered numbers and the client rendered numbers
  identical (no hydration mismatch) and also stops the odds from flickering on every slider move.
*/
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// the current finals standing the simulation should start from, namely each team's wins so far
// and the index of the next game to play. it defaults to an unplayed series.
export interface SeriesStart {
  nyk: number;
  sas: number;
  game: number;
}

const NO_START: SeriesStart = { nyk: 0, sas: 0, game: 0 };

// play out the rest of a best of seven from the current standing, drawing each game from the rng
export function simulateSeries(
  pNykHome: number,
  pNykAway: number,
  rng: () => number,
  start: SeriesStart = NO_START
): { nyk: number; sas: number } {
  let nyk = start.nyk;
  let sas = start.sas;
  if (nyk === 4 || sas === 4) return { nyk, sas };
  for (let game = start.game; game < 7; game++) {
    const sasHome = SAS_HOME_BY_GAME[game];
    const pNyk = sasHome ? pNykAway : pNykHome;
    if (rng() < pNyk) nyk++;
    else sas++;
    if (nyk === 4 || sas === 4) break;
  }
  return { nyk, sas };
}

// run the monte carlo loop and summarize series odds and how long the series lasts
export function monteCarlo(
  pNykHome: number,
  pNykAway: number,
  numSims = 10000,
  seed = 1,
  start: SeriesStart = NO_START
): { series: { NYK: number; SAS: number }; seriesLength: Record<string, number> } {
  const rng = makeRng(seed);
  let nykWins = 0;
  const lengths: Record<number, number> = { 4: 0, 5: 0, 6: 0, 7: 0 };
  for (let i = 0; i < numSims; i++) {
    const { nyk, sas } = simulateSeries(pNykHome, pNykAway, rng, start);
    if (nyk === 4) nykWins++;
    lengths[nyk + sas]++;
  }
  const nykPct = (nykWins / numSims) * 100;
  return {
    series: { NYK: round1(nykPct), SAS: round1(100 - nykPct) },
    seriesLength: {
      "4": round1((lengths[4] / numSims) * 100),
      "5": round1((lengths[5] / numSims) * 100),
      "6": round1((lengths[6] / numSims) * 100),
      "7": round1((lengths[7] / numSims) * 100),
    },
  };
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
