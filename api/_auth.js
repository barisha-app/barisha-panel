import users from "../users.json" assert { type: "json" };

/** basit kullanıcı doğrulama */
export function auth(username, password) {
  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return null;
  if (u.active === false) return null;
  if (u.expires && new Date(u.expires).getTime() < Date.now()) return null;
  return u; // { username, packages:[...], ... }
// api/_auth.js
// Basit kullanıcı doğrulama (users.json'dan okur)

import USERS from "../users.json";

export function auth(username = "", password = "") {
  username = String(username || "").trim();
  password = String(password || "").trim();

  const user = USERS.find(
    (u) =>
      u.active &&
      u.username === username &&
      u.password === password &&
      new Date(u.expires) >= new Date()
  );

  return user || null;
}
