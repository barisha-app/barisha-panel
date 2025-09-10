// api/_m3u.js
// Birden fazla M3U kaynağını sırayla dener (ilk çalışanı kullanır)
// Kanal M3U kaynağını indirir ve satırları diziye çevirir

const SOURCES = [
  // 1) jsDelivr (hızlı CDN)
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listeE.m3u",
  // 2) GitHub raw (yedek)
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listeE.m3u"
  // 3) istersen buraya başka bir M3U daha ekleyebilirsin
  // "https://...../kanallar.m3u"
];
// Barış'ın repo yoluna göre iki kaynak:
const PRIMARY =
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listE.m3u";
const FALLBACK =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listE.m3u";

// 5 dk cache (fonksiyon içi)
let CACHE = { ts: 0, items: [] };
const CACHE_MS = 5 * 60 * 1000; // 5 dk cache
const CACHE_MS = 5 * 60 * 1000;

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
  let text = await safeFetch(PRIMARY);
  if (!text) text = await safeFetch(FALLBACK);
  if (!text) throw new Error("M3U indirilemedi (primary + fallback)");

  const items = parseM3U(text);
  CACHE = { ts: now, items };
@@ -33,35 +28,29 @@ export async function loadM3U() {

async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!res.ok) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "";
    return await res.text();
  } catch { return null; }
  } catch {
    return "";
  }
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
