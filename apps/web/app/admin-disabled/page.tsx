import Link from "next/link";

export default function AdminDisabledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Portal Disabled</h1>
        <p className="mt-3 text-gray-500">
          For security, the admin panel is not accessible via web browser.
          All admin operations are handled through our Telegram bot.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Contact your administrator if you need bot access.
        </p>
        <Link
          href="/united"
          className="btn-premium mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"
        >
          ← Back to Store
        </Link>
      </div>
    </div>
  );
}
