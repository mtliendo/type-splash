# Type Splash

A splashy **25-meter home-row freestyle** for Xavier, who is learning two-hand typing. One big letter at a time. Correct keys swim him forward. Ghosts of his fastest races share the other lanes.

Parents sign in. Xavier plays on that account. Laptop or desktop with a physical keyboard only — no touch, no phones.

## What you get

- Public marketing homepage at `/`
- The race behind login at `/play`
- Phaser 3 cartoon pool: shimmer, bubbles, lane ropes, a loose vector kid (not a likeness)
- Countdown: *On your marks… get set… BEEP!* The clock starts at the beep
- Home-row letters only: `a s d f j k l ;` — no next-letter preview
- Keyboard hint with hand/finger labels and bumps on `F` and `J`
- Up to three ghost swimmers, replayed from the timestamp of each correct key
- Synthesized horn, splash, bubble bonk, and finish cheer, plus a mute toggle
- End screen: time, accuracy, letters per minute, a medal if he beat a ghost, confetti on a personal best
- Each run saved in Neon (user sub, time, keystroke log, accuracy, created_at)

Letter-set drills and word mode are **not** built yet. The drill lives in `lib/drills.ts` so those can be added later without rewriting the race.

## Stack

| Piece | Choice |
| --- | --- |
| App | Vite multi-page (vanilla TypeScript, no React) |
| Game | Phaser 3 (`phaser@3.90`) |
| Styles | Tailwind CSS 4 via `@tailwindcss/vite` |
| Data | Drizzle ORM + Neon Postgres |
| Auth | Auth0 Single Page Application via `@auth0/auth0-spa-js` |
| API | Vercel Functions in `/api` (TypeScript, Node) + `jose` JWKS |
| Host | Vercel project `type-splash` |
| Package manager | pnpm |

This used to be Next.js + React. Phaser never booted cleanly through Next's client-component / `next/dynamic` layer, so the race now mounts from a plain Vite page.

## Game rules

1. Four lanes in a cartoon indoor pool. Xavier is in lane 2.
2. First run is a solo time trial. Later runs add one ghost per previous personal-best swim, up to three.
3. Countdown, then a dive. Timer starts on **BEEP!**
4. One random home-row letter is shown. There is no preview of the next letter.
5. A correct key moves him **1 meter**. 25 correct letters finish the race.
6. A wrong printable key plays a gentle bubble bonk. He does not move. The clock keeps running.
7. The on-screen keyboard highlights the target key and names the finger:

   | Key | Finger |
   | --- | --- |
   | a | left pinky |
   | s | left ring |
   | d | left middle |
   | f | left index (home-row bump) |
   | j | right index (home-row bump) |
   | k | right middle |
   | l | right ring |
   | ; | right pinky |

8. Finish screen shows time, accuracy (`correct / attempts`), letters per minute, a medal if he beat any ghost, and *New personal best!* with confetti when he beats his fastest saved swim.

## Local setup

Need **Node 20+**, **pnpm**, and the env vars in `.env.example`.

```bash
pnpm install
cp .env.example .env.local
# fill DATABASE_URL plus Auth0 SPA / API values
pnpm db:migrate
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). **Parent sign in** sends the parent through Auth0, then `/play`.

`pnpm dev` also serves `/api/runs` with the same handlers as Vercel Functions, so ghosts persist locally when `DATABASE_URL` is set.

### Auth stub (no Universal Login)

For local play and screenshots without signing in:

```bash
AUTH_STUB=1
VITE_AUTH_STUB=1
```

`/play` then uses a fixed stub user (`stub|xavier-local`) and the API skips JWT checks. Do **not** set these on Vercel.

Debug query params (optional, for capturing specific frames):

- `/play?phase=countdown` — longer countdown
- `/play?phase=race` — mid-race with a ghost if none are saved yet
- `/play?phase=finish` — jump to the end screen

## Environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Neon pooled (`-pooler`) | Function queries |
| `DATABASE_URL_UNPOOLED` | Neon direct | Drizzle migrations |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant host, no `https://` | Public, baked into the Vite bundle |
| `VITE_AUTH0_CLIENT_ID` | Type Splash **SPA** application | Public |
| `VITE_AUTH0_AUDIENCE` | Auth0 API identifier | `https://type-splash.vercel.app/api` |
| `AUTH0_DOMAIN` | Same tenant host | Used by `/api/runs` to fetch JWKS |
| `AUTH0_AUDIENCE` | Same API identifier | JWT `aud` check |
| `AUTH0_ISSUER` | `https://<tenant>/` | Optional; defaults from `AUTH0_DOMAIN` |

Auth0 application URLs (SPA, no client secret):

- Callbacks: `http://localhost:5173/play`, `https://type-splash.vercel.app/play`, `https://*.vercel.app/play`
- Logout URLs: `http://localhost:5173`, `https://type-splash.vercel.app`, `https://*.vercel.app`
- Web origins: the same three origins
- Allowed origins CORS: the same three origins

Auth0 API (audience): `https://type-splash.vercel.app/api` — used so `/api/runs` can verify access tokens. The SPA and any machine client that calls the API must be authorized for that audience. `getTokenSilently` always requests it.

Removed Next.js-only secrets: `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`, `NEXT_PUBLIC_*`.

## Database

Schema: `lib/schema.ts`. SQL: `drizzle/0000_init.sql`.

```sql
runs (
  id, user_sub, drill_id, total_time_ms, accuracy,
  keystroke_log jsonb, created_at
)
```

`keystroke_log` is `{ t, key, target, correct }[]` where `t` is milliseconds after the beep.

```bash
pnpm db:generate   # after schema edits
pnpm db:migrate    # apply SQL (needs DATABASE_URL_UNPOOLED)
```

Neon project: **type-splash** (personal org). Application traffic uses the pooled URL.

## Adding a drill later

`lib/drills.ts` is the extension point:

1. Add a `DrillId` and a `DrillConfig` (`alphabet`, `raceMeters`, `pickTarget`).
2. Keep the Phaser race scene generic — it already consumes a serialized drill.
3. Word mode can pick a word and feed letters one at a time without changing persistence.

Do not add those modes until someone asks.

## Sound credits

No third-party samples. The starting horn, stroke splashes, bubble bonk, and finish cheer are synthesized in `src/game/audio.ts` with the Web Audio API.

## Project layout

```
index.html          marketing homepage
play.html           Phaser race (login required)
src/home.ts         homepage Auth0 CTAs
src/play.ts         boot auth, ghosts, Phaser, end screen
src/game/           Phaser race, swimmer, pool, keyboard, audio
src/auth.ts         Auth0 SPA client + local stub
server/runs-api.ts  GET ghosts / POST a run (source)
api/runs.js         bundled Vercel Function (esbuild, no relative ESM imports)
lib/                Drizzle schema, queries, drill config, JWT verify
drizzle/            SQL migrations
vite.config.ts      MPA build + local /api/runs middleware
vercel.json         /play → /play.html
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite on port 5173 + local `/api/runs` |
| `pnpm build` | `tsc --noEmit` then production Vite build |
| `pnpm preview` | Serve the production bundle |
| `pnpm db:migrate` | Apply Drizzle migrations |

No automated tests by design.

## Deploy

Vercel project **type-splash** in team **focus-otters-projects**, git-linked to `mtliendo/type-splash`, production branch `main`, production domains auto-assigned, framework preset **Vite**.

Preview deployments should load `/` for anyone and send `/play` to Auth0 login.
