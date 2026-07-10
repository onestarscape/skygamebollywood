"use client";

import { useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { GameState } from "@/lib/types";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function isSignedIn(): Promise<boolean> {
  const { data } = await getSupabase().auth.getUser();
  return Boolean(data.user);
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
 * - Always saves to localStorage (backup for guests + offline)
 * - Also saves to Supabase if signed in
 */
export async function saveProgress(state: GameState): Promise<void> {
  // Always write to localStorage
  const localKey = `bollyriddle:${state.mode}:${state.puzzleKey}`;
  try {
    window.localStorage.setItem(localKey, JSON.stringify(state));
  } catch { /* ignore */ }

  // Also persist to Supabase if signed in (fire-and-forget)
  const signedIn = await isSignedIn();
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
  }).catch(() => { /* non-critical, localStorage already saved */ });
}

/**
 * Called when user signs in mid-session.
 * Pushes any in-progress localStorage game to Supabase so it's not lost.
 */
export async function migrateLocalProgressToAccount(): Promise<void> {
  const signedIn = await isSignedIn();
  if (!signedIn) return;

  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("bollyriddle:"));
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const state = JSON.parse(saved) as GameState;
      if (!state.log?.length) continue; // nothing to migrate
      await fetch("/api/progress", {
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
      });
    }
  } catch { /* non-critical */ }
}
