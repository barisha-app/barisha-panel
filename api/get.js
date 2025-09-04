// barisha-panel/api/get.js

import { loadM3U } from "./_m3u.js";           // canlı kanal listesi (kanal listesi/listE.m3u)
import { loadMovies } from "./movies_m3u.js";  // VOD listesi (barisha-playlist/playlist.json)
import { auth } from "./_auth.js";

export const config = { runtime: "edge" };

/**
 * Kullanım:
 *  Kanallar:  /get?username=U&password=P&type=m3u
 *  Filmler:   /get?username=U&password=P&type=vod
 *  (İsteğe bağlı) sadece bir grubu döndür: &group=Filmler
 */
export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const username = (searchParams.get("username") || "").trim();
  const password = (searchParams.get("password") || "").trim();
  const type     = (searchParams.get("type") || "m3u").toLowerCase();
  const onlyGrp  = (searchParams.get("group") || "").trim(); // opsiyonel filtre

  // --- kimlik doğrulama
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  // --- veri yükle
  let items = [];
  if (type === "m3u") {
    items = await loadM3U();
  } else if (type === "vod") {
    if (!user.vod) return new Response("Unauthorized for VOD", { status: 403 });
    items = await loadMovies();
  } else {
    return new Response("Invalid type", { status: 400 });
  }

  // --- isteğe bağlı grup filtresi
  if (onlyGrp) {
    const g = onlyGrp.toLowerCase();
    items = items.filter((it) => (it.group || "").toLowerCase() === g);
  }

  // --- M3U çıktısı
  let out = "#EXTM3U\n";
  for (const it of items) {
    const title = (it.title || it.name || "").replace(/"/g, '\\"');
    if (!title) continue;

    const group = (it.group || "Genel").replace(/"/g, '\\"');
    const logo  = (it.logo  || "").replace(/"/g, '\\"');
    const url   = (it.url   || it.stream || "").trim();
    if (!url) continue;

    out += `#EXTINF:-1 tvg-id="" tvg-logo="${logo}" group-title="${group}",${title}\n${url}\n`;
  }

  return new Response(out, {
    headers: {
      // Smarters bu içeriği en sorunsuz bununla algılıyor
      "Content-Type": "audio/x-mpegurl; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
