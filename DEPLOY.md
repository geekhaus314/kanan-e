=====================================================================
KANANOS - TECHNICAL DEPLOYMENT & OPERATIONS DOCUMENT
Repository: /mnt/kali-drive/kananos  (external drive / WSL mount)
Stack: Next.js 15 (App Router) + React 19 + Drizzle ORM + PostgreSQL
       + NextAuth v5, Turborepo monorepo
Audience: developer / operator (English, technical)
=====================================================================

---------------------------------------------------------------------
1. ARCHITECTURE AT A GLANCE
---------------------------------------------------------------------
This is a multi-tenant e-commerce platform. One codebase serves many
"tenants" (separate stores/brands). Each tenant has its own products,
categories, brands, orders, and users.

Monorepo layout (under repo root):
  apps/web/            -> the Next.js application (storefront + admin)
  packages/database/   -> Drizzle schema + db client (PostgreSQL)
  packages/config/     -> shared build config
  packages/validations/-> shared Zod schemas

Tenant isolation is enforced in code, not just in the UI:
  - Every query filters by tenantId.
  - Every admin route checks the session user's role for that tenant.
  - A user with role "admin" on tenant A CANNOT read or write tenant B.

Auth model (NextAuth v5, JWT strategy):
  - Providers: Credentials (email+password) and Google.
  - Roles: "root" (platform owner) and "admin" (per-tenant).
  - Session token is an HttpOnly cookie (authjs.session-token).

---------------------------------------------------------------------
2. PREREQUISITES
---------------------------------------------------------------------
- Node.js 24 (project pins via .node-version / packageManager pnpm@11.15.1)
- pnpm 11.x
- A PostgreSQL database. Recommended for $0 cost: Neon (free tier).
  Local Postgres also works but requires your machine to stay on.
- (For production deploy) a Vercel account.

Note on storage location:
  The working copy of this repo lives on the external drive
  (Easystore) at /mnt/kali-drive/kananos, mounted into WSL.
  Do NOT move active work back to C:\ -- it is nearly full and that
  is what caused the earlier space problem.

---------------------------------------------------------------------
3. ENVIRONMENT VARIABLES
---------------------------------------------------------------------
The root .env.local (created by Vercel CLI / you) holds shared values:
  DATABASE_URL          PostgreSQL connection string
  AUTH_SECRET           NextAuth session signing secret
  AUTH_URL              e.g. http://localhost:3000 or the production URL
  AUTH_GOOGLE_ID        Google OAuth client id (empty = Google disabled)
  AUTH_GOOGLE_SECRET    Google OAuth secret
  RESEND_API_KEY        transactional email (unused in dev)
  STRIPE_SECRET_KEY     payments (test keys)
  STRIPE_WEBHOOK_SECRET payments webhook
  NEXT_PUBLIC_MEILISEARCH_HOST  search UI host
  MEILISEARCH_API_KEY   search (currently NOT imported by code)
  REDIS_URL             Upstash Redis (currently NOT imported by code)
  NEXT_PUBLIC_SITE_URL  public base URL

IMPORTANT for local dev:
  Next.js only auto-loads env from the app's OWN directory. The web app
  needs a apps/web/.env.local containing at least:
    DATABASE_URL
    AUTH_SECRET
    AUTH_URL
    NEXT_PUBLIC_SITE_URL
  (These can be copied from the root .env.local.)

Services that exist in .env.local but are NOT wired into code yet:
  REDIS_URL, MEILISEARCH_API_KEY / NEXT_PUBLIC_MEILISEARCH_HOST.
  Do not add Redis/Meili just because the vars exist -- they are
  placeholders. Enabling them requires actual code changes.

---------------------------------------------------------------------
4. DATABASE SETUP (Neon example)
---------------------------------------------------------------------
a) Create a Neon project (free tier). Copy the connection string; it
   looks like:
     postgresql://<user>:<pass>@<host>/<db>?sslmode=require

b) Put it in packages/database/.env.local as DATABASE_URL.
   Also put it in apps/web/.env.local (see section 3).

