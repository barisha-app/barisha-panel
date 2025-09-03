// api/_m3u.js
// Birden fazla M3U kaynağını sırayla dener (ilk çalışanı kullanır)

const SOURCES = [
  // 1) jsDelivr (hızlı CDN)
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listeE.m3u",
  // 2) GitHub raw (yedek)
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listeE.m3u"
  // 3) istersen buraya başka bir M3U daha ekleyebilirsin
  // "https://...../kanallar.m3u"
];

let CACHE = { ts: 0, items: [] };
const CACHE_MS = 5 * 60 * 1000; // 5 dk cache

export const config = { runtime: "edge" };

export async function loadM3U() {
  const now = Date.now();
  if (now - CACHE.ts < CACHE_MS && CACHE.items.length) return CACHE.items;

  let text = null;
  for (const url of SOURCES) {
    const t = await safeFetch(url);
    if (t) { text = t; break; }
  }
  if (!text) throw new Error("Hiçbir M3U kaynağı okunamadı");

  const items = parseM3U(text);
  CACHE = { ts: now, items };
  return items;
}

async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// Basit bir M3U satır ayrıştırıcı (senin mevcut fonksiyonunla aynı rol)
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let meta = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      meta = line;
      continue;
    }
    if (!line.startsWith("#") && meta) {
      // Basit çıkarım: name, group, logo
      const nameMatch  = meta.match(/,(.*)$/);
      const logoMatch  = meta.match(/tvg-logo="([^"]*)"/);
      const groupMatch = meta.match(/group-title="([^"]*)"/);
      out.push({
        name:  nameMatch ? nameMatch[1].trim() : "No Name",
        group: groupMatch ? groupMatch[1] : "Genel",
        logo:  logoMatch ? logoMatch[1] : "",
        url:   line.trim()
      });
      meta = null;
    }
  }
  return out;
}
