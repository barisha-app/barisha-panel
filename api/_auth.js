import users from "../users.json" assert { type: "json" };

/** basit kullanıcı doğrulama */
export function auth(username, password) {
  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return null;
  if (u.active === false) return null;
  if (u.expires && new Date(u.expires).getTime() < Date.now()) return null;
  return u; // { username, packages:[...], customPlaylist, ... }
}

/** kullanıcıya özel playlist URL'sini döndürür */
export function getUserPlaylist(user) {
  return user.customPlaylist || "https://cdn.jsdelivr.net/gh/barisha-app/barisha-panel@main/kanal%20listesi/listE.m3u";
}
