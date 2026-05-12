import { prisma, cleanDatabase } from "./helpers/prisma-test";
import { Role } from "@prisma/client";

describe("User and Role models", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("User creation", () => {
    it("should create a user with auto-generated UUID and timestamps", async () => {
      const user = await prisma.user.create({
        data: {
          clerkId: "clerk_test_123",
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      expect(user.id).toBeDefined();
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(user.clerkId).toBe("clerk_test_123");
      expect(user.email).toBe("john@example.com");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Role assignment", () => {
    it("should assign multiple roles to a single user", async () => {
      const user = await prisma.user.create({
        data: {
          clerkId: "clerk_multi_role",
          email: "multi@example.com",
          firstName: "Multi",
          lastName: "Role",
        },
      });

      await prisma.userRole.create({
        data: { userId: user.id, role: Role.PLAYER },
      });
      await prisma.userRole.create({
        data: { userId: user.id, role: Role.CAPTAIN },
      });

      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: true },
      });

      expect(userWithRoles!.roles).toHaveLength(2);
      const roleValues = userWithRoles!.roles.map((r) => r.role);
      expect(roleValues).toContain(Role.PLAYER);
      expect(roleValues).toContain(Role.CAPTAIN);
    });

    it("should reject duplicate role assignment", async () => {
      const user = await prisma.user.create({
        data: {
          clerkId: "clerk_dup_role",
          email: "dup@example.com",
          firstName: "Dup",
          lastName: "Role",
        },
      });

      await prisma.userRole.create({
        data: { userId: user.id, role: Role.PLAYER },
      });

      await expect(
        prisma.userRole.create({
          data: { userId: user.id, role: Role.PLAYER },
        })
      ).rejects.toThrow();
    });
  });

  describe("User query with roles", () => {
    it("should fetch a user by clerkId with roles included", async () => {
      await prisma.user.create({
        data: {
          clerkId: "clerk_ref_001",
          email: "referee@example.com",
          firstName: "Ref",
          lastName: "Eree",
          roles: {
            create: [{ role: Role.REFEREE }],
          },
        },
      });

      const found = await prisma.user.findUnique({
        where: { clerkId: "clerk_ref_001" },
        include: { roles: true },
      });

      expect(found).not.toBeNull();
      expect(found!.email).toBe("referee@example.com");
      expect(found!.roles).toHaveLength(1);
      expect(found!.roles[0].role).toBe(Role.REFEREE);
    });
  });
});
