import test from 'node:test';
import assert from 'node:assert/strict';
import { RAKIP_LISTESI } from '../data/gameData';
import { yeniOyunOlustur } from './engine';
import {
  dovusAdimi,
  dovusBaslat,
  oyuncuHamleSec,
  rakipHamleSec,
} from './combat';
import { sesAcikMi, sesCal, sesTercihiDegistir, titresimTetikle } from './sound';

test('gerçek zamanlı dövüş otomatik akar ve statlara göre hasar verir', () => {
  const oyun = yeniOyunOlustur('Gölge');
  const rakip = RAKIP_LISTESI[0];
  let dovus = dovusBaslat(oyun, rakip);

  const baslangicRakipCan = dovus.rakip.can;
  const baslangicOyuncuCan = dovus.oyuncu.can;

  for (let i = 0; i < 90; i += 1) {
    dovus = dovusAdimi(dovus, 50, () => 0.15);
  }

  assert.ok(
    dovus.rakip.can < baslangicRakipCan || dovus.oyuncu.can < baslangicOyuncuCan,
    'Otomatik akışta taraflardan en az biri darbe almış olmalı'
  );
  assert.ok(dovus.gecenSureMs > 0);
});

test('oyuncu hamle seçimi saldırıyı öne alır, soğuma başlatır ve blok/kaçınma anında çalışır', () => {
  const oyun = yeniOyunOlustur('Gölge');
  let dovus = dovusBaslat(oyun, RAKIP_LISTESI[0]);

  // Alçak tekme sıraya alınınca otomatik vuruş sayacı hızlanmalı
  dovus = oyuncuHamleSec(dovus, 'alcak_tekme');
  assert.equal(dovus.oyuncu.siraHamleId, 'alcak_tekme');
  assert.ok(dovus.oyuncu.otomatikSayacMs <= 120);

  // 3 adım ilerlet -> vuruş gerçekleşmeli ve soğuma süresi başlamalı
  for (let i = 0; i < 4; i += 1) {
    dovus = dovusAdimi(dovus, 50, () => 0.05);
  }
  assert.ok((dovus.oyuncu.beklemeSureleri['alcak_tekme'] ?? 0) > 0);

  // Blok anında açılır ve hasarı azaltır
  dovus = oyuncuHamleSec(dovus, 'blok');
  assert.ok(dovus.oyuncu.blokKalanMs > 0);

  // Kaçınma aktifken rakibin saldırısı boşa çıkarsa KARŞI SALDIRI penceresi açılır
  let kacinmaDovusu = dovusBaslat(oyun, RAKIP_LISTESI[0]);
  kacinmaDovusu = oyuncuHamleSec(kacinmaDovusu, 'geri_cekil');
  assert.ok(kacinmaDovusu.oyuncu.kacinmaKalanMs > 0);
  kacinmaDovusu = {
    ...kacinmaDovusu,
    oyuncu: { ...kacinmaDovusu.oyuncu, otomatikSayacMs: 800 },
    rakip: { ...kacinmaDovusu.rakip, otomatikSayacMs: 10, aksiyon: 'idle' },
  };
  kacinmaDovusu = dovusAdimi(kacinmaDovusu, 40, () => 0.25);
  assert.ok(
    kacinmaDovusu.oyuncu.karsiSaldiriKalanMs > 0,
    'Başarılı kaçınma karşı saldırı penceresi açmalı'
  );
});

