import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acilCorbaIc,
  aileRuhHaliGetir,
  aileyleEtkiles,
  aktifDebufflariGetir,
  antrenmanYap,
  debugStatlariAyarla,
  dovusSonucunuUygula,
  durumuKaydet,
  durumuYukle,
  ESKI_KAYIT_ANAHTARI_V2,
  evdeUyuVeGunuBitir,
  evEsyasiAl,
  evYukselt,
  hesaplaTuretilmisDegerler,
  hocaDersiAl,
  hocaDersiAlinabilirMi,
  indirimliMarketFiyati,
  itibarDengesiUygula,
  KAYIT_ANAHTARI,
  KAYIT_SURUMU,
  kaydiMigrateEt,
  kaydiSil,
  kiraBorcuOde,
  komsuDayanismasiAl,
  komsuEtkilesimiBaslat,
  komsuItibarYorumuGetir,
  komsuMusaitOlayiGetir,
  komsuOlayiniKapat,
  komsuSecenegiUygula,
  mekanaGit,
  mekandakiMusaitKomsuOlaylari,
  metinSablonunuDoldur,
  olayEtkisiRozetleri,
  olaySecenegiUygula,
  OyunDurumu,
  rakipCekinmeHesapla,
  rastgeleEvOlayiSec,
  referansStratejiSimuleEt,
  ringTavriDegistir,
  saatMetni,
  sokakGolgeBoksu,
  vardiyaYap,
  yemekYe,
  yeniOyunOlustur,
  yetenekAc,
  yetenekAcilabilirMi,
} from './engine';
import { dovusAdimi, dovusBaslat, oyuncuHamleSec } from './combat';
import { dengeGuncelle, dengeSifirla, VARSAYILAN_DENGE } from './balance';
import {
  AHLAKI_GRI_OLAYLAR,
  ANTRENOR_DERSLERI,
  ANTRENOR_LISTESI,
  EV_OLAYLARI,
  EV_SEVIYELERI,
  KOMSU_LISTESI,
  KOMSU_OLAYLARI,
  RAKIP_LISTESI,
  SAAT_SABITLERI,
  YEMEK_LISTESI,
  YETENEK_AGACI,
  YETENEK_DALLARI,
} from '../data/gameData';

test('yeni oyun varsayılan lakap Gölge seçer ve zamanı 08:00 başlatır', () => {
  const oyun = yeniOyunOlustur('   ', () => 0);
  assert.equal(oyun.oyuncu.gercekAd, 'Kerem');
  assert.equal(oyun.oyuncu.lakap, 'Gölge');
  assert.equal(oyun.aktifMekan, 'ev');
  assert.equal(saatMetni(oyun.saatDakika), '08:00');

  const metin = metinSablonunuDoldur('{oyuncuAdi} sokağa indi, evde {gercekAd} bekleniyor.', oyun);
  assert.equal(metin, 'Gölge sokağa indi, evde Kerem bekleniyor.');
});

test('mekanlar arası yolculuk aktif mekanı değiştirir ve saati ilerletir', () => {
  let oyun = yeniOyunOlustur('Gölge');
  const baslangicSaat = oyun.saatDakika;

  oyun = mekanaGit(oyun, 'spor_salonu', () => 0.99);
  assert.equal(oyun.aktifMekan, 'spor_salonu');
  assert.ok(oyun.saatDakika > baslangicSaat, 'Yolculuk saat harcamalı');
  assert.ok(oyun.enerji < 100);
});

test('spor salonu günlük girişi, antrenman, tokluk/uyku düşüşü ve hamle kilidi açma', () => {
  let oyun = yeniOyunOlustur('Balyoz');
  assert.equal(oyun.statlar.guc.deger, 4);
  assert.equal(hesaplaTuretilmisDegerler(oyun).acikHamleIds.includes('sert_yumruk'), false);

  for (let i = 0; i < 16; i += 1) {
    if (oyun.aktifOlay) {
      oyun = { ...oyun, aktifOlay: null };
    }
    if (oyun.para < 50) {
      oyun = { ...oyun, para: 200 };
    }
    if (oyun.tokluk < 30) {
      oyun = { ...oyun, tokluk: 80 };
    }
    oyun = antrenmanYap(oyun, 'guc', {}, () => 0.99);
    if (oyun.enerji < 30) {
      oyun = evdeUyuVeGunuBitir(oyun, () => 0.99);
    }
  }

  assert.ok(oyun.statlar.guc.deger >= 7, `Güç 7 olmalıydı, mevcut: ${oyun.statlar.guc.deger}`);
  assert.equal(hesaplaTuretilmisDegerler(oyun).acikHamleIds.includes('sert_yumruk'), true);
});

test('düşük tokluk ve düşük uyku antrenman verimini düşürür', () => {
  const dinc = yeniOyunOlustur('Gölge');
  const ac = { ...dinc, tokluk: 10 };
  const uykusuz = { ...dinc, uyku: 15, yorgunluk: 85 };

  const dincVerim = hesaplaTuretilmisDegerler(dinc).antrenmanVerimi;
  assert.ok(hesaplaTuretilmisDegerler(ac).antrenmanVerimi < dincVerim);
  assert.ok(hesaplaTuretilmisDegerler(uykusuz).antrenmanVerimi < dincVerim);
});

test('marketten erzak alıp buzdolabından yeme ve anti-ölüm sarmalı kurtuluşu çalışır', () => {
  let oyun = yeniOyunOlustur('Gölge');
  const oncekiStok = oyun.buzdolabiStok;

  oyun = mekanaGit(oyun, 'market', () => 0.99);
  oyun = yemekYe(oyun, 'market_mutfak_poseti', () => 0.99);
  assert.equal(oyun.buzdolabiStok, oncekiStok + 3);

  oyun = mekanaGit(oyun, 'ev', () => 0.99);
  const yemedenOnceTokluk = oyun.tokluk;
  oyun = { ...oyun, tokluk: 40 };
  oyun = yemekYe(oyun, 'ev_yemegi', () => 0.99);
  assert.equal(oyun.buzdolabiStok, oncekiStok + 2);
  assert.ok(oyun.tokluk > 40);
  assert.ok(yemedenOnceTokluk >= 0);

  // Sıfır para, boş dolap ve düşük toklukta Emine'nin ücretsiz çorbası + düşük enerjili el ilanı kurtarmalı
  let sikismis = { ...oyun, para: 0, buzdolabiStok: 0, tokluk: 20, enerji: 10, moral: 10 };
  sikismis = acilCorbaIc(sikismis, () => 0.99);
  assert.ok(sikismis.tokluk >= 50);
  assert.ok(sikismis.enerji >= 25);

  sikismis = vardiyaYap(sikismis, 'el_ilani', () => 0.99);
  assert.equal(sikismis.para, 95);

  // Parasızken sokakta ücretsiz gölge boksu yapılabilmeli
  let parasiz = { ...oyun, para: 0, enerji: 60 };
  const ceviklikOnce = parasiz.statlar.ceviklik.ilerleme;
  parasiz = sokakGolgeBoksu(parasiz, () => 0.99);
  assert.ok(parasiz.statlar.ceviklik.ilerleme > ceviklikOnce || parasiz.statlar.ceviklik.deger > 5);
});

test('gece 02:00 sınırında uyuyakalma cezası tetiklenir ve ertesi gün 10:00 uyanılır', () => {
  let oyun = yeniOyunOlustur('Gölge');
  oyun = { ...oyun, saatDakika: 25 * 60 + 20 }; // 01:20 (Gece)
  oyun = vardiyaYap(oyun, 'el_ilani', () => 0.99); // +90 dk -> 02:50 -> bayılma

  assert.equal(oyun.gun, 2);
  assert.equal(oyun.saatDakika, SAAT_SABITLERI.uyuyakalmaSabahDakika);
  assert.equal(oyun.uyuyakalmaCezasi, true);
  assert.equal(oyun.aktifMekan, 'ev');
});

