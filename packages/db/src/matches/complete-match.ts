import { Match, MatchStatus, PrismaClient, Team } from "@prisma/client";
import { prisma as defaultClient } from "../client";
import { processElo } from "../elo/process-elo";

export class MatchNotReadyError extends Error {
  constructor(message = "Match is not in a state that can be completed") {
    super(message);
    this.name = "MatchNotReadyError";
  }
}

export class MatchAlreadyCompletedError extends Error {
  constructor(message = "Match is already completed") {
    super(message);
    this.name = "MatchAlreadyCompletedError";
  }
}

export class UnassignedParticipantsError extends Error {
  constructor(message = "All participants must be assigned to a team") {
    super(message);
    this.name = "UnassignedParticipantsError";
  }
}

export class UnbalancedTeamsError extends Error {
  constructor(message = "Each side must have at least one participant") {
    super(message);
    this.name = "UnbalancedTeamsError";
  }
}

export interface CompleteMatchInput {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export async function completeMatch(
  input: CompleteMatchInput,
  client: PrismaClient = defaultClient
): Promise<Match> {
  const updated = await client.$transaction(async (tx) => {
    const match = await tx.match.findUniqueOrThrow({
      where: { id: input.matchId },
      include: { participants: true },
    });

    if (match.status === MatchStatus.COMPLETED) {
      throw new MatchAlreadyCompletedError();
    }
    if (match.status !== MatchStatus.BOOKED && match.status !== MatchStatus.OPEN) {
      throw new MatchNotReadyError();
    }

    if (match.participants.some((p) => p.team === null)) {
      throw new UnassignedParticipantsError();
    }

    const homeCount = match.participants.filter((p) => p.team === Team.HOME).length;
    const awayCount = match.participants.filter((p) => p.team === Team.AWAY).length;
    if (homeCount === 0 || awayCount === 0) {
      throw new UnbalancedTeamsError();
    }

    return tx.match.update({
      where: { id: input.matchId },
      data: {
        status: MatchStatus.COMPLETED,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
      },
    });
  });

  // processElo runs in its own transaction; it's idempotent.
  await processElo(input.matchId, client);

  return updated;
}
