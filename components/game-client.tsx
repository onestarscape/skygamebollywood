"use client";

import { useEffect, useState } from "react";
import { Calendar, Infinity, Lock, RotateCcw, Share2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MovieSearch } from "@/components/movie-search";
import { RevealBoards, type SlotPath } from "@/components/reveal-boards";
import { GuessLog } from "@/components/guess-log";
import { WinScreen } from "@/components/win-screen";
import { applyGuess, revealSlotWithLifeline } from "@/lib/compare";
import { buildShareText, clueVisibility, createInitialState, isGameOver, MAX_GUESSES } from "@/lib/game";
import { loadLocal, saveLocal, syncToSupabase } from "@/lib/use-game-progress";
import type { GameMode, GameState, Movie } from "@/lib/types";

type Props = {
  mode: GameMode;
  puzzleKey: string;
  target: Movie;
};

export function GameClient({ mode, puzzleKey, target: initialTarget }: Props) {
  const [target, setTarget] = useState(initialTarget);
  const [gameMode, setGameMode] = useState<GameMode>(mode);
  const [key, setKey] = useState(puzzleKey);
  const [state, setState] = useState<GameState>(() => createInitialState(mode, puzzleKey, initialTarget));
  const [showResult, setShowResult] = useState(false);
  const [noLimit, setNoLimit] = useState(false);
  const [usedLifelines, setUsedLifelines] = useState<{ one: boolean; two: boolean }>({ one: false, two: false });
  const [activeLifeline, setActiveLifeline] = useState<"one" | "two" | null>(null);

  const over = isGameOver(state, gameMode === "unlimited" && noLimit);
  const lifelines = clueVisibility(state.log.length);

  // Load from localStorage on mount and when puzzle changes.
  // Synchronous — no network, no async, no possible loop.
  useEffect(() => {
    const saved = loadLocal(gameMode, key, target.id);
    if (saved) {
      setState(saved);
      if (saved.finishedAt) setShowResult(true);
    } else {
      setState(createInitialState(gameMode, key, target));
      setUsedLifelines({ one: false, two: false });
      setActiveLifeline(null);
      setShowResult(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, key, target.id]);

  // Save to localStorage on every state change.
  // saveLocal never calls setState — this effect can never loop.
  useEffect(() => {
    saveLocal(state);
  }, [state]);

  function finish(next: GameState) {
    const finished = { ...next, finishedAt: new Date().toISOString() };
    setShowResult(true);
    // Sync to Supabase only when the game is done — once, not on every guess
    syncToSupabase(finished);
    return finished;
  }

  function guessMovie(movie: Movie) {
    if (over) return;
    if (state.log.some((entry) => entry.movie.id === movie.id)) return;

    const solved = movie.id === target.id;
    const nextBoard = applyGuess(state.board, movie, target);
    const next: GameState = {
      ...state,
      board: solved ? finalizeBoard(nextBoard, target) : nextBoard,
      log: [...state.log, { movie, solved }],
      won: solved
    };
    const reachedLimit = gameMode !== "unlimited" || !noLimit ? next.log.length >= MAX_GUESSES : false;
    setState(solved || reachedLimit ? finish(next) : next);
  }

  function activateLifeline(which: "one" | "two") {
    if (usedLifelines[which]) return;
    setActiveLifeline((current) => (current === which ? null : which));
  }

  function handleRevealSlot(path: SlotPath) {
    if (!activeLifeline) return;
    const nextBoard = revealSlotWithLifeline(state.board, target, path);
    if (nextBoard === state.board) return; // no-op: slot wasn't actually revealable
    setState((current) => ({ ...current, board: nextBoard }));
    setUsedLifelines((current) => ({ ...current, [activeLifeline]: true }));
    setActiveLifeline(null);
  }

  async function startUnlimited() {
    const response = await fetch("/api/game/random", { cache: "no-store" });
    const data = await response.json();
    const movie = data.movie as Movie;
    const unlimitedKey = `random-${Date.now()}`;
    setTarget(movie);
    setGameMode("unlimited");
    setKey(unlimitedKey);
    setState(createInitialState("unlimited", unlimitedKey, movie));
    setShowResult(false);
  }

  function resetCurrent() {
    const next = createInitialState(gameMode, key, target);
    setState(next);
    setShowResult(false);
    setUsedLifelines({ one: false, two: false });
    setActiveLifeline(null);
    saveLocal(next);
  }

  async function share() {
    const text = buildShareText(state);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
  }

  const title = gameMode === "daily" ? "Daily Puzzle" : gameMode === "archive" ? "Archive Puzzle" : "Unlimited";
  const modeIcon = gameMode === "unlimited" ? <Infinity className="h-4 w-4" /> : <Calendar className="h-4 w-4" />;
  const maxGuessLabel = gameMode === "unlimited" && noLimit ? "∞" : String(MAX_GUESSES);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-black/50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-100">
            {modeIcon}
            {title}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={startUnlimited}>
              <Infinity className="h-4 w-4" />
              New Movie
            </Button>
            <Button variant="ghost" onClick={resetCurrent}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
        {gameMode === "unlimited" && (
          <label className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={noLimit} onChange={(event) => setNoLimit(event.target.checked)} className="h-4 w-4 accent-red-600" />
            No guess limit
          </label>
        )}
        {activeLifeline && (
          <div className="mb-3 rounded-md border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200">
            Lifeline active — click any glowing empty slot to reveal it.
          </div>
        )}
        <RevealBoards board={state.board} target={target} lifelineActive={Boolean(activeLifeline)} onRevealSlot={handleRevealSlot} />
      </section>

      <aside className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-bold text-zinc-300">{key}</span>
              <span className="text-zinc-500">{state.log.length}/{maxGuessLabel} guesses</span>
            </div>
            <GuessLog entries={state.log} maxGuesses={MAX_GUESSES} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Keyword Hint
            </h2>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
              lifelines.keyword
                ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                : "border-white/10 bg-white/[0.03] text-zinc-500"
            }`}>
              {lifelines.keyword ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
                  {target.keyword || "No keyword available"}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0" />
                  Reveals after 5th guess ({Math.max(0, 5 - state.log.length)} guesses left)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Lifelines
            </h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Lifeline
              unlocked={lifelines.lifelineOne}
              used={usedLifelines.one}
              active={activeLifeline === "one"}
              locked="Unlock Lifeline after 4th guess"
              onActivate={() => activateLifeline("one")}
            />
            <Lifeline
              unlocked={lifelines.lifelineTwo}
              used={usedLifelines.two}
              active={activeLifeline === "two"}
              locked="Unlock Lifeline after 6th guess"
              onActivate={() => activateLifeline("two")}
            />
          </CardContent>
        </Card>

        <MovieSearch disabled={over} onSelect={guessMovie} />
      </aside>

      <WinScreen
        open={showResult}
        state={state}
        target={target}
        onTryAgain={resetCurrent}
        onNewMovie={startUnlimited}
        onShare={share}
      />
    </div>
  );
}

// When a guess wins outright, every slot fills in immediately (the player
// solved it, so there's no remaining mystery), even slots that hadn't been
// individually deduced yet.
function finalizeBoard(board: GameState["board"], target: Movie) {
  return {
    ...board,
    yearLow: target.year,
    yearHigh: target.year,
    yearExact: true,
    genres: target.genres.map((value) => ({ value })),
    cast: target.cast.map((value) => ({ value })),
    director: { value: target.director },
    productionHouse: board.productionHouse.map((slot, index) => (index === 0 ? { value: target.productionHouse } : slot)),
    musicDirector: target.musicDirector
      .split(/[-,&/]| and /i)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ value })),
    writer: { value: target.writer }
  };
}

function Lifeline({
  unlocked,
  used,
  active,
  locked,
  onActivate
}: {
  unlocked: boolean;
  used: boolean;
  active: boolean;
  locked: string;
  onActivate: () => void;
}) {
  if (!unlocked) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-zinc-500">
        <Lock className="h-4 w-4" />
        <span className="text-sm">{locked}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={used}
      onClick={onActivate}
      className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
        used
          ? "cursor-default border-white/10 bg-white/[0.02] text-zinc-500"
          : active
            ? "border-amber-400 bg-amber-400/20 text-amber-100"
            : "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
      }`}
    >
      <Sparkles className="h-4 w-4" />
      {used ? "Lifeline used" : active ? "Click a slot to reveal..." : "Use lifeline"}
    </button>
  );
}
