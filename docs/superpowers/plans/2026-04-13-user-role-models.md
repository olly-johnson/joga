# User & Role Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the footballtomic monorepo and write the first failing integration tests for User and Role data models.

**Architecture:** pnpm monorepo with `apps/`, `packages/`, `libs/` workspaces. Prisma schema in `packages/db` defines User, Role enum, and UserRole join table. Integration tests hit a real PostgreSQL database via Prisma Client.

**Tech Stack:** pnpm, TypeScript, Prisma, PostgreSQL, Jest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `pnpm-workspace.yaml` | Create | Define monorepo workspace roots |
| `package.json` | Create | Root package.json with workspace scripts |
| `tsconfig.base.json` | Create | Shared TypeScript config |
| `.gitignore` | Create | Ignore node_modules, dist, .env, generated Prisma |
| `.env.example` | Create | Document required env vars |
| `packages/db/package.json` | Create | DB package deps (prisma, @prisma/client, jest, ts-jest) |
| `packages/db/tsconfig.json` | Create | Extends base tsconfig |
| `packages/db/jest.config.ts` | Create | Jest config for db package |
| `packages/db/prisma/schema.prisma` | Create | User, Role, UserRole models |
| `packages/db/src/client.ts` | Create | Exports a PrismaClient instance |
| `packages/db/src/__tests__/helpers/prisma-test.ts` | Create | Test setup/teardown helper |
| `packages/db/src/__tests__/user-role.spec.ts` | Create | Integration tests for User + Role models |
| `apps/api/.gitkeep` | Create | Placeholder |
| `apps/mobile/.gitkeep` | Create | Placeholder |
| `packages/shared/.gitkeep` | Create | Placeholder |
| `libs/elo/.gitkeep` | Create | Placeholder |
| `libs/dispatch/.gitkeep` | Create | Placeholder |
| `libs/payments/.gitkeep` | Create | Placeholder |

---

### Task 1: Scaffold Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/api/.gitkeep`
- Create: `apps/mobile/.gitkeep`
- Create: `packages/shared/.gitkeep`
- Create: `libs/elo/.gitkeep`
- Create: `libs/dispatch/.gitkeep`
- Create: `libs/payments/.gitkeep`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "footballtomic",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "dev": "echo 'TODO: turbo dev'",
    "test": "pnpm --filter @footballtomic/db test",
    "test:api": "echo 'TODO: api tests'",
    "lint": "echo 'TODO: lint'",
    "typecheck": "echo 'TODO: typecheck'",
    "db:migrate": "pnpm --filter @footballtomic/db db:migrate",
    "db:seed": "pnpm --filter @footballtomic/db db:seed",
    "db:studio": "pnpm --filter @footballtomic/db db:studio"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "libs/*"
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
*.env.local
.turbo/

# Prisma
packages/db/prisma/migrations/
packages/db/src/generated/
```

- [ ] **Step 5: Create .env.example**

```
# PostgreSQL connection string for local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/footballtomic_dev?schema=public"

# Test database (used by integration tests)
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/footballtomic_test?schema=public"
```

- [ ] **Step 6: Create placeholder directories**

```bash
mkdir -p apps/api apps/mobile packages/shared libs/elo libs/dispatch libs/payments
touch apps/api/.gitkeep apps/mobile/.gitkeep packages/shared/.gitkeep libs/elo/.gitkeep libs/dispatch/.gitkeep libs/payments/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example apps/ packages/shared/ libs/
git commit -m "chore: scaffold monorepo structure"
```

---

### Task 2: Set Up packages/db

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/jest.config.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@footballtomic/db",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^6.6.0"
  },
  "devDependencies": {
    "prisma": "^6.6.0",
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "@types/jest": "^29.5.0",
    "dotenv": "^16.4.0"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create packages/db/jest.config.ts**

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  setupFilesAfterSetup: [],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};

export default config;
```

- [ ] **Step 4: Install dependencies**

