"use client";

import { useState } from "react";
import { Users, Copy, CheckCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MovieSearch } from "@/components/movie-search";
import type { Movie } from "@/lib/types";

export function CreateRoomClient() {
  const [step, setStep] = useState<"setup" | "created">("setup");
  const [hostName, setHostName] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function createRoom() {
    if (!hostName.trim() || !selectedMovie) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ movieId: selectedMovie.id, hostName })
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error); return; }
    setRoomCode(data.room.code);
    setStep("created");
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "created") {
    return (
      <div className="mx-auto max-w-sm space-y-4">
        <Card className="border-emerald-500/30">
          <CardHeader>
            <h1 className="text-2xl font-black text-emerald-300">Room Created!</h1>
            <p className="text-sm text-zinc-400">Share this code or link with your friends.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-black tracking-[0.3em] text-white py-4 rounded-lg bg-white/[0.05] border border-white/10">
                {roomCode}
              </div>
              <p className="text-xs text-zinc-500 mt-2">Friends can also go to <span className="text-zinc-300">skygamebollywood.vercel.app</span> and enter this code</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copyLink}>
                {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button onClick={() => window.location.href = `/room/${roomCode}`}>
                <ArrowRight className="h-4 w-4" />
                Enter Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600/20 text-red-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Create Room</h1>
              <p className="text-sm text-zinc-400">Pick a movie, invite friends, play together.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">Your name</label>
            <input
              className="w-full rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-sm outline-none focus:border-red-500"
              placeholder="e.g. Rahul"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={24}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">Choose a movie</label>
            {selectedMovie ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                <span className="font-semibold text-emerald-200">{selectedMovie.title} ({selectedMovie.year})</span>
                <button onClick={() => setSelectedMovie(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Change</button>
              </div>
            ) : (
              <MovieSearch disabled={false} onSelect={(movie) => setSelectedMovie(movie)} />
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            className="w-full"
            onClick={createRoom}
            disabled={creating || !hostName.trim() || !selectedMovie}
          >
            {creating ? "Creating..." : "Create Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
