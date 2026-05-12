import {
  Booking,
  Match,
  MatchParticipant,
  MatchStatus,
  MatchType,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Team,
  TeamSelectionMode,
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

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

export interface CreateBookingInput {
  pitchId: string;
  userId: string;
  matchType: MatchType;
  startTime: Date;
  endTime: Date;
  totalCost: number;
  teamSelectionMode?: TeamSelectionMode;
  bookerTeam?: Team;
}

export interface CreateBookingResult {
  match: Match;
  booking: Booking;
  participant: MatchParticipant;
}

// Payments are mocked for the MVP — totalCost is recorded and paymentStatus
// is set directly to MOCKED_PAID. Stripe Connect integration will replace
// this flow later (see CLAUDE.md § Architectural Decisions).
export async function createBooking(
  input: CreateBookingInput,
  client: PrismaClient = defaultClient
): Promise<CreateBookingResult> {
  if (input.endTime <= input.startTime) {
    throw new BookingValidationError("endTime must be strictly after startTime");
  }

  const teamSelectionMode = input.teamSelectionMode ?? TeamSelectionMode.SELECTED;

  // SELECTED → booker must choose their team up front; RANDOM → team is null
  // and assigned later when the roster fills.
  let bookerTeam: Team | null;
  if (teamSelectionMode === TeamSelectionMode.SELECTED) {
    bookerTeam = input.bookerTeam ?? Team.HOME;
  } else {
    if (input.bookerTeam) {
      throw new BookingValidationError(
        "bookerTeam must not be supplied when teamSelectionMode is RANDOM"
      );
    }
    bookerTeam = null;
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
          teamSelectionMode,
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

      const participant = await tx.matchParticipant.create({
        data: {
          matchId: match.id,
          userId: input.userId,
          team: bookerTeam,
        },
      });

      return { match, booking, participant };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
