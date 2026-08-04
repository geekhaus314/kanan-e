import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PromoBanner } from "@/components/PromoBanner";

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

  const { t } = await getTranslations();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${merchant}`}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand transition-transform group-hover:scale-105">
              <span className="text-xs font-black text-white">UD</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold tracking-tight text-gray-900">
                {t("home.heroSubtitle")}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-gray-400">
                {t("common.wholesale")}
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href={`/${merchant}/products`}
              className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-brand-600"
            >
              {t("common.products")}
            </Link>
            <Link
              href={`/${merchant}/cart`}
              className="relative flex items-center rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-brand-600"
            >
              {t("common.cart")}
              <CartBadge />
            </Link>
            {session?.user ? (
              <>
                <Link
                  href={`/${merchant}/account`}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-brand-600"
                >
                  {t("common.account")}
                </Link>
                <Link
                  href={`/${merchant}/employee/orders`}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:text-brand-600"
                >
                  {t("common.employee")}
                </Link>
              </>
            ) : (
              <Link
                href={`/${merchant}/auth/signin`}
                className="btn-premium rounded-lg px-4 py-2 text-xs"
              >
                {t("common.signIn")}
              </Link>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <PromoBanner />

      <main>{children}</main>

      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Kanan Enterprises LLC. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
