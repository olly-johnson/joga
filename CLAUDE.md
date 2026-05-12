# Joga

Mobile-first platform for 5-a-side and 7-a-side football in the UK. Venues list pitches, players book and pay through the app, and certified referees are dispatched in real-time for ranked matches.

## Brand & UI/UX Direction

The app is named **Joga**. The UI follows a dark, vibrant, urban street-football aesthetic — inspired by FIFA Street and UK cage culture. Design defaults:

- **Palette**: dark-mode first (near-black backgrounds), high-contrast neon accents (electric green, hot pink, cyan) used sparingly for CTAs, state, and data highlights.
- **Typography**: bold, condensed display faces for headings (sport/street energy); clean geometric sans for body.
- **Tone**: gritty, kinetic, confident — not corporate, not cute. Think cage, turf, and floodlights over clean grass.
- **Imagery**: urban cages, indoor 5-a-sides, floodlit pitches; players in motion. Avoid stock-photo Sunday-league vibes.
- **Motion**: snappy, physical transitions; 60fps non-negotiable (see Engineering Practices #5).
- **Accessibility**: neon accents must still meet WCAG AA contrast against the dark background — verify every combination.

## Business Model

- **Venue Marketplace**: Venues list pitches; we manage bookings and take a platform fee.
- **Payments**: Upfront via Stripe Connect — split between Platform, Venue, and Referee.
- **Match Types**: Friendly (no ref, dual-captain score verification) and Ranked (ELO, requires certified referee).
- **Referee Dispatch**: Uber-style broadcast to nearby certified referees via websockets + geospatial query. First to accept gets the job.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo (Expo Router, NativeWind/Tailwind) |
| Backend | Node.js + NestJS (TypeScript) |
| Database | PostgreSQL + PostGIS |
| Auth | Supabase Auth (JWT) + NestJS Passport (RBAC: Player, Captain, Referee, VenueAdmin, SuperAdmin) |
| Real-time | Socket.io / Supabase Realtime (dispatch) |
| Caching | Redis |
| Background Jobs | BullMQ (ELO recalculation, notifications) |
| Payments | Stripe Connect (multi-party splits) |

## Project Structure

```
apps/
  mobile/          # Expo/React Native app
  api/             # NestJS backend
packages/
  shared/          # Shared types, constants, validation schemas
  db/              # Prisma/Drizzle schema, migrations, seed
libs/
  elo/             # ELO calculation engine
  dispatch/        # Referee dispatch logic
  payments/        # Stripe Connect integration
```

## Key Directories

- `apps/api/src/modules/` — NestJS feature modules (auth, bookings, matches, venues, referees, dispatch, payments)
- `apps/api/src/common/` — Guards, interceptors, decorators, filters shared across modules
- `apps/mobile/app/` — Expo Router screens (file-based routing)
- `apps/api/src/` — NestJS backend modules (prisma, venues, bookings)
- `apps/mobile/app/` — Expo Router screens (file-based routing)
- `apps/mobile/app/(tabs)/` — Bottom-tab screens (Pitches feed, Profile)
- `apps/mobile/hooks/` — React Query hooks (`useVenues`, `useCreateBooking`)
- `apps/mobile/lib/` — API client (Axios), Supabase client, auth context, shared types
- `apps/mobile/components/` — Shared React Native components
- `apps/mobile/constants/Colors.ts` — Joga design tokens (see UI Color Palette below)
- `packages/db/prisma/` — Schema, migrations, seed data

## Essential Commands

```bash
# Install
pnpm install

# Dev
pnpm dev                    # Start all apps
pnpm dev:api                # NestJS backend only
pnpm dev:mobile             # Expo mobile app only

# Test (TDD is mandatory — write failing tests first)
pnpm test                   # Run all tests
pnpm test:api               # Backend tests only
pnpm test:e2e               # End-to-end tests
pnpm test -- --watch        # Watch mode for TDD

# Database
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed dev data
pnpm db:studio              # Open DB GUI

# Lint & Type-check
pnpm lint
pnpm typecheck
```

## Core Data Models

- **User** — base identity; linked to one or more roles
- **Venue** — `id`, `name`, `latitude`/`longitude` (Float — PostGIS upgrade deferred), `stripeAccountId` (nullable until Stripe Connect onboarding), timestamps; has many pitches
- **Pitch** — `id`, `venueId`, `type` (enum `FIVE_A_SIDE` / `SEVEN_A_SIDE`), `surface` (e.g. `3G`, `4G`, `Concrete`), timestamps; cascade-deleted with its venue
- **Match** — `id`, `pitchId`, `matchType` (enum `FRIENDLY` / `RANKED`), `teamSelectionMode` (enum `RANDOM` / `SELECTED`, default `SELECTED`), `startTime`/`endTime`, `status` (enum `OPEN` / `BOOKED` / `COMPLETED` / `CANCELLED`, default `OPEN`), nullable `refereeId` (→ User), nullable `homeScore`/`awayScore`, timestamps; cascade-deleted with its pitch; `refereeId` set to null if the user is deleted; indexed on `(pitchId, startTime, endTime)`
- **Booking** — `id`, unique `matchId` (one booking per match), `userId` (booker), `paymentStatus` (enum `PENDING` / `MOCKED_PAID`, default `PENDING`), `totalCost` (Int — pence), timestamps; cascade-deleted with its match and its user
- **Team** / **TeamMember** — captain + players; captain is a role on the membership
- **Referee** — certification status, location (PostGIS point), availability windows
- **DispatchJob** — broadcast record: match ref, radius, status, accepted_by, timestamps
- **MatchParticipant** — `id`, `matchId`, `userId`, `team` (nullable enum `HOME` / `AWAY` — null until assigned, e.g. RANDOM mode before the roster fills), `createdAt`; unique on `(matchId, userId)`; cascade-deleted with its match and its user
- **EloRating** — `id`, `userId`, `matchId`, `ratingBefore` (Int), `ratingAfter` (Int), `createdAt`; unique on `(matchId, userId)`; indexed on `(userId, createdAt)` for latest-rating lookup; cascade-deleted with its match and its user
- **Payment** / **PaymentSplit** — Stripe payment intent + split ledger (platform/venue/referee)

## Roles & Permissions (RBAC)

| Role | Can |
|------|-----|
| Player | Join teams, view/book pitches, play matches |
| Captain | All Player + create teams, submit scores, book ranked matches |
| Referee | Accept dispatch jobs, officiate ranked matches, submit verified scores |
| VenueAdmin | Manage own venue's pitches, availability, view booking reports |
| SuperAdmin | Full platform access, certify referees, manage disputes |

## Architectural Decisions

### Mocked payments (MVP)

Stripe Connect integration is deliberately **deferred**. The `createBooking` service (`packages/db/src/bookings/create-booking.ts`) creates the `Match` and `Booking` records in a single Serializable transaction and sets `Booking.paymentStatus` directly to `MOCKED_PAID`. No Stripe API is called; no payment intent is held.

**Why:** unblock the booking-engine UX, venue onboarding, and matchmaking flows before taking on Stripe Connect onboarding, webhook handling, split-ledger accounting, and PCI scope.

**What this means:**
- `PaymentStatus.PENDING` exists in the schema but is effectively unused today — every successful booking goes straight to `MOCKED_PAID`.
- The `totalCost` column (Int, pence) is still captured accurately so we can backfill a real payment record when Stripe lands.
- When replacing this: `createBooking` becomes "create Match + Booking in PENDING, create PaymentIntent, return client_secret"; a Stripe webhook flips `paymentStatus` to the real equivalent of `PAID`. Add `PaymentSplit` + `Payment` models (see list above).
- Do **not** build features that assume payments are settled instantly in production — that assumption is a temporary MVP artefact.

### ELO rating engine

The ELO system lives in two places:

- **`libs/elo/`** (`@footballtomic/elo`) — pure math, zero dependencies. `computeElo({ homeAvg, awayAvg, outcome, kFactor? })` returns `{ homeDelta, awayDelta }`.
- **`packages/db/src/elo/`** — `processElo(matchId)` reads `MatchParticipant` rows, fetches each player's latest `EloRating.ratingAfter` (default 1000 for new players), computes team averages, calls `computeElo`, and writes new `EloRating` rows in a batch transaction. Idempotent — skips if ratings already exist for that match.

**Formula:** Standard ELO. Expected score = `1 / (1 + 10^((opponentAvg - teamAvg) / 400))`. Delta = `K * (actual - expected)`. K-factor defaults to 32.

**Queue:** BullMQ `elo-recalc` queue + worker scaffolding in `packages/db/src/elo/queue.ts`. **Not wired into the API yet.** `POST /matches/:id/complete` currently calls `processElo` inline (synchronous, idempotent). Swap in the queue when load justifies async — change is mechanical. Requires `REDIS_URL` env var when enabled.

**What this means:**
- New players start at rating 1000.
- Ratings are per-player, not per-team. Team average is used for the ELO calculation; the resulting delta is applied equally to all players on the team.
- `processElo` is the testable core; the BullMQ worker is thin scaffolding around it.
- Redis is **not** required for running tests — `processElo` is tested directly against the database.

### NestJS API

The API lives in `apps/api/` using NestJS 11 with a modular architecture. CORS is enabled globally.

**Endpoints:**
- `GET /venues` — public; returns all venues with nested `pitches` array, ordered by name
- `POST /auth/sync` — authenticated; upserts a `User` row from Supabase JWT claims (`sub` → `clerkId`, `email`). Idempotent — returns existing user on repeat calls.
- `POST /bookings` — authenticated; creates Match + Booking + booker `MatchParticipant` via the `createBooking` service. Body accepts optional `teamSelectionMode` (`RANDOM`/`SELECTED`, default SELECTED) and `bookerTeam` (`HOME`/`AWAY`, required for SELECTED, forbidden for RANDOM). `userId` is extracted from the JWT. 201 / 400 / 409 / 401.
- `GET /matches` — public; OPEN/BOOKED matches with pitch+venue+participants, ordered by `startTime`
- `GET /matches/:id` — public; match detail including derived `capacity` (5-a-side = 10, 7-a-side = 14)
- `POST /matches/:id/join` — authenticated; body `{ team? }`. SELECTED mode requires team; RANDOM forbids it. When RANDOM roster fills to capacity, teams are shuffled HOME/AWAY 50/50 inside the same transaction. Errors: 400 (missing/forbidden team), 403 (match closed), 409 (already joined / full).
- `POST /matches/:id/complete` — authenticated; body `{ homeScore, awayScore }`. Validates all participants have a team and ≥1 per side, sets status COMPLETED + scores, then calls `processElo` inline. Errors: 400 (unassigned/unbalanced teams), 403 (wrong status), 409 (already completed).
- `GET /users/me` — authenticated; local user row (id, email, name, createdAt)
- `GET /users/me/rating` — authenticated; latest `EloRating.ratingAfter` or 1000 for new players
- `GET /users/me/elo-history` — authenticated; last 20 ELO rows with embedded match+venue

**Prisma integration:** `PrismaService` extends `PrismaClient` and is provided globally via `PrismaModule`. All modules inject it for database access.

**Testing:** e2e tests in `apps/api/test/` use `@nestjs/testing` + supertest against the real database. Run via `pnpm --filter @footballtomic/api test:e2e`.

**Workspace dependency build:** `@footballtomic/db` and `@footballtomic/elo` are compiled to `dist/` via `tsc` and resolved by Node through the `main` field at runtime. The api's `start*` and `test:e2e` scripts have a `prestart`/`pretest:e2e` hook (`build:deps`) that runs `pnpm --filter @footballtomic/elo --filter @footballtomic/db --workspace-concurrency=1 run build` first. This matters because `nest start` compiles `apps/api/src` to plain CJS JS — when `dist/main.js` does `require("@footballtomic/db")`, Node cannot load raw `.ts`. When iterating on the db or elo packages in dev, run `pnpm --filter @footballtomic/db dev` (or elo) in a separate terminal for `tsc --watch` — Nest's watcher picks up the rebuilt JS automatically.

### Supabase Auth

Authentication uses **Supabase Auth** on the mobile client and **Passport JWT** on the NestJS backend.

**Mobile (`apps/mobile/lib/`):**
- `supabase.ts` — creates the Supabase client with `@react-native-async-storage/async-storage` for session persistence. Configured via `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars.
- `auth-context.tsx` — `AuthProvider` wraps the app, manages session state via `supabase.auth.onAuthStateChange()`. Sets Axios `Authorization: Bearer <token>` header on auth state changes. Exposes `signIn`, `signUp`, `signOut` via `useAuth()` hook. `signUp` automatically calls `POST /auth/sync` to provision the user row.

**Backend (`apps/api/src/auth/`):**
- `jwt.strategy.ts` — Passport strategy that validates Supabase JWTs using `SUPABASE_JWT_SECRET`. Extracts `sub` (Supabase user UUID), looks up the local `User` by `clerkId`, and attaches `{ supabaseId, userId, email }` to `req.user`.
- `jwt-auth.guard.ts` — reusable `@UseGuards(JwtAuthGuard)` decorator for protected endpoints.
- `auth.service.ts` — `syncUser()` upserts a `User` row from JWT claims. Idempotent.
- `auth.controller.ts` — `POST /auth/sync` endpoint.

**Key design choice:** The `User.clerkId` column stores the Supabase Auth UUID. The column name is a legacy artifact — renaming it would require a migration and is deferred until a natural breaking change.

**Env vars required:**
- `SUPABASE_JWT_SECRET` — Supabase Dashboard → Settings → API → JWT Secret. Used by the backend JWT strategy and e2e tests.
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g. `https://xgzvuheeihdmwzwaqogv.supabase.co`).
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public API key.

**Auth flow:** Sign up → Supabase creates auth user → mobile calls `POST /auth/sync` → backend upserts `User` row → subsequent requests carry JWT → backend extracts `userId` from `req.user`.

### Mobile ↔ API networking

The mobile app connects to the NestJS API via an Axios client (`apps/mobile/lib/api.ts`). The base URL is configured via the `EXPO_PUBLIC_API_URL` env variable.

**Local development:** When testing on a physical device or emulator, `localhost` won't resolve to the host machine. Set `EXPO_PUBLIC_API_URL` to the host's local network IP:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000
```

**Data fetching:** All API calls go through `@tanstack/react-query` hooks in `apps/mobile/hooks/`. `useVenues()` fetches venues, `useCreateBooking()` posts bookings. The query client is provided in the root layout.

**Env loading:** The mobile scripts (`start`, `web`, `ios`, `android`) wrap `expo` with `dotenv -e ../../.env --no-expand --`, matching the backend/db convention. This is required because Expo's own dotenv loader only reads `apps/mobile/.env`, not the monorepo root. Without the wrapper, `EXPO_PUBLIC_*` vars are undefined at bundle time and the Supabase client falls back to a placeholder URL.

### Mobile app (Expo + NativeWind)

The mobile app lives in `apps/mobile/` using Expo SDK 54, Expo Router v6 (file-based routing), and NativeWind v4 (Tailwind CSS for React Native).

**Styling:** All styles via NativeWind utility classes — no raw `StyleSheet.create()` in new code. Theme tokens are defined in `tailwind.config.js` under `theme.extend.colors.joga` and mirrored in `constants/Colors.ts` for non-Tailwind contexts (navigation theme, StatusBar).

**UI Color Palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| `joga-black` | `#0A0A0A` | True black for text-on-accent, tab bar bg |
| `joga-dark` | `#121212` | Screen backgrounds |
| `joga-card` | `#1A1A1A` | Card/container backgrounds |
| `joga-border` | `#2A2A2A` | Card borders, dividers |
| `joga-muted` | `#6B6B6B` | Secondary text, inactive icons |
| `joga-text` | `#F5F5F5` | Primary text |
| `joga-volt` | `#CCFF00` | Primary accent — CTAs, selected states, branding |
| `joga-pink` | `#FF2D78` | Secondary accent — alerts, live indicators |
| `joga-cyan` | `#00F0FF` | Tertiary accent — surface badges, data highlights |

**Screenshots:** Run `pnpm exec tsx scripts/capture-screenshots.ts` to capture web-rendered screenshots of all screens via Playwright. Output in `screenshots/`.

**Web support:** Expo Web is enabled for screenshot capture and development preview only — the shipping product is native iOS/Android.

## Engineering Practices

1. **TDD mandatory** — red-green-refactor. No feature code without a failing test first.
2. **Branch per feature/fix** — `feature/<name>`, `fix/<name>`, `chore/<name>`.
3. **Keep this file updated** — CLAUDE.md is the source of truth for architecture decisions.
4. **Security first** — validate all input at API boundary; never trust client data. See `.claude/docs/architectural_patterns.md` for details.
5. **Mobile design** — all mobile UI work must follow the `/mobile-design` skill (`~/.claude/skills/mobile-design/SKILL.md`). Invoke it when building or reviewing screens, components, or navigation in `apps/mobile/`. Non-negotiable standards: 44pt/48dp touch targets, safe area insets, WCAG AA contrast, Dynamic Type support, 60fps animations, and the pre-ship checklist.

## Additional Documentation

Check these files when working in the relevant area:

- [Architectural Patterns](.claude/docs/architectural_patterns.md) — DI patterns, API design, state management, dispatch flow, payment handling conventions
- [Mobile Design Skill](~/.claude/skills/mobile-design/SKILL.md) — platform conventions (iOS HIG, Material 3), touch-first design, typography, performance, accessibility, component architecture, pre-ship checklist
