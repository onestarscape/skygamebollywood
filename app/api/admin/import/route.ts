import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

// Bulk CSV import for the movie database, matching the "Bollywood Game
// Master File" column layout:
// Movie Title, Year, Genre 1, Genre 2, Genre 3, Lead Cast 1..6, Director,
// Music Director, Production House, Writer, Keyword
//
// This lets new movies be added (or existing ones updated/corrected) without
// touching code -- upload a CSV with the same headers and it upserts by id.

function slugify(title: string, year: number) {
  const slug = title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${year}`;
}

// Minimal CSV parser that handles quoted fields with embedded commas, since
// movie titles and cast names can contain them.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || request.headers.get("x-admin-password") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase service key is not configured" }, { status: 503 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

  const header = rows[0].map((cell) => cell.trim());
  const col = (name: string) => header.indexOf(name);

  const idx = {
    title: col("Movie Title"),
    year: col("Year"),
    genre1: col("Genre 1"),
    genre2: col("Genre 2"),
    genre3: col("Genre 3"),
    cast1: col("Lead Cast 1"),
    cast2: col("Lead Cast 2"),
    cast3: col("Lead Cast 3"),
    cast4: col("Lead Cast 4"),
    cast5: col("Lead Cast 5"),
    cast6: col("Lead Cast 6"),
    director: col("Director"),
    musicDirector: col("Music Director"),
    productionHouse: col("Production House"),
    writer: col("Writer"),
    keyword: col("Keyword")
  };

  if (idx.title === -1 || idx.year === -1) {
    return NextResponse.json({ error: "CSV must include 'Movie Title' and 'Year' columns" }, { status: 400 });
  }

  const errors: string[] = [];
  const records = rows.slice(1).map((cells, rowNumber) => {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const title = get(idx.title);
    const year = Number(get(idx.year));
    if (!title || !Number.isFinite(year)) {
      errors.push(`Row ${rowNumber + 2}: missing title or invalid year`);
      return null;
    }
    const genres = [get(idx.genre1), get(idx.genre2), get(idx.genre3)].filter(Boolean);
    const cast = [get(idx.cast1), get(idx.cast2), get(idx.cast3), get(idx.cast4), get(idx.cast5), get(idx.cast6)].filter(Boolean);
    return {
      id: slugify(title, year),
      title,
      year,
      genres,
      cast_members: cast,
      director: get(idx.director),
      music_director: get(idx.musicDirector),
      production_house: get(idx.productionHouse),
      writer: get(idx.writer),
      keyword: get(idx.keyword)
    };
  }).filter((record): record is NonNullable<typeof record> => record !== null);

  if (records.length === 0) {
    return NextResponse.json({ error: "No valid rows to import", details: errors }, { status: 400 });
  }

  const { error } = await supabase.from("movies").upsert(records, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    imported: records.length,
    skipped: errors.length,
    skippedDetails: errors
  });
}