test('ev eşyası satın alma ve aile etkileşimleri günde 1 kez çalışır', () => {
  let oyun = yeniOyunOlustur('Gölge');
  oyun = { ...oyun, para: 500 };
  oyun = evEsyasiAl(oyun, 'kum_torbasi');
  assert.ok(oyun.evEsyalari.includes('kum_torbasi'));
  assert.equal(hesaplaTuretilmisDegerler(oyun).evdeAntrenmanAcik, true);

  // Evde kum torbasında ücretsiz çalışabilmeli
  const gucOnce = oyun.statlar.guc.ilerleme;
  oyun = antrenmanYap(oyun, 'guc', { ucretsizEv: true }, () => 0.99);
  assert.ok(oyun.statlar.guc.ilerleme > gucOnce);

  // Aile etkileşimleri günde 1 kez moral verir
  const moralOnce = oyun.moral;
  oyun = aileyleEtkiles(oyun, 'anne_emine', () => 0.99);
  assert.ok(oyun.moral > moralOnce);
  const moralSonra = oyun.moral;
  oyun = aileyleEtkiles(oyun, 'anne_emine', () => 0.99);
  assert.equal(oyun.moral, moralSonra);
});

test('haftalık kira ödenebilir, ödenemezse önce uyarı sonra ev düşüşü olur', () => {
  let zengin = yeniOyunOlustur('Kıvılcım');
  zengin = { ...zengin, gun: 7, para: 1200 };
  const kiraSonrasi = evdeUyuVeGunuBitir(zengin, () => 0.99);
  assert.equal(kiraSonrasi.gun, 8);
  assert.equal(kiraSonrasi.para, 1200 - EV_SEVIYELERI[0].haftalikKira);
  assert.equal(kiraSonrasi.kiraUyariSayisi, 0);

  let ustEv = yeniOyunOlustur('Akrep');
  ustEv = { ...ustEv, evSeviyesi: 1, gun: 7, para: 100, moral: 60 };
  const ilkIhlal = evdeUyuVeGunuBitir(ustEv, () => 0.99);
  assert.equal(ilkIhlal.kiraUyariSayisi, 1);
  assert.equal(ilkIhlal.evSeviyesi, 1);
  assert.ok(ilkIhlal.moral < 60);

  const ikinciIhlal = evdeUyuVeGunuBitir(
    { ...ilkIhlal, aktifOlay: null, gun: 14, para: 100 },
    () => 0.99
  );
  assert.equal(ikinciIhlal.evSeviyesi, 0);
  assert.equal(ikinciIhlal.kiraUyariSayisi, 0);
});

test('ev yükseltme ve olay seçeneği durumu günceller', () => {
  let oyun = yeniOyunOlustur('Gece');
  oyun = { ...oyun, para: 1500 };
  oyun = evYukselt(oyun);
  assert.equal(oyun.evSeviyesi, 1);
  assert.equal(oyun.para, 300);

  const olay = EV_OLAYLARI[0];
  oyun = { ...oyun, aktifOlay: olay };
  const sonuc = olaySecenegiUygula(oyun, olay.secenekler[0].id);
  assert.equal(sonuc.aktifOlay, null);
  assert.equal(sonuc.para, 300 - 220);
});

test('baba borcu olayı (baba_tanidigi) oyun boyunca en fazla bir kez çıkar', () => {
  const babaOlayi = EV_OLAYLARI.find((o) => o.id === 'baba_tanidigi');
  assert.ok(babaOlayi, 'baba_tanidigi olayı tanımlı olmalı');
  assert.equal(babaOlayi.tekSeferlik, true);

  let oyun = yeniOyunOlustur('Gölge');
  oyun = { ...oyun, aktifOlay: babaOlayi, gun: 3 };
  oyun = olaySecenegiUygula(oyun, babaOlayi.secenekler[0].id);

  assert.ok(oyun.tamamlananTekilOlayIds.includes('baba_tanidigi'));
  assert.equal(oyun.sonOlayId, 'baba_tanidigi');

  // Sonraki 20 gün rastgele seçimde baba_tanidigi asla yeniden seçilmemeli
  for (let i = 0; i < 20; i += 1) {
    const aday = rastgeleEvOlayiSec(
      { ...oyun, gun: 4 + i, sonOlayGunu: 0 },
      () => (i % 10) / 10
    );
    assert.notEqual(
      aday?.id,
      'baba_tanidigi',
      'baba_tanidigi bir kere çözüldükten sonra tekrar çıkmamalı'
    );
  }
});

test('sokak maçı sonucu para, itibar, moral, süre ve galibiyet sayısını günceller', () => {
  const oyun = yeniOyunOlustur('Gölge');
  const ilkRakip = RAKIP_LISTESI[0];

  const { yeniDurum, ozet } = dovusSonucunuUygula(oyun, ilkRakip.id, 'oyuncu', () => 0.99);
  assert.equal(ozet.kazanan, 'oyuncu');
  assert.equal(ozet.paraDegisimi, ilkRakip.paraOdulu);
  assert.equal(yeniDurum.para, oyun.para + ilkRakip.paraOdulu);
  assert.ok(yeniDurum.itibar.genel >= ilkRakip.itibarOdulu);
  assert.equal(yeniDurum.macKazanmaSayisi, 1);
  assert.ok(yeniDurum.yenilenRakipIds.includes(ilkRakip.id));
  assert.ok(yeniDurum.saatDakika > oyun.saatDakika);

  // Mağlubiyette teselli parası ve dayanıklılık ilerlemesi verilir (ölüm sarmalı yok)
  const kayip = dovusSonucunuUygula(oyun, ilkRakip.id, 'rakip', () => 0.99);
  assert.equal(kayip.ozet.paraDegisimi, ilkRakip.teselliPara);
  assert.ok(kayip.yeniDurum.statlar.dayaniklilik.ilerleme > 0);
});

test('10 günlük dengeli oyun simülasyonu: oyuncu makul seçimlerle 7. gün kirasını ödeyebilir ve gelişir', () => {
  let oyun = yeniOyunOlustur('Gölge', () => 0);
  let kiraOdendi = false;

  for (let gun = 1; gun <= 10; gun += 1) {
    if (oyun.aktifOlay) {
      // Bütçeyi koruyan ücretsiz veya düşük maliyetli seçenek seç
      oyun = olaySecenegiUygula(oyun, oyun.aktifOlay.secenekler[1].id);
    }

    // Açsa evde yemek ye, dolap boşsa marketten erzak al
    if (oyun.tokluk < 55) {
      if (oyun.buzdolabiStok > 0) {
        oyun = mekanaGit(oyun, 'ev', () => 0.99);
        oyun = yemekYe(oyun, 'ev_yemegi', () => 0.99);
      } else {
        oyun = mekanaGit(oyun, 'market', () => 0.99);
        oyun = yemekYe(oyun, 'market_mutfak_poseti', () => 0.99);
      }
    }

    // İş yerine git ve para kazan
    oyun = mekanaGit(oyun, 'is_yeri', () => 0.99);
    if (oyun.enerji >= 34) {
      oyun = vardiyaYap(oyun, 'hal_hamalligi', () => 0.99);
    } else if (oyun.enerji >= 25) {
      oyun = vardiyaYap(oyun, 'gece_oto_yikama', () => 0.99);
    }

    // Kalan enerjiyle spor salonunda çalış
    if (oyun.enerji >= 30 && oyun.para >= 25) {
      oyun = mekanaGit(oyun, 'spor_salonu', () => 0.99);
      oyun = antrenmanYap(oyun, gun % 2 === 0 ? 'guc' : 'ceviklik', {}, () => 0.99);
    }

    // Eve dön ve aileyle konuş, uyu
    oyun = mekanaGit(oyun, 'ev', () => 0.99);
    oyun = aileyleEtkiles(oyun, gun % 2 === 0 ? 'anne_emine' : 'kardes_elif', () => 0.99);

    if (oyun.gun === 7) {
      assert.ok(
        oyun.para >= EV_SEVIYELERI[0].haftalikKira,
        `7. gün sonunda kira (${EV_SEVIYELERI[0].haftalikKira} ₺) için yeterli para birikmeli, mevcut: ${oyun.para}`
      );
      kiraOdendi = true;
    }

    // Bazı günlerde geç saatte bayılma olmadıysa evde uyu
    if (oyun.gun === gun) {
      oyun = evdeUyuVeGunuBitir(oyun, () => 0.99);
    }
  }

  assert.equal(kiraOdendi, true);
  assert.equal(oyun.kiraUyariSayisi, 0);
  const toplamStat =
    oyun.statlar.guc.deger +
    oyun.statlar.ceviklik.deger +
    oyun.statlar.refleks.deger +
    oyun.statlar.dayaniklilik.deger;
  assert.ok(toplamStat > 18, `10 günde statlar gelişmeli, toplam: ${toplamStat}`);
});