test('stamina düşünce dövüşçü yavaşlar ve KO anında önce ko_yavaslatma sonra bitti fazına geçer', () => {
  let oyun = yeniOyunOlustur('Gölge');
  oyun = {
    ...oyun,
    statlar: {
      ...oyun.statlar,
      guc: { deger: 10, ilerleme: 0 },
      ceviklik: { deger: 9, ilerleme: 0 },
    },
  };
  let dovus = dovusBaslat(oyun, RAKIP_LISTESI[0]);

  // Düşük stamina yavaşlama bayrağını tetikler
  dovus = {
    ...dovus,
    oyuncu: { ...dovus.oyuncu, stamina: 4 },
  };
  dovus = dovusAdimi(dovus, 50, () => 0.5);
  assert.equal(dovus.oyuncu.yavasladiMi, true);

  // Rakibin canını kritik düşür ve KO yavaşlatmasını doğrula (hitstop KO'yu geciktirmez)
  dovus = {
    ...dovus,
    oyuncu: { ...dovus.oyuncu, stamina: dovus.oyuncu.maksStamina, otomatikSayacMs: 10 },
    rakip: { ...dovus.rakip, can: 4, kacinmaKalanMs: 0, blokKalanMs: 0 },
  };
  dovus = dovusAdimi(dovus, 40, () => 0.05);
  assert.equal(dovus.durum, 'ko_yavaslatma');
  assert.equal(dovus.kazanan, 'oyuncu');
  assert.equal(dovus.hitstopKalanMs, 0);

  // Yavaşlatma süresi akınca 'bitti' durumuna geçer
  for (let i = 0; i < 20; i += 1) {
    dovus = dovusAdimi(dovus, 100, () => 0.5);
  }
  assert.equal(dovus.durum, 'bitti');
});

test('üç rakip yapay zeka tarzı (saldırgan, çevik, savunmacı) farklı hamle seçimleri üretir', () => {
  const oyun = yeniOyunOlustur('Gölge');
  const dSaldirgan = dovusBaslat(oyun, RAKIP_LISTESI[0]); // saldirgan
  const dCevik = dovusBaslat(oyun, RAKIP_LISTESI[1]); // cevik
  const dSavunmaci = dovusBaslat(oyun, RAKIP_LISTESI[2]); // savunmaci

  const sSecim = rakipHamleSec(dSaldirgan.rakip, dSaldirgan.oyuncu, () => 0.5);
  const cSecim = rakipHamleSec(
    dCevik.rakip,
    { ...dCevik.oyuncu, otomatikSayacMs: 100 },
    () => 0.1
  );
  const savSecim = rakipHamleSec(
    { ...dSavunmaci.rakip, stamina: 10 },
    dSavunmaci.oyuncu,
    () => 0.2
  );

  assert.equal(sSecim.tur !== 'kacinma', true);
  assert.equal(cSecim.tur, 'kacinma');
  assert.equal(savSecim.id, 'blok');
});

test('rakip telgrafı 550ms penceresinde kilitlenir ve mükemmel blok/kaçınma ile hitstop çalışır', () => {
  const oyun = yeniOyunOlustur('Gölge');
  let dovus = dovusBaslat(oyun, RAKIP_LISTESI[3]);

  // Rakibin otomatik sayacı 500ms kaldığında hamlesini kilitlemeli
  dovus = {
    ...dovus,
    oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 1200 },
    rakip: { ...dovus.rakip, otomatikSayacMs: 500, aksiyon: 'idle' },
  };
  dovus = dovusAdimi(dovus, 50, () => 0.1); // sert_yumruk seçer
  assert.equal(dovus.rakip.hazirlananHamleId, 'sert_yumruk');

  // Mükemmel Blok: %85 hasar kesintisi, ekstra stamina, MÜKEMMEL BLOK! ve hitstop
  let blokDovusu = oyuncuHamleSec(
    { ...dovus, oyuncu: { ...dovus.oyuncu, stamina: 20 } },
    'blok'
  );
  assert.ok((blokDovusu.oyuncu.mukemmelSavunmaKalanMs ?? 0) > 0);
  const staminaBlokOncesi = blokDovusu.oyuncu.stamina;
  const canBlokOncesi = blokDovusu.oyuncu.can;
  blokDovusu = {
    ...blokDovusu,
    rakip: { ...blokDovusu.rakip, otomatikSayacMs: 20 },
  };
  blokDovusu = dovusAdimi(blokDovusu, 50, () => 0.05);
  assert.equal(blokDovusu.rakip.hazirlananHamleId, null);
  assert.ok(blokDovusu.hitstopKalanMs >= 75 && blokDovusu.hitstopKalanMs <= 100);
  assert.ok(
    blokDovusu.yuzenSayilar.some((s) => s.metin.includes('MÜKEMMEL BLOK!')),
    'Mükemmel blok yüzen metni çıkmalı'
  );
  assert.ok(
    blokDovusu.oyuncu.stamina > staminaBlokOncesi,
    'Mükemmel blok fazladan stamina kazandırmalı'
  );
  assert.ok(canBlokOncesi - blokDovusu.oyuncu.can <= 6, 'Mükemmel blok hasarı ~%85 azaltmalı');

  // Hitstop sırasında dövüş sayacı (gecenSureMs) kısa süre donar
  const donmaOncesiSure = blokDovusu.gecenSureMs;
  blokDovusu = dovusAdimi(blokDovusu, 40, () => 0.5);
  assert.equal(blokDovusu.gecenSureMs, donmaOncesiSure);

  // Mükemmel Kaçınma: %100 sıyrılma + 1.65x (+%65) karşı saldırı penceresi
  let kacinmaDovusu = oyuncuHamleSec(dovus, 'geri_cekil');
  kacinmaDovusu = {
    ...kacinmaDovusu,
    rakip: { ...kacinmaDovusu.rakip, otomatikSayacMs: 20 },
  };
  kacinmaDovusu = dovusAdimi(kacinmaDovusu, 50, () => 0.99); // rng=0.99 bile olsa %100 kaçınmalı
  assert.ok(kacinmaDovusu.oyuncu.karsiSaldiriKalanMs > 2000);
  assert.equal(kacinmaDovusu.oyuncu.karsiSaldiriCarpan, 1.65);
  assert.ok(kacinmaDovusu.hitstopKalanMs >= 75);
  assert.ok(
    kacinmaDovusu.yuzenSayilar.some((s) => s.metin.includes('MÜKEMMEL KAÇINMA!'))
  );
});

