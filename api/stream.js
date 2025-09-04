// api/stream.js
import { auth } from "./_auth";
import { loadM3U } from "./_m3u";
import { loadMovies } from "./movies_m3u";

export const config = { runtime: "edge" };

/**
 * /api/stream?kind=live|movie&id=NUMBER&username=...&password=...
 * 302 ile gerçek kaynağa yönlendirir
 */
export default async function handler(req) {
  const u = new URL(req.url);
  const kind = (u.searchParams.get("kind") || "").toLowerCase();
  const id = Number(u.searchParams.get("id") || "0");
  const username = u.searchParams.get("username") || "";
  const password = u.searchParams.get("password") || "";

  // kullanıcı kontrolü
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  let list = [];
  if (kind === "live") {
    list = await loadM3U(); // kanallar
    // stream_id = idx + 1000
    const idx = id - 1000;
    if (idx < 0 || idx >= list.length) return new Response("Not found", { status: 404 });
    return Response.redirect(list[idx].url, 302);
  } else if (kind === "movie") {
    if (!user.vod) return new Response("VOD disabled", { status: 403 });
    list = await loadMovies(); // filmler
    // stream_id = idx + 5000
    const idx = id - 5000;
    if (idx < 0 || idx >= list.length) return new Response("Not found", { status: 404 });
    return Response.redirect(list[idx].url, 302);
  }

  return new Response("Bad Request", { status: 400 });
}
