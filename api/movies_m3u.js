// /api/movies_m3u.js
// Aynı playlist'ten M3U üretir. ?group=Filmler ile filtre de yapar.

const PLAYLIST_URL =
  process.env.PLAYLIST_URL ||
  "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json";

function esc(s = "") {
  return String(s).replace(/"/g, "'");
}

export default async function handler(req, res) {
  try {
    const r = await fetch(PLAYLIST_URL, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!r.ok) throw new Error(`fetch ${r.status} ${r.statusText}`);
    const movies = await r.json();

    const onlyGroup = (req.query?.group || "").trim();
    const lines = ["#EXTM3U"];

    for (const it of Array.isArray(movies) ? movies : []) {
      if (!it?.url) continue;

      const title = it.title || "Video";
      const group = it.group || "Filmler";
      const logo = it.logo || "";

      if (onlyGroup && group.trim() !== onlyGroup) continue;

      const attrs = [
        'tvg-id=""',
        `tvg-name="${esc(title)}"`,
        logo ? `tvg-logo="${esc(logo)}"` : null,
        `group-title="${esc(group)}"`,
      ]
        .filter(Boolean)
        .join(" ");

      lines.push(`#EXTINF:-1 ${attrs}, ${title}`);
      lines.push(it.url);
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(lines.join("\n"));
  } catch (err) {
    console.error("M3U_BUILD_FAILED:", err);
    res.status(500).send("#EXTM3U\n#EXTINF:-1, ERROR\n");
  }
}
