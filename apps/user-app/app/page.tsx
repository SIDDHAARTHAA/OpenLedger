import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-white text-center mb-3">
        OpenLedger
      </h1>
      <p className="text-[#9CA3AF] text-center max-w-md mb-10">
        Simple, clear accounting for your business.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-[#1F2937] text-white rounded-lg hover:bg-[#1F2937]"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
