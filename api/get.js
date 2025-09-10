// api/get.js
// Smarters için M3U çıktı üretir (kanal, vod, birleşik)

import { auth } from "./_auth";
import { loadM3U } from "./_m3u";
import { loadMovies } from "./movies_m3u";
import { loadM3U } from "./_m3u";        // kanallar (listE.m3u'dan)
import { loadMovies } from "./movies_m3u"; // filmler (playlist.json'dan)

export const config = { runtime: "edge" };

function esc(s=""){ return String(s).replace(/"/g, '\\"'); }

export default async function handler(req) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const type = (url.searchParams.get("type") || "m3u").toLowerCase();
  const username = (url.searchParams.get("username") || "").trim();
  const password = (url.searchParams.get("password") || "").trim();
  const type     = (url.searchParams.get("type") || "m3u").toLowerCase();

  if (type !== "m3u") {
    return new Response("type=m3u olmalı", { status: 400 });
  }

  // Kullanıcı doğrula (isteğe göre VOD kontrolü var ama M3U'da birlikte dökeceğiz)
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  let items = [];
  if (type === "m3u") {
    items = await loadM3U();
  } else if (type === "vod") {
    if (!user.vod) return new Response("VOD disabled for this user", { status: 403 });
    items = await loadMovies();
  } else if (type === "all") {
    const [ch, mv] = await Promise.all([loadM3U(), user.vod ? loadMovies() : []]);
    items = [...ch, ...(mv || [])];
  } else {
    return new Response("Bad Request: type must be m3u|vod|all", { status: 400 });
  // 1) Kanallar
  let channels = [];
  try { channels = await loadM3U(); } catch { channels = []; }

  // 2) Filmler (playlist.json) -> yalnızca vod:true kullanıcılar görsün istiyorsan if (user.vod) koy
  let movies = [];
  try { movies = await loadMovies(); } catch { movies = []; }

  // 3) Tek M3U üret (kanallar + filmler)
  const lines = ["#EXTM3U"];

  // Kanallar
  for (const ch of channels) {
    const title = esc(ch.title || ch.name || "Kanal");
    const logo  = esc(ch.logo  || "");
    const group = esc(ch.group || "Kanallar");
    const link  = (ch.url || "").trim();
    if (!link) continue;
    lines.push(`#EXTINF:-1 tvg-id="" tvg-logo="${logo}" group-title="${group}",${title}`);
    lines.push(link);
  }

  const out = toM3U(items);
  // Filmler — grup adı özellikle "Filmler"
  for (const mv of movies) {
    const title = esc(mv.title || "Film");
    const logo  = esc(mv.logo  || "");
    const group = esc(mv.group || "Filmler");  // <-- kritik: Live TV'de “Filmler” grubu
    const link  = (mv.url || "").trim();
    if (!link) continue;
    lines.push(`#EXTINF:-1 tvg-id="" tvg-logo="${logo}" group-title="${group}",${title}`);
    lines.push(link);
  }

  return new Response(out, {
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Content-Disposition": 'inline; filename="list.m3u"',
      "Cache-Control": "no-store, max-age=0",
    },
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function toM3U(arr) {
  const lines = ["#EXTM3U"];
  for (const it of arr) {
    const title = it.title || "Video";
    const group = it.group || "Genel";
    const logo = it.logo || "";
    const url = it.url || "";

    lines.push(
      `#EXTINF:-1 tvg-id="" tvg-name="${esc(title)}" group-title="${esc(group)}"${logo ? ` tvg-logo="${esc(logo)}"` : ""}, ${esc(title)}`
    );
    lines.push(url);
  }
  return lines.join("\n");
}

function esc(s) {
  return String(s).replace(/"/g, '\\"');
}
