"use client";

import { Copy, Send, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SharePanel({ text }: { text: string }) {
  const encoded = encodeURIComponent(text);
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <pre className="mb-4 whitespace-pre-wrap rounded-md bg-black/30 p-3 text-sm leading-6 text-zinc-100">{text}</pre>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigator.clipboard.writeText(text)}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button variant="outline" asChild>
          <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noreferrer">
            <Send className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`https://twitter.com/intent/tweet?text=${encoded}`} target="_blank" rel="noreferrer">
            <Twitter className="h-4 w-4" />
            X
          </a>
        </Button>
      </div>
    </div>
  );
}
