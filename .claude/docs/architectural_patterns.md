# Architectural Patterns

Conventions and design decisions that apply across the codebase.

## Backend (NestJS)

### Module Organization
Each domain feature is a self-contained NestJS module under `apps/api/src/modules/`. A module contains:
- `*.controller.ts` — HTTP route handlers only; no business logic
- `*.service.ts` — all business logic; injected via constructor DI
- `*.repository.ts` — database access layer (wraps ORM calls)
- `*.dto.ts` — request/response validation using `class-validator` decorators
- `*.guard.ts` — route-level auth/role guards
- `*.module.ts` — wires dependencies

Controllers delegate to services; services delegate to repositories. No layer skipping.

### Dependency Injection
- Use NestJS constructor injection exclusively. No service locator or manual instantiation.
- Cross-module dependencies go through each module's exported service — never import a repository from another module.
- Use `@Injectable()` with default singleton scope unless explicitly needed otherwise.

### API Design
- RESTful endpoints: `POST /matches`, `GET /venues/:id/pitches`, `PATCH /bookings/:id/cancel`.
- All request bodies validated via DTO classes with `class-validator`. Pipes handle transformation.
- Consistent error shape: `{ statusCode, message, error }` via NestJS exception filters.
- Pagination: cursor-based for feeds, offset-based for admin tables. Return `{ data, meta: { nextCursor | total, page } }`.
- Versioning: URI prefix `/api/v1/`.

### Guards & RBAC
- `@Roles('Captain', 'SuperAdmin')` decorator + `RolesGuard` on protected routes.
- `JwtAuthGuard` applied globally; public routes opt out with `@Public()`.
- Resource ownership checked in service layer (e.g., only booking creator can cancel).

### Background Jobs (BullMQ)
- Each job type gets its own queue and processor: `elo-recalc`, `dispatch-broadcast`, `payment-webhook`.
- Jobs are idempotent — safe to retry on failure.
- Processors live in their module's `*.processor.ts` file.

## Real-time Dispatch (Referee)

### Flow
1. Ranked match booked → `dispatch-broadcast` BullMQ job created.
2. Processor queries PostGIS for certified referees within radius of pitch location.
3. `DispatchJob` record created with status `BROADCASTING`.
4. Socket.io emits `dispatch:new` to each eligible referee's room.
5. First referee to send `dispatch:accept` wins (atomic DB update with optimistic lock).
6. All other referees receive `dispatch:filled`. Job status → `ACCEPTED`.
7. If no acceptance within timeout → expand radius or escalate.

### Geospatial
- Referee location stored as PostGIS `GEOGRAPHY(Point, 4326)`.
- Queries use `ST_DWithin` for radius search (meters).
- Referees update location periodically via the mobile app.

## Frontend (React Native / Expo)

### State Management
- Server state: TanStack Query (React Query) for all API data. No manual caching.
- Local/UI state: React `useState`/`useReducer`. Zustand for cross-screen state if needed.
- Real-time: Socket.io client managed via a context provider; events update React Query cache directly.

### Navigation
- Expo Router (file-based routing).
- Auth-gated screens via a layout route that checks session.

### API Layer
- Shared API client generated from backend OpenAPI spec or manually typed in `packages/shared`.
- All mutations go through React Query's `useMutation` with optimistic updates where safe.

## Payments (Stripe Connect)

### Flow
1. Booking created → backend creates Stripe PaymentIntent with `transfer_group`.
2. On successful charge → create `Transfer` to venue's connected account and referee's connected account.
3. Platform fee retained automatically via `application_fee_amount`.
4. Webhook processor (`payment-webhook` queue) handles async Stripe events for reconciliation.

### Safety
- All Stripe webhook payloads verified via signature.
- Payment state machine: `PENDING → CAPTURED → SPLIT → SETTLED` (or `FAILED` / `REFUNDED`).
- Refunds require SuperAdmin approval for ranked matches (ELO implications).

## Database Conventions

- All tables have `id` (UUID v4), `created_at`, `updated_at`.
- Soft-delete via `deleted_at` column where business requires audit trail (bookings, payments).
- Indexes on all foreign keys and frequently filtered columns.
- PostGIS spatial index (GIST) on referee location column.
- Enum types for statuses defined at DB level (e.g., `match_status`, `dispatch_status`).

## Testing

- **Unit tests**: service + repository layer; mock external dependencies (DB, Stripe, Socket.io).
- **Integration tests**: controller layer; use test database with migrations applied.
- **E2E tests**: full API flow; seed → act → assert → teardown.
- Test files co-located: `*.spec.ts` next to the file they test.
- Factories for test data generation (avoid raw object literals in tests).

## Security

- Input validated at API boundary (DTOs + class-validator). Service layer trusts validated input.
- SQL injection prevented by ORM parameterized queries — never concatenate user input into SQL.
- Rate limiting on auth endpoints and dispatch acceptance.
- CORS restricted to mobile app origin in production.
- Secrets in environment variables, never in code. `.env` files gitignored.
