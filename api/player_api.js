import { loadM3U } from "./_m3u.js";
import { auth } from "./_auth.js";
// api/player_api.js
import { auth } from "./_auth";
import { loadM3U } from "./_m3u";
import { loadMovies } from "./movies_m3u";

export const config = { runtime: "edge" };

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    const password = url.searchParams.get("password") || "";
    const action   = url.searchParams.get("action") || "";

    // auth
    const user = auth(username, password);
    if (!user) return json({ user_info: { auth: 0, status: "Blocked" } });

    // tüm kanallar
    const items = await loadM3U();
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const action = (url.searchParams.get("action") || "").toLowerCase();

    // kategoriler
    const groups = [...new Set(items.map(i => i.group || "Live"))];
    const catById = (id) => groups[Number(id) - 1];

    // ---- Smarters uyumlu aksiyonlar ----
    if (action === "get_live_categories") {
      const arr = groups.map((g, i) => ({
        category_id: String(i + 1),
        category_name: g,
        parent_id: 0
      }));
      return json(arr);
    }

    if (action === "get_live_streams") {
      const cid = url.searchParams.get("category_id");
      let filtered = items;
      if (cid) {
        const grp = catById(cid);
        filtered = items.filter(i => (i.group || "Live") === grp);
      }
      const arr = filtered.map((c, i) => ({
        num: i + 1,
        name: c.name || `Channel ${i + 1}`,
        stream_type: "live",
        stream_id: i + 1,                // sanal id
        stream_icon: c.tvgLogo || "",
        epg_channel_id: c.tvgId || "",
        added: String(Math.floor(Date.now() / 1000)),
        category_id: String(groups.indexOf(c.group || "Live") + 1),
        custom_sid: "",
        tv_archive: 0,
        direct_source: c.url              // çoğu player bunu oynatır
      }));
      return json(arr);
    }

    // vod/series beklerse boş dön
    if (action === "get_vod_categories" || action === "get_series_categories") return json([]);
    if (action === "get_vod_streams" || action === "get_series") return json([]);
  const user = auth(username, password);
  if (!user) {
    return json({ user_info: {}, server_info: {}, categories: [], available_channels: [] }, 401);
  }

    // ilk login bilgisi
    const now = Math.floor(Date.now() / 1000);
  if (action === "get_user_info") {
    return json({
      user_info: {
        username, password,
        message: "",
        username,
        auth: 1,
        status: "Active",
        exp_date: String(now + 60 * 60 * 24 * 30),
        is_trial: "0",
        active_cons: "0",
        created_at: String(now),
        max_connections: "1"
        exp_date: Math.floor(new Date(user.expires).getTime() / 1000),
        is_trial: 0,
      },
      server_info: {
        url: url.host,
        port: "443",
        https_port: "443",
        server_protocol: url.protocol.replace(":", ""),
        rtmp_port: "0",
        timestamp_now: now,
        time_now: new Date(now * 1000).toISOString()
      }
      server_info: { url: "barisha-panel.vercel.app", port: 443, https_port: 443, server_protocol: "https" },
    });
  } catch (e) {
    return new Response("player_api error: " + e.message, { status: 500 });
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
