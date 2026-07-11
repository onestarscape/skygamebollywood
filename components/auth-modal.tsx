"use client";

import { useState } from "react";
import { Mail, LogIn, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function signInWithEmail() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await getSupabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` }
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Sign in to BollyRiddle</DialogTitle>
          <p className="text-sm text-zinc-400">Optional — save your streaks across devices.</p>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="font-bold mb-1">Check your email ✓</div>
            We sent a magic link to <span className="font-semibold">{email}</span>.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-lg bg-white/[0.05] p-1">
              {(["google", "email"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 rounded-md py-2 text-xs font-black uppercase tracking-wide transition ${
                    tab === t ? "bg-red-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}>
                  {t === "google" ? "Google" : "Email"}
                </button>
              ))}
            </div>

            {tab === "google" && (
              <Button className="w-full gap-2" onClick={signInWithGoogle} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Continue with Google
              </Button>
            )}

            {tab === "email" && (
              <div className="space-y-2">
                <Input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signInWithEmail()} />
                <Button className="w-full gap-2" onClick={signInWithEmail}
                  disabled={loading || !email.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send magic link
                </Button>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
            <p className="text-center text-xs text-zinc-500">
              No account needed to play. Sign in only to save your progress.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
