# Local Setup & Operations

> **Purpose:** How to get this frontend running locally against the backend, and what every env var does.
>
> **Related docs:** `overview.md` (architecture this setup runs) · sibling repo's `houseOfSeyaInventoryManagementBackend/brain/foundation/setup.md` (the API this app needs running)

---

## Prerequisites

- Node.js (matching `@types/node ^24` in `package.json` — use current LTS or newer)
- The backend API running and reachable (see the backend repo's own setup doc) — this app has no mock-mode; every screen expects a real API.

## First-Time Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_URL` if it differs from the default — never commit `.env`.
3. `npm run dev` — starts Vite on `http://localhost:5173` by default.

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:4000/api/v1` (hardcoded fallback in `apiClient.ts`) | Base URL every API call is built from |

Only one env var exists today. Vite only exposes vars prefixed `VITE_` to client code (`import.meta.env`) — a new env var that isn't prefixed `VITE_` silently won't reach the browser bundle.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` — type-checks as a project reference build, then bundles to `dist/` |
| `npm run lint` | `oxlint` over the codebase |
| `npm run preview` | Serves the built `dist/` locally, for a production-bundle sanity check |

## Connecting to the Backend

- The backend must have `CORS_ORIGIN` (or `CORS_ORIGINS`) set to include this app's origin (`http://localhost:5173` in dev) — see the backend's `brain/foundation/setup.md`.
- Login sets an httpOnly refresh-token cookie from the backend — this requires the frontend and backend to agree on cookie settings across origins in production (same-site/secure flags on the backend side); in local dev both run on `localhost` so this is rarely an issue.
- `apiClient` is configured with `withCredentials: true` specifically so that cookie round-trips (refresh) work — don't remove this when touching `src/lib/apiClient.ts`.

## Common Pitfalls

- Editing `.env` and not restarting `npm run dev` — Vite only reads env vars at server start.
- Assuming `localStorage` holds the access token — it doesn't (see `architecture/auth-and-routing.md`); a hard page refresh always re-runs the silent refresh-session flow, which requires the backend to be reachable.
- Forgetting `VITE_` prefix on a new env var and wondering why `import.meta.env.VITE_YOUR_VAR` is `undefined`.
