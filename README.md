# BarisHA IPTV Panel

Vercel Edge Functions üzerinde çalışan modern bir IPTV paneli. Xtream Codes API uyumludur ve tüm IPTV oynatıcılarıyla çalışır.

## Özellikler

- ✅ Xtream Codes API uyumluluğu
- ✅ Smarters Pro, TiviMate, IPTV Smarters desteği
- ✅ Vercel Edge Functions ile yüksek performans
- ✅ Otomatik M3U yedekleme sistemi
- ✅ JSON tabanlı kullanıcı yönetimi
- ✅ Kategori ve kanal gruplama

## Hızlı Başlangıç

### M3U Linki
https://barisha-panel.vercel.app/get.php?username=KULLANICI&password=SIFRE&type=m3u


### Xtream Codes API
https://barisha-panel.vercel.app/player_api.php?username=KULLANICI&password=SIFRE


### Örnek Kullanımlar

1. **M3U Playlist İndirme**:
https://barisha-panel.vercel.app/get.php?username=cihat&password=abi&type=m3u


2. **Kullanıcı Bilgileri**:
https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi


3. **Canlı Kategoriler**:
https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi&action=get_live_categories


5. **Kategoriye Göre Kanallar**:
https://barisha-panel.vercel.app/player_api.php?username=cihat&password=abi&action=get_live_streams&category_id=1


## Kullanıcı Hesapları

Panelde önceden tanımlanmış kullanıcılar:

| Kullanıcı Adı | Şifre      | Durum  |
|---------------|------------|--------|
| baris         | Helin2121  | Aktif  |
| cihat         | abi        | Aktif  |
| admin         | admin      | Aktif  |

Kullanıcıları düzenlemek için `users.json` dosyasını değiştirin.

## Kurulum

### Yerel Geliştirme

1. Depoyu klonlayın:
```bash
git clone <repo-url>
cd barisha-panel


Geliştirme sunucusunu başlatın:
npm run dev
Veya GitHub bağlayarak otomatik deploy.