test('olaySecenegiUygula yetersiz parada olayı kapatmaz ve para istismarını engeller', () => {
  const olay = EV_OLAYLARI[0]; // -220 TL seçeneği içerir
  const fakir = { ...yeniOyunOlustur('Gölge'), para: 40, aktifOlay: olay };
  const sonuc = olaySecenegiUygula(fakir, olay.secenekler[0].id);

  assert.equal(sonuc.para, 40);
  assert.equal(sonuc.aktifOlay?.id, olay.id);
  assert.equal(sonuc.sonBildirim?.tur, 'uyari');
});

test('C1 yetenek ağacı 4 dal × 5 kademe veri yapısına sahiptir ve ön koşul/stat şartlarını uygular', () => {
  assert.equal(YETENEK_DALLARI.length, 4);
  for (const dal of YETENEK_DALLARI) {
    const dugumler = YETENEK_AGACI.filter((y) => y.dal === dal.id);
    assert.equal(dugumler.length, 5, `${dal.id} dalında 5 kademe olmalı`);
  }

  let oyun = { ...yeniOyunOlustur('Gölge'), yetenekPuani: 3 };

  // Önceki yetenek açılmadan 2. kademe açılamamalı
  const kademe2Kontrol = yetenekAcilabilirMi(oyun, 'y_cene_kancasi');
  assert.equal(kademe2Kontrol.acilabilir, false);
  assert.ok(kademe2Kontrol.neden?.includes('Sıkı Bandaj'));

  // 1. kademe açılır
  oyun = yetenekAc(oyun, 'y_sik_bandaj');
  assert.ok(oyun.acikYetenekIds.includes('y_sik_bandaj'));
  assert.equal(oyun.yetenekPuani, 2);

  // Güç 4 iken Güç 5 şartlı Çene Kancası açılamamalı
  const gucYetersiz = yetenekAcilabilirMi(oyun, 'y_cene_kancasi');
  assert.equal(gucYetersiz.acilabilir, false);
  assert.ok(gucYetersiz.neden?.includes('Güç 5'));

  // Güç 5 yapılınca açılmalı ve Sol Kroşe hamlesi aktifleşmeli
  oyun = {
    ...oyun,
    statlar: { ...oyun.statlar, guc: { deger: 5, ilerleme: 0 } },
  };
  oyun = yetenekAc(oyun, 'y_cene_kancasi');
  assert.ok(oyun.acikYetenekIds.includes('y_cene_kancasi'));
  assert.equal(oyun.yetenekPuani, 1);
  assert.ok(hesaplaTuretilmisDegerler(oyun).acikHamleIds.includes('sol_krose'));
});

test('C1 maç galibiyeti ve stat eşikleri (6, 8, 10, 12) yetenek puanı kazandırır ve pasifler otomatik uygulanır', () => {
  let oyun = yeniOyunOlustur('Gölge');
  const ilkRakip = RAKIP_LISTESI[0];

  // İlk galibiyet: +2 YP (1 taban + 1 ilk galibiyet bonusu)
  const ilkZafer = dovusSonucunuUygula(oyun, ilkRakip.id, 'oyuncu', () => 0.99);
  assert.equal(ilkZafer.ozet.yetenekPuaniDegisimi, 2);
  assert.equal(ilkZafer.yeniDurum.yetenekPuani, 2);

  // Aynı rakibe tekrar galibiyet: +1 YP
  const ikinciZafer = dovusSonucunuUygula(
    { ...ilkZafer.yeniDurum, aktifOlay: null },
    ilkRakip.id,
    'oyuncu',
    () => 0.99
  );
  assert.equal(ikinciZafer.ozet.yetenekPuaniDegisimi, 1);
  assert.equal(ikinciZafer.yeniDurum.yetenekPuani, 3);

  // Stat eşiği: Güç 5 (%90) -> antrenmanla Güç 6 olunca +1 YP, tekrar verilmez
  let statEsikTest = {
    ...yeniOyunOlustur('Gölge'),
    para: 300,
    statlar: {
      ...oyun.statlar,
      guc: { deger: 5, ilerleme: 90 },
    },
  };
  statEsikTest = antrenmanYap(statEsikTest, 'guc', {}, () => 0.99);
  assert.equal(statEsikTest.statlar.guc.deger, 6);
  assert.equal(statEsikTest.yetenekPuani, 1);
  assert.ok(statEsikTest.kazanilanStatEsikleri.includes('guc:6'));

  statEsikTest = antrenmanYap(statEsikTest, 'guc', {}, () => 0.99);
  assert.equal(statEsikTest.yetenekPuani, 1);

  // Dayanıklılık pasifleri: maksCan, maksStamina, antrenmanVerimi ve sabah enerjisi artmalı
  const tabanTuretilmis = hesaplaTuretilmisDegerler(oyun);
  const pasifliOyun = {
    ...oyun,
    statlar: { ...oyun.statlar, dayaniklilik: { deger: 8, ilerleme: 0 } },
    acikYetenekIds: ['d_derin_nefes', 'd_beton_cene', 'd_ikinci_ruzgar', 'd_sokak_disiplini'],
  };
  const taban8Day = hesaplaTuretilmisDegerler({
    ...oyun,
    statlar: { ...oyun.statlar, dayaniklilik: { deger: 8, ilerleme: 0 } },
  });
  const pasifliTuretilmis = hesaplaTuretilmisDegerler(pasifliOyun);

  assert.equal(pasifliTuretilmis.maksCan, taban8Day.maksCan + 30); // +16 +14
  assert.equal(pasifliTuretilmis.maksStamina, taban8Day.maksStamina + 20); // +8 +12
  assert.equal(pasifliTuretilmis.antrenmanVerimi, taban8Day.antrenmanVerimi + 8);
  assert.ok(tabanTuretilmis.maksCan < pasifliTuretilmis.maksCan);

  const sabahPasifli = evdeUyuVeGunuBitir(
    { ...pasifliOyun, saatDakika: 21 * 60 },
    () => 0.99
  );
  const sabahNormal = evdeUyuVeGunuBitir(
    { ...oyun, statlar: { ...oyun.statlar, dayaniklilik: { deger: 8, ilerleme: 0 } }, saatDakika: 21 * 60 },
    () => 0.99
  );
  assert.equal(sabahPasifli.enerji, Math.min(100, sabahNormal.enerji + 6));
});

