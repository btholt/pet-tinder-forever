# CLAUDE.md

Project spec and standing instructions for the coding agent. Read this file in full before writing any code. Re-read the relevant section before starting each milestone.

---

## 1. What we're building

**Pawmarks** — a pet adoption app with a Tinder-style swipe interface. Users sign in, swipe through adoptable pets one card at a time, and keep a list of the ones they want to adopt.

The product is deliberately small. There are exactly three screens:

1. **Landing** (logged out) — says what this is, pushes you to sign in.
2. **Swipe** (logged in) — the whole product. One card at a time, full-bleed photo, swipe right to adopt, left to pass.
3. **Matches** (logged in) — the pets you swiped right on.

There is no chat, no profile editing, no filters, no settings, no onboarding flow. If a feature isn't on that list, don't build it. Ask first.

---

## 2. Operating rules for the agent

These are not suggestions.

- **Work through `TASKS.md` one milestone at a time.** Complete every task in the current milestone, then stop at the verification gate and wait for a human "approved" before touching the next milestone.
- **Check off boxes as you go.** Change `- [ ]` to `- [x]` in `TASKS.md` the moment a task is actually done and verified — not when you start it, not in a batch at the end.
- **Definition of done for any milestone:** `npm run lint`, `npm run typecheck`, and `npm run build` all pass clean, and the feature works when exercised by hand. Run all three before you claim a milestone is complete.
- **Never `git push` or deploy without being asked.** Committing locally is fine and encouraged.
- **Never add a dependency that isn't in section 3** without asking first. State what you want and why.
- **No `any`, no `@ts-ignore`, no `eslint-disable`** without a comment on the same line explaining why it's unavoidable.
- **Never edit a migration file that has already been applied.** Generate a new one.
- **Never commit secrets.** `.env` is gitignored; `.env.example` is committed with placeholder values.
- **Prefer deleting code to commenting it out.** Git has the history.
- **When something in this spec turns out to be wrong or impossible, stop and say so.** Don't silently improvise a different architecture.

---

## 3. Stack

Locked. Don't substitute.

| Layer            | Choice                                          |
| ---------------- | ----------------------------------------------- |
| Build            | Vite 6+                                         |
| UI               | React 19, TypeScript (strict)                   |
| Routing          | React Router 7 (declarative mode)               |
| Styling          | Tailwind CSS 4                                  |
| Components       | shadcn/ui (only the primitives we actually use) |
| Server           | Express 5                                       |
| DB               | Postgres (Render)                               |
| ORM / migrations | Drizzle ORM + drizzle-kit                       |
| Auth             | Better Auth (email + password)                  |
| Lint             | ESLint 9 flat config + typescript-eslint        |

**Explicitly not using:** TanStack Query, Redux, framer-motion / any animation library, any drag-and-drop library. The swipe deck is hand-rolled with Pointer Events and CSS transforms — see section 8. Data fetching is `fetch` behind a small typed API client.

Icons: `lucide-react` (ships with shadcn) is fine.

---

## 4. Repo layout

One package.json at the root. Single Render web service — Express serves the API and, in production, the built client.

