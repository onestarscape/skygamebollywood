import { NextResponse } from "next/server";
import { fetchRandomMovie } from "@/lib/db";

export async function GET() {
  const movie = await fetchRandomMovie();
  return NextResponse.json({ movie });
}
