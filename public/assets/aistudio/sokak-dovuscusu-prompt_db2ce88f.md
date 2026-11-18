Sen deneyimli bir oyun geliştiricisisin. Benimle birlikte, hobi amaçlı ama ileride geliştirmeye çok açık, 2 boyutlu bir "sokak dövüşçüsü geliştirme" oyunu yapacağız. Planı takip ederek önce sadece 1. aşamayı yaz, diğerlerini ben isteyince yapacağız.

## Teknik şartlar
- Kurulum gerektirmesin: tek dosya halinde, tarayıcıda açılıp çalışsın.
- Telefonda ve bilgisayarda çalışsın (mobil uyumlu, dokunmatik butonlar).
- İlerleme otomatik kaydedilsin.
- En önemli şart: genişletilebilirlik. Hamleler, rakipler, eşyalar, statlar, ev seviyeleri, aile üyeleri ve rastgele olaylar kodun içine gömülmesin, kolayca eklenebilen veri listeleri halinde dursun. Yeni bir hamle, ev veya olay eklemek sadece listeye yeni bir kayıt eklemek kadar kolay olmalı. Kod bölümlere ayrılsın (veri, oyun mantığı, arayüz).
- Kod Türkçe yorum satırlarıyla açıklansın, arayüz metinleri Türkçe olsun.

## Görsel stil
- 2 boyutlu, yandan görünüşlü. Yetişkinlere hitap eden, koyu ve atmosferik bir çizgi roman / graphic novel havası: çocuk oyunu gibi değil, stilize ve olgun dursun.
- Renk paleti kısıtlı ve tutarlı olsun (4-5 ana renk). Mekan başına bir hakim ton: gece mahalle için koyu mavi/mor, çatı için turuncu gün batımı, otopark için soğuk yeşil-gri. Vurgu rengi olarak tek bir canlı renk (kırmızı veya sarı) kullan.
- Dövüşçüler yuvarlak, şirin şekillerle değil, açılı ve keskin hatlarla çizilsin (omuz, çene, yumruk belirgin). Kalın siluet, düz renk alanları, az detay. Yüz detayı minimum, ifade ağırlıklı olarak duruştan gelsin.
- Işık ve atmosfer: arka planda katmanlı siluetler (binalar, çatılar, çitler), yumuşak renk geçişleri, sokak lambası ışığı, hafif sis veya tanecik (grain) efekti.
- Dövüş hissi: vuruşta kısa ekran sarsıntısı, çarpma anında beyaz/sarı flaş, hafif yavaşlatma, hasar sayıları sert ve okunaklı bir fontla. Kaçınmada hızlı kayma ve iz efekti. Can ve stamina barları sade ve okunaklı olsun.
- Arayüz: koyu, minimal, ince çizgili paneller. Parlak oyuncak renkleri, yuvarlak köşeli şirin butonlar kullanma. Font seçimi sert ve sade olsun (kalın başlıklar, temiz gövde yazısı).
- Tüm renkler ve stil ayarları tek bir yerde (CSS değişkenleri veya bir tema nesnesi) tutulsun ki sonradan paleti kolayca değiştirebileyim.
- Dış görsel dosyası kullanma, her şey kodla çizilsin.

## Tema ve ana karakter
- Sokak dövüşü: mahalle arası, çatı, park, otopark gibi mekanlar.
- Oyuncunun sabit bir karakteri var: 20 yaşında, mahallede yıllardır yaşayan genç bir adam. Babasını kaybedince üniversiteyi bırakmak zorunda kaldı. Evde annesi ve küçük kız kardeşi var; ailenin geçimi artık ona kalmış ve bunu kendi sorumluluğu olarak görüyor. Para kazanmanın hızlı yollarını ararken sokak dövüşüyle tanışıyor. Bu arka plan 2-3 cümlelik kısa bir giriş metni olarak oyun başında gösterilsin.
- Mahalleyi tanıyor ve mahalle onu tanıyor: komşular, esnaf ve eski arkadaşlar babasını bilir. Olay ve diyalog metinleri bunu yansıtsın (örn. babasının eski tanıdıkları, bakkalda kalan eski bir borç, "Baban olsaydı ne derdi?" tarzı göndermeler).
- Oyuncu oyun başında karakterine bir lakap seçer (metin girişi, boş bırakırsa rastgele öneri verilsin). Lakap tek bir yerde saklansın ve dövüş çevresindeki metinlerde {oyuncuAdi} olarak kullanılsın. Gerçek ad sabit olsun (sade bir Türk erkek adı seç): mahalledeki yaşlılar ve aile ona gerçek adıyla, dövüş çevresi lakabıyla hitap etsin.
- Ailede anne ve küçük kız kardeş var (adlarını sen seç). Veri olarak tanımlansınlar, oyun içinde sık görünmeseler de ev olaylarında ve bildirimlerde adlarıyla anılsınlar, ileride hikaye karakterine dönüşebilecek şekilde esnek olsunlar.
- Görünüş seçimi yok, ama ileride eklenebilecek şekilde karakter çizimi renk/kıyafet parametreleriyle yapılsın.

