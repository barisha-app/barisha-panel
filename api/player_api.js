// api/player_api.js
import auth from "./_auth.js";
import { loadM3U } from "./_m3u.js";
import { loadMovies } from "./movies_m3u.js";

export const config = { runtime: "edge" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const action = (url.searchParams.get("action") || "").toLowerCase();

  const user = auth(username, password);
  if (!user) return json({ user_info: {}, server_info: {}, categories: [], available_channels: [] }, 401);

  if (action === "get_user_info") {
    return json({
      user_info: {
        username,
        auth: 1,
        status: "Active",
        exp_date: Math.floor(new Date(user.expires).getTime() / 1000),
        is_trial: 0
      },
      server_info: { url: "barisha-panel.vercel.app", port: 443, https_port: 443, server_protocol: "https" }
    });
  }

  if (action === "get_live_categories") {
    const ch = await loadM3U().catch(() => []);
    const cats = [...new Set(ch.map(c => c.group || "Genel"))].map(name => ({
      category_id: name, category_name: name, parent_id: 0
    }));
    return json(cats);
  }

  if (action === "get_vod_categories") {
    if (user.vod === false) return json([]);
    const mv = await loadMovies().catch(() => []);
    const cats = [...new Set(mv.map(m => m.group || "Filmler"))].map(name => ({
      category_id: name, category_name: name, parent_id: 0
    }));
    return json(cats);
  }

  if (action === "get_live_streams") {
    const ch = await loadM3U().catch(() => []);
    const group = url.searchParams.get("category_id") || "";
    const filtered = group ? ch.filter(c => (c.group || "Genel") === group) : ch;
    return json(filtered.map((c, idx) => ({
      num: idx + 1000,
      name: c.title,
      stream_type: "live",
      stream_id: idx + 1000,
      stream_icon: c.logo || "",
      direct_source: c.url,
      category_id: c.group || "Genel"
    })));
  }

  if (action === "get_vod_streams") {
    if (user.vod === false) return json([]);
    const mv = await loadMovies().catch(() => []);
    const group = url.searchParams.get("category_id") || "";
    const filtered = group ? mv.filter(m => (m.group || "Filmler") === group) : mv;
    return json(filtered.map((m, idx) => ({
      num: idx + 5000,
      name: m.title,
      stream_type: "movie",
      stream_id: idx + 5000,
      stream_icon: m.logo || "",
      direct_source: m.url,
      category_id: m.group || "Filmler"
    })));
  }

  return json({ user_info: { username, auth: 1 }, server_info: { url: "barisha-panel.vercel.app" } });
}
