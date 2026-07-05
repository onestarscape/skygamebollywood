import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";

// GET /api/progress?mode=daily&puzzleKey=2026-07-05
// Returns saved game state for the current signed-in user, or null if guest/not found
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const puzzleKey = searchParams.get("puzzleKey");
  if (!mode || !puzzleKey) return NextResponse.json({ state: null });

  const authClient = await createServerSupabase();
  if (!authClient) return NextResponse.json({ state: null });
  const { data } = await authClient.auth.getUser();
  if (!data.user) return NextResponse.json({ state: null }); // guest — use localStorage

  const service = createServiceSupabase();
  if (!service) return NextResponse.json({ state: null });

  const { data: row } = await service
    .from("game_progress")
    .select("*")
    .eq("user_id", data.user.id)
    .eq("mode", mode)
    .eq("puzzle_key", puzzleKey)
    .maybeSingle();

  if (!row) return NextResponse.json({ state: null });

  // Return the full saved state so the client can restore it directly
  return NextResponse.json({
    state: {
      mode: row.mode,
      puzzleKey: row.puzzle_key,
      targetId: row.target_movie_id,
      board: row.guesses?.board ?? null,
      log: row.guesses?.log ?? [],
      startedAt: row.guesses?.startedAt ?? new Date().toISOString(),
      finishedAt: row.finished_at ?? undefined,
      won: row.won ?? false
    }
  });
}

export async function POST(request: Request) {
  const authClient = await createServerSupabase();
  const service = createServiceSupabase();
  if (!authClient || !service) return NextResponse.json({ ok: true, persisted: false });

  const { data } = await authClient.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: true, persisted: false });

  const body = await request.json();
  const row = {
    user_id: data.user.id,
    mode: String(body.mode),
    puzzle_key: String(body.puzzleKey),
    target_movie_id: String(body.targetId),
    // Store the full state (board + log) in the guesses jsonb column
    guesses: { board: body.board, log: body.log, startedAt: body.startedAt },
    won: Boolean(body.won),
    finished_at: body.finishedAt ? String(body.finishedAt) : null
  };

  const { data: existing } = await service
    .from("game_progress")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("mode", row.mode)
    .eq("puzzle_key", row.puzzle_key)
    .maybeSingle();

  const { error } = existing
    ? await service.from("game_progress").update(row).eq("id", existing.id)
    : await service.from("game_progress").insert(row);

  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ ok: true, persisted: true });
}
