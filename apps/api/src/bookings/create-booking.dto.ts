export class CreateBookingDto {
  pitchId!: string;
  matchType!: "FRIENDLY" | "RANKED";
  startTime!: string;
  endTime!: string;
  totalCost!: number;
  teamSelectionMode?: "RANDOM" | "SELECTED";
  bookerTeam?: "HOME" | "AWAY";
}
