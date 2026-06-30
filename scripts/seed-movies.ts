import { createClient } from "@supabase/supabase-js";
import { addDays, formatISO, parseISO } from "date-fns";
import { movies } from "../lib/movie-data";
import { FIRST_PUZZLE_DATE } from "../lib/game";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const movieRows = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: movie.year,
    genres: movie.genres,
    cast_members: movie.cast,
    director: movie.director,
    music_director: movie.musicDirector,
    production_house: movie.productionHouse,
    writer: movie.writer,
    keyword: movie.keyword
  }));

  const { error: movieError } = await supabase.from("movies").upsert(movieRows);
  if (movieError) throw movieError;

  const start = parseISO(FIRST_PUZZLE_DATE);
  const puzzleRows = Array.from({ length: 365 }, (_, index) => ({
    puzzle_date: formatISO(addDays(start, index), { representation: "date" }),
    movie_id: movies[index % movies.length].id
  }));

  const { error: puzzleError } = await supabase.from("daily_puzzles").upsert(puzzleRows);
  if (puzzleError) throw puzzleError;

  console.log(`Seeded ${movieRows.length} movies and ${puzzleRows.length} daily puzzles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
