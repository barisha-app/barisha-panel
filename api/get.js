// api/get.js
import loadM3U from "./_m3u.js";
import auth from "./_auth.js";

export const config = { runtime: "edge" };

// Movies JSON (repo kökündeki movies.json)
// İstersen jsDelivr de kullanabilirsin; şimdilik raw kesin çalışır.
const MOVIES_URL =
  "https://raw.githubusercontent.com/barisha-app/barisha-panel/main/movies.json";

// M3U içinde güvenli olsun diye ufak kaçış
function esc(s = "") {
  return String(s).replace(/"/g, '\\"');
}

export default async function handler(req) {
  const url = new URL(req.url);
  const username = (url.searchParams.get("username") || "").trim();
  const password = (url.searchParams.get("password") || "").trim();
  const type = (url.searchParams.get("type") || "m3u").toLowerCase();

  // Sadece m3u veriyoruz (Smarters bunu bekliyor)
  if (type !== "m3u") {
    return new Response("type=m3u olmalı", { status: 400 });
  }

  // Kullanıcı doğrula
  const user = auth(username, password);
  if (!user || user.active === false) {
    return new Response("Auth failed", { status: 401 });
  }

  // 1) Kanalları yükle
  let channels = [];
  try {
    channels = await loadM3U(); // _m3u.js -> items[]
  } catch (e) {
    return new Response("Kanal listesi yüklenemedi", { status: 500 });
  }

  // 2) Kullanıcı VOD yetkiliyse filmleri çek
  let movies = [];
  if (user.vod === true) {
    try {
      const r = await fetch(MOVIES_URL, { cache: "no-store" });
      if (r.ok) movies = await r.json();
    } catch (_) {
      // sessiz geç; filmler gelmezse kanallar yine çalışsın
    }
  }

  // 3) Tek M3U üret
  const lines = ["#EXTM3U"];

  // Kanallar
  for (const ch of channels) {
    const name = ch.name || ch.title || "Channel";
    const logo = ch.tvgLogo || ch.logo || "";
    const group = ch.group || "TV";
    const urlStr = ch.url || ch.streamUrl || "";

    lines.push(
      `#EXTINF:-1 tvg-id="${esc(ch.tvgId || "")}" tvg-name="${esc(
        name
      )}" tvg-logo="${esc(logo)}" group-title="${esc(group)}", ${esc(name)}`
    );
    lines.push(urlStr);
  }

  // Filmler (VOD)
  for (const mv of movies) {
    const title = mv.title || "Film";
    const logo = mv.logo || "";
    const group = mv.group || "Filmler";
    const urlStr = mv.url || "";

    lines.push(
      `#EXTINF:-1 tvg-id="" tvg-name="${esc(title)}" tvg-logo="${esc(
        logo
      )}" group-title="${esc(group)}", ${esc(title)}`
    );
    lines.push(urlStr);
  }

  // 4) Yanıt
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      // İstersen indirme tetiklenmesin diye 'inline' tutuyoruz
      "Content-Disposition": 'inline; filename="playlist.m3u"',
      // Smarters hızlı güncellesin
      "Cache-Control": "no-store",
    },
  });
}
