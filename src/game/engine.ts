/**
 * ============================================================================
 * BÖLÜM 3: SAF OYUN MANTIĞI (DOM VE ARAYÜZDEN TAMAMEN BAĞIMSIZ)
 * A Aşaması: Mekanlar, saat akışı, ihtiyaçlar (enerji/tokluk/uyku/moral),
 * ev eşyaları, haftalık kira, aile etkileşimleri ve anti-ölüm sarmalı kuralları.
 * ============================================================================
 */

import {
  AHLAKI_GRI_OLAYLAR,
  ANTRENOR_DERSLERI,
  ANTRENOR_LISTESI,
  AntrenorDersi,
  DOVUS_SABITLERI,
  EK_IS_TANIMLARI,
  EV_ESYALARI_LISTESI,
  EV_OLAYLARI,
  EV_SEVIYELERI,
  EvOlayi,
  EvSeviyesi,
  HAMLE_LISTESI,
  HamleVerisi,
  ITIBAR_SABITLERI,
  KARAKTER_SABITLERI,
  KOMSU_LISTESI,
  KOMSU_OLAYLARI,
  KomsuHikayeOlayi,
  KomsuOlayKosulu,
  KomsuOlaySecenegi,
  KomsuTanimi,
  MEKAN_TANIMLARI,
  OlayEtkisi,
  OlaySecenegi,
  RAKIP_LISTESI,
  RakipTanimi,
  SAAT_SABITLERI,
  STAT_TANIMLARI,
  STAT_YETENEK_ESIKLERI,
  StatId,
  YEMEK_LISTESI,
  YETENEK_AGACI,
  YetenekDugumu,
} from '../data/gameData';
import { KarakterGorunumu, MekanId, TEMA } from './theme';
import { DENGE } from './balance';

export const KAYIT_SURUMU = 3;
export const ESKI_KAYIT_ANAHTARI_V2 = 'karanlik_sokak_kayit_v2';
export const KAYIT_ANAHTARI = 'karanlik_sokak_kayit_v3';

const MEKAN_HARITASI = new Map(MEKAN_TANIMLARI.map((m) => [m.id, m]));
const STAT_HARITASI = new Map(STAT_TANIMLARI.map((s) => [s.id, s]));
const YEMEK_HARITASI = new Map(YEMEK_LISTESI.map((y) => [y.id, y]));
const ESYA_HARITASI = new Map(EV_ESYALARI_LISTESI.map((e) => [e.id, e]));
const EV_SEVIYE_HARITASI = new Map(EV_SEVIYELERI.map((ev) => [ev.seviye, ev]));
const IS_HARITASI = new Map(EK_IS_TANIMLARI.map((is) => [is.id, is]));
const RAKIP_HARITASI = new Map(RAKIP_LISTESI.map((r) => [r.id, r]));
const YETENEK_HARITASI = new Map(YETENEK_AGACI.map((y) => [y.id, y]));
const HAMLE_HARITASI = new Map(HAMLE_LISTESI.map((h) => [h.id, h]));
const ANTRENOR_HARITASI = new Map(ANTRENOR_LISTESI.map((a) => [a.id, a]));
const HOCA_DERS_HARITASI = new Map(ANTRENOR_DERSLERI.map((d) => [d.id, d]));
const KOMSU_HARITASI = new Map(KOMSU_LISTESI.map((k) => [k.id, k]));

export interface YetenekPasifOzeti {
  ekMaksCan: number;
  ekMaksStamina: number;
  staminaToparlanmaYuzde: number;
  yumrukHasarYuzde: number;
  tekmeHasarYuzde: number;
  isabetBonusu: number;
  blokKesintiYuzde: number;
  kacinmaSansiBonusu: number;
  karsiSaldiriCarpanBonusu: number;
  antrenmanVerimBonusu: number;
  gunlukEnerjiBonusu: number;
}

export interface StatDurumu {
  deger: number;
  ilerleme: number; // 0 - 99 arası, 100 olunca stat +1 artar
}

export interface GunlukKayit {
  gun: number;
  saatMetni?: string;
  metin: string;
  tur: 'bilgi' | 'uyari' | 'basari' | 'olay';
}

export type RingTavri = 'dengeli' | 'temiz' | 'sert';

export interface OyunDurumu {
  surum: number;
  versiyon: number;
  oyuncu: {
    gercekAd: string;
    lakap: string;
    yas: number;
    gorunum: KarakterGorunumu;
  };
  gun: number;
  saatDakika: number; // 480 (08:00) .. 1560 (02:00)
  enerji: number;
  maksEnerji: number;
  tokluk: number; // 0 - 100 (Açlık seviyesi: 100 tok, 0 aç)
  uyku: number; // 0 - 100 (100 dinç, 0 uykusuz)
  yorgunluk: number; // 0 - 100 (100 - uyku ile senkron tutulur)
  moral: number; // 0 - 100
  para: number;
  buzdolabiStok: number; // Evdeki hazır öğün adedi
  salonGirisGunu: number; // Günlük spor salonu girişi ödenen gün
  anneKonusmaGunu: number;
  elifKonusmaGunu: number;
  uyuyakalmaCezasi: boolean; // Gece geç saatte bayılma olursa ertesi gün -%20 verim
  itibar: {
    genel: number;
    saygi: number;
    korku: number;
  };
  aileIliskisi: number; // 0 - 100
  ahlakiSecimler: string[];
  komsuDayanismaGunu: number;
  ringTavri: RingTavri;
  statlar: Record<StatId, StatDurumu>;
  evSeviyesi: number; // EV_SEVIYELERI dizinindeki seviye
  evEsyalari: string[]; // Sahip olunan ev eşyası ID'leri
  kiraUyariSayisi: number;
  sokaktaKaliyor: boolean; // Ev Seviyesi 0'da üst üste kira ödenemezse kapı kilitlenir
  aktifMekan: MekanId;
  aktifOlay: EvOlayi | null;
  sonOlayGunu: number;
  tamamlananTekilOlayIds: string[];
  sonOlayId: string | null;
  macKazanmaSayisi: number;
  toplamDovusSayisi: number;
  aktifDovusRakipId: string | null;
  mekanZiyaretSayilari: Record<string, number>;
  yenilenRakipIds: string[];
  yetenekPuani: number;
  acikYetenekIds: string[];
  kazanilanStatEsikleri: string[];
  ogrenilenHocaDersIds: string[];
  komsuAdimlari: Record<string, number>;
  komsuSecimleri: string[];
  komsuBayraklari: string[];
  aktifKomsuOlayi: KomsuHikayeOlayi | null;
  sonBildirim: GunlukKayit | null;
  gecmis: GunlukKayit[];
}

export interface TuretilmisDegerler {
  maksCan: number;
  maksStamina: number;
  moralCarpani: number;
  yorgunlukCarpani: number;
  toklukCarpani: number;
  cezaCarpani: number;
  antrenmanVerimi: number; // Yüzde olarak (örn. 100)
  mevcutEv: EvSeviyesi;
  sonrakiEv: EvSeviyesi | null;
  kirayaKalanGun: number;
  kiraEksikTutar: number;
  acikHamleIds: string[];
  evdeAntrenmanAcik: boolean;
  gucDayaniklilikBonusYuzde: number;
  geceGecMi: boolean;
  salonGirisOdendiMi: boolean;
  yetenekPuani: number;
  pasifler: YetenekPasifOzeti;
  saygiSeviyesi: 0 | 1 | 2;
  korkuSeviyesi: 0 | 1 | 2;
  marketIndirimYuzde: number;
  komsuDayanismasiAcik: boolean;
  guvenilirIsAcik: boolean;
  haracCeteIsiAcik: boolean;
  rakipCekinmeYuzde: number;
}

function sinirla(deger: number, min: number, maks: number): number {
  return Math.max(min, Math.min(maks, deger));
}

function olayEngeliVarMi(state: OyunDurumu): boolean {
  return Boolean(state.aktifOlay || state.aktifKomsuOlayi);
}

/**
 * Saygı ve Korku arasındaki doğal gerilimi uygular: ikisini birden çok yüksek tutmak zordur
 * ama kaybettikten sonra her iki eksen de telafi edilebilir kalır.
 */
export function itibarDengesiUygula(
  mevcut: OyunDurumu['itibar'],
  degisim: { itibarDelta?: number; saygiDelta?: number; korkuDelta?: number }
): OyunDurumu['itibar'] {
  const itibarDelta = degisim.itibarDelta ?? 0;
  const saygiDelta = degisim.saygiDelta ?? 0;
  const korkuDelta = degisim.korkuDelta ?? 0;

  let yeniSaygi = sinirla(mevcut.saygi + saygiDelta, 0, ITIBAR_SABITLERI.maksItibar);
  let yeniKorku = sinirla(mevcut.korku + korkuDelta, 0, ITIBAR_SABITLERI.maksItibar);

  const v = DENGE.verimVeEsikler;
  // Korku yükselirken yüksek Saygı aşınır (yalnızca Saygı aynı anda artırılmıyorsa)
  if (korkuDelta > 0 && saygiDelta <= 0 && yeniSaygi >= v.itibarSurtunmeBaslangic) {
    const surtunme =
      yeniSaygi >= v.itibarSurtunmeYuksekEsik
        ? Math.max(1, Math.floor(korkuDelta * v.itibarSurtunmeCarpan))
        : korkuDelta >= 2
          ? 1
          : 0;
    yeniSaygi = Math.max(0, yeniSaygi - surtunme);
  }

  // Saygı yükselirken yüksek Korku yumuşar (yalnızca Korku aynı anda artırılmıyorsa)
  if (saygiDelta > 0 && korkuDelta <= 0 && yeniKorku >= v.itibarSurtunmeBaslangic) {
    const surtunme =
      yeniKorku >= v.itibarSurtunmeYuksekEsik
        ? Math.max(1, Math.floor(saygiDelta * v.itibarSurtunmeCarpan))
        : saygiDelta >= 2
          ? 1
          : 0;
    yeniKorku = Math.max(0, yeniKorku - surtunme);
  }

  return {
    genel: Math.max(0, mevcut.genel + itibarDelta),
    saygi: yeniSaygi,
    korku: yeniKorku,
  };
}

export interface AktifDebuff {
  id: string;
  baslik: string;
  etki: string;
  cozum: string;
  siddet: 'kritik' | 'uyari';
}

export interface EtkiRozeti {
  metin: string;
  tur: 'arti' | 'eksi' | 'uyari' | 'notr';
}

/**
 * Her rakibin seviyesine göre Korku eşiklerini ve çekinme yüzdesini hesaplar.
 * Üst seviye rakipler kolay kolay sinmez; daha yüksek Korku gerektirir.
 */
export function rakipCekinmeHesapla(
  korku: number,
  rakip: RakipTanimi
): { yuzde: number; asama: 0 | 1 | 2; sonrakiEsik: number | null } {
  if (korku >= rakip.cekinmeEsik2) {
    return { yuzde: rakip.cekinmeYuzde2, asama: 2, sonrakiEsik: null };
  }
  if (korku >= rakip.cekinmeEsik1) {
    return { yuzde: rakip.cekinmeYuzde1, asama: 1, sonrakiEsik: rakip.cekinmeEsik2 };
  }
  return { yuzde: 0, asama: 0, sonrakiEsik: rakip.cekinmeEsik1 };
}

/**
 * Olay, iş veya komşu seçimindeki sayısal etkileri hızlı okunan rozetlere dönüştürür.
 */
