"use client";

import type { RevealBoard } from "@/lib/types";

export function RevealBoards({ board, maxGuesses }: { board: RevealBoard; maxGuesses: number }) {
  return (
    <div className="space-y-4">
      <Panel border="border-red-500/60">
        <SectionLabel>Year of Release</SectionLabel>
        <div className="mb-4 flex items-center justify-center gap-3">
          <Pill tone="red">{board.yearExact ? board.yearLow : board.yearLow}</Pill>
          <span className="text-zinc-400">↔</span>
          <Pill tone="red">{board.yearExact ? board.yearLow : board.yearHigh}</Pill>
        </div>
        <SectionLabel>Genre</SectionLabel>
        <SlotRow slots={board.genres} tone="red" />
      </Panel>

      <Panel border="border-emerald-500/60">
        <SectionLabel>Cast</SectionLabel>
        <SlotGrid slots={board.cast} tone="green" columns={3} />
      </Panel>

      <Panel border="border-blue-500/60">
        <SectionLabel>Director</SectionLabel>
        <SlotRow slots={[board.director]} tone="blue" />
        <SectionLabel>Production House</SectionLabel>
        <SlotRow slots={board.productionHouse} tone="blue" />
        <SectionLabel>Music Director</SectionLabel>
        <SlotGrid slots={board.musicDirector} tone="blue" columns={3} />
        <SectionLabel>Writer</SectionLabel>
        <SlotRow slots={[board.writer]} tone="blue" />
      </Panel>
    </div>
  );
}

function Panel({ border, children }: { border: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border-2 ${border} bg-white/[0.03] p-4`}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-3 text-center text-xs font-black uppercase tracking-wide text-zinc-400 first:mt-0">
      {children}
    </div>
  );
}

const toneClasses = {
  red: { filled: "bg-red-600/80 text-white", empty: "bg-red-900/30 text-transparent" },
  green: { filled: "bg-emerald-600/80 text-white", empty: "bg-emerald-900/30 text-transparent" },
  blue: { filled: "bg-blue-600/80 text-white", empty: "bg-blue-900/30 text-transparent" }
} as const;

function Pill({ tone, children }: { tone: keyof typeof toneClasses; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${toneClasses[tone].filled}`}>{children}</span>
  );
}

function SlotRow({ slots, tone }: { slots: { value: string | null }[]; tone: keyof typeof toneClasses }) {
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-2">
      {slots.map((slot, index) => (
        <Slot key={index} value={slot.value} tone={tone} />
      ))}
    </div>
  );
}

function SlotGrid({ slots, tone, columns }: { slots: { value: string | null }[]; tone: keyof typeof toneClasses; columns: number }) {
  return (
    <div className={`mb-3 grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {slots.map((slot, index) => (
        <Slot key={index} value={slot.value} tone={tone} />
      ))}
    </div>
  );
}

function Slot({ value, tone }: { value: string | null; tone: keyof typeof toneClasses }) {
  const classes = toneClasses[tone];
  return (
    <span
      className={`flex h-9 items-center justify-center rounded-full px-3 text-center text-xs font-semibold ${
        value ? classes.filled : classes.empty
      }`}
      title={value ?? "Not yet revealed"}
    >
      {value ?? "···"}
    </span>
  );
}
