import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceSupabase } from "@/lib/supabase-server";

const MovieSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int(),
  genres: z.array(z.string()).min(1),
  cast: z.array(z.string()).min(1),
  director: z.string().min(1),
  musicDirector: z.string().min(1),
  productionHouse: z.string().min(1),
  writer: z.string().default(""),
  keyword: z.string().default("")
});

export async function POST(request: Request) {
  const unauthorized = guard(request);
  if (unauthorized) return unauthorized;
  const parsed = MovieSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase service key is not configured" }, { status: 503 });

  const { error } = await supabase.from("movies").upsert(toDb(parsed.data));
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = guard(request);
  if (unauthorized) return unauthorized;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase service key is not configured" }, { status: 503 });
  const { error } = await supabase.from("movies").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}

function guard(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || request.headers.get("x-admin-password") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function toDb(movie: z.infer<typeof MovieSchema>) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    genres: movie.genres,
    cast_members: movie.cast,
    director: movie.director,
    music_director: movie.musicDirector,
    production_house: movie.productionHouse,
    writer: movie.writer,
    keyword: movie.keyword
  };
}
