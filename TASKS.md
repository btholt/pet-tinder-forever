# TASKS.md

Build plan for Pawmarks. Read `CLAUDE.md` first.

## How to use this file

1. Work on **one milestone at a time, in order.**
2. Check off each box (`- [ ]` → `- [x]`) as soon as that task is genuinely done — not when you start it, not in a batch at the end.
3. When every box in a milestone is checked, run `npm run lint && npm run typecheck && npm run build`, then **stop at the verification gate** and post the short report it asks for.
4. **Do not begin the next milestone until a human replies "approved".** If you're blocked or the spec is wrong, stop and say so rather than improvising.

---

## Milestone 0 — Scaffold and tooling

Goal: an empty but correctly wired app that builds, lints, and runs in dev.

- [x] `npm create vite@latest` into `client/`, React + TypeScript, then restructure to the layout in CLAUDE.md §4 (single root `package.json`, `client/` and `server/` beside each other).
- [x] Install the stack from CLAUDE.md §3. No extras.
- [x] `tsconfig.json` (client, strict, `@/*` and `@shared/*` aliases) and `tsconfig.server.json` (server, `NodeNext`, strict).
- [x] `vite.config.ts`: React plugin, Tailwind plugin, aliases, `build.outDir: "../dist/public"`, and a dev proxy for `/api` → `http://localhost:3000`.
- [x] Tailwind 4 wired up in `client/src/styles/index.css` with the `@theme` token block from CLAUDE.md §9. Fredoka + Plus Jakarta Sans loaded with preconnect and `display=swap`.
- [x] `shadcn` initialized (`npx shadcn@latest init`) pointed at `client/src/components/ui`, using our tokens rather than the default neutral palette. Add only `button`, `input`, `label`, `card`, `sonner` for now.
- [x] ESLint 9 flat config with typescript-eslint + react-hooks. `npm run lint` passes on a clean tree.
- [x] Minimal Express server in `server/index.ts`: listens on `process.env.PORT ?? 3000` bound to `0.0.0.0`, has `GET /api/health` → `{ ok: true }`, and in production serves `dist/public` with an SPA fallback for non-`/api` GETs.
- [x] All scripts from CLAUDE.md §5 present in `package.json` and working.
- [x] `.gitignore` (`node_modules`, `dist`, `.env`, `.DS_Store`), `.env.example`, and a local `.env` with the real values.
- [x] `git init`, initial commit.

### ✋ Gate 0 — stop and report

Report: output of `npm run build`, confirmation that `npm run dev` serves the Vite page at :5173 and `curl localhost:3000/api/health` returns `{"ok":true}`, and the final directory tree.

**Wait for "approved."**

---

## Milestone 1 — Database schema and migrations

Goal: our tables exist in the real Render Postgres.

- [x] `server/db/index.ts`: `pg` Pool from `DATABASE_URL` with `ssl: { rejectUnauthorized: false }` when the host ends in `.render.com`, exporting a Drizzle client.
- [x] `server/db/schema.ts`: the `pets` and `swipes` tables and the four enums exactly as specified in CLAUDE.md §7, including the unique index on `(user_id, pet_id)` and the index on `(user_id, direction)`.
- [x] `drizzle.config.ts` pointing at both `schema.ts` and `auth-schema.ts`, output `./drizzle`, dialect `postgresql`.
- [x] Generate Better Auth's tables: `npx @better-auth/cli generate` → `server/db/auth-schema.ts`. Don't hand-edit the result.
- [x] `server/db/migrate.ts` — a programmatic migrator using `migrate()` from `drizzle-orm/node-postgres/migrator`, logging what it applied and exiting nonzero on failure.
- [x] `npm run db:generate` to produce the initial SQL migration. **Commit the `drizzle/` folder.**
- [x] `npm run db:migrate` against the real database. Confirm the tables landed.
- [x] `shared/types.ts` exporting `Pet`, `SwipeDirection`, and the API response shapes, derived from the Drizzle schema types where possible.

### ✋ Gate 1 — stop and report

Report: the generated migration SQL, the migrate command output, and a `\dt`-equivalent listing of tables now in the database.

**Wait for "approved."**

---

## Milestone 2 — Seed data

Goal: 60 pets with real personality living in the database.

- [ ] `server/db/seed-data.ts` — 60 hand-authored pets. **Write these; do not generate them from word lists.** 30 dogs, 14 cats, 9 birds, 4 rabbits, 3 reptiles. Each needs a name, plausible breed, `age_months`, gender, size, a 1–2 sentence first-person bio in the voice shown in CLAUDE.md §7, 2–4 traits, city/state, and an adoption fee between $45 and $450 scaled roughly by species and age.
- [ ] Photo assignment: 1–3 distinct URLs from that pet's species pool, primary first. Distinct within a pet; repeats across pets are fine. Respect the pool sizes (only 2 reptile images exist, so reptiles get at most 2 photos).
- [ ] `server/db/seed.ts` — idempotent: inserts only when `pets` is empty. `-- --force` truncates and reseeds, refusing to run under `NODE_ENV=production` unless `ALLOW_DESTRUCTIVE_SEED=1`.
- [ ] Run `npm run db:seed` against the real database.
- [ ] Write a throwaway script to `HEAD` every seeded photo URL and confirm all 60 pets' images return 200. Delete the script after.

