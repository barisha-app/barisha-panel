// api/player_api.js
import { auth } from "./_auth";
import { loadM3U } from "./_m3u";
import { loadMovies } from "./movies_m3u";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const action = (url.searchParams.get("action") || "").toLowerCase();

  const user = auth(username, password);
  if (!user) {
    return json({ user_info: {}, server_info: {}, categories: [], available_channels: [] }, 401);
  }

  if (action === "get_user_info") {
    return json({
      user_info: {
        username,
        auth: 1,
        status: "Active",
        exp_date: Math.floor(new Date(user.expires).getTime() / 1000),
        is_trial: 0,
      },
      server_info: { url: "barisha-panel.vercel.app", port: 443, https_port: 443, server_protocol: "https" },
    });
  }

  if (action === "get_live_streams") {
    const ch = await loadM3U();
    return json(
      ch.map((c, idx) => ({
        num: idx + 1,
        name: c.title,
        stream_id: idx + 1000,
        stream_type: "live",
        stream_icon: c.logo || "",
        category_id: c.group || "Genel",
        direct: c.url,
      }))
    );
  }

  if (action === "get_vod_streams") {
    if (!user.vod) return json([]);
    const mv = await loadMovies();
    return json(
      mv.map((m, idx) => ({
        num: idx + 1,
        name: m.title,
        stream_id: idx + 5000,
        stream_type: "movie",
        stream_icon: m.logo || "",
        category_id: m.group || "Filmler",
        direct: m.url,
      }))
    );
  }

  // default: basic info
  return json({
    user_info: { username, auth: 1 },
    server_info: { url: "barisha-panel.vercel.app" },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
