// Category configuration — the single source of truth for what fields
// each game variant compares, how they're labelled, and how many slots
// they have. Adding a new category (e.g. South Indian, K-Drama) means
// adding one entry here and a matching DB table + daily_puzzles rows.

export type FieldDef = {
  key: string; // matches Movie field name
  label: string; // display label in UI
  slots: number; // how many reveal slots
  dbColumn: string; // Supabase column name
};

export type GameCategory = {
  id: string; // "bollywood" | "hollywood"
  label: string; // "Bollywood" | "Hollywood"
  emoji: string; // "🎬" | "🎥"
  accentColor: string; // tailwind color token for accent
  moviesTable: string; // Supabase table: "movies" | "hollywood_movies"
  puzzlesTable: string; // Supabase table: "daily_puzzles" | "hollywood_daily_puzzles"
  firstPuzzleDate: string; // "2026-01-01"
  fields: FieldDef[]; // ordered list of comparison fields (shown as panels)
  csvColumns: Record<string, string>; // CSV header → field key mapping
};

export const BOLLYWOOD: GameCategory = {
  id: "bollywood",
  label: "Bollywood",
  emoji: "🎬",
  accentColor: "red",
  moviesTable: "movies",
  puzzlesTable: "daily_puzzles",
  firstPuzzleDate: "2026-01-01",
  fields: [
    { key: "genres", label: "Genre", slots: 3, dbColumn: "genres" },
    { key: "cast", label: "Cast", slots: 6, dbColumn: "cast_members" },
    { key: "director", label: "Director", slots: 1, dbColumn: "director" },
    { key: "productionHouse", label: "Production House", slots: 2, dbColumn: "production_house" },
    { key: "musicDirector", label: "Music Director", slots: 3, dbColumn: "music_director" },
    { key: "writer", label: "Writer", slots: 1, dbColumn: "writer" }
  ],
  csvColumns: {
    "Movie Title": "title",
    "Year": "year",
    "Genre 1": "genres.0",
    "Genre 2": "genres.1",
    "Genre 3": "genres.2",
    "Lead Cast 1": "cast.0",
    "Lead Cast 2": "cast.1",
    "Lead Cast 3": "cast.2",
    "Lead Cast 4": "cast.3",
    "Lead Cast 5": "cast.4",
    "Lead Cast 6": "cast.5",
    "Director": "director",
    "Music Director": "musicDirector",
    "Production House": "productionHouse",
    "Writer": "writer",
    "Keyword": "keyword"
  }
};

export const HOLLYWOOD: GameCategory = {
  id: "hollywood",
  label: "Hollywood",
  emoji: "🎥",
  accentColor: "blue",
  moviesTable: "hollywood_movies",
  puzzlesTable: "hollywood_daily_puzzles",
  firstPuzzleDate: "2026-07-01", // starts when Hollywood dataset is ready
  fields: [
    { key: "genres", label: "Genre", slots: 3, dbColumn: "genres" },
    { key: "cast", label: "Cast", slots: 6, dbColumn: "cast_members" },
    { key: "director", label: "Director", slots: 1, dbColumn: "director" },
    { key: "composer", label: "Composer", slots: 2, dbColumn: "composer" },
    { key: "studio", label: "Studio", slots: 2, dbColumn: "studio" },
    { key: "franchise", label: "Franchise / Universe", slots: 1, dbColumn: "franchise" }
  ],
  csvColumns: {
    "Movie Title": "title",
    "Year": "year",
    "Genre 1": "genres.0",
    "Genre 2": "genres.1",
    "Genre 3": "genres.2",
    "Lead Cast 1": "cast.0",
    "Lead Cast 2": "cast.1",
    "Lead Cast 3": "cast.2",
    "Lead Cast 4": "cast.3",
    "Lead Cast 5": "cast.4",
    "Lead Cast 6": "cast.5",
    "Director": "director",
    "Composer": "composer",
    "Studio": "studio",
    "Franchise": "franchise",
    "Keyword": "keyword"
  }
};

export const CATEGORIES: Record<string, GameCategory> = {
  bollywood: BOLLYWOOD,
  hollywood: HOLLYWOOD
};

export const DEFAULT_CATEGORY = BOLLYWOOD;
