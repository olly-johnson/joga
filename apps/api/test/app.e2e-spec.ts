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

    it("RANDOM mode booking creates participant with team=null", async () => {
      const venue = await prisma.venue.create({
        data: {
          name: "Random Arena",
          latitude: 51.5,
          longitude: -0.1,
          pitches: { create: [{ type: "FIVE_A_SIDE", surface: "3G" }] },
        },
        include: { pitches: true },
      });
      const uid = "supabase-random-uid";
      await prisma.user.create({
        data: {
          clerkId: uid,
          email: "rand@example.com",
          firstName: "Rand",
          lastName: "Booker",
        },
      });
      const token = signTestToken(uid, "rand@example.com");

      const res = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pitchId: venue.pitches[0].id,
          matchType: "RANKED",
          startTime: "2030-06-10T18:00:00Z",
          endTime: "2030-06-10T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "RANDOM",
        });

      expect(res.status).toBe(201);
      expect(res.body.match.teamSelectionMode).toBe("RANDOM");
      expect(res.body.participant.team).toBeNull();
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

  describe("matches lifecycle (join + complete)", () => {
    async function seedPitch(name: string) {
      const venue = await prisma.venue.create({
        data: {
          name,
          latitude: 51.5,
          longitude: -0.1,
          pitches: { create: [{ type: "FIVE_A_SIDE", surface: "3G" }] },
        },
        include: { pitches: true },
      });
      return venue.pitches[0];
    }

    async function seedUserWithToken(uid: string, email: string) {
      await prisma.user.create({
        data: {
          clerkId: uid,
          email,
          firstName: "E2E",
          lastName: uid.slice(-4),
        },
      });
      return signTestToken(uid, email);
    }

    it("full happy path: book SELECTED → opponent joins → complete → ratings update", async () => {
      const pitch = await seedPitch("Lifecycle Arena");
      const bookerToken = await seedUserWithToken("life-booker", "life-b@example.com");
      const oppToken = await seedUserWithToken("life-opp", "life-o@example.com");

      // book as HOME
      const bookRes = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({
          pitchId: pitch.id,
          matchType: "RANKED",
          startTime: "2030-07-01T18:00:00Z",
          endTime: "2030-07-01T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "SELECTED",
          bookerTeam: "HOME",
        });
      expect(bookRes.status).toBe(201);
      const matchId = bookRes.body.match.id;

      // opponent joins AWAY
      const joinRes = await request(app.getHttpServer())
        .post(`/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${oppToken}`)
        .send({ team: "AWAY" });
      expect(joinRes.status).toBe(201);
      expect(joinRes.body.participant.team).toBe("AWAY");

      // GET /matches/:id reflects roster
      const detailRes = await request(app.getHttpServer()).get(`/matches/${matchId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.participants).toHaveLength(2);
      expect(detailRes.body.capacity).toBe(10);

      // complete with home win
      const compRes = await request(app.getHttpServer())
        .post(`/matches/${matchId}/complete`)
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({ homeScore: 3, awayScore: 1 });
      expect(compRes.status).toBe(200);
      expect(compRes.body.status).toBe("COMPLETED");

      // ratings updated
      const homeRatingRes = await request(app.getHttpServer())
        .get("/users/me/rating")
        .set("Authorization", `Bearer ${bookerToken}`);
      expect(homeRatingRes.status).toBe(200);
      expect(homeRatingRes.body.rating).toBeGreaterThan(1000);

      const awayRatingRes = await request(app.getHttpServer())
        .get("/users/me/rating")
        .set("Authorization", `Bearer ${oppToken}`);
      expect(awayRatingRes.status).toBe(200);
      expect(awayRatingRes.body.rating).toBeLessThan(1000);
    });

    it("GET /users/me/rating returns 1000 for a fresh user with no ratings", async () => {
      const token = await seedUserWithToken("fresh-uid", "fresh@example.com");
      const res = await request(app.getHttpServer())
        .get("/users/me/rating")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(1000);
    });

    it("GET /matches lists OPEN and BOOKED matches only", async () => {
      const pitch = await seedPitch("List Arena");
      const bookerToken = await seedUserWithToken("list-booker", "list-b@example.com");

      await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({
          pitchId: pitch.id,
          matchType: "FRIENDLY",
          startTime: "2030-07-02T18:00:00Z",
          endTime: "2030-07-02T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "RANDOM",
        })
        .expect(201);

      const res = await request(app.getHttpServer()).get("/matches");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("BOOKED");
      expect(res.body[0].teamSelectionMode).toBe("RANDOM");
    });

    it("rejects join when team is missing in SELECTED mode", async () => {
      const pitch = await seedPitch("Bad Join Arena");
      const bookerToken = await seedUserWithToken("bad-book", "bad-b@example.com");
      const joinerToken = await seedUserWithToken("bad-join", "bad-j@example.com");

      const bookRes = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({
          pitchId: pitch.id,
          matchType: "FRIENDLY",
          startTime: "2030-07-03T18:00:00Z",
          endTime: "2030-07-03T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "SELECTED",
          bookerTeam: "HOME",
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/matches/${bookRes.body.match.id}/join`)
        .set("Authorization", `Bearer ${joinerToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("returns 409 when the same user tries to join twice", async () => {
      const pitch = await seedPitch("Dup Join Arena");
      const bookerToken = await seedUserWithToken("dup-book", "dup-b@example.com");

      const bookRes = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({
          pitchId: pitch.id,
          matchType: "FRIENDLY",
          startTime: "2030-07-04T18:00:00Z",
          endTime: "2030-07-04T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "SELECTED",
          bookerTeam: "HOME",
        })
        .expect(201);

      // booker already a participant from createBooking
      const res = await request(app.getHttpServer())
        .post(`/matches/${bookRes.body.match.id}/join`)
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({ team: "AWAY" });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /users/me/matches", () => {
    async function seedPitchId(name: string) {
      const venue = await prisma.venue.create({
        data: {
          name,
          latitude: 51.5,
          longitude: -0.1,
          pitches: { create: [{ type: "FIVE_A_SIDE", surface: "3G" }] },
        },
        include: { pitches: true },
      });
      return venue.pitches[0].id;
    }

    it("rejects unauthenticated requests", async () => {
      const res = await request(app.getHttpServer()).get("/users/me/matches");
      expect(res.status).toBe(401);
    });

    it("returns an empty array for a user in no matches", async () => {
      await prisma.user.create({
        data: { clerkId: "mm-empty", email: "mme@example.com", firstName: "E", lastName: "E" },
      });
      const res = await request(app.getHttpServer())
        .get("/users/me/matches")
        .set("Authorization", `Bearer ${signTestToken("mm-empty")}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns matches the user booked and matches they joined, including completed ones", async () => {
      const pitchId = await seedPitchId("My Matches Arena");
      await prisma.user.create({
        data: { clerkId: "mm-booker", email: "mmb@example.com", firstName: "B", lastName: "B" },
      });
      await prisma.user.create({
        data: { clerkId: "mm-joiner", email: "mmj@example.com", firstName: "J", lastName: "J" },
      });
      const bookerToken = signTestToken("mm-booker");
      const joinerToken = signTestToken("mm-joiner");

      const book = await request(app.getHttpServer())
        .post("/bookings")
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({
          pitchId,
          matchType: "RANKED",
          startTime: "2030-09-01T18:00:00Z",
          endTime: "2030-09-01T19:00:00Z",
          totalCost: 4500,
          teamSelectionMode: "SELECTED",
          bookerTeam: "HOME",
        })
        .expect(201);
      const matchId = book.body.match.id;

      await request(app.getHttpServer())
        .post(`/matches/${matchId}/join`)
        .set("Authorization", `Bearer ${joinerToken}`)
        .send({ team: "AWAY" })
        .expect(201);

      // Booker (creator) sees it
      const bookerList = await request(app.getHttpServer())
        .get("/users/me/matches")
        .set("Authorization", `Bearer ${bookerToken}`);
      expect(bookerList.status).toBe(200);
      expect(bookerList.body).toHaveLength(1);
      expect(bookerList.body[0].id).toBe(matchId);
      expect(bookerList.body[0].pitch.venue.name).toBe("My Matches Arena");
      expect(bookerList.body[0].participants).toHaveLength(2);

      // Joiner sees it too
      const joinerList = await request(app.getHttpServer())
        .get("/users/me/matches")
        .set("Authorization", `Bearer ${joinerToken}`);
      expect(joinerList.body.map((m: any) => m.id)).toContain(matchId);

      // After completion it still appears, with status + scores
      await request(app.getHttpServer())
        .post(`/matches/${matchId}/complete`)
        .set("Authorization", `Bearer ${bookerToken}`)
        .send({ homeScore: 2, awayScore: 1 })
        .expect(200);

      const afterComplete = await request(app.getHttpServer())
        .get("/users/me/matches")
        .set("Authorization", `Bearer ${bookerToken}`);
      expect(afterComplete.body[0].status).toBe("COMPLETED");
      expect(afterComplete.body[0].homeScore).toBe(2);
      expect(afterComplete.body[0].awayScore).toBe(1);
    });
  });
});
