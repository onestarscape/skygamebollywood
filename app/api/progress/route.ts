import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";

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
    guesses: body.guesses,
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

  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true, persisted: true });
}