test('C1/C2/C3 eski kayıt uyumluluğu: yeni alanları olmayan kayıt güvenli varsayılanlarla yüklenir', () => {
  const eskiWindow = (globalThis as { window?: unknown }).window;
  const taban = yeniOyunOlustur('Gölge');
  const eskiKayit = { ...taban } as Record<string, unknown>;
  delete eskiKayit.yetenekPuani;
  delete eskiKayit.acikYetenekIds;
  delete eskiKayit.kazanilanStatEsikleri;
  delete eskiKayit.ogrenilenHocaDersIds;
  delete eskiKayit.komsuAdimlari;
  delete eskiKayit.komsuSecimleri;
  delete eskiKayit.komsuBayraklari;
  delete eskiKayit.aktifKomsuOlayi;
  delete eskiKayit.aileIliskisi;
  delete eskiKayit.ahlakiSecimler;
  delete eskiKayit.komsuDayanismaGunu;
  delete eskiKayit.ringTavri;

  const depo = new Map<string, string>([
    [KAYIT_ANAHTARI, JSON.stringify(eskiKayit)],
  ]);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k: string) => depo.get(k) ?? null,
        setItem: (k: string, v: string) => {
          depo.set(k, v);
        },
        removeItem: (k: string) => {
          depo.delete(k);
        },
      },
    },
  });

  try {
    const yuklenen = durumuYukle();
    assert.ok(yuklenen);
    assert.equal(yuklenen.yetenekPuani, 0);
    assert.deepEqual(yuklenen.acikYetenekIds, []);
    assert.deepEqual(yuklenen.kazanilanStatEsikleri, []);
    assert.deepEqual(yuklenen.ogrenilenHocaDersIds, []);
    assert.deepEqual(yuklenen.komsuAdimlari, {});
    assert.deepEqual(yuklenen.komsuSecimleri, []);
    assert.deepEqual(yuklenen.komsuBayraklari, []);
    assert.equal(yuklenen.aktifKomsuOlayi, null);
    assert.equal(yuklenen.aileIliskisi, 60);
    assert.deepEqual(yuklenen.ahlakiSecimler, []);
    assert.equal(yuklenen.komsuDayanismaGunu, 0);
    assert.equal(yuklenen.ringTavri, 'dengeli');
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: eskiWindow,
    });
  }
});

test('C2 spor salonu antrenörleri para/zaman/stat şartıyla özel hamle ve pasif öğretir', () => {
  assert.ok(ANTRENOR_LISTESI.length >= 2, 'En az 2 antrenör tanımlı olmalı');
  assert.ok(ANTRENOR_DERSLERI.length >= 6);

  let oyun = yeniOyunOlustur('Gölge');
  // Diyaloglarda gerçek ad ve lakap yer tutucuları çözümlenir
  const diyalog = metinSablonunuDoldur(ANTRENOR_LISTESI[0].diyalog, oyun);
  assert.ok(diyalog.includes('Kerem'));
  assert.ok(diyalog.includes('Gölge'));

  // Güç 4 iken Güç 5 şartlı Kömürlük Kroşesi alınamamalı
  const basarisiz = hocaDersiAlinabilirMi({ ...oyun, para: 500 }, 'muslum_vucut_krosesi');
  assert.equal(basarisiz.alinabilir, false);
  assert.ok(basarisiz.neden?.includes('Güç 5'));

  // Ön koşul dersi alınmadan Ağır Torba Disiplini alınamamalı
  const onkosulEksik = hocaDersiAlinabilirMi(
    {
      ...oyun,
      para: 500,
      statlar: {
        ...oyun.statlar,
        guc: { deger: 8, ilerleme: 0 },
        dayaniklilik: { deger: 7, ilerleme: 0 },
      },
    },
    'muslum_agir_disiplin'
  );
  assert.equal(onkosulEksik.alinabilir, false);
  assert.ok(onkosulEksik.neden?.includes('Kömürlük Kroşesi'));

  // Stat ve para sağlanınca Müslüm Hoca ve Çiğdem Hoca dersleri öğrenilir
  oyun = {
    ...oyun,
    para: 600,
    enerji: 100,
    statlar: {
      guc: { deger: 5, ilerleme: 0 },
      ceviklik: { deger: 6, ilerleme: 0 },
      refleks: { deger: 6, ilerleme: 0 },
      dayaniklilik: { deger: 6, ilerleme: 0 },
    },
  };
  const onceSaat = oyun.saatDakika;
  const oncePara = oyun.para;

  oyun = hocaDersiAl(oyun, 'muslum_vucut_krosesi', () => 0.99);
  assert.ok(oyun.ogrenilenHocaDersIds.includes('muslum_vucut_krosesi'));
  assert.equal(oyun.para, oncePara - 130);
  assert.equal(oyun.saatDakika, onceSaat + 60);

  oyun = hocaDersiAl(oyun, 'muslum_civi_durus', () => 0.99);
  oyun = hocaDersiAl(oyun, 'cigdem_capraz_kontra', () => 0.99);

  const turetilmis = hesaplaTuretilmisDegerler(oyun);
  assert.ok(turetilmis.acikHamleIds.includes('vucut_krosesi'));
  assert.ok(turetilmis.acikHamleIds.includes('capraz_kontra'));
  assert.equal(turetilmis.pasifler.yumrukHasarYuzde, 10);
  assert.equal(turetilmis.pasifler.ekMaksCan, 14);
  assert.equal(turetilmis.pasifler.blokKesintiYuzde, 6);
  assert.equal(turetilmis.pasifler.kacinmaSansiBonusu, 6);
  assert.equal(turetilmis.maksCan, 60 + 6 * 8 + 14);
});

