import {
  MatchStatus,
  MatchType,
  PitchType,
  Team,
} from "@prisma/client";
import { processElo } from "../elo/process-elo";
import { cleanDatabase, prisma } from "./helpers/prisma-test";

async function seedCompletedMatch() {
  const venue = await prisma.venue.create({
    data: {
      name: "ELO Arena",
      latitude: 51.5,
      longitude: -0.1,
      pitches: {
        create: [{ type: PitchType.FIVE_A_SIDE, surface: "3G" }],
      },
    },
    include: { pitches: true },
  });

  const [playerA, playerB] = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: "clerk_elo_a",
        email: "elo_a@example.com",
        firstName: "Alice",
        lastName: "Home",
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "clerk_elo_b",
        email: "elo_b@example.com",
        firstName: "Bob",
        lastName: "Away",
      },
    }),
  ]);

  const match = await prisma.match.create({
    data: {
      pitchId: venue.pitches[0].id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-06-01T18:00:00Z"),
      endTime: new Date("2030-06-01T19:00:00Z"),
      status: MatchStatus.COMPLETED,
      homeScore: 3,
      awayScore: 1,
    },
  });

  await Promise.all([
    prisma.matchParticipant.create({
      data: { matchId: match.id, userId: playerA.id, team: Team.HOME },
    }),
    prisma.matchParticipant.create({
      data: { matchId: match.id, userId: playerB.id, team: Team.AWAY },
    }),
  ]);

  return { match, playerA, playerB };
}

describe("processElo", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it("creates EloRating rows for both participants after a completed match", async () => {
    const { match, playerA, playerB } = await seedCompletedMatch();

    await processElo(match.id);

    const ratings = await prisma.eloRating.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "asc" },
    });

    expect(ratings).toHaveLength(2);

    const homeRating = ratings.find((r) => r.userId === playerA.id)!;
    const awayRating = ratings.find((r) => r.userId === playerB.id)!;

    expect(homeRating).toBeDefined();
    expect(awayRating).toBeDefined();

    // Both start at 1000; home win → home gains, away loses
    expect(homeRating.ratingAfter).toBeGreaterThan(1000);
    expect(awayRating.ratingAfter).toBeLessThan(1000);

    // Zero-sum
    const homeDelta = homeRating.ratingAfter - homeRating.ratingBefore;
    const awayDelta = awayRating.ratingAfter - awayRating.ratingBefore;
    expect(homeDelta + awayDelta).toBeCloseTo(0, 5);
  });

  it("uses existing ratings as the starting point (not always 1000)", async () => {
    const { match, playerA, playerB } = await seedCompletedMatch();

    // Manually seed prior ratings
    const priorMatch = await prisma.match.create({
      data: {
        pitchId: (await prisma.pitch.findFirst())!.id,
        matchType: MatchType.RANKED,
        startTime: new Date("2030-05-01T18:00:00Z"),
        endTime: new Date("2030-05-01T19:00:00Z"),
        status: MatchStatus.COMPLETED,
        homeScore: 1,
        awayScore: 0,
      },
    });

    await Promise.all([
      prisma.eloRating.create({
        data: {
          userId: playerA.id,
          matchId: priorMatch.id,
          ratingBefore: 1000,
          ratingAfter: 1100,
        },
      }),
      prisma.eloRating.create({
        data: {
          userId: playerB.id,
          matchId: priorMatch.id,
          ratingBefore: 1000,
          ratingAfter: 900,
        },
      }),
    ]);

    await processElo(match.id);

    const ratings = await prisma.eloRating.findMany({
      where: { matchId: match.id },
    });

    const homeRating = ratings.find((r) => r.userId === playerA.id)!;
    const awayRating = ratings.find((r) => r.userId === playerB.id)!;

    expect(homeRating.ratingBefore).toBe(1100);
    expect(awayRating.ratingBefore).toBe(900);
  });

  it("is idempotent — running twice does not create duplicate ratings", async () => {
    const { match } = await seedCompletedMatch();

    await processElo(match.id);
    await processElo(match.id);

    const count = await prisma.eloRating.count({
      where: { matchId: match.id },
    });
    expect(count).toBe(2);
  });
});
