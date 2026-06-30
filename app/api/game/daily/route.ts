import { NextResponse, type NextRequest } from "next/server";
import { fetchDailyMovie } from "@/lib/db";
import { todayKey } from "@/lib/game";

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get("date") ?? todayKey();
  const movie = await fetchDailyMovie(date);
  return NextResponse.json({ puzzleKey: date, movie });
}