### ✋ Gate 2 — stop and report

Report: the row count, a random sample of 8 seeded pets rendered as a readable table, the image-URL check results, and confirmation that a second `npm run db:seed` is a no-op.

**Wait for "approved."**

---

## Milestone 3 — Auth

Goal: a person can create an account, sign in, and stay signed in.

- [x] `server/auth.ts` — Better Auth with the Drizzle adapter, `emailAndPassword: { enabled: true, requireEmailVerification: false }`, secret and base URL from env, `trustedOrigins` covering both the dev origin and the eventual Render origin.
- [x] Mount `app.all("/api/auth/*splat", toNodeHandler(auth))` **before** `express.json()`. See CLAUDE.md §11 — this ordering is not optional.
- [x] `server/middleware/requireAuth.ts` — reads the session from headers, attaches `req.user`, returns `401 { error: "unauthorized" }` otherwise.
- [x] `GET /api/me` behind `requireAuth`.
- [x] `client/src/lib/auth-client.ts` — `createAuthClient` from `better-auth/react`.
- [x] Verify end to end with curl: sign up, sign in, hit `/api/me` with the cookie, hit it without.

### ✋ Gate 3 — stop and report

Report: the curl transcript for sign-up → sign-in → authorized `/api/me` → unauthorized `/api/me`, and confirmation that a row appeared in the `user` table.

**Wait for "approved."**

---

## Milestone 4 — API

Goal: every endpoint the client will need, working and typed.

- [x] `GET /api/pets/queue?limit=20` — pets with no swipe row for this user, ordered by a stable pseudo-random hash seeded on the user's id so the order is consistent across refetches. Default limit 20, cap at 50.
- [x] `POST /api/swipes` — Zod-validated body, upsert on the `(user_id, pet_id)` unique index, returns `{ matched: boolean }` (true when direction is `like`).
- [x] `DELETE /api/swipes/:petId` — undo, `204`.
- [x] `GET /api/matches` — liked pets, most recent first.
- [x] All four behind `requireAuth`. Consistent `{ error }` shape and real status codes. A catch-all error handler that logs server-side and never leaks stack traces.
- [x] `client/src/lib/api.ts` — a small typed client wrapping `fetch`, using the shared types, `credentials: "include"`, and throwing a typed `ApiError` on non-2xx.

### ✋ Gate 4 — stop and report

Report: a curl transcript exercising all four endpoints in sequence, including the queue shrinking after a swipe, undo restoring the pet to the queue, and the 401 path.

**Wait for "approved."**

---

## Milestone 5 — App shell, landing page, auth screens

Goal: everything around the deck.

- [ ] React Router 7 with routes: `/` (landing), `/signin`, `/signup`, `/swipe`, `/matches`.
- [ ] `<RequireAuth>` and its inverse: signed-in users at `/`, `/signin`, `/signup` go to `/swipe`; signed-out users at `/swipe`, `/matches` go to `/`. Render nothing while the session resolves — never flash the landing page at a signed-in user.
- [ ] Landing page: full-bleed hero photo, brand-gradient scrim, the logo mark, one headline that says plainly this is a pet adoption app, one supporting line, and a single primary CTA to sign up with a secondary text link to sign in. That's the whole page — no feature grid, no testimonials, no footer links.
- [ ] Sign-in and sign-up pages: full-bleed pet photo on the left half at `md:` and up, form on the right, single column below that. Inline field errors, a disabled-with-spinner submit state, and a readable message on bad credentials.
- [ ] App header for signed-in routes: logo left, links to Swipe and Matches, sign-out right. Compact and out of the way.
- [ ] `sonner` toaster mounted once at the app root, styled to our tokens.

### ✋ Gate 5 — stop and report

Report: screenshots of the landing page, sign-up page, and signed-in shell at both 375px and 1440px, plus confirmation that both redirect directions work.

**Wait for "approved."**

---

## Milestone 6 — The swipe deck

The main event. Build to CLAUDE.md §8 precisely.

