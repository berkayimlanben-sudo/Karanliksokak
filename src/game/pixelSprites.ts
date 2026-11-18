/**
 * ============================================================================
 * PIXEL ART SPRITE HARİTALARI VE ÇİZİM MOTORU
 * Dış görsel dosyası olmadan tüm karakter kareleri ve mekan eşyaları
 * karakter ızgaraları olarak tanımlanır ve keskin piksellerle çizilir.
 * ============================================================================
 */

import { KarakterGorunumu } from './theme';

export type PikselPaleti = Record<string, string>;

export interface PikselSprite {
  genislik: number;
  yukseklik: number;
  satirlar: string[];
}

const PALET_ONBELLEGI = new WeakMap<KarakterGorunumu, PikselPaleti>();

/**
 * Kerem için dinamik görünüm paleti üretir (aynı görünüm nesnesi için memoize).
 */
export function keremPaletiOlustur(g: KarakterGorunumu): PikselPaleti {
  const kayitli = PALET_ONBELLEGI.get(g);
  if (kayitli) return kayitli;

  const palet: PikselPaleti = {
    '.': '',
    k: g.konturRengi,
    t: g.tenRengi,
    g: g.golgeTenRengi,
    s: g.sacRengi,
    c: g.ustKiyafetRengi,
    d: g.ustKiyafetGolge,
    p: g.altKiyafetRengi,
    b: g.bandajRengi,
    a: '#0A0D14', // Ayakkabı
    r: '#D63838', // Kırmızı bileklik / şerit aksanı
  };
  PALET_ONBELLEGI.set(g, palet);
  return palet;
}

// ----------------------------------------------------------------------------
// Kerem (16x24 piksel) — Bekleme (2 kare), Yürüme (3 kare), Vuruş (3 kare)
// ----------------------------------------------------------------------------
export const KEREM_IDLE_0: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....kstttggk....',
    '....kstttttk....',
    '.....kttttk.....',
    '....kkcccckk....',
    '...kddcccccck...',
    '..kddcccccbbrk..',
    '..kddccccbbbkk..',
    '..kddcccdcckk...',
    '...kdcccccck....',
    '....kcccccbbk...',
    '....kdddddbbk...',
    '....kppppppk....',
    '....kppkkppk....',
    '...kppk..kppk...',
    '...kppk..kppk...',
    '..kppk....kppk..',
    '..kppk....kppk..',
    '..kaak....kaak..',
    '..kaaak...kaaak.',
    '..kkkkk...kkkkk.',
    '................',
  ],
};

export const KEREM_IDLE_1: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '................',
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....kstttggk....',
    '....kstttttk....',
    '.....kttttk.....',
    '....kkcccckk....',
    '...kddcccccck...',
    '..kddcccccbbrk..',
    '..kddccccbbbkk..',
    '..kddcccdccbbk..',
    '...kdccccccbbk..',
    '....kddddddk....',
    '....kppppppk....',
    '....kppkkppk....',
    '...kppk..kppk...',
    '...kppk..kppk...',
    '..kppk....kppk..',
    '..kppk....kppk..',
    '..kaak....kaak..',
    '..kaaak...kaaak.',
    '..kkkkk...kkkkk.',
    '................',
  ],
};

export const KEREM_WALK_0: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....kstttggk....',
    '....kstttttk....',
    '.....kttttk.....',
    '....kkcccckk....',
    '...kddcccccck...',
    '..kddcccdccbbk..',
    '..kddcccdccbbk..',
    '...kdcccccck....',
    '....kcccccck....',
    '....kdddddk.....',
    '....kppppppk....',
    '...kpppkpppk....',
    '..kppk..kpppk...',
    '.kppk....kppk...',
    '.kaak....kppk...',
    '.kaaak....kaak..',
    '.kkkkk....kaaaak',
    '..........kkkkkk',
    '................',
    '................',
    '................',
  ],
};

