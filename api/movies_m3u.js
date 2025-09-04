// api/movies_m3u.js
// VOD (filmler) için JSON playlist'ini okur ve kanalla aynı formata getirir

const MOVIES_URL =
  "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json";

// 5 dk cache
let MCACHE = { ts: 0, items: [] };
const MCACHE_MS = 5 * 60 * 1000;

export const config = { runtime: "edge" };

export async function loadMovies() {
  const now = Date.now();
  if (now - MCACHE.ts < MCACHE_MS && MCACHE.items.length) return MCACHE.items;

  const res = await fetch(MOVIES_URL, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  if (!res.ok) throw new Error(`Movies JSON çekilemedi: ${res.status}`);
  const arr = await res.json();

  // beklenen şekil:
  // [{title, group, type, logo, url}]
  const norm = Array.isArray(arr)
    ? arr.map((it) => ({
        title: it.title || "Video",
        group: it.group || "Filmler",
        type: (it.type || "direct").toLowerCase(),
        logo: it.logo || "",
        url: it.url || "",
      }))
    : [];

  MCACHE = { ts: now, items: norm };
  return norm;
}
