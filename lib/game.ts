import { differenceInCalendarDays, formatISO, parseISO, startOfDay } from "date-fns";
import { movies } from "@/lib/movie-data";
import { createEmptyBoard } from "@/lib/compare";
import type { GameState, Movie, UserStats } from "@/lib/types";

export const MAX_GUESSES = 8;
export const FIRST_PUZZLE_DATE = "2026-01-01";

export function todayKey(date = new Date()) {
  return formatISO(startOfDay(date), { representation: "date" });
}

export function puzzleNumber(dateKey = todayKey()) {
  return differenceInCalendarDays(parseISO(dateKey), parseISO(FIRST_PUZZLE_DATE)) + 1;
}

export function getDailyMovie(dateKey = todayKey()) {
  const number = Math.max(0, puzzleNumber(dateKey) - 1);
  return movies[number % movies.length];
}

export function getRandomMovie(seed = cryptoRandom()) {
  return movies[Math.abs(seed) % movies.length];
}

export function clueVisibility(guessCount: number) {
  return {
    lifelineOne: guessCount >= 4,
    lifelineTwo: guessCount >= 6
  };
}

export function createInitialState(mode: GameState["mode"], puzzleKey: string, target: Movie): GameState {
  const years = movies.map((movie) => movie.year);
  return {
    mode,
    puzzleKey,
    targetId: target.id,
    board: createEmptyBoard(Math.min(...years), Math.max(...years)),
    log: [],
    startedAt: new Date().toISOString(),
    won: false
  };
}

export function isGameOver(state: GameState, unlimitedNoLimit = false) {
  return state.won || (!unlimitedNoLimit && state.log.length >= MAX_GUESSES);
}

export function defaultStats(): UserStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalGuesses: 0
  };
}

export function updateStats(stats: UserStats, won: boolean, guesses: number): UserStats {
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    totalGuesses: stats.totalGuesses + (won ? guesses : 0)
  };
}

export function statsDerived(stats: UserStats) {
  return {
    winPercentage: stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
    averageGuesses: stats.gamesWon ? Number((stats.totalGuesses / stats.gamesWon).toFixed(1)) : 0
  };
}

export function buildShareText(state: GameState) {
  const number = state.mode === "daily" || state.mode === "archive" ? ` #${puzzleNumber(state.puzzleKey)}` : "";
  const result = state.won
    ? `Guessed the Mystery Movie in ${spelledOut(state.log.length)} turns.`
    : `Stumped after ${spelledOut(state.log.length)} turns.`;
  return `🎬 BollyRiddle${number}\n\n${result}\n\nPlay today's puzzle: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}`;
}

const NUMBER_WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"];
function spelledOut(value: number) {
  return NUMBER_WORDS[value] ?? String(value);
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] ?? Date.now();
  }
  return Date.now();
}