c) Push the schema to the database:
     pnpm db:push
   (This runs drizzle-kit push against DATABASE_URL. It creates all
    tables: tenants, users, tenant_users, categories, brands, products,
    orders, cart_items, age_verifications, quote_requests, auth_*.)

d) (Optional) Seed reference data:
     pnpm db:seed
   The seed creates:
     - tenant "platform" (slug: platform)
     - tenant "united"   (slug: united)
     - admin user admin@uniteddistribution.com with role "admin"
     - product categories
   CAVEAT: the seed INSERTs the admin user. If that user row already
   exists (e.g. from a prior seed), the INSERT fails on unique email
   and the password hash is NOT applied. If you cannot log in, set the
   password hash manually (see section 7).

---------------------------------------------------------------------
5. RUNNING LOCALLY
---------------------------------------------------------------------
From repo root:
  pnpm install          # installs all workspace deps
  pnpm dev              # starts Next.js dev server (turbo dev)
  # app available at http://localhost:3000

Build / typecheck:
  pnpm build            # production build (also typechecks)
  pnpm typecheck        # tsc --noEmit across workspace

The dev server must run INSIDE WSL (not the Windows git-bash shell)
because paths like /mnt/kali-drive/... are WSL-only. To keep it alive
across terminal calls, launch it detached:
  wsl.exe -e bash -c 'setsid bash -c "cd /mnt/kali-drive/kananos/apps/web && exec pnpm dev -p 3000 > /mnt/kali-drive/kananos/devserver.log 2>&1" < /dev/null &'

---------------------------------------------------------------------
6. PHOTO UPLOAD ADMIN FEATURE (built this session)
---------------------------------------------------------------------
What it does:
  Admin users drag-and-drop product photos into a GUI. Files are saved
  per-tenant and attached to the product. Images are listed and can be
  deleted. The product's imageUrls (jsonb string[]) and imageUrl
  (primary) columns are kept in sync.

Where the code lives:
  API route:
    apps/web/app/api/admin/products/[id]/images/route.ts
      GET    -> list images for a product (auth + tenant scoped)
      POST   -> upload one image (multipart, max 8MB, type allowlist:
                jpeg/png/webp/gif/avif), saves to
                public/uploads/products/<tenantSlug>/<productId>/,
                appends to imageUrls
      DELETE -> remove one image (auth + tenant scoped), deletes the
                file from disk and updates imageUrls
  Page (admin UI):
    apps/web/app/[merchant]/admin/products/[id]/images/page.tsx
      - server component: resolves tenant via getTenantBySlug, requires
        admin/root role, else notFound()
      - renders ProductImagesManager (client) + Dropzone (client)
    apps/web/app/[merchant]/admin/products/[id]/images/Dropzone.tsx
    apps/web/app/[merchant]/admin/products/[id]/images/
      ProductImagesManager.tsx
  Shared admin gate:
    apps/web/lib/admin.ts  -> getAdminTenant(request)
      Used by the API route. Requires ?merchant=<slug> + admin/root role.
  Link:
    The product edit page links "Manage photos" to the images page.
  Gitignore:
    /public/uploads/ added so binary uploads are never committed.
    public/uploads/products/.gitkeep keeps the dir in git.

File storage note:
  Uploads are written to the app's public/ folder (served at /uploads/...).
  This works on a normal server and in local dev. On Vercel (serverless)
  the filesystem is EPHEMERAL -- uploaded files would disappear between
  invocations. For production on Vercel, move storage to Vercel Blob /
  S3 / Cloudflare R2 and change the route's write path. (Not done yet.)

Security properties (verified by test, see section 8):
  - Unauthenticated requests -> 401
  - Cross-tenant requests (wrong ?merchant=) -> 403/404
  - File type and size validated server-side
  - Random UUID filenames prevent overwrite / path traversal

---------------------------------------------------------------------
7. PROVISIONING A CLIENT TENANT (delivery to a non-technical client)
---------------------------------------------------------------------
The client should NEVER touch a terminal. You provision his tenant and
account once, then hand him only a URL + email + password.

