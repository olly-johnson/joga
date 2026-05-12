import {
  MatchStatus,
  MatchType,
  PitchType,
  Team,
  TeamSelectionMode,
} from "@prisma/client";
import { createBooking } from "../bookings/create-booking";
import {
  completeMatch,
  MatchNotReadyError,
  MatchAlreadyCompletedError,
  UnassignedParticipantsError,
  UnbalancedTeamsError,
} from "../matches/complete-match";
import { joinMatch } from "../matches/join-match";
import { cleanDatabase, prisma } from "./helpers/prisma-test";

async function seedPitch() {
  const venue = await prisma.venue.create({
    data: {
      name: "Complete Arena",
      latitude: 51.5,
      longitude: -0.1,
      pitches: { create: [{ type: PitchType.FIVE_A_SIDE, surface: "3G" }] },
    },
    include: { pitches: true },
  });
  return venue.pitches[0];
}

async function seedUser(suffix: string) {
  return prisma.user.create({
    data: {
      clerkId: `clerk_comp_${suffix}`,
      email: `comp_${suffix}@example.com`,
      firstName: "Comp",
      lastName: suffix,
    },
  });
}

describe("completeMatch service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it("marks COMPLETED, sets scores, and runs ELO inline", async () => {
    const pitch = await seedPitch();
    const home = await seedUser("home_a");
    const away = await seedUser("away_a");
    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: home.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-03-01T18:00:00Z"),
      endTime: new Date("2030-03-01T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    await joinMatch({ matchId: match.id, userId: away.id, team: Team.AWAY });

    const updated = await completeMatch({
      matchId: match.id,
      homeScore: 3,
      awayScore: 1,
    });

    expect(updated.status).toBe(MatchStatus.COMPLETED);
    expect(updated.homeScore).toBe(3);
    expect(updated.awayScore).toBe(1);

    const ratings = await prisma.eloRating.findMany({ where: { matchId: match.id } });
    expect(ratings).toHaveLength(2);
    const homeRating = ratings.find((r) => r.userId === home.id)!;
    const awayRating = ratings.find((r) => r.userId === away.id)!;
    expect(homeRating.ratingAfter).toBeGreaterThan(1000);
    expect(awayRating.ratingAfter).toBeLessThan(1000);
  });

  it("throws when any participant has no team assigned", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("unassigned_booker");
    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: booker.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-03-02T18:00:00Z"),
      endTime: new Date("2030-03-02T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.RANDOM,
    });
    // booker has team=null in RANDOM mode; not yet at capacity

    await expect(
      completeMatch({ matchId: match.id, homeScore: 1, awayScore: 0 })
    ).rejects.toBeInstanceOf(UnassignedParticipantsError);
  });

  it("throws when one side has no participants", async () => {
    const pitch = await seedPitch();
    const homeA = await seedUser("solo_a");
    const homeB = await seedUser("solo_b");
    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: homeA.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-03-03T18:00:00Z"),
      endTime: new Date("2030-03-03T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    await joinMatch({ matchId: match.id, userId: homeB.id, team: Team.HOME });

    await expect(
      completeMatch({ matchId: match.id, homeScore: 1, awayScore: 0 })
    ).rejects.toBeInstanceOf(UnbalancedTeamsError);
  });

  it("throws when the match is already COMPLETED", async () => {
    const pitch = await seedPitch();
    const home = await seedUser("already_h");
    const away = await seedUser("already_a");
    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: home.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-03-04T18:00:00Z"),
      endTime: new Date("2030-03-04T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    await joinMatch({ matchId: match.id, userId: away.id, team: Team.AWAY });

    await completeMatch({ matchId: match.id, homeScore: 2, awayScore: 1 });

    await expect(
      completeMatch({ matchId: match.id, homeScore: 5, awayScore: 0 })
    ).rejects.toBeInstanceOf(MatchAlreadyCompletedError);
  });

  it("throws when the match is not BOOKED (e.g. CANCELLED)", async () => {
    const pitch = await seedPitch();
    const home = await seedUser("cancel_h");
    const away = await seedUser("cancel_a");
    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: home.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-03-05T18:00:00Z"),
      endTime: new Date("2030-03-05T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    await joinMatch({ matchId: match.id, userId: away.id, team: Team.AWAY });
    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.CANCELLED },
    });

    await expect(
      completeMatch({ matchId: match.id, homeScore: 1, awayScore: 0 })
    ).rejects.toBeInstanceOf(MatchNotReadyError);
  });
});
