import {
  composeSlot,
  formatSlotLabel,
  upcomingDates,
  bookingErrorMessage,
} from "./booking-slots";

describe("composeSlot", () => {
  it("builds a 1-hour ISO slot at the given local hour", () => {
    const date = new Date(2030, 5, 1); // 1 June 2030, local
    const { startISO, endISO } = composeSlot(date, 18);
    const start = new Date(startISO);
    const end = new Date(endISO);
    expect(start.getHours()).toBe(18);
    expect(start.getMinutes()).toBe(0);
    expect((end.getTime() - start.getTime()) / 3600000).toBe(1);
  });

  it("honours a custom duration", () => {
    const { startISO, endISO } = composeSlot(new Date(2030, 0, 1), 9, 2);
    const hours =
      (new Date(endISO).getTime() - new Date(startISO).getTime()) / 3600000;
    expect(hours).toBe(2);
  });
});

describe("upcomingDates", () => {
  it("returns `count` consecutive days starting from the given date", () => {
    const from = new Date(2030, 5, 1);
    const days = upcomingDates(from, 5);
    expect(days).toHaveLength(5);
    expect(days[0].getDate()).toBe(1);
    expect(days[4].getDate()).toBe(5);
    // each entry is normalised to midnight
    expect(days[0].getHours()).toBe(0);
  });
});

describe("formatSlotLabel", () => {
  it("includes the time range", () => {
    const label = formatSlotLabel(new Date(2030, 5, 1), 18);
    expect(label).toMatch(/18|6/); // 24h or 12h locale
  });
});

describe("bookingErrorMessage", () => {
  it("maps a 409 to a slot-conflict message", () => {
    const msg = bookingErrorMessage({ response: { status: 409 } });
    expect(msg.toLowerCase()).toContain("already booked");
  });

  it("prefers the server-provided message for a 400", () => {
    const msg = bookingErrorMessage({
      response: { status: 400, data: { message: "bookerTeam is required" } },
    });
    expect(msg).toBe("bookerTeam is required");
  });

  it("maps a 401 to a sign-in prompt", () => {
    const msg = bookingErrorMessage({ response: { status: 401 } });
    expect(msg.toLowerCase()).toContain("sign in");
  });

  it("falls back to a generic message when nothing else fits", () => {
    const msg = bookingErrorMessage(new Error("network down"));
    expect(msg.length).toBeGreaterThan(0);
  });
});