```
.
├── client/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 # router
│       ├── pages/                  # Landing, SignIn, SignUp, Swipe, Matches
│       ├── components/
│       │   ├── ui/                 # shadcn primitives, don't hand-edit unless necessary
│       │   ├── SwipeDeck.tsx
│       │   ├── PetCard.tsx
│       │   ├── ActionBar.tsx
│       │   └── MatchTakeover.tsx
│       ├── hooks/                  # useSwipeGesture, useSession, useKeyboardSwipe
│       ├── lib/                    # api.ts, auth-client.ts, utils.ts
│       └── styles/index.css        # Tailwind + design tokens
├── server/
│   ├── index.ts                    # Express bootstrap
│   ├── auth.ts                     # Better Auth instance
│   ├── routes/                     # pets.ts, swipes.ts
│   ├── middleware/requireAuth.ts
│   └── db/
│       ├── index.ts                # pool + drizzle client
│       ├── schema.ts               # app tables
│       ├── auth-schema.ts          # Better Auth tables (generated)
│       ├── migrate.ts              # programmatic migrator
│       ├── seed.ts
│       └── seed-data.ts            # the hand-authored pet roster
├── shared/
│   └── types.ts                    # types crossing the wire, imported by both sides
├── drizzle/                        # generated SQL migrations — commit these
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json / tsconfig.server.json
├── eslint.config.js
├── render.yaml
├── .env.example
├── CLAUDE.md
└── TASKS.md
```

Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`. Configure in both `tsconfig.json` and `vite.config.ts`.

---

## 5. Commands

Every one of these must exist in `package.json` and actually work.

```jsonc
{
  "dev": "concurrently -n web,api -c magenta,cyan \"npm:dev:client\" \"npm:dev:server\"",
  "dev:client": "vite",
  "dev:server": "tsx watch server/index.ts",

  "build": "npm run build:client && npm run build:server",
  "build:client": "vite build", // → dist/public
  "build:server": "esbuild server/index.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/server.js",
  "start": "NODE_ENV=production node dist/server.js",

  "db:generate": "drizzle-kit generate", // schema change → new SQL migration
  "db:migrate": "tsx server/db/migrate.ts", // apply pending migrations
  "db:seed": "tsx server/db/seed.ts",
  "db:studio": "drizzle-kit studio",

  "lint": "eslint .",
  "typecheck": "tsc --noEmit && tsc -p tsconfig.server.json --noEmit",
}
```

Notes:

- `db:migrate` is a **tsx script**, not `drizzle-kit migrate`, so it can run on Render where drizzle-kit is a devDependency and the build output is bundled. It reads `drizzle/` and applies pending migrations via `migrate()` from `drizzle-orm/node-postgres/migrator`, then exits with a nonzero code on failure.
- In dev, Vite proxies `/api` → `http://localhost:3000`. Same-origin in production. There is no `VITE_API_URL`.
- In production, Express serves `dist/public` as static and falls back to `index.html` for any non-`/api` GET.

---

## 6. Environment

`.env` at the repo root, gitignored. `.env.example` committed with these keys and placeholder values.

