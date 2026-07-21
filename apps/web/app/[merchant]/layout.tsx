import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function MerchantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
      </footer>
    </div>
  );
}