test('C2 sabit komşuların koşullu hikaye zincirleri mekanlarda ilerler ve fırsat/sorun üretir', () => {
  assert.ok(KOMSU_LISTESI.length >= 5, 'En az 5 sabit komşu tanımlı olmalı');
  for (const komsu of KOMSU_LISTESI) {
    const adimlar = new Set(
      KOMSU_OLAYLARI.filter((o) => o.komsuId === komsu.id).map((o) => o.adim)
    );
    assert.ok(adimlar.size >= 3, `${komsu.isim} en az 3 adımlı hikayeye sahip olmalı`);
  }

  // 1) Bakkal Rıza (Market): Gün 1'de Adım 1 açılır, ucuz erzak adımı Gün 3'e kadar bekler
  let oyun = yeniOyunOlustur('Gölge');
  oyun = mekanaGit(oyun, 'market', () => 0.99);
  const marketKomsulari = mekandakiMusaitKomsuOlaylari(oyun, 'market');
  assert.ok(marketKomsulari.some((k) => k.komsu.id === 'bakkal_riza' && k.olay?.adim === 1));

  oyun = komsuEtkilesimiBaslat(oyun, 'bakkal_riza');
  assert.equal(oyun.aktifKomsuOlayi?.id, 'riza_1_tezgah');
  const stokOnce = oyun.buzdolabiStok;
  oyun = komsuSecenegiUygula(oyun, 'riza_saygili', () => 0.99);
  assert.equal(oyun.aktifKomsuOlayi, null);
  assert.equal(oyun.komsuAdimlari.bakkal_riza, 1);
  assert.equal(oyun.buzdolabiStok, stokOnce + 1);
  assert.ok(oyun.komsuBayraklari.includes('riza_dost'));

  // Gün 1'de Adım 2 henüz kilitli, Gün 3'te açılır ve maliyetine 3 öğün erzak verir
  assert.equal(komsuMusaitOlayiGetir(oyun, 'bakkal_riza', 'market'), null);
  oyun = { ...oyun, gun: 3, para: 100 };
  oyun = komsuEtkilesimiBaslat(oyun, 'bakkal_riza');
  assert.equal(oyun.aktifKomsuOlayi?.id, 'riza_2_sogutucu');
  oyun = komsuSecenegiUygula(oyun, 'riza_ucuz_erzak', () => 0.99);
  assert.equal(oyun.para, 40);
  assert.equal(oyun.buzdolabiStok, stokOnce + 4);

  // 2) Nuri Abi: Önceki seçime göre Adım 3 dallanması (nuri_yakin -> +1 YP)
  let nuriOyun: ReturnType<typeof yeniOyunOlustur> = {
    ...yeniOyunOlustur('Gölge'),
    gun: 2,
    aktifMekan: 'sokak_arena',
  };
  nuriOyun = komsuEtkilesimiBaslat(nuriOyun, 'nuri_usta');
  assert.equal(nuriOyun.aktifKomsuOlayi?.id, 'nuri_1_hatira');
  nuriOyun = komsuSecenegiUygula(nuriOyun, 'nuri_dinle', () => 0.99);
  assert.ok(nuriOyun.komsuBayraklari.includes('nuri_yakin'));

  nuriOyun = { ...nuriOyun, gun: 4, enerji: 80 };
  nuriOyun = komsuEtkilesimiBaslat(nuriOyun, 'nuri_usta');
  assert.equal(nuriOyun.aktifKomsuOlayi?.id, 'nuri_2_ipucu');
  nuriOyun = komsuSecenegiUygula(nuriOyun, 'nuri_taktik_calis', () => 0.99);

  nuriOyun = { ...nuriOyun, gun: 7, aktifMekan: 'ev' };
  nuriOyun = komsuEtkilesimiBaslat(nuriOyun, 'nuri_usta');
  assert.equal(nuriOyun.aktifKomsuOlayi?.id, 'nuri_3_emanet');
  nuriOyun = komsuSecenegiUygula(nuriOyun, 'nuri_emanet_al', () => 0.99);
  assert.equal(nuriOyun.yetenekPuani, 1);

  // 3) Ev Sahibi Kemal Adım 4 için Gün 9 + 1 maç galibiyeti şartı
  const kemalHazirDegil = komsuMusaitOlayiGetir(
    {
      ...oyun,
      gun: 9,
      aktifMekan: 'ev',
      macKazanmaSayisi: 0,
      komsuAdimlari: { ev_sahibi_kemal: 3 },
    },
    'ev_sahibi_kemal',
    'ev'
  );
  assert.equal(kemalHazirDegil, null);

  const kemalHazir = komsuMusaitOlayiGetir(
    {
      ...oyun,
      gun: 9,
      aktifMekan: 'ev',
      macKazanmaSayisi: 1,
      komsuAdimlari: { ev_sahibi_kemal: 3 },
    },
    'ev_sahibi_kemal',
    'ev'
  );
  assert.equal(kemalHazir?.id, 'kemal_4_nam');

  // 4) Yetersiz enerji/para komşu olayını istismar ettirmez
  const yetersizEnerjiOyun: ReturnType<typeof yeniOyunOlustur> = {
    ...yeniOyunOlustur('Gölge'),
    gun: 1,
    enerji: 2,
    aktifMekan: 'sokak_arena',
  };
  const acilanCocuklar = komsuEtkilesimiBaslat(yetersizEnerjiOyun, 'mahalle_cocuklari');
  assert.equal(acilanCocuklar.aktifKomsuOlayi?.id, 'cocuklar_1_izleme');
  const engellenen = komsuSecenegiUygula(acilanCocuklar, 'cocuklar_goster', () => 0.99);
  assert.equal(engellenen.aktifKomsuOlayi?.id, 'cocuklar_1_izleme');
  assert.equal(engellenen.sonBildirim?.tur, 'uyari');
});

test('C3 itibar sistemi: Saygı/Korku gerilimi, ring tavrı ve telafi mekanizması çalışır', () => {
  // İkisini birden yüksek tutmak zordur: Korku yükselirken yüksek Saygı aşınır
  const gerilimli = itibarDengesiUygula(
    { genel: 10, saygi: 22, korku: 4 },
    { korkuDelta: 6 }
  );
  assert.equal(gerilimli.korku, 10);
  assert.equal(gerilimli.saygi, 19); // floor(6 * 0.5) = 3 sürtünme

  const tersGerilim = itibarDengesiUygula(
    { genel: 10, saygi: 4, korku: 22 },
    { saygiDelta: 6 }
  );
  assert.equal(tersGerilim.saygi, 10);
  assert.equal(tersGerilim.korku, 19);

  // Ring tavrı Temiz Dövüş -> Saygı, Sert Gözdağı -> Korku kazandırır
  let temizOyun = ringTavriDegistir(yeniOyunOlustur('Gölge'), 'temiz');
  const temizZafer = dovusSonucunuUygula(temizOyun, RAKIP_LISTESI[0].id, 'oyuncu', () => 0.99);
  assert.ok((temizZafer.ozet.saygiDegisimi ?? 0) >= 2);
  assert.equal(temizZafer.ozet.korkuDegisimi ?? 0, 0);

  let sertOyun = ringTavriDegistir(yeniOyunOlustur('Gölge'), 'sert');
  const sertZafer = dovusSonucunuUygula(sertOyun, RAKIP_LISTESI[0].id, 'oyuncu', () => 0.99);
  assert.ok((sertZafer.ozet.korkuDegisimi ?? 0) >= 2);
  assert.equal(sertZafer.ozet.saygiDegisimi ?? 0, 0);

  // Kaybedilen Saygı aile etkileşimi ve depo vardiyası ile telafi edilebilir
  let dusukSaygi = {
    ...yeniOyunOlustur('Gölge'),
    itibar: { genel: 2, saygi: 0, korku: 14 },
  };
  dusukSaygi = aileyleEtkiles(dusukSaygi, 'anne_emine', () => 0.99);
  assert.equal(dusukSaygi.itibar.saygi, 1);
  assert.equal(dusukSaygi.aileIliskisi, 62);
  dusukSaygi = vardiyaYap(dusukSaygi, 'hal_hamalligi', () => 0.99);
  assert.equal(dusukSaygi.itibar.saygi, 2);
});

test('C3 itibar eşikleri: Saygı (12+/22+) ve Korku (12+/22+) fırsatları açar ve engelleri korur', () => {
  const temel = yeniOyunOlustur('Gölge');
  // Saygı < 12 iken dayanışma ve güvenilir iş kapalı
  const dayanismaEngel = komsuDayanismasiAl(temel, () => 0.99);
  assert.equal(dayanismaEngel.sonBildirim?.tur, 'uyari');
  const guvenilirEngel = vardiyaYap(temel, 'guvenilir_esnaf_teslimat', () => 0.99);
  assert.equal(guvenilirEngel.sonBildirim?.tur, 'uyari');
  const haracEngel = vardiyaYap(temel, 'haracci_tahsilat_isi', () => 0.99);
  assert.equal(haracEngel.sonBildirim?.tur, 'uyari');

  // Saygı 12+: %15 market indirimi ve Evde günlük Mahalle Dayanışması
  const poset = YEMEK_LISTESI.find((y) => y.id === 'market_mutfak_poseti');
  assert.ok(poset);
  const beklenenIndirimli15 = Math.max(1, Math.round(poset.fiyat * 0.85));
  assert.equal(indirimliMarketFiyati(poset.fiyat, 15), beklenenIndirimli15);

  let saygili = {
    ...temel,
    para: 200,
    itibar: { genel: 10, saygi: 12, korku: 0 },
  };
  const saygi12Turetilmis = hesaplaTuretilmisDegerler(saygili);
  assert.equal(saygi12Turetilmis.marketIndirimYuzde, 15);
  assert.equal(saygi12Turetilmis.komsuDayanismasiAcik, true);

  saygili = yemekYe(saygili, 'market_mutfak_poseti', () => 0.99);
  assert.equal(saygili.para, 200 - beklenenIndirimli15);

  const stokOnce = saygili.buzdolabiStok;
  const paraOnce = saygili.para;
  saygili = komsuDayanismasiAl(saygili, () => 0.99);
  assert.equal(saygili.buzdolabiStok, stokOnce + 1);
  assert.equal(saygili.para, paraOnce + 35);

  // Aynı gün 2. kez dayanışma alınamaz
  const tekrar = komsuDayanismasiAl(saygili, () => 0.99);
  assert.equal(tekrar.buzdolabiStok, stokOnce + 1);

  // Saygı 22+: %25 market indirimi ve Güvenilir Esnaf Emanet Teslimatı
  let yuksekSaygi = {
    ...temel,
    itibar: { genel: 20, saygi: 22, korku: 0 },
  };
  assert.equal(hesaplaTuretilmisDegerler(yuksekSaygi).marketIndirimYuzde, 25);
  assert.equal(hesaplaTuretilmisDegerler(yuksekSaygi).guvenilirIsAcik, true);
  yuksekSaygi = vardiyaYap(yuksekSaygi, 'guvenilir_esnaf_teslimat', () => 0.99);
  assert.equal(yuksekSaygi.para, temel.para + 255);
  assert.equal(yuksekSaygi.itibar.saygi, 24);

  // Korku 22+: Kolay ama arbede riskli Çete Tahsilat İşi açılır
  let yuksekKorku = {
    ...temel,
    enerji: 80,
    uyku: 80,
    itibar: { genel: 20, saygi: 20, korku: 22 },
  };
  assert.equal(hesaplaTuretilmisDegerler(yuksekKorku).haracCeteIsiAcik, true);
  assert.equal(hesaplaTuretilmisDegerler(yuksekKorku).rakipCekinmeYuzde, 20);
  // rng = 0.1 < 0.35 -> arbede tetiklenir (-16 normal - 14 arbede = -30 EN)
  yuksekKorku = vardiyaYap(yuksekKorku, 'haracci_tahsilat_isi', () => 0.1);
  assert.equal(yuksekKorku.para, temel.para + 450);
  assert.equal(yuksekKorku.enerji, 50);
  assert.equal(yuksekKorku.sonBildirim?.tur, 'uyari');
  assert.ok(yuksekKorku.itibar.saygi < 20, 'Karanlık iş yüksek Saygıyı da aşındırmalı');
});

