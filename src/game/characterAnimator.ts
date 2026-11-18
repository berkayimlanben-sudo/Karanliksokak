/**
 * ============================================================================
 * TEK MERKEZLİ KARAKTER ANİMASYON İSKELETİ (SAF SİMÜLASYON / TEST EDİLEBİLİR)
 * Hem arena dövüşü hem mahalle sahnesi için karakter kare seçimini, aksiyon
 * ilerleme oranına bağlı animasyon zamanlamasını ve yön-uyumlu poz eğrisini hesaplar.
 * ============================================================================
 */

import {
  aksiyonAileYedegi,
  aksiyonAnimasyonTanimiAl,
  AksiyonOynatmaModu,
  hariciYedekKareAl,
  HariciSpriteKaresi,
  karakterHariciAtlasiVarMi,
  SpriteAksiyonId,
} from './spriteAtlas';

export interface AnimasyonKareSecimGirdisi {
  oynatmaModu: AksiyonOynatmaModu;
  fps: number;
  kareSayisi: number;
  gecenSureSn: number;
  ilerlemeOrani: number;
}

/**
 * Oynatma moduna göre aktif kare indeksini seçer:
 * - loop: geçen süre ve FPS ile sürekli döner (idle, walk)
 * - progress: aksiyon ilerleme oranını [0..1] kare dizisine eşler (punch, kick, hit)
 * - hold: son kareye kadar ilerleyip orada sabit kalır (ko, block)
 */
export function animasyonKareIndexSec({
  oynatmaModu,
  fps,
  kareSayisi,
  gecenSureSn,
  ilerlemeOrani,
}: AnimasyonKareSecimGirdisi): number {
  if (kareSayisi <= 1) return 0;
  const guvenliOran = Math.max(0, Math.min(0.9999, Number.isFinite(ilerlemeOrani) ? ilerlemeOrani : 0));

  if (oynatmaModu === 'progress') {
    return Math.min(kareSayisi - 1, Math.floor(guvenliOran * kareSayisi));
  }

  if (oynatmaModu === 'hold') {
    return Math.min(kareSayisi - 1, Math.floor(guvenliOran * kareSayisi));
  }

  const guvenliFps = Math.max(0.1, fps);
  const guvenliSure = Math.max(0, gecenSureSn);
  return Math.floor(guvenliSure * guvenliFps) % kareSayisi;
}

export interface KarakterKareCozumGirdisi {
  karakterId: string;
  aksiyon: SpriteAksiyonId;
  gecenSureSn: number;
  ilerlemeOrani?: number;
  reducedMotion?: boolean;
}

export interface KarakterKareCozumSonucu {
  atlasVar: boolean;
  kare: HariciSpriteKaresi | null;
  hamPozMevcut: boolean;
  oynatmaModu: AksiyonOynatmaModu;
  kareIndex: number;
}

export function karakterKareCozumle({
  karakterId,
  aksiyon,
  gecenSureSn,
  ilerlemeOrani = 0,
  reducedMotion = false,
}: KarakterKareCozumGirdisi): KarakterKareCozumSonucu {
  const atlasVar = karakterHariciAtlasiVarMi(karakterId);
  if (!atlasVar) {
    return {
      atlasVar: false,
      kare: null,
      hamPozMevcut: false,
      oynatmaModu: 'loop',
      kareIndex: 0,
    };
  }

  const dogrudanTanim = aksiyonAnimasyonTanimiAl(karakterId, aksiyon);
  const aileYedegiId = aksiyonAileYedegi(aksiyon);
  const aileTanim =
    !dogrudanTanim && aileYedegiId !== aksiyon && aileYedegiId !== 'idle'
      ? aksiyonAnimasyonTanimiAl(karakterId, aileYedegiId)
      : null;
  const etkinTanim =
    dogrudanTanim ?? aileTanim ?? aksiyonAnimasyonTanimiAl(karakterId, 'idle');

  if (!etkinTanim) {
    const yedek = hariciYedekKareAl(karakterId, aksiyon, 0);
    return {
      atlasVar: true,
      kare: yedek?.kare ?? null,
      hamPozMevcut: yedek?.hamPozMevcut ?? false,
      oynatmaModu: 'loop',
      kareIndex: 0,
    };
  }

  const kareIndex = reducedMotion
    ? 0
    : animasyonKareIndexSec({
        oynatmaModu: etkinTanim.oynatmaModu,
        fps: etkinTanim.fps,
        kareSayisi: etkinTanim.kareler.length,
        gecenSureSn,
        ilerlemeOrani,
      });

  const yedek = hariciYedekKareAl(karakterId, aksiyon, kareIndex);
  return {
    atlasVar: true,
    kare: yedek?.kare ?? null,
    hamPozMevcut: Boolean(dogrudanTanim || aileTanim) && (yedek?.hamPozMevcut ?? false),
    oynatmaModu: etkinTanim.oynatmaModu,
    kareIndex,
  };
}

