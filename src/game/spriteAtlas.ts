/**
 * ============================================================================
 * HARİCİ PIXEL ART SPRİTE ATLAS & ÇİZİM ALTYAPISI
 * PNG sprite karelerini önbelleğe alır, tam sayı piksel ölçeğiyle (sıfır mixel)
 * zemin çizgisine hizalayarak çizer ve beyaz darbe flaşı maskesi üretir.
 * ============================================================================
 */

export type KarakterSpriteId = 'kerem' | (string & {});

export type SpriteAksiyonId =
  | 'idle'
  | 'walk'
  | 'punch'
  | 'punch_heavy'
  | 'punch_hook'
  | 'punch_uppercut'
  | 'punch_body'
  | 'punch_counter'
  | 'kick'
  | 'kick_low'
  | 'kick_knee'
  | 'kick_spin'
  | 'block'
  | 'block_steel'
  | 'dodge'
  | 'dodge_duck'
  | 'dodge_phantom'
  | 'hit'
  | 'ko';

export type AksiyonOynatmaModu = 'loop' | 'progress' | 'hold';

export interface HariciSpriteKaresi {
  id: string;
  yol: string;
  genislik: number;
  yukseklik: number;
  /** Şeffaf olmayan gerçek karakter yüksekliği (ölçek tutarlılığı için). */
  icerikYuksekligi: number;
  /** Kaynak görselin altındaki boş piksel sayısı (ayak tabanı hizalaması için). */
  altBosluk: number;
  /** Kaynak görsel içindeki yatay merkez pikseli. */
  merkezX: number;
  /** Sprite sheet içinden kesilecek kaynak X/Y/W/H (opsiyonel; verilmezse tam görsel). */
  kaynakX?: number;
  kaynakY?: number;
  kaynakGenislik?: number;
  kaynakYukseklik?: number;
}

export interface AksiyonAnimasyonTanimi {
  kareler: HariciSpriteKaresi[];
  oynatmaModu: AksiyonOynatmaModu;
  fps?: number;
}

export type AksiyonAtlasGirdisi = HariciSpriteKaresi[] | AksiyonAnimasyonTanimi;
export type KarakterSpriteHaritasi = Partial<Record<SpriteAksiyonId, AksiyonAtlasGirdisi>>;

export interface SpriteSheetKesimSecenekleri {
  idOnEki: string;
  yol: string;
  kareGenislik: number;
  kareYukseklik: number;
  kareSayisi: number;
  icerikYuksekligi: number;
  altBosluk: number;
  merkezX: number;
  satirIndex?: number;
}

/**
 * Yatay bir sprite-sheet PNG dosyasından tek satırda kare dizisi üretir.
 * Böylece yeni karakterler ister tek tek PNG kareleri, ister sprite-sheet olarak eklenebilir.
 */
export function spriteSheetKareleriOlustur({
  idOnEki,
  yol,
  kareGenislik,
  kareYukseklik,
  kareSayisi,
  icerikYuksekligi,
  altBosluk,
  merkezX,
  satirIndex = 0,
}: SpriteSheetKesimSecenekleri): HariciSpriteKaresi[] {
  const kareler: HariciSpriteKaresi[] = [];
  for (let i = 0; i < kareSayisi; i += 1) {
    kareler.push({
      id: `${idOnEki}_${i}`,
      yol,
      genislik: kareGenislik,
      yukseklik: kareYukseklik,
      icerikYuksekligi,
      altBosluk,
      merkezX,
      kaynakX: i * kareGenislik,
      kaynakY: satirIndex * kareYukseklik,
      kaynakGenislik: kareGenislik,
      kaynakYukseklik: kareYukseklik,
    });
  }
  return kareler;
}

