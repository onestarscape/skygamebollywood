import type { Movie } from "@/lib/types";

// Generates a stylized, genre-coded illustration in place of a real movie
// poster (which we deliberately never use, per copyright policy). Cards are
// fully deterministic from the movie's id + genre, so the same movie always
// renders the same card, but no two unrelated movies look identical by luck.

type GenreTheme = {
  bg: string;
  accent: string;
  accentSoft: string;
  glyph: "spotlight" | "blade" | "heart" | "mask" | "trophy" | "bolt";
};

const GENRE_THEMES: Record<string, GenreTheme> = {
  action: { bg: "#15080B", accent: "#C81E3A", accentSoft: "#7A1424", glyph: "blade" },
  thriller: { bg: "#0E0B16", accent: "#6B3FA0", accentSoft: "#3D2459", glyph: "spotlight" },
  crime: { bg: "#0E0B16", accent: "#6B3FA0", accentSoft: "#3D2459", glyph: "spotlight" },
  drama: { bg: "#160E06", accent: "#D4A24C", accentSoft: "#8A6526", glyph: "mask" },
  romance: { bg: "#1A0A11", accent: "#E0567C", accentSoft: "#8C3350", glyph: "heart" },
  comedy: { bg: "#071712", accent: "#2A9D8F", accentSoft: "#1A5F56", glyph: "mask" },
  family: { bg: "#071712", accent: "#2A9D8F", accentSoft: "#1A5F56", glyph: "mask" },
  musical: { bg: "#1A0A11", accent: "#E0567C", accentSoft: "#8C3350", glyph: "heart" },
  sports: { bg: "#0B1117", accent: "#3D8BD4", accentSoft: "#235480", glyph: "trophy" },
  biography: { bg: "#0B1117", accent: "#3D8BD4", accentSoft: "#235480", glyph: "trophy" },
  mystery: { bg: "#0E0B16", accent: "#6B3FA0", accentSoft: "#3D2459", glyph: "spotlight" },
  horror: { bg: "#0A0A0A", accent: "#8B1E3F", accentSoft: "#4A0F22", glyph: "bolt" }
};

const DEFAULT_THEME: GenreTheme = { bg: "#0B0B0F", accent: "#C81E3A", accentSoft: "#5C0F1E", glyph: "spotlight" };

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function themeFor(movie: Pick<Movie, "id" | "genres">): GenreTheme {
  const primaryGenre = (movie.genres[0] ?? "").toLowerCase();
  return GENRE_THEMES[primaryGenre] ?? DEFAULT_THEME;
}

function glyphPath(glyph: GenreTheme["glyph"]): string {
  switch (glyph) {
    case "blade":
      return `<path d="M70 230 L210 70 L230 90 L150 200 L230 280 L210 300 L90 230 Z" />`;
    case "heart":
      return `<path d="M150 250 C60 180 60 100 120 80 C145 72 150 100 150 100 C150 100 155 72 180 80 C240 100 240 180 150 250 Z" />`;
    case "mask":
      return `<path d="M80 120 a70 70 0 1 1 0 90 a70 70 0 1 1 0 -90 Z M220 120 a70 70 0 1 0 0 90 a70 70 0 1 0 0 -90 Z" fill-rule="evenodd" />`;
    case "trophy":
      return `<path d="M110 70 h80 v40 a40 40 0 0 1 -80 0 Z M125 150 h50 l10 70 h-70 Z M100 190 h100 v25 h-100 Z" />`;
    case "bolt":
      return `<path d="M160 60 L100 180 L140 180 L120 260 L210 140 L165 140 Z" />`;
    case "spotlight":
    default:
      return `<path d="M150 60 L230 260 L70 260 Z" opacity="0.9" /><circle cx="150" cy="150" r="34" />`;
  }
}

/**
 * Returns a complete, self-contained SVG markup string for a movie's
 * illustrated card. No external images, no real poster art, no text that
 * reveals the title (callers control whether the title is shown elsewhere).
 */
export function movieCardSvg(movie: Pick<Movie, "id" | "genres" | "year">, options?: { revealed?: boolean; title?: string }): string {
  const theme = themeFor(movie);
  const seed = hash(movie.id);
  const rotation = (seed % 24) - 12; // -12..11 degrees, deterministic per movie
  const offsetX = (seed % 30) - 15;
  const revealed = options?.revealed ?? false;

  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mystery movie card">
  <defs>
    <linearGradient id="bgGrad-${movie.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <radialGradient id="glow-${movie.id}" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="${theme.accentSoft}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${theme.accentSoft}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bgGrad-${movie.id})" />
  <rect width="300" height="400" fill="url(#glow-${movie.id})" />
  <g transform="translate(${150 + offsetX} 160) rotate(${rotation})" fill="${theme.accent}" opacity="0.85">
    <g transform="translate(-150 -150)">${glyphPath(theme.glyph)}</g>
  </g>
  <rect x="0" y="338" width="300" height="62" fill="black" opacity="0.55" />
  <text x="20" y="368" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${theme.accent}">${revealed ? (options?.title ?? "").toUpperCase().slice(0, 26) : "BOLLYRIDDLE"}</text>
  <text x="20" y="388" font-family="Arial, sans-serif" font-size="11" fill="#9a9aa3" letter-spacing="1">${revealed ? movie.year : "MYSTERY MOVIE"}</text>
</svg>`;
}

export function movieCardDataUri(movie: Pick<Movie, "id" | "genres" | "year">, options?: { revealed?: boolean; title?: string }): string {
  const svg = movieCardSvg(movie, options);
  const encoded = typeof window === "undefined" ? Buffer.from(svg).toString("base64") : window.btoa(svg);
  return `data:image/svg+xml;base64,${encoded}`;
}
