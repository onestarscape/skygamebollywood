"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Movie } from "@/lib/types";

export function MovieSearch({
  disabled,
  onSelect
}: {
  disabled?: boolean;
  onSelect: (movie: Movie) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const controller = new AbortController();
    fetch(`/api/movies/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setResults(data.movies ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  function handleSelect(movie: Movie) {
    // Submit immediately on click — no separate Submit button needed
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(movie);
  }

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 z-10" />
      <Input
        value={query}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        placeholder={disabled ? "Game over" : "Search a Bollywood movie..."}
        className="h-12 pl-10 text-base"
        aria-label="Search movie"
      />
      {open && !disabled && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-auto rounded-lg border border-white/10 bg-zinc-950/95 p-2 shadow-glass backdrop-blur-xl">
          {results.map((movie) => (
            <button
              key={movie.id}
              type="button"
              className="flex w-full items-center px-3 py-3 text-left rounded-md transition hover:bg-white/10"
              onClick={() => handleSelect(movie)}
            >
              {/* Year deliberately omitted to prevent cheating */}
              <span className="font-semibold text-white">{movie.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
