import { NextResponse } from "next/server";
import { applyGuess, createEmptyBoard } from "@/lib/compare";
import { fetchDailyMovie, fetchMovie } from "@/lib/db";
import { todayKey } from "@/lib/game";

export async function POST(request: Request) {
  const body = await request.json();
  const guess = await fetchMovie(String(body.guessId));
  const target = body.targetId ? await fetchMovie(String(body.targetId)) : await fetchDailyMovie(String(body.puzzleKey ?? todayKey()));

  if (!guess || !target) return NextResponse.json({ error: "Movie not found" }, { status: 404 });

  const startingBoard = createEmptyBoard(guess.year, target.year);
  return NextResponse.json({
    board: applyGuess(startingBoard, guess, target),
    solved: guess.id === target.id
  });
}
