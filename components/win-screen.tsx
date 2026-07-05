"use client";

import { Share2, RotateCcw, Infinity, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { GameState, Movie } from "@/lib/types";

type Personality = {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  glow: string;
};

function getPersonality(guessCount: number, won: boolean): Personality {
  if (!won) return {
    title: "Nayi Shuru Karo",
    subtitle: "Kal phir milte hain...",
    emoji: "🎭",
    color: "text-zinc-300",
    glow: "shadow-[0_0_40px_rgba(255,255,255,0.05)]"
  };
  if (guessCount <= 2) return {
    title: "Bollywood Legend",
    subtitle: "Tum toh seedha director ho!",
    emoji: "👑",
    color: "text-amber-300",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.3)]"
  };
  if (guessCount <= 4) return {
    title: "Bollywood Encyclopedia",
    subtitle: "Har movie yaad hai tumhe!",
    emoji: "🌟",
    color: "text-yellow-300",
    glow: "shadow-[0_0_50px_rgba(253,224,71,0.25)]"
  };
  if (guessCount <= 6) return {
    title: "True Bollywood Fan",
    subtitle: "Dil toh Bollywood mein hi hai!",
    emoji: "❤️‍🔥",
    color: "text-red-300",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]"
  };
  return {
    title: "Almost There",
    subtitle: "Thoda aur practice karo!",
    emoji: "🎯",
    color: "text-orange-300",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]"
  };
}

type Props = {
  open: boolean;
  state: GameState;
  target: Movie;
  onTryAgain: () => void;
  onNewMovie: () => void;
  onShare: () => void;
};

export function WinScreen({ open, state, target, onTryAgain, onNewMovie, onShare }: Props) {
  const personality = getPersonality(state.log.length, state.won);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-white/10 bg-[#0a0a0f] p-0 overflow-hidden">
        {/* Cinematic top strip */}
        <div className="relative bg-gradient-to-b from-black via-zinc-950 to-[#0a0a0f] px-6 pt-8 pb-6 text-center">
          {/* Film grain overlay via CSS */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px" }} />

          {/* Personality badge */}
          <div className={`inline-flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 ${personality.glow}`}>
            <span className="text-4xl">{personality.emoji}</span>
            <span className={`text-xl font-black tracking-wide ${personality.color}`}>{personality.title}</span>
            <span className="text-xs text-zinc-400 italic">{personality.subtitle}</span>
          </div>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <Flame className="h-4 w-4 text-red-500" />
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        {/* Movie reveal */}
        <div className="px-6 pb-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
            {state.won ? `Solved in ${state.log.length} ${state.log.length === 1 ? "guess" : "guesses"}` : "The answer was"}
          </div>
          <div className="text-2xl font-black uppercase tracking-tight leading-tight">{target.title}</div>
          <div className="mt-1 text-sm text-zinc-400">{target.year} · {target.genres.slice(0, 2).join(" / ")}</div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><div className="text-zinc-500 uppercase tracking-wide text-[9px] mb-0.5">Director</div><div className="text-zinc-200 font-semibold">{target.director}</div></div>
            <div><div className="text-zinc-500 uppercase tracking-wide text-[9px] mb-0.5">Music</div><div className="text-zinc-200 font-semibold">{target.musicDirector}</div></div>
            <div><div className="text-zinc-500 uppercase tracking-wide text-[9px] mb-0.5">Production</div><div className="text-zinc-200 font-semibold">{target.productionHouse}</div></div>
            <div><div className="text-zinc-500 uppercase tracking-wide text-[9px] mb-0.5">Keyword</div><div className="text-zinc-200 font-semibold">{target.keyword || "—"}</div></div>
          </div>

          <div className="mt-3 border-t border-white/10 pt-3 text-[10px] text-zinc-500 leading-relaxed">
            <span className="uppercase tracking-wide">Cast · </span>
            <span className="text-zinc-400">{target.cast.filter(Boolean).join(", ")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 px-6 pb-6 pt-3">
          <Button variant="outline" size="sm" onClick={onTryAgain}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Again
          </Button>
          <Button size="sm" onClick={onNewMovie}>
            <Infinity className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
          <Button variant="secondary" size="sm" onClick={onShare}>
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
