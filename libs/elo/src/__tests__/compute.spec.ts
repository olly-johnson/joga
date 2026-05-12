import { computeElo } from "../compute";

describe("computeElo", () => {
  const K = 32;

  it("awards a small swing when the favourite wins (expected result)", () => {
    const result = computeElo({
      homeAvg: 1500,
      awayAvg: 1300,
      outcome: "home",
      kFactor: K,
    });

    // Expected score for home ≈ 0.759; delta ≈ 32 * (1 - 0.759) ≈ 7.71
    expect(result.homeDelta).toBeCloseTo(7.71, 0);
    expect(result.awayDelta).toBeCloseTo(-7.71, 0);
  });

  it("awards a large swing on an upset (underdog wins)", () => {
    const result = computeElo({
      homeAvg: 1300,
      awayAvg: 1500,
      outcome: "home",
      kFactor: K,
    });

    // Expected score for home ≈ 0.241; delta ≈ 32 * (1 - 0.241) ≈ 24.29
    expect(result.homeDelta).toBeCloseTo(24.29, 0);
    expect(result.awayDelta).toBeCloseTo(-24.29, 0);
  });

  it("splits evenly on a draw between equal teams", () => {
    const result = computeElo({
      homeAvg: 1400,
      awayAvg: 1400,
      outcome: "draw",
      kFactor: K,
    });

    // Expected score = 0.5 each; delta = 32 * (0.5 - 0.5) = 0
    expect(result.homeDelta).toBe(0);
    expect(result.awayDelta).toBe(0);
  });

  it("gives the weaker team positive delta on a draw", () => {
    const result = computeElo({
      homeAvg: 1200,
      awayAvg: 1400,
      outcome: "draw",
      kFactor: K,
    });

    // Home expected ≈ 0.241; delta ≈ 32 * (0.5 - 0.241) ≈ 8.29
    expect(result.homeDelta).toBeCloseTo(8.29, 0);
    expect(result.awayDelta).toBeCloseTo(-8.29, 0);
  });

  it("defaults K-factor to 32", () => {
    const result = computeElo({
      homeAvg: 1500,
      awayAvg: 1300,
      outcome: "home",
    });

    const explicit = computeElo({
      homeAvg: 1500,
      awayAvg: 1300,
      outcome: "home",
      kFactor: 32,
    });

    expect(result.homeDelta).toBe(explicit.homeDelta);
    expect(result.awayDelta).toBe(explicit.awayDelta);
  });

  it("produces zero-sum deltas (homeDelta + awayDelta === 0)", () => {
    const cases: Array<{ home: number; away: number; outcome: "home" | "away" | "draw" }> = [
      { home: 1000, away: 1000, outcome: "home" },
      { home: 1600, away: 1200, outcome: "away" },
      { home: 1350, away: 1450, outcome: "draw" },
    ];

    for (const c of cases) {
      const result = computeElo({
        homeAvg: c.home,
        awayAvg: c.away,
        outcome: c.outcome,
        kFactor: K,
      });
      expect(result.homeDelta + result.awayDelta).toBeCloseTo(0, 10);
    }
  });

  it("away win mirrors home win symmetrically", () => {
    const result = computeElo({
      homeAvg: 1500,
      awayAvg: 1300,
      outcome: "away",
      kFactor: K,
    });

    // Home expected ≈ 0.759; delta ≈ 32 * (0 - 0.759) ≈ -24.29
    expect(result.homeDelta).toBeCloseTo(-24.29, 0);
    expect(result.awayDelta).toBeCloseTo(24.29, 0);
  });
});
