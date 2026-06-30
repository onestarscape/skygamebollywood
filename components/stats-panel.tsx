"use client";

import { statsDerived } from "@/lib/game";
import type { UserStats } from "@/lib/types";

export function StatsPanel({ stats }: { stats: UserStats }) {
  const derived = statsDerived(stats);
  const items = [
    ["Played", stats.gamesPlayed],
    ["Won", stats.gamesWon],
    ["Win %", `${derived.winPercentage}%`],
    ["Streak", stats.currentStreak],
    ["Best", stats.bestStreak],
    ["Avg", derived.averageGuesses]
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-white/10 bg-white/[0.05] p-3 text-center">
          <div className="text-xl font-black">{value}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
        </div>
      ))}
    </div>
  );
}
