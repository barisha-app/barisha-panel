# BarisHA IPTV (Vercel)

- **M3U:** `/get.php?username=KULLANICI&password=SIFRE&type=m3u`
- **Player API (Xtream):** `/player_api.php?username=KULLANICI&password=SIFRE`
- **Kategoriler:** `&action=get_live_categories`
- **Akışlar:** `&action=get_live_streams&category_id=1`

### Örnekler
- `https://barisha-panel.vercel.app/get.php?username=baris&password=Helin2121&type=m3u`
- `https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi`
- `https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi&action=get_live_categories`
- `https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi&action=get_live_streams&category_id=1`

Kullanıcılar `users.json` içindedir. Kaynak M3U `api/_m3u.js` içinde tanımlı (jsDelivr + raw fallback).
