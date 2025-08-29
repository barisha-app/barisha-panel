import { loadM3U } from "./_m3u.js";
import { auth } from "./_auth.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") || "";
  const password = url.searchParams.get("password") || "";
  const action = url.searchParams.get("action") || "";

  const user = auth(username, password);
  if (!user) return json({ user_info: { auth: 0, status: "Blocked" } });

  const items = await loadM3U();
  const groups = [...new Set(items.map(i => i.group))];
  const live_categories = groups.map((g, i) => ({
    category_id: String(i + 1),
    category_name: g,
    parent_id: 0
  }));

  const live_streams = items.map((c, i) => ({
    num: i + 1,
    name: c.name,
    stream_type: "live",
    stream_id: i + 1,
    stream_icon: c.tvgLogo,
    epg_channel_id: c.tvgId,
    category_id: String(groups.indexOf(c.group) + 1),
    direct_source: c.url
  }));

  if (action === "get_live_categories") return json(live_categories);
  if (action === "get_live_streams") return json(live_streams);

  return json({
    user_info: {
      username,
      password,
      auth: 1,
      status: "Active",
      is_trial: "0",
      active_cons: "1"
    },
    server_info: {
      url: url.host,
      server_protocol: "https"
    },
    categories: { live: live_categories },
    available_output_formats: ["m3u", "ts", "hls"],
    live_streams
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
