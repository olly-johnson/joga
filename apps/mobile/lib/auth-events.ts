/**
 * Decide whether to (idempotently) provision the local user row via
 * POST /auth/sync for a given Supabase auth event. We provision whenever a
 * session first becomes available — sign-in or a restored initial session —
 * but not on token refreshes (already provisioned) or sign-out.
 */
export function shouldProvisionOnAuthChange(
  event: string,
  hasSession: boolean,
): boolean {
  if (!hasSession) return false;
  return event === "SIGNED_IN" || event === "INITIAL_SESSION";
}
