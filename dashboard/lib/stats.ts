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

// play a best of seven until a team reaches four wins, given the knicks per game odds at
// home and on the road. returns the win counts so callers can also track series length.
export function simulateSeries(
  pNykHome: number,
  pNykAway: number
): { nyk: number; sas: number } {
  let nyk = 0;
  let sas = 0;
  for (let game = 0; game < 7; game++) {
    const sasHome = SAS_HOME_BY_GAME[game];
    const pNyk = sasHome ? pNykAway : pNykHome;
    if (Math.random() < pNyk) nyk++;
    else sas++;
    if (nyk === 4 || sas === 4) break;
  }
  return { nyk, sas };
}

// run the monte carlo loop and summarize series odds and how long the series lasts
export function monteCarlo(
  pNykHome: number,
  pNykAway: number,
  numSims = 10000
): { series: { NYK: number; SAS: number }; seriesLength: Record<string, number> } {
  let nykWins = 0;
  const lengths: Record<number, number> = { 4: 0, 5: 0, 6: 0, 7: 0 };
  for (let i = 0; i < numSims; i++) {
    const { nyk, sas } = simulateSeries(pNykHome, pNykAway);
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
