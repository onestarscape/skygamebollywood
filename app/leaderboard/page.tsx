import { Trophy } from "lucide-react";
import { leaderboard } from "@/lib/db";
import { todayKey } from "@/lib/game";
import { formatSeconds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: "daily" | "monthly" | "all-time" | "fastest" }>;
}) {
  const { scope = "daily" } = await searchParams;
  const entries = await leaderboard(scope, todayKey());
  const scopes = ["daily", "monthly", "all-time", "fastest"] as const;

  return (
    <main className="container py-6">
      <section className="glass-panel mx-auto max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-500/20 text-amber-100">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Leaderboard</h1>
              <p className="text-sm text-zinc-400">Fast solves, clean streaks, all glory.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3">
          {scopes.map((item) => (
            <a key={item} href={`/leaderboard?scope=${item}`} className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${item === scope ? "bg-red-600 text-white" : "bg-white/5 text-zinc-300"}`}>
              {item.replace("-", " ")}
            </a>
          ))}
        </div>
        <div className="divide-y divide-white/10">
          {entries.map((entry, index) => (
            <div key={entry.id} className="grid grid-cols-[44px_1fr_70px_70px] items-center gap-3 p-4">
              <div className="text-lg font-black text-zinc-500">#{index + 1}</div>
              <div className="min-w-0">
                <div className="truncate font-bold">{entry.displayName}</div>
                <div className="text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right font-bold">{entry.guesses}</div>
              <div className="text-right text-sm text-zinc-300">{formatSeconds(entry.seconds)}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
