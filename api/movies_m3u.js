// barisha-panel/api/movies_m3u.js

// Kaynak: önce jsDelivr, olmazsa raw.githubusercontent fallback
const PRIMARY =
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-playlist@main/playlist.json";
const FALLBACK =
  "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json";

// 5 dk hafıza cache
let CACHE = { ts: 0, items: [] };
const CACHE_MS = 5 * 60 * 1000;

export const config = { runtime: "edge" };

/**
 * playlist.json -> [{ title, group, type, logo, url }, ...]
 * sadece geçerli (url’i olan) öğeleri döndürür
 */
export async function loadMovies() {
  const now = Date.now();
  if (now - CACHE.ts < CACHE_MS && CACHE.items.length) return CACHE.items;

  // metni çek
  let text = await safeFetch(PRIMARY);
  if (!text) text = await safeFetch(FALLBACK);
  if (!text) throw new Error("playlist.json alınamadı (primary + fallback)");

  // parse
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("playlist.json geçersiz JSON");
  }
  if (!Array.isArray(data)) throw new Error("playlist.json dizi değil");

  // normalize -> panelin beklediği alanlar
  const items = data
    .map((it) => {
      const title = (it.title || "").trim();
      const group = (it.group || "Filmler").trim();
      const logo = (it.logo || "").trim();
      const url = (it.url || "").trim();
      // type "direct" / "m3u8" vb olabilir; burada hepsini geçirelim,
      // istersen sadece direct/m3u8 filtrelersin
      if (!title || !url) return null;

      return {
        title,
        group,
        logo: logo || null,
        url,
      };
    })
    .filter(Boolean);

  CACHE = { ts: now, items };
  return items;
}

async function safeFetch(url) {
  try {
    const r = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}