## Statlar
- Güç: ağır yumruk ve ağır tekmelerin hasarını artırır, bu hamlelerin açılmasında etkilidir.
- Çeviklik: hızlı yumruk ve hızlı tekmelerin isabetini ve sırasını belirler, kaçınma hareketlerinin başarı şansını artırır.
- Refleks: rakibin hamlesini okuyup kaçınma/blok şansını artırır.
- Dayanıklılık: maksimum can ve stamina ile yorgunluktan toparlanma hızını belirler.
Statlar başta düşük olsun ve sistem kolayca yeni stat eklenebilecek şekilde yazılsın. Ek değerler: Can, Stamina, Enerji, Moral.

## Hamle sistemi (prototipte sadece bunlar, ama genişletilebilir)
Her hamle veri olarak tanımlansın ve şu alanları içersin: isim, tür (yumruk / tekme / kaçınma), temel hasar, stamina maliyeti, isabet şansı, hangi statlardan ne kadar etkilendiği, açılma şartı (minimum stat).
- Yumruklar: Düz Yumruk (hızlı, az hasar, Çeviklik ağırlıklı), Sert Yumruk (yavaş, çok hasar, Güç ağırlıklı)
- Tekmeler: Alçak Tekme (hızlı, düşük hasar, Çeviklik ağırlıklı), Yan Tekme (güçlü, çok stamina harcar, Güç ağırlıklı)
- Kaçınma: Geri Çekil (Çeviklik ağırlıklı), Eğil/Yana Kay (Refleks ağırlıklı), Blok (hasarı azaltır, stamina toparlatır)
Bazı hamleler başta kilitli olsun ve stat belirli seviyeye gelince açılsın. Kaçınma hamlesi başarılı olursa rakibin saldırısı boşa gitsin ve küçük bir karşı saldırı fırsatı doğsun.
(İleride eklenecekler için yer bırak: kombolar, özel hamleler, silah/eşya, çevre etkileri. Şimdi yazma.)

## Ev sistemi (oyunun üssü)
Aile evi düşük gelirli, kötü bir durumda başlar: soğuk, gürültülü, eski yatak. Ev seviyeleri veri listesi olarak tanımlansın. Her ev seviyesinin alanları: isim, haftalık kira, günlük enerji toparlanma oranı, moral bonusu/cezası, taşıyabileceği eşya sayısı.
- Başlangıç evi en kötü seviye olsun. Üst seviyeler daha iyi dinlenme ve moral verir, ama kirası da yüksektir.
- Ev eşyaları (veri listesi): düzgün yatak, ısıtıcı, kum torbası, ayna, ağırlık seti vb. Her eşya belirli bir antrenman verimini veya dinlenmeyi artırır. Para ile alınır. Alınan eşyalar aile için de bir şey ifade etsin (örn. "Annen için sıcak bir ısıtıcı aldın" gibi bildirimler).
- Haftalık kira: Aile evinin kirası. Karakter bunu ödemeyi kendi sorumluluğu olarak görüyor. Her 7 günde bir ödenir. Ödenemezse önce ev sahibinden uyarı gelir ve moral düşer, tekrar ödenemezse aile daha kötü ve daha ucuz bir eve taşınmak zorunda kalır (ev seviyesi düşer). Bu "oyun bitti" değil, geri adım olsun; para toparlayınca tekrar yükselmek mümkün olsun.
- Kira yaklaşırken arayüzde kalan gün ve eksik tutar net gösterilsin. Oyuncu baskıyı hissetsin ama oyun haksız hissettirmesin.
- Moral: Ev kalitesi, olay sonuçları ve maç sonuçları moralı etkiler. Düşük moral antrenman verimini ve dövüşte isabeti hafifçe düşürür.

