import type { MatchSummary, Pitch } from "./types";

export type SlotStatus = "FREE" | "JOINABLE" | "FULL" | "JOINED";

export interface SlotCell {
  pitch: Pitch;
  hour: number;
  status: SlotStatus;
  match?: MatchSummary;
}

export interface SlotRow {
  hour: number;
  cells: SlotCell[];
}

export function capacityForPitchType(type: Pitch["type"]): number {
  return type === "FIVE_A_SIDE" ? 10 : 14;
}

function isSameLocalDate(iso: string, date: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

/**
 * For each hour, classify every pitch's slot as FREE (no match → book),
 * JOINABLE (open match with spare capacity), JOINED (you're already in it),
 * or FULL (at capacity). `matches` should be the active (OPEN/BOOKED) set.
 */
export function buildSlotGrid(params: {
  pitches: Pitch[];
  matches: MatchSummary[];
  date: Date;
  hours: number[];
  myUserId?: string;
}): SlotRow[] {
  const { pitches, matches, date, hours, myUserId } = params;

  return hours.map((hour) => ({
    hour,
    cells: pitches.map((pitch): SlotCell => {
      const match = matches.find(
        (m) =>
          m.pitchId === pitch.id &&
          isSameLocalDate(m.startTime, date) &&
          new Date(m.startTime).getHours() === hour,
      );

      if (!match) return { pitch, hour, status: "FREE" };

      const mine =
        !!myUserId && match.participants.some((p) => p.userId === myUserId);
      if (mine) return { pitch, hour, status: "JOINED", match };

      const capacity = capacityForPitchType(pitch.type);
      if (match.participants.length >= capacity) {
        return { pitch, hour, status: "FULL", match };
      }
      return { pitch, hour, status: "JOINABLE", match };
    }),
  }));
}

export function splitMyMatches(matches: MatchSummary[]): {
  active: MatchSummary[];
  history: MatchSummary[];
} {
  const active: MatchSummary[] = [];
  const history: MatchSummary[] = [];
  for (const m of matches) {
    if (m.status === "OPEN" || m.status === "BOOKED") active.push(m);
    else history.push(m);
  }
  return { active, history };
}