export type SaldiriIziTuru =
  | 'none'
  | 'punch'
  | 'punch_heavy'
  | 'punch_hook'
  | 'punch_uppercut'
  | 'punch_body'
  | 'punch_counter'
  | 'kick'
  | 'kick_low'
  | 'kick_knee'
  | 'kick_spin';

export interface KarakterPozGirdisi {
  aksiyon: SpriteAksiyonId;
  ilerlemeOrani: number;
  gecenSureSn: number;
  olcekX: number;
  olcekY: number;
  ekranOlcegi: number;
  tersCevir?: boolean;
  hamPozMevcut: boolean;
  reducedMotion?: boolean;
}

export interface KarakterPozDonusumu {
  ekstraOfsetX: number;
  ekstraOfsetY: number;
  egimRadyan: number;
  olcekXCarpan: number;
  olcekYCarpan: number;
  alfa: number;
  golgeGenislikCarpan: number;
  golgeOfsetX: number;
  hayaletIziGoster: boolean;
  hayaletIziSayisi: number;
  hayaletIziPhantom: boolean;
  aktifSaldiriIzi: SaldiriIziTuru;
}

/**
 * Her aksiyon için ekran koordinatlarında fiziksel poz dönüşümü (lunge, eğim,
 * zemin bounce, hayalet iz ve KO devrilmesi) hesaplar.
 * Özel çizilmiş poz kareleri (hamPozMevcut=true) eklendikçe yapay eğim otomatik
 * yumuşatılır; yalnızca hafif fiziksel itki korunur.
 */
