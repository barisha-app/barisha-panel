import movies from "../movies.json" assert { type: "json" };

function esc(s = "") {
  return String(s).replace(/"/g, "'");
}

export default function handler(req, res) {
  // Vercel req.query
  const onlyGroup = (req.query?.group || "").trim();

  const lines = ["#EXTM3U"];

  for (const it of movies) {
    if (onlyGroup && (it.group || "").trim() !== onlyGroup) continue;

    const title = it.title || "Video";
    const group = it.group || "Filmler";
    const logo  = it.logo  || "";
    const url   = it.url;

    if (!url) continue;

    const attrs = [
      'tvg-id=""',
      `tvg-name="${esc(title)}"`,
      logo ? `tvg-logo="${esc(logo)}"` : null,
      `group-title="${esc(group)}"`
    ].filter(Boolean).join(" ");

    lines.push(`#EXTINF:-1 ${attrs}, ${title}`);
    lines.push(url);
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.status(200).send(lines.join("\n"));
}