test('C3 4 ahlaki gri seçim: kazanım/kayıp takasları, kaynak koruması ve hikaye yansımaları çalışır', () => {
  assert.equal(AHLAKI_GRI_OLAYLAR.length, 4);

  // 1) Yetersiz enerji ve para koruması ahlaki olayı istismar ettirmez
  const haracciOlay = AHLAKI_GRI_OLAYLAR.find((o) => o.id === 'ahlaki_haracci');
  const aileRiskOlay = AHLAKI_GRI_OLAYLAR.find((o) => o.id === 'ahlaki_aile_risk');
  assert.ok(haracciOlay && aileRiskOlay);

  const dusukEnerjili = {
    ...yeniOyunOlustur('Gölge'),
    enerji: 5,
    aktifOlay: haracciOlay,
  };
  const engelli = olaySecenegiUygula(dusukEnerjili, 'haracci_kabul', () => 0.99);
  assert.equal(engelli.aktifOlay?.id, 'ahlaki_haracci');
  assert.equal(engelli.sonBildirim?.tur, 'uyari');

  const parasizAile = {
    ...yeniOyunOlustur('Gölge'),
    para: 50,
    aktifOlay: aileRiskOlay,
  };
  const paraEngelli = olaySecenegiUygula(parasizAile, 'aile_cebinden_ode', () => 0.99);
  assert.equal(paraEngelli.aktifOlay?.id, 'ahlaki_aile_risk');
  assert.equal(paraEngelli.sonBildirim?.tur, 'uyari');

  // 2) Haraççı işini kabul etmenin takasları ve komşu/anne yansımaları
  let oyun: OyunDurumu = {
    ...yeniOyunOlustur('Gölge'),
    gun: 4,
    enerji: 100,
    itibar: { genel: 0, saygi: 8, korku: 0 },
    aktifOlay: haracciOlay,
  };
  oyun = olaySecenegiUygula(oyun, 'haracci_kabul', () => 0.99);
  assert.equal(oyun.aktifOlay, null);
  assert.ok(oyun.ahlakiSecimler.includes('haracci_kabul'));
  assert.equal(oyun.para, yeniOyunOlustur('Gölge').para + 380);
  assert.equal(oyun.itibar.korku, 7);
  assert.equal(oyun.itibar.saygi, 3);
  assert.equal(oyun.aileIliskisi, 54);

  const rizaYorum = komsuItibarYorumuGetir('bakkal_riza', oyun);
  assert.ok(rizaYorum && rizaYorum.includes('Tefecilerin yanında'));

  const emineKonusma = aileyleEtkiles(oyun, 'anne_emine', () => 0.99);
  assert.ok(emineKonusma.sonBildirim?.metin.includes('karanlık adamlardan uzak dur'));

  // 3) Kalan 3 ahlaki olay (komşu/antrenman, aile riski, alaycı genç)
  const komsuOlay = AHLAKI_GRI_OLAYLAR.find((o) => o.id === 'ahlaki_komsu_antrenman');
  const alaysiOlay = AHLAKI_GRI_OLAYLAR.find((o) => o.id === 'ahlaki_alaysi_ders');
  assert.ok(komsuOlay && alaysiOlay);

  let digerYol: OyunDurumu = {
    ...yeniOyunOlustur('Gölge'),
    enerji: 100,
    aktifOlay: komsuOlay,
  };
  digerYol = olaySecenegiUygula(digerYol, 'komsu_yardim_antreman_kacir', () => 0.99);
  assert.ok(digerYol.ahlakiSecimler.includes('komsu_yardim_antreman_kacir'));
  assert.equal(digerYol.itibar.saygi, 6);
  assert.equal(digerYol.aileIliskisi, 64);

  digerYol = { ...digerYol, enerji: 100, aktifOlay: alaysiOlay };
  digerYol = olaySecenegiUygula(digerYol, 'alaysi_sert_ders', () => 0.99);
  assert.ok(digerYol.ahlakiSecimler.includes('alaysi_sert_ders'));
  assert.ok(digerYol.itibar.korku >= 8);

  const elifTepki = aileyleEtkiles(digerYol, 'kardes_elif', () => 0.99);
  assert.ok(elifTepki.sonBildirim?.metin.includes('korktuklarını söylüyor'));

  const yusufYorum = komsuItibarYorumuGetir('mahalle_cocuklari', digerYol);
  assert.ok(yusufYorum && yusufYorum.includes('kahvedekiler'));

  // Aile bağını düşürüp iki karanlık seçim yapınca ev havası gerginleşir
  const gerginEv = aileRuhHaliGetir({
    ...oyun,
    ahlakiSecimler: ['haracci_kabul', 'alaysi_sert_ders'],
    aileIliskisi: 44,
  });
  assert.equal(gerginEv.ton, 'gergin');
});

test('seviye bazlı rakip çekinmesi, debuff rozetleri, etki rozetleri ve isim kuralı', () => {
  // 1) Rakip seviyesine göre Korku eşikleri zorlaşır
  const cetin = RAKIP_LISTESI[0]; // Çaylak: 12 / 22
  const emir = RAKIP_LISTESI[1]; // Orta: 20 / 32
  const serkan = RAKIP_LISTESI[2]; // Zorlu: 30 / 45
  const halil = RAKIP_LISTESI[3]; // Usta: 45 / 65

  assert.equal(rakipCekinmeHesapla(24, cetin).yuzde, 20);
  assert.equal(rakipCekinmeHesapla(24, emir).yuzde, 10);
  assert.equal(rakipCekinmeHesapla(24, serkan).yuzde, 0);
  assert.equal(rakipCekinmeHesapla(24, serkan).sonrakiEsik, 30);
  assert.equal(rakipCekinmeHesapla(24, halil).yuzde, 0);
  assert.equal(rakipCekinmeHesapla(24, halil).sonrakiEsik, 45);
  assert.equal(rakipCekinmeHesapla(48, halil).yuzde, 6);
  assert.equal(rakipCekinmeHesapla(70, halil).yuzde, 12);

  // 2) Aktif debuff özeti tüm cezaları kısa ve net döndürür
  const temiz = yeniOyunOlustur('Gölge');
  assert.equal(aktifDebufflariGetir(temiz).length, 0);

  const cezali = {
    ...temiz,
    uyuyakalmaCezasi: true,
    tokluk: 18,
    uyku: 20,
    moral: 25,
    kiraUyariSayisi: 1,
  };
  const debuffIds = aktifDebufflariGetir(cezali).map((d) => d.id);
  assert.deepEqual(debuffIds, ['uyuyakalma', 'aclik', 'uyku', 'moral', 'kira_uyari']);

  // 3) Olay rozetleri pozitif/negatif değerleri doğru sınıflar
  const rozetler = olayEtkisiRozetleri({
    para: 380,
    saygi: -5,
    korku: 7,
    sureDakika: 60,
  });
  assert.deepEqual(
    rozetler.map((r) => [r.metin, r.tur]),
    [
      ['+380 ₺', 'arti'],
      ['-5 Saygı', 'eksi'],
      ['+7 Korku', 'uyari'],
      ['60 dk', 'notr'],
    ]
  );

  // 4) Yasaklı isim hiçbir oyun verisinde yer almaz
  const veriMetni = JSON.stringify({
    EV_OLAYLARI,
    KOMSU_OLAYLARI,
    AHLAKI_GRI_OLAYLAR,
    ANTRENOR_LISTESI,
    ANTRENOR_DERSLERI,
    RAKIP_LISTESI,
  }).toLocaleLowerCase('tr-TR');
  const yasakliIsim = 'berk' + 'ay';
  assert.equal(veriMetni.includes(yasakliIsim), false);
});

