import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="text-xl font-semibold tracking-wide text-[#00B5EF]">
          OpenLedger
        </div>

        <div className="flex gap-6 text-sm">
          <Link href="/login" className="hover:text-[#00B5EF]">
            Login
          </Link>
          <Link
            href="/signup"
            className="text-[#00B5EF] hover:opacity-80"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center px-8 max-w-5xl">
        <h1 className="text-5xl font-semibold leading-tight font-[var(--font-plex)]">
          Finance backends,
          <span className="text-[#00B5EF]"> built to explain themselves</span>
        </h1>

        <p className="mt-6 text-white/70 max-w-xl">
          A role-based finance dashboard backend with clean records APIs,
          summary analytics, and reviewer-friendly documentation.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="app-button-primary"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="app-button-secondary"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