export function olayEtkisiRozetleri(
  etkiler: OlayEtkisi & { yetenekPuani?: number }
): EtkiRozeti[] {
  const rozetler: EtkiRozeti[] = [];

  if (etkiler.para) {
    rozetler.push({
      metin: `${etkiler.para > 0 ? '+' : ''}${etkiler.para} ₺`,
      tur: etkiler.para > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.enerji) {
    rozetler.push({
      metin: `${etkiler.enerji > 0 ? '+' : ''}${etkiler.enerji} EN`,
      tur: etkiler.enerji > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.tokluk) {
    rozetler.push({
      metin: `${etkiler.tokluk > 0 ? '+' : ''}${etkiler.tokluk} Tok`,
      tur: etkiler.tokluk > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.yorgunluk) {
    rozetler.push({
      metin: `${etkiler.yorgunluk > 0 ? '+' : ''}${etkiler.yorgunluk} Yorgun`,
      tur: etkiler.yorgunluk > 0 ? 'eksi' : 'arti',
    });
  }
  if (etkiler.saygi) {
    rozetler.push({
      metin: `${etkiler.saygi > 0 ? '+' : ''}${etkiler.saygi} Saygı`,
      tur: etkiler.saygi > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.korku) {
    rozetler.push({
      metin: `${etkiler.korku > 0 ? '+' : ''}${etkiler.korku} Korku`,
      tur: etkiler.korku > 0 ? 'uyari' : 'notr',
    });
  }
  if (etkiler.itibar && !etkiler.saygi && !etkiler.korku) {
    rozetler.push({
      metin: `${etkiler.itibar > 0 ? '+' : ''}${etkiler.itibar} İtibar`,
      tur: etkiler.itibar > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.moral) {
    rozetler.push({
      metin: `${etkiler.moral > 0 ? '+' : ''}${etkiler.moral} Moral`,
      tur: etkiler.moral > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.aileIliskisi) {
    rozetler.push({
      metin: `${etkiler.aileIliskisi > 0 ? '+' : ''}${etkiler.aileIliskisi} Aile`,
      tur: etkiler.aileIliskisi > 0 ? 'arti' : 'eksi',
    });
  }
  if (etkiler.buzdolabiStok) {
    rozetler.push({
      metin: `+${etkiler.buzdolabiStok} Öğün`,
      tur: 'arti',
    });
  }
  if (etkiler.yetenekPuani) {
    rozetler.push({
      metin: `+${etkiler.yetenekPuani} YP`,
      tur: 'arti',
    });
  }
  if (etkiler.statIlerleme) {
    for (const [statKey, puan] of Object.entries(etkiler.statIlerleme)) {
      if (!puan) continue;
      const stat = STAT_HARITASI.get(statKey as StatId);
      rozetler.push({
        metin: `+${puan}% ${stat?.kisaKod ?? statKey}`,
        tur: 'arti',
      });
    }
  }
  if (etkiler.sureDakika) {
    rozetler.push({
      metin: `${etkiler.sureDakika} dk`,
      tur: 'notr',
    });
  }

  return rozetler;
}

/**
 * Saygı indiriminden sonraki market fiyatını hesaplar.
 */
export function indirimliMarketFiyati(fiyat: number, indirimYuzde: number): number {
  if (indirimYuzde <= 0) return fiyat;
  return Math.max(1, Math.round(fiyat * (1 - indirimYuzde / 100)));
}

/**
 * Dakika değerini "08:00" veya gece yarısından sonra "00:30 (Gece)" biçiminde döndürür.
 */
export function saatMetni(saatDakika: number): string {
  const norm = ((Math.round(saatDakika) % 1440) + 1440) % 1440;
  const saat = Math.floor(norm / 60);
  const dk = norm % 60;
  const hh = String(saat).padStart(2, '0');
  const mm = String(dk).padStart(2, '0');
  return saatDakika >= 1440 ? `${hh}:${mm} (Gece)` : `${hh}:${mm}`;
}

/**
 * Boş lakap girildiğinde önerilen listeden deterministik veya rastgele lakap seçer.
 */
export function rastgeleLakapSec(rng: () => number = Math.random): string {
  const havuz = KARAKTER_SABITLERI.onerilenLakaplar;
  const indeks = Math.floor(rng() * havuz.length);
  return havuz[indeks] ?? havuz[0];
}

/**
 * Metinlerdeki {oyuncuAdi} ve {gercekAd} yer tutucularını doldurur.
 */
export function metinSablonunuDoldur(metin: string, state: Pick<OyunDurumu, 'oyuncu'>): string {
  return metin
    .replaceAll('{oyuncuAdi}', state.oyuncu.lakap)
    .replaceAll('{gercekAd}', state.oyuncu.gercekAd);
}

/**
 * Başlangıç oyun durumunu oluşturur.
 */
export function yeniOyunOlustur(
  lakapGirdisi?: string,
  rng: () => number = Math.random
): OyunDurumu {
  const temizLakap = lakapGirdisi?.trim();
  const lakap = temizLakap && temizLakap.length > 0 ? temizLakap : rastgeleLakapSec(rng);

  const statlar = {} as Record<StatId, StatDurumu>;
  for (const stat of STAT_TANIMLARI) {
    statlar[stat.id] = {
      deger: stat.baslangicDegeri,
      ilerleme: 0,
    };
  }

  const baslangicUyku = 100 - KARAKTER_SABITLERI.baslangicYorgunluk;

  return {
    surum: KAYIT_SURUMU,
    versiyon: KAYIT_SURUMU,
    oyuncu: {
      gercekAd: KARAKTER_SABITLERI.gercekAd,
      lakap,
      yas: KARAKTER_SABITLERI.yas,
      gorunum: { ...TEMA.varsayilanKarakterGorunumu },
    },
    gun: 1,
    saatDakika: SAAT_SABITLERI.sabahBaslangicDakika,
    enerji: KARAKTER_SABITLERI.baslangicEnerji,
    maksEnerji: KARAKTER_SABITLERI.maksEnerji,
    tokluk: KARAKTER_SABITLERI.baslangicTokluk,
    uyku: baslangicUyku,
    yorgunluk: KARAKTER_SABITLERI.baslangicYorgunluk,
    moral: KARAKTER_SABITLERI.baslangicMoral,
    para: KARAKTER_SABITLERI.baslangicPara,
    buzdolabiStok: KARAKTER_SABITLERI.baslangicBuzdolabi,
    salonGirisGunu: 0,
    anneKonusmaGunu: 0,
    elifKonusmaGunu: 0,
    uyuyakalmaCezasi: false,
    itibar: {
      genel: 0,
      saygi: 0,
      korku: 0,
    },
    aileIliskisi: DENGE.baslangic.aileIliskisi,
    ahlakiSecimler: [],
    komsuDayanismaGunu: 0,
    ringTavri: 'dengeli',
    statlar,
    evSeviyesi: 0,
    evEsyalari: [],
    kiraUyariSayisi: 0,
    sokaktaKaliyor: false,
    aktifMekan: 'ev',
    aktifOlay: null,
    sonOlayGunu: 0,
    tamamlananTekilOlayIds: [],
    sonOlayId: null,
    macKazanmaSayisi: 0,
    toplamDovusSayisi: 0,
    aktifDovusRakipId: null,
    mekanZiyaretSayilari: {},
    yenilenRakipIds: [],
    yetenekPuani: 0,
    acikYetenekIds: [],
    kazanilanStatEsikleri: [],
    ogrenilenHocaDersIds: [],
    komsuAdimlari: {},
    komsuSecimleri: [],
    komsuBayraklari: [],
    aktifKomsuOlayi: null,
    sonBildirim: {
      gun: 1,
      saatMetni: saatMetni(SAAT_SABITLERI.sabahBaslangicDakika),
      metin: `Evde uyandın (${KARAKTER_SABITLERI.gercekAd} / ${lakap}). 7. gün kira günü; iş yeriyle paranı kazan, spor salonunda güçlen ve aç kalma.`,
      tur: 'bilgi',
    },
    gecmis: [
      {
        gun: 1,
        saatMetni: saatMetni(SAAT_SABITLERI.sabahBaslangicDakika),
        metin: 'İlk sabah. Haftalık kira için 7 günün var.',
        tur: 'bilgi',
      },
    ],
  };
}

/**
 * Açılmış yetenek ağacı düğümlerinin ve hoca derslerinin toplam pasif etkilerini hesaplar.
 */
export function hesaplaYetenekPasifleri(
  acikYetenekIds: string[] = [],
  ogrenilenHocaDersIds: string[] = []
): YetenekPasifOzeti {
  const ozet: YetenekPasifOzeti = {
    ekMaksCan: 0,
    ekMaksStamina: 0,
    staminaToparlanmaYuzde: 0,
    yumrukHasarYuzde: 0,
    tekmeHasarYuzde: 0,
    isabetBonusu: 0,
    blokKesintiYuzde: 0,
    kacinmaSansiBonusu: 0,
    karsiSaldiriCarpanBonusu: 0,
    antrenmanVerimBonusu: 0,
    gunlukEnerjiBonusu: 0,
  };

  const etkiEkle = (e: {
    ekMaksCan?: number;
    ekMaksStamina?: number;
    staminaToparlanmaYuzde?: number;
    yumrukHasarYuzde?: number;
    tekmeHasarYuzde?: number;
    isabetBonusu?: number;
    blokKesintiYuzde?: number;
    kacinmaSansiBonusu?: number;
    karsiSaldiriCarpanBonusu?: number;
    antrenmanVerimBonusu?: number;
    gunlukEnerjiBonusu?: number;
  }) => {
    ozet.ekMaksCan += e.ekMaksCan ?? 0;
    ozet.ekMaksStamina += e.ekMaksStamina ?? 0;
    ozet.staminaToparlanmaYuzde += e.staminaToparlanmaYuzde ?? 0;
    ozet.yumrukHasarYuzde += e.yumrukHasarYuzde ?? 0;
    ozet.tekmeHasarYuzde += e.tekmeHasarYuzde ?? 0;
    ozet.isabetBonusu += e.isabetBonusu ?? 0;
    ozet.blokKesintiYuzde += e.blokKesintiYuzde ?? 0;
    ozet.kacinmaSansiBonusu += e.kacinmaSansiBonusu ?? 0;
    ozet.karsiSaldiriCarpanBonusu += e.karsiSaldiriCarpanBonusu ?? 0;
    ozet.antrenmanVerimBonusu += e.antrenmanVerimBonusu ?? 0;
    ozet.gunlukEnerjiBonusu += e.gunlukEnerjiBonusu ?? 0;
  };

  for (const id of acikYetenekIds) {
    const dugum = YETENEK_HARITASI.get(id);
    if (dugum) etkiEkle(dugum.etki);
  }

  for (const dersId of ogrenilenHocaDersIds) {
    const ders = HOCA_DERS_HARITASI.get(dersId);
    if (ders) etkiEkle(ders.etki);
  }

  return ozet;
}

/**
 * Hamle açılma şartlarının, yetenek ağacı düğümünün ve hoca dersinin karşılanıp karşılanmadığını denetler.
 */
export function hamleAcikMi(
  hamle: HamleVerisi,
  statlar: Record<StatId, StatDurumu>,
  acikYetenekIds: string[] = [],
  ogrenilenHocaDersIds: string[] = []
): boolean {
  if (hamle.yetenekId && !acikYetenekIds.includes(hamle.yetenekId)) {
    return false;
  }
  if (hamle.hocaDersId && !ogrenilenHocaDersIds.includes(hamle.hocaDersId)) {
    return false;
  }
  for (const [statId, gereken] of Object.entries(hamle.acilisSarti)) {
    const mevcut = statlar[statId as StatId]?.deger ?? 0;
    if (mevcut < (gereken ?? 0)) {
      return false;
    }
  }
  return true;
}

function statEsikPuanlariniKontrolEt(
  statlar: Record<StatId, StatDurumu>,
  oncekiEsikler: string[] = []
): { ekPuan: number; yeniEsikler: string[]; mesajNotu: string } {
  const mevcutSet = new Set(oncekiEsikler);
  let ekPuan = 0;
  const yeniEsikler = [...oncekiEsikler];
  const kazanilanEtiketler: string[] = [];

  for (const stat of STAT_TANIMLARI) {
    const deger = statlar[stat.id]?.deger ?? 0;
    for (const esik of STAT_YETENEK_ESIKLERI) {
      const anahtar = `${stat.id}:${esik}`;
      if (deger >= esik && !mevcutSet.has(anahtar)) {
        mevcutSet.add(anahtar);
        yeniEsikler.push(anahtar);
        ekPuan += 1;
        kazanilanEtiketler.push(`${stat.isim} ${esik}`);
      }
    }
  }

  const mesajNotu =
    ekPuan > 0
      ? ` +${ekPuan} Yetenek Puanı kazanıldı (${kazanilanEtiketler.join(', ')})!`
      : '';

  return { ekPuan, yeniEsikler, mesajNotu };
}

/**
 * Yetenek ağacındaki bir düğümün açılıp açılamayacağını ve kilit nedenini döndürür.
 */
export function yetenekAcilabilirMi(
  state: OyunDurumu,
  yetenekId: string
): { acikMi: boolean; acilabilir: boolean; neden?: string; dugum?: YetenekDugumu } {
  const dugum = YETENEK_HARITASI.get(yetenekId);
  if (!dugum) {
    return { acikMi: false, acilabilir: false, neden: 'Yetenek bulunamadı.' };
  }

  const acikIds = state.acikYetenekIds ?? [];
  if (acikIds.includes(yetenekId)) {
    return { acikMi: true, acilabilir: false, dugum };
  }

  if (dugum.oncekiYetenekId && !acikIds.includes(dugum.oncekiYetenekId)) {
    const onceki = YETENEK_HARITASI.get(dugum.oncekiYetenekId);
    return {
      acikMi: false,
      acilabilir: false,
      neden: `Önce "${onceki?.isim ?? dugum.oncekiYetenekId}" açılmalı.`,
      dugum,
    };
  }

  for (const [statKey, minDeger] of Object.entries(dugum.statSarti)) {
    const statId = statKey as StatId;
    const mevcut = state.statlar[statId]?.deger ?? 0;
    if (mevcut < (minDeger ?? 0)) {
      const statTanim = STAT_HARITASI.get(statId);
      return {
        acikMi: false,
        acilabilir: false,
        neden: `Gereken: ${statTanim?.isim ?? statId} ${minDeger}`,
        dugum,
      };
    }
  }

  const mevcutPuan = state.yetenekPuani ?? 0;
  if (mevcutPuan < dugum.puanMaliyeti) {
    return {
      acikMi: false,
      acilabilir: false,
      neden: `${dugum.puanMaliyeti} YP gerekiyor.`,
      dugum,
    };
  }

  return { acikMi: false, acilabilir: true, dugum };
}

/**
 * Yetenek ağacından bir yeteneği açar (yetenek puanı harcar).
 */
export function yetenekAc(state: OyunDurumu, yetenekId: string): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const kontrol = yetenekAcilabilirMi(state, yetenekId);
  if (!kontrol.acilabilir || !kontrol.dugum) {
    if (!kontrol.neden) return state;
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: kontrol.neden,
        tur: 'uyari',
      },
    };
  }

  const dugum = kontrol.dugum;
  const yeniAcikIds = [...(state.acikYetenekIds ?? []), dugum.id];
  const yeniPuan = Math.max(0, (state.yetenekPuani ?? 0) - dugum.puanMaliyeti);

  const acilanHamle = dugum.etki.acilanHamleId
    ? HAMLE_HARITASI.get(dugum.etki.acilanHamleId)
    : undefined;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika),
    metin: acilanHamle
      ? `Yetenek açıldı: ${dugum.isim} — Yeni hamle "${acilanHamle.isim}" dövüşte kullanıma hazır!`
      : `Yetenek açıldı: ${dugum.isim} (${dugum.ozetEtiket}).`,
    tur: 'basari',
  };

  return {
    ...state,
    yetenekPuani: yeniPuan,
    acikYetenekIds: yeniAcikIds,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };
}

/**
 * Statlar, moral, uyku/yorgunluk, tokluk, ev eşyaları ve yetenek ağacından türetilen tüm değerleri hesaplar.
 */
export function hesaplaTuretilmisDegerler(state: OyunDurumu): TuretilmisDegerler {
  const acikYetenekIds = state.acikYetenekIds ?? [];
  const ogrenilenHocaDersIds = state.ogrenilenHocaDersIds ?? [];
  const pasifler = hesaplaYetenekPasifleri(acikYetenekIds, ogrenilenHocaDersIds);
  const v = DENGE.verimVeEsikler;
  const dayaniklilik = state.statlar.dayaniklilik.deger;
  const maksCan = v.maksCanTaban + dayaniklilik * v.maksCanDayaniklilikCarpan + pasifler.ekMaksCan;
  const maksStamina =
    v.maksStaminaTaban + dayaniklilik * v.maksStaminaDayaniklilikCarpan + pasifler.ekMaksStamina;

  // Moral çarpanı (0.80 .. 1.20)
  const moralCarpani =
    v.moralCarpaniTaban + (sinirla(state.moral, 0, 100) / 100) * v.moralCarpaniAralik;

  // Uyku / yorgunluk çarpanı
  let yorgunlukCarpani = 1.0;
  if (state.uyku <= v.uykuKritikEsik || state.yorgunluk >= v.yorgunlukKritikEsik) {
    yorgunlukCarpani = v.uykuKritikCarpan;
  } else if (state.uyku <= v.uykuOrtaEsik || state.yorgunluk >= v.yorgunlukOrtaEsik) {
    yorgunlukCarpani = v.uykuOrtaCarpan;
  }

  // Tokluk çarpanı: açlık arttıkça antrenman verimi düşer
  let toklukCarpani = 1.0;
  if (state.tokluk <= v.toklukKritikEsik) {
    toklukCarpani = v.toklukKritikCarpan;
  } else if (state.tokluk <= v.toklukOrtaEsik) {
    toklukCarpani = v.toklukOrtaCarpan;
  } else if (state.tokluk <= v.toklukHafifEsik) {
    toklukCarpani = v.toklukHafifCarpan;
  }

  // Gece geç saatte bayılma cezası
  const cezaCarpani = state.uyuyakalmaCezasi ? v.uyuyakalmaVerimCarpani : 1.0;

  const antrenmanVerimi =
    Math.round(moralCarpani * yorgunlukCarpani * toklukCarpani * cezaCarpani * 100) +
    pasifler.antrenmanVerimBonusu;

  const mevcutEv = EV_SEVIYE_HARITASI.get(state.evSeviyesi) ?? EV_SEVIYELERI[0];
  const sonrakiEv = EV_SEVIYE_HARITASI.get(mevcutEv.seviye + 1) ?? null;

  const kiraDongu = Math.max(1, DENGE.zaman.kiraDonguGun);
  const gunDonguIndeksi = (state.gun - 1) % kiraDongu;
  const kirayaKalanGun = kiraDongu - gunDonguIndeksi;
  const kiraEksikTutar = Math.max(0, mevcutEv.haftalikKira - state.para);

  const acikHamleIds = HAMLE_LISTESI.filter((h) =>
    hamleAcikMi(h, state.statlar, acikYetenekIds, ogrenilenHocaDersIds)
  ).map((h) => h.id);

  const evdeAntrenmanAcik =
    !state.sokaktaKaliyor &&
    state.evEsyalari.some((id) => {
      const esya = ESYA_HARITASI.get(id);
      return Boolean(esya?.evdeAntrenmanAcar);
    });

  const gucDayaniklilikBonusYuzde = state.evEsyalari.reduce((toplam, id) => {
    const esya = ESYA_HARITASI.get(id);
    return toplam + (esya?.gucDayaniklilikBonusYuzde ?? 0);
  }, 0);

  const saygi = state.itibar?.saygi ?? 0;
  const korku = state.itibar?.korku ?? 0;
  const saygiSeviyesi: 0 | 1 | 2 =
    saygi >= ITIBAR_SABITLERI.saygiEsik2
      ? 2
      : saygi >= ITIBAR_SABITLERI.saygiEsik1
        ? 1
        : 0;
  const korkuSeviyesi: 0 | 1 | 2 =
    korku >= ITIBAR_SABITLERI.korkuEsik2
      ? 2
      : korku >= ITIBAR_SABITLERI.korkuEsik1
        ? 1
        : 0;
  const marketIndirimYuzde =
    saygiSeviyesi === 2 ? v.marketIndirim2 : saygiSeviyesi === 1 ? v.marketIndirim1 : 0;
  const ilkRakip = RAKIP_LISTESI[0];
  const rakipCekinmeYuzde = ilkRakip ? rakipCekinmeHesapla(korku, ilkRakip).yuzde : 0;

  return {
    maksCan,
    maksStamina,
    moralCarpani,
    yorgunlukCarpani,
    toklukCarpani,
    cezaCarpani,
    antrenmanVerimi,
    mevcutEv,
    sonrakiEv,
    kirayaKalanGun,
    kiraEksikTutar,
    acikHamleIds,
    evdeAntrenmanAcik,
    gucDayaniklilikBonusYuzde,
    geceGecMi: state.saatDakika >= SAAT_SABITLERI.geceGecEsikDakika,
    salonGirisOdendiMi: state.salonGirisGunu === state.gun,
    yetenekPuani: state.yetenekPuani ?? 0,
    pasifler,
    saygiSeviyesi,
    korkuSeviyesi,
    marketIndirimYuzde,
    komsuDayanismasiAcik: saygiSeviyesi >= 1,
    guvenilirIsAcik: saygiSeviyesi >= 2,
    haracCeteIsiAcik: korkuSeviyesi >= 2,
    rakipCekinmeYuzde,
  };
}

/**
 * Oyuncu üzerindeki tüm aktif olumsuz etkileri (debuff) kısa, net etiketler halinde döndürür.
 */
export function aktifDebufflariGetir(state: OyunDurumu): AktifDebuff[] {
  const debufflar: AktifDebuff[] = [];
  const v = DENGE.verimVeEsikler;
  const mevcutEv = EV_SEVIYE_HARITASI.get(state.evSeviyesi) ?? EV_SEVIYELERI[0];
  const moralCarpani =
    v.moralCarpaniTaban + (sinirla(state.moral, 0, 100) / 100) * v.moralCarpaniAralik;

  if (state.uyuyakalmaCezasi) {
    debufflar.push({
      id: 'uyuyakalma',
      baslik: 'Uyuyakalma',
      etki: '-%20 Verim · -%15 Ring Stam',
      cozum: '02:00 öncesi uyu',
      siddet: 'uyari',
    });
  }

  if (state.tokluk <= v.toklukKritikEsik) {
    debufflar.push({
      id: 'aclik',
      baslik: 'Açlık (Kritik)',
      etki: '-%45 Verim · -%22 Ring Stam',
      cozum: 'Yemek ye',
      siddet: 'kritik',
    });
  } else if (state.tokluk < v.hazirlikDusukEsik) {
    debufflar.push({
      id: 'aclik',
      baslik: 'Açlık',
      etki: '-%22 Verim · -%22 Ring Stam',
      cozum: 'Yemek ye',
      siddet: 'kritik',
    });
  } else if (state.tokluk <= v.toklukOrtaEsik) {
    debufflar.push({
      id: 'aclik',
      baslik: 'Aç',
      etki: '-%22 Verim',
      cozum: 'Yemek ye',
      siddet: 'uyari',
    });
  } else if (state.tokluk <= v.toklukHafifEsik) {
    debufflar.push({
      id: 'aclik',
      baslik: 'Hafif Aç',
      etki: '-%8 Verim',
      cozum: 'Atıştır',
      siddet: 'uyari',
    });
  }

  if (state.uyku <= v.uykuKritikEsik || state.yorgunluk >= v.yorgunlukKritikEsik) {
    debufflar.push({
      id: 'uyku',
      baslik: 'Bitkin',
      etki: '-%45 Verim · -%22 Ring Stam',
      cozum: 'Evde uyu',
      siddet: 'kritik',
    });
  } else if (state.uyku < v.hazirlikDusukEsik) {
    debufflar.push({
      id: 'uyku',
      baslik: 'Çok Yorgun',
      etki: '-%22 Verim · -%22 Ring Stam',
      cozum: 'Evde uyu',
      siddet: 'kritik',
    });
  } else if (state.uyku <= v.uykuOrtaEsik || state.yorgunluk >= v.yorgunlukOrtaEsik) {
    debufflar.push({
      id: 'uyku',
      baslik: 'Yorgun',
      etki: '-%22 Verim',
      cozum: 'Dinlen',
      siddet: 'uyari',
    });
  }

  if (state.moral < v.dusukMoralEsik) {
    debufflar.push({
      id: 'moral',
      baslik: 'Düşük Moral',
      etki: `Verim x${moralCarpani.toFixed(2)}`,
      cozum: 'Aile / Yemek',
      siddet: 'uyari',
    });
  }

  if (state.sokaktaKaliyor) {
    debufflar.push({
      id: 'sokakta_kalma',
      baslik: 'Kapı Kilitli (Sokak)',
      etki: 'Düşük gece toparlanması',
      cozum: `${mevcutEv.haftalikKira} ₺ kira öde`,
      siddet: 'kritik',
    });
  } else if (state.kiraUyariSayisi > 0) {
    debufflar.push({
      id: 'kira_uyari',
      baslik: 'Kira Uyarısı',
      etki: `${mevcutEv.haftalikKira} ₺ ödenmezse ceza`,
      cozum: 'Para biriktir',
      siddet: 'kritik',
    });
  }

  return debufflar;
}

function gecmiseEkle(
  gecmis: GunlukKayit[],
  yeniKayit: GunlukKayit
): GunlukKayit[] {
  const limit = Math.max(1, DENGE.ekonomiVeYasam.gecmisLimiti);
  return gecmis.length >= limit
    ? [yeniKayit, ...gecmis.slice(0, limit - 1)]
    : [yeniKayit, ...gecmis];
}

function uykuVeYorgunlukAyarla(
  mevcutUyku: number,
  degisim: number
): { uyku: number; yorgunluk: number } {
  const uyku = sinirla(Math.round(mevcutUyku + degisim), 0, 100);
  return { uyku, yorgunluk: 100 - uyku };
}

/**
 * Mevcut güne ve şartlara uygun bir rastgele ev olayı veya ahlaki gri seçim seçer.
 */
export function rastgeleEvOlayiSec(
  state: OyunDurumu,
  rng: () => number = Math.random
): EvOlayi | null {
  const tamamlananlar = new Set(state.tamamlananTekilOlayIds ?? []);
  const tumOlaylar = [...EV_OLAYLARI, ...AHLAKI_GRI_OLAYLAR];
  const filtrelenmis = tumOlaylar.filter((olay) => {
    if (olay.tekSeferlik && tamamlananlar.has(olay.id)) return false;
    if (olay.cikmaSarti?.minGun && state.gun < olay.cikmaSarti.minGun) return false;
    if (
      olay.cikmaSarti?.maksEvSeviyesi !== undefined &&
      state.evSeviyesi > olay.cikmaSarti.maksEvSeviyesi
    ) {
      return false;
    }
    return true;
  });

  if (filtrelenmis.length === 0) return null;

  // Birden fazla uygun olay varsa aynı olayın üst üste iki kez gelmesini önle
  const ardilOlmayanlar =
    filtrelenmis.length > 1 && state.sonOlayId
      ? filtrelenmis.filter((olay) => olay.id !== state.sonOlayId)
      : filtrelenmis;
  const uygunlar = ardilOlmayanlar.length > 0 ? ardilOlmayanlar : filtrelenmis;

  // En fazla 2 gün olay çıkmadıysa garanti tetikle; aksi halde %55 olasılık
  const garanti = state.gun - state.sonOlayGunu >= DENGE.verimVeEsikler.olayTetiklemeGunFarki;
  if (!garanti && rng() > DENGE.verimVeEsikler.olayTetiklemeOlasilik) {
    return null;
  }

  // Uygun ahlaki olaylar varsa bir kısmında öne çıkar ki oyuncu ahlaki ikilemleri düzenli görsün
  const ahlakiAdaylar = uygunlar.filter((o) => o.kategori === 'ahlaki');
  if (ahlakiAdaylar.length > 0 && rng() < DENGE.verimVeEsikler.ahlakiOlayOncelikOlasilik) {
    return ahlakiAdaylar[Math.floor(rng() * ahlakiAdaylar.length)] ?? ahlakiAdaylar[0];
  }

  const toplamAgirlik = uygunlar.reduce((acc, item) => acc + item.cikmaOlasiligi, 0);
  let esik = rng() * toplamAgirlik;
  for (const olay of uygunlar) {
    esik -= olay.cikmaOlasiligi;
    if (esik <= 0) return olay;
  }
  return uygunlar[0];
}

/**
 * Yeni güne geçiş çekirdeği: 7 günlük kira kontrolü, ev/eşya bonusuyla dinlenme
 * ve sabah rastgele ev olayı kontrolü.
 */
function yeniGuneGec(
  state: OyunDurumu,
  bayilmaModu: boolean,
  rng: () => number
): OyunDurumu {
  const ek = DENGE.ekonomiVeYasam;
  const mevcutEv = EV_SEVIYE_HARITASI.get(state.evSeviyesi) ?? EV_SEVIYELERI[0];
  const dayaniklilikBonus = Math.max(
    0,
    Math.floor(
      (state.statlar.dayaniklilik.deger - ek.uykuDayaniklilikReferans) * ek.uykuDayaniklilikCarpan
    )
  );

  let esyaEnerjiBonus = 0;
  let esyaUykuBonus = 0;
  let esyaMoralBonus = 0;
  for (const esyaId of state.evEsyalari) {
    const esya = ESYA_HARITASI.get(esyaId);
    if (esya) {
      esyaEnerjiBonus += esya.gunlukEnerjiBonus;
      esyaUykuBonus += esya.gunlukUykuBonus;
      esyaMoralBonus += esya.gunlukMoralBonus;
    }
  }

  let yeniPara = state.para;
  let yeniEvSeviyesi = state.evSeviyesi;
  let yeniUyariSayisi = state.kiraUyariSayisi;
  let yeniSokaktaKaliyor = Boolean(state.sokaktaKaliyor);
  let yeniMoral = sinirla(
    state.moral +
      (yeniSokaktaKaliyor ? -ek.sokaktaMoralCezasi : mevcutEv.moralEtkisi + esyaMoralBonus) -
      (bayilmaModu ? ek.bayilmaMoralCezasi : 0),
    0,
    100
  );
  let yeniItibar = { ...state.itibar };
  let gecmis = [...state.gecmis];

  const yeniGun = state.gun + 1;
  const yeniSaat = bayilmaModu
    ? SAAT_SABITLERI.uyuyakalmaSabahDakika
    : SAAT_SABITLERI.sabahBaslangicDakika;

  const kiraDongu = Math.max(1, DENGE.zaman.kiraDonguGun);
  const kiraGunuMu = state.gun % kiraDongu === 0;
  let bildirim: GunlukKayit;

  if (kiraGunuMu) {
    if (yeniPara >= mevcutEv.haftalikKira) {
      const sokaktanDondu = yeniSokaktaKaliyor;
      yeniPara -= mevcutEv.haftalikKira;
      yeniUyariSayisi = 0;
      yeniSokaktaKaliyor = false;
      yeniMoral = sinirla(yeniMoral + ek.kiraOdendiMoralBonus, 0, 100);
      bildirim = {
        gun: yeniGun,
        saatMetni: saatMetni(yeniSaat),
        metin: sokaktanDondu
          ? `Biriken ${mevcutEv.haftalikKira} ₺ kira ödendi; kapının kilidi açıldı ve eve döndünüz.`
          : `Haftalık ${mevcutEv.haftalikKira} ₺ kira ödendi. Annen Emine rahat bir nefes aldı.`,
        tur: 'basari',
      };
    } else if (yeniUyariSayisi === 0) {
      yeniUyariSayisi = 1;
      yeniSokaktaKaliyor = false;
      yeniMoral = sinirla(yeniMoral - ek.kiraIlkUyariMoralCezasi, 0, 100);
      bildirim = {
        gun: yeniGun,
        saatMetni: saatMetni(yeniSaat),
        metin: `Kira ödenemedi (${mevcutEv.haftalikKira} ₺ gerekiyordu). Ev sahibinden sert uyarı aldın; gelecek haftaya kadar toparlanmalısın.`,
        tur: 'uyari',
      };
    } else if (yeniEvSeviyesi > 0) {
      yeniEvSeviyesi -= 1;
      yeniUyariSayisi = 0;
      yeniSokaktaKaliyor = false;
      yeniMoral = sinirla(yeniMoral - ek.kiraDusmeMoralCezasi, 0, 100);
      const dusulenEv = EV_SEVIYE_HARITASI.get(yeniEvSeviyesi) ?? EV_SEVIYELERI[0];
      bildirim = {
        gun: yeniGun,
        saatMetni: saatMetni(yeniSaat),
        metin: `Kira üst üste ödenemediği için eşyaları toplayıp ${dusulenEv.isim} katına dönmek zorunda kaldınız.`,
        tur: 'uyari',
      };
    } else {
      yeniUyariSayisi = 2;
      yeniSokaktaKaliyor = true;
      yeniMoral = sinirla(yeniMoral - ek.kiraIkinciUyariMoralCezasi, 0, 100);
      yeniItibar = {
        ...yeniItibar,
        genel: Math.max(0, yeniItibar.genel - ek.kiraIkinciUyariItibarKaybi),
        saygi: Math.max(0, yeniItibar.saygi - ek.kiraIkinciUyariItibarKaybi),
      };
      bildirim = {
        gun: yeniGun,
        saatMetni: saatMetni(yeniSaat),
        metin: `Kira üst üste ödenemediği için Kemal kapıyı kilitledi; bu geceyi dışarıda geçirdin. ${mevcutEv.haftalikKira} ₺ ödeyene kadar toparlanman düşük kalacak.`,
        tur: 'uyari',
      };
    }
  } else if (bayilmaModu) {
    bildirim = {
      gun: yeniGun,
      saatMetni: saatMetni(yeniSaat),
      metin:
        'Aşırı geç saat ve bitkinlikten olduğun yerde sızdın. Sabah 10:00’da baş ağrısıyla uyandın; bugünkü verimin -%20 düşük.',
      tur: 'uyari',
    };
  } else if (yeniSokaktaKaliyor) {
    bildirim = {
      gun: yeniGun,
      saatMetni: saatMetni(yeniSaat),
      metin: `Gün ${yeniGun}: Ev kapısı kilitli olduğu için geceyi dışarıda geçirdin; toparlanma düşük kaldı.`,
      tur: 'uyari',
    };
  } else {
    bildirim = {
      gun: yeniGun,
      saatMetni: saatMetni(yeniSaat),
      metin: `Gün ${yeniGun} başladı (${saatMetni(yeniSaat)}). ${mevcutEv.isim} içinde dinlendin.`,
      tur: 'bilgi',
    };
  }

  gecmis = gecmiseEkle(gecmis, bildirim);

  const guncelEv = EV_SEVIYE_HARITASI.get(yeniEvSeviyesi) ?? EV_SEVIYELERI[0];
  const pasifler = hesaplaYetenekPasifleri(
    state.acikYetenekIds ?? [],
    state.ogrenilenHocaDersIds ?? []
  );

  const hedefEnerji = bayilmaModu
    ? ek.bayilmaEnerjiHedefi
    : yeniSokaktaKaliyor
      ? ek.sokaktaEnerjiToparlanma + dayaniklilikBonus + pasifler.gunlukEnerjiBonusu
      : guncelEv.gunlukEnerjiToparlanma +
        dayaniklilikBonus +
        esyaEnerjiBonus +
        pasifler.gunlukEnerjiBonusu;
  const yeniEnerji = sinirla(hedefEnerji, 0, state.maksEnerji);

  const uykuKazanimi = bayilmaModu
    ? ek.bayilmaUykuKazanimi
    : yeniSokaktaKaliyor
      ? ek.sokaktaYorgunlukAzaltma + dayaniklilikBonus
      : guncelEv.yorgunlukAzaltma + dayaniklilikBonus + esyaUykuBonus + ek.normalUykuTabanEk;
  const { uyku: yeniUyku, yorgunluk: yeniYorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    uykuKazanimi
  );

  // Gece boyunca hafif acıkma (ama oyuncuyu 0'da kilitlememek için taban 15)
  const yeniTokluk = Math.max(ek.geceToklukTaban, state.tokluk - ek.geceAclikKaybi);

  const yeniState: OyunDurumu = {
    ...state,
    gun: yeniGun,
    saatDakika: yeniSaat,
    enerji: yeniEnerji,
    tokluk: yeniTokluk,
    uyku: yeniUyku,
    yorgunluk: yeniYorgunluk,
    moral: yeniMoral,
    para: yeniPara,
    uyuyakalmaCezasi: bayilmaModu,
    itibar: yeniItibar,
    evSeviyesi: yeniEvSeviyesi,
    kiraUyariSayisi: yeniUyariSayisi,
    sokaktaKaliyor: yeniSokaktaKaliyor,
    aktifMekan: 'ev',
    sonBildirim: bildirim,
    gecmis,
  };

  const secilenOlay = rastgeleEvOlayiSec(yeniState, rng);
  if (secilenOlay) {
    return {
      ...yeniState,
      aktifOlay: secilenOlay,
      sonOlayGunu: yeniState.gun,
    };
  }

  return yeniState;
}

/**
 * Saati ilerletir; 22:00 sonrasında ekstra uyku kaybı uygular ve 02:00'da veya uyku 0 olunca bayılma tetikler.
 */
function zamanIlerlet(
  state: OyunDurumu,
  dakika: number,
  rng: () => number
): OyunDurumu {
  const eskiSaat = state.saatDakika;
  const yeniSaat = eskiSaat + dakika;

  // 22:00 (1320) sonrası geçen her 30 dakikada -3 ek uyku kaybı
  const gecBaslangic = Math.max(eskiSaat, SAAT_SABITLERI.geceGecEsikDakika);
  const gecBitis = Math.max(yeniSaat, SAAT_SABITLERI.geceGecEsikDakika);
  const gecDakika = Math.max(0, gecBitis - gecBaslangic);
  const ekUykuKaybi = Math.round((gecDakika / 30) * DENGE.zaman.geceUykuKayipHer30Dk);

  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(state.uyku, -ekUykuKaybi);

  const guncelState: OyunDurumu = {
    ...state,
    saatDakika: yeniSaat,
    uyku,
    yorgunluk,
  };

  if (yeniSaat >= SAAT_SABITLERI.uyuyakalmaSiniriDakika || uyku <= 0) {
    return yeniGuneGec(guncelState, true, rng);
  }

  return guncelState;
}

/**
 * Seçilen mekana yürüyerek gider. Küçük bir zaman ve enerji maliyeti uygular.
 */
export function mekanaGit(
  state: OyunDurumu,
  hedefMekan: MekanId,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state) || state.aktifMekan === hedefMekan) return state;
  const tanim = MEKAN_HARITASI.get(hedefMekan);
  if (!tanim) return state;

  // Anti-ölüm sarmalı: 0 enerjide bile eve ve diğer mekanlara yürüyebil (enerji varsa düşer)
  const enerjiKaybi = Math.min(state.enerji, tanim.yolculukEnerji);
  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -DENGE.zaman.yolculukUykuKaybi
  );

  const oncekiZiyaretler = state.mekanZiyaretSayilari ?? {};
  const araState: OyunDurumu = {
    ...state,
    aktifMekan: hedefMekan,
    mekanZiyaretSayilari: {
      ...oncekiZiyaretler,
      [hedefMekan]: (oncekiZiyaretler[hedefMekan] ?? 0) + 1,
    },
    enerji: sinirla(state.enerji - enerjiKaybi, 0, state.maksEnerji),
    uyku,
    yorgunluk,
  };

  const zamanli = zamanIlerlet(araState, tanim.yolculukDakika, rng);
  // Eğer yolculuk sırasında gece yarısı bayılmadıysa varış bildirimi yaz
  if (zamanli.gun === state.gun) {
    const kayit: GunlukKayit = {
      gun: zamanli.gun,
      saatMetni: saatMetni(zamanli.saatDakika),
      metin: `${tanim.isim} mekanına yürüdün (${tanim.yolculukDakika} dk).`,
      tur: 'bilgi',
    };
    return {
      ...zamanli,
      sonBildirim: kayit,
    };
  }
  return zamanli;
}

/**
 * Spor salonunda veya (kum torbası varsa) evde stat antrenmanı yapar.
 */
export function antrenmanYap(
  state: OyunDurumu,
  statId: StatId,
  secenek: { ucretsizEv?: boolean } = {},
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const tanim = STAT_HARITASI.get(statId);
  if (!tanim) return state;

  const turetilmis = hesaplaTuretilmisDegerler(state);
  const evdeMi = Boolean(secenek.ucretsizEv);

  if (evdeMi) {
    if (!turetilmis.evdeAntrenmanAcik || (statId !== 'guc' && statId !== 'ceviklik')) {
      return {
        ...state,
        sonBildirim: {
          gun: state.gun,
          saatMetni: saatMetni(state.saatDakika),
          metin: 'Evde çalışmak için önce ev eşyalarından kum torbası almalısın.',
          tur: 'uyari',
        },
      };
    }
  }

  let girisUcreti = 0;
  if (!evdeMi && state.salonGirisGunu !== state.gun) {
    girisUcreti = SAAT_SABITLERI.salonGunlukGirisUcreti;
    if (state.para < girisUcreti) {
      return {
        ...state,
        sonBildirim: {
          gun: state.gun,
          saatMetni: saatMetni(state.saatDakika),
          metin: `Spor salonu günlük girişi ${girisUcreti} ₺. Paran yetersiz; iş yerinde vardiya yap ya da Sokak Arenasında ücretsiz gölge boksu çalış.`,
          tur: 'uyari',
        },
      };
    }
  }

  if (state.enerji < tanim.enerjiMaliyeti) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${tanim.antrenmanAdi} için enerjin yetersiz (${tanim.enerjiMaliyeti} EN gerek). Yemek ye ya da evde uyu.`,
        tur: 'uyari',
      },
    };
  }

  if (state.tokluk < DENGE.antrenman.minToklukEsigi) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Açlıktan gözün kararıyor. Antrenmandan önce marketten veya evdeki dolaptan bir şeyler yemelisin.',
        tur: 'uyari',
      },
    };
  }

  // Evde kum torbasında hafif %85 verim; ağırlık seti varsa Güç & Dayanıklılık +%20
  const evCarpani = evdeMi ? DENGE.antrenman.evTorbaVerimCarpani : 1.0;
  const esyaCarpani =
    (statId === 'guc' || statId === 'dayaniklilik') && turetilmis.gucDayaniklilikBonusYuzde > 0
      ? 1 + turetilmis.gucDayaniklilikBonusYuzde / 100
      : 1.0;

  const kazanilanIlerleme = Math.max(
    DENGE.antrenman.minIlerleme,
    Math.round(
      tanim.temelIlerleme * (turetilmis.antrenmanVerimi / 100) * evCarpani * esyaCarpani
    )
  );

  const eskiStat = state.statlar[statId];
  const toplamIlerleme = eskiStat.ilerleme + kazanilanIlerleme;
  const seviyeArtisi = Math.floor(toplamIlerleme / 100);
  const yeniIlerleme = toplamIlerleme % 100;
  const yeniDeger = eskiStat.deger + seviyeArtisi;

  const yeniStatlar: Record<StatId, StatDurumu> = {
    ...state.statlar,
    [statId]: {
      deger: yeniDeger,
      ilerleme: yeniIlerleme,
    },
  };

  const oncekiAcik = new Set(turetilmis.acikHamleIds);
  const yeniAcilanHamleler = HAMLE_LISTESI.filter(
    (h) =>
      !oncekiAcik.has(h.id) &&
      hamleAcikMi(h, yeniStatlar, state.acikYetenekIds ?? [], state.ogrenilenHocaDersIds ?? [])
  );

  const esikOdul = statEsikPuanlariniKontrolEt(yeniStatlar, state.kazanilanStatEsikleri ?? []);

  let mesaj = `${evdeMi ? 'Evde torbada' : tanim.antrenmanAdi}: ${tanim.isim} +${kazanilanIlerleme}% ilerleme.`;
  if (girisUcreti > 0) {
    mesaj = `Salon günlük girişi (${girisUcreti} ₺) ödendi. ` + mesaj;
  }
  let tur: GunlukKayit['tur'] = 'bilgi';
  if (seviyeArtisi > 0) {
    mesaj = `${tanim.isim} ${yeniDeger} seviyesine yükseldi!`;
    tur = 'basari';
  }
  if (esikOdul.ekPuan > 0) {
    mesaj += esikOdul.mesajNotu;
    tur = 'basari';
  }
  if (yeniAcilanHamleler.length > 0) {
    const isimler = yeniAcilanHamleler.map((h) => h.isim).join(', ');
    mesaj += ` Yeni hamle açıldı: ${isimler}.`;
    tur = 'basari';
  }

  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(state.uyku, -tanim.yorgunlukArtisi);
  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + tanim.sureDakika),
    metin: mesaj,
    tur,
  };

  const araState: OyunDurumu = {
    ...state,
    para: state.para - girisUcreti,
    salonGirisGunu: !evdeMi ? state.gun : state.salonGirisGunu,
    enerji: sinirla(state.enerji - tanim.enerjiMaliyeti, 0, state.maksEnerji),
    tokluk: sinirla(state.tokluk - tanim.toklukMaliyeti, 0, 100),
    uyku,
    yorgunluk,
    statlar: yeniStatlar,
    yetenekPuani: (state.yetenekPuani ?? 0) + esikOdul.ekPuan,
    kazanilanStatEsikleri: esikOdul.yeniEsikler,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, tanim.sureDakika, rng);
}

/**
 * Sokak arenasında ücretsiz gölge boksu: parası kalmayan oyuncular için ücretsiz çeviklik çalışması.
 */
export function sokakGolgeBoksu(
  state: OyunDurumu,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const ant = DENGE.antrenman;
  const sure = DENGE.zaman.sokakGolgeBoksuDakika;
  if (state.enerji < ant.sokakGolgeBoksuEnerji) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Sokakta gölge boksu için bile en az ${ant.sokakGolgeBoksuEnerji} EN gerek. Biraz ye ya da evde uyu.`,
        tur: 'uyari',
      },
    };
  }

  const turetilmis = hesaplaTuretilmisDegerler(state);
  const kazanilan = Math.max(
    ant.sokakGolgeBoksuMinIlerleme,
    Math.round(ant.sokakGolgeBoksuIlerleme * (turetilmis.antrenmanVerimi / 100))
  );
  const eskiStat = state.statlar.ceviklik;
  const toplam = eskiStat.ilerleme + kazanilan;
  const seviyeArtisi = Math.floor(toplam / 100);

  const yeniStatlar: Record<StatId, StatDurumu> = {
    ...state.statlar,
    ceviklik: {
      deger: eskiStat.deger + seviyeArtisi,
      ilerleme: toplam % 100,
    },
  };

  const esikOdul = statEsikPuanlariniKontrolEt(yeniStatlar, state.kazanilanStatEsikleri ?? []);
  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(state.uyku, -ant.sokakGolgeBoksuUykuKaybi);
  const temelMetin =
    seviyeArtisi > 0
      ? `Sokak lambası altında gölge boksu! Çeviklik ${eskiStat.deger + seviyeArtisi} seviyesine çıktı.`
      : `Sokak lambası altında ücretsiz gölge boksu yaptın: Çeviklik +${kazanilan}%.`;
  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + sure),
    metin: temelMetin + esikOdul.mesajNotu,
    tur: seviyeArtisi > 0 || esikOdul.ekPuan > 0 ? 'basari' : 'bilgi',
  };

  const araState: OyunDurumu = {
    ...state,
    enerji: sinirla(state.enerji - ant.sokakGolgeBoksuEnerji, 0, state.maksEnerji),
    tokluk: sinirla(state.tokluk - ant.sokakGolgeBoksuTokluk, 0, 100),
    uyku,
    yorgunluk,
    statlar: yeniStatlar,
    yetenekPuani: (state.yetenekPuani ?? 0) + esikOdul.ekPuan,
    kazanilanStatEsikleri: esikOdul.yeniEsikler,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, sure, rng);
}