export function karakterPozHesapla({
  aksiyon,
  ilerlemeOrani,
  gecenSureSn,
  olcekX,
  olcekY,
  ekranOlcegi,
  tersCevir = false,
  hamPozMevcut,
  reducedMotion = false,
}: KarakterPozGirdisi): KarakterPozDonusumu {
  const yon = tersCevir ? -1 : 1;
  const oran = Math.max(0, Math.min(1, Number.isFinite(ilerlemeOrani) ? ilerlemeOrani : 0));

  const sonuc: KarakterPozDonusumu = {
    ekstraOfsetX: 0,
    ekstraOfsetY: 0,
    egimRadyan: 0,
    olcekXCarpan: 1,
    olcekYCarpan: 1,
    alfa: 1,
    golgeGenislikCarpan: 1,
    golgeOfsetX: 0,
    hayaletIziGoster: false,
    hayaletIziSayisi: 0,
    hayaletIziPhantom: false,
    aktifSaldiriIzi: 'none',
  };

  if (aksiyon === 'ko') {
    if (hamPozMevcut) {
      // Özel çizilmiş KO kareleri zaten zemine yatay uzandığı için ekstra döndürme uygulanmaz
      sonuc.golgeGenislikCarpan = 2.2;
      return sonuc;
    }
    sonuc.egimRadyan = yon * (-Math.PI / 2);
    sonuc.ekstraOfsetX = yon * Math.round(10 * ekranOlcegi);
    sonuc.ekstraOfsetY = -Math.round(5 * ekranOlcegi);
    sonuc.alfa = 0.88;
    sonuc.golgeGenislikCarpan = 2.3;
    sonuc.golgeOfsetX = yon * -Math.round(8 * ekranOlcegi);
    return sonuc;
  }

  if (reducedMotion) {
    return sonuc;
  }

  // Özel çizilmiş poz kareleri varsa abartılı eğimi azalt, fiziksel ileri atılımı koru
  const egimCarpan = hamPozMevcut ? 0.25 : 1;

  if (aksiyon === 'walk') {
    if (!hamPozMevcut) {
      sonuc.ekstraOfsetY = -Math.abs(Math.sin(gecenSureSn * 14)) * 2.4 * olcekY;
      sonuc.egimRadyan = yon * 0.08;
    }
    return sonuc;
  }

  if (aksiyon === 'punch') {
    if (oran < 0.28) {
      sonuc.ekstraOfsetX = yon * -3 * olcekX;
      sonuc.egimRadyan = yon * -0.09 * egimCarpan;
      sonuc.olcekXCarpan = hamPozMevcut ? 1 : 0.96;
      sonuc.olcekYCarpan = hamPozMevcut ? 1 : 1.03;
    } else if (oran < 0.72) {
      sonuc.ekstraOfsetX = yon * 9 * olcekX;
      sonuc.ekstraOfsetY = -1 * olcekY;
      sonuc.egimRadyan = yon * 0.16 * egimCarpan;
      sonuc.olcekXCarpan = hamPozMevcut ? 1 : 1.07;
      sonuc.olcekYCarpan = hamPozMevcut ? 1 : 0.97;
      sonuc.aktifSaldiriIzi = 'punch';
    } else {
      sonuc.ekstraOfsetX = yon * 3 * olcekX;
      sonuc.egimRadyan = yon * 0.06 * egimCarpan;
    }
    return sonuc;
  }

  if (aksiyon === 'punch_heavy') {
    if (oran < 0.3) {
      sonuc.ekstraOfsetX = yon * -5 * olcekX;
      sonuc.ekstraOfsetY = 1 * olcekY;
      sonuc.egimRadyan = yon * -0.14 * egimCarpan;
    } else if (oran < 0.76) {
      sonuc.ekstraOfsetX = yon * 12 * olcekX;
      sonuc.ekstraOfsetY = 1 * olcekY;
      sonuc.egimRadyan = yon * 0.22 * egimCarpan;
      sonuc.golgeGenislikCarpan = 1.15;
      sonuc.aktifSaldiriIzi = 'punch_heavy';
    } else {
      sonuc.ekstraOfsetX = yon * 4 * olcekX;
      sonuc.egimRadyan = yon * 0.08 * egimCarpan;
    }
    return sonuc;
  }

  if (aksiyon === 'punch_hook') {
    if (oran < 0.26) {
      sonuc.ekstraOfsetX = yon * -3 * olcekX;
      sonuc.egimRadyan = yon * -0.11 * egimCarpan;
    } else if (oran < 0.72) {
      sonuc.ekstraOfsetX = yon * 10 * olcekX;
      sonuc.ekstraOfsetY = -2 * olcekY;
      sonuc.egimRadyan = yon * 0.14 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'punch_hook';
    } else {
      sonuc.ekstraOfsetX = yon * 3 * olcekX;
      sonuc.egimRadyan = yon * 0.04 * egimCarpan;
    }
    return sonuc;
  }

  if (aksiyon === 'punch_uppercut') {
    if (oran < 0.28) {
      sonuc.ekstraOfsetX = yon * 1 * olcekX;
      sonuc.ekstraOfsetY = 4 * olcekY;
      sonuc.egimRadyan = yon * 0.08 * egimCarpan;
    } else if (oran < 0.75) {
      sonuc.ekstraOfsetX = yon * 8 * olcekX;
      sonuc.ekstraOfsetY = -7 * olcekY;
      sonuc.egimRadyan = yon * -0.12 * egimCarpan;
      sonuc.golgeGenislikCarpan = 0.85;
      sonuc.aktifSaldiriIzi = 'punch_uppercut';
    } else {
      sonuc.ekstraOfsetX = yon * 3 * olcekX;
      sonuc.ekstraOfsetY = -2 * olcekY;
    }
    return sonuc;
  }

  if (aksiyon === 'punch_body') {
    if (oran < 0.26) {
      sonuc.ekstraOfsetX = yon * -2 * olcekX;
      sonuc.ekstraOfsetY = 3 * olcekY;
      sonuc.egimRadyan = yon * 0.1 * egimCarpan;
    } else if (oran < 0.72) {
      sonuc.ekstraOfsetX = yon * 10 * olcekX;
      sonuc.ekstraOfsetY = 3 * olcekY;
      sonuc.egimRadyan = yon * 0.18 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'punch_body';
    } else {
      sonuc.ekstraOfsetX = yon * 3 * olcekX;
      sonuc.ekstraOfsetY = 1 * olcekY;
    }
    return sonuc;
  }

  if (aksiyon === 'punch_counter') {
    if (oran < 0.18) {
      sonuc.ekstraOfsetX = yon * -1 * olcekX;
      sonuc.egimRadyan = yon * -0.05 * egimCarpan;
    } else if (oran < 0.68) {
      sonuc.ekstraOfsetX = yon * 11 * olcekX;
      sonuc.ekstraOfsetY = -1 * olcekY;
      sonuc.egimRadyan = yon * 0.14 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'punch_counter';
    } else {
      sonuc.ekstraOfsetX = yon * 2 * olcekX;
    }
    return sonuc;
  }

  if (aksiyon === 'kick') {
    if (oran < 0.35) {
      sonuc.ekstraOfsetX = yon * 2 * olcekX;
      sonuc.ekstraOfsetY = -3 * olcekY;
      sonuc.egimRadyan = yon * -0.08 * egimCarpan;
    } else {
      sonuc.ekstraOfsetX = yon * 9 * olcekX;
      sonuc.ekstraOfsetY = -5 * olcekY;
      sonuc.egimRadyan = yon * -0.22 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'kick';
    }
    return sonuc;
  }

  if (aksiyon === 'kick_low') {
    if (oran < 0.3) {
      sonuc.ekstraOfsetX = yon * 1 * olcekX;
      sonuc.ekstraOfsetY = 1 * olcekY;
      sonuc.egimRadyan = yon * -0.06 * egimCarpan;
    } else {
      sonuc.ekstraOfsetX = yon * 8 * olcekX;
      sonuc.ekstraOfsetY = 2 * olcekY;
      sonuc.egimRadyan = yon * -0.1 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'kick_low';
    }
    return sonuc;
  }

  if (aksiyon === 'kick_knee') {
    if (oran < 0.28) {
      sonuc.ekstraOfsetX = yon * 4 * olcekX;
      sonuc.ekstraOfsetY = -1 * olcekY;
    } else if (oran < 0.78) {
      sonuc.ekstraOfsetX = yon * 12 * olcekX;
      sonuc.ekstraOfsetY = -4 * olcekY;
      sonuc.egimRadyan = yon * 0.1 * egimCarpan;
      sonuc.aktifSaldiriIzi = 'kick_knee';
    } else {
      sonuc.ekstraOfsetX = yon * 4 * olcekX;
    }
    return sonuc;
  }

  if (aksiyon === 'kick_spin') {
    if (oran < 0.32) {
      sonuc.ekstraOfsetX = yon * -2 * olcekX;
      sonuc.ekstraOfsetY = -3 * olcekY;
      sonuc.egimRadyan = yon * -0.12 * egimCarpan;
    } else if (oran < 0.8) {
      sonuc.ekstraOfsetX = yon * 12 * olcekX;
      sonuc.ekstraOfsetY = -8 * olcekY;
      sonuc.egimRadyan = yon * -0.24 * egimCarpan;
      sonuc.golgeGenislikCarpan = 0.8;
      sonuc.aktifSaldiriIzi = 'kick_spin';
    } else {
      sonuc.ekstraOfsetX = yon * 4 * olcekX;
      sonuc.ekstraOfsetY = -2 * olcekY;
    }
    return sonuc;
  }

  if (aksiyon === 'block') {
    sonuc.ekstraOfsetX = yon * 1 * olcekX;
    sonuc.ekstraOfsetY = 2 * olcekY;
    sonuc.egimRadyan = yon * 0.05 * egimCarpan;
    sonuc.olcekXCarpan = hamPozMevcut ? 1 : 1.04;
    sonuc.olcekYCarpan = hamPozMevcut ? 1 : 0.94;
    return sonuc;
  }

  if (aksiyon === 'block_steel') {
    sonuc.ekstraOfsetX = yon * 2 * olcekX;
    sonuc.ekstraOfsetY = 3 * olcekY;
    sonuc.egimRadyan = yon * 0.03 * egimCarpan;
    sonuc.golgeGenislikCarpan = 1.15;
    return sonuc;
  }

  if (aksiyon === 'dodge') {
    sonuc.hayaletIziGoster = true;
    sonuc.hayaletIziSayisi = 1;
    sonuc.ekstraOfsetX = yon * -8 * olcekX;
    sonuc.ekstraOfsetY = 3 * olcekY;
    sonuc.egimRadyan = yon * -0.22 * egimCarpan;
    sonuc.olcekYCarpan = hamPozMevcut ? 1 : 0.91;
    return sonuc;
  }

  if (aksiyon === 'dodge_duck') {
    sonuc.hayaletIziGoster = true;
    sonuc.hayaletIziSayisi = 1;
    sonuc.ekstraOfsetX = yon * -3 * olcekX;
    sonuc.ekstraOfsetY = 7 * olcekY;
    sonuc.egimRadyan = yon * 0.1 * egimCarpan;
    sonuc.golgeGenislikCarpan = 1.12;
    return sonuc;
  }

  if (aksiyon === 'dodge_phantom') {
    sonuc.hayaletIziGoster = true;
    sonuc.hayaletIziSayisi = 2;
    sonuc.hayaletIziPhantom = true;
    sonuc.ekstraOfsetX = yon * -13 * olcekX;
    sonuc.ekstraOfsetY = 1 * olcekY;
    sonuc.egimRadyan = yon * -0.18 * egimCarpan;
    sonuc.alfa = 0.92;
    return sonuc;
  }

  if (aksiyon === 'hit') {
    const kalanOran = Math.max(0.25, 1 - oran);
    sonuc.ekstraOfsetX = yon * -6 * olcekX * kalanOran;
    sonuc.egimRadyan = yon * -0.22 * kalanOran;
    return sonuc;
  }

  return sonuc;
}
