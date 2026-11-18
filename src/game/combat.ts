/**
 * ============================================================================
 * B AŞAMASI: GERÇEK ZAMANLI SOKAK DÖVÜŞÜ MOTORU (SAF SİMÜLASYON)
 * Sıra tabanlı değildir: zaman akar, iki dövüşçü statlarına göre otomatik
 * vuruşur; oyuncu soğuma (cooldown) ve stamina kurallarıyla hamle düğmelerine
 * basarak saldırı sırasını değiştirir veya anında blok / kaçınma uygular.
 * ============================================================================
 */

import {
  DOVUS_SABITLERI,
  HAMLE_LISTESI,
  HamleVerisi,
  RAKIP_LISTESI,
  RakipTanimi,
  RakipTarzi,
  StatId,
} from '../data/gameData';
import {
  hesaplaTuretilmisDegerler,
  OyunDurumu,
  rakipCekinmeHesapla,
  YetenekPasifOzeti,
} from './engine';
import { KarakterGorunumu } from './theme';
import { DENGE } from './balance';

const HAMLE_HARITASI = new Map(HAMLE_LISTESI.map((h) => [h.id, h]));

export type DovusAksiyonTuru =
  | 'idle'
  | 'yumruk'
  | 'tekme'
  | 'blok'
  | 'kacinma'
  | 'darbe_aldi'
  | 'ko';

export interface YuzenSayi {
  id: number;
  hedef: 'oyuncu' | 'rakip';
  metin: string;
  renk: string;
  kalanMs: number;
  toplamMs: number;
  ofsetX: number;
  ofsetY?: number;
  hasarDegeri?: number;
  efekt?:
    | 'yumruk'
    | 'tekme'
    | 'sert_yumruk'
    | 'blok'
    | 'kacinma'
    | 'mukemmel'
    | 'kombo'
    | 'nakavt';
}

export interface DovuscuDurumu {
  kimlik: 'oyuncu' | 'rakip';
  isim: string;
  lakap: string;
  tarz?: RakipTarzi;
  gorunum: KarakterGorunumu;
  statlar: Record<StatId, number>;
  can: number;
  maksCan: number;
  stamina: number;
  maksStamina: number;
  aksiyon: DovusAksiyonTuru;
  aktifHamleId?: string | null;
  aksiyonKalanMs: number;
  aksiyonToplamMs: number;
  otomatikSayacMs: number;
  hazirlananHamleId?: string | null;
  blokKalanMs: number;
  kacinmaKalanMs: number;
  kacinmaBonusu: number;
  mukemmelSavunmaKalanMs?: number;
  karsiSaldiriKalanMs: number;
  karsiSaldiriCarpan?: number;
  darbeFlasMs: number;
  yavasladiMi: boolean;
  siraHamleId: string | null;
  beklemeSureleri: Record<string, number>;
  acikHamleIds: string[];
  vurduguIsabet: number;
  kacindigiSayi: number;
  sonKomboEtiketi?: string | null;
  komboZincirSayisi?: number;
  komboSuresiKalanMs?: number;
  pasifler?: YetenekPasifOzeti;
}

export interface DovusDurumu {
  rakipId: string;
  durum: 'devam_ediyor' | 'ko_yavaslatma' | 'bitti';
  kazanan: 'oyuncu' | 'rakip' | 'berabere' | null;
  gecenSureMs: number;
  maksSureMs: number;
  koYavaslatmaKalanMs: number;
  hitstopKalanMs: number;
  sonKomboSayisi: number;
  ekranSarsintiMs: number;
  sarsintiSiddeti: number;
  sonOlayMetni: string;
  rakipCekinmeYuzde?: number;
  oyuncuHazirlikCezasiMetni?: string | null;
  yuzenSayilar: YuzenSayi[];
  sonrakiSayiId: number;
  oyuncu: DovuscuDurumu;
  rakip: DovuscuDurumu;
}

function sinirla(deger: number, min: number, maks: number): number {
  return Math.max(min, Math.min(maks, deger));
}

function vurusAraligiMs(ceviklik: number, staminaYuzde: number): number {
  const d = DENGE.dovus;
  const temel = sinirla(
    d.vurusAraligiTabanMs - ceviklik * d.vurusAraligiCeviklikCarpan,
    d.vurusAraligiMinMs,
    d.vurusAraligiMaxMs
  );
  // Stamina %22'nin altına düşünce dövüşçü belirgin biçimde yavaşlar
  return staminaYuzde < d.yavaslamaStaminaOran
    ? Math.round(temel * d.vurusAraligiYavasCarpan)
    : temel;
}

function hamleBul(hamleId: string): HamleVerisi {
  return HAMLE_HARITASI.get(hamleId) ?? HAMLE_LISTESI[0];
}

function rakipAcikHamleler(statlar: Record<StatId, number>): string[] {
  const sonuc: string[] = [];
  for (const h of HAMLE_LISTESI) {
    if (h.yetenekId || h.hocaDersId) continue;
    let acik = true;
    for (const [statId, gereken] of Object.entries(h.acilisSarti)) {
      if ((statlar[statId as StatId] ?? 0) < (gereken ?? 0)) {
        acik = false;
        break;
      }
    }
    if (acik) {
      sonuc.push(h.id);
    }
  }
  return sonuc;
}

/**
 * Oyun durumundan yeni bir gerçek zamanlı sokak dövüşü oturumu başlatır.
 */