/**
 * İş yerinde vardiya tamamlar: zaman, enerji ve tokluk harcar; para ve itibar kazandırır.
 */
export function vardiyaYap(
  state: OyunDurumu,
  isId: string,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const is = IS_HARITASI.get(isId);
  if (!is) return state;

  if (is.gerekliSaygi && state.itibar.saygi < is.gerekliSaygi) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${is.isim} için en az ${is.gerekliSaygi} Saygı gerekiyor (Mevcut: ${state.itibar.saygi}).`,
        tur: 'uyari',
      },
    };
  }

  if (is.gerekliKorku && state.itibar.korku < is.gerekliKorku) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${is.isim} için en az ${is.gerekliKorku} Korku gerekiyor (Mevcut: ${state.itibar.korku}).`,
        tur: 'uyari',
      },
    };
  }

  if (state.enerji < is.enerjiMaliyeti) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${is.isim} için yeterli enerjin kalmadı (${is.enerjiMaliyeti} EN gerek).`,
        tur: 'uyari',
      },
    };
  }

  const arbedeOlduMu = Boolean(is.riskOrani && rng() < is.riskOrani);
  const ekEnerjiKaybi = arbedeOlduMu ? DENGE.ekonomiVeYasam.arbedeEkEnerjiKaybi : 0;
  const ekUykuKaybi = arbedeOlduMu ? DENGE.ekonomiVeYasam.arbedeEkUykuKaybi : 0;

  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -(is.yorgunlukArtisi + ekUykuKaybi)
  );
  const yeniItibar = itibarDengesiUygula(state.itibar, {
    saygiDelta: is.saygiEtkisi ?? 0,
    korkuDelta: is.korkuEtkisi ?? 0,
  });

  const itibarNotu =
    (is.saygiEtkisi || is.korkuEtkisi)
      ? [
          is.saygiEtkisi ? `${is.saygiEtkisi > 0 ? '+' : ''}${is.saygiEtkisi} Saygı` : '',
          is.korkuEtkisi ? `${is.korkuEtkisi > 0 ? '+' : ''}${is.korkuEtkisi} Korku` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : '';

  const mesaj = arbedeOlduMu
    ? `${is.isim} sırasında arbede çıktı! +${is.paraOdulu} ₺ aldın ama -${ekEnerjiKaybi} EN, -${ekUykuKaybi} Uyku kaybettin.`
    : `${is.isim} tamamlandı (${is.sureDakika} dk). Cebine +${is.paraOdulu} ₺ girdi.${itibarNotu ? ` (${itibarNotu})` : ''}`;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + is.sureDakika),
    metin: mesaj,
    tur: arbedeOlduMu ? 'uyari' : 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    enerji: sinirla(state.enerji - (is.enerjiMaliyeti + ekEnerjiKaybi), 0, state.maksEnerji),
    tokluk: sinirla(state.tokluk - is.toklukMaliyeti, 0, 100),
    uyku,
    yorgunluk,
    para: state.para + is.paraOdulu,
    moral: sinirla(state.moral + is.moralEtkisi, 0, 100),
    itibar: yeniItibar,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, is.sureDakika, rng);
}

// Geriye dönük uyumluluk için takma ad
export const ekIsYap = vardiyaYap;

/**
 * Ev buzdolabından veya marketten yemek yer / ev için erzak satın alır (Saygı indirimi uygulanır).
 */
export function yemekYe(
  state: OyunDurumu,
  yemekId: string,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const yemek = YEMEK_HARITASI.get(yemekId);
  if (!yemek) return state;

  const turetilmis = hesaplaTuretilmisDegerler(state);
  const indirim = yemek.mekan === 'market' ? turetilmis.marketIndirimYuzde : 0;
  const etkinFiyat = yemek.fiyat > 0 ? indirimliMarketFiyati(yemek.fiyat, indirim) : 0;

  if (etkinFiyat > state.para) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${yemek.isim} için ${etkinFiyat} ₺ gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  if (yemek.stokTuketimi && state.buzdolabiStok < yemek.stokTuketimi) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Buzdolabında hazır yemek kalmadı. Marketten erzak al ya da zor durumdaysan Emine’nin çorbasından iç.',
        tur: 'uyari',
      },
    };
  }

  const yeniStok =
    state.buzdolabiStok - (yemek.stokTuketimi ?? 0) + (yemek.stokKazanci ?? 0);

  const indirimNotu = indirim > 0 ? ` (%${indirim} Saygı indirimi)` : '';
  const mesaj =
    yemek.tur === 'erzak_stok'
      ? `${yemek.isim} alındı (-${etkinFiyat} ₺${indirimNotu}). Ev buzdolabında artık ${yeniStok} öğün var.`
      : `${yemek.isim} yedin (+${yemek.toklukArtisi} Tokluk, +${yemek.enerjiArtisi} EN${indirimNotu ? `, -${etkinFiyat} ₺` : ''}).`;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + yemek.sureDakika),
    metin: mesaj,
    tur: 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    para: state.para - etkinFiyat,
    buzdolabiStok: Math.max(0, yeniStok),
    tokluk: sinirla(state.tokluk + yemek.toklukArtisi, 0, 100),
    enerji: sinirla(state.enerji + yemek.enerjiArtisi, 0, state.maksEnerji),
    moral: sinirla(state.moral + yemek.moralEtkisi, 0, 100),
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, yemek.sureDakika, rng);
}

/**
 * Anti-ölüm sarmalı: Para bitip buzdolabı boşaldığında Emine'nin kaynattığı ücretsiz sıcak çorba.
 */
export function acilCorbaIc(
  state: OyunDurumu,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const ek = DENGE.ekonomiVeYasam;
  const corbaSure = DENGE.zaman.acilCorbaDakika;
  if (state.para >= ek.acilCorbaMaxPara || state.buzdolabiStok > 0 || state.tokluk >= ek.acilCorbaMaxTokluk) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Tencerede son kalan çorbayı yalnızca gerçekten sıkıştığında (düşük para, boş dolap ve açlıkta) içebilirsin.',
        tur: 'bilgi',
      },
    };
  }

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + corbaSure),
    metin:
      `Emine mutfakta kalan mercimekle sıcak bir kase çorba uzattı: "Ayakta kal yeter Kerem." (+${ek.acilCorbaTokluk} Tokluk, +${ek.acilCorbaEnerji} EN)`,
    tur: 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    tokluk: sinirla(state.tokluk + ek.acilCorbaTokluk, 0, 100),
    enerji: sinirla(state.enerji + ek.acilCorbaEnerji, 0, state.maksEnerji),
    moral: sinirla(state.moral + ek.acilCorbaMoral, 0, 100),
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, corbaSure, rng);
}

/**
 * Evde anne Emine veya kardeş Elif ile günlük kısa etkileşim (günde 1 kez kişi başı).
 * Seçimler, itibar (Saygı/Korku) ve aile ilişkisi diyaloğa yansır; ayrıca +1 Saygı telafisi sağlar.
 */
export function aileyleEtkiles(
  state: OyunDurumu,
  uyeId: 'anne_emine' | 'kardes_elif',
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const ek = DENGE.ekonomiVeYasam;
  const aileSure = DENGE.zaman.aileEtkilesimDakika;
  const secimler = state.ahlakiSecimler ?? [];
  const korkuBaskin =
    state.itibar.korku >= ITIBAR_SABITLERI.korkuEsik1 &&
    state.itibar.korku > state.itibar.saygi;
  const saygiYuksek = state.itibar.saygi >= ITIBAR_SABITLERI.saygiEsik1;
  const aileBağı = state.aileIliskisi ?? DENGE.baslangic.aileIliskisi;

  if (uyeId === 'anne_emine') {
    if (state.anneKonusmaGunu === state.gun) {
      return {
        ...state,
        sonBildirim: {
          gun: state.gun,
          saatMetni: saatMetni(state.saatDakika),
          metin: 'Annen Emine bugün zaten dinleniyor; akşama kadar işini hallet.',
          tur: 'bilgi',
        },
      };
    }

    let secilen: string;
    if (secimler.includes('haracci_kabul') || (korkuBaskin && aileBağı < 65)) {
      secilen =
        'Emine çay bardağını masaya bırakıp gözlerine baktı: "Kerem, kapıda adın korkuyla anılır olmuş. Baban sertti ama kimsenin rızkına el uzatmazdı, karanlık adamlardan uzak dur."';
    } else if (secimler.includes('aile_riskli_koli')) {
      secilen =
        'Emine ilaç kutusuna bakıp fısıldadı: "İlacımı aldın oğlum ama gece kimle iş yaptığını bilmiyorum sanma. Kendini ateşe atma."';
    } else if (saygiYuksek) {
      secilen =
        'Emine gülümseyerek omzuna dokundu: "Bakkal Rıza da Şükran Teyze de senden hayırla bahsediyor Kerem. Alnın açık geziyorsun."';
    } else {
      const cumleler = [
        'Emine gözlüğünü silip "Üstünü sıkı giy Kerem, baban da soğukta kendini hiç sakınmazdı" dedi.',
        'Emine iki bardak demli çay koydu: "Kira yaklaşıyor ama kendini hırpalama, bir yolunu buluruz."',
        'Emine dikiş makinesinin başından kalkıp omzuna dokundu: "Elif seni örnek alıyor, dik dur."',
      ];
      secilen = cumleler[state.gun % cumleler.length];
    }

    const yeniItibar = itibarDengesiUygula(state.itibar, { saygiDelta: 1 });
    const kayit: GunlukKayit = {
      gun: state.gun,
      saatMetni: saatMetni(state.saatDakika + aileSure),
      metin: `${secilen} (+${ek.anneMoral} Moral, +1 Saygı)`,
      tur: 'basari',
    };

    const araState: OyunDurumu = {
      ...state,
      anneKonusmaGunu: state.gun,
      moral: sinirla(state.moral + ek.anneMoral, 0, 100),
      aileIliskisi: sinirla(aileBağı + ek.aileIliskiArtis, 0, 100),
      itibar: yeniItibar,
      sonBildirim: kayit,
      gecmis: gecmiseEkle(state.gecmis, kayit),
    };
    return zamanIlerlet(araState, aileSure, rng);
  }

  if (state.elifKonusmaGunu === state.gun) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Elif ödevine gömüldü; bugünlük dikkatini dağıtmayalım.',
        tur: 'bilgi',
      },
    };
  }

  let secilen: string;
  if (secimler.includes('alaysi_sert_ders') || korkuBaskin) {
    secilen =
      'Elif defterini kapatıp çekinerek sordu: "Abi okulun köşesindeki büyük çocuklar senden korktuklarını söylüyor... Başın belaya girmez değil mi?"';
  } else if (saygiYuksek) {
    secilen =
      'Elif gururla gülümsedi: "Bugün mahallede herkes abimin adını saygıyla söylüyordu. Benim abim bambaşka!"';
  } else {
    const cumleler = [
      'Elif matematik defterini gösterip "Abi bu soruyu beraber çözelim mi?" diye sordu. Yüzündeki tebessüm içini ısıttı.',
      'Elif gizlice eline bir mandalina sıkıştırdı: "Antrenmandan sonra yersin."',
      'Elif "Bugün okulda herkes abimin çok güçlü olduğunu söylüyor" diye fısıldadı.',
    ];
    secilen = cumleler[state.gun % cumleler.length];
  }

  const yeniItibar = itibarDengesiUygula(state.itibar, { saygiDelta: 1 });
  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + aileSure),
    metin: `${secilen} (+${ek.elifMoral} Moral, +1 Saygı)`,
    tur: 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    elifKonusmaGunu: state.gun,
    moral: sinirla(state.moral + ek.elifMoral, 0, 100),
    aileIliskisi: sinirla(aileBağı + ek.aileIliskiArtis, 0, 100),
    itibar: yeniItibar,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };
  return zamanIlerlet(araState, aileSure, rng);
}

/**
 * Eve yeni eşya satın alır (yatak, ısıtıcı, kum torbası, ağırlık seti).
 */
export function evEsyasiAl(state: OyunDurumu, esyaId: string): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const esya = ESYA_HARITASI.get(esyaId);
  if (!esya) return state;

  if (state.evEsyalari.includes(esyaId)) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${esya.isim} zaten evde kurulu.`,
        tur: 'bilgi',
      },
    };
  }

  const turetilmis = hesaplaTuretilmisDegerler(state);
  if (state.evEsyalari.length >= turetilmis.mevcutEv.esyaKapasitesi) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Evin eşya alanı dolu (${turetilmis.mevcutEv.esyaKapasitesi}). Daha büyük daireye taşınmalısın.`,
        tur: 'uyari',
      },
    };
  }

  if (state.para < esya.fiyat) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${esya.isim} için ${esya.fiyat} ₺ gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika),
    metin: `${esya.isim} eve kuruldu (-${esya.fiyat} ₺). Odadaki yeri hemen belli oldu.`,
    tur: 'basari',
  };

  return {
    ...state,
    para: state.para - esya.fiyat,
    evEsyalari: [...state.evEsyalari, esya.id],
    moral: sinirla(state.moral + DENGE.ekonomiVeYasam.evEsyasiMoralBonus, 0, 100),
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };
}

/**
 * Bir üst ev seviyesine taşınır.
 */
export function evYukselt(state: OyunDurumu): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const turetilmis = hesaplaTuretilmisDegerler(state);
  const sonrakiEv = turetilmis.sonrakiEv;

  if (!sonrakiEv) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Şu an mahalledeki en iyi dairede oturuyorsunuz.',
        tur: 'bilgi',
      },
    };
  }

  if (state.para < sonrakiEv.yukseltmeMaliyeti) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `${sonrakiEv.isim} için ${sonrakiEv.yukseltmeMaliyeti} ₺ taşınma masrafı gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika),
    metin: `Ailenle birlikte ${sonrakiEv.isim} katına taşındın. Emine ile Elif'in yüzü güldü.`,
    tur: 'basari',
  };

  return {
    ...state,
    para: state.para - sonrakiEv.yukseltmeMaliyeti,
    evSeviyesi: sonrakiEv.seviye,
    kiraUyariSayisi: 0,
    sokaktaKaliyor: false,
    moral: sinirla(state.moral + DENGE.ekonomiVeYasam.evYukseltMoralBonus, 0, 100),
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };
}

