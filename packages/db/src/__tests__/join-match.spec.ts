import {
  MatchStatus,
  MatchType,
  PitchType,
  Team,
  TeamSelectionMode,
} from "@prisma/client";
import { createBooking } from "../bookings/create-booking";
import {
  joinMatch,
  MatchFullError,
  MatchClosedError,
  AlreadyJoinedError,
  TeamRequiredError,
  TeamNotAllowedError,
} from "../matches/join-match";
import { cleanDatabase, prisma } from "./helpers/prisma-test";

async function seedPitch(type: PitchType = PitchType.FIVE_A_SIDE) {
  const venue = await prisma.venue.create({
    data: {
      name: "Join Arena",
      latitude: 51.5,
      longitude: -0.1,
      pitches: { create: [{ type, surface: "3G" }] },
    },
    include: { pitches: true },
  });
  return venue.pitches[0];
}

async function seedUser(suffix: string) {
  return prisma.user.create({
    data: {
      clerkId: `clerk_join_${suffix}`,
      email: `join_${suffix}@example.com`,
      firstName: "Join",
      lastName: suffix,
    },
  });
}

async function bookMatch(opts: {
  pitchId: string;
  userId: string;
  mode: TeamSelectionMode;
  bookerTeam?: Team;
  startTime?: Date;
}) {
  return createBooking({
    pitchId: opts.pitchId,
    userId: opts.userId,
    matchType: MatchType.FRIENDLY,
    startTime: opts.startTime ?? new Date("2030-02-01T18:00:00Z"),
    endTime: new Date((opts.startTime ?? new Date("2030-02-01T18:00:00Z")).getTime() + 60 * 60 * 1000),
    totalCost: 4500,
    teamSelectionMode: opts.mode,
    bookerTeam: opts.bookerTeam,
  });
}

describe("joinMatch service", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it("SELECTED mode: joiner is added with the team they chose", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("sel_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });

    const joiner = await seedUser("sel_joiner");
    const result = await joinMatch({ matchId: match.id, userId: joiner.id, team: Team.AWAY });

    expect(result.participant.team).toBe(Team.AWAY);

    const participants = await prisma.matchParticipant.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "asc" },
    });
    expect(participants).toHaveLength(2);
    expect(participants.find((p) => p.userId === joiner.id)?.team).toBe(Team.AWAY);
  });

  it("SELECTED mode: rejects join with no team", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("sel_no_team_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    const joiner = await seedUser("sel_no_team_joiner");

    await expect(
      joinMatch({ matchId: match.id, userId: joiner.id })
    ).rejects.toBeInstanceOf(TeamRequiredError);
  });

  it("RANDOM mode: joiner is added with team=null", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("rand_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.RANDOM,
    });

    const joiner = await seedUser("rand_joiner");
    const result = await joinMatch({ matchId: match.id, userId: joiner.id });

    expect(result.participant.team).toBeNull();
  });

  it("RANDOM mode: rejects join that supplies a team", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("rand_extra_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.RANDOM,
    });
    const joiner = await seedUser("rand_extra_joiner");

    await expect(
      joinMatch({ matchId: match.id, userId: joiner.id, team: Team.HOME })
    ).rejects.toBeInstanceOf(TeamNotAllowedError);
  });

  it("RANDOM mode: when the roster fills to capacity, teams are auto-assigned 50/50", async () => {
    const pitch = await seedPitch(PitchType.FIVE_A_SIDE); // capacity 10
    const booker = await seedUser("autobook");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.RANDOM,
    });

    // 9 more joiners → total 10 = capacity
    const joiners = await Promise.all(
      Array.from({ length: 9 }).map((_, i) => seedUser(`autojoin_${i}`))
    );
    for (const j of joiners) {
      await joinMatch({ matchId: match.id, userId: j.id });
    }

    const participants = await prisma.matchParticipant.findMany({
      where: { matchId: match.id },
    });
    expect(participants).toHaveLength(10);
    const home = participants.filter((p) => p.team === Team.HOME);
    const away = participants.filter((p) => p.team === Team.AWAY);
    expect(home).toHaveLength(5);
    expect(away).toHaveLength(5);
    expect(participants.every((p) => p.team !== null)).toBe(true);
  });

  it("rejects join when the match is already at capacity", async () => {
    const pitch = await seedPitch(PitchType.FIVE_A_SIDE);
    const booker = await seedUser("full_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });

    // fill to 10 with SELECTED joins (4 more HOME, 5 AWAY → 10 total)
    for (let i = 0; i < 4; i++) {
      const u = await seedUser(`full_home_${i}`);
      await joinMatch({ matchId: match.id, userId: u.id, team: Team.HOME });
    }
    for (let i = 0; i < 5; i++) {
      const u = await seedUser(`full_away_${i}`);
      await joinMatch({ matchId: match.id, userId: u.id, team: Team.AWAY });
    }

    const eleventh = await seedUser("full_extra");
    await expect(
      joinMatch({ matchId: match.id, userId: eleventh.id, team: Team.HOME })
    ).rejects.toBeInstanceOf(MatchFullError);
  });

  it("rejects join when the user is already a participant", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("dup_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });

    await expect(
      joinMatch({ matchId: match.id, userId: booker.id, team: Team.AWAY })
    ).rejects.toBeInstanceOf(AlreadyJoinedError);
  });

  it("rejects join when the match is COMPLETED", async () => {
    const pitch = await seedPitch();
    const booker = await seedUser("closed_booker");
    const { match } = await bookMatch({
      pitchId: pitch.id,
      userId: booker.id,
      mode: TeamSelectionMode.SELECTED,
      bookerTeam: Team.HOME,
    });
    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.COMPLETED, homeScore: 1, awayScore: 0 },
    });

    const latecomer = await seedUser("closed_late");
    await expect(
      joinMatch({ matchId: match.id, userId: latecomer.id, team: Team.AWAY })
    ).rejects.toBeInstanceOf(MatchClosedError);
  });
});
