"use client";

import type { Movie, RevealBoard } from "@/lib/types";

export type SlotPath =
  | { kind: "genre"; index: number }
  | { kind: "cast"; index: number }
  | { kind: "director" }
  | { kind: "productionHouse"; index: number }
  | { kind: "musicDirector"; index: number }
  | { kind: "writer" };

type Props = {
  board: RevealBoard;
  target: Movie;
  lifelineActive?: boolean;
  onRevealSlot?: (path: SlotPath) => void;
};

export function RevealBoards({ board, target, lifelineActive = false, onRevealSlot }: Props) {
  const musicDirectorNames = splitNames(target.musicDirector);

  return (
    <div className="space-y-4">
      <Panel border="border-red-500/60" glow={lifelineActive}>
        <SectionLabel>Year of Release</SectionLabel>
        <div className="mb-4 flex items-center justify-center gap-3">
          <Pill tone="red">{board.yearLow}</Pill>
          <span className="text-zinc-400">↔</span>
          <Pill tone="red">{board.yearHigh}</Pill>
        </div>
        <SectionLabel>Genre</SectionLabel>
        <SlotRow
          slots={board.genres}
          tone="red"
          revealable={target.genres.map((value) => Boolean(value))}
          lifelineActive={lifelineActive}
          onClick={(index) => onRevealSlot?.({ kind: "genre", index })}
        />
      </Panel>

      <Panel border="border-emerald-500/60" glow={lifelineActive}>
        <SectionLabel>Cast</SectionLabel>
        <SlotGrid
          slots={board.cast}
          tone="green"
          columns={3}
          revealable={target.cast.map((value) => Boolean(value))}
          lifelineActive={lifelineActive}
          onClick={(index) => onRevealSlot?.({ kind: "cast", index })}
        />
      </Panel>

      <Panel border="border-blue-500/60" glow={lifelineActive}>
        <SectionLabel>Director</SectionLabel>
        <SlotRow
          slots={[board.director]}
          tone="blue"
          revealable={[Boolean(target.director)]}
          lifelineActive={lifelineActive}
          onClick={() => onRevealSlot?.({ kind: "director" })}
        />
        <SectionLabel>Production House</SectionLabel>
        <SlotRow
          slots={board.productionHouse}
          tone="blue"
          revealable={board.productionHouse.map((_, index) => index === 0 && Boolean(target.productionHouse))}
          lifelineActive={lifelineActive}
          onClick={(index) => onRevealSlot?.({ kind: "productionHouse", index })}
        />
        <SectionLabel>Music Director</SectionLabel>
        <SlotGrid
          slots={board.musicDirector}
          tone="blue"
          columns={3}
          revealable={board.musicDirector.map((_, index) => Boolean(musicDirectorNames[index]))}
          lifelineActive={lifelineActive}
          onClick={(index) => onRevealSlot?.({ kind: "musicDirector", index })}
        />
        <SectionLabel>Writer</SectionLabel>
        <SlotRow
          slots={[board.writer]}
          tone="blue"
          revealable={[Boolean(target.writer)]}
          lifelineActive={lifelineActive}
          onClick={() => onRevealSlot?.({ kind: "writer" })}
        />
      </Panel>
    </div>
  );
}

function splitNames(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[-,&/]| and /i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function Panel({ border, glow, children }: { border: string; glow?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border-2 ${border} bg-white/[0.03] p-4 transition ${glow ? "shadow-[0_0_0_3px_rgba(251,191,36,0.25)]" : ""}`}>
      {children}
    </div>
  );
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

function SlotRow({
  slots,
  tone,
  revealable,
  lifelineActive,
  onClick
}: {
  slots: { value: string | null }[];
  tone: keyof typeof toneClasses;
  revealable: boolean[];
  lifelineActive: boolean;
  onClick: (index: number) => void;
}) {
  return (
    <div className="mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(slots.length, 1)}, minmax(0, 1fr))` }}>
      {slots.map((slot, index) => (
        <Slot
          key={index}
          value={slot.value}
          tone={tone}
          clickable={lifelineActive && !slot.value && Boolean(revealable[index])}
          onClick={() => onClick(index)}
        />
      ))}
    </div>
  );
}

function SlotGrid({
  slots,
  tone,
  columns,
  revealable,
  lifelineActive,
  onClick
}: {
  slots: { value: string | null }[];
  tone: keyof typeof toneClasses;
  columns: number;
  revealable: boolean[];
  lifelineActive: boolean;
  onClick: (index: number) => void;
}) {
  return (
    <div className="mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {slots.map((slot, index) => (
        <Slot
          key={index}
          value={slot.value}
          tone={tone}
          clickable={lifelineActive && !slot.value && Boolean(revealable[index])}
          onClick={() => onClick(index)}
        />
      ))}
    </div>
  );
}

function Slot({
  value,
  tone,
  clickable,
  onClick
}: {
  value: string | null;
  tone: keyof typeof toneClasses;
  clickable: boolean;
  onClick: () => void;
}) {
  const classes = toneClasses[tone];
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={clickable ? onClick : undefined}
      className={`flex h-11 w-full items-center justify-center rounded-lg px-3 text-center text-xs font-semibold leading-tight transition ${
        value ? classes.filled : classes.empty
      } ${clickable ? "animate-pulse cursor-pointer ring-2 ring-amber-300 ring-offset-2 ring-offset-black" : "cursor-default"}`}
      title={value ?? (clickable ? "Click to reveal with lifeline" : "Not yet revealed")}
    >
      <span className="line-clamp-2">{value ?? "···"}</span>
    </button>
  );
}
