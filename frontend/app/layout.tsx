// frontend/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "OpenLedger",
  description: "Modern digital banking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#0B0F14] text-white">
      <body
        className={`${inter.variable} ${plex.variable} font-sans min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
