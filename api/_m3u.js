import { getUserPlaylist } from "./_auth.js";

// 5 dk cache - her kullanıcı için ayrı cache
let CACHE = {};
const CACHE_MS = 5 * 60 * 1000;

export const config = { runtime: "edge" };

export async function loadM3U(user = null) {
  const playlistUrl = getUserPlaylist(user);
  const cacheKey = user ? `${user.username}_${playlistUrl}` : playlistUrl;
  const now = Date.now();
  
  // Cache kontrolü
  if (CACHE[cacheKey] && now - CACHE[cacheKey].ts < CACHE_MS && CACHE[cacheKey].items.length) {
    return CACHE[cacheKey].items;
  }

  let text = await safeFetch(playlistUrl);
  if (!text) {
    // Fallback: genel playlist
    const fallbackUrl = "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listE.m3u";
    text = await safeFetch(fallbackUrl);
  }
  
  if (!text) throw new Error("M3U indirilemedi");

  const items = parseM3U(text);
  CACHE[cacheKey] = { ts: now, items };
  return items;
}

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Sağlam parser: #EXTINF satırından sonra gelen ilk "boş olmayan ve # ile başlamayan"
// satırı URL olarak alır. Araya #EXTVLCOPT vs. girse bile çalışır.
function parseM3U(m3uText) {
  const lines = m3uText.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const l = (lines[i] || "").trim();
    if (!l || !l.startsWith("#EXTINF")) continue;

    const info = l;

    const name = ((info.match(/,(.*)$/) || [, "Channel"])[1] || "Channel").trim();
    const tvgId   = getAttr(info, "tvg-id")    || "";
    const tvgLogo = getAttr(info, "tvg-logo")  || "";
    const group   = getAttr(info, "group-title") || "Live";

    // URL bul
    let url = "";
    let j = i + 1;
    while (j < lines.length) {
      const cand = (lines[j] || "").trim();
      j++;
      if (!cand) continue;           // boş satırları atla
      if (cand.startsWith("#")) continue; // meta satırları (#...) atla
      url = cand;
      break;
    }
    i = j - 1;

    if (url) out.push({ name, url, tvgId, tvgLogo, group });
  }
  return out;
}

function getAttr(extinf, key) {
  const m = extinf.match(new RegExp(`${key}="([^"]*)"`));
  return m ? m[1] : null;
}
