// api/get.js  — Next.js (Vercel) Edge Function
// Tek endpoint: /get.php?username=XXX&password=YYY&type=m3u
// Hem kanallar (M3U kaynağı) hem filmler (playlist.json) birlikte döner.

export const config = { runtime: "edge" };

// ---- KAYNAKLARINI BURADA SABİTLE ----
const CHANNEL_M3U_URL =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listE.m3u";

const MOVIES_JSON_URL =
  "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json";

// Lokal kullanıcı listesi (repo root’unda /users.json)
import usersData from "../users.json";

// ------------- KÜÇÜK YARDIMCILAR -------------
function okJsonHeaders() {
  return {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  };
}

function m3uHeaders() {
  return {
    headers: {
      "content-type": "application/x-mpegURL; charset=utf-8",
      // CDN için kısa cache; Smarters genelde tekrar çağırır:
      "cache-control": "s-maxage=60, stale-while-revalidate=300",
      // İndirme yerine oynatma için:
      "content-disposition": 'inline; filename="playlist.m3u"'
    }
  };
}

function isActiveUser(u) {
  if (!u?.active) return false;
  if (!u?.expires) return true;
  const today = new Date().toISOString().slice(0, 10);
  return u.expires >= today;
}

// Basit auth
function auth(username, password) {
  const u = usersData.find(
    (x) =>
      String(x.username || "").toLowerCase() ===
        String(username || "").toLowerCase() && x.password === password
  );
  if (!u || !isActiveUser(u)) return null;
  return u;
}

// Filmler JSON’u çek
async function loadMovies() {
  try {
    const r = await fetch(MOVIES_JSON_URL, {
      headers: { "cache-control": "no-cache" }
    });
    if (!r.ok) throw new Error(`movies fetch ${r.status}`);
    return await r.json();
  } catch (e) {
    console.error("MOVIES_LOAD_FAIL", e);
    return [];
  }
}

// M3U parser (sağlam)
function parseM3U(text) {
  const lines = String(text || "").split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = (lines[i] || "").trim();
    if (!l || !l.startsWith("#EXTINF")) continue;

    const info = l;
    const name = ((info.match(/,(.*)$/) || [, "Channel"])[1] || "Channel").trim();
    const tvgLogo = getAttr(info, "tvg-logo") || "";
    const group = getAttr(info, "group-title") || "Live";

    // URL
    let url = "";
    let j = i + 1;
    while (j < lines.length) {
      const cand = (lines[j] || "").trim();
      j++;
      if (!cand) continue;
      if (cand.startsWith("#")) continue;
      url = cand;
      break;
    }
    i = j - 1;
    if (url) out.push({ title: name, group, logo: tvgLogo, url });
  }
  return out;
}
function getAttr(extinf, key) {
  const m = extinf.match(new RegExp(`${key}="([^"]*)"`));
  return m ? m[1] : null;
}

// Kanallar M3U’yu çek
async function loadChannels() {
  try {
    const r = await fetch(CHANNEL_M3U_URL, {
      headers: { "cache-control": "no-cache" }
    });
    if (!r.ok) throw new Error(`m3u fetch ${r.status}`);
    const txt = await r.text();
    return parseM3U(txt);
  } catch (e) {
    console.error("M3U_LOAD_FAIL", e);
    return [];
  }
}

// M3U satırı üret
function pushM3u(lines, { title, group, logo, url }) {
  const safeTitle = (title || "Video").replace(/"/g, "'");
  const safeGroup = (group || "Live").replace(/"/g, "'");
  const logoPart = logo ? ` tvg-logo="${logo}"` : "";
  lines.push(`#EXTINF:-1 tvg-id="" tvg-name="${safeTitle}" group-title="${safeGroup}"${logoPart}, ${safeTitle}`);
  lines.push(url);
}

// ------------- ANA HANDLER -------------
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "";
  const password = searchParams.get("password") || "";
  const type = (searchParams.get("type") || "m3u").toLowerCase();

  // Sadece M3U veriyoruz
  if (type !== "m3u") {
    return new Response(JSON.stringify({ error: "type must be m3u" }), {
      status: 400,
      ...okJsonHeaders()
    });
  }

  // Auth
  const user = auth(username, password);
  if (!user) return new Response("Auth failed", { status: 401, ...m3uHeaders() });

  // Verileri topla
  const [channels, movies] = await Promise.all([loadChannels(), loadMovies()]);

  // M3U yaz
  const out = ["#EXTM3U"];

  // 1) Kanallar
  for (const ch of channels) {
    pushM3u(out, {
      title: ch.title,
      group: ch.group || "Kanallar",
      logo: ch.logo || "",
      url: ch.url
    });
  }

  // 2) Filmler (JSON → M3U)
  for (const mv of Array.isArray(movies) ? movies : []) {
    // Beklenen alanlar: title, url, logo?, group?
    if (!mv?.url || !mv?.title) continue;
    pushM3u(out, {
      title: mv.title,
      group: mv.group || "Filmler",
      logo: mv.logo || "",
      url: mv.url
    });
  }

  return new Response(out.join("\n"), { status: 200, ...m3uHeaders() });
}
