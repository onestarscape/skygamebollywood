import { getDailyMovie, getRandomMovie, todayKey } from "@/lib/game";
import { getMovieById, movies, searchLocalMovies } from "@/lib/movie-data";
import { createServiceSupabase } from "@/lib/supabase-server";
import type { LeaderboardEntry, Movie } from "@/lib/types";

export async function fetchDailyMovie(dateKey = todayKey()): Promise<Movie> {
  const supabase = createServiceSupabase();
  if (!supabase) return getDailyMovie(dateKey);

  const { data: scheduled } = await supabase
    .from("daily_puzzles")
    .select("movie_id, movies(*)")
    .eq("puzzle_date", dateKey)
    .maybeSingle();

  const joinedMovie = Array.isArray(scheduled?.movies)
    ? scheduled.movies[0]
    : scheduled?.movies;

  if (joinedMovie) return dbMovieToMovie(joinedMovie);

  return getDailyMovie(dateKey);
}

export async function fetchRandomMovie(): Promise<Movie> {
  const supabase = createServiceSupabase();
  if (!supabase) return getRandomMovie();
  const { data } = await supabase.from("movies").select("*").limit(500);
  if (!data?.length) return getRandomMovie();
  return dbMovieToMovie(data[Math.floor(Math.random() * data.length)]);
}

export async function fetchMovie(id: string): Promise<Movie | undefined> {
  const supabase = createServiceSupabase();
  if (!supabase) return getMovieById(id);
  const { data } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
  return data ? dbMovieToMovie(data) : getMovieById(id);
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const supabase = createServiceSupabase();
  if (!supabase) return searchLocalMovies(query);
  const { data } = await supabase
    .from("movies")
    .select("*")
    .ilike("title", `%${query}%`)
    .order("title")
    .limit(12);
  return data?.map(dbMovieToMovie) ?? searchLocalMovies(query);
}

export async function leaderboard(scope: "daily" | "monthly" | "all-time" | "fastest", puzzleKey = todayKey()): Promise<LeaderboardEntry[]> {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return [
      { id: "local-1", displayName: "Aarav", guesses: 3, seconds: 72, createdAt: new Date().toISOString() },
      { id: "local-2", displayName: "Meera", guesses: 4, seconds: 91, createdAt: new Date().toISOString() },
      { id: "local-3", displayName: "Kabir", guesses: 5, seconds: 119, createdAt: new Date().toISOString() }
    ];
  }

  let query = supabase
    .from("leaderboard_entries")
    .select("id, display_name, guesses, seconds, created_at")
    .eq("won", true);

  if (scope === "daily") query = query.eq("puzzle_key", puzzleKey);
  if (scope === "monthly") query = query.gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const { data } = await query.order("guesses", { ascending: true }).order("seconds", { ascending: true }).limit(50);
  return (data ?? []).map((entry) => ({
    id: entry.id,
    displayName: entry.display_name,
    guesses: entry.guesses,
    seconds: entry.seconds,
    createdAt: entry.created_at
  }));
}

function dbMovieToMovie(row: Record<string, unknown>): Movie {
  return {
    id: String(row.id),
    title: String(row.title),
    year: Number(row.year),
    genres: Array.isArray(row.genres) ? row.genres.map(String) : [],
    cast: Array.isArray(row.cast_members) ? row.cast_members.map(String) : [],
    director: String(row.director),
    musicDirector: String(row.music_director),
    productionHouse: String(row.production_house),
    writer: String(row.writer ?? ""),
    keyword: String(row.keyword ?? "")
  };
}

export { movies };
