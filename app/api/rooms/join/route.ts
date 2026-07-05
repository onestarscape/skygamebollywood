import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

// POST /api/rooms/join — join a room as a player
export async function POST(request: Request) {
  const body = await request.json();
  const { code, guestName } = body;
  if (!code || !guestName?.trim()) {
    return NextResponse.json({ error: "code and guestName are required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 503 });

  const { data: room } = await supabase
    .from("rooms")
    .select("id, movie_id, status, movies(id, title, year, genres, cast_members, director, music_director, production_house, writer, keyword)")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!room) return NextResponse.json({ error: "Room not found. Check the code and try again." }, { status: 404 });
  if (room.status === "finished") return NextResponse.json({ error: "This room has already finished." }, { status: 400 });

  const { data: player, error } = await supabase
    .from("room_players")
    .insert({ room_id: room.id, guest_name: guestName.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ room, player });
}

// PATCH /api/rooms/join — update player result when they finish
export async function PATCH(request: Request) {
  const body = await request.json();
  const { playerId, won, guessesCount } = body;
  if (!playerId) return NextResponse.json({ error: "playerId is required" }, { status: 400 });

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 503 });

  const { error } = await supabase
    .from("room_players")
    .update({ won, guesses_count: guessesCount, finished_at: new Date().toISOString() })
    .eq("id", playerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
