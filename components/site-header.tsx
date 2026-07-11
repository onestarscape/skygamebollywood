"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, User, X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-client";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { migrateLocalProgressToAccount, invalidateAuthCache } from "@/lib/use-game-progress";

const WARN_ON_NAVIGATE_FROM = ["/"];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingHref, setPendingHref] = useState("");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    // Use singleton client — never creates a new instance on re-render
    const supabase = getSupabaseBrowser();

    // Get initial session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0]
        });
      }
    });

    // Subscribe to auth changes — fires on sign-in, sign-out, token refresh
    // Token refresh should NOT re-trigger migration, so we track if it's a real sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0]
        });
        // Only migrate on actual sign-in, not token refresh
        migrateLocalProgressToAccount();
      } else if (event === "SIGNED_OUT") {
        invalidateAuthCache();
        setUser(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Silent token refresh — just update user silently, no migration
        setUser((prev) => prev ? {
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0]
        } : null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // runs once only — singleton client prevents duplication

  function isGameInProgress(): boolean {
    if (typeof window === "undefined") return false;
    if (!WARN_ON_NAVIGATE_FROM.includes(pathname)) return false;
    try {
      const keys = Object.keys(localStorage).filter(
        (k) => k.startsWith("bollyriddle:daily:") || k.startsWith("bollyriddle:archive:")
      );
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
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT event will handle state update
  }

  const navLinks = [
    { href: "/room", label: "Group" },
    { href: "/archive", label: "Archive" }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <nav className="container flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-black tracking-wide text-white"
            onClick={(e) => handleNavClick("/", e)}>
            <Image src="/starscape-logo.png" alt="Starscape" width={56} height={38} className="h-11 w-auto" priority />
            <span className="text-lg hidden sm:inline">Bollywood Riddle</span>
          </Link>

          <div className="flex items-center gap-2">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                onClick={(e) => handleNavClick(href, e)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-300 hover:bg-white/10 transition">
                {label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-1">
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hidden sm:flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {user.name}
                </div>
                <button onClick={signOut}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-600/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 hover:bg-red-600/20 transition">
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

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

      <Dialog open={showLeaveWarning} onOpenChange={cancelLeave}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <h2 className="text-lg font-black">Leave your game?</h2>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            You have an active game in progress. Your progress is saved — you can come back and continue.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={cancelLeave}>Stay in game</Button>
            <Button className="flex-1" onClick={confirmLeave}>Leave anyway</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