```
DATABASE_URL=postgresql://master_test_user:Dcx48e0Wr37eWi4ooDEvnzsSMPUK6Ghv@dpg-d97jhdl7vvec73cbqkig-a.oregon-postgres.render.com/master_test
BETTER_AUTH_SECRET=<32+ random chars, generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

- This is a **real Render Postgres instance that will become production**. Migrations run against it from day one. Be careful: no destructive migrations, and `db:seed` must be idempotent (section 7).
- That host is the **external** connection string. It requires TLS — configure the `pg` Pool with `ssl: { rejectUnauthorized: false }` when the host ends in `.render.com`. Once deployed, switch the Render env var to the **internal** connection string (no SSL config needed, and it's faster).
- On Render, `BETTER_AUTH_URL` becomes the deployed origin.

---

## 7. Data model

### `pets`

Seeded, read-only from the app's perspective.

| column         | type                        | notes                                                    |
| -------------- | --------------------------- | -------------------------------------------------------- |
| `id`           | `serial` PK                 |                                                          |
| `name`         | `text` not null             |                                                          |
| `species`      | `pet_species` enum not null | `dog \| cat \| bird \| rabbit \| reptile`                |
| `breed`        | `text` not null             |                                                          |
| `age_months`   | `integer` not null          | render as "2 yrs" / "8 mo" in UI                         |
| `gender`       | `pet_gender` enum not null  | `male \| female`                                         |
| `size`         | `pet_size` enum not null    | `small \| medium \| large`                               |
| `bio`          | `text` not null             | 1–2 sentences, first person, written in the pet's voice  |
| `traits`       | `text[]` not null           | 2–4 short tags, e.g. `{"good with kids","couch potato"}` |
| `city`         | `text` not null             |                                                          |
| `state`        | `text` not null             | 2-letter                                                 |
| `photos`       | `text[]` not null           | 1–3 absolute URLs, first is the primary                  |
| `adoption_fee` | `integer` not null          | whole dollars                                            |
| `created_at`   | `timestamptz` default now   |                                                          |

### `swipes`

| column       | type                            | notes          |
| ------------ | ------------------------------- | -------------- |
| `id`         | `serial` PK                     |                |
| `user_id`    | `text` not null → `user.id`     | cascade delete |
| `pet_id`     | `integer` not null → `pets.id`  | cascade delete |
| `direction`  | `swipe_direction` enum not null | `like \| pass` |
| `created_at` | `timestamptz` default now       |                |

Unique index on `(user_id, pet_id)`. Index on `(user_id, direction)` for the matches query.

### Better Auth tables

`user`, `session`, `account`, `verification` — generated with `npx @better-auth/cli generate` into `server/db/auth-schema.ts`. Do not hand-write these.

### "Matches"

Pets don't swipe back, so a match is simply a `like`. Every right-swipe is an instant mutual match and triggers the celebration takeover. `/matches` is `SELECT pets WHERE id IN (likes by this user) ORDER BY swiped_at DESC`.

### Seeding

`server/db/seed-data.ts` holds a **hand-authored** roster of 60 pets. Do not generate names and bios randomly — they're a big part of why the app is charming. Write them. Voice check, aim for this register:

> **Biscuit** · Corgi mix · 3 yrs · "I have short legs and long opinions. I will supervise you doing dishes."
> **Marlowe** · Domestic Shorthair · 7 yrs · "I'm past the zoomies phase and firmly into the sunbeam phase. Looking for a quiet person with a warm lap."

Photo pool — assign 1–3 **distinct** photos of the matching species per pet (capped by what's available for that species):

```
dogs:     https://pets-images.dev-apis.com/pets/dog1.jpg  … dog39.jpg
cats:     https://pets-images.dev-apis.com/pets/cat1.jpg  … cat14.jpg
birds:    https://pets-images.dev-apis.com/pets/bird1.jpg … bird9.jpg
rabbits:  https://pets-images.dev-apis.com/pets/rabbit1.jpg … rabbit3.jpg
reptiles: https://pets-images.dev-apis.com/pets/reptile1.jpg, reptile2.jpg
```

Species distribution, proportional to available photos: **30 dogs, 14 cats, 9 birds, 4 rabbits, 3 reptiles**. Photos may repeat across different pets; they must not repeat _within_ one pet.

Cities: mix of Seattle-area (Seattle, Ballard, Bellevue, Tacoma, Everett) plus a scatter of others so the location line has variety.

**`db:seed` must be idempotent.** It inserts only when `pets` is empty. `npm run db:seed -- --force` truncates `pets` (cascading to `swipes`) and reseeds. Guard `--force` behind a check that refuses to run when `NODE_ENV=production` unless `ALLOW_DESTRUCTIVE_SEED=1` is also set.

---

## 8. The swipe deck

This is the product. Everything else is scaffolding around it. Budget your effort accordingly.

### Structure

Render the top **3** cards of the queue. Only the top card is interactive and in the tab order; the two behind are `aria-hidden`, scaled down (`0.95`, `0.90`) and offset down slightly to suggest a stack.

### Gesture — one implementation for all inputs

Use **Pointer Events** (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`) with `setPointerCapture`. This covers mouse-drag on desktop and touch on mobile in a single code path — do not write separate mouse and touch handlers. Set `touch-action: none` on the card so the browser doesn't steal the gesture for scrolling.

While dragging:

- `transform: translate(dx, dy) rotate(θ)` where `θ = clamp(dx / cardWidth * 18, -18, 18)` degrees, `transform-origin: 50% 120%`.
- Drive transforms directly on the element via a ref in `requestAnimationFrame`, **not** through React state on every pointermove. React state changes only on commit.
- The **ADOPT** stamp (mint, rotated `-14°`) fades in with `opacity = clamp(dx / (0.35 * cardWidth), 0, 1)`; the **NOPE** stamp (berry, rotated `14°`) mirrors it for negative `dx`.
- The card behind scales toward `1.0` proportionally, so the stack feels physical.

### Commit thresholds

Commit the swipe if **either**:

- `|dx| > 0.32 * cardWidth`, or
- horizontal velocity over the last ~80ms exceeds `0.45 px/ms` (a flick, even a short one).

Otherwise spring back to center with a `cubic-bezier(0.18, 0.89, 0.32, 1.28)` transition over 300ms.

On commit: animate the card off-screen along its current trajectory (~350ms), then remove it from the deck.

### Keyboard (desktop)

Bound at the deck level when it has focus, and the deck is focused on mount:

| key         | action          |
| ----------- | --------------- |
| `←`         | pass            |
| `→`         | adopt           |
| `↑`         | next photo      |
| `↓`         | previous photo  |
| `Backspace` | undo last swipe |