test('3.5 sn penceresinde 2x ve 3x kombo zinciri bonus hasar ve yüzen yazı üretir', () => {
  let oyun = yeniOyunOlustur('Gölge');
  oyun = {
    ...oyun,
    statlar: {
      ...oyun.statlar,
      guc: { deger: 7, ilerleme: 0 },
      ceviklik: { deger: 6, ilerleme: 0 },
    },
  };
  let dovus = dovusBaslat(oyun, RAKIP_LISTESI[0]);
  dovus = {
    ...dovus,
    rakip: { ...dovus.rakip, can: 400, maksCan: 400, otomatikSayacMs: 4000 },
  };

  // 1. Hamle: Düz Yumruk (açılım)
  dovus = oyuncuHamleSec(dovus, 'duz_yumruk');
  dovus = { ...dovus, oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 10 } };
  dovus = dovusAdimi(dovus, 30, () => 0.05);
  assert.equal(dovus.oyuncu.sonKomboEtiketi, 'acilim');
  assert.equal(dovus.oyuncu.komboZincirSayisi, 1);

  // 2. Hamle: Alçak Tekme (denge_bozucu) -> 2x KOMBO! (+%25)
  dovus = oyuncuHamleSec(dovus, 'alcak_tekme');
  dovus = { ...dovus, oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 10 } };
  dovus = dovusAdimi(dovus, 30, () => 0.05);
  assert.equal(dovus.sonKomboSayisi, 2);
  assert.ok(dovus.yuzenSayilar.some((s) => s.metin === '2x KOMBO!'));
  assert.ok(dovus.hitstopKalanMs >= 80);

  // Hitstop'u temizle
  dovus = { ...dovus, hitstopKalanMs: 0 };

  // 3. Hamle: Sert Yumruk (bitirici) -> 3x KOMBO! (+%35)
  dovus = oyuncuHamleSec(dovus, 'sert_yumruk');
  dovus = { ...dovus, oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 10 } };
  dovus = dovusAdimi(dovus, 30, () => 0.05);
  assert.equal(dovus.sonKomboSayisi, 3);
  assert.ok(dovus.yuzenSayilar.some((s) => s.metin === '3x KOMBO!'));
  assert.equal(dovus.oyuncu.komboZincirSayisi, 0);
});

test('ses modülü tarayıcı dışı Node ortamında hata fırlatmadan çalışır', () => {
  assert.equal(sesAcikMi(), true);
  assert.equal(sesTercihiDegistir(false), false);
  assert.doesNotThrow(() => {
    sesCal('gong');
    sesCal('yumruk');
    sesCal('nakavt');
    titresimTetikle(30);
  });
});