const VARSAYILAN_OYNATMA_MODU: Record<SpriteAksiyonId, AksiyonOynatmaModu> = {
  idle: 'loop',
  walk: 'loop',
  punch: 'progress',
  punch_heavy: 'progress',
  punch_hook: 'progress',
  punch_uppercut: 'progress',
  punch_body: 'progress',
  punch_counter: 'progress',
  kick: 'progress',
  kick_low: 'progress',
  kick_knee: 'progress',
  kick_spin: 'progress',
  block: 'progress',
  block_steel: 'progress',
  dodge: 'progress',
  dodge_duck: 'progress',
  dodge_phantom: 'progress',
  hit: 'progress',
  ko: 'hold',
};

const VARSAYILAN_FPS: Record<SpriteAksiyonId, number> = {
  idle: 2.4,
  walk: 8,
  punch: 10,
  punch_heavy: 9,
  punch_hook: 10,
  punch_uppercut: 10,
  punch_body: 10,
  punch_counter: 12,
  kick: 9,
  kick_low: 10,
  kick_knee: 10,
  kick_spin: 9,
  block: 6,
  block_steel: 6,
  dodge: 10,
  dodge_duck: 10,
  dodge_phantom: 11,
  hit: 8,
  ko: 8,
};

function keremEastKare(ad: string): HariciSpriteKaresi {
  return {
    id: `kerem_east_${ad}`,
    yol: `/assets/sprites/kerem/east/${ad}.png`,
    genislik: 48,
    yukseklik: 48,
    icerikYuksekligi: 44,
    altBosluk: 2,
    merkezX: 24,
  };
}

/**
 * Her hamle ID'sini kendine özgü sprite animasyon aksiyonuna bağlar.
 */
export const HAMLE_SPRITE_AKSIYON_HARITASI: Record<string, SpriteAksiyonId> = {
  duz_yumruk: 'punch',
  sert_yumruk: 'punch_heavy',
  sol_krose: 'punch_hook',
  cene_aparkati: 'punch_uppercut',
  vucut_krosesi: 'punch_body',
  capraz_kontra: 'punch_counter',
  alcak_tekme: 'kick_low',
  yan_tekme: 'kick',
  diz_darbesi: 'kick_knee',
  doner_tekme: 'kick_spin',
  blok: 'block',
  celik_gard: 'block_steel',
  geri_cekil: 'dodge',
  egil_yana_kay: 'dodge_duck',
  hayalet_adim: 'dodge_phantom',
};

export function hamleSpriteAksiyonuBul(
  hamleId: string | null | undefined,
  dovusAksiyon: string,
  can: number
): SpriteAksiyonId {
  if (dovusAksiyon === 'ko' || can <= 0) return 'ko';
  if (dovusAksiyon === 'darbe_aldi') return 'hit';
  if (hamleId && HAMLE_SPRITE_AKSIYON_HARITASI[hamleId]) {
    return HAMLE_SPRITE_AKSIYON_HARITASI[hamleId];
  }
  if (dovusAksiyon === 'blok') return 'block';
  if (dovusAksiyon === 'kacinma') return 'dodge';
  if (dovusAksiyon === 'yumruk') return 'punch';
  if (dovusAksiyon === 'tekme') return 'kick';
  return 'idle';
}

export function aksiyonAileYedegi(aksiyon: SpriteAksiyonId): SpriteAksiyonId {
  if (aksiyon.startsWith('punch_')) return 'punch';
  if (aksiyon.startsWith('kick_')) return 'kick';
  if (aksiyon.startsWith('block_')) return 'block';
  if (aksiyon.startsWith('dodge_')) return 'dodge';
  return 'idle';
}

/**
 * Karakter ID -> Aksiyon -> Animasyon tanımı.
 * Yeni karakterler veya yeni animasyon PNG'leri geldikçe buraya yalnızca veri kaydı eklenir.
 */
