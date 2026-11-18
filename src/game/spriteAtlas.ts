/**
 * ============================================================================
 * HARİCİ PIXEL ART SPRİTE ATLAS & ÇİZİM ALTYAPISI
 * PNG sprite karelerini önbelleğe alır, tam sayı piksel ölçeğiyle (sıfır mixel)
 * zemin çizgisine hizalayarak çizer ve beyaz darbe flaşı maskesi üretir.
 * ============================================================================
 */

export type KarakterSpriteId = 'kerem';

export type SpriteAksiyonId =
  | 'idle'
  | 'walk'
  | 'punch'
  | 'kick'
  | 'block'
  | 'dodge'
  | 'hit'
  | 'ko';

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
}

export type KarakterSpriteHaritasi = Partial<Record<SpriteAksiyonId, HariciSpriteKaresi[]>>;

const KEREM_EAST_IDLE_0: HariciSpriteKaresi = {
  id: 'kerem_east_idle_0',
  yol: '/assets/sprites/kerem/east/idle_0.png',
  genislik: 48,
  yukseklik: 48,
  icerikYuksekligi: 44,
  altBosluk: 2,
  merkezX: 24,
};

const KEREM_EAST_IDLE_1: HariciSpriteKaresi = {
  id: 'kerem_east_idle_1',
  yol: '/assets/sprites/kerem/east/idle_1.png',
  genislik: 48,
  yukseklik: 48,
  icerikYuksekligi: 44,
  altBosluk: 2,
  merkezX: 24,
};

/**
 * Karakter ID -> Aksiyon -> Kare dizisi.
 * Henüz üretilmemiş aksiyonlar burada tanımlanmaz; çağıran taraf eski piksel
 * ızgarasına otomatik yedekleme (fallback) yapar.
 */
export const KARAKTER_SPRITE_ATLASI: Record<string, KarakterSpriteHaritasi> = {
  kerem: {
    idle: [KEREM_EAST_IDLE_0, KEREM_EAST_IDLE_1],
    hit: [KEREM_EAST_IDLE_0],
  },
};

export function hariciSpriteKaresiAl(
  karakterId: string,
  aksiyon: SpriteAksiyonId,
  kareIndex = 0
): HariciSpriteKaresi | null {
  const karakterHaritasi = KARAKTER_SPRITE_ATLASI[karakterId];
  if (!karakterHaritasi) return null;
  const kareler = karakterHaritasi[aksiyon];
  if (!kareler || kareler.length === 0) return null;
  const guvenliIndex = ((kareIndex % kareler.length) + kareler.length) % kareler.length;
  return kareler[guvenliIndex] ?? null;
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
}: SpriteCizimKonumGirdisi): SpriteCizimDikdortgeni {
  const olcek = Math.max(1, Math.round(ekranOlcegi));
  const drawW = kare.genislik * olcek;
  const drawH = kare.yukseklik * olcek;
  const etkinMerkezX = tersCevir ? kare.genislik - kare.merkezX : kare.merkezX;

  const drawX = Math.round(merkezEkranX + ekstraOfsetX - etkinMerkezX * olcek);
  const drawY = Math.round(zeminEkranY - (kare.yukseklik - kare.altBosluk) * olcek);

  const shadowW = Math.max(12, Math.round(18 * olcek));
  const shadowH = Math.max(3, Math.round(olcek * 1.1));
  const shadowX = Math.round(merkezEkranX + ekstraOfsetX - shadowW / 2);
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
const FLAS_MASKESI_ONBELLEGI = new Map<string, HTMLCanvasElement>();
const YUKLENEN_YOL_DINLEYICILERI = new Set<() => void>();
let onYuklemeBaslatildi = false;

export function spriteAtlasOnYukle(onYuklendi?: () => void): void {
  if (onYuklendi) {
    YUKLENEN_YOL_DINLEYICILERI.add(onYuklendi);
  }
  if (typeof Image === 'undefined') return;

  for (const karakterHaritasi of Object.values(KARAKTER_SPRITE_ATLASI)) {
    for (const kareler of Object.values(karakterHaritasi)) {
      if (!kareler) continue;
      for (const kare of kareler) {
        if (GORSEL_ONBELLEGI.has(kare.yol)) continue;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          for (const dinleyici of YUKLENEN_YOL_DINLEYICILERI) {
            dinleyici();
          }
        };
        img.onerror = () => {
          // Yükleme hatasında sistem eski piksel ızgarasına sessizce düşer
        };
        img.src = kare.yol;
        GORSEL_ONBELLEGI.set(kare.yol, img);
      }
    }
  }
  onYuklemeBaslatildi = true;
}

export function spriteAtlasDinleyicisiniKaldir(onYuklendi: () => void): void {
  YUKLENEN_YOL_DINLEYICILERI.delete(onYuklendi);
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
  const mevcut = FLAS_MASKESI_ONBELLEGI.get(kare.yol);
  if (mevcut) return mevcut;

  const tuval = document.createElement('canvas');
  tuval.width = kare.genislik;
  tuval.height = kare.yukseklik;
  const tCtx = tuval.getContext('2d');
  if (!tCtx) return null;

  tCtx.imageSmoothingEnabled = false;
  tCtx.drawImage(img, 0, 0, kare.genislik, kare.yukseklik);

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

  FLAS_MASKESI_ONBELLEGI.set(kare.yol, tuval);
  return tuval;
}

export interface HariciSpriteCizimSecenekleri {
  merkezEkranX: number;
  zeminEkranY: number;
  ekranOlcegi: number;
  tersCevir?: boolean;
  ekstraOfsetX?: number;
  beyazFlas?: boolean;
  golgeCiz?: boolean;
  golgeAlfa?: number;
}

/**
 * Hazır PNG kareyi keskin piksel ölçeğiyle çizer. Görsel henüz yüklenmediyse
 * false döner ve çağıran taraf legacy sprite'a düşebilir.
 */
export function hariciSpriteCiz(
  ctx: CanvasRenderingContext2D,
  kare: HariciSpriteKaresi,
  secenekler: HariciSpriteCizimSecenekleri
): boolean {
  const img = hariciSpriteHazirMi(kare);
  if (!img) return false;

  const dikdortgen = spriteCizimDikdortgeniHesapla({
    merkezEkranX: secenekler.merkezEkranX,
    zeminEkranY: secenekler.zeminEkranY,
    kare,
    ekranOlcegi: secenekler.ekranOlcegi,
    tersCevir: secenekler.tersCevir,
    ekstraOfsetX: secenekler.ekstraOfsetX,
  });

  if (secenekler.golgeCiz !== false) {
    const alfa = secenekler.golgeAlfa ?? 0.54;
    ctx.fillStyle = `rgba(0, 0, 0, ${alfa})`;
    ctx.fillRect(dikdortgen.shadowX, dikdortgen.shadowY, dikdortgen.shadowW, dikdortgen.shadowH);
  }

  const kaynak: CanvasImageSource =
    secenekler.beyazFlas ? (beyazFlasMaskesiAl(kare, img) ?? img) : img;

  ctx.imageSmoothingEnabled = false;
  if (secenekler.tersCevir) {
    ctx.save();
    ctx.translate(dikdortgen.drawX + dikdortgen.drawW, dikdortgen.drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(kaynak, 0, 0, dikdortgen.drawW, dikdortgen.drawH);
    ctx.restore();
  } else {
    ctx.drawImage(kaynak, dikdortgen.drawX, dikdortgen.drawY, dikdortgen.drawW, dikdortgen.drawH);
  }

  return true;
}
