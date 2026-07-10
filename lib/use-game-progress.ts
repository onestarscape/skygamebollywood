"use client";

import { createClient } from "@supabase/supabase-js";
import type { GameState } from "@/lib/types";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Cache the signed-in state for the session — we check once and reuse.
// This prevents calling getUser() on every single guess/state change.
let _signedInCache: boolean | null = null;
let _signedInCacheTime = 0;
const CACHE_TTL_MS = 60_000; // re-check at most once per minute

async function isSignedIn(): Promise<boolean> {
  const now = Date.now();
  if (_signedInCache !== null && now - _signedInCacheTime < CACHE_TTL_MS) {
    return _signedInCache;
  }
  const { data } = await getSupabase().auth.getUser();
  _signedInCache = Boolean(data.user);
  _signedInCacheTime = now;
  return _signedInCache;
}

// Call this when auth state changes so cache is invalidated immediately
export function invalidateAuthCache() {
  _signedInCache = null;
  _signedInCacheTime = 0;
}

/**
 * Loads game state for a given puzzle key.
 * - Signed in: tries Supabase first, falls back to localStorage
 * - Guest: localStorage only
 */
export async function loadProgress(
  mode: string,
  puzzleKey: string,
  targetId: string
): Promise<GameState | null> {
  const signedIn = await isSignedIn();

  if (signedIn) {
    try {
      const res = await fetch(
        `/api/progress?mode=${encodeURIComponent(mode)}&puzzleKey=${encodeURIComponent(puzzleKey)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.state && data.state.targetId === targetId) {
        return data.state as GameState;
      }
    } catch {
      // fall through to localStorage
    }
  }

  // Guest or Supabase miss — use localStorage
  const localKey = `bollyriddle:${mode}:${puzzleKey}`;
  try {
    const saved = window.localStorage.getItem(localKey);
    if (saved) {
      const parsed = JSON.parse(saved) as GameState;
      if (parsed.targetId === targetId) return parsed;
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Saves game state.
 * - Always saves to localStorage (instant, offline-safe)
 * - Also saves to Supabase if signed in (fire-and-forget, non-blocking)
 */
export function saveProgress(state: GameState): void {
  // Synchronous localStorage write — never blocks rendering
  const localKey = `bollyriddle:${state.mode}:${state.puzzleKey}`;
  try {
    window.localStorage.setItem(localKey, JSON.stringify(state));
  } catch { /* ignore */ }

  // Async Supabase write — only if signed in, completely non-blocking
  // Uses the cached auth check so it never causes a network call on every guess
  isSignedIn().then((signedIn) => {
    if (!signedIn) return;
    fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: state.mode,
        puzzleKey: state.puzzleKey,
        targetId: state.targetId,
        board: state.board,
        log: state.log,
        startedAt: state.startedAt,
        won: state.won,
        finishedAt: state.finishedAt
      })
    }).catch(() => { /* non-critical */ });
  }).catch(() => { /* non-critical */ });
}

/**
 * Called when user signs in — migrates any in-progress localStorage
 * games to their Supabase account so they're not lost.
 */
export async function migrateLocalProgressToAccount(): Promise<void> {
  invalidateAuthCache(); // force re-check after sign-in
  const signedIn = await isSignedIn();
  if (!signedIn) return;

  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("bollyriddle:"));
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const state = JSON.parse(saved) as GameState;
      if (!state.log?.length) continue;
      // Fire and forget — migration is best-effort
      fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: state.mode,
          puzzleKey: state.puzzleKey,
          targetId: state.targetId,
          board: state.board,
          log: state.log,
          startedAt: state.startedAt,
          won: state.won,
          finishedAt: state.finishedAt
        })
      }).catch(() => {});
    }
  } catch { /* non-critical */ }
}
