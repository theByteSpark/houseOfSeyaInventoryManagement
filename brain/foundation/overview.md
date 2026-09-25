# System Overview

> **Purpose:** What this app is, the stack it's built on, and how the pieces wire together at startup.
>
> **Related docs:** `setup.md` (running it) · `../architecture/feature-conventions.md` (feature internals) · `../architecture/auth-and-routing.md` (routing detail)

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 19 + TypeScript, Vite | `npm run dev` starts the Vite dev server |
| Routing | React Router 7 | `src/app/routes.tsx` |
| Server state | TanStack React Query 5 | `src/app/providers.tsx` sets up the `QueryClient` |
| HTTP client | Axios | `src/lib/apiClient.ts`, with a token-refresh interceptor |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | Used per-feature in modal/form components |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) | No CSS-in-JS, no component library beyond the local `components/ui/` |
| Icons | lucide-react | |
| Path aliases | `@/*` → `src/*` | Set in `vite.config.ts` and `tsconfig.app.json` |
| Lint | oxlint | `npm run lint` |

## Folder Layout

```
src/
├── main.tsx                 Vite entry point, mounts <App />
├── App.tsx                    Wraps <AppProviders><AppRoutes /></AppProviders>
├── index.css                   Tailwind entry
├── app/
│   ├── providers.tsx             QueryClientProvider + BrowserRouter + AuthProvider
│   └── routes.tsx                  The full <Routes> tree — see auth-and-routing.md
├── components/
│   ├── layout/                     AppShell, ProtectedRoute, AdminRoute
│   └── ui/                          Shared, feature-agnostic components (Button, Modal, Table, ...)
├── features/
│   └── <name>/
│       ├── api.ts                    Axios calls + request/response TS types for this feature
│       ├── hooks.ts                   React Query hooks wrapping api.ts
│       ├── <Name>ListPage.tsx           (or similarly named page components)
│       └── <Name>FormModal.tsx           (or *FormPage.tsx for multi-step flows)
├── lib/
│   ├── apiClient.ts                 Axios instance + auth header/refresh interceptor
│   ├── tokenStore.ts                  In-memory access-token storage (not localStorage — see auth doc)
│   ├── useTableQuery.ts                Shared pagination/search/sort UI state hook
│   ├── format.ts, cn.ts, countryCodes.ts   Small formatting/utility helpers
└── types/
    └── index.ts                    Every DTO shape the API returns, hand-kept in sync with the backend
```

Thirteen feature folders exist today: `attributes`, `auth`, `customers`, `dashboard`, `enquiries`, `help`, `import-export`, `inventory`, `purchases`, `reports`, `sales`, `users`, `vendors` — every list-oriented one follows the exact `api.ts`/`hooks.ts` shape, see `architecture/feature-conventions.md`. `help` is a partial exception — a single static-content page with no `api.ts`/`hooks.ts` at all, since it makes no backend calls.

## Provider Tree (`src/app/providers.tsx`)

```
QueryClientProvider (staleTime: 30s, refetchOnWindowFocus: false)
  └── BrowserRouter
        └── AuthProvider   (loads the current session on mount, exposes login/logout/user)
              └── {children}  (AppRoutes)
```

## App Startup Sequence

1. `main.tsx` renders `<App />`, which renders `<AppProviders><AppRoutes /></AppProviders>`.
2. `AuthProvider` (inside providers) fires `authApi.refreshSession()` on mount — this calls the backend's refresh-token cookie flow to silently restore a session without the user re-entering credentials, and sets `isInitializing` while it's in flight.
3. `AppRoutes` renders; `ProtectedRoute`/`AdminRoute` gate based on `useAuth()`'s `isAuthenticated`/`user.role` — see `architecture/auth-and-routing.md`.
4. Once inside, every data-fetching component uses a React Query hook from its feature's `hooks.ts`, which calls its feature's `api.ts`, which calls the shared `apiClient`.

## Deployment Notes

- `npm run build` runs `tsc -b && vite build`, producing a static bundle.
- `vercel.json` rewrites every path to `/index.html` — this is a client-side-routed SPA, so the host must not 404 on a deep link like `/sales/123`.
- `VITE_API_URL` (see `.env.example`) must point at the deployed backend's `/api/v1` base — there's no proxy config for production, only Vite's dev-time defaults.