```bash
cd packages/db && pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/package.json packages/db/tsconfig.json packages/db/jest.config.ts packages/db/pnpm-lock.yaml
cd ../.. && git add pnpm-lock.yaml
git commit -m "chore: set up packages/db with prisma, jest, typescript"
```

---

### Task 3: Write the Prisma Schema

**Files:**
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/client.ts`

- [ ] **Step 1: Create the Prisma schema**

Create `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PLAYER
  CAPTAIN
  REFEREE
  VENUE_ADMIN
  SUPER_ADMIN
}

model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clerkId   String   @unique @map("clerk_id")
  email     String   @unique
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  roles UserRole[]

  @@map("users")
}

model UserRole {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      Role
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_roles")
}
```

- [ ] **Step 2: Create the Prisma client export**

Create `packages/db/src/client.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export { PrismaClient } from "@prisma/client";
export type { User, UserRole, Role } from "@prisma/client";
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/src/client.ts
git commit -m "feat: add prisma schema with User, Role enum, and UserRole models"
```

---

### Task 4: Write the Test Helper

**Files:**
- Create: `packages/db/src/__tests__/helpers/prisma-test.ts`

- [ ] **Step 1: Create the test helper**

Create `packages/db/src/__tests__/helpers/prisma-test.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const databaseUrl =
  process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL_TEST or DATABASE_URL must be set to run tests"
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function cleanDatabase(): Promise<void> {
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma, cleanDatabase };
```

- [ ] **Step 2: Commit**

```bash
git add packages/db/src/__tests__/helpers/prisma-test.ts
git commit -m "test: add prisma test helper with cleanup utility"
```

---

### Task 5: Write the Failing Integration Tests

**Files:**
- Create: `packages/db/src/__tests__/user-role.spec.ts`

- [ ] **Step 1: Write the test file**

Create `packages/db/src/__tests__/user-role.spec.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests — verify they FAIL**

```bash
cd packages/db && pnpm test
```

Expected: Tests fail because Prisma Client has not been generated and no database exists. Errors will include module resolution failures for `@prisma/client`. This is the red phase.

- [ ] **Step 3: Commit the failing tests**

```bash
git add packages/db/src/__tests__/user-role.spec.ts
git commit -m "test(red): add failing integration tests for User and Role models"
```

---

### Task 6: Make the Tests Pass (Green Phase)

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (already created — generate client)

- [ ] **Step 1: Create a .env file with your local database URL**

```bash
cp .env.example .env
```

Edit `.env` if your local Postgres credentials differ from the defaults.

- [ ] **Step 2: Create the test database**

```bash
createdb footballtomic_test
```

Or if using psql:

```bash
psql -U postgres -c "CREATE DATABASE footballtomic_test;"
```

- [ ] **Step 3: Run Prisma migrate to create tables**

```bash
cd packages/db && npx prisma migrate dev --name init
```

This generates the Prisma Client and creates the tables in the database.

- [ ] **Step 4: Run the tests — verify they PASS**

```bash
cd packages/db && pnpm test
```

Expected: All 4 tests pass:
- `should create a user with auto-generated UUID and timestamps` — PASS
- `should assign multiple roles to a single user` — PASS
- `should reject duplicate role assignment` — PASS
- `should fetch a user by clerkId with roles included` — PASS

- [ ] **Step 5: Commit the green phase**

```bash
git add -A
git commit -m "feat(green): prisma migration and generated client — all User/Role tests pass"
```

---

## Summary

| Task | What it does | Commit message |
|------|-------------|----------------|
| 1 | Scaffold monorepo | `chore: scaffold monorepo structure` |
| 2 | Set up packages/db | `chore: set up packages/db with prisma, jest, typescript` |
| 3 | Prisma schema | `feat: add prisma schema with User, Role enum, and UserRole models` |
| 4 | Test helper | `test: add prisma test helper with cleanup utility` |
| 5 | Failing tests (RED) | `test(red): add failing integration tests for User and Role models` |
| 6 | Make tests pass (GREEN) | `feat(green): prisma migration and generated client` |
