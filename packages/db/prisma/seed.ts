import { PitchType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.venue.findFirst({ where: { name: "Joga Cage Brixton" } });
  if (existing) {
    console.log("Seed already present — skipping.");
    return;
  }

  const venue = await prisma.venue.create({
    data: {
      name: "Joga Cage Brixton",
      latitude: 51.4613,
      longitude: -0.1156,
      pitches: {
        create: [
          { type: PitchType.FIVE_A_SIDE, surface: "3G" },
          { type: PitchType.FIVE_A_SIDE, surface: "4G" },
        ],
      },
    },
    include: { pitches: true },
  });

  console.log(`Seeded venue "${venue.name}" with ${venue.pitches.length} pitches.`);
  console.log(
    "Users are created via POST /auth/sync when they sign up through the mobile app.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
