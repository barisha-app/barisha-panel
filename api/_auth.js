// api/_auth.js
// Basit kullanıcı doğrulama (users.json'dan okur)

import users from "../users.json" assert { type: "json" };

export default function auth(username, password) {
  const u = (username || "").trim();
  const p = (password || "").trim();

  const user = users.find(x => x.username === u && x.password === p);
  if (!user || user.active === false) return null;

  // expire kontrolü (YYYY-MM-DD)
  if (user.expires) {
    const today = new Date().toISOString().slice(0, 10);
    if (today > user.expires) return null;
  }

  return user; // { username, packages, vod, ... }
}
