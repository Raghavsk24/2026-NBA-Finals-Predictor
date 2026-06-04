/*
  shared four factor scoring. each factor is normalized to a 0 to 100 efficiency score within a
  sensible band (turnovers are inverted so that fewer turnovers scores higher), and the four
  scores are combined with oliver dean's factor weights into a single four factor efficiency
  rating. team and player four factors sit on different scales, so each level gets its own bands.
*/

export interface FourFactorBands {
  efg: [number, number];
  tov: [number, number];
  oreb: [number, number];
  ftr: [number, number];
}

export interface FourFactorScores {
  shooting: number;
  turnovers: number;
  rebounding: number;
  freeThrows: number;
  rating: number;
}

export const TEAM_BANDS: FourFactorBands = {
  efg: [0.5, 0.6],
  tov: [0.16, 0.1],
  oreb: [0.24, 0.36],
  ftr: [0.16, 0.3],
};

export const PLAYER_BANDS: FourFactorBands = {
  efg: [0.45, 0.65],
  tov: [0.18, 0.06],
  oreb: [0.0, 0.14],
  ftr: [0.08, 0.45],
};

const WEIGHTS = { shooting: 0.4, turnovers: 0.25, rebounding: 0.2, freeThrows: 0.15 };

// map a raw factor into a 0 to 100 score across a band, lo and hi may be inverted for turnovers
function score(value: number, band: [number, number]): number {
  const scaled = ((value - band[0]) / (band[1] - band[0])) * 100;
  return Math.max(0, Math.min(100, scaled));
}

export function fourFactorScores(
  efg: number,
  tov: number,
  oreb: number,
  ftr: number,
  bands: FourFactorBands
): FourFactorScores {
  const shooting = score(efg, bands.efg);
  const turnovers = score(tov, bands.tov);
  const rebounding = score(oreb, bands.oreb);
  const freeThrows = score(ftr, bands.ftr);
  const rating = Math.round(
    shooting * WEIGHTS.shooting +
      turnovers * WEIGHTS.turnovers +
      rebounding * WEIGHTS.rebounding +
      freeThrows * WEIGHTS.freeThrows
  );
  return { shooting, turnovers, rebounding, freeThrows, rating };
}
