import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";

export default async function MerchantHome({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  const session = await auth();

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href={`/${merchant}`} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-sm font-black text-gray-900">
              UD
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold leading-tight text-gray-900">
                {tenant.name}
              </div>
              <div className="text-xs leading-tight text-gray-400">
                Wholesale Platform
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${merchant}/products`}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-amber-600"
            >
              Products
            </Link>
            <Link
              href={`/${merchant}/cart`}
              className="flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-amber-600"
            >
              Cart
              <CartBadge />
            </Link>
            {session?.user ? (
              <Link
                href={`/${merchant}/account`}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-amber-600"
              >
                Account
              </Link>
            ) : (
              <Link
                href={`/${merchant}/auth/signin`}
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
            <div className="max-w-2xl">
              <span className="mb-4 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-300">
                #1 Wholesale Platform
              </span>
              <h1 className="mb-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                Wholesale at
                <span className="text-amber-400"> Scale.</span>
                <br />
                Sourced for Business.
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-gray-300">
                Thousands of verified products across tobacco, vape, accessories
                and more. Tiered bulk pricing that grows with your business.
              </p>
              <Link
                href={`/${merchant}/products`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-8 py-3 font-bold text-gray-900 shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02] hover:bg-amber-500"
              >
                Browse Catalog →
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Ready to scale your wholesale operations?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500">
              Join thousands of businesses that source from {tenant.name}.
            </p>
            <Link
              href={`/${merchant}/products`}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 font-bold text-white shadow-xl transition-all hover:bg-gray-800"
            >
              Start Ordering Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
      </footer>
    </div>
  );
}
