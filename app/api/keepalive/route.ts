import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

// Called once daily by Vercel Cron to keep the Supabase project active.
// Supabase pauses free-tier projects after 7 days of no activity.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "No Supabase client" }, { status: 503 });

  const { count, error } = await supabase
    .from("movies")
    .select("id", { count: "exact", head: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    movieCount: count,
    pingedAt: new Date().toISOString()
  });
}
