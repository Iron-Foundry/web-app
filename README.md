# Iron Foundry - Web App

Community web frontend for the Iron Foundry OSRS clan. Built with React 19, TanStack Router,
Shadcn/ui components, and Tailwind CSS 4. Served by Bun with hot-module replacement in development.

---

## Requirements

- [Bun](https://bun.sh/) v1.3+

---

## Setup

```bash
bun install
```

## Development

```bash
bun dev
```

Starts the Bun server with HMR on `http://localhost:3000`.

## Build and production

```bash
bun run build.ts   # production build to dist/
bun start          # production server
```

## Checks

```bash
bun run typecheck        # tsc --noEmit (strict)
bun test tests/          # unit tests
bun run test:e2e         # Playwright
bun run gen:api-types    # regenerate src/api/schema.d.ts from ../api-backend/openapi.json
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BUN_PUBLIC_API_URL` | `http://localhost:8000` | API base URL, inlined into the client bundle |
| `INTERNAL_API_URL` | `BUN_PUBLIC_API_URL` | Server-side API URL the prod server uses for OG meta prefetch |
| `SITE_URL` | `https://ironfoundry.cc` | Canonical site URL for OG tags |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TanStack Router | Client-side routing (routes registered in `src/routes/routeTree.ts`) |
| Tailwind CSS 4 | Utility-first styling |
| Shadcn/ui (Radix UI) | Accessible UI component primitives |
| Recharts | Data visualisation |
| Bun | Runtime, server, and package manager |
| TypeScript (strict) | Type safety |

---

## Structure

```
src/
  index.tsx          - Bun server entry point (serves HTML + HMR in dev)
  prod-server.ts     - Production server; injects API_URL and per-route OG meta into dist/index.html
  frontend.tsx       - Client hydration entry point
  App.tsx            - Root React component
  index.css          - Global styles
  routes/            - Page routes, one per file
    routeTree.ts     - Route manifest; every route is imported and registered here
    __root.tsx       - Root layout
    leaderboards/, members/, plugins/, resources/, staff-portal/, activities/ - nested sections
  api/               - Typed API clients, one per resource
    client.ts        - apiFetch wrapper
    schema.d.ts      - generated from ../api-backend/openapi.json (bun run gen:api-types)
  components/
    layout/          - RootLayout, TopNav, SideNav, NavLinks, LayoutSwitcher
    ui/              - Shadcn component library (button, card, dialog, table, chart, …)
  hooks/             - Shared React hooks
  context/           - React context providers (LayoutContext)
  embed/             - Server-rendered OG/embed images
  lib/               - Shared utilities (navigation.ts, utils.ts)
  types/             - Shared type declarations
  assets/            - Images, logos, gem icons, fonts
```

The layout supports two modes (top nav and side nav) switchable at runtime via `LayoutContext`.
