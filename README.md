# StudyOverflow

StudyOverflow is a community-driven Q&A app for universities and courses. It pairs a React + Vite client with an Express/Drizzle API backed by PostgreSQL and Replit OIDC authentication.

## Project Structure

- `client/`: React app (Vite, wouter router, Tailwind UI components).
- `server/`: Express API, session/auth integration, database access, and Vite dev middleware.
- `shared/`: Database schema (Drizzle) and shared types between client and server.
- `api/`: Vercel serverless entrypoint that reuses the Express app.
- `script/build.ts`: Builds the client (Vite) and bundles the server (esbuild) into `dist/`.

## Prerequisites

- Node.js 20+
- PostgreSQL database URL
- Replit OIDC client credentials (or compatible OIDC issuer)

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | Secret for Express session cookies. |
| `REPL_ID` | OIDC client ID (Replit by default). |
| `ISSUER_URL` | OIDC issuer URL (defaults to `https://replit.com/oidc`). |
| `PORT` | Port for local/server deployments (defaults to `5000`). |

## Local Development

1. Install dependencies: `npm install`
2. Run database migrations: `npm run db:push`
3. (Optional) Seed sample data: `npx tsx server/seed.ts`
4. Start the dev server (Express + Vite middleware): `npm run dev`

Type checking: `npm run check`  
Production build: `npm run build` (outputs to `dist/`)  
Run built server: `npm start`

## Vercel Deployment

The repo includes `vercel.json` to deploy as a hybrid static + serverless app:

- Static client output is served from `dist/public`.
- API routes are served by `api/index.ts`, which reuses the Express app without opening a listener.
- SPA routing is preserved via rewrites.

Steps:

1. In Vercel, set environment variables: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, and (optionally) `ISSUER_URL`.
2. Provision PostgreSQL (e.g., Vercel Postgres) and run `npm run db:push` locally or via a CI job to create tables.
3. Deploy with `vercel --prod` (build command is `npm run build`, output directory `dist/public`).

## Data Model

- **universities** → **courses** → **posts** → **comments**
- Voting on posts and comments, accepted answers, and course/university filtering.

## Authentication

Authentication uses Replit OIDC via Passport. The login/logout callbacks are mounted at `/api/login` and `/api/logout`. Ensure the OIDC client (REPL_ID/ISSUER_URL) is configured to allow your Vercel domain.