export const KEREM_WALK_1: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '................',
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....kstttggk....',
    '....kstttttk....',
    '.....kttttk.....',
    '....kkcccckk....',
    '...kddcccccck...',
    '...kddccccbbk...',
    '...kddccccbbk...',
    '....kcccccck....',
    '....kdddddk.....',
    '....kpppppk.....',
    '....kpppppk.....',
    '....kppkppk.....',
    '....kppkppk.....',
    '....kppkppk.....',
    '....kaakaak.....',
    '....kaaakaaak...',
    '....kkkkkkkkk...',
    '................',
    '................',
    '................',
  ],
};

export const KEREM_WALK_2: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....kstttggk....',
    '....kstttttk....',
    '.....kttttk.....',
    '....kkcccckk....',
    '...kddcccccck...',
    '..kbbddcccck....',
    '..kbbddcccck....',
    '...kcccccccbbk..',
    '....kccccccbbk..',
    '....kdddddk.....',
    '....kppppppk....',
    '....kpppkpppk...',
    '...kpppk..kppk..',
    '...kppk....kppk.',
    '...kppk....kaak.',
    '..kaak....kaaak.',
    '.kaaaak...kkkkk.',
    '.kkkkkk.........',
    '................',
    '................',
    '................',
  ],
};

// Vuruş / Gölge boksu 3 kare (18x24)
export const KEREM_PUNCH_0: PikselSprite = {
  genislik: 18,
  yukseklik: 24,
  satirlar: [
    '....kkkkkk........',
    '...kssssssk.......',
    '...kssssttk.......',
    '...kstttggk.......',
    '...kstttttk.......',
    '....kttttk........',
    '..kkcccccckk......',
    '.kddcccccccck.....',
    'kbbddccccccbbk....',
    'kbbddccccccbbk....',
    '.kddcccccccck.....',
    '..kdccccccck......',
    '...kddddddk.......',
    '...kppppppk.......',
    '..kppk..kppk......',
    '.kppk....kppk.....',
    '.kppk....kppk.....',
    'kppk......kppk....',
    'kaak......kaak....',
    'kaaak.....kaaak...',
    'kkkkk.....kkkkk...',
    '..................',
    '..................',
    '..................',
  ],
};

export const KEREM_PUNCH_1: PikselSprite = {
  genislik: 18,
  yukseklik: 24,
  satirlar: [
    '......kkkkkk......',
    '.....kssssssk.....',
    '.....kssssttk.....',
    '.....kstttggk.....',
    '.....kstttttk.....',
    '......kttttk......',
    '....kkcccccckk....',
    '...kddcccccccckkkk',
    '..kddccccccccrbbbk',
    '..kddccbbcccrbbbbk',
    '...kdccbbcccccccck',
    '....kcccccckkkkkkk',
    '....kddddddk......',
    '....kppppppk......',
    '...kppk..kpppk....',
    '..kppk....kppk....',
    '..kppk.....kppk...',
    '.kppk......kppk...',
    '.kaak.......kaak..',
    '.kaaak......kaaak.',
    '.kkkkk......kkkkk.',
    '..................',
    '..................',
    '..................',
  ],
};

export const KEREM_PUNCH_2: PikselSprite = {
  genislik: 18,
  yukseklik: 24,
  satirlar: [
    '......kkkkkk......',
    '.....kssssssk.....',
    '.....kssssttk.....',
    '.....kstttggk.....',
    '.....kstttttk.....',
    '......kttttk......',
    '....kkcccckk......',
    '...kddcccccckkkk..',
    '..kddccbbcccrbbbk.',
    '..kddccbbcccrbbbk.',
    '...kdccccccckkkk..',
    '....kddddddk......',
    '....kppppppk......',
    '....kppkkppk......',
    '...kppk..kppk.....',
    '..kppk....kppk....',
    '..kppk....kppk....',
    '..kaak....kaak....',
    '..kaaak...kaaak...',
    '..kkkkk...kkkkk...',
    '..................',
    '..................',
    '..................',
    '..................',
  ],
};

