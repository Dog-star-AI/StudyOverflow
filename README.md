# StudyOverflow

StudyOverflow is a community-driven Q&A app for universities and courses. It pairs a React + Vite client with an Express API backed by MongoDB and simple, session-based email/password authentication.

## Project Structure

- `client/`: React app (Vite, wouter router, Tailwind UI components).
- `server/`: Express API, session/auth integration, database access, and Vite dev middleware.
- `shared/`: Shared types between client and server.
- `api/`: Vercel serverless entrypoint that reuses the Express app.
- `script/build.ts`: Builds the client (Vite) and bundles the server (esbuild) into `dist/`.

## Prerequisites

- Node.js 20+
- MongoDB connection string

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DB` | (Optional) Database name (defaults to `studyoverflow`). |
| `SESSION_SECRET` | Secret for Express session cookies. |
| `PORT` | Port for local/server deployments (defaults to `5000`). |

## Local Development

1. Install dependencies: `npm install`
2. (Optional) Seed sample data: `npx tsx server/seed.ts`
3. Start the dev server (Express + Vite middleware): `npm run dev`

Type checking: `npm run check`  
Production build: `npm run build` (outputs to `dist/`)  
Run built server: `npm start`

## Vercel Deployment

The repo includes `vercel.json` to deploy as a hybrid static + serverless app:

- Static client output is served from `dist/public`.
- API routes are served by `api/index.ts`, which reuses the Express app without opening a listener.
- SPA routing is preserved via rewrites.

Steps:

1. In Vercel, set environment variables: `MONGODB_URI`, `SESSION_SECRET`, and (optionally) `MONGODB_DB`.
2. Provision MongoDB (e.g., MongoDB Atlas).
3. Deploy with `vercel --prod` (build command is `npm run build`, output directory `dist/public`).

## Data Model

- **universities** → **courses** → **posts** → **comments**
- Voting on posts and comments, accepted answers, and course/university filtering.

## Authentication

Authentication uses session-backed email/password login. The login endpoint is `/api/auth/login`, the current user endpoint is `/api/auth/user`, and logout is available at `/api/logout`.
