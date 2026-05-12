import { prisma } from "../../client";

async function cleanDatabase(): Promise<void> {
  // Supabase's pooler occasionally drops/refuses connections; retry transient
  // init errors a few times before giving up.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE "elo_ratings", "match_participants", "bookings", "matches", "user_roles", "users", "pitches", "venues" RESTART IDENTITY CASCADE'
      );
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export { prisma, cleanDatabase };
