"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, User, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { migrateLocalProgressToAccount, invalidateAuthCache } from "@/lib/use-game-progress";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Nav links that should warn before navigating away from an active game
const GAME_PATHS = ["/"];
const WARN_ON_NAVIGATE_FROM = GAME_PATHS;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingHref, setPendingHref] = useState("");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0]
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0]
        });
        // Push any in-progress localStorage games to their account
        migrateLocalProgressToAccount();
      } else {
        setUser(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Check if the player has an active in-progress game before navigating away
  function isGameInProgress(): boolean {
    if (typeof window === "undefined") return false;
    if (!WARN_ON_NAVIGATE_FROM.includes(pathname)) return false;
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("bollyriddle:daily:") || k.startsWith("bollyriddle:archive:"));
      for (const key of keys) {
        const saved = JSON.parse(localStorage.getItem(key) ?? "{}");
        if (saved.log?.length > 0 && !saved.finishedAt) return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  function handleNavClick(href: string, e: React.MouseEvent) {
    if (href === pathname) return;
    if (isGameInProgress()) {
      e.preventDefault();
      setPendingHref(href);
      setShowLeaveWarning(true);
    }
  }

  function confirmLeave() {
    setShowLeaveWarning(false);
    router.push(pendingHref);
  }

  function cancelLeave() {
    setShowLeaveWarning(false);
    setPendingHref("");
  }

  async function signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    invalidateAuthCache();
    setUser(null);
  }

  const navLinks = [
    { href: "/room", label: "Group" },
    { href: "/archive", label: "Archive" }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-black tracking-wide text-white" onClick={(e) => handleNavClick("/", e)}>
            <Image src="/starscape-logo.png" alt="Starscape" width={56} height={38} className="h-11 w-auto" priority />
            <span className="text-lg hidden sm:inline">Bollywood Riddle</span>
          </Link>

          <div className="flex items-center gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavClick(href, e)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-300 hover:bg-white/10 transition"
              >
                {label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-1">
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hidden sm:flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {user.name}
                </div>
                <button onClick={signOut} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-600/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 hover:bg-red-600/20 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </button>
            )}

            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500 hidden md:block">
              Beta
            </div>
          </div>
        </nav>
      </header>

      {/* Auth modal */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

      {/* Leave game warning */}
      <Dialog open={showLeaveWarning} onOpenChange={cancelLeave}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave your game?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            You have an active game in progress. Your progress is saved — you can come back and continue. Are you sure you want to leave?
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={cancelLeave}>
              Stay in game
            </Button>
            <Button className="flex-1" onClick={confirmLeave}>
              Leave anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
