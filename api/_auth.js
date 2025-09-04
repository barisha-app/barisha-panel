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
