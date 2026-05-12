import {
  MatchParticipant,
  MatchStatus,
  PitchType,
  Prisma,
  PrismaClient,
  Team,
  TeamSelectionMode,
} from "@prisma/client";
import { prisma as defaultClient } from "../client";

export class MatchFullError extends Error {
  constructor(message = "Match is already at capacity") {
    super(message);
    this.name = "MatchFullError";
  }
}

export class MatchClosedError extends Error {
  constructor(message = "Match is not open to joiners") {
    super(message);
    this.name = "MatchClosedError";
  }
}

export class AlreadyJoinedError extends Error {
  constructor(message = "User is already a participant in this match") {
    super(message);
    this.name = "AlreadyJoinedError";
  }
}

export class TeamRequiredError extends Error {
  constructor(message = "team is required when teamSelectionMode is SELECTED") {
    super(message);
    this.name = "TeamRequiredError";
  }
}

export class TeamNotAllowedError extends Error {
  constructor(
    message = "team must not be supplied when teamSelectionMode is RANDOM"
  ) {
    super(message);
    this.name = "TeamNotAllowedError";
  }
}

export interface JoinMatchInput {
  matchId: string;
  userId: string;
  team?: Team;
}

export interface JoinMatchResult {
  participant: MatchParticipant;
}

export function capacityForPitch(type: PitchType): number {
  return type === PitchType.FIVE_A_SIDE ? 10 : 14;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function joinMatch(
  input: JoinMatchInput,
  client: PrismaClient = defaultClient
): Promise<JoinMatchResult> {
  return client.$transaction(
    async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        include: { pitch: true, participants: true },
      });
      if (!match) {
        throw new MatchClosedError(`Match ${input.matchId} not found`);
      }

      // Only OPEN or BOOKED matches accept joiners. createBooking sets BOOKED.
      if (
        match.status !== MatchStatus.OPEN &&
        match.status !== MatchStatus.BOOKED
      ) {
        throw new MatchClosedError();
      }

      const mode = match.teamSelectionMode;
      if (mode === TeamSelectionMode.SELECTED) {
        if (!input.team) throw new TeamRequiredError();
      } else {
        if (input.team) throw new TeamNotAllowedError();
      }

      if (match.participants.some((p) => p.userId === input.userId)) {
        throw new AlreadyJoinedError();
      }

      const capacity = capacityForPitch(match.pitch.type);
      if (match.participants.length >= capacity) {
        throw new MatchFullError();
      }

      const participant = await tx.matchParticipant.create({
        data: {
          matchId: input.matchId,
          userId: input.userId,
          team: input.team ?? null,
        },
      });

      // RANDOM mode: if the roster is now full, shuffle and assign HOME/AWAY 50/50.
      const newCount = match.participants.length + 1;
      if (mode === TeamSelectionMode.RANDOM && newCount === capacity) {
        const all = await tx.matchParticipant.findMany({
          where: { matchId: input.matchId },
          select: { id: true },
        });
        const shuffled = shuffle(all);
        const half = Math.floor(capacity / 2);
        const homeIds = shuffled.slice(0, half).map((p) => p.id);
        const awayIds = shuffled.slice(half).map((p) => p.id);

        await tx.matchParticipant.updateMany({
          where: { id: { in: homeIds } },
          data: { team: Team.HOME },
        });
        await tx.matchParticipant.updateMany({
          where: { id: { in: awayIds } },
          data: { team: Team.AWAY },
        });

        const refreshed = await tx.matchParticipant.findUnique({
          where: { id: participant.id },
        });
        return { participant: refreshed ?? participant };
      }

      return { participant };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
