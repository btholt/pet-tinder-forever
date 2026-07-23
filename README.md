# Pawmarks

A Tinder-style pet adoption web app. Sign up, swipe through adoptable pets,
match instantly on every right-swipe, and manage your matches — or send one
back to the deck.

## Stack

React 19 + TypeScript + Vite on the client, Express 5 + Drizzle ORM +
PostgreSQL on the server, Better Auth for email/password sessions, Tailwind
CSS 4 + shadcn/ui for styling. One Node process serves the API and the built
client in production. See `CLAUDE.md` for the full spec this app was built
against.

## Local setup

Prerequisites: Node 22+, a PostgreSQL database (local or remote).

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:generate    # only needed after a schema change
npm run db:migrate     # create the tables
npm run db:seed        # load 60 sample pets
npm run dev            # client on :5173 (proxies /api to :3000), API on :3000
```

Sign up with any email/password at `http://localhost:5173` and start
swiping.

## Commands

| Command              | What it does                                                |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Runs the Vite dev server and the Express API concurrently     |
| `npm run build`       | Builds the client (`dist/public`) and bundles the server (`dist/server.js`) |
| `npm start`           | Runs the production build (`NODE_ENV=production`)            |
| `npm run db:generate` | Generates a new SQL migration from the Drizzle schema        |
| `npm run db:migrate`  | Applies pending migrations                                   |
| `npm run db:seed`     | Idempotently loads the 60 sample pets (`-- --force` to wipe and reseed, blocked in production unless `ALLOW_DESTRUCTIVE_SEED=1`) |
| `npm run db:studio`   | Opens Drizzle Studio against `DATABASE_URL`                  |
| `npm run lint`        | ESLint across the whole repo                                 |
| `npm run typecheck`   | Type-checks the client and server                            |

## Environment

See `.env.example`. Locally:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/pawmarks
BETTER_AUTH_SECRET=<32+ random chars — openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

## Deploying (Render)

`render.yaml` at the repo root defines a single web service that runs
`npm ci && npm run build && npm run db:migrate` at build time and
`npm run start` to serve. Health checks hit `/api/health`, which does a real
`SELECT 1` against the database.

Environment variables to set on the Render service:

- `DATABASE_URL` — the **internal** Render Postgres connection string once
  the database and web service are in the same region (faster, no TLS
  config needed). The external connection string only works over TLS.
- `BETTER_AUTH_URL` — the deployed origin (e.g. `https://pawmarks.onrender.com`).
- `BETTER_AUTH_SECRET` — Render can generate this for you (see `render.yaml`).

Seeding is not part of the deploy — run `npm run db:seed` manually once
against the production database after the first deploy.
