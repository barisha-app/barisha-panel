import users from "../users.json" assert { type: "json" };

export function auth(username, password) {
  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return null;
  if (u.active === false) return null;
  if (u.expires && new Date(u.expires).getTime() < Date.now()) return null;
  return u; // {username, packages:[...]}
}
