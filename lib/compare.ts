import { normalizeName } from "@/lib/utils";
import type { Movie, RevealBoard, RevealSlot } from "@/lib/types";

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

function emptySlot(): RevealSlot { return { value: null }; }
function emptySlots(count: number): RevealSlot[] {
  return Array.from({ length: count }, emptySlot);
}

export function applyGuess(board: RevealBoard, guess: Movie, target: Movie): RevealBoard {
  const solved = guess.id === target.id;
  return {
    yearLow: solved || guess.year === target.year ? target.year
      : guess.year < target.year ? Math.max(board.yearLow, guess.year) : board.yearLow,
    yearHigh: solved || guess.year === target.year ? target.year
      : guess.year > target.year ? Math.min(board.yearHigh, guess.year) : board.yearHigh,
    yearExact: board.yearExact || guess.year === target.year,
    genres: fillSlots(board.genres, guess.genres, target.genres),
    cast: fillSlots(board.cast, guess.cast, target.cast),
    director: fillSlot(board.director, guess.director, target.director),
    productionHouse: fillSlots(board.productionHouse, [guess.productionHouse], [target.productionHouse]),
    musicDirector: fillSlots(board.musicDirector, splitNames(guess.musicDirector), splitNames(target.musicDirector)),
    writer: fillSlot(board.writer, guess.writer, target.writer)
  };
}

function fillSlot(slot: RevealSlot, guessValue: string, targetValue: string): RevealSlot {
  if (slot.value) return slot;
  if (!guessValue || !targetValue) return slot;
  return normalizeName(guessValue) === normalizeName(targetValue) ? { value: targetValue } : slot;
}

function fillSlots(slots: RevealSlot[], guessValues: string[], targetValues: string[]): RevealSlot[] {
  const targetNormalized = targetValues.map(normalizeName);
  const alreadyRevealed = new Set(
    slots.filter((s) => s.value).map((s) => normalizeName(s.value as string))
  );
  const next = slots.map((s) => ({ ...s }));
  for (const guessValue of guessValues) {
    if (!guessValue) continue;
    const normalized = normalizeName(guessValue);
    if (!targetNormalized.includes(normalized)) continue;
    if (alreadyRevealed.has(normalized)) continue;
    const targetIndex = targetNormalized.indexOf(normalized);
    const actualValue = targetValues[targetIndex];
    if (targetIndex >= next.length) continue;
    if (next[targetIndex]?.value) continue;
    next[targetIndex] = { value: actualValue };
    alreadyRevealed.add(normalized);
  }
  return next;
}

export function splitNames(value: string): string[] {
  if (!value) return [];
  return value.split(/[-,&/]| and /i).map((p) => p.trim()).filter(Boolean);
}

export type SlotPath =
  | { kind: "genre"; index: number }
  | { kind: "cast"; index: number }
  | { kind: "director" }
  | { kind: "productionHouse"; index: number }
  | { kind: "musicDirector"; index: number }
  | { kind: "writer" };

export function revealSlotWithLifeline(board: RevealBoard, target: Movie, path: SlotPath): RevealBoard {
  const next: RevealBoard = {
    ...board,
    genres: [...board.genres],
    cast: [...board.cast],
    productionHouse: [...board.productionHouse],
    musicDirector: [...board.musicDirector]
  };
  switch (path.kind) {
    case "genre": {
      if (next.genres[path.index]?.value) return board;
      const value = target.genres[path.index];
      if (!value) return board;
      next.genres[path.index] = { value };
      return next;
    }
    case "cast": {
      if (next.cast[path.index]?.value) return board;
      const value = target.cast[path.index];
      if (!value) return board;
      next.cast[path.index] = { value };
      return next;
    }
    case "director": {
      if (next.director.value) return board;
      next.director = { value: target.director };
      return next;
    }
    case "productionHouse": {
      if (next.productionHouse[path.index]?.value) return board;
      if (path.index === 0) { next.productionHouse[0] = { value: target.productionHouse }; return next; }
      return board;
    }
    case "musicDirector": {
      if (next.musicDirector[path.index]?.value) return board;
      const names = splitNames(target.musicDirector);
      const value = names[path.index];
      if (!value) return board;
      next.musicDirector[path.index] = { value };
      return next;
    }
    case "writer": {
      if (next.writer.value) return board;
      next.writer = { value: target.writer };
      return next;
    }
  }
}
