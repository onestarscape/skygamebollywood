"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [selected, setSelected] = useState<Movie | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/movies/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => response.json())
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

  return (
    <div ref={box} className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
            setOpen(true);
          }}
          placeholder="Search a Bollywood movie..."
          className="h-12 pl-10 text-base"
          aria-label="Search movie"
        />
        {open && !disabled && results.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-80 overflow-auto rounded-lg border border-white/10 bg-zinc-950/95 p-2 shadow-glass backdrop-blur-xl">
            {results.map((movie) => (
              <button
                key={movie.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left transition hover:bg-white/10"
                onClick={() => {
                  setSelected(movie);
                  setQuery(`${movie.title} (${movie.year})`);
                  setOpen(false);
                  onSelect(movie);
                  setSelected(null);
                  setQuery("");
                }}
              >
                <span className="font-semibold text-white">{movie.title}</span>
                <span className="text-sm text-zinc-500">{movie.year}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-h-11 flex-1 items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm">
          {selected ? (
            <>
              <span className="truncate font-semibold">{selected.title} <span className="text-zinc-500">({selected.year})</span></span>
              <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Clear selected movie">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="text-zinc-500">Select a movie from autocomplete</span>
          )}
        </div>
        <Button
          disabled={disabled || !selected}
          onClick={() => {
            if (!selected) return;
            onSelect(selected);
            setSelected(null);
            setQuery("");
          }}
          className="h-11 sm:w-36"
        >
          <Check className="h-4 w-4" />
          Submit
        </Button>
      </div>
    </div>
  );
}