// ----------------------------------------------------------------------------
// Aile Üyeleri (Anne Emine ve Kız Kardeş Elif) + Salon Antrenörü
// ----------------------------------------------------------------------------
export const AILE_PALETI: PikselPaleti = {
  '.': '',
  k: '#06080E',
  t: '#CFA084',
  g: '#9B6E56',
  e: '#5A4A48', // Emine koyu kırçıllı saç
  y: '#4A5568', // Emine koyu gri hırka
  z: '#2D3748', // Emine koyu etek/şalvar
  h: '#8A3B3B', // Bordo şal aksanı
  l: '#2A1D1B', // Elif koyu saç
  m: '#385C7D', // Elif okul kazağı (koyu mavi)
  n: '#233A52', // Elif kazak gölge
  f: '#1C2233', // Elif pantolon
  w: '#D8D3CA', // Defter / bez
  a: '#10131C',
};

export const EMINE_IDLE_0: PikselSprite = {
  genislik: 14,
  yukseklik: 22,
  satirlar: [
    '....kkkkkk....',
    '...keeeeeek...',
    '...kttttttk...',
    '...kttggttk...',
    '....kttttk....',
    '...kkhhhhkk...',
    '..kyyhhhhyyk..',
    '.kyyyhhhhyyyk.',
    '.kyyyyyyyyyyk.',
    '.kytyyyyyytyk.',
    '..ktyyyyyytk..',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzkkzzk...',
    '...kzzkkzzk...',
    '...kaakkaak...',
    '...kkkkkkkk...',
    '..............',
    '..............',
  ],
};

export const EMINE_IDLE_1: PikselSprite = {
  genislik: 14,
  yukseklik: 22,
  satirlar: [
    '..............',
    '....kkkkkk....',
    '...keeeeeek...',
    '...kttttttk...',
    '...kttggttk...',
    '....kttttk....',
    '...kkhhhhkk...',
    '..kyyhhhhyyk..',
    '.kyyyhhhhyyyk.',
    '.kyyywwwwyyyk.',
    '.kytywwwwtyyk.',
    '..kzzzzzzzzk..',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzzzzzk...',
    '...kzzkkzzk...',
    '...kzzkkzzk...',
    '...kaakkaak...',
    '...kkkkkkkk...',
    '..............',
    '..............',
  ],
};

export const ELIF_IDLE_0: PikselSprite = {
  genislik: 12,
  yukseklik: 18,
  satirlar: [
    '...kkkkkk...',
    '..kllllllk..',
    '..klttttl...',
    '..klttgglk..',
    '...kttttk...',
    '..kkmmmmkk..',
    '.kmmmnnmmmk.',
    '.kmtmnnmmtk.',
    '.kmmmnnmmmk.',
    '..kffffffk..',
    '..kffkkffk..',
    '..kffkkffk..',
    '..kffkkffk..',
    '..kaakkaak..',
    '..kkkkkkkk..',
    '............',
    '............',
    '............',
  ],
};

export const ELIF_IDLE_1: PikselSprite = {
  genislik: 12,
  yukseklik: 18,
  satirlar: [
    '............',
    '...kkkkkk...',
    '..kllllllk..',
    '..klttttl...',
    '..klttgglk..',
    '...kttttk...',
    '..kkmmmmkk..',
    '.kmmmnnmmmk.',
    '.kmmwwwwmmk.',
    '..kffffffk..',
    '..kffkkffk..',
    '..kffkkffk..',
    '..kffkkffk..',
    '..kaakkaak..',
    '..kkkkkkkk..',
    '............',
    '............',
    '............',
  ],
};

