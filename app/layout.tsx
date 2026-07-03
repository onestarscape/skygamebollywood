import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bollywood Riddle",
  description: "Guess the daily Bollywood movie in 8 tries.",
  applicationName: "Bollywood Riddle",
  manifest: "/manifest.json",
  openGraph: {
    title: "Bollywood Riddle",
    description: "A daily Bollywood movie guessing game.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <nav className="container flex h-16 items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2 font-black tracking-wide text-white">
                <Image src="/starscape-logo.png" alt="Starscape" width={56} height={38} className="h-11 w-auto" priority />
                <span className="text-lg">Bollywood Riddle</span>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/archive" className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-300 hover:bg-white/10 transition">
                  Archive
                </Link>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-300">
                  Playable beta
                </div>
              </div>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
