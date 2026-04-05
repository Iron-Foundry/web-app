# Iron Foundry — Web App

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

## Production

```bash
bun start
```

## Build

```bash
bun run build.ts
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TanStack Router | File-based client-side routing |
| Tailwind CSS 4 | Utility-first styling |
| Shadcn/ui (Radix UI) | Accessible UI component primitives |
| Recharts | Data visualisation |
| Bun | Runtime, server, and package manager |
| TypeScript (strict) | Type safety |

---

## Structure

```
src/
  index.tsx          — Bun server entry point (serves HTML + HMR in dev)
  frontend.tsx       — Client hydration entry point
  App.tsx            — Root React component
  index.css          — Global styles
  routes/            — TanStack Router pages
    __root.tsx       — Root layout
    home.tsx         — Home page
    about.tsx        — About page
    rules.tsx        — Rules page
  components/
    layout/          — RootLayout, TopNav, SideNav, NavLinks, LayoutSwitcher
    ui/              — Shadcn component library (button, card, dialog, table, chart, …)
  context/           — React context providers (LayoutContext)
  lib/               — Shared utilities (navigation.ts, utils.ts)
  assets/            — Images, logos, gem icons, fonts
```

The layout supports two modes (top nav and side nav) switchable at runtime via `LayoutContext`.