// ----------------------------------------------------------------------------
// Mekan ve Ev Eşyası Pixel Sprite'ları
// ----------------------------------------------------------------------------
export const ESYA_PALETI: PikselPaleti = {
  '.': '',
  k: '#06080E',
  w: '#5A3B28', // Ahşap
  v: '#3B2518', // Koyu ahşap
  m: '#49546B', // Metal / çelik
  n: '#273042', // Koyu metal
  b: '#C9CDD6', // Beyaz-gri buzdolabı / yastık
  s: '#8A94A6', // Buzdolabı gölge
  r: '#A63434', // Kırmızı battaniye / kum torbası
  q: '#702020', // Koyu kırmızı gölge
  o: '#D99B38', // Sıcak ısıtıcı / ampul parıltısı
  y: '#2F3647', // Koyu yatak örtüsü
};

export const BUZDOLABI_SPRITE: PikselSprite = {
  genislik: 14,
  yukseklik: 24,
  satirlar: [
    '.kkkkkkkkkkkk.',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbkbbbbbbbbsk',
    'kbbkbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kssssssssssssk',
    'kkkkkkkkkkkkkk',
    'kbbbbbbbbbbbsk',
    'kbbkbbbbbbbbsk',
    'kbbkbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kbbbbbbbbbbbsk',
    'kssssssssssssk',
    'kssssssssssssk',
    '.kkkkkkkkkkkk.',
    '.kk........kk.',
    '..............',
  ],
};

export const YATAK_SPRITE: PikselSprite = {
  genislik: 24,
  yukseklik: 12,
  satirlar: [
    'kkkk....................',
    'kwwk....................',
    'kwwkbbbbk...............',
    'kwwkbbbbkrrrrrrrrrrrrrkk',
    'kwwkyyyyyrrrrrrrrrrrrrqk',
    'kwwkrrrrrrrrrrrrrrrrrrqk',
    'kwwwwwwwwwwwwwwwwwwwwwwk',
    'kvvvvvvvvvvvvvvvvvvvvvvk',
    'kwwk................kwwk',
    'kvvk................kvvk',
    'kkkk................kkkk',
    '........................',
  ],
};

export const ISITICI_SPRITE: PikselSprite = {
  genislik: 10,
  yukseklik: 12,
  satirlar: [
    '.kkkkkkkk.',
    'kmmmmmmmmk',
    'kmkkkkkkmk',
    'kmkoooookk',
    'kmkmmmmkmk',
    'kmkoooookk',
    'kmkkkkkkmk',
    'knnnnnnnnk',
    'knnnnnnnnk',
    '.kk....kk.',
    '..........',
    '..........',
  ],
};

