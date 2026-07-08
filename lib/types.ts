export type Movie = {
  id: string;
  title: string;
  year: number;
  genres: string[];
  cast: string[];
  director: string;
  musicDirector: string;
  productionHouse: string;
  writer: string;
  keyword: string;
};

export type RevealSlot = {
  value: string | null;
};

export type RevealBoard = {
  yearLow: number;
  yearHigh: number;
  yearExact: boolean;
  genres: RevealSlot[];
  cast: RevealSlot[];
  director: RevealSlot;
  productionHouse: RevealSlot[];
  musicDirector: RevealSlot[];
  writer: RevealSlot;
};

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
