import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

// Generate a readable 6-char room code from movie title + random
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST /api/rooms — create a room
export async function POST(request: Request) {
  const body = await request.json();
  const { movieId, hostName } = body;
  if (!movieId || !hostName?.trim()) {
    return NextResponse.json({ error: "movieId and hostName are required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 503 });

  // Try a few codes until we find a unique one
  let code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateCode();
    const { data } = await supabase.from("rooms").select("id").eq("code", candidate).maybeSingle();
    if (!data) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ error: "Could not generate unique code" }, { status: 500 });

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({ code, movie_id: movieId, host_name: hostName.trim(), status: "waiting" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ room });
}

// GET /api/rooms?code=XXXXX — fetch room + players
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 503 });

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*, movies(id, title, year)")
    .eq("code", code)
    .maybeSingle();

  if (error || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const { data: players } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("finished_at", { ascending: true });

  return NextResponse.json({ room, players: players ?? [] });
}
