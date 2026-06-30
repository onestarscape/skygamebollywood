import { NextResponse } from "next/server";
import { fetchDailyMovie } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const movie = await fetchDailyMovie(date);
  return NextResponse.json({ puzzleKey: date, movie });
}
