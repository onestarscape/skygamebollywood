import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

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
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
