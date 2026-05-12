export interface Pitch {
  id: string;
  venueId: string;
  type: "FIVE_A_SIDE" | "SEVEN_A_SIDE";
  surface: string;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stripeAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  pitches: Pitch[];
}

export type Team = "HOME" | "AWAY";
export type TeamSelectionMode = "RANDOM" | "SELECTED";
export type MatchStatus = "OPEN" | "BOOKED" | "COMPLETED" | "CANCELLED";

export interface CreateBookingPayload {
  pitchId: string;
  matchType: "FRIENDLY" | "RANKED";
  startTime: string;
  endTime: string;
  totalCost: number;
  teamSelectionMode: TeamSelectionMode;
  bookerTeam?: Team;
}

export interface BookingResult {
  match: {
    id: string;
    pitchId: string;
    matchType: string;
    teamSelectionMode: TeamSelectionMode;
    startTime: string;
    endTime: string;
    status: MatchStatus;
  };
  booking: {
    id: string;
    matchId: string;
    userId: string;
    paymentStatus: string;
    totalCost: number;
  };
  participant: {
    id: string;
    matchId: string;
    userId: string;
    team: Team | null;
  };
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  team: Team | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MatchSummary {
  id: string;
  pitchId: string;
  matchType: "FRIENDLY" | "RANKED";
  teamSelectionMode: TeamSelectionMode;
  startTime: string;
  endTime: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  pitch: Pitch & { venue: Venue };
  participants: MatchParticipant[];
}

export interface MatchDetail extends MatchSummary {
  capacity: number;
}

export interface JoinMatchPayload {
  team?: Team;
}

export interface CompleteMatchPayload {
  homeScore: number;
  awayScore: number;
}

export interface RatingResponse {
  rating: number;
}