export const KARAKTER_SPRITE_ATLASI: Record<string, KarakterSpriteHaritasi> = {
  kerem: {
    idle: {
      kareler: [keremEastKare('idle_0'), keremEastKare('idle_1')],
      oynatmaModu: 'loop',
      fps: 2.4,
    },
    walk: {
      kareler: [
        keremEastKare('walk_0'),
        keremEastKare('walk_1'),
        keremEastKare('walk_2'),
        keremEastKare('walk_3'),
      ],
      oynatmaModu: 'loop',
      fps: 9,
    },
    punch: {
      kareler: [
        keremEastKare('punch_0'),
        keremEastKare('punch_1'),
        keremEastKare('punch_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    punch_heavy: {
      kareler: [
        keremEastKare('punch_heavy_0'),
        keremEastKare('punch_heavy_1'),
        keremEastKare('punch_heavy_2'),
      ],
      oynatmaModu: 'progress',
      fps: 9,
    },
    punch_hook: {
      kareler: [
        keremEastKare('punch_hook_0'),
        keremEastKare('punch_hook_1'),
        keremEastKare('punch_hook_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    punch_uppercut: {
      kareler: [
        keremEastKare('punch_uppercut_0'),
        keremEastKare('punch_uppercut_1'),
        keremEastKare('punch_uppercut_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    punch_body: {
      kareler: [
        keremEastKare('punch_body_0'),
        keremEastKare('punch_body_1'),
        keremEastKare('punch_body_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    punch_counter: {
      kareler: [
        keremEastKare('punch_counter_0'),
        keremEastKare('punch_counter_1'),
        keremEastKare('punch_counter_2'),
      ],
      oynatmaModu: 'progress',
      fps: 12,
    },
    kick: {
      kareler: [
        keremEastKare('kick_0'),
        keremEastKare('kick_1'),
        keremEastKare('kick_2'),
      ],
      oynatmaModu: 'progress',
      fps: 9,
    },
    kick_low: {
      kareler: [
        keremEastKare('kick_low_0'),
        keremEastKare('kick_low_1'),
        keremEastKare('kick_low_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    kick_knee: {
      kareler: [
        keremEastKare('kick_knee_0'),
        keremEastKare('kick_knee_1'),
        keremEastKare('kick_knee_2'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    kick_spin: {
      kareler: [
        keremEastKare('kick_spin_0'),
        keremEastKare('kick_spin_1'),
        keremEastKare('kick_spin_2'),
      ],
      oynatmaModu: 'progress',
      fps: 9,
    },
    block: {
      kareler: [keremEastKare('block_0'), keremEastKare('block_1')],
      oynatmaModu: 'progress',
      fps: 6,
    },
    block_steel: {
      kareler: [
        keremEastKare('block_steel_0'),
        keremEastKare('block_steel_1'),
        keremEastKare('block_steel_1'),
      ],
      oynatmaModu: 'progress',
      fps: 6,
    },
    dodge: {
      kareler: [keremEastKare('dodge_0'), keremEastKare('dodge_1')],
      oynatmaModu: 'progress',
      fps: 10,
    },
    dodge_duck: {
      kareler: [
        keremEastKare('dodge_duck_0'),
        keremEastKare('dodge_duck_1'),
        keremEastKare('dodge_duck_1'),
      ],
      oynatmaModu: 'progress',
      fps: 10,
    },
    dodge_phantom: {
      kareler: [
        keremEastKare('dodge_phantom_0'),
        keremEastKare('dodge_phantom_1'),
        keremEastKare('dodge_phantom_1'),
      ],
      oynatmaModu: 'progress',
      fps: 11,
    },
    hit: {
      kareler: [keremEastKare('hit_0'), keremEastKare('hit_1')],
      oynatmaModu: 'progress',
      fps: 8,
    },
    ko: {
      kareler: [
        keremEastKare('ko_0'),
        keremEastKare('ko_1'),
        keremEastKare('ko_2'),
      ],
      oynatmaModu: 'hold',
      fps: 6,
    },
  },
};

export interface HariciYedekKareSonucu {
  kare: HariciSpriteKaresi;
  hamPozMevcut: boolean;
}

function girdiNormalizeEt(
  aksiyon: SpriteAksiyonId,
  girdi: AksiyonAtlasGirdisi | undefined
): Required<AksiyonAnimasyonTanimi> | null {
  if (!girdi) return null;
  if (Array.isArray(girdi)) {
    if (girdi.length === 0) return null;
    return {
      kareler: girdi,
      oynatmaModu: VARSAYILAN_OYNATMA_MODU[aksiyon],
      fps: VARSAYILAN_FPS[aksiyon],
    };
  }
  if (girdi.kareler.length === 0) return null;
  return {
    kareler: girdi.kareler,
    oynatmaModu: girdi.oynatmaModu,
    fps: girdi.fps ?? VARSAYILAN_FPS[aksiyon],
  };
}

export function aksiyonAnimasyonTanimiAl(
  karakterId: string,
  aksiyon: SpriteAksiyonId
): Required<AksiyonAnimasyonTanimi> | null {
  const karakterHaritasi = KARAKTER_SPRITE_ATLASI[karakterId];
  if (!karakterHaritasi) return null;
  return girdiNormalizeEt(aksiyon, karakterHaritasi[aksiyon]);
}

export function karakterHariciAtlasiVarMi(karakterId: string): boolean {
  const karakterHaritasi = KARAKTER_SPRITE_ATLASI[karakterId];
  if (!karakterHaritasi) return false;
  return Object.entries(karakterHaritasi).some(([aksiyon, girdi]) =>
    Boolean(girdiNormalizeEt(aksiyon as SpriteAksiyonId, girdi))
  );
}

export function hariciSpriteKaresiAl(
  karakterId: string,
  aksiyon: SpriteAksiyonId,
  kareIndex = 0
): HariciSpriteKaresi | null {
  const tanim = aksiyonAnimasyonTanimiAl(karakterId, aksiyon);
  if (!tanim) return null;
  const guvenliIndex = ((kareIndex % tanim.kareler.length) + tanim.kareler.length) % tanim.kareler.length;
  return tanim.kareler[guvenliIndex] ?? null;
}

/**
 * Karakterin ilgili aksiyon için ham PNG karesi varsa onu döner; henüz özel PNG
 * üretilmemişse önce aile yedeğine (punch_* -> punch), ardından idle'a düşer.
 * Böylece animasyon sırasında eski 16x24 piksel ızgarasına geri sıçrama yaşanmaz.
 */
export function hariciYedekKareAl(
  karakterId: string,
  aksiyon: SpriteAksiyonId,
  kareIndex = 0
): HariciYedekKareSonucu | null {
  const dogrudan = hariciSpriteKaresiAl(karakterId, aksiyon, kareIndex);
  if (dogrudan) {
    return { kare: dogrudan, hamPozMevcut: true };
  }
  const aileYedegiId = aksiyonAileYedegi(aksiyon);
  if (aileYedegiId !== aksiyon && aileYedegiId !== 'idle') {
    const aileYedegi = hariciSpriteKaresiAl(karakterId, aileYedegiId, kareIndex);
    if (aileYedegi) {
      return { kare: aileYedegi, hamPozMevcut: true };
    }
  }
  const idleYedek = hariciSpriteKaresiAl(karakterId, 'idle', kareIndex);
  if (idleYedek) {
    return { kare: idleYedek, hamPozMevcut: false };
  }
  const karakterHaritasi = KARAKTER_SPRITE_ATLASI[karakterId];
  if (!karakterHaritasi) return null;
  for (const [aksiyonKey, girdi] of Object.entries(karakterHaritasi)) {
    const tanim = girdiNormalizeEt(aksiyonKey as SpriteAksiyonId, girdi);
    if (tanim) {
      const guvenliIndex = ((kareIndex % tanim.kareler.length) + tanim.kareler.length) % tanim.kareler.length;
      return { kare: tanim.kareler[guvenliIndex], hamPozMevcut: false };
    }
  }
  return null;
}

/**
 * Harici PNG sprite için her pikselin tam kare kalmasını sağlayan
 * en yakın tam sayı ekran ölçeğini hesaplar.
 */
export function hedefEkranOlcegiHesapla(
  hedefYukseklikPx: number,
  icerikYuksekligiPx: number,
  maksYukseklikPx?: number
): number {
  const guvenliIcerik = Math.max(1, icerikYuksekligiPx);
  let olcek = Math.max(1, Math.round(hedefYukseklikPx / guvenliIcerik));
  if (maksYukseklikPx !== undefined && maksYukseklikPx > 0) {
    while (olcek > 1 && olcek * guvenliIcerik > maksYukseklikPx) {
      olcek -= 1;
    }
  }
  return olcek;
}

export interface SpriteCizimKonumGirdisi {
  merkezEkranX: number;
  zeminEkranY: number;
  kare: HariciSpriteKaresi;
  ekranOlcegi: number;
  tersCevir?: boolean;
  ekstraOfsetX?: number;
  ekstraOfsetY?: number;
  golgeGenislikCarpan?: number;
  golgeOfsetX?: number;
}

export interface SpriteCizimDikdortgeni {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  shadowX: number;
  shadowY: number;
  shadowW: number;
  shadowH: number;
}

/**
 * Sprite'ın ayak tabanını (yukseklik - altBosluk) tam zeminEkranY çizgisine,
 * yatay merkezini ise merkezEkranX noktasına tam piksel koordinatlarıyla oturtur.
 */
export function spriteCizimDikdortgeniHesapla({
  merkezEkranX,
  zeminEkranY,
  kare,
  ekranOlcegi,
  tersCevir = false,
  ekstraOfsetX = 0,
  ekstraOfsetY = 0,
  golgeGenislikCarpan = 1,
  golgeOfsetX = 0,
}: SpriteCizimKonumGirdisi): SpriteCizimDikdortgeni {
  const olcek = Math.max(1, Math.round(ekranOlcegi));
  const drawW = kare.genislik * olcek;
  const drawH = kare.yukseklik * olcek;
  const etkinMerkezX = tersCevir ? kare.genislik - kare.merkezX : kare.merkezX;

  const drawX = Math.round(merkezEkranX + ekstraOfsetX - etkinMerkezX * olcek);
  const drawY = Math.round(zeminEkranY + ekstraOfsetY - (kare.yukseklik - kare.altBosluk) * olcek);

  const shadowW = Math.max(12, Math.round(18 * olcek * golgeGenislikCarpan));
  const shadowH = Math.max(3, Math.round(olcek * 1.1));
  const shadowX = Math.round(merkezEkranX + ekstraOfsetX + golgeOfsetX - shadowW / 2);
  const shadowY = Math.round(zeminEkranY - Math.floor(shadowH / 2));

  return {
    drawX,
    drawY,
    drawW,
    drawH,
    shadowX,
    shadowY,
    shadowW,
    shadowH,
  };
}

// ----------------------------------------------------------------------------
// Tarayıcı Görsel Önbelleği & Beyaz Darbe Flaşı Maskesi
// ----------------------------------------------------------------------------
const GORSEL_ONBELLEGI = new Map<string, HTMLImageElement>();
const HATALI_YOLLAR = new Set<string>();
const FLAS_MASKESI_ONBELLEGI = new Map<string, HTMLCanvasElement>();
const YUKLENEN_YOL_DINLEYICILERI = new Set<() => void>();
let onYuklemeBaslatildi = false;

export function spriteAtlasOnYukle(onYuklendi?: () => void): void {
  if (onYuklendi) {
    YUKLENEN_YOL_DINLEYICILERI.add(onYuklendi);
  }
  if (typeof Image === 'undefined') return;

  for (const karakterHaritasi of Object.values(KARAKTER_SPRITE_ATLASI)) {
    for (const [aksiyonKey, girdi] of Object.entries(karakterHaritasi)) {
      const tanim = girdiNormalizeEt(aksiyonKey as SpriteAksiyonId, girdi);
      if (!tanim) continue;
      for (const kare of tanim.kareler) {
        if (GORSEL_ONBELLEGI.has(kare.yol)) continue;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          HATALI_YOLLAR.delete(kare.yol);
          for (const dinleyici of YUKLENEN_YOL_DINLEYICILERI) {
            dinleyici();
          }
        };
        img.onerror = () => {
          HATALI_YOLLAR.add(kare.yol);
          for (const dinleyici of YUKLENEN_YOL_DINLEYICILERI) {
            dinleyici();
          }
        };
        img.src = kare.yol;
        GORSEL_ONBELLEGI.set(kare.yol, img);
      }
    }
  }
  onYuklemeBaslatildi = true;
}

if (typeof Image !== 'undefined') {
  spriteAtlasOnYukle();
}

export function spriteAtlasDinleyicisiniKaldir(onYuklendi: () => void): void {
  YUKLENEN_YOL_DINLEYICILERI.delete(onYuklendi);
}

export function hariciSpriteHataliMi(kare: HariciSpriteKaresi): boolean {
  return HATALI_YOLLAR.has(kare.yol);
}

export function hariciSpriteHazirMi(kare: HariciSpriteKaresi): HTMLImageElement | null {
  if (!onYuklemeBaslatildi && typeof Image !== 'undefined') {
    spriteAtlasOnYukle();
  }
  const img = GORSEL_ONBELLEGI.get(kare.yol);
  if (!img || !img.complete || img.naturalWidth <= 0) return null;
  return img;
}

function beyazFlasMaskesiAl(
  kare: HariciSpriteKaresi,
  img: HTMLImageElement
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const maskeAnahtari = kare.id || kare.yol;
  const mevcut = FLAS_MASKESI_ONBELLEGI.get(maskeAnahtari);
  if (mevcut) return mevcut;

  const sx = kare.kaynakX ?? 0;
  const sy = kare.kaynakY ?? 0;
  const sw = kare.kaynakGenislik ?? kare.genislik;
  const sh = kare.kaynakYukseklik ?? kare.yukseklik;

  const tuval = document.createElement('canvas');
  tuval.width = kare.genislik;
  tuval.height = kare.yukseklik;
  const tCtx = tuval.getContext('2d');
  if (!tCtx) return null;

  tCtx.imageSmoothingEnabled = false;
  tCtx.drawImage(img, sx, sy, sw, sh, 0, 0, kare.genislik, kare.yukseklik);

  try {
    const imgData = tCtx.getImageData(0, 0, kare.genislik, kare.yukseklik);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      // Koyu kontur piksellerini koru, iç pikselleri kırık beyaza boya
      const parlaklik = data[i] + data[i + 1] + data[i + 2];
      if (parlaklik > 72) {
        data[i] = 234;
        data[i + 1] = 236;
        data[i + 2] = 239;
      }
    }
    tCtx.putImageData(imgData, 0, 0);
  } catch {
    tCtx.globalCompositeOperation = 'source-atop';
    tCtx.fillStyle = 'rgba(234, 236, 239, 0.9)';
    tCtx.fillRect(0, 0, kare.genislik, kare.yukseklik);
    tCtx.globalCompositeOperation = 'source-over';
  }

  FLAS_MASKESI_ONBELLEGI.set(maskeAnahtari, tuval);
  return tuval;
}

export interface HariciSpriteCizimSecenekleri {
  merkezEkranX: number;
  zeminEkranY: number;
  ekranOlcegi: number;
  tersCevir?: boolean;
  ekstraOfsetX?: number;
  ekstraOfsetY?: number;
  egimRadyan?: number;
  olcekXCarpan?: number;
  olcekYCarpan?: number;
  alfa?: number;
  beyazFlas?: boolean;
  golgeCiz?: boolean;
  golgeAlfa?: number;
  golgeGenislikCarpan?: number;
  golgeOfsetX?: number;
}

/**
 * Hazır PNG kareyi keskin piksel ölçeğiyle çizer. Görsel henüz yüklenmediyse
 * false döner ve çağıran taraf yükleme/yedek durumunu yönetebilir.
 */
export function hariciSpriteCiz(
  ctx: CanvasRenderingContext2D,
  kare: HariciSpriteKaresi,
  secenekler: HariciSpriteCizimSecenekleri
): boolean {
  const img = hariciSpriteHazirMi(kare);
  if (!img) return false;

  const olcek = Math.max(1, Math.round(secenekler.ekranOlcegi));
  const dikdortgen = spriteCizimDikdortgeniHesapla({
    merkezEkranX: secenekler.merkezEkranX,
    zeminEkranY: secenekler.zeminEkranY,
    kare,
    ekranOlcegi: olcek,
    tersCevir: secenekler.tersCevir,
    ekstraOfsetX: secenekler.ekstraOfsetX,
    ekstraOfsetY: secenekler.ekstraOfsetY,
    golgeGenislikCarpan: secenekler.golgeGenislikCarpan,
    golgeOfsetX: secenekler.golgeOfsetX,
  });

  if (secenekler.golgeCiz !== false) {
    const alfa = secenekler.golgeAlfa ?? 0.54;
    ctx.fillStyle = `rgba(0, 0, 0, ${alfa})`;
    ctx.fillRect(dikdortgen.shadowX, dikdortgen.shadowY, dikdortgen.shadowW, dikdortgen.shadowH);
  }

  const maske = secenekler.beyazFlas ? beyazFlasMaskesiAl(kare, img) : null;
  const kaynak: CanvasImageSource = maske ?? img;
  const sx = maske ? 0 : (kare.kaynakX ?? 0);
  const sy = maske ? 0 : (kare.kaynakY ?? 0);
  const sw = maske ? kare.genislik : (kare.kaynakGenislik ?? kare.genislik);
  const sh = maske ? kare.yukseklik : (kare.kaynakYukseklik ?? kare.yukseklik);

  const egim = secenekler.egimRadyan ?? 0;
  const olcekX = secenekler.olcekXCarpan ?? 1;
  const olcekY = secenekler.olcekYCarpan ?? 1;
  const alfa = secenekler.alfa ?? 1;
  const donusumGerekli = egim !== 0 || olcekX !== 1 || olcekY !== 1 || alfa !== 1;

  ctx.imageSmoothingEnabled = false;
  if (!donusumGerekli) {
    if (secenekler.tersCevir) {
      ctx.save();
      ctx.translate(dikdortgen.drawX + dikdortgen.drawW, dikdortgen.drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(kaynak, sx, sy, sw, sh, 0, 0, dikdortgen.drawW, dikdortgen.drawH);
      ctx.restore();
    } else {
      ctx.drawImage(
        kaynak,
        sx,
        sy,
        sw,
        sh,
        dikdortgen.drawX,
        dikdortgen.drawY,
        dikdortgen.drawW,
        dikdortgen.drawH
      );
    }
    return true;
  }

  const pivotX = Math.round(secenekler.merkezEkranX + (secenekler.ekstraOfsetX ?? 0));
  const pivotY = Math.round(secenekler.zeminEkranY + (secenekler.ekstraOfsetY ?? 0));
  const localX = -kare.merkezX * olcek;
  const localY = -(kare.yukseklik - kare.altBosluk) * olcek;

  ctx.save();
  if (alfa !== 1) {
    ctx.globalAlpha = alfa;
  }
  ctx.translate(pivotX, pivotY);
  if (egim !== 0) {
    ctx.rotate(egim);
  }
  ctx.scale((secenekler.tersCevir ? -1 : 1) * olcekX, olcekY);
  ctx.drawImage(kaynak, sx, sy, sw, sh, localX, localY, dikdortgen.drawW, dikdortgen.drawH);
  ctx.restore();

  return true;
}
