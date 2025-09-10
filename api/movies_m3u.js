// playlist.json -> [{ title, logo, group, url, type?... }]
const PRIMARY  =
  "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/playlist.json";
const FALLBACK =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/refs/heads/main/kanal%20listesi/playlist.json";

async function safeFetch(url) {
  const r = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return await r.json();
}

export async function loadMovies() {
  let data;
  try {
    data = await safeFetch(PRIMARY);
  } catch {
    data = await safeFetch(FALLBACK);
  }

  // beklenen format: [{ title, group, logo, url, type }]
  const out = [];
  for (const it of Array.isArray(data) ? data : []) {
    const url = (it.url || "").trim();
    if (!url) continue;
    out.push({
      title: it.title || "Film",
      logo : it.logo  || "",
      group: it.group || "Filmler",
      url
    });
  }
  return out;
}
