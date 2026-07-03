"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reads localStorage to see which puzzles the player has already completed
// and whether they won, without needing any server round-trips.
type DayStatus = "won" | "lost" | "unplayed" | "future" | "no-puzzle";

const FIRST_PUZZLE_DATE = new Date("2026-01-01");

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDayStatus(date: Date, today: Date): DayStatus {
  if (date > today) return "future";
  if (date < FIRST_PUZZLE_DATE) return "no-puzzle";
  const key = `bollyriddle:daily:${dateKey(date)}`;
  const saved = localStorage.getItem(key);
  if (!saved) return "unplayed";
  try {
    const state = JSON.parse(saved);
    if (!state.finishedAt) return "unplayed";
    return state.won ? "won" : "lost";
  } catch {
    return "unplayed";
  }
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function PuzzleCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const [statuses, setStatuses] = useState<Record<string, DayStatus>>({});

  useEffect(() => {
    // Read all day statuses for the currently visible month
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: Record<string, DayStatus> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      result[dateKey(date)] = getDayStatus(date, today);
    }
    setStatuses(result);
  }, [viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Can navigate back to the month containing the first puzzle
  const canGoPrev = new Date(year, month - 1, 1) >= new Date(FIRST_PUZZLE_DATE.getFullYear(), FIRST_PUZZLE_DATE.getMonth(), 1);
  // Can't navigate past the current month
  const canGoNext = new Date(year, month + 1, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  const cells: (null | number)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-black uppercase tracking-wide">{monthName}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={!canGoNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-[10px] font-bold uppercase text-zinc-500">{day}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const date = new Date(year, month, day);
          const key = dateKey(date);
          const status = statuses[key] ?? "no-puzzle";
          const isToday = sameDay(date, today);
          const isClickable = status !== "future" && status !== "no-puzzle";

          return (
            <a
              key={key}
              href={isToday ? "/" : isClickable ? `/archive/${key}` : undefined}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                isClickable ? "cursor-pointer hover:scale-105" : "cursor-default opacity-30"
              } ${isToday
                ? "ring-2 ring-red-500 ring-offset-1 ring-offset-black bg-red-600/20 text-white"
                : status === "won"
                  ? "bg-emerald-600/70 text-white"
                  : status === "lost"
                    ? "bg-red-900/60 text-zinc-300"
                    : status === "unplayed"
                      ? "bg-white/[0.06] text-zinc-200 hover:bg-white/10"
                      : "bg-transparent text-zinc-600"
              }`}
            >
              <span>{day}</span>
              {status === "won" && <span className="text-[8px] leading-none mt-0.5">✓</span>}
              {status === "lost" && <span className="text-[8px] leading-none mt-0.5">✗</span>}
              {isToday && <span className="text-[8px] leading-none mt-0.5 text-red-200">today</span>}
            </a>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-600/70 inline-block" /> Won</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-900/60 inline-block" /> Lost</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-white/[0.06] inline-block" /> Not played</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-red-500 inline-block" /> Today</span>
      </div>
    </div>
  );
}
