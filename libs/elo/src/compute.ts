export interface EloInput {
  homeAvg: number;
  awayAvg: number;
  outcome: "home" | "away" | "draw";
  kFactor?: number;
}

export interface EloResult {
  homeDelta: number;
  awayDelta: number;
}

const DEFAULT_K = 32;

export function computeElo(input: EloInput): EloResult {
  const k = input.kFactor ?? DEFAULT_K;
  const expectedHome =
    1 / (1 + Math.pow(10, (input.awayAvg - input.homeAvg) / 400));

  const actualHome =
    input.outcome === "home" ? 1 : input.outcome === "draw" ? 0.5 : 0;

  const homeDelta = k * (actualHome - expectedHome);

  const roundedHome = Math.round(homeDelta * 100) / 100 || 0;
  const roundedAway = Math.round(-homeDelta * 100) / 100 || 0;

  return { homeDelta: roundedHome, awayDelta: roundedAway };
}
