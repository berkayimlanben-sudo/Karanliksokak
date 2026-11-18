# Ses ve Müzik Sistemi (`Karanlık Sokak`)

Bu belge, oyundaki ses efektleri, arka plan müziği, kontroller ve test araçlarının kullanımını özetler.

## 1. Ses Kontrolleri ve 3 Seviye Slider'ı

Oyun içi üst panelde (giriş ekranı, mahalle ekranı ve dövüş arenası) her zaman erişilebilir ses düğmeleri bulunur:

- **Hızlı Susturma Butonu / `[M]` Tuşu:** Oyun genelindeki tüm sesleri (**Master**) tek tuşla açıp kapatır. Metin girişi kutularına odaklanılmadığı sürece klavyedeki `M` tuşu her ekranda çalışır.
- **Ses Ayarları Paneli (3 Slider):**
  1. **Master (Genel):** Tüm ses efektlerinin ve müziğin ana çıkış seviyesini (`%0` – `%100`) kontrol eder ve ayrı aç/kapa düğmesi içerir.
  2. **SFX (Efektler):** Dövüş vuruşları, gong, nakavt, menü tıklamaları ve ekonomik uyarıların seviyesini belirler.
  3. **Müzik:** `sakin`, `enerjik` ve `gergin` atmosfer müziklerinin seviyesini belirler.
- **Kalıcılık:** Ses tercihleri `karanlik_sokak_ses_ayarlari_v1` anahtarında saklanır; **"Yeni Başlangıç"** veya kayıt sıfırlama işlemlerinden etkilenmez.

## 2. Debug Ses Paneli (`?debug=1`)

Tüm **17 SFX** efektini ve **3 müzik ruh halini** (`sakin`, `enerjik`, `gergin`) + **Müziği Durdur** kontrolünü doğrudan test etmek için debug paneli bulunur:

- **Açma Yöntemi:** Adres çubuğuna `?debug=1` ekleyerek (ör. `http://localhost:3000/?debug=1`) paneli doğrudan açık başlatabilirsiniz.
- **Geliştirme Ortamı (`DEV`):** Geliştirme sunucusunda sağ alt köşede küçük **“Ses Debug”** butonu görünür.
- **Prodüksiyon Davranışı:** `?debug=1` parametresi verilmediği sürece prodüksiyon derlemesinde panel ve buton kesinlikle görünmez.