export function dovusBaslat(
  oyun: OyunDurumu,
  rakip: RakipTanimi = RAKIP_LISTESI[0]
): DovusDurumu {
  const turetilmis = hesaplaTuretilmisDegerler(oyun);

  const v = DENGE.verimVeEsikler;
  const d = DENGE.dovus;

  // Düşük açlık veya uyku ile ringe çıkılırsa başlangıç staminası biraz düşer
  const hazirlikCarpani =
    oyun.tokluk < v.hazirlikDusukEsik || oyun.uyku < v.hazirlikDusukEsik
      ? v.hazirlikDusukStaminaCarpan
      : oyun.uyuyakalmaCezasi
        ? v.uyuyakalmaStaminaCarpan
        : 1.0;

  let oyuncuHazirlikCezasiMetni: string | null = null;
  if (oyun.tokluk < v.hazirlikDusukEsik && oyun.uyku < v.hazirlikDusukEsik) {
    oyuncuHazirlikCezasiMetni = '-%22 Başl. Stam (Aç + Bitkin)';
  } else if (oyun.tokluk < v.hazirlikDusukEsik) {
    oyuncuHazirlikCezasiMetni = '-%22 Başl. Stam (Açlık)';
  } else if (oyun.uyku < v.hazirlikDusukEsik) {
    oyuncuHazirlikCezasiMetni = '-%22 Başl. Stam (Bitkin)';
  } else if (oyun.uyuyakalmaCezasi) {
    oyuncuHazirlikCezasiMetni = '-%15 Başl. Stam (Uyuyakalma)';
  }

  const oyuncuStatlar: Record<StatId, number> = {
    guc: oyun.statlar.guc.deger,
    ceviklik: oyun.statlar.ceviklik.deger,
    refleks: oyun.statlar.refleks.deger,
    dayaniklilik: oyun.statlar.dayaniklilik.deger,
  };

  const oyuncuMaksStam = turetilmis.maksStamina;
  const rakipMaksCan =
    v.maksCanTaban + rakip.statlar.dayaniklilik * v.maksCanDayaniklilikCarpan;
  const rakipMaksStam =
    v.maksStaminaTaban + rakip.statlar.dayaniklilik * v.maksStaminaDayaniklilikCarpan;
  const cekinme = rakipCekinmeHesapla(oyun.itibar?.korku ?? 0, rakip);
  const rakipCekinmeYuzde = cekinme.yuzde;
  const rakipBaslangicStam = Math.max(
    d.rakipBaslangicMinStamina,
    Math.round(rakipMaksStam * (1 - rakipCekinmeYuzde / 100))
  );
  const rakipIlkSayacMs =
    cekinme.asama === 2
      ? d.rakipIlkSayacMsCekinme2
      : cekinme.asama === 1
        ? d.rakipIlkSayacMsCekinme1
        : d.rakipIlkSayacMsNormal;

  return {
    rakipId: rakip.id,
    durum: 'devam_ediyor',
    kazanan: null,
    gecenSureMs: 0,
    maksSureMs: DOVUS_SABITLERI.maksMacSuresiMs,
    koYavaslatmaKalanMs: 0,
    hitstopKalanMs: 0,
    sonKomboSayisi: 0,
    ekranSarsintiMs: 0,
    sarsintiSiddeti: 0,
    sonOlayMetni:
      rakipCekinmeYuzde > 0
        ? `${rakip.lakap} karanlık namından çekiniyor (-%${rakipCekinmeYuzde} başlangıç staminası). Gardını al!`
        : `${rakip.lakap} ile tebeşir çizgide karşı karşıyasın. Gardını al!`,
    rakipCekinmeYuzde,
    oyuncuHazirlikCezasiMetni,
    yuzenSayilar: [],
    sonrakiSayiId: 1,
    oyuncu: {
      kimlik: 'oyuncu',
      isim: oyun.oyuncu.gercekAd,
      lakap: oyun.oyuncu.lakap,
      gorunum: { ...oyun.oyuncu.gorunum },
      statlar: oyuncuStatlar,
      can: turetilmis.maksCan,
      maksCan: turetilmis.maksCan,
      stamina: Math.round(oyuncuMaksStam * hazirlikCarpani),
      maksStamina: oyuncuMaksStam,
      aksiyon: 'idle',
      aktifHamleId: null,
      aksiyonKalanMs: 0,
      aksiyonToplamMs: 400,
      otomatikSayacMs: d.oyuncuIlkSayacMs,
      hazirlananHamleId: null,
      blokKalanMs: 0,
      kacinmaKalanMs: 0,
      kacinmaBonusu: 0,
      mukemmelSavunmaKalanMs: 0,
      karsiSaldiriKalanMs: 0,
      karsiSaldiriCarpan: d.karsiSaldiriStandartCarpan,
      darbeFlasMs: 0,
      yavasladiMi: false,
      siraHamleId: null,
      beklemeSureleri: {},
      acikHamleIds: [...turetilmis.acikHamleIds],
      vurduguIsabet: 0,
      kacindigiSayi: 0,
      sonKomboEtiketi: null,
      komboZincirSayisi: 0,
      komboSuresiKalanMs: 0,
      pasifler: { ...turetilmis.pasifler },
    },
    rakip: {
      kimlik: 'rakip',
      isim: rakip.isim,
      lakap: rakip.lakap,
      tarz: rakip.tarz,
      gorunum: { ...rakip.gorunum },
      statlar: { ...rakip.statlar },
      can: rakipMaksCan,
      maksCan: rakipMaksCan,
      stamina: rakipBaslangicStam,
      maksStamina: rakipMaksStam,
      aksiyon: 'idle',
      aktifHamleId: null,
      aksiyonKalanMs: 0,
      aksiyonToplamMs: 400,
      otomatikSayacMs: rakipIlkSayacMs,
      hazirlananHamleId: null,
      blokKalanMs: 0,
      kacinmaKalanMs: 0,
      kacinmaBonusu: 0,
      mukemmelSavunmaKalanMs: 0,
      karsiSaldiriKalanMs: 0,
      karsiSaldiriCarpan: d.karsiSaldiriStandartCarpan,
      darbeFlasMs: 0,
      yavasladiMi: false,
      siraHamleId: null,
      beklemeSureleri: {},
      acikHamleIds: rakipAcikHamleler(rakip.statlar),
      vurduguIsabet: 0,
      kacindigiSayi: 0,
      sonKomboEtiketi: null,
      komboZincirSayisi: 0,
      komboSuresiKalanMs: 0,
    },
  };
}

/**
 * Oyuncunun seçtiği hamleyi kuyruğa alır (saldırı) ya da anında uygular (blok/kaçınma).
 */
