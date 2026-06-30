"use client";

import type { GuessLogEntry } from "@/lib/types";

export function GuessLog({ entries, maxGuesses }: { entries: GuessLogEntry[]; maxGuesses: number }) {
  const rows = Array.from({ length: maxGuesses }, (_, index) => entries[index]);

  return (
    <div>
      <h3 className="mb-2 text-center text-lg font-black">Guessed Movies</h3>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((entry, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              entry ? "border-white/15 bg-white/[0.06]" : "border-white/10 bg-white/[0.02] text-zinc-500"
            }`}
          >
            <span className="text-xs font-bold text-zinc-500">{index + 1}.</span>
            {entry ? (
              <span className="flex min-w-0 items-baseline gap-1 truncate">
                <span className="truncate font-semibold">{entry.movie.title}</span>
                <span className="shrink-0 text-xs text-zinc-400">{entry.movie.year}</span>
              </span>
            ) : (
              <span>---</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
