"use client";

// frontend/app/page.tsx
import Link from "next/link";
import { useEffect } from "react";

export default function HomePage() {

  useEffect(() => {
    // Check if we are in a popup
    if (window.opener) {
      // Send message to opener
      window.opener.postMessage("login-success", "*");
      // Close the popup
      window.close();
    }
  }, []);

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
          Banking, rebuilt for
          <span className="text-[#00B5EF]"> developers</span>
        </h1>

        <p className="mt-6 text-white/70 max-w-xl">
          A modern digital wallet with strong security, clean infrastructure,
          and transparent systems.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-[#00B5EF] text-black text-sm font-medium"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-[#00B5EF] text-[#00B5EF] text-sm"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
