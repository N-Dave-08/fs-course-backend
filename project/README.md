## Backend course project

This folder is reserved for the **complete reference project** for `fs-course-backend`.

- If you want to follow the course “progressive lessons” path, you can ignore this folder until the end.
- If you want to compare your work, use this folder as the “gold standard” structure for a production-ready Express API.


If you haven’t built it yet, start with the lessons in `level-01-express-basics/` and work forward.

## Project Tracks (how this backend is used)

This course supports two integration patterns with the frontend:

Track A — External API (primary)
- Keep this repo as the dedicated backend service.
- Frontend (Next.js) consumes backend APIs via `NEXT_PUBLIC_API_URL`.
- Best to use for lessons on DB, auth, long‑running tasks, and infra.

Track B — Monorepo alternative
- For simple demos, move smaller endpoints into Next.js API routes in `fs-course-frontend`.
- Use this only for demos or when you want a single deployable app.

Quick dev tips
- Run backend: `cd ../../fs-course-backend && npm run dev`
- Enable `cors` in dev: `npm install cors` and `app.use(cors({ origin: 'http://localhost:3000', credentials: true }))`
- Use environment variables and secrets manager in production (AWS SSM/Secrets Manager).

Keep using this backend for the advanced backend exercises; use the frontend README to follow the Track A and Track B setup steps.

