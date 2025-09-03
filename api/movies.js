import movies from "../movies.json" assert { type: "json" };

export default function handler(req, res) {
  // CDN/edge cache
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(movies);
}
