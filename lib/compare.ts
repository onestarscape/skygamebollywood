import { normalizeName } from "@/lib/utils";
import type { Movie, RevealBoard, RevealSlot } from "@/lib/types";

// Builds the starting (fully empty/locked) reveal board for a fresh game.
// Year starts at the widest possible range across the whole dataset so the
// first guess has something real to narrow against.
export function createEmptyBoard(yearMin: number, yearMax: number): RevealBoard {
  return {
    yearLow: yearMin,
    yearHigh: yearMax,
    yearExact: false,
    genres: emptySlots(3),
    cast: emptySlots(6),
    director: emptySlot(),
    productionHouse: emptySlots(2),
    musicDirector: emptySlots(3),
    writer: emptySlot()
  };
}

function emptySlot(): RevealSlot {
  return { value: null };
}

function emptySlots(count: number): RevealSlot[] {
  return Array.from({ length: count }, emptySlot);
}

/**
 * Applies one guess against the target, returning a NEW board with any
 * newly-discovered values filled in. Slots that were already revealed are
 * left untouched (reveals are permanent and accumulate across guesses).
 */
export function applyGuess(board: RevealBoard, guess: Movie, target: Movie): RevealBoard {
  const solved = guess.id === target.id;

  return {
    yearLow: solved || guess.year === target.year ? target.year : guess.year < target.year ? Math.max(board.yearLow, guess.year) : board.yearLow,
    yearHigh: solved || guess.year === target.year ? target.year : guess.year > target.year ? Math.min(board.yearHigh, guess.year) : board.yearHigh,
    yearExact: board.yearExact || guess.year === target.year,
    genres: fillSlots(board.genres, guess.genres, target.genres),
    cast: fillSlots(board.cast, guess.cast, target.cast),
    director: fillSlot(board.director, guess.director, target.director),
    productionHouse: fillSlots(board.productionHouse, [guess.productionHouse], target.productionHouse ? [target.productionHouse] : []),
    musicDirector: fillSlots(board.musicDirector, splitNames(guess.musicDirector), splitNames(target.musicDirector)),
    writer: fillSlot(board.writer, guess.writer, target.writer)
  };
}

// Single-value fields (director, writer): if the guess matches the target
// exactly, that single slot fills in. Already-filled slots are untouched.
function fillSlot(slot: RevealSlot, guessValue: string, targetValue: string): RevealSlot {
  if (slot.value) return slot;
  if (!guessValue || !targetValue) return slot;
  return normalizeName(guessValue) === normalizeName(targetValue) ? { value: targetValue } : slot;
}

// Multi-slot fields (genres, cast, music director, production house): any
// value in the guess's list that also appears in the target's list gets
// placed into the next available empty slot, permanently.
function fillSlots(slots: RevealSlot[], guessValues: string[], targetValues: string[]): RevealSlot[] {
  const targetNormalized = targetValues.map(normalizeName);
  const alreadyRevealed = new Set(slots.filter((slot) => slot.value).map((slot) => normalizeName(slot.value as string)));
  const next = slots.map((slot) => ({ ...slot }));

  for (const guessValue of guessValues) {
    if (!guessValue) continue;
    const normalized = normalizeName(guessValue);
    if (!targetNormalized.includes(normalized)) continue;
    if (alreadyRevealed.has(normalized)) continue;

    const targetIndex = targetNormalized.indexOf(normalized);
    const actualValue = targetValues[targetIndex];
    const emptyIndex = next.findIndex((slot) => !slot.value);
    if (emptyIndex === -1) continue;

    next[emptyIndex] = { value: actualValue };
    alreadyRevealed.add(normalized);
  }

  return next;
}

// Some music-director credits are written as "Shankar-Ehsaan-Loy" or
// "Ajay-Atul" -- split on common separators so each composer gets their own
// slot, matching how the reference game reveals individual composer names.
function splitNames(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[-,&/]| and /i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isYearFullyRevealed(board: RevealBoard): boolean {
  return board.yearExact;
}
