// api/stream.js
import auth from "./_auth.js";
import { loadM3U } from "./_m3u.js";
import { loadMovies } from "./movies_m3u.js";

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

  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401 });

  if (kind === "live") {
    const list = await loadM3U().catch(() => []);
    const idx = id - 1000;
    if (idx < 0 || idx >= list.length) return new Response("Not found", { status: 404 });
    return Response.redirect(list[idx].url, 302);
  }

  if (kind === "movie") {
    if (user.vod === false) return new Response("VOD disabled", { status: 403 });
    const list = await loadMovies().catch(() => []);
    const idx = id - 5000;
    if (idx < 0 || idx >= list.length) return new Response("Not found", { status: 404 });
    return Response.redirect(list[idx].url, 302);
  }

  return new Response("Bad Request", { status: 400 });
}