export function oyuncuHamleSec(dovus: DovusDurumu, hamleId: string): DovusDurumu {
  if (dovus.durum !== 'devam_ediyor') return dovus;
  const o = dovus.oyuncu;
  if (!o.acikHamleIds.includes(hamleId)) return dovus;
  if ((o.beklemeSureleri[hamleId] ?? 0) > 0) return dovus;

  const hamle = hamleBul(hamleId);
  if (o.stamina < hamle.staminaMaliyeti) {
    return {
      ...dovus,
      sonOlayMetni: `${hamle.isim} için nefesin (stamina) yetersiz!`,
    };
  }

  // Savunma / Kaçınma hamleleri anında devreye girer
  if (hamle.tur === 'kacinma') {
    const rakipHazirHamle = dovus.rakip.hazirlananHamleId
      ? hamleBul(dovus.rakip.hazirlananHamleId)
      : null;
    const mukemmelZamanlama = Boolean(
      rakipHazirHamle &&
        rakipHazirHamle.tur !== 'kacinma' &&
        dovus.rakip.otomatikSayacMs <= DENGE.dovus.telgrafPenceresiMs
    );

    const yeniBeklemeler = {
      ...o.beklemeSureleri,
      [hamle.id]: hamle.beklemeSuresiMs,
    };
    const dDovus = DENGE.dovus;
    const blokTuruMu = (hamle.staminaToparlanma ?? 0) > 0;
    const ekstraStamina = mukemmelZamanlama && blokTuruMu ? dDovus.mukemmelBlokEkStamina : 0;
    const yeniStamina = sinirla(
      o.stamina - hamle.staminaMaliyeti + (hamle.staminaToparlanma ?? 0) + ekstraStamina,
      0,
      o.maksStamina
    );

    if (blokTuruMu) {
      const blokSure =
        (hamle.id === 'celik_gard' ? dDovus.blokCelikGardSureMs : dDovus.blokStandartSureMs) +
        (mukemmelZamanlama ? dDovus.blokMukemmelEkSureMs : 0);
      return {
        ...dovus,
        sonOlayMetni: mukemmelZamanlama
          ? `Mükemmel Zamanlama! ${hamle.isim} darbe anına kilitlendi.`
          : `${hamle.isim} aktif (+nefeslenme).`,
        oyuncu: {
          ...o,
          stamina: yeniStamina,
          blokKalanMs: blokSure,
          kacinmaKalanMs: 0,
          mukemmelSavunmaKalanMs: mukemmelZamanlama ? dDovus.mukemmelBlokPencereMs : 0,
          aksiyon: 'blok',
          aktifHamleId: hamle.id,
          aksiyonKalanMs: dDovus.aksiyonBlokMs,
          aksiyonToplamMs: dDovus.aksiyonBlokMs,
          beklemeSureleri: yeniBeklemeler,
        },
      };
    }

    // Geri Çekil, Eğil / Yana Kay veya Hayalet Adım
    const sure =
      (hamle.id === 'hayalet_adim'
        ? dDovus.kacinmaHayaletSureMs
        : hamle.id === 'egil_yana_kay'
          ? dDovus.kacinmaEgilSureMs
          : dDovus.kacinmaGeriCekilSureMs) +
      (mukemmelZamanlama ? dDovus.kacinmaMukemmelEkSureMs : 0);
    return {
      ...dovus,
      sonOlayMetni: mukemmelZamanlama
        ? `${hamle.isim}: Mükemmel zamanlama! Saldırıyı tam okudun.`
        : `${hamle.isim}: Rakibin darbesinden sıyrılmaya hazırsın!`,
      oyuncu: {
        ...o,
        stamina: yeniStamina,
        kacinmaKalanMs: sure,
        kacinmaBonusu: hamle.karsiSaldiriFirsati ?? 20,
        mukemmelSavunmaKalanMs: mukemmelZamanlama ? sure : 0,
        blokKalanMs: 0,
        aksiyon: 'kacinma',
        aktifHamleId: hamle.id,
        aksiyonKalanMs: sure,
        aksiyonToplamMs: sure,
        beklemeSureleri: yeniBeklemeler,
      },
    };
  }

  // Saldırı hamlesi: sıradaki otomatik vuruşun yerine geçer ve zamanlamayı hızlandırır
  return {
    ...dovus,
    sonOlayMetni: `Sıradaki vuruş ayarlandı: ${hamle.isim}`,
    oyuncu: {
      ...o,
      siraHamleId: hamle.id,
      otomatikSayacMs: Math.min(o.otomatikSayacMs, 120),
    },
  };
}

/**
 * Rakip yapay zekası: tarzına (saldırgan, çevik, savunmacı) ve staminasına göre hamle seçer.
 */
export function rakipHamleSec(
  rakip: DovuscuDurumu,
  oyuncu: DovuscuDurumu,
  rng: () => number
): HamleVerisi {
  const hazir = (id: string): boolean => {
    if (!rakip.acikHamleIds.includes(id)) return false;
    if ((rakip.beklemeSureleri[id] ?? 0) > 0) return false;
    const h = hamleBul(id);
    return rakip.stamina >= h.staminaMaliyeti;
  };

  const r = rng();
  const tarz = rakip.tarz ?? 'saldirgan';

  if (tarz === 'savunmaci') {
    if (rakip.stamina < rakip.maksStamina * 0.35 && hazir('blok')) {
      return hamleBul('blok');
    }
    if (oyuncu.karsiSaldiriKalanMs > 0 && hazir('blok') && r < 0.65) {
      return hamleBul('blok');
    }
    if (r < 0.3 && hazir('blok') && rakip.blokKalanMs <= 0) {
      return hamleBul('blok');
    }
    if (r < 0.6 && hazir('yan_tekme')) return hamleBul('yan_tekme');
    if (hazir('alcak_tekme')) return hamleBul('alcak_tekme');
    return hamleBul('duz_yumruk');
  }

  if (tarz === 'cevik') {
    if (oyuncu.otomatikSayacMs < 320 && r < 0.38) {
      if (hazir('egil_yana_kay')) return hamleBul('egil_yana_kay');
      if (hazir('geri_cekil')) return hamleBul('geri_cekil');
    }
    if (r < 0.45 && hazir('alcak_tekme')) return hamleBul('alcak_tekme');
    if (r < 0.72 && hazir('duz_yumruk')) return hamleBul('duz_yumruk');
    if (hazir('sert_yumruk')) return hamleBul('sert_yumruk');
    return hamleBul('duz_yumruk');
  }

  // Saldırgan tarz: ağır ve sık vuruşlar, nadiren blok
  if (rakip.stamina < 14 && hazir('blok')) {
    return hamleBul('blok');
  }
  if (r < 0.4 && hazir('sert_yumruk')) return hamleBul('sert_yumruk');
  if (r < 0.65 && hazir('yan_tekme')) return hamleBul('yan_tekme');
  if (r < 0.85 && hazir('duz_yumruk')) return hamleBul('duz_yumruk');
  if (hazir('alcak_tekme')) return hamleBul('alcak_tekme');
  return hamleBul('duz_yumruk');
}

