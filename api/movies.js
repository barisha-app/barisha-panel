// /api/movies.js
// Playlist'i uzaktan (GitHub RAW) çeker ve JSON döner.
// Vercel'de fs kullanmadan, serverless uyumlu.

const PLAYLIST_URL =
  process.env.PLAYLIST_URL ||
  "https://raw.githubusercontent.com/barisha-app/barisha-playlist/main/playlist.json";

export default async function handler(req, res) {
  try {
    const r = await fetch(PLAYLIST_URL, {
      // her çağrıda taze çeksin:
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!r.ok) throw new Error(`fetch ${r.status} ${r.statusText}`);

    const movies = await r.json();

    // edge/CDN cache (kullanışlı, ama hemen güncellensin istiyorsan süreyi kısalt)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(movies);
  } catch (err) {
    console.error("PLAYLIST_FETCH_FAILED:", err);
    res
      .status(500)
      .json({ error: "PLAYLIST_FETCH_FAILED", message: String(err) });
  }
}
