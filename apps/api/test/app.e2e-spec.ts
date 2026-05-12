import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import jwt from "jsonwebtoken";
import { AppModule } from "./../src/app.module.js";
import { PrismaService } from "./../src/prisma/prisma.service.js";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

function signTestToken(sub: string, email?: string) {
  return jwt.sign(
    { sub, email, role: "authenticated" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("API (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "elo_ratings", "match_participants", "bookings", "matches", "user_roles", "users", "pitches", "venues" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "elo_ratings", "match_participants", "bookings", "matches", "user_roles", "users", "pitches", "venues" RESTART IDENTITY CASCADE',
    );
    await app.close();
  });

  describe("GET /venues", () => {
    it("returns an empty array when no venues exist", async () => {
      const res = await request(app.getHttpServer()).get("/venues");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns venues with nested pitches", async () => {
      await prisma.venue.create({
        data: {
          name: "Test Arena",
          latitude: 51.5,
          longitude: -0.1,
          pitches: {
            create: [
              { type: "FIVE_A_SIDE", surface: "3G" },
              { type: "SEVEN_A_SIDE", surface: "4G" },
            ],
          },
        },
      });

      const res = await request(app.getHttpServer()).get("/venues");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Test Arena");
      expect(res.body[0].pitches).toHaveLength(2);
      expect(res.body[0].pitches[0]).toHaveProperty("surface");
      expect(res.body[0].pitches[0]).toHaveProperty("type");
    });
  });

  describe("POST /auth/sync", () => {
    it("creates a new user from JWT claims", async () => {
      const token = signTestToken("supabase-uid-1", "test@example.com");

      const res = await request(app.getHttpServer())
        .post("/auth/sync")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.clerkId).toBe("supabase-uid-1");
      expect(res.body.email).toBe("test@example.com");
    });

    it("returns existing user on repeat sync", async () => {
      const token = signTestToken("supabase-uid-2", "repeat@example.com");

      const first = await request(app.getHttpServer())
        .post("/auth/sync")
        .set("Authorization", `Bearer ${token}`);

      const second = await request(app.getHttpServer())
        .post("/auth/sync")
        .set("Authorization", `Bearer ${token}`);

      expect(first.body.id).toBe(second.body.id);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await request(app.getHttpServer()).post("/auth/sync");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /bookings", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app.getHttpServer())
        .post("/bookings")
        .send({
          pitchId: "any",
          matchType: "FRIENDLY",
          startTime: "2030-06-01T18:00:00Z",
          endTime: "2030-06-01T19:00:00Z",
          totalCost: 4500,
        });

      expect(res.status).toBe(401);
    });

    it("creates a booking using userId from JWT", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Auth Arena",
          latitude: 51.5,
          longitude: -0.1,
          pitches: { create: [{ type: "FIVE_A_SIDE", surface: "3G" }] },
        },
        include: { pitches: true },
      });

      const supabaseUid = "supabase-booking-uid";
      const user = await prisma.user.create({
        data: {
          clerkId: supabaseUid,
          email: "booker@example.com",
          firstName: "Auth",
          lastName: "User",
        },
      });

      const token = signTestToken(supabaseUid, "booker@example.com");

      const res = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pitchId: venue.pitches[0].id,
          matchType: "FRIENDLY",
          startTime: "2030-06-01T18:00:00Z",
          endTime: "2030-06-01T19:00:00Z",
          totalCost: 4500,
        });

      expect(res.status).toBe(201);
      expect(res.body.match.status).toBe("BOOKED");
      expect(res.body.booking.userId).toBe(user.id);
      expect(res.body.booking.paymentStatus).toBe("MOCKED_PAID");
    });

    it("returns 409 on double-booking the same slot", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Conflict Arena",
          latitude: 51.5,
          longitude: -0.1,
          pitches: { create: [{ type: "FIVE_A_SIDE", surface: "3G" }] },
        },
        include: { pitches: true },
      });

      const userA = await prisma.user.create({
        data: {
          clerkId: "conflict-uid-a",
          email: "a@example.com",
          firstName: "A",
          lastName: "User",
        },
      });
      const userB = await prisma.user.create({
        data: {
          clerkId: "conflict-uid-b",
          email: "b@example.com",
          firstName: "B",
          lastName: "User",
        },
      });

      const payload = {
        pitchId: venue.pitches[0].id,
        matchType: "FRIENDLY",
        startTime: "2030-06-02T18:00:00Z",
        endTime: "2030-06-02T19:00:00Z",
        totalCost: 4500,
      };

      await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${signTestToken("conflict-uid-a")}`)
        .send(payload)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${signTestToken("conflict-uid-b")}`)
        .send(payload);

      expect(res.status).toBe(409);
    });
  });
});