/**
 * Kapı kilitli durumdayken biriken kirayı ödeyip evi geri açar.
 */
export function kiraBorcuOde(state: OyunDurumu): OyunDurumu {
  if (olayEngeliVarMi(state) || !state.sokaktaKaliyor) return state;
  const mevcutEv = EV_SEVIYE_HARITASI.get(state.evSeviyesi) ?? EV_SEVIYELERI[0];
  if (state.para < mevcutEv.haftalikKira) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Kapıyı açtırmak için ${mevcutEv.haftalikKira} ₺ gerekiyor.`,
        tur: 'uyari',
      },
    };
  }
  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika),
    metin: `${mevcutEv.haftalikKira} ₺ kira borcu ödendi; ev sahibi kilidi açtı, eve döndün.`,
    tur: 'basari',
  };
  return {
    ...state,
    para: state.para - mevcutEv.haftalikKira,
    kiraUyariSayisi: 0,
    sokaktaKaliyor: false,
    moral: sinirla(state.moral + DENGE.ekonomiVeYasam.kiraOdendiMoralBonus, 0, 100),
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };
}

/**
 * Evde yatağa girip günü bitirir ve 08:00'da yeni güne başlar.
 */
export function evdeUyuVeGunuBitir(
  state: OyunDurumu,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  return yeniGuneGec(state, false, rng);
}

// Geriye dönük uyumluluk için takma ad
export const gunuBitir = evdeUyuVeGunuBitir;

/**
 * Aktif ev veya ahlaki olayda seçilen seçeneğin sonuçlarını uygular.
 */
export function olaySecenegiUygula(
  state: OyunDurumu,
  secenekId: string,
  rng: () => number = Math.random
): OyunDurumu {
  const olay = state.aktifOlay;
  if (!olay) return state;

  const secenek: OlaySecenegi | undefined = olay.secenekler.find(
    (s) => s.id === secenekId
  );
  if (!secenek) return state;

  const etkiler = secenek.etkiler;
  const gerekenPara =
    secenek.minParaGerekli ??
    (etkiler.para && etkiler.para < 0 ? Math.abs(etkiler.para) : 0);
  if (gerekenPara > 0 && state.para < gerekenPara) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Bu seçenek için ${gerekenPara} ₺ gerekiyor; paran yetersiz.`,
        tur: 'uyari',
      },
    };
  }

  const gerekenEnerji =
    secenek.minEnerjiGerekli ??
    (etkiler.enerji && etkiler.enerji < 0 ? Math.abs(etkiler.enerji) : 0);
  if (gerekenEnerji > 0 && state.enerji < gerekenEnerji) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Bu seçenek için en az ${gerekenEnerji} EN gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  const yeniPara = Math.max(0, state.para + (etkiler.para ?? 0));
  const yeniMoral = sinirla(state.moral + (etkiler.moral ?? 0), 0, 100);
  const yeniEnerji = sinirla(state.enerji + (etkiler.enerji ?? 0), 0, state.maksEnerji);
  const yeniTokluk = sinirla(state.tokluk + (etkiler.tokluk ?? 0), 0, 100);
  const yeniStok = Math.max(0, state.buzdolabiStok + (etkiler.buzdolabiStok ?? 0));
  const yeniAileIliskisi = sinirla(
    (state.aileIliskisi ?? 60) + (etkiler.aileIliskisi ?? 0),
    0,
    100
  );
  const { uyku: yeniUyku, yorgunluk: yeniYorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -(etkiler.yorgunluk ?? 0)
  );

  const yeniItibar = itibarDengesiUygula(state.itibar, {
    itibarDelta: etkiler.itibar ?? 0,
    saygiDelta: etkiler.saygi ?? 0,
    korkuDelta: etkiler.korku ?? 0,
  });

  const yeniStatlar = { ...state.statlar };
  if (etkiler.statIlerleme) {
    for (const [statKey, puan] of Object.entries(etkiler.statIlerleme)) {
      const statId = statKey as StatId;
      const mevcut = yeniStatlar[statId];
      if (!mevcut || !puan) continue;
      const toplam = mevcut.ilerleme + puan;
      const tasima = Math.floor(toplam / 100);
      yeniStatlar[statId] = {
        deger: Math.max(1, mevcut.deger + tasima),
        ilerleme: ((toplam % 100) + 100) % 100,
      };
    }
  }

  const esikOdul = statEsikPuanlariniKontrolEt(yeniStatlar, state.kazanilanStatEsikleri ?? []);
  const sonucMetni = metinSablonunuDoldur(secenek.sonucMetni, state) + esikOdul.mesajNotu;
  const gecenSure = etkiler.sureDakika ?? 0;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + gecenSure),
    metin: sonucMetni,
    tur: 'olay',
  };

  const eskiTekil = state.tamamlananTekilOlayIds ?? [];
  const tamamlananTekilOlayIds =
    olay.tekSeferlik && !eskiTekil.includes(olay.id)
      ? [...eskiTekil, olay.id]
      : eskiTekil;

  const eskiAhlaki = state.ahlakiSecimler ?? [];
  const ahlakiSecimler =
    olay.kategori === 'ahlaki' && !eskiAhlaki.includes(secenek.id)
      ? [...eskiAhlaki, secenek.id]
      : eskiAhlaki;

  const araState: OyunDurumu = {
    ...state,
    para: yeniPara,
    moral: yeniMoral,
    enerji: yeniEnerji,
    tokluk: yeniTokluk,
    buzdolabiStok: yeniStok,
    uyku: yeniUyku,
    yorgunluk: yeniYorgunluk,
    itibar: yeniItibar,
    aileIliskisi: yeniAileIliskisi,
    ahlakiSecimler,
    statlar: yeniStatlar,
    yetenekPuani: (state.yetenekPuani ?? 0) + esikOdul.ekPuan,
    kazanilanStatEsikleri: esikOdul.yeniEsikler,
    aktifOlay: null,
    sonOlayId: olay.id,
    tamamlananTekilOlayIds,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return gecenSure > 0 ? zamanIlerlet(araState, gecenSure, rng) : araState;
}

