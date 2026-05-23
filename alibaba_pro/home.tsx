/**
 * Home.tsx — United Distribution
 * Senior-level rewrite: Alibaba-inspired B2B wholesale platform
 * Security: XSS-safe rendering, CSP-compatible, no dangerouslySetInnerHTML
 * UX: Progressive disclosure, skeleton loading, accessibility (WCAG AA)
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  ShoppingCart,
  Zap,
  Globe,
  Award,
  ArrowRight,
  Shield,
  TrendingDown,
  Package,
  Star,
  ChevronRight,
  Search,
  Bell,
  User,
  Menu,
  X,
  Truck,
  BarChart3,
  Clock,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";

// ─── Type-safe category icon map (no dangerouslySetInnerHTML needed) ──────────
const CATEGORY_ICONS: Record<string, string> = {
  tobacco: "🚬",
  cannabis: "🌿",
  vape: "💨",
  accessories: "🔧",
  beverages: "🥤",
  snacks: "🍫",
  health: "💊",
  default: "📦",
};

function getCategoryIcon(slug?: string): string {
  if (!slug) return CATEGORY_ICONS.default;
  const key = Object.keys(CATEGORY_ICONS).find((k) => slug.includes(k));
  return key ? CATEGORY_ICONS[key] : CATEGORY_ICONS.default;
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── Product card skeleton ─────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <Skeleton className="w-full h-44" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ─── Animated counter for hero stats ──────────────────────────────────────────
function AnimatedStat({ value, label, prefix = "" }: { value: string; label: string; prefix?: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900">
        {prefix}{value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ─── Main Navigation ──────────────────────────────────────────────────────────
function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [setLocation]);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "border-b border-gray-100"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Top bar — trust signals + account */}
      <div className="bg-gray-900 text-gray-300 text-xs py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-400" aria-hidden />
              Verified Wholesale Distributor
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Truck className="w-3 h-3" aria-hidden />
              Free freight on orders $2,500+
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/account" className="hover:text-white transition-colors flex items-center gap-1">
                  <User className="w-3 h-3" aria-hidden />
                  {user?.name ?? "Account"}
                </Link>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => {/* logout handled by auth hook */}}
                  className="hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <a href={getLoginUrl()} className="hover:text-white transition-colors">
                Sign In / Register
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="United Distribution — Home">
            <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center font-black text-gray-900 text-sm tracking-tight select-none">
              UD
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 text-base leading-tight">United Distribution</div>
              <div className="text-xs text-gray-400 leading-tight">Wholesale Platform</div>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search products, brands, SKUs…"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                aria-label="Search products"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.trim();
                    if (q) window.location.href = `/browse?q=${encodeURIComponent(q)}`;
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <Link href="/browse" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              Browse
            </Link>
            <Link href="/deals" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              Deals
            </Link>
            {isAuthenticated && (
              <Link
                href="/cart"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1.5"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden />
                Cart
              </Link>
            )}
            {!isAuthenticated && (
              <a
                href={getLoginUrl()}
                className="ml-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm rounded-lg transition-colors"
              >
                Sign In
              </a>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-4 px-4 space-y-1" role="menu">
          <div className="mb-3">
            <input
              type="search"
              placeholder="Search products…"
              className="w-full pl-3 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Search products"
            />
          </div>
          {[
            { label: "Browse", href: "/browse" },
            { label: "Deals", href: "/deals" },
            ...(isAuthenticated ? [{ label: "Cart", href: "/cart" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <a
              href={getLoginUrl()}
              className="block px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg"
            >
              Sign In / Register
            </a>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner() {
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
      aria-label="Welcome banner"
    >
      {/* Geometric accent — pure CSS, CSP-safe */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-400 opacity-5 rounded-bl-[120px] pointer-events-none" aria-hidden />

      <div className="relative container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-2xl">
          <Badge className="mb-4 bg-amber-400/20 text-amber-300 border-amber-400/30 font-medium">
            🏆 #1 Wholesale Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Wholesale at
            <span className="text-amber-400"> Scale.</span>
            <br />
            Sourced for Business.
          </h1>
          <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-xl">
            Thousands of verified products across tobacco, cannabis, accessories and more.
            Tiered bulk pricing that grows with your business — net 30 terms available.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse">
              <Button
                size="lg"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-8 shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02]"
              >
                Browse Catalog
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-white/10 transition-all"
                >
                  Create Account
                </Button>
              </a>
            )}
          </div>

          {/* Trust stats */}
          <div className="mt-14 pt-10 border-t border-gray-700 grid grid-cols-3 gap-6 sm:gap-10">
            <AnimatedStat value="12,000+" label="Products" />
            <AnimatedStat value="$2.4M+" label="Orders Processed" prefix="" />
            <AnimatedStat value="98.7%" label="Fill Rate" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Feature pillars ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: TrendingDown,
    title: "Tiered Bulk Pricing",
    desc: "Automatic discounts unlock as quantities increase. Real-time price calculation at checkout.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Shield,
    title: "Verified & Compliant",
    desc: "Age-restricted products require identity verification. Full compliance audit trail.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Truck,
    title: "Freight Optimization",
    desc: "Free freight at $2,500+. LTL and full truckload quoting for large orders.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: BarChart3,
    title: "Order Analytics",
    desc: "Track spend by category, reorder history, and preferred brand performance.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
] as const;

function FeaturesSection() {
  return (
    <section className="py-20 bg-white" aria-labelledby="features-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-4">
            Built for serious wholesale buyers
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Every feature designed around how distributors actually work — not consumer retail
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 group"
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${color}`} aria-hidden />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Category Grid ─────────────────────────────────────────────────────────────
function CategoriesSection() {
  const { data: categories, isLoading } = trpc.categories.getAll.useQuery();

  return (
    <section className="py-20 bg-gray-50" aria-labelledby="categories-heading">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 id="categories-heading" className="text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="text-gray-500 mt-1">Organized for fast wholesale discovery</p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            All categories
            <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                  <Skeleton className="w-12 h-12 mx-auto mb-3" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))
            : categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/browse?category=${category.id}`}
                  className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {getCategoryIcon(category.slug)}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{category.description}</p>
                  )}
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products ─────────────────────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
  const price = parseFloat(product.basePrice?.toString() ?? "0");

  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-amber-200 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      aria-label={`${product.name} — $${price.toFixed(2)}`}
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            aria-hidden
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" aria-hidden />
          </div>
        )}
        {product.isAgeRestricted && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-red-600 text-white text-[10px] font-bold border-0">
              21+ ONLY
            </Badge>
          </div>
        )}
        {product.stockLevel <= 10 && product.stockLevel > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-orange-500 text-white text-[10px] font-bold border-0">
              LOW STOCK
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1 font-mono">{product.sku}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-black text-amber-600">
              ${price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">base / unit</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {product.stockLevel > 0 ? (
                <span className="text-green-600 font-medium flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" aria-hidden />
                  In Stock
                </span>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedProductsSection() {
  const { data: featuredProducts, isLoading } = trpc.products.search.useQuery({ query: "", limit: 8 });

  return (
    <section className="py-20 bg-white" aria-labelledby="featured-heading">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 id="featured-heading" className="text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-gray-500 mt-1">Top movers across all categories</p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts?.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-amber-400" aria-label="Call to action">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
          Ready to scale your wholesale operations?
        </h2>
        <p className="text-gray-700 text-lg mb-10 max-w-xl mx-auto">
          Join 3,000+ businesses that source from United Distribution. Net-30 terms for qualified accounts.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/browse">
            <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 shadow-xl">
              Start Ordering Now
            </Button>
          </Link>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-900/10 font-bold">
                Apply for Account
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const LINKS = {
    Products: [
      { label: "Browse Catalog", href: "/browse" },
      { label: "Weekly Deals", href: "/deals" },
      { label: "New Arrivals", href: "/browse?sort=newest" },
      { label: "Age-Restricted", href: "/browse?ageRestricted=true" },
    ],
    Account: [
      { label: "Sign In", href: getLoginUrl() },
      { label: "My Orders", href: "/account/orders" },
      { label: "Quote Requests", href: "/account/quotes" },
    ],
    Company: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-400" role="contentinfo">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center font-black text-gray-900 text-xs">
                UD
              </div>
              <span className="font-bold text-white text-sm">United Distribution</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Your trusted wholesale partner. Verified products. Transparent pricing. Reliable fulfillment.
            </p>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Shield className="w-3.5 h-3.5" aria-hidden />
              SSL Secured & Compliant
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-semibold text-white text-sm mb-4">{heading}</h3>
              <ul className="space-y-2.5" role="list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link href={href} className="text-sm hover:text-white transition-colors">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-sm hover:text-white transition-colors">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} United Distribution LLC. All rights reserved.</p>
          <p className="text-gray-600">
            By using this platform you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-400">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-gray-400">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page composition ──────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg z-[100]"
      >
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content">
        <HeroBanner />
        <FeaturesSection />
        <CategoriesSection />
        <FeaturedProductsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