function otomatikSaldiriSec(dovuscu: DovuscuDurumu, rng: () => number): HamleVerisi {
  if (dovuscu.siraHamleId) {
    const secilen = hamleBul(dovuscu.siraHamleId);
    if (
      dovuscu.acikHamleIds.includes(secilen.id) &&
      (dovuscu.beklemeSureleri[secilen.id] ?? 0) <= 0 &&
      dovuscu.stamina >= secilen.staminaMaliyeti
    ) {
      return secilen;
    }
  }

  // Stamina yeterliyse ara sıra tekme ya da sert yumruk karıştır
  const r = rng();
  if (
    dovuscu.stamina >= 28 &&
    dovuscu.acikHamleIds.includes('sert_yumruk') &&
    (dovuscu.beklemeSureleri['sert_yumruk'] ?? 0) <= 0 &&
    r < 0.28
  ) {
    return hamleBul('sert_yumruk');
  }
  if (
    dovuscu.stamina >= 18 &&
    dovuscu.acikHamleIds.includes('alcak_tekme') &&
    (dovuscu.beklemeSureleri['alcak_tekme'] ?? 0) <= 0 &&
    r < 0.55
  ) {
    return hamleBul('alcak_tekme');
  }
  return hamleBul('duz_yumruk');
}

function sayacAzalt(
  beklemeler: Record<string, number>,
  dtMs: number
): Record<string, number> {
  if (Object.keys(beklemeler).length === 0) return beklemeler;
  const yeni: Record<string, number> = {};
  for (const [id, kalan] of Object.entries(beklemeler)) {
    const guncel = Math.max(0, kalan - dtMs);
    if (guncel > 0) {
      yeni[id] = guncel;
    }
  }
  return yeni;
}

function dovuscuTick(d: DovuscuDurumu, dtMs: number): DovuscuDurumu {
  const dengeDovus = DENGE.dovus;
  const stamOran = d.stamina / Math.max(1, d.maksStamina);
  // Stamina yenilenmesi: Dayanıklılık ve pasif yetenekler hızlandırır; nefessizken hafif yavaşlar
  const pasifStaminaCarpan = 1 + (d.pasifler?.staminaToparlanmaYuzde ?? 0) / 100;
  const regenSaniye =
    (dengeDovus.staminaRegenTaban +
      d.statlar.dayaniklilik * dengeDovus.staminaRegenDayaniklilikCarpan) *
    pasifStaminaCarpan *
    (stamOran < dengeDovus.staminaRegenDusukOran ? dengeDovus.staminaRegenDusukCarpan : 1);
  const yeniStamina = sinirla(d.stamina + (regenSaniye * dtMs) / 1000, 0, d.maksStamina);

  const aksiyonKalanMs = Math.max(0, d.aksiyonKalanMs - dtMs);
  const aksiyon: DovusAksiyonTuru =
    d.aksiyon === 'ko' ? 'ko' : aksiyonKalanMs > 0 ? d.aksiyon : 'idle';

  const komboSuresiKalanMs = Math.max(0, (d.komboSuresiKalanMs ?? 0) - dtMs);

  return {
    ...d,
    stamina: yeniStamina,
    yavasladiMi: yeniStamina / Math.max(1, d.maksStamina) < dengeDovus.yavaslamaStaminaOran,
    aksiyon,
    aktifHamleId: aksiyon === 'idle' ? null : (d.aktifHamleId ?? null),
    aksiyonKalanMs,
    blokKalanMs: Math.max(0, d.blokKalanMs - dtMs),
    kacinmaKalanMs: Math.max(0, d.kacinmaKalanMs - dtMs),
    mukemmelSavunmaKalanMs: Math.max(0, (d.mukemmelSavunmaKalanMs ?? 0) - dtMs),
    karsiSaldiriKalanMs: Math.max(0, d.karsiSaldiriKalanMs - dtMs),
    darbeFlasMs: Math.max(0, d.darbeFlasMs - dtMs),
    beklemeSureleri: sayacAzalt(d.beklemeSureleri, dtMs),
    otomatikSayacMs: Math.max(0, d.otomatikSayacMs - dtMs),
    komboSuresiKalanMs,
    sonKomboEtiketi: komboSuresiKalanMs > 0 ? (d.sonKomboEtiketi ?? null) : null,
    komboZincirSayisi: komboSuresiKalanMs > 0 ? (d.komboZincirSayisi ?? 0) : 0,
  };
}

