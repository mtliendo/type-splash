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
| App | Next.js App Router, TypeScript, Tailwind CSS 4 |
| Game | Phaser 3 (`phaser@3.90`) |
| Data | Drizzle ORM + Neon Postgres |
| Auth | Auth0 Regular Web App via `@auth0/nextjs-auth0` v4 |
| Host | Vercel project `type-splash` |
| Package manager | pnpm |

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
# fill DATABASE_URL, Auth0 values, and AUTH0_SECRET (openssl rand -hex 32)
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). **Parent sign in** goes to Auth0, then `/play`.

### Auth stub (no Universal Login)

For local play and screenshots without signing in:

```bash
AUTH_STUB=1
NEXT_PUBLIC_AUTH_STUB=1
```

`/play` then uses a fixed stub user (`stub|xavier-local`). Do **not** set these on Vercel.

Debug query params (optional, for capturing specific frames):

- `/play?phase=countdown` — longer countdown
- `/play?phase=race` — mid-race with a ghost if none are saved yet
- `/play?phase=finish` — jump to the end screen

## Environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Neon pooled (`-pooler`) | App queries |
| `DATABASE_URL_UNPOOLED` | Neon direct | Drizzle migrations |
| `AUTH0_DOMAIN` | Auth0 tenant host, no `https://` | tenant host only, no scheme |
| `AUTH0_CLIENT_ID` | Type Splash Regular Web App | Not the CLI M2M client |
| `AUTH0_CLIENT_SECRET` | Same app | Never commit |
| `AUTH0_SECRET` | Random 32+ byte hex | Session cookie encryption |
| `APP_BASE_URL` | App origin | `http://localhost:3000` locally, `https://type-splash.vercel.app` in production |

Auth0 application URLs:

- Callbacks: `http://localhost:3000/auth/callback`, `https://type-splash.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback`
- Logout URLs: `http://localhost:3000`, `https://type-splash.vercel.app`, `https://*.vercel.app`
- Web origins: the same three origins

v4 mounts `/auth/login`, `/auth/logout`, and `/auth/callback` from `proxy.ts`.

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

No third-party samples. The starting horn, stroke splashes, bubble bonk, and finish cheer are synthesized in `game/audio.ts` with the Web Audio API.

## Project layout

```
app/                homepage, /play, /api/runs
lib/                Auth0, Drizzle, drills, run queries
game/               Phaser race, swimmer, pool, keyboard, audio
components/         PlayClient, EndScreen, GameMount
drizzle/            SQL migrations
proxy.ts            Auth0 routes + /play protection
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Apply Drizzle migrations |

No automated tests by design.

## Deploy

Vercel project **type-splash** in team **focus-otters-projects**, git-linked to `mtliendo/type-splash`, production branch `main`, production domains auto-assigned.

Preview deployments should load `/` for anyone and send `/play` to Auth0 login.