/**
 * Oyuncunun Sokak Arenasında maça çıkmaya fiziksel olarak hazır olup olmadığını kontrol eder.
 */
export function macaGirilebilirMi(state: OyunDurumu): { uygun: boolean; neden?: string } {
  if (olayEngeliVarMi(state)) {
    return { uygun: false, neden: 'Önce aktif olayı çözmelisin.' };
  }
  if (state.enerji < DOVUS_SABITLERI.macEnerjiMaliyeti) {
    return {
      uygun: false,
      neden: `Maç için en az ${DOVUS_SABITLERI.macEnerjiMaliyeti} EN gerekiyor.`,
    };
  }
  if (state.tokluk < DENGE.dovus.minToklukEsigi) {
    return {
      uygun: false,
      neden: 'Açlıktan ayakta duramıyorsun; dövüşten önce biraz yemek yemelisin.',
    };
  }
  return { uygun: true };
}

export interface MacSonucOzeti {
  kazanan: 'oyuncu' | 'rakip' | 'berabere';
  paraDegisimi: number;
  itibarDegisimi: number;
  saygiDegisimi?: number;
  korkuDegisimi?: number;
  moralDegisimi: number;
  yetenekPuaniDegisimi?: number;
  statNotu: string;
}

/**
 * Gerçek zamanlı sokak maçı bittiğinde para, itibar (Saygı/Korku dengesi), moral, enerji, zaman ve stat deneyimini uygular.
 */
