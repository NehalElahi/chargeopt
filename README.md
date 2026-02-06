# ChargeOpt — EV Charging Optimization Portal

ChargeOpt is a full‑stack TypeScript app that plans the cheapest, cleanest way to charge an EV by blending solar forecasts, local grid prices, and your battery constraints. It ships with a React + Vite client, an Express API, and a PostgreSQL + Drizzle ORM data layer.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Radix UI primitives, TanStack Query, Wouter routing
- **Backend:** Express 5, Node 20+, Passport OIDC (Replit), Drizzle ORM, ws
- **Database:** PostgreSQL (Drizzle schema in `shared/schema.ts`)
- **Build/Tooling:** TypeScript, esbuild (server bundle), Vite (client), drizzle-kit

## Prerequisites
- Node.js 20+ and npm
- PostgreSQL instance you can reach via `DATABASE_URL`
- Environment variables (see below)

## Environment
Create a `.env` in the repo root with values for local dev:

```
DATABASE_URL=postgres://USER:PASS@localhost:5432/chargeopt
SESSION_SECRET=replace-with-random-string
REPL_ID=your-replit-app-id         # required for OIDC login
ISSUER_URL=https://replit.com/oidc # optional override of the issuer
PORT=5000                          # server + client are served on this port
NODE_ENV=development
```

> The app requires auth; the included flow is Replit OIDC. If you are not on Replit, you’ll need equivalent OIDC values for login or to stub auth before hitting protected routes.

## Setup & Development
1) Install dependencies  
`npm install`

2) Provision the database schema (Drizzle)  
`npm run db:push`

3) Start the dev server (Express + Vite middleware)  
`npm run dev`

4) Open the app at `http://localhost:5000`. API routes are served from the same origin under `/api`.

## Production Build
```
npm run build   # bundles client (Vite) and server (esbuild) into dist/
npm start       # runs dist/index.cjs with NODE_ENV=production
```

## Project Structure
- `client/` — React UI (pages: Landing, Dashboard, Savings, Settings) and shadcn/radix components.
- `server/` — Express entry (`index.ts`), routes, auth (`replit_integrations/auth`), services (optimization, weather, grid/solar forecasts), static serving.
- `shared/` — Drizzle schema, Zod validators, and shared API route contracts.
- `script/build.ts` — bundling pipeline for production.

## Notable API Routes
- `GET /api/car-models` — seeded EV catalogue.
- `GET /api/profile` / `PUT /api/profile` — manage user charging profile (auth).
- `GET /api/forecast/solar` / `GET /api/forecast/prices` — hourly forecasts (lat/lon/system_kw).
- `POST /api/optimize` — core planner returning recommended schedule and savings (auth).
- `GET /api/savings/*` — savings history and weekly rollups (auth).
- `GET /api/weather` — live conditions from Open‑Meteo.

## Troubleshooting
- `DATABASE_URL must be set` on startup → confirm `.env` and that PostgreSQL is running.
- Auth 401s locally → ensure OIDC env vars are populated; session secret must be non-empty.
- Port already in use → set a new `PORT` in `.env`.

## Handy Scripts
- `npm run check` — typecheck with tsc.
- `npm run db:push` — sync schema to the database via drizzle-kit.

## License
MIT
