"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-client";
import { Copy, CheckCheck, Trophy, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RevealBoards } from "@/components/reveal-boards";
import { GuessLog } from "@/components/guess-log";
import { MovieSearch } from "@/components/movie-search";
import { WinScreen } from "@/components/win-screen";
import { applyGuess } from "@/lib/compare";
import { createInitialState, isGameOver, MAX_GUESSES, clueVisibility } from "@/lib/game";
import type { GameState, Movie } from "@/lib/types";

type RoomPlayer = {
  id: string;
  guest_name: string;
  won: boolean | null;
  guesses_count: number | null;
  finished_at: string | null;
  joined_at: string;
};

type RoomData = {
  id: string;
  code: string;
  host_name: string;
  status: string;
  movies: Movie;
};


export function RoomClient({ code }: { code: string }) {
  const [step, setStep] = useState<"join" | "playing" | "done">("join");
  const [guestName, setGuestName] = useState("");
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [usedLifelines, setUsedLifelines] = useState({ one: false, two: false });
  const [activeLifeline, setActiveLifeline] = useState<"one" | "two" | null>(null);
  const supabaseRef = useRef(getSupabaseBrowser());

  // Subscribe to live player updates via Supabase Realtime
  useEffect(() => {
    if (!room) return;
    const channel = supabaseRef.current
      .channel(`room-${room.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "room_players",
        filter: `room_id=eq.${room.id}`
      }, () => {
        // Refetch players on any change
        supabaseRef.current
          .from("room_players")
          .select("*")
          .eq("room_id", room.id)
          .order("finished_at", { ascending: true, nullsFirst: false })
          .then(({ data }) => { if (data) setPlayers(data); });
      })
      .subscribe();
    return () => { supabaseRef.current.removeChannel(channel); };
  }, [room]);

  async function joinRoom() {
    if (!guestName.trim()) return;
    setJoining(true);
    setError("");
    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, guestName })
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) { setError(data.error); return; }

    const movie = dbToMovie(data.room.movies);
    setRoom(data.room);
    setPlayerId(data.player.id);
    setState(createInitialState("archive", `room-${code}`, movie));
    setStep("playing");

    // Fetch current players
    const { data: existingPlayers } = await supabaseRef.current
      .from("room_players")
      .select("*")
      .eq("room_id", data.room.id)
      .order("finished_at", { ascending: true, nullsFirst: false });
    if (existingPlayers) setPlayers(existingPlayers);
  }

  function guessMovie(movie: Movie) {
    if (!state || !room) return;
    if (isGameOver(state)) return;
    if (state.log.some((e) => e.movie.id === movie.id)) return;

    const target = dbToMovie(room.movies);
    const solved = movie.id === target.id;
    const nextBoard = applyGuess(state.board, movie, target);
    const next: GameState = {
      ...state,
      board: solved ? finalizeBoard(nextBoard, target) : nextBoard,
      log: [...state.log, { movie, solved }],
      won: solved
    };
    const over = solved || next.log.length >= MAX_GUESSES;
    if (over) {
      next.finishedAt = new Date().toISOString();
      setShowWin(true);
      // Report result to server
      fetch("/api/rooms/join", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId, won: solved, guessesCount: next.log.length })
      });
    }
    setState(next);
  }

  function copyCode() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "join") {
    return (
      <div className="mx-auto max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-black">Join Room</h1>
            <p className="text-sm text-zinc-400">Room code: <span className="font-black text-white tracking-widest">{code}</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-red-500"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              maxLength={24}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button className="w-full" onClick={joinRoom} disabled={joining || !guestName.trim()}>
              {joining ? "Joining..." : "Join & Play"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!state || !room) return null;
  const target = dbToMovie(room.movies);
  const lifelines = clueVisibility(state.log.length);
  const over = isGameOver(state);

  return (
    <div className="space-y-4">
      {/* Room header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Room Code</div>
          <div className="font-black tracking-widest text-lg">{code}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <Users className="h-4 w-4" />
            {players.length} player{players.length !== 1 ? "s" : ""}
          </div>
          <Button variant="outline" size="sm" onClick={copyCode}>
            {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Share Link"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <RevealBoards
            board={state.board}
            target={target}
            lifelineActive={Boolean(activeLifeline)}
            onRevealSlot={(path) => {
              if (!activeLifeline) return;
              const { revealSlotWithLifeline } = require("@/lib/compare");
              const next = revealSlotWithLifeline(state.board, target, path);
              if (next !== state.board) {
                setState((s) => s ? { ...s, board: next } : s);
                setUsedLifelines((u) => ({ ...u, [activeLifeline]: true }));
                setActiveLifeline(null);
              }
            }}
          />
        </section>

        <aside className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-300">{guestName}</span>
                <span className="text-zinc-500">{state.log.length}/{MAX_GUESSES}</span>
              </div>
              <GuessLog entries={state.log} maxGuesses={MAX_GUESSES} />
            </CardContent>
          </Card>

          {/* Live leaderboard */}
          <Card>
            <CardHeader className="pb-2">
              <h3 className="flex items-center gap-2 font-black">
                <Trophy className="h-4 w-4 text-amber-300" />
                Leaderboard
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.length === 0 ? (
                <p className="text-xs text-zinc-500">Waiting for players...</p>
              ) : (
                players.map((p, index) => (
                  <div key={p.id} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${p.id === playerId ? "border border-red-500/30 bg-red-500/5" : "bg-white/[0.03]"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-4">{index + 1}.</span>
                      <span className="font-semibold">{p.guest_name}{p.id === playerId ? " (you)" : ""}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {p.finished_at ? (
                        p.won
                          ? <span className="text-emerald-400 font-bold">✓ {p.guesses_count} guesses</span>
                          : <span className="text-red-400">✗ Lost</span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Playing...</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <MovieSearch disabled={over} onSelect={guessMovie} />
        </aside>
      </div>

      {showWin && (
        <WinScreen
          open={showWin}
          state={state}
          target={target}
          onTryAgain={() => setShowWin(false)}
          onNewMovie={() => { window.location.href = "/"; }}
          onShare={async () => {
            const text = `🎬 BollyRiddle Group Game\nRoom: ${code}\n${state.won ? `Solved in ${state.log.length} guesses!` : "Stumped me!"}`;
            if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
            await navigator.clipboard.writeText(text);
          }}
        />
      )}
    </div>
  );
}

function dbToMovie(row: Record<string, unknown>): Movie {
  return {
    id: String(row.id),
    title: String(row.title),
    year: Number(row.year),
    genres: Array.isArray(row.genres) ? row.genres.map(String) : [],
    cast: Array.isArray(row.cast_members) ? row.cast_members.map(String) : [],
    director: String(row.director ?? ""),
    musicDirector: String(row.music_director ?? ""),
    productionHouse: String(row.production_house ?? ""),
    writer: String(row.writer ?? ""),
    keyword: String(row.keyword ?? "")
  };
}

function finalizeBoard(board: GameState["board"], target: Movie) {
  return {
    ...board,
    yearLow: target.year, yearHigh: target.year, yearExact: true,
    genres: target.genres.map((value) => ({ value })),
    cast: target.cast.map((value) => ({ value })),
    director: { value: target.director },
    productionHouse: board.productionHouse.map((slot, i) => i === 0 ? { value: target.productionHouse } : slot),
    musicDirector: target.musicDirector.split(/[-,&/]| and /i).map((v) => v.trim()).filter(Boolean).map((value) => ({ value })),
    writer: { value: target.writer }
  };
}