test('D3-Adım-2 kayıt sürümleme (v2 -> v3 migration), eksik alan tamamlama ve güvenli yükleme', () => {
  assert.equal(KAYIT_ANAHTARI, 'karanlik_sokak_kayit_v3');
  assert.equal(ESKI_KAYIT_ANAHTARI_V2, 'karanlik_sokak_kayit_v2');
  assert.equal(KAYIT_SURUMU, 3);

  const yeni = yeniOyunOlustur('Gölge');
  assert.equal(yeni.surum, 3);
  assert.equal(yeni.versiyon, 3);
  assert.equal(yeni.toplamDovusSayisi, 0);
  assert.deepEqual(yeni.mekanZiyaretSayilari, {});
  assert.equal(yeni.aktifDovusRakipId, null);

  // v2 anahtarındaki eski bir kayıt (surum ve v3 alanları yok) otomatik v3'e geçirilmeli
  const eskiWindow = (globalThis as { window?: unknown }).window;
  const v2Ham = {
    ...yeni,
    versiyon: 2,
    gun: 4,
    para: 640,
  } as Record<string, unknown>;
  delete v2Ham.surum;
  delete v2Ham.toplamDovusSayisi;
  delete v2Ham.mekanZiyaretSayilari;
  delete v2Ham.aktifDovusRakipId;

  const depo = new Map<string, string>([
    [ESKI_KAYIT_ANAHTARI_V2, JSON.stringify(v2Ham)],
  ]);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k: string) => depo.get(k) ?? null,
        setItem: (k: string, v: string) => {
          depo.set(k, v);
        },
        removeItem: (k: string) => {
          depo.delete(k);
        },
      },
    },
  });

  try {
    const yuklenen = durumuYukle();
    assert.ok(yuklenen);
    assert.equal(yuklenen.surum, 3);
    assert.equal(yuklenen.versiyon, 3);
    assert.equal(yuklenen.gun, 4);
    assert.equal(yuklenen.para, 640);
    // 2 örnek migration doğrulaması
    assert.equal(yuklenen.toplamDovusSayisi, 0);
    assert.deepEqual(yuklenen.mekanZiyaretSayilari, {});
    assert.equal(yuklenen.aktifDovusRakipId, null);

    // v3 anahtarına otomatik yazılmış olmalı
    const yazilanV3 = depo.get(KAYIT_ANAHTARI);
    assert.ok(yazilanV3);
    assert.equal((JSON.parse(yazilanV3) as { surum: number }).surum, 3);

    // kaydiSil hem v3 hem v2 anahtarını temizlemeli
    kaydiSil();
    assert.equal(depo.has(KAYIT_ANAHTARI), false);
    assert.equal(depo.has(ESKI_KAYIT_ANAHTARI_V2), false);

    // Dövüş başında aktifDovusRakipId kaydedilip dövüş sonunda temizlenmeli
    const dovusBasi: OyunDurumu = { ...yeni, aktifDovusRakipId: RAKIP_LISTESI[0].id };
    durumuKaydet(dovusBasi);
    const yuklenenDovusBasi = durumuYukle();
    assert.equal(yuklenenDovusBasi?.aktifDovusRakipId, RAKIP_LISTESI[0].id);

    const { yeniDurum } = dovusSonucunuUygula(dovusBasi, RAKIP_LISTESI[0].id, 'oyuncu', () => 0.99);
    assert.equal(yeniDurum.aktifDovusRakipId, null);
    assert.equal(yeniDurum.toplamDovusSayisi, 1);

    // Geçersiz veya bozuk kayıtlar güvenli null dönmeli / NaN alanları düzeltmeli
    assert.equal(kaydiMigrateEt({ surum: 99, oyuncu: { lakap: 'X' } }), null);
    assert.equal(kaydiMigrateEt(null), null);
    const bozukPara = kaydiMigrateEt({ ...v2Ham, para: Number.NaN });
    assert.ok(bozukPara);
    assert.equal(Number.isFinite(bozukPara.para), true);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: eskiWindow,
    });
  }
});

test('D3-Adım-4 sağlamlaştırma: bozuk aktifOlay/komşu kaydı ayıklama, zero-resource olay çıkışı ve kiraDongu=0 koruması', () => {
  const temel = yeniOyunOlustur('Gölge');

  // 1) Bozuk aktifOlay, aktifKomsuOlayi, sonBildirim, komsuAdimlari ve string dizileri migration sırasında ayıklanmalı
  const bozukKayit = kaydiMigrateEt({
    ...temel,
    aktifOlay: { yanlis: true },
    aktifKomsuOlayi: { id: 'x' },
    sonBildirim: { metin: 123 },
    komsuAdimlari: { riza: -3, nuri: Number.NaN, gecerli: 2.7 },
    evEsyalari: ['yatak_ortopedik', 42, '', null],
    gecmis: [{ gun: 1, metin: 'Tamam', tur: 'bilgi' }, { bozuk: true }],
  });
  assert.ok(bozukKayit);
  assert.equal(bozukKayit.aktifOlay, null);
  assert.equal(bozukKayit.aktifKomsuOlayi, null);
  assert.equal(bozukKayit.sonBildirim, null);
  assert.deepEqual(bozukKayit.komsuAdimlari, { gecerli: 2 });
  assert.deepEqual(bozukKayit.evEsyalari, ['yatak_ortopedik']);
  assert.equal(bozukKayit.gecmis.length, 1);

  // 2) Tüm ev olayları (EV_OLAYLARI + AHLAKI_GRI_OLAYLAR) 0 TL ve 0 EN ile en az bir oynanabilir seçenek sunmalı
  for (const olay of [...EV_OLAYLARI, ...AHLAKI_GRI_OLAYLAR]) {
    const oynanabilirSecenek = olay.secenekler.find((s) => {
      const p = s.minParaGerekli ?? (s.etkiler.para && s.etkiler.para < 0 ? Math.abs(s.etkiler.para) : 0);
      const e = s.minEnerjiGerekli ?? (s.etkiler.enerji && s.etkiler.enerji < 0 ? Math.abs(s.etkiler.enerji) : 0);
      return p === 0 && e === 0;
    });
    assert.ok(
      oynanabilirSecenek,
      `${olay.id} olayı 0 TL / 0 EN durumunda kilitlenmemeli`
    );
  }

  // 3) komsuOlayiniKapat hikayeyi ilerletmeden pencereyi kapatmalı
  const markette = mekanaGit({ ...temel, gun: 3 }, 'market');
  const komsuAcik = komsuEtkilesimiBaslat(markette, 'bakkal_riza');
  assert.ok(komsuAcik.aktifKomsuOlayi);
  const komsuKapali = komsuOlayiniKapat(komsuAcik);
  assert.equal(komsuKapali.aktifKomsuOlayi, null);
  assert.equal(komsuKapali.komsuAdimlari['bakkal_riza'] ?? 0, 0);

  // 4) kiraDonguGun = 0 ayarlansa bile NaN üretilmemeli
  try {
    dengeGuncelle('zaman.kiraDonguGun', 0);
    const turetilmis = hesaplaTuretilmisDegerler(temel);
    assert.equal(Number.isFinite(turetilmis.kirayaKalanGun), true);
    const uykuSonrasi = evdeUyuVeGunuBitir(temel, () => 0.99);
    assert.equal(Number.isFinite(uykuSonrasi.para), true);
  } finally {
    dengeSifirla();
  }
});

