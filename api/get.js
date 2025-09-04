// api/get.js
// Smarters için M3U çıktı üretir (kanal, vod, birleşik)

import { auth } from "./_auth";
import { loadM3U } from "./_m3u";
import { loadMovies } from "./movies_m3u";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const type = (url.searchParams.get("type") || "m3u").toLowerCase();

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
  }

  const out = toM3U(items);

  return new Response(out, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Content-Disposition": 'inline; filename="list.m3u"',
      "Cache-Control": "no-store, max-age=0",
    },
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
