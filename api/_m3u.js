// listE.m3u -> [{ title, logo, group, url }]
const PRIMARY  =
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listE.m3u";
const FALLBACK =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/listE.m3u";

async function safeFetch(url) {
  const r = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return await r.text();
}

function parseM3U(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();
    if (!L.startsWith("#EXTINF")) continue;

    // #EXTINF:-1 tvg-logo="..." group-title="...",Title
    const logo  = (L.match(/tvg-logo="([^"]*)"/i) || [,""])[1];
    const group = (L.match(/group-title="([^"]*)"/i) || [,"Kanallar"])[1];
    const title = (L.split(",")[1] || "Kanal").trim();

    // sonraki satır URL
    const url = (lines[i + 1] || "").trim();
    if (!url || url.startsWith("#")) continue;

    out.push({ title, logo, group, url });
  }
  return out;
}

export async function loadM3U() {
  let txt;
  try {
    txt = await safeFetch(PRIMARY);
  } catch {
    txt = await safeFetch(FALLBACK);
  }
  return parseM3U(txt);
}