test('D3-Adım-5 ev seviyesi 0 iken üst üste kira ödenemezse kapı kilitlenir ve borç ödenince açılır', () => {
  dengeSifirla();
  const baslangic = {
    ...yeniOyunOlustur('Gölge', () => 0.99),
    evSeviyesi: 0,
    evEsyalari: ['kum_torbasi'],
    gun: 7,
    para: 100,
    moral: 70,
  };

  // İlk kira kaçırma: uyarı alır, henüz kilitlenmez
  const ilkUyari = evdeUyuVeGunuBitir(baslangic, () => 0.99);
  assert.equal(ilkUyari.kiraUyariSayisi, 1);
  assert.equal(ilkUyari.sokaktaKaliyor, false);

  // İkinci üst üste kira kaçırma: ev seviyesi 0 olduğu için kapı kilitlenir, enerji toparlanması düşer
  const kilitli = evdeUyuVeGunuBitir(
    { ...ilkUyari, aktifOlay: null, gun: 14, para: 100 },
    () => 0.99
  );
  assert.equal(kilitli.sokaktaKaliyor, true);
  assert.equal(kilitli.kiraUyariSayisi, 2);
  assert.equal(
    kilitli.enerji,
    VARSAYILAN_DENGE.ekonomiVeYasam.sokaktaEnerjiToparlanma
  );
  assert.equal(hesaplaTuretilmisDegerler(kilitli).evdeAntrenmanAcik, false);
  assert.ok(
    aktifDebufflariGetir(kilitli).some((d) => d.id === 'sokakta_kalma'),
    'Sokakta kalma debuff rozeti görünmeli'
  );

  // Para biriktirip kiraBorcuOde çağrılınca kilit açılır ve eve dönülür
  const odeme = kiraBorcuOde({
    ...kilitli,
    aktifOlay: null,
    para: EV_SEVIYELERI[0].haftalikKira + 50,
  });
  assert.equal(odeme.sokaktaKaliyor, false);
  assert.equal(odeme.kiraUyariSayisi, 0);
  assert.equal(odeme.para, 50);
  assert.equal(hesaplaTuretilmisDegerler(odeme).evdeAntrenmanAcik, true);
});

test('D3-Adım-5 100 simülasyonluk headless referans strateji denge testi', () => {
  dengeSifirla();
  const gercekDovusCoz = (
    state: OyunDurumu,
    rakip: (typeof RAKIP_LISTESI)[number],
    rng: () => number
  ) => {
    let dovus = dovusBaslat(state, rakip);
    let adim = 0;
    let tepkiVerildi = false;
    while (dovus.durum !== 'bitti' && adim < 1800) {
      if (!dovus.rakip.hazirlananHamleId) tepkiVerildi = false;
      if (
        dovus.rakip.hazirlananHamleId &&
        !tepkiVerildi &&
        dovus.rakip.otomatikSayacMs <= 450
      ) {
        tepkiVerildi = true;
        if (rng() < 0.3) {
          if (
            (dovus.oyuncu.beklemeSureleri['geri_cekil'] ?? 0) <= 0 &&
            dovus.oyuncu.stamina >= 8 &&
            rng() < 0.45
          ) {
            dovus = oyuncuHamleSec(dovus, 'geri_cekil');
          } else if ((dovus.oyuncu.beklemeSureleri['blok'] ?? 0) <= 0) {
            dovus = oyuncuHamleSec(dovus, 'blok');
          }
        }
      }
      dovus = dovusAdimi(dovus, 100, rng);
      adim += 1;
    }
    return dovus.kazanan ?? 'berabere';
  };

  const rapor = referansStratejiSimuleEt(100, 10, gercekDovusCoz);

  assert.equal(rapor.simulasyonSayisi, 100);
  assert.equal(rapor.gunSayisi, 10);
  assert.ok(
    rapor.kiraOdeyenOrani >= 0.55 && rapor.kiraOdeyenOrani <= 0.9,
    `10. günde kira ödeme oranı dengeli olmalı (hedef %55-%90, gerçekleşen: ${(rapor.kiraOdeyenOrani * 100).toFixed(1)}%)`
  );
  assert.ok(
    rapor.kazanmaOrani >= 0.65 && rapor.kazanmaOrani <= 1.0,
    `Kazanma oranı makul olmalı (gerçekleşen: ${(rapor.kazanmaOrani * 100).toFixed(1)}%)`
  );
  assert.ok(
    rapor.ortalamaMacSayisi >= 7,
    `Referans stratejide günde ~1 dövüş çıkmalı (ort: ${rapor.ortalamaMacSayisi})`
  );
  assert.ok(
    rapor.ortalamaStatToplam >= 24,
    `10 günde statlar gelişmeli (ort: ${rapor.ortalamaStatToplam})`
  );
  assert.ok(
    Number.isFinite(rapor.ortalamaFinalPara) && rapor.ortalamaFinalPara >= 0,
    'Final para sonlu ve negatif olmamalı'
  );
  assert.ok(rapor.ortalamaMoral >= 50, `Moral sağlıklı kalmalı (ort: ${rapor.ortalamaMoral})`);
});

test('debugStatlariAyarla stat sınırlarını korur, hamleleri açar, HP/stamina ve yetenek puanını günceller', () => {
  const baslangic = yeniOyunOlustur('Gölge');
  const onceTuretilmis = hesaplaTuretilmisDegerler(baslangic);

  // Güç ve Dayanıklılığı 7'ye çıkar, sınır dışı değerleri (0 -> 1, 99 -> 50) test et
  const yukseltilmis = debugStatlariAyarla(baslangic, {
    guc: 7,
    dayaniklilik: 7,
    ceviklik: 0,
    refleks: 99,
  });

  assert.equal(yukseltilmis.statlar.guc.deger, 7);
  assert.equal(yukseltilmis.statlar.dayaniklilik.deger, 7);
  assert.equal(yukseltilmis.statlar.ceviklik.deger, 1);
  assert.equal(yukseltilmis.statlar.refleks.deger, 50);

  // Güç 6 (1 YP), Dayanıklılık 6 (1 YP), Refleks 6/8/10/12 (4 YP) = +6 YP
  assert.equal(yukseltilmis.yetenekPuani, 6);
  assert.ok(yukseltilmis.kazanilanStatEsikleri.includes('guc:6'));
  assert.ok(yukseltilmis.kazanilanStatEsikleri.includes('dayaniklilik:6'));

  // Türetilmiş değerler ve hamleler otomatik güncellenmeli
  const sonraTuretilmis = hesaplaTuretilmisDegerler(yukseltilmis);
  assert.ok(sonraTuretilmis.maksCan > onceTuretilmis.maksCan);
  assert.ok(sonraTuretilmis.maksStamina > onceTuretilmis.maksStamina);
  assert.ok(sonraTuretilmis.acikHamleIds.includes('sert_yumruk'));

  // Aynı statları tekrar uygulamak çift YP vermemeli
  const tekrar = debugStatlariAyarla(yukseltilmis, { guc: 7, dayaniklilik: 7 });
  assert.equal(tekrar.yetenekPuani, 6);
});




