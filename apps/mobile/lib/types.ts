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

export interface CreateBookingPayload {
  pitchId: string;
  matchType: "FRIENDLY" | "RANKED";
  startTime: string;
  endTime: string;
  totalCost: number;
}

export interface BookingResult {
  match: {
    id: string;
    pitchId: string;
    matchType: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  booking: {
    id: string;
    matchId: string;
    userId: string;
    paymentStatus: string;
    totalCost: number;
  };
}
