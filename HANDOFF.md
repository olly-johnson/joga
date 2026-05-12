# Joga — Project Handoff

A pickup guide for a fresh Claude session. Read `CLAUDE.md` for full architecture; this file covers what state the project is in **right now** and what to do next.

## 1. What Joga is

Mobile-first platform for 5-a-side and 7-a-side football in the UK. Venues list pitches, players book and pay through the app, and certified referees are dispatched in real-time for ranked matches.

- **Mobile**: Expo SDK 54 + React Native + Expo Router v6 + NativeWind v4 (`apps/mobile/`)
- **API**: NestJS 11 (`apps/api/`)
- **DB**: PostgreSQL (Supabase-hosted) + Prisma (`packages/db/`)
- **Auth**: Supabase Auth (mobile) + Passport JWT validating Supabase tokens (api)
- **ELO**: Pure math lib `libs/elo/` + DB-bound orchestrator in `packages/db/src/elo/`
- **Payments**: deliberately **mocked** for MVP — `paymentStatus` jumps straight to `MOCKED_PAID`. Stripe Connect is deferred.

Full details and design tokens in `CLAUDE.md`.

## 2. Repo layout

```
apps/
  mobile/          # Expo / React Native app
  api/             # NestJS backend
packages/
  db/              # Prisma schema, client, services (booking, elo orchestrator)
libs/
  elo/             # Pure ELO math (no deps)
.env               # SINGLE root .env — loaded everywhere via dotenv-cli
```

pnpm workspace (`pnpm-workspace.yaml`): `apps/*`, `packages/*`, `libs/*`.

## 3. Environment & tooling conventions

- **pnpm**: installed via Corepack shim at `~/.local/bin/pnpm` (v9.15.4). Not globally installed.
- **Single root `.env`**: all packages load it via `dotenv -e ../../.env --no-expand -- <cmd>`. The `--no-expand` flag is required because the DB password contains `$d` which dotenv would otherwise try to interpolate.
- **Mobile env loading**: `apps/mobile/package.json` wraps every expo script (`start`, `ios`, `android`, `web`) with the same dotenv prefix. Expo's built-in loader only reads `apps/mobile/.env`, so without this wrapper `EXPO_PUBLIC_*` vars are undefined at bundle time and Supabase falls back to a placeholder URL.
- **API env loading**: same dotenv wrapper on `start`, `start:dev`, `start:debug`, `start:prod`, `test`, `test:e2e`.
- **Workspace dep build**: `packages/db` and `libs/elo` ship as **compiled JS in `dist/`**, not raw TS. `apps/api/package.json` has a `build:deps` script and `prestart*` / `pretest:e2e` hooks that run `pnpm --filter @footballtomic/elo --filter @footballtomic/db --workspace-concurrency=1 run build` before Nest boots. This is non-negotiable — `nest start` compiles api code to CJS, and Node can't `require()` raw `.ts` from a workspace dep.

Required env vars (in `/.env`):
- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_JWT_SECRET` — legacy HMAC secret (see memory `project_supabase_jwt_migration.md`)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EXPO_PUBLIC_API_URL` — set to host LAN IP (`http://192.168.x.x:3000`) when testing on device/emulator
- `REDIS_URL` — only required if you actually start the BullMQ ELO worker

## 4. Engineering rules (must follow)

1. **TDD mandatory** — write the failing test first, every time. No exceptions.
2. **Branch per feature/fix** — `feature/<name>`, `fix/<name>`, `bugfix/<name>`, `chore/<name>`. **Always branch from `main`** — never stack feature branches. If you're blocked by an unmerged PR, wait for the merge.
3. **State the branch name in every response.**
4. **Keep `CLAUDE.md` updated** when you change architecture.
5. **Mobile UI work**: invoke the `mobile-design` skill. 44pt/48dp touch targets, safe area insets, WCAG AA contrast against dark backgrounds, 60fps animations.
6. **PR screenshots**: this repo is private. Upload images as **draft release assets** and link those URLs — `raw.githubusercontent.com` URLs don't work for private repos.

## 5. Essential commands

```bash
# install
pnpm install

# dev
pnpm dev                    # all apps
pnpm dev:api                # nest start --watch
pnpm dev:mobile             # expo start

# test
pnpm test                   # all
pnpm --filter @footballtomic/db test
pnpm --filter @footballtomic/elo test
pnpm --filter @footballtomic/api test:e2e

# build workspace deps (api auto-runs this via prestart)
pnpm --filter @footballtomic/elo --filter @footballtomic/db --workspace-concurrency=1 run build

# db
pnpm db:migrate
pnpm db:seed
pnpm db:studio

# typecheck / lint
pnpm typecheck
pnpm lint
```

