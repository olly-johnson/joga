import {
  Booking,
  Match,
  MatchStatus,
  MatchType,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma as defaultClient } from "../client";

export class BookingConflictError extends Error {
  constructor(
    message = "Pitch is not available for the requested time slot"
  ) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export interface CreateBookingInput {
  pitchId: string;
  userId: string;
  matchType: MatchType;
  startTime: Date;
  endTime: Date;
  totalCost: number;
}

export interface CreateBookingResult {
  match: Match;
  booking: Booking;
}

// Payments are mocked for the MVP — totalCost is recorded and paymentStatus
// is set directly to MOCKED_PAID. Stripe Connect integration will replace
// this flow later (see CLAUDE.md § Architectural Decisions).
export async function createBooking(
  input: CreateBookingInput,
  client: PrismaClient = defaultClient
): Promise<CreateBookingResult> {
  if (input.endTime <= input.startTime) {
    throw new Error("endTime must be strictly after startTime");
  }

  return client.$transaction(
    async (tx) => {
      const conflict = await tx.match.findFirst({
        where: {
          pitchId: input.pitchId,
          status: { not: MatchStatus.CANCELLED },
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new BookingConflictError();
      }

      const match = await tx.match.create({
        data: {
          pitchId: input.pitchId,
          matchType: input.matchType,
          startTime: input.startTime,
          endTime: input.endTime,
          status: MatchStatus.BOOKED,
        },
      });

      const booking = await tx.booking.create({
        data: {
          matchId: match.id,
          userId: input.userId,
          paymentStatus: PaymentStatus.MOCKED_PAID,
          totalCost: input.totalCost,
        },
      });

      return { match, booking };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
