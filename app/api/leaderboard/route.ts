import { NextResponse, type NextRequest } from "next/server";
import { leaderboard } from "@/lib/db";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import { todayKey } from "@/lib/game";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") ?? "daily") as "daily" | "monthly" | "all-time" | "fastest";
  const entries = await leaderboard(scope, url.searchParams.get("puzzleKey") ?? todayKey());
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createServerSupabase();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const service = createServiceSupabase();

  if (!service) return NextResponse.json({ ok: true, guest: true });

  const displayName =
    userData.user?.user_metadata?.full_name ??
    userData.user?.email?.split("@")[0] ??
    "Guest Player";

  const { error } = await service.from("leaderboard_entries").insert({
    user_id: userData.user?.id ?? null,
    display_name: displayName,
    puzzle_key: String(body.puzzleKey),
    guesses: Number(body.guesses),
    seconds: Number(body.seconds),
    won: Boolean(body.won)
  });

  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