When iterating on `packages/db` or `libs/elo` while the api is running, open a second terminal and run `pnpm --filter @footballtomic/db dev` (`tsc --watch`) — Nest's watcher picks up the rebuilt JS automatically.

## 6. Current state — what's done

### Backend (`apps/api`)

- ✅ NestJS 11 scaffold with global CORS
- ✅ `PrismaService` provided globally via `PrismaModule`
- ✅ `POST /auth/sync` — authenticated; upserts a local `User` from Supabase JWT claims (`sub` → `clerkId`, `email`). Idempotent.
- ✅ `GET /venues` — public; returns venues with nested `pitches`, ordered by name
- ✅ `POST /bookings` — authenticated; calls `createBooking` from `@footballtomic/db`. Extracts `userId` from JWT, not request body. 201 / 409 / 401.
- ✅ Passport JWT strategy validates Supabase HMAC tokens via `SUPABASE_JWT_SECRET`
- ✅ Reusable `JwtAuthGuard`
- ✅ e2e tests pass (8/8) — `apps/api/test/`, uses real DB
- ✅ Boots cleanly via `pnpm --filter @footballtomic/api start:dev` — verified end-to-end

### Database (`packages/db`)

- ✅ Prisma schema covers: User, Venue, Pitch, Match, Booking, MatchParticipant, EloRating (see `CLAUDE.md` → Core Data Models for the full field list)
- ✅ `createBooking` service — single Serializable transaction creating `Match` + `Booking` with `paymentStatus: MOCKED_PAID`
- ✅ ELO orchestrator (`processElo(matchId)`) — idempotent, reads participants, fetches latest ratings (default 1000), calls `computeElo`, writes new `EloRating` rows in a batch transaction
- ✅ BullMQ queue scaffolding for `elo-recalc` (not wired into API yet; needs `REDIS_URL`)
- ✅ 16/16 db tests pass

### ELO library (`libs/elo`)

- ✅ Pure `computeElo({ homeAvg, awayAvg, outcome, kFactor? })` — zero deps
- ✅ Standard ELO formula, K-factor default 32
- ✅ 7/7 tests pass

### Mobile (`apps/mobile`)

- ✅ Expo Router file-based routing
- ✅ NativeWind v4 styling — Joga design tokens in `tailwind.config.js` and mirrored in `constants/Colors.ts`
- ✅ Supabase Auth client with AsyncStorage persistence (`lib/supabase.ts`)
- ✅ `AuthProvider` (`lib/auth-context.tsx`) — manages session, sets Axios `Authorization` header on auth state change, calls `POST /auth/sync` automatically on `signUp`
- ✅ Axios client (`lib/api.ts`) with `EXPO_PUBLIC_API_URL` base
- ✅ React Query hooks: `useVenues`, `useCreateBooking`
- ✅ Bottom tabs: Pitches feed, Profile
- ✅ Screenshot capture script: `pnpm exec tsx scripts/capture-screenshots.ts` (Playwright, web-rendered)

### Recently-fixed bugs (the reason this handoff exists)

1. **Mobile sign-up failed with `ERR_NAME_NOT_RESOLVED`** — Supabase URL was unresolved because Expo wasn't reading the root `.env`. Fixed by wrapping mobile scripts with `dotenv -e ../../.env --no-expand -- expo …`.
2. **API call from mobile failed with `ERR_CONNECTION_REFUSED`** — backend wasn't reading the root `.env` either. Fixed with the same wrapper on all `apps/api` start/test scripts.
3. **`nest start` crashed with `SyntaxError: Unexpected token 'export'`** at `packages/db/src/index.ts` — root cause: `"main": "src/index.ts"` worked for `ts-jest` but Node CJS can't load raw TS at runtime. Fix: compile `packages/db` and `libs/elo` to `dist/`, point `main`/`types` at the compiled output, and add a `build:deps` prestart hook in `apps/api`. Both packages now exclude `src/**/__tests__/**` from emit.

These three fixes are present on `main` in the working tree (see current state of `apps/api/package.json`, `packages/db/package.json`, `libs/elo/package.json`, both `tsconfig.json`s, and the documented section in `CLAUDE.md`).

## 7. What still needs to be done

### Near-term (booking-engine MVP)

