import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MovieRiddl",
  description: "Guess the daily Bollywood movie in 8 tries.",
  applicationName: "MovieRiddl",
  manifest: "/manifest.json",
  openGraph: {
    title: "MovieRiddl",
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
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-600 shadow-glow">
                  <Film className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-lg">MovieRiddl</span>
              </Link>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-300">
                Playable beta
              </div>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