test('C1 yetenek ağacından açılan aktif hamleler ve pasifler dövüşte otomatik uygulanır', () => {
  const temelOyun = yeniOyunOlustur('Gölge');
  const pasifliOyun = {
    ...temelOyun,
    statlar: {
      ...temelOyun.statlar,
      guc: { deger: 6, ilerleme: 0 },
      refleks: { deger: 8, ilerleme: 0 },
      dayaniklilik: { deger: 7, ilerleme: 0 },
    },
    acikYetenekIds: [
      'y_sik_bandaj',
      'y_cene_kancasi',
      's_sogukkanli_goz',
      's_celik_gard',
      'd_derin_nefes',
      'd_beton_cene',
    ],
  };

  const temelDovus = dovusBaslat(temelOyun, RAKIP_LISTESI[0]);
  const pasifliDovus = dovusBaslat(pasifliOyun, RAKIP_LISTESI[0]);

  // Rakip oyuncu yetenek ağacı hamlelerini kullanmamalı
  assert.equal(pasifliDovus.rakip.acikHamleIds.includes('sol_krose'), false);
  assert.equal(pasifliDovus.rakip.acikHamleIds.includes('celik_gard'), false);

  // Oyuncu açtığı hamleleri dövüşte görmeli
  assert.ok(pasifliDovus.oyuncu.acikHamleIds.includes('sol_krose'));
  assert.ok(pasifliDovus.oyuncu.acikHamleIds.includes('celik_gard'));

  // Pasif can ve stamina bonusları
  assert.equal(pasifliDovus.oyuncu.maksCan, 60 + 7 * 8 + 16);
  assert.equal(pasifliDovus.oyuncu.maksStamina, 40 + 7 * 6 + 8);

  // Açılan Sol Kroşe hamlesi seçilip vurunca soğumaya girmeli
  let d = oyuncuHamleSec(pasifliDovus, 'sol_krose');
  assert.equal(d.oyuncu.siraHamleId, 'sol_krose');
  d = { ...d, oyuncu: { ...d.oyuncu, otomatikSayacMs: 10 } };
  d = dovusAdimi(d, 40, () => 0.05);
  assert.ok((d.oyuncu.beklemeSureleri['sol_krose'] ?? 0) > 0);
  assert.ok(d.rakip.can < pasifliDovus.rakip.can);

  // Çelik Gard bloğu ve +24 stamina toparlanması çalışmalı
  let gardDovus = {
    ...pasifliDovus,
    oyuncu: { ...pasifliDovus.oyuncu, stamina: 20 },
  };
  gardDovus = oyuncuHamleSec(gardDovus, 'celik_gard');
  assert.ok(gardDovus.oyuncu.blokKalanMs > 900);
  assert.ok(gardDovus.oyuncu.stamina >= 44);

  // Derin Nefes stamina yenilenme pasifi (+%15) daha hızlı stamina doldurmalı
  const yavas = dovusAdimi(
    { ...temelDovus, oyuncu: { ...temelDovus.oyuncu, stamina: 10, statlar: pasifliDovus.oyuncu.statlar, maksStamina: pasifliDovus.oyuncu.maksStamina } },
    100,
    () => 0.5
  );
  const hizli = dovusAdimi(
    { ...pasifliDovus, oyuncu: { ...pasifliDovus.oyuncu, stamina: 10 } },
    100,
    () => 0.5
  );
  assert.ok(hizli.oyuncu.stamina > yavas.oyuncu.stamina);
});

