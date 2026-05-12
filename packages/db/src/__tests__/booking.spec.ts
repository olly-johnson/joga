import {
  MatchStatus,
  MatchType,
  PaymentStatus,
  PitchType,
  Team,
  TeamSelectionMode,
} from "@prisma/client";
import {
  BookingConflictError,
  BookingValidationError,
  createBooking,
} from "../bookings/create-booking";
import { cleanDatabase, prisma } from "./helpers/prisma-test";

async function seedVenueWithPitch() {
  const venue = await prisma.venue.create({
    data: {
      name: "Test Arena",
      latitude: 51.5,
      longitude: -0.1,
      pitches: {
        create: [{ type: PitchType.FIVE_A_SIDE, surface: "3G" }],
      },
    },
    include: { pitches: true },
  });
  return { venue, pitch: venue.pitches[0] };
}

async function seedUser(suffix: string) {
  return prisma.user.create({
    data: {
      clerkId: `clerk_book_${suffix}`,
      email: `book_${suffix}@example.com`,
      firstName: "Book",
      lastName: suffix,
    },
  });
}

describe("createBooking service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it("creates a Match (BOOKED) and Booking (MOCKED_PAID) atomically for an available slot", async () => {
    const { pitch } = await seedVenueWithPitch();
    const user = await seedUser("happy");
    const start = new Date("2030-01-01T18:00:00Z");
    const end = new Date("2030-01-01T19:00:00Z");

    const { match, booking } = await createBooking({
      pitchId: pitch.id,
      userId: user.id,
      matchType: MatchType.FRIENDLY,
      startTime: start,
      endTime: end,
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });

    expect(match.pitchId).toBe(pitch.id);
    expect(match.matchType).toBe(MatchType.FRIENDLY);
    expect(match.status).toBe(MatchStatus.BOOKED);
    expect(match.startTime.toISOString()).toBe(start.toISOString());
    expect(match.endTime.toISOString()).toBe(end.toISOString());
    expect(match.refereeId).toBeNull();
    expect(match.homeScore).toBeNull();
    expect(match.awayScore).toBeNull();

    expect(booking.matchId).toBe(match.id);
    expect(booking.userId).toBe(user.id);
    expect(booking.paymentStatus).toBe(PaymentStatus.MOCKED_PAID);
    expect(booking.totalCost).toBe(4500);

    const persisted = await prisma.booking.findUnique({
      where: { matchId: match.id },
    });
    expect(persisted).not.toBeNull();

    const participants = await prisma.matchParticipant.findMany({
      where: { matchId: match.id },
    });
    expect(participants).toHaveLength(1);
    expect(participants[0].userId).toBe(user.id);
    expect(participants[0].team).toBe(Team.HOME);
    expect(match.teamSelectionMode).toBe(TeamSelectionMode.SELECTED);
  });

  it("RANDOM mode: booker is added as a participant with team=null", async () => {
    const { pitch } = await seedVenueWithPitch();
    const user = await seedUser("random");

    const { match } = await createBooking({
      pitchId: pitch.id,
      userId: user.id,
      matchType: MatchType.RANKED,
      startTime: new Date("2030-01-07T18:00:00Z"),
      endTime: new Date("2030-01-07T19:00:00Z"),
      totalCost: 4500,
      teamSelectionMode: TeamSelectionMode.RANDOM,
    });

    expect(match.teamSelectionMode).toBe(TeamSelectionMode.RANDOM);

    const participants = await prisma.matchParticipant.findMany({
      where: { matchId: match.id },
    });
    expect(participants).toHaveLength(1);
    expect(participants[0].userId).toBe(user.id);
    expect(participants[0].team).toBeNull();
  });

  it("rejects bookerTeam when teamSelectionMode is RANDOM", async () => {
    const { pitch } = await seedVenueWithPitch();
    const user = await seedUser("badmode");

    await expect(
      createBooking({
        pitchId: pitch.id,
        userId: user.id,
        matchType: MatchType.RANKED,
        startTime: new Date("2030-01-08T18:00:00Z"),
        endTime: new Date("2030-01-08T19:00:00Z"),
        totalCost: 4500,
        teamSelectionMode: TeamSelectionMode.RANDOM,
        bookerTeam: Team.HOME,
      })
    ).rejects.toBeInstanceOf(BookingValidationError);
  });

  it("rejects a booking when an existing match covers the exact same slot", async () => {
    const { pitch } = await seedVenueWithPitch();
    const userA = await seedUser("exactA");
    const userB = await seedUser("exactB");
    const start = new Date("2030-01-02T18:00:00Z");
    const end = new Date("2030-01-02T19:00:00Z");

    await createBooking({
      pitchId: pitch.id,
      userId: userA.id,
      matchType: MatchType.FRIENDLY,
      startTime: start,
      endTime: end,
      totalCost: 4500,
    });

    await expect(
      createBooking({
        pitchId: pitch.id,
        userId: userB.id,
        matchType: MatchType.FRIENDLY,
        startTime: start,
        endTime: end,
        totalCost: 4500,
      })
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("rejects a booking that partially overlaps an existing match on the same pitch", async () => {
    const { pitch } = await seedVenueWithPitch();
    const userA = await seedUser("overA");
    const userB = await seedUser("overB");

    await createBooking({
      pitchId: pitch.id,
      userId: userA.id,
      matchType: MatchType.FRIENDLY,
      startTime: new Date("2030-01-03T18:00:00Z"),
      endTime: new Date("2030-01-03T19:00:00Z"),
      totalCost: 4500,
    });

    await expect(
      createBooking({
        pitchId: pitch.id,
        userId: userB.id,
        matchType: MatchType.FRIENDLY,
        startTime: new Date("2030-01-03T18:30:00Z"),
        endTime: new Date("2030-01-03T19:30:00Z"),
        totalCost: 4500,
      })
    ).rejects.toBeInstanceOf(BookingConflictError);
  });

  it("allows back-to-back bookings where one ends exactly when the next starts", async () => {
    const { pitch } = await seedVenueWithPitch();
    const userA = await seedUser("adjA");
    const userB = await seedUser("adjB");

    const first = await createBooking({
      pitchId: pitch.id,
      userId: userA.id,
      matchType: MatchType.FRIENDLY,
      startTime: new Date("2030-01-04T18:00:00Z"),
      endTime: new Date("2030-01-04T19:00:00Z"),
      totalCost: 4500,
    });

    const second = await createBooking({
      pitchId: pitch.id,
      userId: userB.id,
      matchType: MatchType.FRIENDLY,
      startTime: new Date("2030-01-04T19:00:00Z"),
      endTime: new Date("2030-01-04T20:00:00Z"),
      totalCost: 4500,
    });

    expect(first.match.id).not.toBe(second.match.id);
  });

  it("allows identical time slots on different pitches", async () => {
    const venue = await prisma.venue.create({
      data: {
        name: "Two-Pitch Arena",
        latitude: 51.5,
        longitude: -0.1,
        pitches: {
          create: [
            { type: PitchType.FIVE_A_SIDE, surface: "3G" },
            { type: PitchType.SEVEN_A_SIDE, surface: "4G" },
          ],
        },
      },
      include: { pitches: true },
    });
    const userA = await seedUser("diffA");
    const userB = await seedUser("diffB");
    const start = new Date("2030-01-05T18:00:00Z");
    const end = new Date("2030-01-05T19:00:00Z");

    await createBooking({
      pitchId: venue.pitches[0].id,
      userId: userA.id,
      matchType: MatchType.FRIENDLY,
      startTime: start,
      endTime: end,
      totalCost: 4500,
    });

    const second = await createBooking({
      pitchId: venue.pitches[1].id,
      userId: userB.id,
      matchType: MatchType.RANKED,
      startTime: start,
      endTime: end,
      totalCost: 5500,
    });

    expect(second.booking.paymentStatus).toBe(PaymentStatus.MOCKED_PAID);
  });

  it("serializes concurrent bookings for the same slot — exactly one succeeds", async () => {
    const { pitch } = await seedVenueWithPitch();
    const userA = await seedUser("raceA");
    const userB = await seedUser("raceB");
    const start = new Date("2030-01-06T18:00:00Z");
    const end = new Date("2030-01-06T19:00:00Z");

    const results = await Promise.allSettled([
      createBooking({
        pitchId: pitch.id,
        userId: userA.id,
        matchType: MatchType.FRIENDLY,
        startTime: start,
        endTime: end,
        totalCost: 4500,
      }),
      createBooking({
        pitchId: pitch.id,
        userId: userB.id,
        matchType: MatchType.FRIENDLY,
        startTime: start,
        endTime: end,
        totalCost: 4500,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const matches = await prisma.match.findMany({ where: { pitchId: pitch.id } });
    expect(matches).toHaveLength(1);
  });
});
