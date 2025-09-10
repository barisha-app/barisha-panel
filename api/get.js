// api/get.js
import auth from "./_auth.js";
import { loadM3U } from "./_m3u.js";
import { loadMovies } from "./movies_m3u.js";

export const config = { runtime: "edge" };

function esc(s = "") { return String(s).replace(/"/g, '\\"'); }

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const username = (url.searchParams.get("username") || "").trim();
    const password = (url.searchParams.get("password") || "").trim();
    const type     = (url.searchParams.get("type") || "m3u").toLowerCase();

    if (type !== "m3u") {
      return new Response("type=m3u olmalı", { status: 400 });
    }

    const user = auth(username, password);
    if (!user) return new Response("Auth failed", { status: 401 });

    const [channels, moviesRaw] = await Promise.all([
      loadM3U().catch(() => []),
      loadMovies().catch(() => [])
    ]);

    // İstersen VOD yetkisi olmayanlardan filmleri gizle:
    const movies = user.vod === false ? [] : moviesRaw;

    const lines = ["#EXTM3U"];

    for (const ch of channels) {
      const title = esc(ch.title || ch.name || "Kanal");
      const logo  = esc(ch.logo  || "");
      const group = esc(ch.group || "Kanallar");
      const link  = (ch.url || "").trim();
      if (!link) continue;
      lines.push(`#EXTINF:-1 tvg-id="" tvg-logo="${logo}" group-title="${group}",${title}`);
      lines.push(link);
    }

    for (const mv of movies) {
      const title = esc(mv.title || "Film");
      const logo  = esc(mv.logo  || "");
      const group = esc(mv.group || "Filmler");
      const link  = (mv.url || "").trim();
      if (!link) continue;
      lines.push(`#EXTINF:-1 tvg-id="" tvg-logo="${logo}" group-title="${group}",${title}`);
      lines.push(link);
    }

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "Content-Disposition": "inline; filename=\"list.m3u\"",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (e) {
    return new Response("SERVER_ERROR", { status: 500 });
  }
}
