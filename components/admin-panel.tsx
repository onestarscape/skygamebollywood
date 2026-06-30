"use client";

import { useState } from "react";
import { BarChart3, CalendarPlus, FileUp, Film, Lock, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminMovieForm = {
  id: string;
  title: string;
  year: string;
  genres: string;
  cast: string;
  director: string;
  musicDirector: string;
  productionHouse: string;
  writer: string;
  keyword: string;
};

const emptyForm: AdminMovieForm = {
  id: "",
  title: "",
  year: "",
  genres: "",
  cast: "",
  director: "",
  musicDirector: "",
  productionHouse: "",
  writer: "",
  keyword: ""
};

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);
  const [importing, setImporting] = useState(false);

  function update<K extends keyof AdminMovieForm>(key: K, value: AdminMovieForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveMovie() {
    const response = await fetch("/api/admin/movies", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify(toPayload(form))
    });
    setMessage(response.ok ? "Movie saved." : "Save failed.");
  }

  async function deleteMovie() {
    const response = await fetch(`/api/admin/movies?id=${encodeURIComponent(form.id)}`, {
      method: "DELETE",
      headers: { "x-admin-password": password }
    });
    setMessage(response.ok ? "Movie deleted." : "Delete failed.");
  }

  async function scheduleMovie() {
    const response = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify({ movieId: form.id, puzzleDate: scheduleDate })
    });
    setMessage(response.ok ? "Movie scheduled." : "Schedule failed.");
  }

  async function loadAnalytics() {
    const response = await fetch("/api/admin/analytics", {
      headers: { "x-admin-password": password }
    });
    if (!response.ok) {
      setMessage("Analytics unavailable.");
      return;
    }
    const data = await response.json();
    setAnalytics(data);
  }

  async function importCsv(file: File | null) {
    if (!file) return;
    setImporting(true);
    setMessage("Importing...");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "x-admin-password": password },
      body
    });
    const data = await response.json();
    setImporting(false);
    if (!response.ok) {
      setMessage(`Import failed: ${data.error ?? "unknown error"}`);
      return;
    }
    setMessage(`Imported ${data.imported} movies${data.skipped ? `, skipped ${data.skipped}` : ""}.`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-600/20 text-red-200">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Admin Panel</h1>
              <p className="text-sm text-zinc-400">Manage movies, clues, schedules, CSV imports, and analytics.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" aria-label="Admin password" />

          <div className="rounded-md border border-dashed border-white/15 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-300">
              <FileUp className="h-4 w-4" />
              Bulk CSV Import
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Upload a CSV with headers: Movie Title, Year, Genre 1-3, Lead Cast 1-6, Director, Music Director,
              Production House, Writer, Keyword. New movies are added, existing ones (matched by title + year) are
              updated.
            </p>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
              <FileUp className="h-4 w-4" />
              {importing ? "Importing..." : "Choose CSV File"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={importing}
                onChange={(event) => importCsv(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <Input
                key={key}
                value={value}
                onChange={(event) => update(key as keyof AdminMovieForm, event.target.value)}
                placeholder={labelFor(key)}
                aria-label={labelFor(key)}
                className={["genres", "cast"].includes(key) ? "sm:col-span-2" : ""}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500">Genres and Cast accept comma-separated lists (e.g. &quot;Comedy, Drama&quot; or &quot;Aamir Khan, Kareena Kapoor&quot;).</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveMovie}>
              <Save className="h-4 w-4" />
              Save Movie
            </Button>
            <Button variant="destructive" onClick={deleteMovie} disabled={!form.id}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          {message && <p className="text-sm font-semibold text-red-200">{message}</p>}
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Lock className="h-5 w-5 text-red-300" />
              Schedule
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            <Button className="w-full" onClick={scheduleMovie} disabled={!form.id}>
              <CalendarPlus className="h-4 w-4" />
              Schedule Movie
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <BarChart3 className="h-5 w-5 text-amber-300" />
              Analytics
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={loadAnalytics}>
              View Analytics
            </Button>
            {analytics && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analytics).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-white/[0.05] p-3">
                    <div className="text-xl font-black">{value}</div>
                    <div className="text-xs uppercase text-zinc-500">{key}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function labelFor(key: string) {
  return key.replace(/[A-Z]/g, (match) => ` ${match}`).replace(/^./, (match) => match.toUpperCase());
}

function toPayload(form: AdminMovieForm) {
  return {
    id: form.id,
    title: form.title,
    year: Number(form.year),
    genres: split(form.genres),
    cast: split(form.cast),
    director: form.director,
    musicDirector: form.musicDirector,
    productionHouse: form.productionHouse,
    writer: form.writer,
    keyword: form.keyword
  };
}

function split(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