export function dovusSonucunuUygula(
  state: OyunDurumu,
  rakipId: string,
  kazanan: 'oyuncu' | 'rakip' | 'berabere',
  rng: () => number = Math.random
): { yeniDurum: OyunDurumu; ozet: MacSonucOzeti } {
  const rakip = RAKIP_HARITASI.get(rakipId) ?? RAKIP_LISTESI[0];
  const oncekiYenilenler = state.yenilenRakipIds ?? [];
  const ilkGalibiyetMi = kazanan === 'oyuncu' && !oncekiYenilenler.includes(rakip.id);
  const tavir: RingTavri = state.ringTavri ?? 'dengeli';

  let paraDegisimi = 0;
  let itibarDegisimi = 0;
  let hamSaygiDelta = 0;
  let hamKorkuDelta = 0;
  let moralDegisimi = 0;
  let statId: StatId = 'dayaniklilik';
  let statPuan = 14;
  let statNotu = 'Dayanıklılık +14%';

  const dDenge = DENGE.dovus;
  if (kazanan === 'oyuncu') {
    paraDegisimi = rakip.paraOdulu;
    itibarDegisimi = rakip.itibarOdulu + (ilkGalibiyetMi ? 1 : 0);
    if (tavir === 'temiz') {
      hamSaygiDelta = Math.max(dDenge.galibiyetMinSaygiKorku, rakip.itibarOdulu);
      hamKorkuDelta = 0;
    } else if (tavir === 'sert') {
      hamSaygiDelta = 0;
      hamKorkuDelta = Math.max(dDenge.galibiyetMinSaygiKorku, rakip.itibarOdulu);
    } else {
      hamSaygiDelta = Math.ceil(rakip.itibarOdulu * dDenge.dengeliSaygiOran);
      hamKorkuDelta = Math.max(1, Math.floor(rakip.itibarOdulu * dDenge.dengeliKorkuOran));
    }
    moralDegisimi = dDenge.kazanmaMoral;
    statId = rakip.tarz === 'cevik' ? 'ceviklik' : 'guc';
    statPuan = dDenge.kazanmaStatPuan;
    statNotu = `${statId === 'ceviklik' ? 'Çeviklik' : 'Güç'} +${statPuan}%`;
  } else if (kazanan === 'berabere') {
    paraDegisimi = Math.round(rakip.paraOdulu * dDenge.berabereParaOran);
    itibarDegisimi = 1;
    hamSaygiDelta = 1;
    hamKorkuDelta = tavir === 'sert' ? 1 : 0;
    moralDegisimi = dDenge.berabereMoral;
    statId = 'refleks';
    statPuan = dDenge.berabereStatPuan;
    statNotu = `Refleks +${statPuan}%`;
  } else {
    paraDegisimi = rakip.teselliPara;
    itibarDegisimi = 0;
    hamSaygiDelta = tavir === 'temiz' ? 1 : 0;
    moralDegisimi = dDenge.kaybetmeMoral;
    statId = 'dayaniklilik';
    statPuan = dDenge.kaybetmeStatPuan;
    statNotu = `Dayanıklılık +${statPuan}%`;
  }

  const eskiStat = state.statlar[statId];
  const toplamIlerleme = eskiStat.ilerleme + statPuan;
  const yeniStatlar: Record<StatId, StatDurumu> = {
    ...state.statlar,
    [statId]: {
      deger: eskiStat.deger + Math.floor(toplamIlerleme / 100),
      ilerleme: toplamIlerleme % 100,
    },
  };

  const yenilenRakipIds =
    kazanan === 'oyuncu' && !oncekiYenilenler.includes(rakip.id)
      ? [...oncekiYenilenler, rakip.id]
      : oncekiYenilenler;

  const esikOdul = statEsikPuanlariniKontrolEt(yeniStatlar, state.kazanilanStatEsikleri ?? []);
  const macYetenekPuani =
    kazanan === 'oyuncu'
      ? dDenge.kazanmaYetenekPuani + (ilkGalibiyetMi ? dDenge.ilkGalibiyetBonusYp : 0)
      : 0;
  const toplamYetenekPuaniDegisimi = macYetenekPuani + esikOdul.ekPuan;

  const yeniItibar = itibarDengesiUygula(state.itibar, {
    itibarDelta: itibarDegisimi,
    saygiDelta: hamSaygiDelta,
    korkuDelta: hamKorkuDelta,
  });
  const saygiDegisimi = yeniItibar.saygi - state.itibar.saygi;
  const korkuDegisimi = yeniItibar.korku - state.itibar.korku;

  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -DOVUS_SABITLERI.macUykuKaybi
  );

  const ypNotu = macYetenekPuani > 0 ? ` +${macYetenekPuani} YP!` : '';
  const itibarParcalari = [
    saygiDegisimi !== 0 ? `${saygiDegisimi > 0 ? '+' : ''}${saygiDegisimi} Saygı` : '',
    korkuDegisimi !== 0 ? `${korkuDegisimi > 0 ? '+' : ''}${korkuDegisimi} Korku` : '',
  ].filter(Boolean);
  const itibarOzetMetni =
    itibarParcalari.length > 0 ? ` (${itibarParcalari.join(', ')})` : '';

  const sonucMetni =
    (kazanan === 'oyuncu'
      ? `${rakip.lakap} nakavtla devrildi! +${paraDegisimi} ₺, +${itibarDegisimi} İtibar${itibarOzetMetni}, +${moralDegisimi} Moral.${ypNotu}`
      : kazanan === 'berabere'
        ? `${rakip.lakap} ile süre doldu (berabere). +${paraDegisimi} ₺ pay aldın${itibarOzetMetni}.`
        : `${rakip.lakap} karşısında düştün. Seyirci bozukluğu +${paraDegisimi} ₺ verdi; sertleştin (${statNotu}).`) +
    esikOdul.mesajNotu;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + DOVUS_SABITLERI.macSureDakika),
    metin: sonucMetni,
    tur: kazanan === 'oyuncu' ? 'basari' : kazanan === 'berabere' ? 'bilgi' : 'uyari',
  };

  const araState: OyunDurumu = {
    ...state,
    para: Math.max(0, state.para + paraDegisimi),
    enerji: sinirla(state.enerji - DOVUS_SABITLERI.macEnerjiMaliyeti, 0, state.maksEnerji),
    tokluk: sinirla(state.tokluk - DOVUS_SABITLERI.macToklukMaliyeti, 0, 100),
    uyku,
    yorgunluk,
    moral: sinirla(state.moral + moralDegisimi, 0, 100),
    itibar: yeniItibar,
    statlar: yeniStatlar,
    macKazanmaSayisi: (state.macKazanmaSayisi ?? 0) + (kazanan === 'oyuncu' ? 1 : 0),
    toplamDovusSayisi: (state.toplamDovusSayisi ?? 0) + 1,
    aktifDovusRakipId: null,
    yenilenRakipIds,
    yetenekPuani: (state.yetenekPuani ?? 0) + toplamYetenekPuaniDegisimi,
    kazanilanStatEsikleri: esikOdul.yeniEsikler,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return {
    yeniDurum: zamanIlerlet(araState, DOVUS_SABITLERI.macSureDakika, rng),
    ozet: {
      kazanan,
      paraDegisimi,
      itibarDegisimi,
      saygiDegisimi,
      korkuDegisimi,
      moralDegisimi,
      yetenekPuaniDegisimi: toplamYetenekPuaniDegisimi,
      statNotu,
    },
  };
}

/**
 * ============================================================================
 * C2 AŞAMASI: ANTRENÖR DERSLERİ VE KOMŞU HİKAYE ZİNCİRLERİ
 * ============================================================================
 */

/**
 * Spor salonundaki bir antrenör dersinin öğrenilebilirlik durumunu kontrol eder.
 */
export function hocaDersiAlinabilirMi(
  state: OyunDurumu,
  dersId: string
): { ogrenildiMi: boolean; alinabilir: boolean; neden?: string; ders?: AntrenorDersi } {
  const ders = HOCA_DERS_HARITASI.get(dersId);
  if (!ders) {
    return { ogrenildiMi: false, alinabilir: false, neden: 'Ders bulunamadı.' };
  }

  const ogrenilenler = state.ogrenilenHocaDersIds ?? [];
  if (ogrenilenler.includes(dersId)) {
    return { ogrenildiMi: true, alinabilir: false, ders };
  }

  if (ders.oncekiDersId && !ogrenilenler.includes(ders.oncekiDersId)) {
    const onceki = HOCA_DERS_HARITASI.get(ders.oncekiDersId);
    return {
      ogrenildiMi: false,
      alinabilir: false,
      neden: `Önce "${onceki?.isim ?? ders.oncekiDersId}" alınmalı.`,
      ders,
    };
  }

  for (const [statKey, minDeger] of Object.entries(ders.statSarti)) {
    const statId = statKey as StatId;
    const mevcut = state.statlar[statId]?.deger ?? 0;
    if (mevcut < (minDeger ?? 0)) {
      const statTanim = STAT_HARITASI.get(statId);
      return {
        ogrenildiMi: false,
        alinabilir: false,
        neden: `Gereken: ${statTanim?.isim ?? statId} ${minDeger}`,
        ders,
      };
    }
  }

  if (state.para < ders.paraMaliyeti) {
    return {
      ogrenildiMi: false,
      alinabilir: false,
      neden: `${ders.paraMaliyeti} ₺ gerekiyor.`,
      ders,
    };
  }

  if (state.enerji < ders.enerjiMaliyeti) {
    return {
      ogrenildiMi: false,
      alinabilir: false,
      neden: `${ders.enerjiMaliyeti} EN gerekiyor.`,
      ders,
    };
  }

  return { ogrenildiMi: false, alinabilir: true, ders };
}

/**
 * Spor salonu antrenöründen özel ders alır (para + zaman + enerji harcar, kalıcı hamle/pasif öğretir).
 */
export function hocaDersiAl(
  state: OyunDurumu,
  dersId: string,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const kontrol = hocaDersiAlinabilirMi(state, dersId);
  if (!kontrol.alinabilir || !kontrol.ders) {
    if (!kontrol.neden) return state;
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: kontrol.neden,
        tur: 'uyari',
      },
    };
  }

  const ders = kontrol.ders;
  const hoca = ANTRENOR_HARITASI.get(ders.antrenorId);
  const yeniDersler = [...(state.ogrenilenHocaDersIds ?? []), ders.id];
  const acilanHamle = ders.etki.acilanHamleId
    ? HAMLE_HARITASI.get(ders.etki.acilanHamleId)
    : undefined;

  const ek = DENGE.ekonomiVeYasam;
  const { uyku, yorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -Math.max(ek.hocaMinUykuKaybi, Math.round(ders.enerjiMaliyeti * ek.hocaEnerjiUykuCarpani))
  );

  const mesaj = acilanHamle
    ? `${hoca?.isim ?? 'Antrenör'} ile "${ders.isim}" tamamlandı! Yeni hamle "${acilanHamle.isim}" [${acilanHamle.kisayolTusu}] açıldı.`
    : `${hoca?.isim ?? 'Antrenör'} ile "${ders.isim}" tamamlandı (${ders.ozetEtiket}).`;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + ders.sureDakika),
    metin: mesaj,
    tur: 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    para: Math.max(0, state.para - ders.paraMaliyeti),
    enerji: sinirla(state.enerji - ders.enerjiMaliyeti, 0, state.maksEnerji),
    uyku,
    yorgunluk,
    yetenekPuani: (state.yetenekPuani ?? 0) + (ders.etki.ekYetenekPuani ?? 0),
    ogrenilenHocaDersIds: yeniDersler,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, ders.sureDakika, rng);
}

/**
 * Bir komşu olayının koşullarının mevcut oyun durumunda sağlanıp sağlanmadığını denetler.
 */
export function komsuOlayKosuluUygunMu(
  state: OyunDurumu,
  kosul: KomsuOlayKosulu
): boolean {
  if (kosul.minGun !== undefined && state.gun < kosul.minGun) return false;
  if (kosul.minPara !== undefined && state.para < kosul.minPara) return false;
  if (kosul.maksPara !== undefined && state.para > kosul.maksPara) return false;
  if (
    kosul.minMacGalibiyet !== undefined &&
    (state.macKazanmaSayisi ?? 0) < kosul.minMacGalibiyet
  ) {
    return false;
  }
  const secimler = state.komsuSecimleri ?? [];
  if (kosul.gerekliSecimId && !secimler.includes(kosul.gerekliSecimId)) {
    return false;
  }
  const bayraklar = state.komsuBayraklari ?? [];
  if (kosul.gerekliBayrak && !bayraklar.includes(kosul.gerekliBayrak)) {
    return false;
  }
  if (kosul.haricBayrak && bayraklar.includes(kosul.haricBayrak)) {
    return false;
  }
  return true;
}

/**
 * Verilen komşu için sıradaki uygun hikaye olayını bulur.
 */
export function komsuMusaitOlayiGetir(
  state: OyunDurumu,
  komsuId: string,
  mekanFilter?: MekanId
): KomsuHikayeOlayi | null {
  const tamamlananAdim = state.komsuAdimlari?.[komsuId] ?? 0;
  const hedefAdim = tamamlananAdim + 1;

  const aday = KOMSU_OLAYLARI.find((olay) => {
    if (olay.komsuId !== komsuId) return false;
    if (olay.adim !== hedefAdim) return false;
    if (mekanFilter && !olay.mekanlar.includes(mekanFilter)) return false;
    return komsuOlayKosuluUygunMu(state, olay.kosul);
  });

  return aday ?? null;
}

export interface MekandakiKomsuDurumu {
  komsu: KomsuTanimi;
  olay: KomsuHikayeOlayi | null;
  sonrakiAdimKosulu: KomsuHikayeOlayi | null;
  tamamlandiMi: boolean;
  mevcutAdim: number;
  toplamAdim: number;
}

/**
 * Aktif mekanda görülebilen sabit komşuları ve hikaye zinciri ilerlemelerini listeler.
 */
export function mekandakiMusaitKomsuOlaylari(
  state: OyunDurumu,
  mekanId: MekanId
): MekandakiKomsuDurumu[] {
  return KOMSU_LISTESI.filter((k) => k.mekanlar.includes(mekanId)).map((komsu) => {
    const komsuOlaylari = KOMSU_OLAYLARI.filter((o) => o.komsuId === komsu.id);
    const toplamAdim = komsuOlaylari.reduce((maks, o) => Math.max(maks, o.adim), 0);
    const mevcutAdim = state.komsuAdimlari?.[komsu.id] ?? 0;
    const tamamlandiMi = mevcutAdim >= toplamAdim && toplamAdim > 0;
    const olay = komsuMusaitOlayiGetir(state, komsu.id, mekanId);
    const sonrakiAdimKosulu =
      !olay && !tamamlandiMi
        ? komsuOlaylari.find(
            (o) =>
              o.adim === mevcutAdim + 1 &&
              (!o.kosul.gerekliBayrak ||
                (state.komsuBayraklari ?? []).includes(o.kosul.gerekliBayrak))
          ) ?? null
        : null;

    return {
      komsu,
      olay,
      sonrakiAdimKosulu,
      tamamlandiMi,
      mevcutAdim,
      toplamAdim,
    };
  });
}

/**
 * Oyuncu mekandaki bir komşuyla görüşmeyi başlattığında uygun hikaye olayını açar.
 */
export function komsuEtkilesimiBaslat(
  state: OyunDurumu,
  komsuId: string
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const komsu = KOMSU_HARITASI.get(komsuId);
  if (!komsu) return state;

  const olay = komsuMusaitOlayiGetir(state, komsuId, state.aktifMekan);
  if (!olay) {
    const sonraki = KOMSU_OLAYLARI.find(
      (o) =>
        o.komsuId === komsuId &&
        o.adim === (state.komsuAdimlari?.[komsuId] ?? 0) + 1 &&
        (!o.kosul.gerekliBayrak ||
          (state.komsuBayraklari ?? []).includes(o.kosul.gerekliBayrak))
    );
    let ipucu = `${komsu.isim} ile şimdilik konuşulacak yeni bir şey yok.`;
    if (sonraki) {
      if (!sonraki.mekanlar.includes(state.aktifMekan)) {
        const mekanAdlari = sonraki.mekanlar
          .map((m) => MEKAN_HARITASI.get(m)?.kisaAd ?? m)
          .join(' / ');
        ipucu = `${komsu.isim} seni ${mekanAdlari} tarafında bekliyor.`;
      } else if (sonraki.kosul.minGun && state.gun < sonraki.kosul.minGun) {
        ipucu = `${komsu.isim} için henüz erken (Gün ${sonraki.kosul.minGun} sonrası).`;
      } else if (
        sonraki.kosul.minMacGalibiyet &&
        (state.macKazanmaSayisi ?? 0) < sonraki.kosul.minMacGalibiyet
      ) {
        ipucu = `${komsu.isim} ile yeni olay için Sokak Arenasında ${sonraki.kosul.minMacGalibiyet} galibiyet gerekiyor.`;
      }
    }
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: ipucu,
        tur: 'bilgi',
      },
    };
  }

  return {
    ...state,
    aktifKomsuOlayi: olay,
  };
}

/**
 * Açık komşu hikaye penceresini hikayeyi ilerletmeden kapatır (ör. oyuncunun parası/enerjisi yetersizse).
 */
export function komsuOlayiniKapat(state: OyunDurumu): OyunDurumu {
  if (!state.aktifKomsuOlayi) return state;
  return {
    ...state,
    aktifKomsuOlayi: null,
  };
}

/**
 * Aktif komşu hikaye olayında seçilen seçeneğin etkilerini ve hikaye ilerlemesini uygular.
 */
