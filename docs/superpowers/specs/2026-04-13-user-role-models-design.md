# User & Role Models — Design Spec

## Goal

Initialize the footballtomic monorepo and define the core User and Role data models with a first failing integration test. This is the foundation all other features build on.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth provider | Clerk | Managed identity, good React Native support |
| Role storage | Synced to DB | Platform needs DB joins for dispatch, ELO, payments |
| Multi-role | Yes, via join table | A user can be Player in one match, Captain in another |
| ORM | Prisma | Mature DX, solid migrations, good PostGIS path |
| First test scope | User + Role models only | Narrow, incremental, true TDD starting point |

## Data Models

### Role Enum (DB-level)

```
PLAYER | CAPTAIN | REFEREE | VENUE_ADMIN | SUPER_ADMIN
```

### User

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID v4 | PK, default `gen_random_uuid()` |
| clerk_id | String | Unique, not null |
| email | String | Unique, not null |
| first_name | String | Not null |
| last_name | String | Not null |
| created_at | DateTime | Default now |
| updated_at | DateTime | Auto-updated |

### UserRole (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID v4 | PK, default `gen_random_uuid()` |
| user_id | UUID | FK -> User, not null |
| role | Role enum | Not null |
| created_at | DateTime | Default now |

Unique constraint on `(user_id, role)` — prevents duplicate role assignments.

## Project Structure (scaffolded)

```
apps/
  api/               # NestJS backend (test runner lives here initially)
  mobile/            # Expo app (placeholder)
packages/
  shared/            # Shared types (placeholder)
  db/                # Prisma schema, migrations, test
    prisma/
      schema.prisma
    src/
      __tests__/
        user-role.spec.ts
        helpers/
          prisma-test.ts
libs/
  elo/               # Placeholder
  dispatch/          # Placeholder
  payments/          # Placeholder
```

Only `packages/db` and the test infrastructure get real content in this pass. Everything else is a placeholder directory to establish the monorepo shape.

## Prisma Schema

Provider: `postgresql`
Location: `packages/db/prisma/schema.prisma`

Defines:
- `Role` enum
- `User` model with fields per table above, relation to `UserRole`
- `UserRole` model with fields per table above, `@@unique([userId, role])`

## Test Plan

File: `packages/db/src/__tests__/user-role.spec.ts`

Test helper (`prisma-test.ts`):
- Creates a `PrismaClient` connected to `DATABASE_URL`
- Provides cleanup between tests (delete all rows from UserRole, then User)
- Disconnects after all tests

### Test Cases

1. **Create a user** — Insert a User with clerkId, email, firstName, lastName. Assert it gets an auto-generated UUID and timestamps.

2. **Assign multiple roles** — Create a User, then assign PLAYER and CAPTAIN roles. Query user with roles included. Assert both roles are present.

3. **Reject duplicate role** — Create a User with PLAYER role. Attempt to assign PLAYER again. Assert unique constraint violation error.

4. **Query user with roles** — Create a User with REFEREE role. Fetch by clerkId with roles included. Assert the role relation is populated correctly.

### Why These Tests Fail (Red Phase)

These tests will fail immediately because:
- The Prisma schema doesn't exist yet (no generated client)
- No database migrations have been run
- The test infrastructure doesn't exist

This is the intended TDD red phase — we write what we want, then make it pass.

## Test Infrastructure

- **Runner**: Jest
- **Database**: Real PostgreSQL (not mocked), per architectural patterns doc
- **Env**: `DATABASE_URL` in `.env.example` pointing to a local Postgres instance
- **Cleanup**: Truncate tables between tests to ensure isolation

## Out of Scope

- Clerk webhook sync endpoint (next cycle)
- NestJS auth guards / RolesGuard (next cycle)
- API routes (next cycle)
- Soft-delete (added when bookings/payments need it)
- Referee location / PostGIS columns (added with dispatch module)
