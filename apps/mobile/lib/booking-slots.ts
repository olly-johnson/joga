/** Pure helpers for the booking screen's date/time slot selection + error copy. */

/** Build start/end ISO strings for a `durationHours` slot at the given local hour. */
export function composeSlot(date: Date, hour: number, durationHours = 1) {
  const start = new Date(date);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** `count` consecutive days from `from`, each normalised to local midnight. */
export function upcomingDates(from: Date, count: number): Date[] {
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Human-readable "18:00 – 19:00, 01/06/2030"-style label for a slot. */
export function formatSlotLabel(date: Date, hour: number, durationHours = 1): string {
  const { startISO, endISO } = composeSlot(date, hour, durationHours);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(startISO)} – ${fmt(endISO)}, ${date.toLocaleDateString()}`;
}

interface ApiErrorShape {
  response?: { status?: number; data?: { message?: string | string[] } };
  message?: string;
}

/** Map a booking request error to a user-facing message (works for axios errors). */
export function bookingErrorMessage(err: unknown): string {
  const e = err as ApiErrorShape;
  const status = e?.response?.status;
  const raw = e?.response?.data?.message;
  const serverText = Array.isArray(raw) ? raw.join(", ") : raw;

  if (status === 409)
    return "That pitch is already booked for this time slot. Pick another time.";
  if (status === 401) return "Your session expired — please sign in again.";
  if (status === 400)
    return serverText ?? "Please check your booking details and try again.";
  return serverText ?? e?.message ?? "Something went wrong. Please try again.";
}