Keyboard-triggered swipes play the same fly-off animation as a drag, so the interaction reads identically.

### Photos

Tinder-style segmented progress bar pinned to the top of the card, one segment per photo. Tap/click the left third or right third of the card to move between photos (a click that follows a drag of >6px must not count as a tap). Arrow up/down does the same via keyboard.

### Queue and network behavior

- `GET /api/pets/queue?limit=20` on mount. Refetch when fewer than 5 cards remain.
- Swipes are **optimistic**: the card leaves immediately, `POST /api/swipes` fires in the background. On failure, show a small non-blocking toast and re-queue the pet at the back.
- Preload the next two cards' primary images with `new Image()` so cards never pop in blank.
- Show a skeleton card on first load, never a spinner-on-white.

### Accessibility

- The Pass / Adopt buttons in the action bar are the accessible path and must be fully keyboard operable with visible focus rings.
- An `aria-live="polite"` region announces "Passed on Biscuit" / "Adopted Biscuit".
- Respect `prefers-reduced-motion`: drag still works, but fly-off and the match takeover become instant cross-fades, and confetti is suppressed.

### Empty state

When the queue is exhausted: a centered, warm empty state — "That's everyone for now. Check back soon, or go visit your matches." with a button to `/matches`. Not a dead screen.

---

## 9. Design language

Reference Tinder's _layout_ closely; do not reference its palette. Tinder is red-orange on white with neutral grays and reads corporate. Ours is a candy-bright, rounded, slightly toy-like take — this is a joyful thing, adopting a pet.

### Tokens

Define once in `client/src/styles/index.css` as CSS custom properties inside Tailwind 4's `@theme`, then use only the Tailwind classes that reference them. No raw hex values anywhere else in the codebase.

```
--color-ink:      #21123A   /* deep plum-black — all text, never pure black */
--color-paper:    #FFF6F0   /* warm blush white — app background */
--color-berry:    #FF3D68   /* primary / pass */
--color-mango:    #FF9E44   /* primary gradient end */
--color-grape:    #6C4BF4   /* match takeover, secondary CTA */
--color-mint:     #14C9A0   /* adopt / affirmative */
--color-sun:      #FFD23F   /* accents, confetti */
```

Brand gradient: `linear-gradient(135deg, var(--color-berry), var(--color-mango))`. Use it on the primary CTA, the logo mark, and the landing hero scrim — nowhere else.

Species accent chips: dog → mango, cat → grape, bird → `#38BDF8`, rabbit → `#FF8FA3`, reptile → mint.

### Type

- **Display: Fredoka** (600/700) — logo, pet names, headlines, the match takeover. Rounded and friendly without being cutesy.
- **UI/body: Plus Jakarta Sans** (400/500/700) — everything else, including numerals.

Load both from Google Fonts with `display=swap` and preconnect. Scale: pet name `text-4xl`, breed/age line `text-base` at 500, chips `text-xs` uppercase with `tracking-wide`.

### Surfaces

- Cards: `rounded-[28px]`, `overflow-hidden`, shadow `0 18px 40px -12px rgb(33 18 58 / 0.35)`.
- **Full bleed is the rule.** The photo fills the card corner to corner with `object-cover` and no padding, ever. Text sits on top of the photo over a bottom scrim: `linear-gradient(to top, rgb(33 18 58 / 0.85) 0%, rgb(33 18 58 / 0.45) 30%, transparent 60%)`. No white text panel below the image.
- Action buttons: circular, white, `shadow-lg`, floating half-overlapping the card's bottom edge. Pass = berry X, Adopt = mint heart, Undo = smaller, sun-colored. Scale to `1.12` on hover, `0.94` on press.
- Layout: on mobile the card fills the viewport minus the header and action bar. On desktop the card is capped at `380px × 620px`, centered, on a `paper` background with a soft radial berry→mango wash behind it.

### Signature element — the match takeover

When a swipe right commits, a full-bleed overlay takes the screen: the pet's photo scaled up behind a grape-tinted scrim, "It's a match!" in Fredoka riding the brand gradient, the pet's name below, a burst of confetti in berry/mango/sun/mint, and two buttons — "Keep swiping" (primary) and "See matches" (ghost). It auto-dismisses after 2.2s or on any tap. This is the one place we go loud; keep every other surface disciplined.

