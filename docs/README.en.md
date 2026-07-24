# KananOS — Multi-Tenant Ecommerce Platform

> **Platform:** KananOS  
> **Tenant #1:** United Distribution (Florissant, MO)  
> **Owner:** Kanan Enterprises LLC — Fahmi & Fadel Abukanan  
> **Stack:** Next.js 15, PostgreSQL (Neon), Drizzle ORM, Auth.js v5, Tailwind v4, Turborepo

---

## Architecture

```
kananos/
├── apps/
│   └── web/          ← Next.js 15 App Router (customer & admin UI)
├── packages/
│   ├── database/     ← Drizzle schema + migrations + seed
│   ├── validations/  ← Zod schemas
│   └── config/        ← Shared ESLint/TS config
├── docker-compose.yml  ← Local PostgreSQL 16, Redis 7, Meilisearch
└── docs/
    ├── README.en.md  ← This file (English)
    └── README.ar.md  ← Arabic docs (non-technical, for business owners)
```

### Multi-Tenant Routing (Path-Based)

Path-based routing — no subdomain config required:

| URL | Route |
|-----|-------|
| `kanan-e.vercel.app/united` | `/[merchant]` → tenant = "united" |
| `kanan-e.vercel.app/united/products` | `/[merchant]/products` |
| `kanan-e.vercel.app/united/admin` | `/[merchant]/admin` |

The app uses path-based routing (`/united`, `/united/products`, etc.) — not subdomain-based routing. No wildcard DNS or subdomain configuration is needed in Vercel.

---

## Setup

### 1. Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop (local PostgreSQL/Redis/Meilisearch)
- Neon PostgreSQL account (prod)
- Cloudflare R2 bucket (uploads)
- Resend account (email)
- NMI merchant account (payments)

### 2. Environment Variables

Copy `.env.example` → `.env.local`. All keys are already configured.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js encryption secret |
| `RESEND_API_KEY` | Transactional email API key |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket |
| `R2_PUBLIC_URL` | Cloudflare R2 public URL |
| `NEXT_PUBLIC_MEILISEARCH_HOST` | Meilisearch host |
| `MEILISEARCH_API_KEY` | Meilisearch API key |
| `NMI_API_KEY` | NMI payment gateway key |

### 3. Local Dev

```bash
docker compose up -d
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

App at `http://localhost:3000`.  
Merchant storefront at `http://localhost:3000/united`.

### 4. Deployment (Vercel)

1. Import repo in Vercel with **Root Directory** set to `apps/web`
2. No wildcard subdomain DNS required
3. Set env vars in Vercel dashboard
4. `pnpm db:push && pnpm db:seed` against prod
5. The root `vercel.json` handles `rootDirectory` config for the monorepo

---

## Design System

### Theme
- **Dark premium theme** with amber/gold accents
- Glass-morphism cards, gradient backgrounds
- Professional typography with `Inter` font
- Full RTL support for Arabic (`ar`) locale
- Responsive for mobile, tablet, and desktop

### Key CSS Classes
| Class | Purpose |
|-------|---------|
| `bg-gradient-surface` | Main app background gradient |
| `bg-gradient-card` | Card background gradient |
| `bg-gradient-brand` | Amber brand gradient button |
| `btn-premium` | Primary CTA button with glow |
| `btn-outline` | Secondary/outline button |
| `card-premium` | Elevated card with hover lift |
| `hero-radial` | Subtle radial glow behind hero |
| `grid-pattern` | Faint grid pattern background |
| `glass` | Backdrop blur glass effect |
| `text-gradient` | Amber gradient text effect |
| `scroll-reveal` | Scroll-triggered fade-in animation |

### Design Tokens
- **Brand:** `#f59e0b` / `#d97706` / `#b45309` (amber scale)
- **Surface:** `#0a0a0a` / `#141414` / `#1a1a1a` (dark scale)
- **Text:** `#fafafa` primary / `#a3a3a3` muted / `#737373` dim
- **Border:** `#262626` / `#333333`

---

## i18n / L10n

### Locale Detection Priority

1. **Cookie** `locale` (set by LanguageSwitcher)
2. **`Accept-Language` header** (browser preference, set in middleware)
3. **Role-based fallback:**
   - Admin dashboard → Arabic (`ar`)
   - Root maintenance → English (`en`)
   - Customer storefront → browser preference
4. **Hard fallback** → `en`

### Translation Files

```
locales/
├── en.json    ← English strings
├── ar.json    ← Arabic strings
└── index.ts   ← exports locales + default locale
```

### Usage

Server Components:
```tsx
import { getTranslations } from "@/lib/i18n";

export default async function Page() {
  const t = await getTranslations();
  return <h1>{t("admin.dashboard")}</h1>;
}
```

Client Components:
```tsx
"use client";
import { useLocale } from "@/components/LocaleProvider";

export function MyCmp() {
  const { t, locale, setLocale } = useLocale();
  return <button>{t("common.signIn")}</button>;
}
```

### Adding a Language

1. Copy `locales/en.json` → `locales/fr.json`
2. Translate all values
3. Add `"fr"` to `locales/index.ts` `supportedLocales` array
4. Translations auto-resolve with nested key fallback

---

## Admin Panel

**URL:** `/{merchant}/admin`  
**Default Locale:** Arabic (`ar`)  
**Theme:** Dark premium mode auto-applied for staff paths

### Sections

| Section | Status |
|---------|--------|
| Dashboard | ✅ Live |
| Age Verifications | ✅ Live |
| Orders | ⏳ Coming |
| Products CRUD | ⏳ Coming |
| Wholesale Approvals | ⏳ Coming |

### Admin Auth

`role = "admin"` in `tenant_users`.  
Seed creates `admin@uniteddistribution.com`.

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/products` | GET | Tenant-scoped product list (with `limit`/`offset` pagination) |
| `/api/categories` | GET | Tenant-scoped categories |
| `/api/cart` | POST/GET/DELETE | Cart CRUD |
| `/api/orders` | POST/GET | Order creation + history |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/[...nextauth]` | * | Auth.js handlers |
| `/api/age-verification/*` | * | Self-built age verification |
| `/api/wholesale/register` | POST | B2B license submission |

---

## Database (Drizzle PostgreSQL)

### Tables

| Table | Scope | Purpose |
|-------|-------|---------|
| `tenants` | Global | Multi-tenant orgs |
| `users` | Global | Platform-wide accounts |
| `tenant_users` | Per tenant | Membership + role + license |
| `products` | Per tenant | Catalog (SKU, pricing, stock) |
| `categories` | Per tenant | Product groupings |
| `brands` | Per tenant | Manufacturer brands |
| `bulk_pricing_tiers` | Per product | Volume discount tiers |
| `cart_items` | Per user+tenant | Active carts |
| `orders` | Per user+tenant | Order records |
| `order_items` | Per order | Line items |
| `age_verifications` | Per user | Identity docs + status |
| `quote_requests` | Per user+tenant | B2B quote submissions |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (JWT credentials) |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Payments | NMI (high-risk) |
| Search | Meilisearch |
| File Storage | Cloudflare R2 |
| Email | Resend |
| Background Jobs | Inngest |
| Package Manager | pnpm |
| Monorepo | Turborepo |
| Containers | Docker Compose |

---

## Legal

**Top Tobacco v. Kanan Enterprises LLC** — `4:2024cv01260` (E.D. MO)  
**Owners:** Fahmi Abukanan & Fadel Kanan
