// api/get.js
import { auth } from "./_auth";
import { loadM3U } from "./_m3u";        // kanallar (listE.m3u'dan)
import { loadMovies } from "./movies_m3u"; // filmler (playlist.json'dan)

export const config = { runtime: "edge" };

function esc(s=""){ return String(s).replace(/"/g, '\\"'); }

export default async function handler(req) {
  const url = new URL(req.url);
  const username = (url.searchParams.get("username") || "").trim();
  const password = (url.searchParams.get("password") || "").trim();
  const type     = (url.searchParams.get("type") || "m3u").toLowerCase();

  if (type !== "m3u") {
    return new Response("type=m3u olmalı", { status: 400 });
  }

  // Kullanıcı doğrula (isteğe göre VOD kontrolü var ama M3U'da birlikte dökeceğiz)
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

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

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Content-Disposition": 'inline; filename="list.m3u"',
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