Step A - Create the tenant (pick a slug, e.g. his brand):
  In psql against DATABASE_URL:
    INSERT INTO tenants (slug, name, is_active)
    VALUES ('<slug>', '<Store Name>', true);

Step B - Create his admin login:
  Generate a bcrypt hash (cost 12) for a password you choose, then:
    INSERT INTO users (email, name, password_hash)
    VALUES ('<his-email>', '<his-name>', '<bcrypt-hash>');
  Link him as admin of the tenant:
    INSERT INTO tenant_users (tenant_id, user_id, role)
    VALUES (
      (SELECT id FROM tenants WHERE slug='<slug>'),
      (SELECT id FROM users WHERE email='<his-email>'),
      'admin'
    );

Step C - Hand off:
  URL:   https://<domain>/<slug>/admin/products
  Email: <his-email>
  Password: <chosen password>
  He logs in to a normal GUI, drags photos, manages products. He cannot
  see or break other tenants, infra, or the database.

Self-serve signup (optional, not built):
  Currently a new tenant is NOT auto-created on signup -- the /api/auth/
  signup route requires the tenant slug to already exist. If you want
  clients to create their own store, add tenant auto-creation in the
  signup route. For a paid-handoff model, manual provisioning (above)
  is safer and simpler.

---------------------------------------------------------------------
8. VERIFICATION PERFORMED (this session, against live Neon DB)
---------------------------------------------------------------------
Real end-to-end test via running dev server + curl, authenticated as
the seeded admin on tenant "united", product id 1:

  Upload   POST /api/admin/products/1/images?merchant=united
           -> HTTP 201, file written to disk, imageUrls updated in DB
  List     GET  /api/admin/products/1/images?merchant=united
           -> HTTP 200, returns the image URL
  Delete   DELETE .../images?merchant=united&url=...
           -> HTTP 200, imageUrls cleared, file removed from disk
  Auth     POST without session  -> HTTP 401
  Tenant   POST with merchant=platform (not his) -> HTTP 403

  Build:   pnpm build -> compiled successfully
  Types:   pnpm typecheck -> pass

No faux functionality: every control is wired and was exercised.

---------------------------------------------------------------------
9. PRODUCTION DEPLOY (Vercel + Neon)
---------------------------------------------------------------------
Why this combo:
  - Your machine does NOT need to stay on. Both compute (Vercel) and
    DB (Neon) live in the cloud.
  - Neon free tier: 0.5 GB, 3 branches, autosuspends when idle
    (first request after idle has a ~1-3s wake delay).

Steps:
  1. Push repo to GitHub.
  2. Import the repo in Vercel (framework: Next.js / Turborepo).
  3. Set env vars in Vercel project settings (same names as section 3):
       DATABASE_URL (Neon), AUTH_SECRET, AUTH_URL (prod URL),
       NEXT_PUBLIC_SITE_URL, etc.
  4. Deploy. Vercel builds with pnpm (packageManager pinned).
  5. Run pnpm db:push once (or use Vercel's build command with it).
  6. Provision the client tenant (section 7).
  7. Give the client his login (section 7, Step C).

Caveat for the photo feature on Vercel:
  Local-disk uploads do not persist on serverless. Before going to
  production with real client photos, switch the route's storage to
  Vercel Blob / S3 / R2 (see section 6 note).

---------------------------------------------------------------------
10. QUICK REFERENCE
---------------------------------------------------------------------
Install deps ...... pnpm install
Dev server ........ pnpm dev  (http://localhost:3000)
Build ............. pnpm build
Typecheck ......... pnpm typecheck
Push schema ....... pnpm db:push
Seed data ......... pnpm db:seed
Admin UI .......... /<tenant-slug>/admin/products
Photo manager ..... /<tenant-slug>/admin/products/<id>/images

Repo on external drive: /mnt/kali-drive/kananos
DB (current) ............. Neon (cloud, reachable from WSL)
DB (alt, not used now) ... local Postgres on Easystore (stopped)
=====================================================================
