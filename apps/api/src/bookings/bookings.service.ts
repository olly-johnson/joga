import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { createBooking } from "@footballtomic/db";
import { CreateBookingDto } from "./create-booking.dto.js";
import { MatchType, Team, TeamSelectionMode } from "@footballtomic/db";

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBookingDto, userId: string) {
    return createBooking(
      {
        pitchId: dto.pitchId,
        userId,
        matchType: dto.matchType as MatchType,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        totalCost: dto.totalCost,
        teamSelectionMode: dto.teamSelectionMode as TeamSelectionMode | undefined,
        bookerTeam: dto.bookerTeam as Team | undefined,
      },
      this.prisma,
    );
  }
}
