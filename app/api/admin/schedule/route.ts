import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || request.headers.get("x-admin-password") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase service key is not configured" }, { status: 503 });

  const { error } = await supabase.from("daily_puzzles").upsert({
    puzzle_date: String(body.puzzleDate),
    movie_id: String(body.movieId)
  });

  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