function saldiriCoz(
  saldiran: DovuscuDurumu,
  savunan: DovuscuDurumu,
  hamle: HamleVerisi,
  sonrakiSayiId: number,
  rng: () => number
): {
  saldiran: DovuscuDurumu;
  savunan: DovuscuDurumu;
  yeniSayilar: YuzenSayi[];
  sonrakiSayiId: number;
  olayMetni: string;
  sarsintiSiddeti: number;
  hitstopMs: number;
  komboTamamlandi: number;
  koOlduMu: boolean;
} {
  const dDovus = DENGE.dovus;
  const gucSaldiriSure = dDovus.aksiyonSaldiriMs;
  const stamOran = saldiran.stamina / Math.max(1, saldiran.maksStamina);
  const staminaHarcama = Math.min(saldiran.stamina, hamle.staminaMaliyeti);
  const guncelSaldiran: DovuscuDurumu = {
    ...saldiran,
    stamina: Math.max(0, saldiran.stamina - staminaHarcama),
    siraHamleId: null,
    hazirlananHamleId: null,
    aksiyon: hamle.tur === 'tekme' ? 'tekme' : 'yumruk',
    aktifHamleId: hamle.id,
    aksiyonKalanMs: gucSaldiriSure,
    aksiyonToplamMs: gucSaldiriSure,
    beklemeSureleri: {
      ...saldiran.beklemeSureleri,
      [hamle.id]: hamle.beklemeSuresiMs,
    },
    otomatikSayacMs: vurusAraligiMs(saldiran.statlar.ceviklik, stamOran),
  };

  // Savunmada aktif kaçınma penceresi varsa yüksek olasılıkla (Mükemmel Kaçınma'da %100) sıyrılır
  if (savunan.kacinmaKalanMs > 0) {
    const mukemmelMi = (savunan.mukemmelSavunmaKalanMs ?? 0) > 0;
    const kacinmaSansi = mukemmelMi
      ? 100
      : sinirla(
          dDovus.kacinmaTabanSans +
            savunan.statlar.refleks * dDovus.kacinmaRefleksCarpan +
            savunan.kacinmaBonusu * dDovus.kacinmaBonusCarpan +
            (savunan.pasifler?.kacinmaSansiBonusu ?? 0),
          dDovus.kacinmaMinSans,
          dDovus.kacinmaMaxSans
        );
    if (mukemmelMi || rng() * 100 <= kacinmaSansi) {
      const karsiPencere = mukemmelMi ? dDovus.karsiPencereMukemmelMs : dDovus.karsiPencereStandartMs;
      const karsiCarpan =
        (mukemmelMi
          ? dDovus.karsiSaldiriMukemmelCarpan
          : dDovus.karsiSaldiriStandartCarpan) +
        (savunan.pasifler?.karsiSaldiriCarpanBonusu ?? 0);
      return {
        saldiran: guncelSaldiran,
        savunan: {
          ...savunan,
          kacinmaKalanMs: 0,
          mukemmelSavunmaKalanMs: 0,
          karsiSaldiriKalanMs: karsiPencere,
          karsiSaldiriCarpan: karsiCarpan,
          otomatikSayacMs: Math.min(savunan.otomatikSayacMs, 180),
          kacindigiSayi: savunan.kacindigiSayi + 1,
        },
        yeniSayilar: [
          {
            id: sonrakiSayiId,
            hedef: savunan.kimlik,
            metin: mukemmelMi ? 'MÜKEMMEL KAÇINMA!' : 'BOŞA! KARŞI AÇIK',
            renk: '#6CC296',
            kalanMs: mukemmelMi ? 1100 : 950,
            toplamMs: mukemmelMi ? 1100 : 950,
            ofsetX: (rng() - 0.5) * 10,
            efekt: mukemmelMi ? 'mukemmel' : 'kacinma',
          },
        ],
        sonrakiSayiId: sonrakiSayiId + 1,
        olayMetni: mukemmelMi
          ? `${savunan.lakap} Mükemmel Kaçınma yaptı! Sonraki karşı saldırı güçlendi!`
          : `${savunan.lakap} ${hamle.isim} hamlesinden sıyrıldı! Karşı saldırı fırsatı!`,
        sarsintiSiddeti: mukemmelMi ? 3 : 0,
        hitstopMs: mukemmelMi ? dDovus.hitstopMukemmelMs : 0,
        komboTamamlandi: 0,
        koOlduMu: false,
      };
    }
  }

  // Normal isabet hesabı
  const karsiAktif = guncelSaldiran.karsiSaldiriKalanMs > 0;
  const isabetSansi = sinirla(
    hamle.isabetSansi +
      guncelSaldiran.statlar.ceviklik * dDovus.isabetCeviklikCarpan -
      savunan.statlar.refleks * dDovus.isabetRefleksCarpan +
      (guncelSaldiran.pasifler?.isabetBonusu ?? 0) +
      (karsiAktif ? dDovus.isabetKarsiBonusu : 0) -
      (stamOran < dDovus.staminaRegenDusukOran ? dDovus.isabetDusukStaminaCezasi : 0),
    dDovus.isabetMinSans,
    dDovus.isabetMaxSans
  );

  if (rng() * 100 > isabetSansi) {
    return {
      saldiran: {
        ...guncelSaldiran,
        karsiSaldiriKalanMs: 0,
        karsiSaldiriCarpan: DENGE.dovus.karsiSaldiriStandartCarpan,
      },
      savunan,
      yeniSayilar: [
        {
          id: sonrakiSayiId,
          hedef: savunan.kimlik,
          metin: 'ISKA',
          renk: '#8B95AB',
          kalanMs: 750,
          toplamMs: 750,
          ofsetX: (rng() - 0.5) * 12,
        },
      ],
      sonrakiSayiId: sonrakiSayiId + 1,
      olayMetni: `${guncelSaldiran.lakap} (${hamle.isim}) boşa savurdu.`,
      sarsintiSiddeti: 0,
      hitstopMs: 0,
      komboTamamlandi: 0,
      koOlduMu: false,
    };
  }

  // Kombo zinciri (yalnızca oyuncu saldırıları için 3.5 sn pencere)
  const dengeDovus = DENGE.dovus;
  let yeniKomboEtiket: string | null = guncelSaldiran.sonKomboEtiketi ?? null;
  let yeniKomboSayisi = guncelSaldiran.komboZincirSayisi ?? 0;
  let yeniKomboSure = guncelSaldiran.komboSuresiKalanMs ?? 0;
  let komboTamamlandi = 0;
  let komboBonusCarpan = 1.0;

  if (guncelSaldiran.kimlik === 'oyuncu' && hamle.komboEtiketi) {
    const pencereAcik = yeniKomboSure > 0;
    const oncekiEtiket = pencereAcik ? yeniKomboEtiket : null;
    const oncekiSayi = pencereAcik ? yeniKomboSayisi : 0;

    if (hamle.komboEtiketi === 'acilim') {
      yeniKomboEtiket = 'acilim';
      yeniKomboSayisi = 1;
      yeniKomboSure = dengeDovus.komboPenceresiMs;
    } else if (hamle.komboEtiketi === 'denge_bozucu') {
      if (oncekiEtiket === 'acilim') {
        yeniKomboEtiket = 'denge_bozucu';
        yeniKomboSayisi = Math.min(3, Math.max(2, oncekiSayi + 1));
        yeniKomboSure = dengeDovus.komboPenceresiMs;
        komboTamamlandi = 2;
        komboBonusCarpan = dengeDovus.kombo2xCarpan;
      } else {
        yeniKomboEtiket = 'denge_bozucu';
        yeniKomboSayisi = 1;
        yeniKomboSure = dengeDovus.komboPenceresiMs;
      }
    } else if (hamle.komboEtiketi === 'bitirici') {
      if (oncekiEtiket === 'acilim' || oncekiEtiket === 'denge_bozucu') {
        if (oncekiEtiket === 'denge_bozucu' && oncekiSayi >= 2) {
          komboTamamlandi = 3;
          komboBonusCarpan = dengeDovus.kombo3xCarpan;
        } else {
          komboTamamlandi = 2;
          komboBonusCarpan = dengeDovus.kombo2xCarpan;
        }
        yeniKomboEtiket = null;
        yeniKomboSayisi = 0;
        yeniKomboSure = 0;
      } else {
        yeniKomboEtiket = null;
        yeniKomboSayisi = 0;
        yeniKomboSure = 0;
      }
    }
  }

  // Hasar hesabı: Güç, hamle temel hasarı, pasif yetenek bonusu, karşı saldırı, kombo ve blok kesintisi
  const gucCarpani =
    dengeDovus.gucHasarTaban + guncelSaldiran.statlar.guc * dengeDovus.gucHasarCarpan;
  const turPasifYuzde =
    hamle.tur === 'yumruk'
      ? (guncelSaldiran.pasifler?.yumrukHasarYuzde ?? 0)
      : hamle.tur === 'tekme'
        ? (guncelSaldiran.pasifler?.tekmeHasarYuzde ?? 0)
        : 0;
  const pasifHasarCarpani = 1 + turPasifYuzde / 100;
  const karsiCarpani = karsiAktif
    ? (guncelSaldiran.karsiSaldiriCarpan ?? dengeDovus.karsiSaldiriStandartCarpan)
    : 1.0;
  const bloktaMi = savunan.blokKalanMs > 0;
  const mukemmelBlokMu = bloktaMi && (savunan.mukemmelSavunmaKalanMs ?? 0) > 0;
  const blokKesintiBonusu = (savunan.pasifler?.blokKesintiYuzde ?? 0) / 100;
  const blokCarpani = mukemmelBlokMu
    ? Math.max(dengeDovus.mukemmelBlokMinHasarCarpani, dengeDovus.mukemmelBlokHasarCarpani - blokKesintiBonusu * 0.5)
    : bloktaMi
      ? Math.max(dengeDovus.blokMinHasarCarpani, dengeDovus.blokHasarCarpani - blokKesintiBonusu)
      : 1.0;
  const rastgeleSapma = dengeDovus.rastgeleSapmaTaban + rng() * dengeDovus.rastgeleSapmaAralik;

  const hamHasar =
    hamle.temelHasar *
    gucCarpani *
    pasifHasarCarpani *
    karsiCarpani *
    komboBonusCarpan *
    blokCarpani *
    rastgeleSapma;
  const netHasar = Math.max(
    mukemmelBlokMu
      ? dengeDovus.minHasarMukemmelBlok
      : bloktaMi
        ? dengeDovus.minHasarBlok
        : dengeDovus.minHasarNormal,
    Math.round(hamHasar)
  );

  const yeniCan = Math.max(0, savunan.can - netHasar);
  const koOlduMu = yeniCan <= 0;

  let sarsintiSiddeti = koOlduMu
    ? 9
    : mukemmelBlokMu
      ? 4
      : bloktaMi
        ? 2
        : hamle.temelHasar >= dengeDovus.agirVurusHasarEsigi || karsiAktif
          ? 6
          : 3;
  if (!koOlduMu && komboTamamlandi > 0) {
    sarsintiSiddeti = Math.max(sarsintiSiddeti, komboTamamlandi === 3 ? 8 : 6);
  }

  let hitstopMs = 0;
  if (!koOlduMu) {
    if (komboTamamlandi === 3) {
      hitstopMs = dengeDovus.hitstopKombo3Ms;
    } else if (komboTamamlandi === 2) {
      hitstopMs = dengeDovus.hitstopKombo2Ms;
    } else if (mukemmelBlokMu) {
      hitstopMs = dengeDovus.hitstopMukemmelMs;
    } else if (hamle.temelHasar >= dengeDovus.agirVurusHasarEsigi || karsiAktif) {
      hitstopMs = dengeDovus.hitstopAgirMs;
    }
  }

  const sayiMetni = mukemmelBlokMu
    ? `MÜKEMMEL BLOK! -${netHasar}`
    : karsiAktif
      ? `KARŞI -${netHasar}!`
      : bloktaMi
        ? `BLOK -${netHasar}`
        : `-${netHasar}`;
  const sayiRenk = mukemmelBlokMu
    ? '#6CC296'
    : karsiAktif
      ? '#D99B38'
      : bloktaMi
        ? '#5B82B8'
        : '#E34A4A';
  const efektTuru: YuzenSayi['efekt'] = koOlduMu
    ? 'nakavt'
    : mukemmelBlokMu
      ? 'mukemmel'
      : bloktaMi
        ? 'blok'
        : hamle.temelHasar >= dengeDovus.agirVurusHasarEsigi || karsiAktif
          ? 'sert_yumruk'
          : hamle.tur === 'tekme'
            ? 'tekme'
            : 'yumruk';

  const yeniSayilar: YuzenSayi[] = [
    {
      id: sonrakiSayiId,
      hedef: savunan.kimlik,
      metin: sayiMetni,
      renk: sayiRenk,
      kalanMs: mukemmelBlokMu ? 1050 : 900,
      toplamMs: mukemmelBlokMu ? 1050 : 900,
      ofsetX: (rng() - 0.5) * 14,
      hasarDegeri: netHasar,
      efekt: efektTuru,
    },
  ];
  let guncelSayiId = sonrakiSayiId + 1;

  if (komboTamamlandi >= 2) {
    yeniSayilar.push({
      id: guncelSayiId,
      hedef: savunan.kimlik,
      metin: `${komboTamamlandi}x KOMBO!`,
      renk: '#D99B38',
      kalanMs: 1050,
      toplamMs: 1050,
      ofsetX: 0,
      ofsetY: -18,
      efekt: 'kombo',
    });
    guncelSayiId += 1;
  }

  const blokStaminaOdulu = mukemmelBlokMu ? dengeDovus.mukemmelBlokStaminaOdulu : 0;

  const olayMetni = koOlduMu
    ? `${guncelSaldiran.lakap} ${hamle.isim} ile işi bitirdi! NAKAVT!`
    : mukemmelBlokMu
      ? `${savunan.lakap} Mükemmel Blok yaptı! (-%85 hasar, +Stamina)`
      : komboTamamlandi >= 2
        ? `${guncelSaldiran.lakap}: ${komboTamamlandi}x KOMBO! (${hamle.isim} -${netHasar})`
        : `${guncelSaldiran.lakap}: ${hamle.isim} (${sayiMetni})`;

  return {
    saldiran: {
      ...guncelSaldiran,
      karsiSaldiriKalanMs: 0,
      karsiSaldiriCarpan: dengeDovus.karsiSaldiriStandartCarpan,
      vurduguIsabet: guncelSaldiran.vurduguIsabet + 1,
      sonKomboEtiketi: yeniKomboEtiket,
      komboZincirSayisi: yeniKomboSayisi,
      komboSuresiKalanMs: yeniKomboSure,
    },
    savunan: {
      ...savunan,
      can: yeniCan,
      stamina: sinirla(savunan.stamina + blokStaminaOdulu, 0, savunan.maksStamina),
      mukemmelSavunmaKalanMs: mukemmelBlokMu ? 0 : savunan.mukemmelSavunmaKalanMs,
      darbeFlasMs: bloktaMi ? 110 : 190,
      aksiyon: koOlduMu ? 'ko' : bloktaMi ? 'blok' : 'darbe_aldi',
      aktifHamleId: koOlduMu ? null : bloktaMi ? (savunan.aktifHamleId ?? null) : null,
      aksiyonKalanMs: koOlduMu ? 9999 : 250,
      aksiyonToplamMs: 250,
    },
    yeniSayilar,
    sonrakiSayiId: guncelSayiId,
    olayMetni,
    sarsintiSiddeti,
    hitstopMs,
    komboTamamlandi,
    koOlduMu,
  };
}