export const KUM_TORBASI_SPRITE: PikselSprite = {
  genislik: 10,
  yukseklik: 24,
  satirlar: [
    '....kk....',
    '....mm....',
    '....mm....',
    '...kmmk...',
    '..krrrrk..',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.kmmmmmmk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.krrrrqqk.',
    '.kqqqqqqk.',
    '..kkkkkk..',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
};

export const AGIRLIK_SETI_SPRITE: PikselSprite = {
  genislik: 16,
  yukseklik: 10,
  satirlar: [
    '................',
    '.kk..........kk.',
    'kmmk........kmmk',
    'kmmkkkkkkkkkkmmk',
    'knnkmmmmmmmmknnk',
    'knnk........knnk',
    '.kk..........kk.',
    '..mmmmmmmmmmmm..',
    '.knnnnnnnnnnnnk.',
    '.kkkkkkkkkkkkkk.',
  ],
};

// ----------------------------------------------------------------------------
// Dövüş Pozları (Tekme, Blok, Kaçınma, Darbe Aldı, Nakavt)
// ----------------------------------------------------------------------------
export const KEREM_KICK_0: PikselSprite = {
  genislik: 18,
  yukseklik: 24,
  satirlar: [
    '.....kkkkkk.......',
    '....kssssssk......',
    '....kssssttk......',
    '....kstttggk......',
    '....kstttttk......',
    '.....kttttk.......',
    '...kkcccccckk.....',
    '..kddcccccbbrk....',
    '.kddcccccrbbbk....',
    '..kdcccccccck.....',
    '...kddddddddk.....',
    '....kppppppk......',
    '....kppkkppk......',
    '...kppk..kppk.....',
    '...kppk...kppkkkk.',
    '..kppk.....kppaaak',
    '..kppk......kkkkkk',
    '..kaak............',
    '..kaaak...........',
    '..kkkkk...........',
    '..................',
    '..................',
    '..................',
    '..................',
  ],
};

export const KEREM_KICK_1: PikselSprite = {
  genislik: 18,
  yukseklik: 24,
  satirlar: [
    '....kkkkkk........',
    '...kssssssk.......',
    '...kssssttk.......',
    '...kstttggk.......',
    '...kstttttk.......',
    '....kttttk........',
    '..kkcccccckk......',
    '.kddcccccbbrk.....',
    '.kddccccbbbbk.....',
    '..kdcccccccck.....',
    '...kddddddddk.....',
    '....kppppppkkkk...',
    '....kppkkppppppkkk',
    '...kppk..kkkkkaaak',
    '...kppk......kkkkk',
    '..kppk............',
    '..kppk............',
    '..kaak............',
    '..kaaak...........',
    '..kkkkk...........',
    '..................',
    '..................',
    '..................',
    '..................',
  ],
};

export const KEREM_BLOCK: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '................',
    '.....kkkkkk.....',
    '....kssssssk....',
    '....kssssttk....',
    '....ksttrbbk....',
    '....ksttrbbbk...',
    '....kkccrbbbk...',
    '...kddccbbcck...',
    '...kddccbbcck...',
    '...kddcccccck...',
    '....kddddddk....',
    '....kppppppk....',
    '....kppkkppk....',
    '...kppk..kppk...',
    '...kppk..kppk...',
    '..kppk....kppk..',
    '..kppk....kppk..',
    '..kaak....kaak..',
    '..kaaak...kaaak.',
    '..kkkkk...kkkkk.',
    '................',
    '................',
    '................',
    '................',
  ],
};

export const KEREM_DODGE: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '................',
    '................',
    '................',
    '...kkkkkk.......',
    '..kssssssk......',
    '..kssssttk......',
    '..kstttggk......',
    '..kstttttk......',
    '...kttttk.......',
    '..kkcccckk......',
    '.kddcccccbbk....',
    '.kddcccccbbk....',
    '..kdddddddk.....',
    '..kpppppppk.....',
    '..kppkkpppk.....',
    '.kppk...kppk....',
    '.kppk....kppk...',
    '.kaak....kaak...',
    '.kaaak...kaaak..',
    '.kkkkk...kkkkk..',
    '................',
    '................',
    '................',
    '................',
  ],
};

