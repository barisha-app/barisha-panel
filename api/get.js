// api/get.js
import { loadM3U } from "./_m3u.js";
import auth from "./_auth.js";

export const config = { runtime: "edge" };

function esc(s=""){ return String(s).replace(/"/g, '\\"'); }

export default async function handler(req) {
  const url = new URL(req.url);
  const username = (url.searchParams.get("username") || "").toLowerCase();
  const password = url.searchParams.get("password") || "";
  const type     = (url.searchParams.get("type") || "m3u").toLowerCase();

  if (type !== "m3u") return new Response("type=m3u olmalı", { status: 400 });

  // 1) kullanıcı doğrula
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  // 2) kanalları getir
  const items = await loadM3U();

  // 3) kullanıcı vod yetkiliyse filmleri ekle (playlist.json)
  if (user.vod) {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json",
        { cache: "no-store" }
      );
      if (res.ok) {
        const movies = await res.json();
        for (const it of movies || []) {
          const name  = it.title || "Film";
          const group = it.group || "Filmler";
          const logo  = it.logo  || "";
          const url   = it.url   || "";
          if (!url) continue;

          items.push({ name, group, logo, url });
        }
      }
    } catch { /* sessiz geç */ }
  }

  // 4) M3U çıktısı üret
  let out = "#EXTM3U\n";
  for (const ch of items) {
    const name  = ch.name  || "No Name";
    const group = ch.group || "Genel";
    const logo  = ch.logo  || "";
    const url   = ch.url   || "";
    if (!url) continue;

    out += `#EXTINF:-1 tvg-id="" tvg-name="${esc(name)}" group-title="${esc(group)}" tvg-logo="${esc(logo)}", ${name}\n${url}\n`;
  }

  return new Response(out, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store, max-age=0, stale-while-revalidate=300"
    }
  });
}
