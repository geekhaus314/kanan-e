export default function PlatformLanding() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-2xl font-black text-gray-900">
          K
        </div>
        <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900">
          KananOS
        </h1>
        <p className="mb-8 text-lg text-gray-500">
          Multi-tenant commerce platform.
          <br />
          Visit a merchant store to start shopping.
        </p>
        <a
          href="http://united.kanan-e.vercel.app"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Visit United Distribution →
        </a>
      </div>
    </main>
  );
}