- **Wire BullMQ `elo-recalc` queue into the API.** When a match transitions to `COMPLETED`, enqueue a job; the worker calls `processElo(matchId)`. Needs `REDIS_URL` and a worker entry point (`packages/db/src/elo/queue.ts` has the scaffolding).
- **Match completion flow.** No endpoint exists yet for marking a match `COMPLETED` and submitting `homeScore`/`awayScore`. Spec: friendly matches use dual-captain verification, ranked matches require referee submission.
- **Ranked vs friendly distinction in API.** Schema supports `matchType` but the booking endpoint doesn't branch behaviour yet.
- **Mobile booking flow.** `useCreateBooking` exists but there's no fleshed-out screen — needs pitch detail view, date/time picker, confirmation.
- **Venue admin surface.** No UI for `VenueAdmin` role yet; venues are seeded manually.

### Medium-term

- **Referee dispatch system.** Spec is "Uber-style broadcast over websockets + geospatial query, first to accept wins." No code yet beyond the `Referee` / `DispatchJob` data model sketch in `CLAUDE.md`. Will use Socket.io or Supabase Realtime.
- **PostGIS upgrade.** `Venue.latitude`/`longitude` are currently `Float`; deferred until dispatch needs proper geo queries. Migration will need ST_DWithin/ST_Distance support.
- **Team & TeamMember models.** Listed in `CLAUDE.md` but schema is not implemented.
- **RBAC enforcement.** Roles exist conceptually (Player, Captain, Referee, VenueAdmin, SuperAdmin) but no guard/decorator enforces them on endpoints. JWT only carries the Supabase `sub`.

### Long-term (deliberately deferred)

- **Stripe Connect.** Replace the mocked payment path. When you do: `createBooking` becomes "create Match + Booking in `PENDING`, create PaymentIntent, return `client_secret`"; a Stripe webhook flips `paymentStatus` to a real `PAID`. Add `Payment` and `PaymentSplit` models.
- **`User.clerkId` rename.** The column stores Supabase Auth UUIDs but is named `clerkId` for legacy reasons. Rename during a natural breaking change.
- **Supabase JWT migration to JWKS.** Backend currently uses the legacy HMAC secret. An ECC P-256 key is provisioned but dormant. Migrate when Supabase deprecates HMAC.

## 8. Known sharp edges

- **Don't run `nest start` without `build:deps`** — without compiled `packages/db/dist`, Nest will silently typecheck against missing types and produce confusing TS errors. The `prestart` hook prevents this; don't remove it.
- **Don't use `--filter "./libs/*"` from inside `apps/api`** — pnpm path-globs are cwd-relative and produce "No projects matched the filters." Use explicit package names: `--filter @footballtomic/elo --filter @footballtomic/db`.
- **Topological build order matters** — `@footballtomic/db` depends on `@footballtomic/elo`. Pass both filters explicitly with `--workspace-concurrency=1` so elo builds first.
- **`apps/mobile/.env` does not exist on purpose** — env lives at the repo root. Don't create a mobile-local one; it would shadow the root file inconsistently across tools.
- **Port 3000 stale-process trap** — if `nest start` exits uncleanly, kill the orphaned PID before retrying. From git-bash, `taskkill /F /PID <pid>` needs the `cmd //c` wrapper to avoid `/F` being mangled into a path: `cmd //c "taskkill /F /PID 27272"`.
- **`git` commands across multiple Bash calls** — shell state doesn't persist between Bash tool invocations. Use `git -C <absolute-path>` or absolute paths to file args, don't rely on a prior `cd`.

## 9. Useful files to skim first

- `CLAUDE.md` — full architecture, data models, design tokens, conventions
- `apps/api/src/main.ts` — bootstrap, CORS, port
- `apps/api/src/auth/jwt.strategy.ts` — JWT validation
- `apps/api/src/bookings/bookings.controller.ts` — example of authenticated endpoint
- `packages/db/src/bookings/create-booking.ts` — the only write path that matters for MVP
- `packages/db/src/elo/process-elo.ts` — orchestrator referenced by the BullMQ worker
- `libs/elo/src/compute-elo.ts` — pure math
- `apps/mobile/lib/auth-context.tsx` — the entire mobile auth flow
- `apps/mobile/constants/Colors.ts` — design tokens for non-Tailwind contexts

## 10. If something breaks

1. Did you branch from `main`? You must.
2. Did you write a failing test first? You must.
3. If the API won't boot: run `pnpm --filter @footballtomic/elo --filter @footballtomic/db --workspace-concurrency=1 run build` manually and re-read the first error.
4. If Supabase calls fail from mobile: check that the dev server was started via `pnpm dev:mobile` (which wraps with dotenv), not `expo start` directly.
5. If a port is stuck: `netstat -ano | findstr :3000` then `cmd //c "taskkill /F /PID <pid>"`.
