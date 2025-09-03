import loadM3U     from "./_m3u.js";
import loadMoviesM3U from "./movies_m3u.js";   // << EKLENDİ
import { auth }    from "./_auth.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const searchParams = new URL(req.url);
  const username = (searchParams.get("username") || "").trim();
  const password = (searchParams.get("password") || "").trim();
  const type     = (searchParams.get("type") || "").toLowerCase(); // m3u, all, live, vod
  const onlyGroup = (searchParams.get("group") || "").trim();      // opsiyonel filtre

  if (type !== "m3u" && type !== "all" && type !== "live" && type !== "vod") {
    return new Response("type=m3u|all|live|vod olmalı", { status: 400 });
  }

  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  // Verileri çek
  const live   = await loadM3U();         // canlı kanallar
  const movies = await loadMoviesM3U();   // filmler (m3u satırları)

  // Hangi tip?
  let list = [];
  if (type === "live")  list = live;
  else if (type === "vod") list = movies;
  else list = [...live, ...movies];       // m3u / all = hepsi

  // group filtre (varsayılan boş = hepsi)
  if (onlyGroup) {
    list = list.filter(it => (it.group || "").trim() === onlyGroup);
  }

  // M3U çıktısı
  const lines = ["#EXTM3U"];
  for (const ch of list) {
    const title = ch.title || ch.name || "Video";
    const logo  = ch.logo  || "";
    const group = ch.group || "Live";
    const url   = ch.url;

    if (!url) continue;
    lines.push(`#EXTINF:-1 tvg-id="" tvg-name="${esc(title)}" group-title="${esc(group)}", ${title}`);
    lines.push(url);
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      // Smarters bazen dosya adı ister:
      "Content-Disposition": 'inline; filename="barisha.m3u"',
      // Cache’i kısa tut (isteğe göre):
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}

function esc(s = "") { return String(s).replace(/"/g, ''); }
