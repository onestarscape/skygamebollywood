"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  async function signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  if (!supabase) {
    return (
      <Button variant="outline" size="sm" disabled className="hidden sm:inline-flex">
        <UserCircle className="h-4 w-4" />
        Guest
      </Button>
    );
  }

  return user ? (
    <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
      <LogOut className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" onClick={signIn}>
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Google</span>
    </Button>
  );
}
