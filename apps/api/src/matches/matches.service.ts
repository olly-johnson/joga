import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  completeMatch,
  joinMatch,
  Team,
  MatchStatus,
  capacityForPitch,
} from "@footballtomic/db";
import { JoinMatchDto } from "./join-match.dto.js";
import { CompleteMatchDto } from "./complete-match.dto.js";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.match.findMany({
      where: { status: { in: [MatchStatus.OPEN, MatchStatus.BOOKED] } },
      include: {
        pitch: { include: { venue: true } },
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        pitch: { include: { venue: true } },
        participants: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!match) return null;
    return {
      ...match,
      capacity: capacityForPitch(match.pitch.type),
    };
  }

  join(matchId: string, userId: string, dto: JoinMatchDto) {
    return joinMatch(
      {
        matchId,
        userId,
        team: dto.team as Team | undefined,
      },
      this.prisma,
    );
  }

  complete(matchId: string, dto: CompleteMatchDto) {
    return completeMatch(
      {
        matchId,
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
      },
      this.prisma,
    );
  }
}
