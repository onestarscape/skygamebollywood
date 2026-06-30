"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ArchivePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <main className="container py-6">
      <section className="glass-panel mx-auto max-w-2xl p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600/20 text-red-200">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Archive</h1>
            <p className="text-sm text-zinc-400">Play any previous daily MovieRiddl puzzle.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} />
          <Button asChild>
            <a href={`/archive/${date}`}>Play</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
