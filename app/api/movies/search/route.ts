import { NextResponse, type NextRequest } from "next/server";
import { searchMovies } from "@/lib/db";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const movies = await searchMovies(query);
  return NextResponse.json({ movies });
}
