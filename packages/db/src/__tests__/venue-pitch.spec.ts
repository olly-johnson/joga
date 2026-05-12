import { prisma, cleanDatabase } from "./helpers/prisma-test";
import { PitchType } from "@prisma/client";

describe("Venue and Pitch models", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("Venue creation", () => {
    it("should create a venue with auto-generated UUID, lat/lon, and timestamps", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Goals Wembley",
          latitude: 51.5560,
          longitude: -0.2796,
        },
      });

      expect(venue.id).toBeDefined();
      expect(venue.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(venue.name).toBe("Goals Wembley");
      expect(venue.latitude).toBeCloseTo(51.5560);
      expect(venue.longitude).toBeCloseTo(-0.2796);
      expect(venue.stripeAccountId).toBeNull();
      expect(venue.createdAt).toBeInstanceOf(Date);
      expect(venue.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Venue with associated pitches", () => {
    it("should create a venue with multiple pitches of different types and surfaces", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Powerleague Shoreditch",
          latitude: 51.5265,
          longitude: -0.0780,
          pitches: {
            create: [
              { type: PitchType.FIVE_A_SIDE, surface: "3G" },
              { type: PitchType.FIVE_A_SIDE, surface: "4G" },
              { type: PitchType.SEVEN_A_SIDE, surface: "Concrete" },
            ],
          },
        },
        include: { pitches: true },
      });

      expect(venue.pitches).toHaveLength(3);
      const fiveASide = venue.pitches.filter(
        (p) => p.type === PitchType.FIVE_A_SIDE
      );
      const sevenASide = venue.pitches.filter(
        (p) => p.type === PitchType.SEVEN_A_SIDE
      );
      expect(fiveASide).toHaveLength(2);
      expect(sevenASide).toHaveLength(1);
      expect(venue.pitches.map((p) => p.surface).sort()).toEqual([
        "3G",
        "4G",
        "Concrete",
      ]);
      venue.pitches.forEach((p) => {
        expect(p.venueId).toBe(venue.id);
        expect(p.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe("Cascade delete", () => {
    it("should delete associated pitches when the venue is deleted", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Soccerdome Leeds",
          latitude: 53.8008,
          longitude: -1.5491,
          pitches: {
            create: [{ type: PitchType.SEVEN_A_SIDE, surface: "3G" }],
          },
        },
        include: { pitches: true },
      });
      expect(venue.pitches).toHaveLength(1);
      const pitchId = venue.pitches[0].id;

      await prisma.venue.delete({ where: { id: venue.id } });

      const orphan = await prisma.pitch.findUnique({
        where: { id: pitchId },
      });
      expect(orphan).toBeNull();
    });
  });
});
