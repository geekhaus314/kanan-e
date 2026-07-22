# KananOS — Multi-Tenant Ecommerce Platform

**Stack:** Next.js 15, PostgreSQL (Neon), Drizzle ORM, Auth.js v5, Tailwind v4, Turborepo

---

Full documentation: [`docs/README.en.md`](docs/README.en.md)
Arabic docs: [`docs/README.ar.md`](docs/README.ar.md)

## Quick Start

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

## Vercel Deployment

This is a Turborepo monorepo. The Next.js app lives in `apps/web/`.
Import this repo in Vercel with **Root Directory** set to `apps/web`, or use the included root `vercel.json`.

See [`docs/README.en.md`](docs/README.en.md) for architecture, API, database schema, and production setup.
