import { CalendarDays } from "lucide-react";
import { PuzzleCalendar } from "@/components/puzzle-calendar";

export default function ArchivePage() {
  return (
    <main className="container py-6">
      <section className="glass-panel mx-auto max-w-md p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600/20 text-red-200">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Archive</h1>
            <p className="text-sm text-zinc-400">Tap any date to play that day's puzzle.</p>
          </div>
        </div>
        <PuzzleCalendar />
      </section>
    </main>
  );
}