- [ ] `PetCard.tsx` — full-bleed `object-cover` photo filling the card, bottom scrim, name in Fredoka at `text-4xl` with age beside it, breed · size · location line, trait chips in the species accent color. No white panel below the image.
- [ ] Photo carousel: segmented progress bar pinned to the top of the card, one segment per photo. Left-third / right-third tap zones to move between photos. A tap must not fire if the pointer moved more than 6px.
- [ ] `useSwipeGesture` hook — Pointer Events with `setPointerCapture`, `touch-action: none`. **One code path for mouse and touch.** Transforms driven imperatively through a ref inside `requestAnimationFrame`; React state changes only on commit.
- [ ] Rotation, threshold, and velocity behavior exactly as specced: `θ = clamp(dx / cardWidth * 18, ±18)`, commit at `|dx| > 0.32 * cardWidth` or velocity `> 0.45 px/ms`, spring-back otherwise on the specified easing.
- [ ] ADOPT and NOPE stamps fading in proportionally to drag distance, mint and berry, rotated ∓14°.
- [ ] `SwipeDeck.tsx` — renders the top 3 cards, back two scaled 0.95/0.90 and `aria-hidden`, the card behind scaling toward 1.0 as the top card is dragged.
- [ ] Keyboard: `←` pass, `→` adopt, `↑`/`↓` photos, `Backspace` undo. Deck focused on mount. Keyboard swipes play the same fly-off animation.
- [ ] `ActionBar.tsx` — circular Pass / Undo / Adopt buttons floating over the card's bottom edge, keyboard operable with visible focus rings, hover 1.12 / press 0.94.
- [ ] Queue management: fetch 20, refetch when under 5 remain, optimistic swipes with background POST, re-queue and toast on failure, `new Image()` preload of the next two primary photos.
- [ ] Skeleton card on first load. Warm empty state with a link to `/matches` when the queue runs dry.
- [ ] `aria-live="polite"` region announcing each swipe outcome by pet name.
- [ ] `prefers-reduced-motion`: dragging still works, animations become instant cross-fades.

### ✋ Gate 6 — stop and report

Report: a screen recording or GIF of a mouse drag on desktop, a keyboard-only swipe, and a touch swipe in a mobile emulator. Confirm no dropped frames during drag, no console errors, and that the queue refills.

**Wait for "approved."**

---

## Milestone 7 — Matches and the match takeover

- [ ] `MatchTakeover.tsx` — full-bleed overlay on every right-swipe: the pet's photo scaled behind a grape scrim, "It's a match!" in Fredoka on the brand gradient, the pet's name, confetti in berry/mango/sun/mint, and "Keep swiping" / "See matches" buttons. Auto-dismiss at 2.2s or on any tap. Suppressed under `prefers-reduced-motion` in favor of a plain cross-fade with no confetti.
- [ ] Confetti hand-rolled with CSS or a small canvas — no new dependency.
- [ ] `/matches` page: responsive grid of full-bleed photo tiles, name and location over a scrim on each. 2 columns on mobile, up to 4 on desktop.
- [ ] Each tile can be un-adopted, which calls the undo endpoint and returns the pet to the queue, with a toast.
- [ ] Empty state for `/matches`: an invitation to start swiping, with a button to `/swipe`.
- [ ] Loading and error states for both screens.

### ✋ Gate 7 — stop and report

Report: a recording of the takeover firing on a right-swipe, screenshots of `/matches` populated and empty at both widths, and confirmation that un-adopting returns the pet to the deck.

**Wait for "approved."**

---

## Milestone 8 — Polish and quality pass

- [ ] Walk CLAUDE.md §13 line by line and fix every violation. Report on each item individually.
- [ ] Test at 320px, 375px, 768px, and 1440px. The deck must be usable at all four.
- [ ] Every image has meaningful alt text. Every interactive element has a visible focus ring. Tab order is sane on all five routes.
- [ ] No layout shift on image load anywhere.
- [ ] Check color contrast on text over photo scrims — deepen the scrim where it fails, don't shrink the text.
- [ ] Favicon, page title, and `<meta name="description">`.
- [ ] `README.md`: what it is, local setup, the command table, and the deploy story. Short.
- [ ] Remove all dead code, unused deps, stray `console.log`s, and any leftover scaffolding from Vite's template.

### ✋ Gate 8 — stop and report

Report: the §13 checklist with a pass/fail and a note for each line, plus screenshots at all four widths.

**Wait for "approved."**

---

## Milestone 9 — Deploy

Do not start this without explicit approval, and do not push to GitHub until asked.

- [ ] `render.yaml` exactly as in CLAUDE.md §12.
- [ ] Verify `npm ci && npm run build && npm run db:migrate && npm start` works from a clean checkout in a scratch directory with `NODE_ENV=production`, serving the built client and the API on one port.
- [ ] Confirm `/api/health` does a real `SELECT 1` and returns non-200 when the database is unreachable.
- [ ] Write a short deploy section in the README: what to set for `DATABASE_URL` (the **internal** Render connection string once deployed), `BETTER_AUTH_URL` (the deployed origin), and `BETTER_AUTH_SECRET`.
- [ ] **Ask before pushing.** Then push to GitHub and connect the Render service.
- [ ] After the first successful deploy: verify sign-up, swiping, and matches all work against production, and confirm the migration ran during the build.

### ✋ Gate 9 — stop and report

Report: the Render build log, the production URL, and a walkthrough confirming the full flow works end to end.

---

## Out of scope

Don't build these. Raise them as suggestions if you think they're worth doing later, but do not implement without approval: chat or messaging, user profiles, pet filters or search, shelter accounts or pet creation, social login, email verification, push notifications, dark mode, i18n, analytics, or a test suite beyond what a milestone explicitly asks for.
