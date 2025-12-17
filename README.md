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
2. (Optional) Seed sample data (includes all South African universities and a demo user): `npx tsx server/seed.ts`
3. Start the dev server (Express + Vite middleware): `npm run dev`

Type checking: `npm run check`  
Production build: `npm run build` (outputs to `dist/`)  
Run built server: `npm start`

### Quick preview in Codespaces

1. Start MongoDB inside the Codespace: `docker run -d --name mongo -p 27017:27017 mongo:7`
2. Create a `.env` file with:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/studyoverflow
   SESSION_SECRET=dev-secret-change-me
   PORT=5000
   ```
3. Install & seed: `npm install && npx tsx server/seed.ts`
4. Run `npm run dev` and open the forwarded port `5000` to see the app.

### Verification codes

- New accounts require a 6-digit verification code. Use the "Send code" button on the landing page or `POST /api/auth/send-code` with `{ email }`.
- In development the code is echoed in the API response and server logs. In production only the log entry is emitted.
- Submit the code along with your password when creating the account. Existing users can sign in without a code.

### Demo data

- Running the seed script adds all South African universities plus starter courses, posts, and a demo account:
  - Email: `demo@studyoverflow.africa`
  - Password: `DemoPass123`

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
