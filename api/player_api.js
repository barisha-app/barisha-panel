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
  if (!user) return json({ user_info: {}, server_info: {}, categories: [], available_channels: [] }, 401);

  // genel bilgiler
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

  // LIVE kategorileri
  if (action === "get_live_categories") {
    const ch = await loadM3U();
    const cats = [...new Set(ch.map((c) => c.group || "Genel"))].map((name, i) => ({
      category_id: name,
      category_name: name,
      parent_id: 0
    }));
    return json(cats);
  }

  // VOD kategorileri
  if (action === "get_vod_categories") {
    if (!user.vod) return json([]);
    const mv = await loadMovies();
    const cats = [...new Set(mv.map((m) => m.group || "Filmler"))].map((name) => ({
      category_id: name,
      category_name: name,
      parent_id: 0
    }));
    return json(cats);
  }

  // LIVE listesi
  if (action === "get_live_streams") {
    const ch = await loadM3U();
    const group = url.searchParams.get("category_id") || ""; // kategori filtresi isteğe bağlı
    const filtered = group ? ch.filter((c) => (c.group || "Genel") === group) : ch;

    return json(
      filtered.map((c, idx) => {
        const stream_id = ch.indexOf(c) + 1000; // sabit indexe göre
        return {
          num: stream_id,
          name: c.title,
          stream_type: "live",
          stream_id,
          stream_icon: c.logo || "",
          // Xtream'in beklediği slug yapısı (rewrites ile /api/stream'e gider)
          direct_source: c.url,
          category_id: c.group || "Genel"
        };
      })
    );
  }

  // VOD listesi
  if (action === "get_vod_streams") {
    if (!user.vod) return json([]);
    const mv = await loadMovies();
    const group = url.searchParams.get("category_id") || "";
    const filtered = group ? mv.filter((m) => (m.group || "Filmler") === group) : mv;

    return json(
      filtered.map((m) => {
        const stream_id = mv.indexOf(m) + 5000;
        return {
          num: stream_id,
          name: m.title,
          stream_type: "movie",
          stream_id,
          stream_icon: m.logo || "",
          direct_source: m.url,
          category_id: m.group || "Filmler"
        };
      })
    );
  }

  // default
  return json({
    user_info: { username, auth: 1 },
    server_info: { url: "barisha-panel.vercel.app" }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
