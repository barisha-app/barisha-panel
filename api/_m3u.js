// api/_m3u.js
// Kanal M3U kaynağını indirir ve satırları diziye çevirir

// Barış'ın repo yoluna göre iki kaynak:
const PRIMARY =
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listE.m3u";
const FALLBACK =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listE.m3u";

// 5 dk cache (fonksiyon içi)
let CACHE = { ts: 0, items: [] };
const CACHE_MS = 5 * 60 * 1000;

export const config = { runtime: "edge" };

export async function loadM3U() {
  const now = Date.now();
  if (now - CACHE.ts < CACHE_MS && CACHE.items.length) return CACHE.items;

  let text = await safeFetch(PRIMARY);
  if (!text) text = await safeFetch(FALLBACK);
  if (!text) throw new Error("M3U indirilemedi (primary + fallback)");

  const items = parseM3U(text);
  CACHE = { ts: now, items };
  return items;
}

async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let meta = null;

  for (const ln of lines) {
    if (ln.startsWith("#EXTINF")) {
      // #EXTINF:-1 tvg-id="" tvg-name="TRT 1" group-title="Ulusal", TRT 1
      meta = ln;
    } else if (!!meta && ln && !ln.startsWith("#")) {
      const title = (meta.match(/,(.*)$/) || [,""])[1].trim();
      const group =
        (meta.match(/group-title="([^"]*)"/) || [,""])[1] || "Kanallar";
      const logo = (meta.match(/tvg-logo="([^"]*)"/) || [,""])[1] || "";
      out.push({ title, group, logo, url: ln, type: "direct" });
      meta = null;
    }
  }
  return out;
}