/**
 * Gerçek zamanlı dövüşü dtMs kadar ilerletir.
 */
export function dovusAdimi(
  dovus: DovusDurumu,
  dtMs: number,
  rng: () => number = Math.random
): DovusDurumu {
  if (dovus.durum === 'bitti') return dovus;

  const guvenliDt = Math.min(Math.max(dtMs, 0), 100);

  // KO anında yavaş çekim
  if (dovus.durum === 'ko_yavaslatma') {
    const kalan = Math.max(0, dovus.koYavaslatmaKalanMs - guvenliDt);
    const yavasDt = guvenliDt * DENGE.dovus.koHizCarpani;
    const sarsinti = Math.max(0, dovus.ekranSarsintiMs - yavasDt);
    const bittiMi = kalan <= 0;
    const yuzenSayilar =
      dovus.yuzenSayilar.length > 0
        ? dovus.yuzenSayilar
            .map((s) => ({ ...s, kalanMs: s.kalanMs - yavasDt }))
            .filter((s) => s.kalanMs > 0)
        : dovus.yuzenSayilar;

    return {
      ...dovus,
      durum: bittiMi ? 'bitti' : 'ko_yavaslatma',
      koYavaslatmaKalanMs: kalan,
      hitstopKalanMs: 0,
      ekranSarsintiMs: sarsinti,
      sarsintiSiddeti: sarsinti > 0 ? dovus.sarsintiSiddeti : 0,
      yuzenSayilar,
      oyuncu: {
        ...dovus.oyuncu,
        aksiyonKalanMs: Math.max(0, dovus.oyuncu.aksiyonKalanMs - yavasDt),
        darbeFlasMs: bittiMi ? 0 : Math.max(0, dovus.oyuncu.darbeFlasMs - yavasDt),
      },
      rakip: {
        ...dovus.rakip,
        aksiyonKalanMs: Math.max(0, dovus.rakip.aksiyonKalanMs - yavasDt),
        darbeFlasMs: bittiMi ? 0 : Math.max(0, dovus.rakip.darbeFlasMs - yavasDt),
      },
    };
  }

  // Kısa darbe donması (hitstop): yalnızca sarsıntı ve darbe flaşı akar
  if (dovus.hitstopKalanMs > 0) {
    const hitstopKalanMs = Math.max(0, dovus.hitstopKalanMs - guvenliDt);
    const ekranSarsintiMs = Math.max(0, dovus.ekranSarsintiMs - guvenliDt);
    return {
      ...dovus,
      hitstopKalanMs,
      ekranSarsintiMs,
      sarsintiSiddeti: ekranSarsintiMs > 0 ? dovus.sarsintiSiddeti : 0,
      oyuncu: {
        ...dovus.oyuncu,
        darbeFlasMs: Math.max(0, dovus.oyuncu.darbeFlasMs - guvenliDt),
      },
      rakip: {
        ...dovus.rakip,
        darbeFlasMs: Math.max(0, dovus.rakip.darbeFlasMs - guvenliDt),
      },
    };
  }

  let oyuncu = dovuscuTick(dovus.oyuncu, guvenliDt);
  let rakip = dovuscuTick(dovus.rakip, guvenliDt);
  let sonrakiSayiId = dovus.sonrakiSayiId;
  let olayMetni = dovus.sonOlayMetni;
  let ekranSarsintiMs = Math.max(0, dovus.ekranSarsintiMs - guvenliDt);
  let sarsintiSiddeti = ekranSarsintiMs > 0 ? dovus.sarsintiSiddeti : 0;
  let hitstopKalanMs = 0;
  let sonKomboSayisi = dovus.sonKomboSayisi;

  let yuzenSayilar =
    dovus.yuzenSayilar.length > 0
      ? dovus.yuzenSayilar
          .map((s) => ({ ...s, kalanMs: s.kalanMs - guvenliDt }))
          .filter((s) => s.kalanMs > 0)
      : dovus.yuzenSayilar;

  // Rakibin sıradaki hamlesini hazırlık penceresinde kilitle (telgraf)
  if (
    rakip.otomatikSayacMs > 0 &&
    rakip.otomatikSayacMs <= DENGE.dovus.telgrafPenceresiMs &&
    !rakip.hazirlananHamleId &&
    rakip.aksiyon !== 'darbe_aldi'
  ) {
    const hazirHamle = rakipHamleSec(rakip, oyuncu, rng);
    rakip = {
      ...rakip,
      hazirlananHamleId: hazirHamle.id,
    };
  }

  // 1. Oyuncunun otomatik veya öncelikli hamlesi
  if (oyuncu.otomatikSayacMs <= 0 && oyuncu.aksiyon !== 'darbe_aldi') {
    const hamle = otomatikSaldiriSec(oyuncu, rng);
    if (oyuncu.stamina < hamle.staminaMaliyeti && oyuncu.stamina < DENGE.dovus.bitkinStaminaEsigi) {
      // Çok bitkinse kısa bir nefes aralığı ver
      oyuncu = {
        ...oyuncu,
        siraHamleId: null,
        otomatikSayacMs: DENGE.dovus.oyuncuBitkinBeklemeMs,
      };
    } else {
      const sonuc = saldiriCoz(oyuncu, rakip, hamle, sonrakiSayiId, rng);
      oyuncu = sonuc.saldiran;
      rakip = sonuc.savunan;
      yuzenSayilar = [...yuzenSayilar, ...sonuc.yeniSayilar];
      sonrakiSayiId = sonuc.sonrakiSayiId;
      olayMetni = sonuc.olayMetni;
      if (sonuc.komboTamamlandi > 0) {
        sonKomboSayisi = sonuc.komboTamamlandi;
      }
      if (sonuc.sarsintiSiddeti > 0) {
        ekranSarsintiMs = sonuc.koOlduMu ? 480 : 180;
        sarsintiSiddeti = Math.max(sarsintiSiddeti, sonuc.sarsintiSiddeti);
      }
      if (sonuc.hitstopMs > 0) {
        hitstopKalanMs = Math.max(hitstopKalanMs, sonuc.hitstopMs);
      }
      if (sonuc.koOlduMu) {
        return {
          ...dovus,
          durum: 'ko_yavaslatma',
          kazanan: 'oyuncu',
          gecenSureMs: dovus.gecenSureMs + guvenliDt,
          koYavaslatmaKalanMs: DOVUS_SABITLERI.koYavaslatmaMs,
          hitstopKalanMs: 0,
          sonKomboSayisi,
          ekranSarsintiMs,
          sarsintiSiddeti,
          sonOlayMetni: olayMetni,
          yuzenSayilar,
          sonrakiSayiId,
          oyuncu,
          rakip,
        };
      }
    }
  }

  // 2. Rakibin otomatik veya yapay zeka hamlesi
  if (rakip.otomatikSayacMs <= 0 && rakip.aksiyon !== 'darbe_aldi') {
    const rakipHamle = rakip.hazirlananHamleId
      ? hamleBul(rakip.hazirlananHamleId)
      : rakipHamleSec(rakip, oyuncu, rng);
    if (rakipHamle.tur === 'kacinma') {
      const stam = sinirla(
        rakip.stamina - rakipHamle.staminaMaliyeti + (rakipHamle.staminaToparlanma ?? 0),
        0,
        rakip.maksStamina
      );
      const stamOran = stam / Math.max(1, rakip.maksStamina);
      if (rakipHamle.id === 'blok') {
        rakip = {
          ...rakip,
          stamina: stam,
          hazirlananHamleId: null,
          blokKalanMs: 850,
          aksiyon: 'blok',
          aksiyonKalanMs: 600,
          aksiyonToplamMs: 600,
          beklemeSureleri: {
            ...rakip.beklemeSureleri,
            blok: rakipHamle.beklemeSuresiMs,
          },
          otomatikSayacMs: vurusAraligiMs(rakip.statlar.ceviklik, stamOran),
        };
        olayMetni = `${rakip.lakap} gardını kapattı.`;
      } else {
        rakip = {
          ...rakip,
          stamina: stam,
          hazirlananHamleId: null,
          kacinmaKalanMs: 700,
          kacinmaBonusu: rakipHamle.karsiSaldiriFirsati ?? 20,
          aksiyon: 'kacinma',
          aksiyonKalanMs: 650,
          aksiyonToplamMs: 650,
          beklemeSureleri: {
            ...rakip.beklemeSureleri,
            [rakipHamle.id]: rakipHamle.beklemeSuresiMs,
          },
          otomatikSayacMs: vurusAraligiMs(rakip.statlar.ceviklik, stamOran),
        };
        olayMetni = `${rakip.lakap} geri adımla mesafe açtı.`;
      }
    } else if (rakip.stamina < rakipHamle.staminaMaliyeti && rakip.stamina < DENGE.dovus.bitkinStaminaEsigi) {
      rakip = {
        ...rakip,
        hazirlananHamleId: null,
        otomatikSayacMs: DENGE.dovus.rakipBitkinBeklemeMs,
      };
    } else {
      const sonuc = saldiriCoz(rakip, oyuncu, rakipHamle, sonrakiSayiId, rng);
      rakip = sonuc.saldiran;
      oyuncu = sonuc.savunan;
      yuzenSayilar = [...yuzenSayilar, ...sonuc.yeniSayilar];
      sonrakiSayiId = sonuc.sonrakiSayiId;
      olayMetni = sonuc.olayMetni;
      if (sonuc.sarsintiSiddeti > 0) {
        ekranSarsintiMs = sonuc.koOlduMu ? 480 : 210;
        sarsintiSiddeti = Math.max(sarsintiSiddeti, sonuc.sarsintiSiddeti);
      }
      if (sonuc.hitstopMs > 0) {
        hitstopKalanMs = Math.max(hitstopKalanMs, sonuc.hitstopMs);
      }
      if (sonuc.koOlduMu) {
        return {
          ...dovus,
          durum: 'ko_yavaslatma',
          kazanan: 'rakip',
          gecenSureMs: dovus.gecenSureMs + guvenliDt,
          koYavaslatmaKalanMs: DOVUS_SABITLERI.koYavaslatmaMs,
          hitstopKalanMs: 0,
          sonKomboSayisi,
          ekranSarsintiMs,
          sarsintiSiddeti,
          sonOlayMetni: olayMetni,
          yuzenSayilar,
          sonrakiSayiId,
          oyuncu,
          rakip,
        };
      }
    }
  }

  // 3. Süre dolumu kontrolü (90 sn raunt sonu karar)
  const yeniSure = dovus.gecenSureMs + guvenliDt;
  if (yeniSure >= dovus.maksSureMs) {
    const oOran = oyuncu.can / Math.max(1, oyuncu.maksCan);
    const rOran = rakip.can / Math.max(1, rakip.maksCan);
    const kazanan: 'oyuncu' | 'rakip' | 'berabere' =
      Math.abs(oOran - rOran) <= DENGE.dovus.berabereOranEsigi
        ? 'berabere'
        : oOran > rOran
          ? 'oyuncu'
          : 'rakip';
    return {
      ...dovus,
      durum: 'bitti',
      kazanan,
      gecenSureMs: dovus.maksSureMs,
      hitstopKalanMs: 0,
      sonKomboSayisi,
      ekranSarsintiMs: 0,
      sarsintiSiddeti: 0,
      sonOlayMetni:
        kazanan === 'oyuncu'
          ? 'Süre doldu — kalan can üstünlüğüyle kazandın!'
          : kazanan === 'berabere'
            ? 'Süre doldu — sokak hakemi berabere dedi.'
            : 'Süre doldu — rakip puanla kazandı.',
      yuzenSayilar,
      sonrakiSayiId,
      oyuncu,
      rakip,
    };
  }

  return {
    ...dovus,
    gecenSureMs: yeniSure,
    hitstopKalanMs,
    sonKomboSayisi,
    ekranSarsintiMs,
    sarsintiSiddeti,
    sonOlayMetni: olayMetni,
    yuzenSayilar,
    sonrakiSayiId,
    oyuncu,
    rakip,
  };
}
