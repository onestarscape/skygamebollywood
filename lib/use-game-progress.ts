"use client";

// Simple, safe progress persistence.
// localStorage is used for all real-time game state (instant, no network, no loops).
// Supabase is only written on explicit events: game finish and page unload.
// This eliminates the infinite render loop that was crashing the browser.

import type { GameState } from "@/lib/types";

export function localKey(state: Pick<GameState, "mode" | "puzzleKey">): string {
  return `bollyriddle:${state.mode}:${state.puzzleKey}`;
}

export function saveLocal(state: GameState): void {
  try {
    window.localStorage.setItem(localKey(state), JSON.stringify(state));
  } catch { /* ignore */ }
}

export function loadLocal(mode: string, puzzleKey: string, targetId: string): GameState | null {
  try {
    const key = `bollyriddle:${mode}:${puzzleKey}`;
    const saved = window.localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as GameState;
    if (parsed.targetId === targetId) return parsed;
  } catch { /* ignore */ }
  return null;
}

// Fire-and-forget Supabase save — only called when game is finished or tab closes.
// Non-blocking, never causes re-renders, fails silently.
export function syncToSupabase(state: GameState): void {
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
    }),
    keepalive: true // ensures the request completes even if the tab closes
  }).catch(() => {});
}

// Migration: push localStorage games to Supabase after sign-in.
// Called once from site-header on auth state change.
export function migrateLocalProgressToAccount(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("bollyriddle:"));
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const state = JSON.parse(saved) as GameState;
      if (!state.log?.length) continue;
      syncToSupabase(state);
    }
  } catch { /* non-critical */ }
}

export function invalidateAuthCache(): void {
  // Kept for API compatibility with site-header.tsx — no-op now since
  // we don't cache auth state in this module anymore.
}
