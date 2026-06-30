import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || request.headers.get("x-admin-password") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ movies: 0, solves: 0, attempts: 0, players: 0 });

  const [{ count: movies }, { count: attempts }, { count: solves }, { count: players }] = await Promise.all([
    supabase.from("movies").select("*", { count: "exact", head: true }),
    supabase.from("leaderboard_entries").select("*", { count: "exact", head: true }),
    supabase.from("leaderboard_entries").select("*", { count: "exact", head: true }).eq("won", true),
    supabase.from("profiles").select("*", { count: "exact", head: true })
  ]);

  return NextResponse.json({
    movies: movies ?? 0,
    attempts: attempts ?? 0,
    solves: solves ?? 0,
    players: players ?? 0
  });
}
