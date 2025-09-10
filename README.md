# BarisHA IPTV (Vercel)
- M3U: `/api/get?username=baris&password=Helin2121&type=m3u`
- Player API: `/api/player_api?username=baris&password=Helin2121`
- Kullanıcılar: `users.json` içinde.
- Kaynak M3U: `listE.m3u` (jsDelivr linki `_m3u.js` içinde).
- **M3U:** `/get.php?username=KULLANICI&password=SIFRE&type=m3u`
- **Player API (Xtream):** `/player_api.php?username=KULLANICI&password=SIFRE`
- **Kategoriler:** `&action=get_live_categories`
- **Akışlar:** `&action=get_live_streams&category_id=1`
## Xtream (opsiyonel)
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE&action=get_user_info
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE&action=get_live_categories
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE&action=get_live_streams
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE&action=get_vod_categories
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE&action=get_vod_streams
Kullanıcılar `users.json` içinde. Kanallar `kanal listesi/listE.m3u`, filmler `kanal listesi/playlist.json` kaynaklarından çekilir (jsDelivr + raw fallback).
