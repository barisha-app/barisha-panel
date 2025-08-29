import { loadM3U } from "./_m3u.js";
import { auth } from "./_auth.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    const password = url.searchParams.get("password") || "";
    const action   = url.searchParams.get("action") || "";

    // basit auth
    const user = auth(username, password);
    if (!user) return json({ user_info: { auth: 0, status: "Blocked" } });

    // M