export function komsuSecenegiUygula(
  state: OyunDurumu,
  secenekId: string,
  rng: () => number = Math.random
): OyunDurumu {
  const olay = state.aktifKomsuOlayi;
  if (!olay) return state;

  const secenek: KomsuOlaySecenegi | undefined = olay.secenekler.find(
    (s) => s.id === secenekId
  );
  if (!secenek) return state;

  const etkiler = secenek.etkiler;
  const gerekenPara =
    secenek.minParaGerekli ??
    (etkiler.para && etkiler.para < 0 ? Math.abs(etkiler.para) : 0);
  if (gerekenPara > 0 && state.para < gerekenPara) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Bu seçenek için ${gerekenPara} ₺ gerekiyor; paran yetersiz.`,
        tur: 'uyari',
      },
    };
  }

  const gerekenEnerji =
    secenek.minEnerjiGerekli ??
    (etkiler.enerji && etkiler.enerji < 0 ? Math.abs(etkiler.enerji) : 0);
  if (gerekenEnerji > 0 && state.enerji < gerekenEnerji) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Bu seçenek için en az ${gerekenEnerji} EN gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  const yeniPara = Math.max(0, state.para + (etkiler.para ?? 0));
  const yeniMoral = sinirla(state.moral + (etkiler.moral ?? 0), 0, 100);
  const yeniEnerji = sinirla(state.enerji + (etkiler.enerji ?? 0), 0, state.maksEnerji);
  const yeniTokluk = sinirla(state.tokluk + (etkiler.tokluk ?? 0), 0, 100);
  const yeniStok = Math.max(0, state.buzdolabiStok + (etkiler.buzdolabiStok ?? 0));
  const { uyku: yeniUyku, yorgunluk: yeniYorgunluk } = uykuVeYorgunlukAyarla(
    state.uyku,
    -(etkiler.yorgunluk ?? 0)
  );

  const yeniItibar = itibarDengesiUygula(state.itibar, {
    itibarDelta: etkiler.itibar ?? 0,
    saygiDelta: etkiler.saygi ?? 0,
    korkuDelta: etkiler.korku ?? 0,
  });
  const yeniAileIliskisi = sinirla(
    (state.aileIliskisi ?? 60) + (etkiler.aileIliskisi ?? 0),
    0,
    100
  );

  const yeniStatlar = { ...state.statlar };
  if (etkiler.statIlerleme) {
    for (const [statKey, puan] of Object.entries(etkiler.statIlerleme)) {
      const statId = statKey as StatId;
      const mevcut = yeniStatlar[statId];
      if (!mevcut || !puan) continue;
      const toplam = mevcut.ilerleme + puan;
      const tasima = Math.floor(toplam / 100);
      yeniStatlar[statId] = {
        deger: Math.max(1, mevcut.deger + tasima),
        ilerleme: ((toplam % 100) + 100) % 100,
      };
    }
  }

  const esikOdul = statEsikPuanlariniKontrolEt(yeniStatlar, state.kazanilanStatEsikleri ?? []);
  const ekYetenek = (etkiler.yetenekPuani ?? 0) + esikOdul.ekPuan;
  const sonucMetni = metinSablonunuDoldur(secenek.sonucMetni, state) + esikOdul.mesajNotu;
  const gecenSure = etkiler.sureDakika ?? 0;

  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + gecenSure),
    metin: sonucMetni,
    tur: 'olay',
  };

  const eskiSecimler = state.komsuSecimleri ?? [];
  const komsuSecimleri = eskiSecimler.includes(secenek.id)
    ? eskiSecimler
    : [...eskiSecimler, secenek.id];

  const eskiBayraklar = state.komsuBayraklari ?? [];
  const komsuBayraklari =
    etkiler.bayrakEkle && !eskiBayraklar.includes(etkiler.bayrakEkle)
      ? [...eskiBayraklar, etkiler.bayrakEkle]
      : eskiBayraklar;

  const araState: OyunDurumu = {
    ...state,
    para: yeniPara,
    moral: yeniMoral,
    enerji: yeniEnerji,
    tokluk: yeniTokluk,
    buzdolabiStok: yeniStok,
    uyku: yeniUyku,
    yorgunluk: yeniYorgunluk,
    itibar: yeniItibar,
    aileIliskisi: yeniAileIliskisi,
    statlar: yeniStatlar,
    yetenekPuani: (state.yetenekPuani ?? 0) + ekYetenek,
    kazanilanStatEsikleri: esikOdul.yeniEsikler,
    komsuAdimlari: {
      ...(state.komsuAdimlari ?? {}),
      [olay.komsuId]: Math.max(state.komsuAdimlari?.[olay.komsuId] ?? 0, olay.adim),
    },
    komsuSecimleri,
    komsuBayraklari,
    aktifKomsuOlayi: null,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return gecenSure > 0 ? zamanIlerlet(araState, gecenSure, rng) : araState;
}

/**
 * ============================================================================
 * C3 AŞAMASI: İTİBAR EŞİĞİ FIRSATLARI, RİNG TAVRI VE HİKAYE YANSIMALARI
 * ============================================================================
 */

/**
 * Saygı >= 12 olduğunda evde günde 1 kez açılan Mahalle Dayanışması yardımı (+1 Ev Yemeği, +35 ₺, +5 Moral).
 */
export function komsuDayanismasiAl(
  state: OyunDurumu,
  rng: () => number = Math.random
): OyunDurumu {
  if (olayEngeliVarMi(state)) return state;
  const turetilmis = hesaplaTuretilmisDegerler(state);
  if (!turetilmis.komsuDayanismasiAcik) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: `Mahalle Dayanışması için en az ${ITIBAR_SABITLERI.saygiEsik1} Saygı gerekiyor.`,
        tur: 'uyari',
      },
    };
  }

  if ((state.komsuDayanismaGunu ?? 0) === state.gun) {
    return {
      ...state,
      sonBildirim: {
        gun: state.gun,
        saatMetni: saatMetni(state.saatDakika),
        metin: 'Bugünkü komşu dayanışma desteğini zaten aldın.',
        tur: 'bilgi',
      },
    };
  }

  const ek = DENGE.ekonomiVeYasam;
  const sure = DENGE.zaman.komsuDayanismaDakika;
  const kayit: GunlukKayit = {
    gun: state.gun,
    saatMetni: saatMetni(state.saatDakika + sure),
    metin:
      `Alt kattan Şükran Teyze ile Bakkal Rıza kapıya sıcak yemek ve zarf içinde harçlık bıraktı (+${ek.komsuDayanismaStok} Ev Yemeği, +${ek.komsuDayanismaPara} ₺, +${ek.komsuDayanismaMoral} Moral).`,
    tur: 'basari',
  };

  const araState: OyunDurumu = {
    ...state,
    buzdolabiStok: state.buzdolabiStok + ek.komsuDayanismaStok,
    para: state.para + ek.komsuDayanismaPara,
    moral: sinirla(state.moral + ek.komsuDayanismaMoral, 0, 100),
    komsuDayanismaGunu: state.gun,
    sonBildirim: kayit,
    gecmis: gecmiseEkle(state.gecmis, kayit),
  };

  return zamanIlerlet(araState, sure, rng);
}

/**
 * Sokak Arenasında dövüş tavrını seçer (Temiz Dövüş -> Saygı, Dengeli, Sert Gözdağı -> Korku).
 */
export function ringTavriDegistir(state: OyunDurumu, tavir: RingTavri): OyunDurumu {
  const aciklama =
    tavir === 'temiz'
      ? 'Temiz Dövüş (+Saygı odaklı)'
      : tavir === 'sert'
        ? 'Sert Gözdağı (+Korku odaklı)'
        : 'Dengeli Tavır';

  return {
    ...state,
    ringTavri: tavir,
    sonBildirim: {
      gun: state.gun,
      saatMetni: saatMetni(state.saatDakika),
      metin: `Ring tavrı değiştirildi: ${aciklama}.`,
      tur: 'bilgi',
    },
  };
}

/**
 * Evdeki anne Emine ve kardeş Elif'in oyuncunun seçimleri ve itibarına göre ruh halini döndürür.
 */
export function aileRuhHaliGetir(state: OyunDurumu): {
  etiket: string;
  ton: 'sicak' | 'dengeli' | 'gergin';
  aciklama: string;
} {
  const v = DENGE.verimVeEsikler;
  const bag = state.aileIliskisi ?? DENGE.baslangic.aileIliskisi;
  const secimler = state.ahlakiSecimler ?? [];
  const karanlikSecimSayisi = ['haracci_kabul', 'aile_riskli_koli', 'alaysi_sert_ders'].filter(
    (id) => secimler.includes(id)
  ).length;

  if (bag >= v.aileSicakEsik && state.itibar.saygi >= state.itibar.korku) {
    return {
      etiket: 'Güvenli ve Sıcak',
      ton: 'sicak',
      aciklama:
        'Emine ve Elif seninle gurur duyuyor; evde kira stresi olsa da birbirinize tutunuyorsunuz.',
    };
  }

  if (
    bag < v.aileGerginEsik ||
    karanlikSecimSayisi >= v.aileKaranlikSecimEsik ||
    state.itibar.korku >= state.itibar.saygi + v.aileKorkuFarkEsik
  ) {
    return {
      etiket: 'Tedirgin ve Mesafeli',
      ton: 'gergin',
      aciklama:
        'Korku salan hamlelerin ve karanlık işlerin eve gölge düşürüyor; Emine ne iş çevirdiğini merak ediyor.',
    };
  }

  return {
    etiket: 'Temkinli Dayanışma',
    ton: 'dengeli',
    aciklama:
      'Evde hayat zor ama umut sürüyor. Aldığın kararlar Emine ile Elif’in bakışını doğrudan etkiliyor.',
  };
}

/**
 * Sabit komşuların kartlarında itibar ve ahlaki seçimlere göre kısa tepki/diyalog döndürür.
 */
export function komsuItibarYorumuGetir(komsuId: string, state: OyunDurumu): string | null {
  const saygi = state.itibar?.saygi ?? 0;
  const korku = state.itibar?.korku ?? 0;
  const secimler = state.ahlakiSecimler ?? [];

  if (komsuId === 'bakkal_riza') {
    if (secimler.includes('haracci_reddet') || saygi >= ITIBAR_SABITLERI.saygiEsik1) {
      return `Rıza: "Mahallenin yüzünü kara çıkarmadın Kerem, tezgahta her zaman indirimin hazır."`;
    }
    if (secimler.includes('haracci_kabul') || korku >= ITIBAR_SABITLERI.korkuEsik1) {
      return `Rıza: "Tefecilerin yanında göründüğün söyleniyor Kerem... Babana benzemez bu yol."`;
    }
  }

  if (komsuId === 'nuri_usta') {
    if (korku >= ITIBAR_SABITLERI.korkuEsik1) {
      return `Nuri Abi: "Çöplükteki herkes senden çekiniyor ${state.oyuncu.lakap}, ama öfkeni kontrol et."`;
    }
    if (saygi >= ITIBAR_SABITLERI.saygiEsik1) {
      return `Nuri Abi: "Baban görse seninle iftihar ederdi Kerem; sözün senet gibi."`;
    }
  }

  if (komsuId === 'ev_sahibi_kemal') {
    if (korku >= ITIBAR_SABITLERI.korkuEsik1) {
      return `Kemal: "Bakışların sertleşmiş... Kirayı vaktinde getir yeter, gerisine karışmam."`;
    }
    if (saygi >= ITIBAR_SABITLERI.saygiEsik1) {
      return `Kemal: "Esnaf sana kefil oluyor Kerem, yine de kira gününü unutma."`;
    }
  }

  if (komsuId === 'mahalle_cocuklari') {
    if (secimler.includes('alaysi_sert_ders') || korku >= ITIBAR_SABITLERI.korkuEsik1) {
      return `Yusuf: "Abi kahvedekiler adını duyunca susuyor artık! Bize de sert yumruk öğretsene!"`;
    }
    if (saygi >= ITIBAR_SABITLERI.saygiEsik1) {
      return `Yusuf: "${state.oyuncu.lakap} Abi! Herkes senin dürüst dövüşünü konuşuyor!"`;
    }
  }

  if (komsuId === 'komsu_sukran') {
    if (secimler.includes('komsu_yardim_antreman_kacir') || saygi >= ITIBAR_SABITLERI.saygiEsik1) {
      return `Şükran Teyze: "Allah razı olsun Kerem, dar gününde komşuların yanında."`;
    }
    if (secimler.includes('komsu_gormezden_gel')) {
      return `Şükran Teyze: "Geçen gün selamsız geçip gittin evladım, kalbin soğumasın."`;
    }
  }

  return null;
}

function guvenliSayi(deger: unknown, varsayilan: number, min?: number, maks?: number): number {
  if (typeof deger !== 'number' || !Number.isFinite(deger)) {
    return varsayilan;
  }
  let sonuc = deger;
  if (min !== undefined) sonuc = Math.max(min, sonuc);
  if (maks !== undefined) sonuc = Math.min(maks, sonuc);
  return sonuc;
}

function duzObjeMi(deger: unknown): deger is Record<string, unknown> {
  return Boolean(deger && typeof deger === 'object' && !Array.isArray(deger));
}

function stringDizisiSuz(deger: unknown): string[] {
  if (!Array.isArray(deger)) return [];
  return deger.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function kayitGecerliMi(deger: unknown): deger is GunlukKayit {
  if (!duzObjeMi(deger)) return false;
  return (
    typeof deger.gun === 'number' &&
    Number.isFinite(deger.gun) &&
    deger.gun >= 1 &&
    typeof deger.metin === 'string' &&
    (deger.saatMetni === undefined || typeof deger.saatMetni === 'string') &&
    (deger.tur === 'bilgi' ||
      deger.tur === 'uyari' ||
      deger.tur === 'basari' ||
      deger.tur === 'olay')
  );
}

function olaySecenegiGecerliMi(deger: unknown): deger is OlaySecenegi {
  if (!duzObjeMi(deger)) return false;
  return (
    typeof deger.id === 'string' &&
    deger.id.length > 0 &&
    typeof deger.etiket === 'string' &&
    typeof deger.ipucu === 'string' &&
    typeof deger.sonucMetni === 'string' &&
    duzObjeMi(deger.etkiler)
  );
}

function olayGecerliMi(deger: unknown): deger is EvOlayi {
  if (!duzObjeMi(deger)) return false;
  const gecerliKategori =
    deger.kategori === 'ev' ||
    deger.kategori === 'mahalle' ||
    deger.kategori === 'aile' ||
    deger.kategori === 'baski' ||
    deger.kategori === 'ahlaki';
  return (
    typeof deger.id === 'string' &&
    deger.id.length > 0 &&
    typeof deger.baslik === 'string' &&
    typeof deger.aciklama === 'string' &&
    gecerliKategori &&
    Array.isArray(deger.secenekler) &&
    deger.secenekler.length > 0 &&
    deger.secenekler.every(olaySecenegiGecerliMi)
  );
}

function komsuOlayGecerliMi(deger: unknown): deger is KomsuHikayeOlayi {
  if (!duzObjeMi(deger)) return false;
  return (
    typeof deger.id === 'string' &&
    deger.id.length > 0 &&
    typeof deger.komsuId === 'string' &&
    deger.komsuId.length > 0 &&
    typeof deger.adim === 'number' &&
    Number.isFinite(deger.adim) &&
    deger.adim >= 1 &&
    typeof deger.baslik === 'string' &&
    typeof deger.aciklama === 'string' &&
    Array.isArray(deger.secenekler) &&
    deger.secenekler.length > 0 &&
    deger.secenekler.every(olaySecenegiGecerliMi)
  );
}

function komsuAdimlariTemizle(deger: unknown): Record<string, number> {
  if (!duzObjeMi(deger)) return {};
  const sonuc: Record<string, number> = {};
  for (const [k, v] of Object.entries(deger)) {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      sonuc[k] = Math.floor(v);
    }
  }
  return sonuc;
}

/**
 * Kayıtlı ham veriyi v2 -> v3 şemasına geçirir, eksik veya bozuk alanları güvenli varsayılanlarla tamamlar.
 */
export function kaydiMigrateEt(hamVeri: unknown): OyunDurumu | null {
  if (!duzObjeMi(hamVeri)) return null;

  const kaynakSurum =
    typeof hamVeri.surum === 'number'
      ? hamVeri.surum
      : typeof hamVeri.versiyon === 'number'
        ? hamVeri.versiyon
        : null;

  if (kaynakSurum !== 2 && kaynakSurum !== KAYIT_SURUMU) {
    return null;
  }

  const oyuncuHam = hamVeri.oyuncu;
  if (!duzObjeMi(oyuncuHam) || typeof oyuncuHam.lakap !== 'string' || !oyuncuHam.lakap.trim()) {
    return null;
  }

  const statlarHam = hamVeri.statlar;
  if (!duzObjeMi(statlarHam)) return null;

  const guvenliStatlar = {} as Record<StatId, StatDurumu>;
  for (const stat of STAT_TANIMLARI) {
    const tek = statlarHam[stat.id];
    if (!duzObjeMi(tek) || typeof tek.deger !== 'number' || !Number.isFinite(tek.deger)) {
      return null;
    }
    guvenliStatlar[stat.id] = {
      deger: Math.max(1, Math.round(tek.deger)),
      ilerleme: guvenliSayi(tek.ilerleme, 0, 0, 99),
    };
  }

  const maksEnerji = guvenliSayi(hamVeri.maksEnerji, KARAKTER_SABITLERI.maksEnerji, 50, 200);
  const uyku = guvenliSayi(
    hamVeri.uyku,
    100 - KARAKTER_SABITLERI.baslangicYorgunluk,
    0,
    100
  );
  const yorgunluk = guvenliSayi(hamVeri.yorgunluk, 100 - uyku, 0, 100);

  const itibarHam = duzObjeMi(hamVeri.itibar) ? hamVeri.itibar : {};
  const aktifMekanHam = typeof hamVeri.aktifMekan === 'string' ? hamVeri.aktifMekan : 'ev';
  const aktifMekan: MekanId = MEKAN_HARITASI.has(aktifMekanHam as MekanId)
    ? (aktifMekanHam as MekanId)
    : 'ev';

  const aktifDovusHam =
    typeof hamVeri.aktifDovusRakipId === 'string' && RAKIP_HARITASI.has(hamVeri.aktifDovusRakipId)
      ? hamVeri.aktifDovusRakipId
      : null;

  const gorunumHam = duzObjeMi(oyuncuHam.gorunum) ? oyuncuHam.gorunum : {};
  const vGor = TEMA.varsayilanKarakterGorunumu;
  const guvenliGorunum: KarakterGorunumu = {
    tenRengi: typeof gorunumHam.tenRengi === 'string' ? gorunumHam.tenRengi : vGor.tenRengi,
    golgeTenRengi:
      typeof gorunumHam.golgeTenRengi === 'string'
        ? gorunumHam.golgeTenRengi
        : vGor.golgeTenRengi,
    sacRengi: typeof gorunumHam.sacRengi === 'string' ? gorunumHam.sacRengi : vGor.sacRengi,
    ustKiyafetRengi:
      typeof gorunumHam.ustKiyafetRengi === 'string'
        ? gorunumHam.ustKiyafetRengi
        : vGor.ustKiyafetRengi,
    ustKiyafetGolge:
      typeof gorunumHam.ustKiyafetGolge === 'string'
        ? gorunumHam.ustKiyafetGolge
        : vGor.ustKiyafetGolge,
    altKiyafetRengi:
      typeof gorunumHam.altKiyafetRengi === 'string'
        ? gorunumHam.altKiyafetRengi
        : vGor.altKiyafetRengi,
    bandajRengi:
      typeof gorunumHam.bandajRengi === 'string' ? gorunumHam.bandajRengi : vGor.bandajRengi,
    konturRengi:
      typeof gorunumHam.konturRengi === 'string' ? gorunumHam.konturRengi : vGor.konturRengi,
    yapiOlcegi: guvenliSayi(gorunumHam.yapiOlcegi, vGor.yapiOlcegi, 0.7, 1.5),
  };

  const ziyaretHam = duzObjeMi(hamVeri.mekanZiyaretSayilari)
    ? (hamVeri.mekanZiyaretSayilari as Record<string, number>)
    : {};
  const temizZiyaretler: Record<string, number> = {};
  for (const [k, v] of Object.entries(ziyaretHam)) {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      temizZiyaretler[k] = Math.floor(v);
    }
  }

  const temizGecmis = Array.isArray(hamVeri.gecmis)
    ? hamVeri.gecmis.filter(kayitGecerliMi)
    : [];

  return {
    surum: KAYIT_SURUMU,
    versiyon: KAYIT_SURUMU,
    oyuncu: {
      gercekAd:
        typeof oyuncuHam.gercekAd === 'string' && oyuncuHam.gercekAd.trim()
          ? oyuncuHam.gercekAd
          : KARAKTER_SABITLERI.gercekAd,
      lakap: oyuncuHam.lakap.trim(),
      yas: guvenliSayi(oyuncuHam.yas, KARAKTER_SABITLERI.yas, 16, 80),
      gorunum: guvenliGorunum,
    },
    gun: guvenliSayi(hamVeri.gun, 1, 1),
    saatDakika: guvenliSayi(hamVeri.saatDakika, SAAT_SABITLERI.sabahBaslangicDakika, 0),
    enerji: guvenliSayi(hamVeri.enerji, KARAKTER_SABITLERI.baslangicEnerji, 0, maksEnerji),
    maksEnerji,
    tokluk: guvenliSayi(hamVeri.tokluk, KARAKTER_SABITLERI.baslangicTokluk, 0, 100),
    uyku,
    yorgunluk,
    moral: guvenliSayi(hamVeri.moral, KARAKTER_SABITLERI.baslangicMoral, 0, 100),
    para: guvenliSayi(hamVeri.para, KARAKTER_SABITLERI.baslangicPara, 0),
    buzdolabiStok: guvenliSayi(hamVeri.buzdolabiStok, KARAKTER_SABITLERI.baslangicBuzdolabi, 0),
    salonGirisGunu: guvenliSayi(hamVeri.salonGirisGunu, 0, 0),
    anneKonusmaGunu: guvenliSayi(hamVeri.anneKonusmaGunu, 0, 0),
    elifKonusmaGunu: guvenliSayi(hamVeri.elifKonusmaGunu, 0, 0),
    uyuyakalmaCezasi: Boolean(hamVeri.uyuyakalmaCezasi),
    itibar: {
      genel: guvenliSayi(itibarHam.genel, 0, 0),
      saygi: guvenliSayi(itibarHam.saygi, 0, 0, ITIBAR_SABITLERI.maksItibar),
      korku: guvenliSayi(itibarHam.korku, 0, 0, ITIBAR_SABITLERI.maksItibar),
    },
    statlar: guvenliStatlar,
    evSeviyesi: guvenliSayi(hamVeri.evSeviyesi, 0, 0, EV_SEVIYELERI.length - 1),
    kiraUyariSayisi: guvenliSayi(hamVeri.kiraUyariSayisi, 0, 0),
    sokaktaKaliyor: Boolean(hamVeri.sokaktaKaliyor),
    aktifMekan,
    aktifOlay: olayGecerliMi(hamVeri.aktifOlay) ? hamVeri.aktifOlay : null,
    sonOlayGunu: guvenliSayi(hamVeri.sonOlayGunu, 0, 0),
    evEsyalari: stringDizisiSuz(hamVeri.evEsyalari),
    gecmis: temizGecmis,
    tamamlananTekilOlayIds: stringDizisiSuz(hamVeri.tamamlananTekilOlayIds),
    sonOlayId: typeof hamVeri.sonOlayId === 'string' ? hamVeri.sonOlayId : null,
    macKazanmaSayisi: guvenliSayi(hamVeri.macKazanmaSayisi, 0, 0),
    // v2 -> v3 örnek migration 1: yeni sayısal alan yoksa varsayılan 0
    toplamDovusSayisi: guvenliSayi(hamVeri.toplamDovusSayisi, 0, 0),
    aktifDovusRakipId: aktifDovusHam,
    // v2 -> v3 örnek migration 2: yeni obje alanı yoksa boş obje {}
    mekanZiyaretSayilari: temizZiyaretler,
    yenilenRakipIds: stringDizisiSuz(hamVeri.yenilenRakipIds),
    yetenekPuani: guvenliSayi(hamVeri.yetenekPuani, 0, 0),
    acikYetenekIds: stringDizisiSuz(hamVeri.acikYetenekIds),
    kazanilanStatEsikleri: stringDizisiSuz(hamVeri.kazanilanStatEsikleri),
    ogrenilenHocaDersIds: stringDizisiSuz(hamVeri.ogrenilenHocaDersIds),
    komsuAdimlari: komsuAdimlariTemizle(hamVeri.komsuAdimlari),
    komsuSecimleri: stringDizisiSuz(hamVeri.komsuSecimleri),
    komsuBayraklari: stringDizisiSuz(hamVeri.komsuBayraklari),
    aktifKomsuOlayi: komsuOlayGecerliMi(hamVeri.aktifKomsuOlayi) ? hamVeri.aktifKomsuOlayi : null,
    aileIliskisi: guvenliSayi(hamVeri.aileIliskisi, DENGE.baslangic.aileIliskisi, 0, 100),
    ahlakiSecimler: stringDizisiSuz(hamVeri.ahlakiSecimler),
    komsuDayanismaGunu: guvenliSayi(hamVeri.komsuDayanismaGunu, 0, 0),
    ringTavri:
      hamVeri.ringTavri === 'temiz' ||
      hamVeri.ringTavri === 'sert' ||
      hamVeri.ringTavri === 'dengeli'
        ? hamVeri.ringTavri
        : 'dengeli',
    sonBildirim: kayitGecerliMi(hamVeri.sonBildirim) ? hamVeri.sonBildirim : null,
  };
}

/**
 * Oyun durumunu yerel depolamaya otomatik kaydeder.
 */
export function durumuKaydet(state: OyunDurumu): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const kayitVerisi: OyunDurumu = {
      ...state,
      surum: KAYIT_SURUMU,
      versiyon: KAYIT_SURUMU,
    };
    window.localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(kayitVerisi));
  } catch {
    // Depolama kotası doluysa sessizce geç
  }
}

/**
 * Yerel depolamadan kayıtlı oyunu yükler; v2 kaydı varsa otomatik olarak v3'e geçirir.
 */
export function durumuYukle(): OyunDurumu | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const hamV3 = window.localStorage.getItem(KAYIT_ANAHTARI);
    if (hamV3) {
      try {
        const ayrilmisV3 = JSON.parse(hamV3) as Record<string, unknown>;
        const gecirilmis = kaydiMigrateEt(ayrilmisV3);
        if (gecirilmis) {
          if (ayrilmisV3?.surum !== KAYIT_SURUMU) {
            durumuKaydet(gecirilmis);
          }
          return gecirilmis;
        }
      } catch {
        // Bozuk v3 JSON'u v2 fallback'ını engellemesin; aşağıda uyar
      }
      console.warn('v3 kayıt doğrulaması başarısız, yedek v2 aranıyor.');
    }

    const hamV2 = window.localStorage.getItem(ESKI_KAYIT_ANAHTARI_V2);
    if (hamV2) {
      const ayrilmisV2 = JSON.parse(hamV2);
      const gecirilmis = kaydiMigrateEt(ayrilmisV2);
      if (gecirilmis) {
        durumuKaydet(gecirilmis);
        return gecirilmis;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Kayıtlı ilerlemeyi (v3 ve varsa eski v2 anahtarını) siler.
 */
export function kaydiSil(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(KAYIT_ANAHTARI);
    window.localStorage.removeItem(ESKI_KAYIT_ANAHTARI_V2);
  } catch {
    // Yoksay
  }
}

export interface ReferansSimulasyonRaporu {
  simulasyonSayisi: number;
  gunSayisi: number;
  kiraOdeyenOrani: number;
  borcluKalanOrani: number;
  sokaktaKalanOrani: number;
  kazanmaOrani: number;
  ortalamaMacSayisi: number;
  ortalamaFinalPara: number;
  ortalamaStatToplam: number;
  ortalamaMoral: number;
  bayilmaOrani: number;
}

export type DovusCozumleyici = (
  state: OyunDurumu,
  rakip: RakipTanimi,
  rng: () => number
) => 'oyuncu' | 'rakip' | 'berabere';

function deterministikRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function varsayilanDovusCoz(
  state: OyunDurumu,
  rakip: RakipTanimi,
  rng: () => number
): 'oyuncu' | 'rakip' | 'berabere' {
  const oyuncuGuc =
    state.statlar.guc.deger +
    state.statlar.ceviklik.deger +
    state.statlar.refleks.deger +
    state.statlar.dayaniklilik.deger;
  const rakipGuc =
    rakip.statlar.guc +
    rakip.statlar.ceviklik +
    rakip.statlar.refleks +
    rakip.statlar.dayaniklilik;
  const fark = oyuncuGuc - rakipGuc;
  const olasilik = sinirla(0.58 + fark * 0.05, 0.1, 0.96);
  return rng() < olasilik ? 'oyuncu' : 'rakip';
}

/**
 * D3-Adım-5 Referans Strateji Headless Simülasyonu:
 * Günde 2 antrenman + 1 dövüş + 2 öğün yemek + akşam 1 dinlenme düzeniyle
 * belirtilen sayıda oyunu N gün boyunca simüle eder ve ekonomi/dövüş dengesini raporlar.
 */
export function referansStratejiSimuleEt(
  simulasyonSayisi = 100,
  gunSayisi = 10,
  dovusCozumleyici: DovusCozumleyici = varsayilanDovusCoz
): ReferansSimulasyonRaporu {
  const statSirasi: StatId[] = ['guc', 'ceviklik', 'dayaniklilik', 'refleks'];
  let kiraOdeyen = 0;
  let borcluKalan = 0;
  let sokaktaKalan = 0;
  let toplamGalibiyet = 0;
  let toplamMac = 0;
  let toplamPara = 0;
  let toplamStat = 0;
  let toplamMoral = 0;
  let toplamBayilma = 0;

  const birOgunYe = (mevcut: OyunDurumu, rng: () => number): OyunDurumu => {
    let s = mevcut;
    if (s.buzdolabiStok > 0) {
      if (s.aktifMekan !== 'ev') s = mekanaGit(s, 'ev', rng);
      return yemekYe(s, 'ev_yemegi', rng);
    }
    const posetFiyat = DENGE.yemekler.market_mutfak_poseti.fiyat;
    if (s.para >= posetFiyat) {
      if (s.aktifMekan !== 'market') s = mekanaGit(s, 'market', rng);
      s = yemekYe(s, 'market_mutfak_poseti', rng);
      s = mekanaGit(s, 'ev', rng);
      return yemekYe(s, 'ev_yemegi', rng);
    }
    if (s.para >= DENGE.yemekler.market_simit.fiyat) {
      if (s.aktifMekan !== 'market') s = mekanaGit(s, 'market', rng);
      return yemekYe(s, 'market_simit', rng);
    }
    if (s.aktifMekan === 'ev') {
      return acilCorbaIc(s, rng);
    }
    return s;
  };

  for (let i = 1; i <= simulasyonSayisi; i += 1) {
    const rng = deterministikRng(i * 9973 + 17);
    let oyun = yeniOyunOlustur('Gölge', rng);
    let kiraCezasiAldi = false;

    for (let gun = 1; gun <= gunSayisi; gun += 1) {
      if (oyun.aktifOlay) {
        const uygunlar = oyun.aktifOlay.secenekler.filter((sec) => {
          const p =
            sec.minParaGerekli ??
            (sec.etkiler.para && sec.etkiler.para < 0 ? Math.abs(sec.etkiler.para) : 0);
          const e =
            sec.minEnerjiGerekli ??
            (sec.etkiler.enerji && sec.etkiler.enerji < 0 ? Math.abs(sec.etkiler.enerji) : 0);
          return oyun.para >= p && oyun.enerji >= e;
        });
        if (uygunlar.length > 0) {
          uygunlar.sort((a, b) => ((a.etkiler.para ?? 0) < (b.etkiler.para ?? 0) ? 1 : -1));
          oyun = olaySecenegiUygula(oyun, uygunlar[0].id, rng);
        }
      }

      if (oyun.yetenekPuani > 0) {
        for (const y of YETENEK_AGACI) {
          if (yetenekAcilabilirMi(oyun, y.id).acilabilir) {
            oyun = yetenekAc(oyun, y.id);
            break;
          }
        }
      }

      // 1. öğün yemek
      oyun = birOgunYe(oyun, rng);

      // 2 antrenman
      const salonUcreti = DENGE.antrenman.salonGunlukGirisUcreti;
      if (oyun.gun === gun && oyun.para >= salonUcreti && oyun.enerji >= 45) {
        oyun = mekanaGit(oyun, 'spor_salonu', rng);
        for (let t = 0; t < 2; t += 1) {
          if (oyun.gun !== gun || oyun.enerji < 24) break;
          const statId = statSirasi[(gun + t) % statSirasi.length];
          oyun = antrenmanYap(oyun, statId, {}, rng);
        }
      }

      // 2. öğün yemek
      if (oyun.gun === gun) {
        oyun = birOgunYe(oyun, rng);
      }

      // 1 dövüş
      const ilkRakip = RAKIP_LISTESI[0];
      if (oyun.gun === gun && ilkRakip && macaGirilebilirMi(oyun).uygun) {
        oyun = mekanaGit(oyun, 'sokak_arena', rng);
        if (macaGirilebilirMi(oyun).uygun) {
          const kazanan = dovusCozumleyici(oyun, ilkRakip, rng);
          toplamMac += 1;
          if (kazanan === 'oyuncu') toplamGalibiyet += 1;
          oyun = dovusSonucunuUygula(oyun, ilkRakip.id, kazanan, rng).yeniDurum;
        }
      }

      // Akşam 1 dinlenme (aile etkileşimi) + uyku
      if (oyun.gun === gun) {
        oyun = mekanaGit(oyun, 'ev', rng);
        if (oyun.gun === gun) {
          oyun = aileyleEtkiles(oyun, gun % 2 === 0 ? 'anne_emine' : 'kardes_elif', rng);
        }
        if (oyun.gun === gun) {
          oyun = evdeUyuVeGunuBitir(oyun, rng);
        } else {
          toplamBayilma += 1;
        }
      } else {
        toplamBayilma += 1;
      }

      if (oyun.kiraUyariSayisi > 0 || oyun.sokaktaKaliyor) {
        kiraCezasiAldi = true;
      }
    }

    if (!kiraCezasiAldi && oyun.kiraUyariSayisi === 0 && !oyun.sokaktaKaliyor) {
      kiraOdeyen += 1;
    } else {
      borcluKalan += 1;
    }
    if (oyun.sokaktaKaliyor) sokaktaKalan += 1;

    toplamPara += oyun.para;
    toplamMoral += oyun.moral;
    toplamStat +=
      oyun.statlar.guc.deger +
      oyun.statlar.ceviklik.deger +
      oyun.statlar.refleks.deger +
      oyun.statlar.dayaniklilik.deger;
  }

  return {
    simulasyonSayisi,
    gunSayisi,
    kiraOdeyenOrani: kiraOdeyen / simulasyonSayisi,
    borcluKalanOrani: borcluKalan / simulasyonSayisi,
    sokaktaKalanOrani: sokaktaKalan / simulasyonSayisi,
    kazanmaOrani: toplamMac > 0 ? toplamGalibiyet / toplamMac : 0,
    ortalamaMacSayisi: toplamMac / simulasyonSayisi,
    ortalamaFinalPara: Math.round(toplamPara / simulasyonSayisi),
    ortalamaStatToplam: Number((toplamStat / simulasyonSayisi).toFixed(1)),
    ortalamaMoral: Math.round(toplamMoral / simulasyonSayisi),
    bayilmaOrani: toplamBayilma / (simulasyonSayisi * gunSayisi),
  };
}

