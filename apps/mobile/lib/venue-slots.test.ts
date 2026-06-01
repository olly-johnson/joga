import {
  buildSlotGrid,
  splitMyMatches,
  capacityForPitchType,
} from "./venue-slots";
import type { MatchSummary, Pitch } from "./types";

const pitch = (id: string, type: Pitch["type"] = "FIVE_A_SIDE"): Pitch => ({
  id,
  venueId: "v1",
  type,
  surface: "3G",
  createdAt: "",
  updatedAt: "",
});

function match(
  partial: Partial<MatchSummary> & { pitchId: string; startTime: string },
): MatchSummary {
  return {
    id: partial.id ?? "m-" + partial.pitchId + partial.startTime,
    pitchId: partial.pitchId,
    matchType: "RANKED",
    teamSelectionMode: "SELECTED",
    startTime: partial.startTime,
    endTime: partial.startTime,
    status: partial.status ?? "BOOKED",
    homeScore: null,
    awayScore: null,
    pitch: { ...pitch(partial.pitchId), venue: {} as any },
    participants: partial.participants ?? [],
  };
}

const participants = (n: number, mine?: string) =>
  Array.from({ length: n }, (_, i) => ({
    id: "p" + i,
    matchId: "m",
    userId: mine && i === 0 ? mine : "other-" + i,
    team: null,
    createdAt: "",
  }));

describe("capacityForPitchType", () => {
  it("is 10 for 5-a-side and 14 for 7-a-side", () => {
    expect(capacityForPitchType("FIVE_A_SIDE")).toBe(10);
    expect(capacityForPitchType("SEVEN_A_SIDE")).toBe(14);
  });
});

describe("buildSlotGrid", () => {
  const date = new Date(2030, 5, 1);
  const hours = [18, 19];
  const pitches = [pitch("pA"), pitch("pB")];

  it("marks a slot FREE when no match exists", () => {
    const grid = buildSlotGrid({ pitches, matches: [], date, hours });
    expect(grid).toHaveLength(2);
    expect(grid[0].hour).toBe(18);
    expect(grid[0].cells.every((c) => c.status === "FREE")).toBe(true);
  });

  it("marks a slot JOINABLE when a match has spare capacity", () => {
    const m = match({
      pitchId: "pA",
      startTime: new Date(2030, 5, 1, 18).toISOString(),
      participants: participants(3),
    });
    const grid = buildSlotGrid({ pitches, matches: [m], date, hours });
    const cell = grid[0].cells.find((c) => c.pitch.id === "pA")!;
    expect(cell.status).toBe("JOINABLE");
    expect(cell.match?.id).toBe(m.id);
  });

  it("marks a slot FULL when the match is at capacity", () => {
    const m = match({
      pitchId: "pA",
      startTime: new Date(2030, 5, 1, 18).toISOString(),
      participants: participants(10),
    });
    const grid = buildSlotGrid({ pitches, matches: [m], date, hours });
    expect(grid[0].cells.find((c) => c.pitch.id === "pA")!.status).toBe("FULL");
  });

  it("marks a slot JOINED when the current user is already in it", () => {
    const m = match({
      pitchId: "pA",
      startTime: new Date(2030, 5, 1, 18).toISOString(),
      participants: participants(3, "me"),
    });
    const grid = buildSlotGrid({ pitches, matches: [m], date, hours, myUserId: "me" });
    expect(grid[0].cells.find((c) => c.pitch.id === "pA")!.status).toBe("JOINED");
  });

  it("ignores matches on a different date", () => {
    const m = match({
      pitchId: "pA",
      startTime: new Date(2030, 5, 2, 18).toISOString(), // next day
      participants: participants(3),
    });
    const grid = buildSlotGrid({ pitches, matches: [m], date, hours });
    expect(grid[0].cells.find((c) => c.pitch.id === "pA")!.status).toBe("FREE");
  });
});

describe("splitMyMatches", () => {
  it("partitions active (OPEN/BOOKED) from history (COMPLETED/CANCELLED)", () => {
    const ms: MatchSummary[] = [
      match({ pitchId: "p1", startTime: "2030-01-01", status: "BOOKED" }),
      match({ pitchId: "p2", startTime: "2030-01-02", status: "OPEN" }),
      match({ pitchId: "p3", startTime: "2030-01-03", status: "COMPLETED" }),
      match({ pitchId: "p4", startTime: "2030-01-04", status: "CANCELLED" }),
    ];
    const { active, history } = splitMyMatches(ms);
    expect(active.map((m) => m.status).sort()).toEqual(["BOOKED", "OPEN"]);
    expect(history.map((m) => m.status).sort()).toEqual(["CANCELLED", "COMPLETED"]);
  });
});
