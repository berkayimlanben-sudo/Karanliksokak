import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dengeAlanlariniListele,
  dengeGuncelle,
  dengeSifirla,
  VARSAYILAN_DENGE,
} from './balance';
import {
  EV_SEVIYELERI,
  HAMLE_LISTESI,
  RAKIP_LISTESI,
  YEMEK_LISTESI,
} from '../data/gameData';
import { dovusSonucunuUygula, evdeUyuVeGunuBitir, yeniOyunOlustur } from './engine';
import {
  getTelemetriLoglari,
  telemetriDovusSonucuLogla,
  telemetriDurumFarkiniLogla,
  telemetriLoglariniTemizle,
} from './telemetry';
import { debugSesPaneliAktifMi } from '../components/AudioDebugPanel';

test('Denge config alanlari eksiksiz ve gecerli sayisal degerler icerir', () => {
  dengeSifirla();
  const alanlar = dengeAlanlariniListele();
  assert.ok(alanlar.length >= 100, 'Merkezi denge listesi tum oyun sabitlerini icermeli');

  const isaretliNegatifIzinli = new Set([
    'evler.rutubetli_bodrum.moralEtkisi',
    'isYerleri.hal_hamalligi.moralEtkisi',
    'isYerleri.haracci_tahsilat_isi.moralEtkisi',
    'isYerleri.haracci_tahsilat_isi.saygiEtkisi',
    'dovus.berabereMoral',
    'dovus.kaybetmeMoral',
  ]);

  for (const alan of alanlar) {
    assert.equal(typeof alan.deger, 'number', `${alan.yol} sayi olmali`);
    assert.ok(Number.isFinite(alan.deger), `${alan.yol} sonlu olmali`);
    if (!isaretliNegatifIzinli.has(alan.yol)) {
      assert.ok(alan.deger >= 0, `${alan.yol} negatif olmamali (deger=${alan.deger})`);
    }
  }
});

test('Canli denge guncellemesi gameData listelerini aninda etkiler ve sifirlanir', () => {
  dengeSifirla();
  const orijinalKira = VARSAYILAN_DENGE.evler.rutubetli_bodrum.haftalikKira;
  const orijinalHasar = VARSAYILAN_DENGE.dovus.hamleler.duz_yumruk.temelHasar;
  const orijinalSimitFiyat = VARSAYILAN_DENGE.yemekler.market_simit.fiyat;
  const orijinalRakipGuc = VARSAYILAN_DENGE.dovus.rakipler.sisko_cetin.statlar.guc;

  try {
    assert.equal(dengeGuncelle('evler.rutubetli_bodrum.haftalikKira', 1111), true);
    assert.equal(EV_SEVIYELERI[0].haftalikKira, 1111);

    assert.equal(dengeGuncelle('dovus.hamleler.duz_yumruk.temelHasar', 25), true);
    assert.equal(HAMLE_LISTESI.find((h) => h.id === 'duz_yumruk')?.temelHasar, 25);

    assert.equal(dengeGuncelle('yemekler.market_simit.fiyat', 44), true);
    assert.equal(YEMEK_LISTESI.find((y) => y.id === 'market_simit')?.fiyat, 44);

    assert.equal(dengeGuncelle('dovus.rakipler.sisko_cetin.statlar.guc', 9), true);
    assert.equal(RAKIP_LISTESI[0].statlar.guc, 9);

    assert.equal(dengeGuncelle('olmayan.yol.deger', 10), false);
    assert.equal(dengeGuncelle('evler.rutubetli_bodrum.haftalikKira', Number.NaN), false);
  } finally {
    dengeSifirla();
  }

  assert.equal(EV_SEVIYELERI[0].haftalikKira, orijinalKira);
  assert.equal(HAMLE_LISTESI.find((h) => h.id === 'duz_yumruk')?.temelHasar, orijinalHasar);
  assert.equal(YEMEK_LISTESI.find((y) => y.id === 'market_simit')?.fiyat, orijinalSimitFiyat);
  assert.equal(RAKIP_LISTESI[0].statlar.guc, orijinalRakipGuc);
});

test('Telemetri gun sonu, kira durumu, para degisimi ve dovus sonucunu yapilandirilmis formatta loglar', () => {
  telemetriLoglariniTemizle();
  dengeSifirla();

  const yedinciGun = {
    ...yeniOyunOlustur('Test', () => 0.99),
    gun: 7,
    para: 1000,
  };
  const sekizinciGun = evdeUyuVeGunuBitir(yedinciGun, () => 0.99);

  telemetriDurumFarkiniLogla(yedinciGun, sekizinciGun, 'test_kira');
  const loglar = getTelemetriLoglari();

  const gunSonu = loglar.find((l) => l.olay === 'gun_sonu');
  const kiraDurumu = loglar.find((l) => l.olay === 'kira_durumu');
  const paraDegisimi = loglar.find((l) => l.olay === 'para_degisimi');

  assert.ok(gunSonu, 'gun_sonu logu dusmeli');
  assert.ok(gunSonu.satir.includes('[gun=7]'));
  assert.ok(gunSonu.satir.includes('[kira=odendi]'));
  assert.ok(kiraDurumu, 'kira_durumu logu dusmeli');
  assert.ok(paraDegisimi, 'para_degisimi logu dusmeli');
  assert.ok(paraDegisimi.satir.includes('[degisim=-900]'));

  const macSonrasi = dovusSonucunuUygula(sekizinciGun, 'sisko_cetin', 'oyuncu', () => 0.99);
  telemetriDovusSonucuLogla(macSonrasi.yeniDurum, 'sisko_cetin', macSonrasi.ozet);

  const guncelLoglar = getTelemetriLoglari();
  const dovusLog = guncelLoglar.find((l) => l.olay === 'dovus_sonucu');
  assert.ok(dovusLog, 'dovus_sonucu logu dusmeli');
  assert.ok(dovusLog.satir.includes('[kazanan=oyuncu]'));

  telemetriLoglariniTemizle();
});

test('Debug paneli prod ortaminda ?debug=1 ile bile acilmaz, sadece DEV ortaminda acilir', () => {
  assert.equal(debugSesPaneliAktifMi(false, ''), false);
  assert.equal(debugSesPaneliAktifMi(false, '?debug=1'), false);
  assert.equal(debugSesPaneliAktifMi(true, ''), true);
  assert.equal(debugSesPaneliAktifMi(true, '?debug=1'), true);
});