test('C2 antrenörden öğrenilen hamleler dövüşte açılır, kombo yapar ve rakiplere verilmez', () => {
  const oyun = {
    ...yeniOyunOlustur('Gölge'),
    statlar: {
      guc: { deger: 6, ilerleme: 0 },
      ceviklik: { deger: 6, ilerleme: 0 },
      refleks: { deger: 6, ilerleme: 0 },
      dayaniklilik: { deger: 6, ilerleme: 0 },
    },
    ogrenilenHocaDersIds: ['muslum_vucut_krosesi', 'cigdem_capraz_kontra'],
  };

  let dovus = dovusBaslat(oyun, RAKIP_LISTESI[0]);
  assert.ok(dovus.oyuncu.acikHamleIds.includes('vucut_krosesi'));
  assert.ok(dovus.oyuncu.acikHamleIds.includes('capraz_kontra'));
  assert.equal(dovus.rakip.acikHamleIds.includes('vucut_krosesi'), false);
  assert.equal(dovus.rakip.acikHamleIds.includes('capraz_kontra'), false);

  dovus = {
    ...dovus,
    rakip: { ...dovus.rakip, can: 300, maksCan: 300, otomatikSayacMs: 4000 },
  };

  // Çapraz Kontra (açılım) -> Vücut Kroşesi (denge_bozucu) = 2x KOMBO!
  dovus = oyuncuHamleSec(dovus, 'capraz_kontra');
  dovus = { ...dovus, oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 10 } };
  dovus = dovusAdimi(dovus, 30, () => 0.05);
  assert.ok((dovus.oyuncu.beklemeSureleri['capraz_kontra'] ?? 0) > 0);
  assert.equal(dovus.oyuncu.sonKomboEtiketi, 'acilim');

  dovus = oyuncuHamleSec(dovus, 'vucut_krosesi');
  dovus = { ...dovus, oyuncu: { ...dovus.oyuncu, otomatikSayacMs: 10 } };
  dovus = dovusAdimi(dovus, 30, () => 0.05);
  assert.ok((dovus.oyuncu.beklemeSureleri['vucut_krosesi'] ?? 0) > 0);
  assert.equal(dovus.sonKomboSayisi, 2);
});

test('C3 yüksek Korku itibarında rakipler dövüşe çekinerek ve düşük staminayla başlar', () => {
  const temel = yeniOyunOlustur('Gölge');
  const korkusuzDovus = dovusBaslat(temel, RAKIP_LISTESI[0]);
  assert.equal(korkusuzDovus.rakipCekinmeYuzde, 0);
  assert.equal(korkusuzDovus.rakip.stamina, korkusuzDovus.rakip.maksStamina);
  assert.equal(korkusuzDovus.rakip.otomatikSayacMs, 1100);

  const korku12Oyun = {
    ...temel,
    itibar: { genel: 12, saygi: 2, korku: 14 },
  };
  const korku12Dovus = dovusBaslat(korku12Oyun, RAKIP_LISTESI[0]);
  assert.equal(korku12Dovus.rakipCekinmeYuzde, 12);
  assert.equal(
    korku12Dovus.rakip.stamina,
    Math.round(korku12Dovus.rakip.maksStamina * 0.88)
  );
  assert.equal(korku12Dovus.rakip.otomatikSayacMs, 1450);

  const korku22Oyun = {
    ...temel,
    itibar: { genel: 25, saygi: 0, korku: 24 },
  };
  const korku22Dovus = dovusBaslat(korku22Oyun, RAKIP_LISTESI[0]);
  assert.equal(korku22Dovus.rakipCekinmeYuzde, 20);
  assert.equal(
    korku22Dovus.rakip.stamina,
    Math.round(korku22Dovus.rakip.maksStamina * 0.8)
  );
  assert.equal(korku22Dovus.rakip.otomatikSayacMs, 1750);
  assert.ok(korku22Dovus.sonOlayMetni.includes('çekiniyor'));

  // Zorlu ve Usta rakipler 24 Korku'dan etkilenmez; Usta için 45+ Korku gerekir
  const serkan24Dovus = dovusBaslat(korku22Oyun, RAKIP_LISTESI[2]);
  assert.equal(serkan24Dovus.rakipCekinmeYuzde, 0);
  assert.equal(serkan24Dovus.rakip.stamina, serkan24Dovus.rakip.maksStamina);

  const halil24Dovus = dovusBaslat(korku22Oyun, RAKIP_LISTESI[3]);
  assert.equal(halil24Dovus.rakipCekinmeYuzde, 0);
  assert.equal(halil24Dovus.rakip.stamina, halil24Dovus.rakip.maksStamina);

  const korku48Oyun = {
    ...temel,
    tokluk: 20,
    uyuyakalmaCezasi: true,
    itibar: { genel: 40, saygi: 0, korku: 48 },
  };
  const halil48Dovus = dovusBaslat(korku48Oyun, RAKIP_LISTESI[3]);
  assert.equal(halil48Dovus.rakipCekinmeYuzde, 6);
  assert.equal(
    halil48Dovus.rakip.stamina,
    Math.round(halil48Dovus.rakip.maksStamina * 0.94)
  );
  assert.ok(halil48Dovus.oyuncuHazirlikCezasiMetni?.includes('-%22'));
});




