import { fetchDailyMovie } from "@/lib/db";
import { todayKey } from "@/lib/game";
import { GameClient } from "@/components/game-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const puzzleKey = todayKey();
  const target = await fetchDailyMovie(puzzleKey);

  return (
    <main className="container py-5 sm:py-8">
      <GameClient mode="daily" puzzleKey={puzzleKey} target={target} />
    </main>
  );
}
