import { MatchStatus, PrismaClient } from "@prisma/client";
import { computeElo } from "@footballtomic/elo";
import { prisma as defaultClient } from "../client";

const DEFAULT_RATING = 1000;

export async function processElo(
  matchId: string,
  client: PrismaClient = defaultClient
): Promise<void> {
  const existing = await client.eloRating.count({ where: { matchId } });
  if (existing > 0) return;

  const match = await client.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { participants: true },
  });

  if (match.status !== MatchStatus.COMPLETED) {
    throw new Error(`Match ${matchId} is not COMPLETED`);
  }
  if (match.homeScore === null || match.awayScore === null) {
    throw new Error(`Match ${matchId} has no scores`);
  }

  const outcome: "home" | "away" | "draw" =
    match.homeScore > match.awayScore
      ? "home"
      : match.homeScore < match.awayScore
        ? "away"
        : "draw";

  const ratings = await Promise.all(
    match.participants.map(async (p) => {
      const latest = await client.eloRating.findFirst({
        where: { userId: p.userId },
        orderBy: { createdAt: "desc" },
        select: { ratingAfter: true },
      });
      return { userId: p.userId, team: p.team, current: latest?.ratingAfter ?? DEFAULT_RATING };
    })
  );

  const homeParticipants = ratings.filter((r) => r.team === "HOME");
  const awayParticipants = ratings.filter((r) => r.team === "AWAY");

  const homeAvg =
    homeParticipants.reduce((sum, r) => sum + r.current, 0) / homeParticipants.length;
  const awayAvg =
    awayParticipants.reduce((sum, r) => sum + r.current, 0) / awayParticipants.length;

  const { homeDelta, awayDelta } = computeElo({ homeAvg, awayAvg, outcome });

  await client.$transaction(
    ratings.map((r) => {
      const delta = r.team === "HOME" ? homeDelta : awayDelta;
      return client.eloRating.create({
        data: {
          userId: r.userId,
          matchId,
          ratingBefore: r.current,
          ratingAfter: Math.round(r.current + delta),
        },
      });
    })
  );
}