## Rastgele ev olayları (prototipte 4 tane, ama genişletilebilir)
Olaylar veri listesi olarak tanımlansın: başlık, açıklama metni, çıkma şartı/olasılığı, oyuncunun seçenekleri, her seçeneğin sonucu (para, moral, enerji, stat, itibar değişimi). Gün başında olasılıkla bir olay tetiklensin.
Örnek olaylar: elektrik kesintisi, kız kardeşin okul için para istemesi, kira zammı, kapıya tanımadığın birinin dayanması, babanın eski bir tanıdığının gelmesi. Seçeneklerin doğru/yanlış cevabı olmasın, her seçim bir şey kazandırıp başka bir şeyi götürsün (para, moral, enerji, zaman).
(İleride eklenecekler için yer bırak: komşu karakterlerin hikaye zincirleri, haraççı/çete gibi ahlaki gri seçimler, "saygı" ve "korku" diye iki ayrı itibar değeri. Şimdi yazma, sadece veri yapısı bunları ekleyebilecek kadar esnek olsun.)

## Maç sistemi
Sıra tabanlı dövüş. Her turda oyuncu bir hamle seçer, rakip yapay zekası statlarına, stamina ve canına göre hamle seçer. Hasar ve isabet formülü hamle verisi ile statlara bağlı olsun, küçük rastgelelik içersin. Stamina bitince hamle seçenekleri kısıtlansın. Biten maçlar: KO, tur sonunda puanla karar, yenilgi. Maçlar para ve itibar kazandırır, yenilgi para ve moral kaybettirir.

## Gün sistemi ve antrenman
Günlük sınırlı enerji var. Oyuncu günde birkaç aktivite seçer: antrenman (hangi statı geliştireceğini seçer), dinlenme (evin kalitesine göre toparlanır), iş yapıp para kazanma, maça çıkma. Antrenman enerji harcar ve küçük artış sağlar. Yorgunluk birikir, dinlenmezse verim düşer.

## Rakipler ve ilerleme
En az 5 rakip, giderek zorlaşan, her biri farklı dövüş tarzında (saldırgan, çevik, savunmacı...). Rakipler veri listesi olarak tanımlansın. Rakipleri yenince sonraki mahalleye/lige geçilir. Kazanılan para kira, ev, eşya ve antrenman yükseltmelerine harcanır.

## Aşamalar (sırayla ilerleyeceğiz)
1. Temel: ana karakter ve giriş hikayesi, statlar, gün/enerji sistemi, antrenman, ev seviyesi + haftalık kira, 4 rastgele ev olayı, moral, kaydetme, basit ana ekran, hamle verisi yapısı, görsel stilin temeli (tema nesnesi).
2. Maç sistemi: sıra tabanlı dövüş, hamleler, ilk 3 rakip, dövüş ekranı grafikleri ve efektleri.
3. Kalan rakipler, ev eşyaları ve yükseltmeler, bölge/lig sistemi, daha fazla ev olayı.
4. Derinlik: komşu karakterler ve hikaye zincirleri, itibar sistemi (saygı/korku), ahlaki gri seçimler, çete/haraççı olayları.
5. Cila ve yeni özellikler: ses, animasyon, denge ayarı, kombolar, özel hamleler.

## Çalışma kuralları
- Şimdi sadece 1. aşamayı yaz, çalışır ve eksiksiz bir dosya ver.
- Sonraki aşamalarda tüm kodu baştan yazma. Sadece eklenen/değişen kısımları, hangi bölüme koyacağımı belirterek ver. Tam dosyayı ben istersem yaz.
- Sonda kısa bir "nasıl denerim" ve "sonraki adım önerisi" ekle.
- Emin olmadığın tasarım kararında en basit olanı seç ve belirt, bana gereksiz soru sorma.