### Copy

Sentence case throughout. Active verbs. The button says "Adopt", the toast says "Adopted". Never "Submit". Empty states invite an action; errors say what broke and what to do. Don't be twee — one joke per screen, maximum.

---

## 10. API

All routes under `/api`. JSON in, JSON out. Everything except `/api/auth/*` requires a session and returns `401 { error: "unauthorized" }` without one.

| method   | path                       | returns                                                                                                                                                   |
| -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALL`    | `/api/auth/*`              | Better Auth handler                                                                                                                                       |
| `GET`    | `/api/me`                  | `{ user: { id, name, email } }`                                                                                                                           |
| `GET`    | `/api/pets/queue?limit=20` | `Pet[]` — pets this user hasn't swiped, stable pseudo-random order seeded by user id                                                                      |
| `POST`   | `/api/swipes`              | body `{ petId: number, direction: "like" \| "pass" }` → `{ matched: boolean }`. Idempotent: re-swiping the same pet updates the row rather than erroring. |
| `DELETE` | `/api/swipes/:petId`       | undo — deletes the row, returns `204`                                                                                                                     |
| `GET`    | `/api/matches`             | `Pet[]`, most recently liked first                                                                                                                        |

Validate all request bodies (Zod is acceptable here — add it in Milestone 3). Never trust `petId`. Errors are `{ error: string }` with a real status code; no 200-with-error-body.

Shared response types live in `shared/types.ts` and are imported by both client and server so the wire contract is checked at compile time.

---

## 11. Auth

Better Auth with the Drizzle adapter, email + password only. No social providers, no email verification (`requireEmailVerification: false`) — this is a demo, and adding an email provider is out of scope.

**Critical mounting order** in `server/index.ts`:

```ts
app.all("/api/auth/*splat", toNodeHandler(auth)); // BEFORE express.json()
app.use(express.json());
```

Better Auth's node handler needs the raw body. Mounting `express.json()` first breaks sign-in with an unhelpful error. This has cost people hours; get it right the first time.

Client side: `createAuthClient` from `better-auth/react` in `client/src/lib/auth-client.ts`. Use `useSession()` for the auth state. A `<RequireAuth>` wrapper redirects unauthenticated users to `/` and authenticated users away from `/`, `/signin`, `/signup` toward `/swipe`. While the session is loading, render nothing (or a bare logo) — never flash the landing page at a signed-in user.

Sign-in and sign-up are their own routes, not modals: full-bleed pet photo on the left half at `md:` and up, form on the right, single column on mobile.

---

## 12. Deployment (Render)

Single web service plus the existing Render Postgres instance. Deploys are triggered by pushing to `main` on GitHub.

`render.yaml` at the repo root:

```yaml
services:
  - type: web
    name: pawmarks
    runtime: node
    plan: starter
    region: oregon
    buildCommand: npm ci && npm run build && npm run db:migrate
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 22
      - key: DATABASE_URL
        sync: false
      - key: BETTER_AUTH_SECRET
        generateValue: true
      - key: BETTER_AUTH_URL
        sync: false
```

- Migrations run in the **build** command, so every deploy applies pending schema changes before the new instance starts serving. If a migration fails, the build fails and the old instance keeps running — which is what we want.
- Seeding is **not** part of deploy. It's a one-time manual `npm run db:seed` (Milestone 2).
- Add a `GET /api/health` route returning `{ ok: true }` plus a cheap `SELECT 1` so Render's health check reflects DB reachability.
- Render installs devDependencies during build by default; keep it that way — `vite`, `esbuild`, `tsx`, and `drizzle-kit` are all needed at build time.
- Bind the server to `process.env.PORT` and host `0.0.0.0`.

---

## 13. Quality floor

Non-negotiable, checked at every milestone gate:

- Responsive from 320px up. Test the swipe deck at 375×667 and at 1440×900.
- Visible keyboard focus on every interactive element.
- `prefers-reduced-motion` respected.
- No console errors or unhandled promise rejections in normal use.
- No layout shift when images load — every image container has a fixed aspect ratio or fills a sized parent.
- Every image has meaningful `alt` text (`"Biscuit, a Corgi mix"`).
- Loading, empty, and error states exist for every screen that fetches. No screen may render as a blank white rectangle.
