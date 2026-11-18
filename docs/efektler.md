# Görsel Efektler, Geçişler ve Atmosfer (D2)

Bu doküman, oyundaki tüm animasyon, darbe hissi (juice), ekran geçişleri ve atmosfer katmanlarının tek merkezli yapısını özetler.

## Mimari ve API (`src/game/effects.ts`)

Tüm efektler `requestAnimationFrame` ve önceden ayrılmış DOM havuzu (`hasarHavuzu` = 24, `parcacikHavuzu` = mobilde 50 / masaüstünde 150) üzerinden çalışır (`setInterval` kullanılmaz).

- `sarsinti(siddet, sureMs?)`: Hafif 2 px/80 ms, orta 4 px/120 ms, ağır 6 px/180 ms (maks. 6 px).
- `hitStop(ms)`: Hafif 30 ms, orta 60 ms, ağır 100 ms (maks. 150 ms) darbe donması.
- `flas(alfa, ms?, renk?)`: Ağır darbelerde ve KO anında 100 ms kısa parlama (WCAG 2.3.1 gereği maks. `alfa <= 0.3` ve saniyede en fazla 3 flaş).
- `hasarSayisi(x, y, deger, tur?)`: Hasar değerine göre beyaz → sarı → turuncu → kırmızı (14 → 24 px, 600 ms); para/XP kazanımlarında yeşil (`800 ms`) yükselen sayılar.
- `parcacik(x, y, opts?)`: Darbe ve zafer kıvılcımları.
- `efektSeviyesi(kategori, deger?)`: `sarsinti`, `flas`, `parcacik`, `hitStop` kategorileri için 0–100 seviye okuma/yazma.

## Kalıcılık ve Erişilebilirlik

- **Depolama anahtarı:** `karanlik_sokak_efekt_ayarlari_v1` (oyun kaydından bağımsızdır; "Yeni Oyun" ayarları sıfırlamaz).
- **`prefers-reduced-motion: reduce`:** İlk okumada 4 efekt kategorisini otomatik `0` yapar ve CSS animasyon/geçiş sürelerini kısaltır; kullanıcı ayar panelinden istediği kategoriyi elle yeniden açabilir.

## Dövüş, Geçişler ve Atmosfer

- **KO ve Maç Sonu:** Nakavt anında `1500 ms` `%30` hızında ağır çekim + kırmızı vinyet; zaferde altın/yeşil parlama, mağlubiyette kararma.
- **Ekran Geçişleri (`HomeHub.tsx`):** Mekan değişiminde 400 ms (200 ms kararma + 200 ms aydınlanma); uykuda 600 ms siyah perde + 400 ms "Yeni Gün" + açılma; kira günü yaklaştığında (≤2 gün ve eksik para) üst şeritte saniyede 1 kez olmak üzere 2 kırmızı uyarı flaşı.
- **Atmosfer (`AtmosphereLayer.tsx`):** `efektSeviyesi('parcacik')` değerine bağlı olarak Evde loş ışık titremesi (`opacity 0.9–1.0`), Spor Salonunda max 15 toz parçacığı, Sokak Arenasında sis, parlayan pencereler ve sınırlı SVG yağmur deseni.
- **Arayüz Geri Bildirimi:** Aktif butonlarda 100 ms `%98` basma ölçeği, ihtiyaç/stat/dövüş barlarında `300 ms` yumuşak geçiş, yetenek açılışında 200 ms parlama.