export const KEREM_HIT: PikselSprite = {
  genislik: 16,
  yukseklik: 24,
  satirlar: [
    '...kkkkkk.......',
    '..kssssssk......',
    '..kssssttk......',
    '..kstttggk......',
    '..kstttttk......',
    '...kttttk.......',
    '...kkcccckk.....',
    '..kddcccccck....',
    '.kbbddcccccck...',
    '..kddccccbbk....',
    '...kcccccck.....',
    '....kddddddk....',
    '....kppppppk....',
    '...kppk.kppk....',
    '..kppk...kppk...',
    '..kppk...kppk...',
    '.kaak.....kaak..',
    '.kaaak....kaaak.',
    '.kkkkk....kkkkk.',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

export const KEREM_KO: PikselSprite = {
  genislik: 24,
  yukseklik: 12,
  satirlar: [
    '........................',
    '........................',
    '........................',
    '........................',
    '..kkkkk.................',
    '.kssssssk...............',
    '.ksttttttkkkcccccckk....',
    '.ktttttttkccccccccppkkk.',
    '..kkkkkkkddccccccpppppak',
    '........kkkkkkkkkkkkkkak',
    '..................kkkkkk',
    '........................',
  ],
};

const SPRITE_KIMLIK = new WeakMap<PikselSprite, number>();
const PALET_KIMLIK = new WeakMap<PikselPaleti, number>();
const OFFSCREEN_SPRITE_ONBELLEGI = new Map<string, HTMLCanvasElement>();
const MAKS_SPRITE_ONBELLEK = 160;
let sonrakiKimlik = 1;

function nesneKimligiAl<T extends object>(harita: WeakMap<T, number>, nesne: T): number {
  let kimlik = harita.get(nesne);
  if (kimlik === undefined) {
    kimlik = sonrakiKimlik;
    sonrakiKimlik += 1;
    harita.set(nesne, kimlik);
  }
  return kimlik;
}

function dogalSpriteTuvaliAl(
  sprite: PikselSprite,
  palet: PikselPaleti,
  beyazFlas: boolean
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const sId = nesneKimligiAl(SPRITE_KIMLIK, sprite);
  const pId = nesneKimligiAl(PALET_KIMLIK, palet);
  const anahtar = `${sId}|${pId}|${beyazFlas ? 1 : 0}`;

  const mevcut = OFFSCREEN_SPRITE_ONBELLEGI.get(anahtar);
  if (mevcut) return mevcut;

  const tuval = document.createElement('canvas');
  tuval.width = sprite.genislik;
  tuval.height = sprite.yukseklik;
  const tCtx = tuval.getContext('2d');
  if (!tCtx) return null;

  for (let y = 0; y < sprite.satirlar.length; y += 1) {
    const satir = sprite.satirlar[y];
    for (let x = 0; x < satir.length; x += 1) {
      const kod = satir[x];
      const renk = palet[kod];
      if (!renk) continue;
      tCtx.fillStyle = beyazFlas && kod !== 'k' ? '#EAECEF' : renk;
      tCtx.fillRect(x, y, 1, 1);
    }
  }

  if (OFFSCREEN_SPRITE_ONBELLEGI.size >= MAKS_SPRITE_ONBELLEK) {
    const ilkAnahtar = OFFSCREEN_SPRITE_ONBELLEGI.keys().next().value;
    if (ilkAnahtar !== undefined) {
      OFFSCREEN_SPRITE_ONBELLEGI.delete(ilkAnahtar);
    }
  }
  OFFSCREEN_SPRITE_ONBELLEGI.set(anahtar, tuval);
  return tuval;
}

/**
 * Verilen pixel haritasını tam sayı piksel ölçeğiyle keskin biçimde çizer.
 */
export function pikselSpriteCiz(
  ctx: CanvasRenderingContext2D,
  sprite: PikselSprite,
  palet: PikselPaleti,
  solX: number,
  altY: number,
  olcek: number,
  tersCevir = false,
  beyazFlas = false
): void {
  const px = Math.max(1, Math.round(olcek));
  const baslangicX = Math.round(solX);
  const baslangicY = Math.round(altY - sprite.yukseklik * px);

  const onbellekTuval = dogalSpriteTuvaliAl(sprite, palet, beyazFlas);
  if (onbellekTuval) {
    const hedefW = sprite.genislik * px;
    const hedefH = sprite.yukseklik * px;
    ctx.imageSmoothingEnabled = false;
    if (tersCevir) {
      ctx.save();
      ctx.translate(baslangicX + hedefW, baslangicY);
      ctx.scale(-1, 1);
      ctx.drawImage(onbellekTuval, 0, 0, hedefW, hedefH);
      ctx.restore();
    } else {
      ctx.drawImage(onbellekTuval, baslangicX, baslangicY, hedefW, hedefH);
    }
    return;
  }

  // Node / SSR ortamı için piksel döngüsü yedeği
  for (let y = 0; y < sprite.satirlar.length; y += 1) {
    const satir = sprite.satirlar[y];
    for (let x = 0; x < satir.length; x += 1) {
      const kod = satir[x];
      const renk = palet[kod];
      if (!renk) continue;
      const cizimX = tersCevir
        ? baslangicX + (sprite.genislik - 1 - x) * px
        : baslangicX + x * px;
      ctx.fillStyle = beyazFlas && kod !== 'k' ? '#EAECEF' : renk;
      ctx.fillRect(cizimX, baslangicY + y * px, px, px);
    }
  }
}
