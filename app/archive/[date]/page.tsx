import { notFound } from "next/navigation";
import { fetchDailyMovie } from "@/lib/db";
import { GameClient } from "@/components/game-client";

export const dynamic = "force-dynamic";

export default async function ArchiveDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const target = await fetchDailyMovie(date);
  return (
    <main className="container py-5 sm:py-8">
      <GameClient mode="archive" puzzleKey={date} target={target} />
    </main>
  );
}
