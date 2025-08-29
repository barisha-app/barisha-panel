import { loadM3U } from "./_m3u.js";
import { auth } from "./_auth.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "";
  const password = searchParams.get("password") || "";
  const type     = (searchParams.get("type") || "").toLowerCase();

  if (type !== "m3u") return new Response("type=m3u olmalı", { status: 400 });

  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  // not: şimdilik tüm kullanıcılara tüm kanallar veriliyor (paket filtresi yok)
  const items = await loadM3U();

  let out = "#EXTM3U\n";
  for (const ch of items) {
    out += `#EXTINF:-1 tvg-id="${ch.tvgId}" tvg-logo="${ch.tvgLogo}" group-title="${ch.group}",${ch.name}\n`;
    out += ch.url + "\n";
  }

  return new Response(out, {
    headers: { "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8" }
  });
}
