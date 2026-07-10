export type Movie = {
  id: string;
  title: string;
  year: number;
  genres: string[]; // up to 3: [genre_1, genre_2, genre_3]
  cast: string[]; // up to 6 names, ordered (cast_1 = lead)
  director: string;
  musicDirector: string;
  productionHouse: string;
  writer: string;
  keyword: string; // single hidden hint word/phrase, e.g. "Engineering"
};

// One "board" slot for a multi-slot category (genres, cast, music director).
// `value` is filled in permanently once any guess reveals it; until then it's
// null and stays empty/locked in the UI.
export type RevealSlot = {
  value: string | null;
};

// The full set of revealed knowledge accumulated across every guess so far
// in the current game. Unlike a per-guess comparison row, this state only
// ever fills in -- it never resets or changes for a slot once revealed.
export type RevealBoard = {
  yearLow: number; // narrows toward target.year as guesses come in
  yearHigh: number; // narrows toward target.year as guesses come in
  yearExact: boolean; // true once a guess matches target.year exactly
  genres: RevealSlot[]; // length 3
  cast: RevealSlot[]; // length 6
  director: RevealSlot; // single slot
  productionHouse: RevealSlot[]; // length up to 2 (some movies are co-productions; we treat as 2 generic slots)
  musicDirector: RevealSlot[]; // length up to 3 (composer duos/trios)
  writer: RevealSlot; // single slot
};

// One row in the compact "Guessed Movies" log (title + year + which guess number).
export type GuessLogEntry = {
  movie: Movie;
  solved: boolean;
};

export type GameMode = "daily" | "archive" | "unlimited";

export type GameState = {
  mode: GameMode;
  puzzleKey: string;
  targetId: string;
  board: RevealBoard;
  log: GuessLogEntry[];
  startedAt: string;
  finishedAt?: string;
  won: boolean;
};

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  guesses: number;
  seconds: number;
  createdAt: string;
};

export type UserStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  totalGuesses: number;
};
