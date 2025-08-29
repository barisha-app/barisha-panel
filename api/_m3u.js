const SOURCE_M3U = "https://cdn.jsdelivr.net/gh/barisha-app/iptv@main/listE.m3u";

let CACHE = { ts: 0, items: [] };
const CACHE_MS = 5 * 60 * 1000;

export async function loadM3U() {
  const now = Date.now();
  if (now - CACHE.ts < CACHE_MS && CACHE.items.length) return CACHE.items;

  const res = await fetch(SOURCE_M3U);
  if (!res.ok) throw new Error("M3U indirilemedi");
  const text = await res.text();
  const items = parseM3U(text);
  CACHE = { ts: now, items };
  return items;
}

function parseM3U(m3uText) {
  const lines = m3uText.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith("#EXTINF")) {
      const info = l;
      const url = (lines[i + 1] || "").trim();
      i++;
      const name = (info.match(/,(.*)$/) || [, "Channel"])[1].trim();
      const tvgId = getAttr(info, "tvg-id") || "";
      const tvgLogo = getAttr(info, "tvg-logo") || "";
      const group = getAttr(info, "group-title") || "Live";
      if (url) out.push({ name, url, tvgId, tvgLogo, group });
    }
  }
  return out;
}

function getAttr(extinf, key) {
  const m = extinf.match(new RegExp(`${key}="([^"]*)"`));
  return m ? m[1] : null;
}
