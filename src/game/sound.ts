/**
 * ============================================================================
 * DIŞ DOSYASIZ WEB AUDIO RETRO SES SENTEZLEYİCİ, MÜZİK MOTORU VE TİTREŞİM
 * Veri odaklı SFX_LISTESI, master DynamicsCompressorNode limiter (-3 dB, 20:1),
 * max 4 SFX polifonisi, 30ms debounce ve OfflineAudioContext tabanlı
 * 12 sn click-free loop müzik + 1.5 sn crossfade içerir.
 * ============================================================================
 */

export type SesTuru =
  | 'gong'
  | 'yumruk'
  | 'tekme'
  | 'sert_vurus'
  | 'blok'
  | 'kacinma'
  | 'mukemmel'
  | 'kombo'
  | 'nakavt'
  | 'mac_kazanma'
  | 'mac_kaybetme'
  | 'para_kazanma'
  | 'kira_uyarisi'
  | 'gun_sonu'
  | 'yetenek_ac'
  | 'mekan_gecis'
  | 'menu_tik';

export type SesKategorisi = 'master' | 'sfx' | 'muzik';
export type MuzikRuhHali = 'sakin' | 'enerjik' | 'gergin';
export type SfxOsilatorTuru = OscillatorType | 'noise';

export interface SfxZarf {
  attack: number;
  decay: number;
}

export interface SfxFiltre {
  tur: BiquadFilterType;
  frekans: number;
}

export interface SfxKatman {
  tur: SfxOsilatorTuru;
  frekans: number;
  bitisFrekans?: number;
  sure: number;
  gecikme?: number;
  zarf: SfxZarf;
  filtre: SfxFiltre | null;
  volume: number;
}

export interface SfxTanimi extends SfxKatman {
  id: SesTuru;
  katmanlar?: SfxKatman[];
}

export interface PlaySfxOpts {
  volume?: number;
  pitchCarpani?: number;
}

export interface SesAyarlari {
  master: number;
  sfx: number;
  muzik: number;
  masterMute: boolean;
  sfxMute: boolean;
  muzikMute: boolean;
}

export const SES_TERCIH_ANAHTARI = 'karanlik_sokak_ses_acik';
export const SES_AYARLARI_ANAHTARI = 'karanlik_sokak_ses_ayarlari_v1';

const MAKS_ESZAMANLI_SFX = 4;
const AYNI_ID_DEBOUNCE_MS = 30;
// SFX katman toplamları max ~0.47; 0.85 çarpanı ile peak <= 0.40 (< -6 dBFS ≈ 0.501)
const SFX_BUS_TAVAN = 0.85;
// Müzik ortalama düzeyi <= -18 dBFS (≈ 0.125)
const MUZIK_BUS_TAVAN = 0.125;
const MUZIK_CROSSFADE_SN = 1.5;
const MUZIK_LOOP_SURE_SN = 12.0;
const VISIBILITY_FADE_OUT_SN = 0.12;
const VISIBILITY_FADE_IN_SN = 0.35;

/**
 * Veri odaklı ses efekti tanımları (17 SFX).
 * Yeni bir SFX eklemek için yalnızca bu listeye kayıt eklenir.
 */
export const SFX_LISTESI: readonly SfxTanimi[] = [
  {
    id: 'gong',
    tur: 'triangle',
    frekans: 242,
    bitisFrekans: 234,
    sure: 0.68,
    zarf: { attack: 0.001, decay: 0.68 },
    filtre: null,
    volume: 0.18,
    katmanlar: [
      {
        tur: 'square',
        frekans: 378,
        bitisFrekans: 372,
        sure: 0.36,
        zarf: { attack: 0.001, decay: 0.36 },
        filtre: { tur: 'bandpass', frekans: 960 },
        volume: 0.11,
      },
      {
        tur: 'sawtooth',
        frekans: 576,
        bitisFrekans: 568,
        sure: 0.44,
        zarf: { attack: 0.001, decay: 0.44 },
        filtre: { tur: 'highpass', frekans: 440 },
        volume: 0.09,
      },
      {
        tur: 'sine',
        frekans: 764,
        bitisFrekans: 756,
        sure: 0.34,
        zarf: { attack: 0.001, decay: 0.34 },
        filtre: null,
        volume: 0.08,
      },
      {
        tur: 'noise',
        frekans: 1900,
        sure: 0.038,
        zarf: { attack: 0, decay: 0.038 },
        filtre: { tur: 'bandpass', frekans: 1900 },
        volume: 0.14,
      },
    ],
  },
  {
    id: 'yumruk',
    tur: 'sine',
    frekans: 190,
    bitisFrekans: 62,
    sure: 0.095,
    zarf: { attack: 0.008, decay: 0.095 },
    filtre: null,
    volume: 0.16,
    katmanlar: [
      {
        tur: 'noise',
        frekans: 720,
        sure: 0.06,
        zarf: { attack: 0, decay: 0.06 },
        filtre: { tur: 'bandpass', frekans: 720 },
        volume: 0.1,
      },
    ],
  },
  {
    id: 'tekme',
    tur: 'triangle',
    frekans: 128,
    bitisFrekans: 38,
    sure: 0.135,
    zarf: { attack: 0.004, decay: 0.135 },
    filtre: null,
    volume: 0.19,
    katmanlar: [
      {
        tur: 'noise',
        frekans: 1120,
        sure: 0.085,
        zarf: { attack: 0, decay: 0.085 },
        filtre: { tur: 'bandpass', frekans: 1120 },
        volume: 0.12,
      },
    ],
  },
  {
    id: 'sert_vurus',
    tur: 'triangle',
    frekans: 150,
    bitisFrekans: 40,
    sure: 0.165,
    zarf: { attack: 0.003, decay: 0.165 },
    filtre: null,
    volume: 0.22,
    katmanlar: [
      {
        tur: 'sawtooth',
        frekans: 96,
        bitisFrekans: 34,
        sure: 0.13,
        zarf: { attack: 0.003, decay: 0.13 },
        filtre: null,
        volume: 0.09,
      },
      {
        tur: 'noise',
        frekans: 620,
        sure: 0.115,
        zarf: { attack: 0, decay: 0.115 },
        filtre: { tur: 'lowpass', frekans: 620 },
        volume: 0.16,
      },
    ],
  },
  {
    id: 'blok',
    tur: 'triangle',
    frekans: 110,
    bitisFrekans: 58,
    sure: 0.09,
    zarf: { attack: 0.008, decay: 0.09 },
    filtre: null,
    volume: 0.14,
    katmanlar: [
      {
        tur: 'noise',
        frekans: 290,
        sure: 0.055,
        zarf: { attack: 0, decay: 0.055 },
        filtre: { tur: 'lowpass', frekans: 290 },
        volume: 0.09,
      },
    ],
  },
  {
    id: 'kacinma',
    tur: 'sine',
    frekans: 280,
    bitisFrekans: 620,
    sure: 0.08,
    zarf: { attack: 0.008, decay: 0.08 },
    filtre: null,
    volume: 0.07,
    katmanlar: [
      {
        tur: 'noise',
        frekans: 1400,
        sure: 0.075,
        zarf: { attack: 0, decay: 0.075 },
        filtre: { tur: 'highpass', frekans: 1400 },
        volume: 0.06,
      },
    ],
  },
  {
    id: 'mukemmel',
    tur: 'triangle',
    frekans: 587,
    bitisFrekans: 592,
    sure: 0.09,
    zarf: { attack: 0.008, decay: 0.09 },
    filtre: null,
    volume: 0.12,
    katmanlar: [
      {
        tur: 'sine',
        frekans: 880,
        bitisFrekans: 900,
        sure: 0.15,
        gecikme: 0.065,
        zarf: { attack: 0.008, decay: 0.15 },
        filtre: null,
        volume: 0.14,
      },
    ],
  },
  {
    id: 'kombo',
    tur: 'triangle',
    frekans: 440,
    bitisFrekans: 440,
    sure: 0.075,
    zarf: { attack: 0.008, decay: 0.075 },
    filtre: null,
    volume: 0.11,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 554,
        bitisFrekans: 554,
        sure: 0.075,
        gecikme: 0.055,
        zarf: { attack: 0.008, decay: 0.075 },
        filtre: null,
        volume: 0.12,
      },
      {
        tur: 'sine',
        frekans: 659,
        bitisFrekans: 680,
        sure: 0.15,
        gecikme: 0.11,
        zarf: { attack: 0.008, decay: 0.15 },
        filtre: null,
        volume: 0.14,
      },
    ],
  },
  {
    id: 'nakavt',
    tur: 'sawtooth',
    frekans: 120,
    bitisFrekans: 32,
    sure: 0.45,
    zarf: { attack: 0.008, decay: 0.45 },
    filtre: null,
    volume: 0.2,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 392,
        bitisFrekans: 196,
        sure: 0.52,
        zarf: { attack: 0.008, decay: 0.52 },
        filtre: null,
        volume: 0.14,
      },
      {
        tur: 'noise',
        frekans: 480,
        sure: 0.22,
        zarf: { attack: 0, decay: 0.22 },
        filtre: { tur: 'lowpass', frekans: 480 },
        volume: 0.18,
      },
    ],
  },
  {
    id: 'mac_kazanma',
    tur: 'triangle',
    frekans: 523.25,
    bitisFrekans: 523.25,
    sure: 0.11,
    zarf: { attack: 0.005, decay: 0.11 },
    filtre: null,
    volume: 0.14,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 659.25,
        bitisFrekans: 659.25,
        sure: 0.11,
        gecikme: 0.09,
        zarf: { attack: 0.005, decay: 0.11 },
        filtre: null,
        volume: 0.14,
      },
      {
        tur: 'triangle',
        frekans: 783.99,
        bitisFrekans: 783.99,
        sure: 0.12,
        gecikme: 0.18,
        zarf: { attack: 0.005, decay: 0.12 },
        filtre: null,
        volume: 0.15,
      },
      {
        tur: 'square',
        frekans: 1046.5,
        bitisFrekans: 1046.5,
        sure: 0.34,
        gecikme: 0.28,
        zarf: { attack: 0.005, decay: 0.34 },
        filtre: { tur: 'lowpass', frekans: 2200 },
        volume: 0.12,
      },
    ],
  },
  {
    id: 'mac_kaybetme',
    tur: 'sawtooth',
    frekans: 329.63,
    bitisFrekans: 311.13,
    sure: 0.16,
    zarf: { attack: 0.008, decay: 0.16 },
    filtre: { tur: 'lowpass', frekans: 1100 },
    volume: 0.13,
    katmanlar: [
      {
        tur: 'sawtooth',
        frekans: 293.66,
        bitisFrekans: 277.18,
        sure: 0.16,
        gecikme: 0.15,
        zarf: { attack: 0.008, decay: 0.16 },
        filtre: { tur: 'lowpass', frekans: 950 },
        volume: 0.13,
      },
      {
        tur: 'triangle',
        frekans: 220,
        bitisFrekans: 164.81,
        sure: 0.36,
        gecikme: 0.3,
        zarf: { attack: 0.01, decay: 0.36 },
        filtre: null,
        volume: 0.16,
      },
    ],
  },
  {
    id: 'para_kazanma',
    tur: 'sine',
    frekans: 987.77,
    bitisFrekans: 987.77,
    sure: 0.07,
    zarf: { attack: 0.003, decay: 0.07 },
    filtre: null,
    volume: 0.11,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 1318.51,
        bitisFrekans: 1330,
        sure: 0.14,
        gecikme: 0.065,
        zarf: { attack: 0.003, decay: 0.14 },
        filtre: null,
        volume: 0.12,
      },
    ],
  },
  {
    id: 'kira_uyarisi',
    tur: 'square',
    frekans: 349.23,
    bitisFrekans: 329.63,
    sure: 0.095,
    zarf: { attack: 0.004, decay: 0.095 },
    filtre: { tur: 'lowpass', frekans: 1400 },
    volume: 0.11,
    katmanlar: [
      {
        tur: 'square',
        frekans: 261.63,
        bitisFrekans: 233.08,
        sure: 0.14,
        gecikme: 0.115,
        zarf: { attack: 0.004, decay: 0.14 },
        filtre: { tur: 'lowpass', frekans: 1200 },
        volume: 0.12,
      },
    ],
  },
  {
    id: 'gun_sonu',
    tur: 'sine',
    frekans: 392,
    bitisFrekans: 392,
    sure: 0.1,
    zarf: { attack: 0.008, decay: 0.1 },
    filtre: null,
    volume: 0.11,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 293.66,
        bitisFrekans: 261.63,
        sure: 0.17,
        gecikme: 0.095,
        zarf: { attack: 0.01, decay: 0.17 },
        filtre: null,
        volume: 0.12,
      },
    ],
  },
  {
    id: 'yetenek_ac',
    tur: 'triangle',
    frekans: 523.25,
    bitisFrekans: 523.25,
    sure: 0.075,
    zarf: { attack: 0.004, decay: 0.075 },
    filtre: null,
    volume: 0.11,
    katmanlar: [
      {
        tur: 'triangle',
        frekans: 659.25,
        bitisFrekans: 659.25,
        sure: 0.075,
        gecikme: 0.06,
        zarf: { attack: 0.004, decay: 0.075 },
        filtre: null,
        volume: 0.12,
      },
      {
        tur: 'sine',
        frekans: 783.99,
        bitisFrekans: 792,
        sure: 0.14,
        gecikme: 0.12,
        zarf: { attack: 0.004, decay: 0.14 },
        filtre: null,
        volume: 0.13,
      },
    ],
  },
  {
    id: 'mekan_gecis',
    tur: 'sine',
    frekans: 210,
    bitisFrekans: 330,
    sure: 0.085,
    zarf: { attack: 0.006, decay: 0.085 },
    filtre: null,
    volume: 0.065,
    katmanlar: [
      {
        tur: 'noise',
        frekans: 900,
        sure: 0.08,
        zarf: { attack: 0, decay: 0.08 },
        filtre: { tur: 'bandpass', frekans: 900 },
        volume: 0.055,
      },
    ],
  },
  {
    id: 'menu_tik',
    tur: 'sine',
    frekans: 740,
    bitisFrekans: 520,
    sure: 0.032,
    zarf: { attack: 0.004, decay: 0.032 },
    filtre: null,
    volume: 0.055,
  },
];

const SFX_HARITASI = new Map<string, SfxTanimi>(
  SFX_LISTESI.map((tanim) => [tanim.id, tanim])
);

const VARSAYILAN_AYARLAR: SesAyarlari = {
  master: 1,
  sfx: 1,
  muzik: 1,
  masterMute: false,
  sfxMute: false,
  muzikMute: false,
};

let paylasilanCtx: AudioContext | null = null;
let limiterNode: DynamicsCompressorNode | null = null;
let masterGainNode: GainNode | null = null;
let sfxBusGainNode: GainNode | null = null;
let muzikBusGainNode: GainNode | null = null;
let gurultuTamponu: AudioBuffer | null = null;

let ayarlarYuklendi = false;
let guncelAyarlar: SesAyarlari = { ...VARSAYILAN_AYARLAR };
const ayarDinleyicileri = new Set<(ayar: SesAyarlari) => void>();

interface AktifSfxKaydi {
  id: string;
  bitisZaman: number;
  durdur: () => void;
}

interface AktifMuzikKaydi {
  ruhHali: MuzikRuhHali;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const sonTetiklemeMs = new Map<string, number>();
let aktifSfxler: AktifSfxKaydi[] = [];

const muzikBufferCache = new Map<MuzikRuhHali, AudioBuffer>();
let aktifMuzik: AktifMuzikKaydi | null = null;
let istenenRuhHali: MuzikRuhHali | null = null;
let muzikIstekSeq = 0;
let sekmeArkaPlanda = false;
let visibilityBaglandi = false;
let visibilityHandler: (() => void) | null = null;
let beforeUnloadBaglandi = false;
let ilkEtkilesimBaglandi = false;
let kullaniciEtkilesimiAlindi = false;
let gizlemeSuspendTimer: ReturnType<typeof setTimeout> | null = null;
let suspendBekleniyor = false;
let sonEskiMuzik: AudioBufferSourceNode | null = null;
const sesKilidiDinleyicileri = new Set<(bekliyor: boolean) => void>();

function clamp01(deger: number): number {
  if (!Number.isFinite(deger)) return 0;
  return Math.min(1, Math.max(0, deger));
}

function ayarlariKaydet(ayar: SesAyarlari): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SES_AYARLARI_ANAHTARI, JSON.stringify(ayar));
  } catch {
    // Depolama erişilemezse yoksay
  }
}

function ayarlariYukle(): SesAyarlari {
  if (ayarlarYuklendi) return guncelAyarlar;
  if (typeof window === 'undefined' || !window.localStorage) {
    return guncelAyarlar;
  }

  ayarlarYuklendi = true;
  try {
    const ham = window.localStorage.getItem(SES_AYARLARI_ANAHTARI);
    if (ham) {
      const parsed = JSON.parse(ham) as Partial<SesAyarlari>;
      guncelAyarlar = {
        master: typeof parsed.master === 'number' ? clamp01(parsed.master) : 1,
        sfx: typeof parsed.sfx === 'number' ? clamp01(parsed.sfx) : 1,
        muzik: typeof parsed.muzik === 'number' ? clamp01(parsed.muzik) : 1,
        masterMute: Boolean(parsed.masterMute),
        sfxMute: Boolean(parsed.sfxMute),
        muzikMute: Boolean(parsed.muzikMute),
      };
      return guncelAyarlar;
    }

    const eski = window.localStorage.getItem(SES_TERCIH_ANAHTARI);
    guncelAyarlar = {
      ...VARSAYILAN_AYARLAR,
      masterMute: eski === '0',
    };
    ayarlariKaydet(guncelAyarlar);
  } catch {
    guncelAyarlar = { ...VARSAYILAN_AYARLAR };
  }
  return guncelAyarlar;
}

function dinleyicileriBilgilendir(): void {
  const kopya = { ...guncelAyarlar };
  for (const cb of ayarDinleyicileri) {
    cb(kopya);
  }
}

function gainDegeriUygula(
  node: GainNode | null,
  ctx: AudioContext | null,
  hedef: number,
  tau = 0.015
): void {
  if (!node || !ctx) return;
  try {
    if (typeof node.gain.setTargetAtTime === 'function') {
      node.gain.setTargetAtTime(hedef, ctx.currentTime, tau);
    } else if (typeof node.gain.setValueAtTime === 'function') {
      node.gain.setValueAtTime(hedef, ctx.currentTime);
    } else {
      node.gain.value = hedef;
    }
  } catch {
    node.gain.value = hedef;
  }
}

function hedefMuzikBusSeviyesi(ayar: SesAyarlari): number {
  if (ayar.muzikMute || sekmeArkaPlanda) return 0;
  return ayar.muzik * MUZIK_BUS_TAVAN;
}

function busGainleriniSenkronizeEt(): void {
  if (!paylasilanCtx) return;
  const ayar = ayarlariYukle();
  gainDegeriUygula(
    masterGainNode,
    paylasilanCtx,
    ayar.masterMute ? 0 : ayar.master
  );
  gainDegeriUygula(
    sfxBusGainNode,
    paylasilanCtx,
    ayar.sfxMute ? 0 : ayar.sfx * SFX_BUS_TAVAN
  );
  gainDegeriUygula(
    muzikBusGainNode,
    paylasilanCtx,
    hedefMuzikBusSeviyesi(ayar),
    0.05
  );
}

function sesKilidiDurumuBildir(): void {
  const bekliyor = sesKilidiBekliyorMu();
  for (const cb of sesKilidiDinleyicileri) {
    cb(bekliyor);
  }
}

export function sesKilidiBekliyorMu(): boolean {
  if (typeof window === 'undefined') return false;
  const ayar = ayarlariYukle();
  if (ayar.masterMute) return false;
  if (paylasilanCtx && paylasilanCtx.state === 'running') return false;
  return !kullaniciEtkilesimiAlindi || paylasilanCtx?.state === 'suspended';
}

export function subscribeSesKilidi(cb: (bekliyor: boolean) => void): () => void {
  sesKilidiDinleyicileri.add(cb);
  return () => {
    sesKilidiDinleyicileri.delete(cb);
  };
}

function ilkEtkilesimKilidiniBagla(): void {
  if (ilkEtkilesimBaglandi || typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return;
  }
  ilkEtkilesimBaglandi = true;

  const olaylar = ['pointerdown', 'touchstart', 'keydown'] as const;
  const temizle = () => {
    if (typeof window.removeEventListener === 'function') {
      for (const olay of olaylar) {
        window.removeEventListener(olay, etkilesimdeAc);
      }
    }
    ilkEtkilesimBaglandi = false;
  };

  const etkilesimdeAc = () => {
    kullaniciEtkilesimiAlindi = true;
    const ctx = initAudio();
    if (!ctx) {
      sesKilidiDurumuBildir();
      return;
    }
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx
        .resume()
        .then(() => {
          if (istenenRuhHali && !aktifMuzik) {
            void muzikBaslatVeyaGecisYap(istenenRuhHali);
          }
          sesKilidiDurumuBildir();
          if (ctx.state === 'running') {
            temizle();
          }
        })
        .catch(() => {
          sesKilidiDurumuBildir();
        });
    } else {
      if (istenenRuhHali && !aktifMuzik) {
        void muzikBaslatVeyaGecisYap(istenenRuhHali);
      }
      sesKilidiDurumuBildir();
      if (ctx.state === 'running') {
        temizle();
      }
    }
  };

  for (const olay of olaylar) {
    window.addEventListener(olay, etkilesimdeAc, olay === 'keydown' ? undefined : { passive: true });
  }
}

function visibilityDinleyiciBagla(): void {
  if (visibilityBaglandi || typeof document === 'undefined' || typeof document.addEventListener !== 'function') {
    return;
  }
  visibilityBaglandi = true;

  const fadeInUygula = () => {
    const aktifCtx = paylasilanCtx;
    if (!aktifCtx || sekmeArkaPlanda) return;
    const hedef = hedefMuzikBusSeviyesi(ayarlariYukle());
    if (muzikBusGainNode) {
      try {
        const simdi = aktifCtx.currentTime;
        muzikBusGainNode.gain.cancelScheduledValues?.(simdi);
        muzikBusGainNode.gain.setValueAtTime(0.0001, simdi);
        muzikBusGainNode.gain.linearRampToValueAtTime(
          Math.max(0.0001, hedef),
          simdi + VISIBILITY_FADE_IN_SN
        );
      } catch {
        muzikBusGainNode.gain.value = hedef;
      }
    }
    if (istenenRuhHali && !aktifMuzik) {
      void muzikBaslatVeyaGecisYap(istenenRuhHali);
    }
    sesKilidiDurumuBildir();
  };

  visibilityHandler = () => {
    const gizlendi = document.visibilityState === 'hidden';
    sekmeArkaPlanda = gizlendi;

    if (gizlendi) {
      if (gizlemeSuspendTimer) {
        clearTimeout(gizlemeSuspendTimer);
        gizlemeSuspendTimer = null;
      }
      const ctx = paylasilanCtx;
      if (!ctx) return;

      if (muzikBusGainNode) {
        try {
          const simdi = ctx.currentTime;
          muzikBusGainNode.gain.cancelScheduledValues?.(simdi);
          muzikBusGainNode.gain.setValueAtTime(
            Math.max(0.0001, muzikBusGainNode.gain.value),
            simdi
          );
          muzikBusGainNode.gain.linearRampToValueAtTime(0.0001, simdi + VISIBILITY_FADE_OUT_SN);
        } catch {
          muzikBusGainNode.gain.value = 0;
        }
      }

      if (ctx.state === 'running' && typeof ctx.suspend === 'function' && !suspendBekleniyor) {
        gizlemeSuspendTimer = setTimeout(() => {
          gizlemeSuspendTimer = null;
          if (
            sekmeArkaPlanda &&
            paylasilanCtx &&
            paylasilanCtx.state === 'running' &&
            typeof paylasilanCtx.suspend === 'function'
          ) {
            suspendBekleniyor = true;
            void paylasilanCtx
              .suspend()
              .catch(() => {})
              .finally(() => {
                suspendBekleniyor = false;
                if (
                  !sekmeArkaPlanda &&
                  paylasilanCtx &&
                  paylasilanCtx.state === 'suspended' &&
                  typeof paylasilanCtx.resume === 'function'
                ) {
                  void paylasilanCtx
                    .resume()
                    .then(fadeInUygula)
                    .catch(() => {
                      sesKilidiDurumuBildir();
                    });
                }
              });
          }
        }, Math.round(VISIBILITY_FADE_OUT_SN * 1000) + 15);
      }
      return;
    }

    if (gizlemeSuspendTimer) {
      clearTimeout(gizlemeSuspendTimer);
      gizlemeSuspendTimer = null;
    }

    const ctx = paylasilanCtx;
    if (!ctx) return;

    if (!suspendBekleniyor && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx
        .resume()
        .then(fadeInUygula)
        .catch(() => {
          sesKilidiDurumuBildir();
        });
    } else if (!suspendBekleniyor) {
      fadeInUygula();
    }
  };

  document.addEventListener('visibilitychange', visibilityHandler);
}

function sesSisteminiKapat(): void {
  if (gizlemeSuspendTimer) {
    clearTimeout(gizlemeSuspendTimer);
    gizlemeSuspendTimer = null;
  }
  suspendBekleniyor = false;
  muzikIstekSeq += 1;

  if (
    visibilityHandler &&
    typeof document !== 'undefined' &&
    typeof document.removeEventListener === 'function'
  ) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
    visibilityBaglandi = false;
  }
  if (
    beforeUnloadBaglandi &&
    typeof window !== 'undefined' &&
    typeof window.removeEventListener === 'function'
  ) {
    window.removeEventListener('beforeunload', sesSisteminiKapat);
    beforeUnloadBaglandi = false;
  }

  for (const kayit of aktifSfxler) {
    kayit.durdur();
  }
  aktifSfxler = [];

  if (sonEskiMuzik) {
    try {
      sonEskiMuzik.stop();
    } catch {
      // Yoksay
    }
    sonEskiMuzik = null;
  }

  if (aktifMuzik) {
    try {
      aktifMuzik.source.stop();
    } catch {
      // Yoksay
    }
    aktifMuzik = null;
  }

  muzikBufferCache.clear();

  const ctx = paylasilanCtx;
  paylasilanCtx = null;
  limiterNode = null;
  masterGainNode = null;
  sfxBusGainNode = null;
  muzikBusGainNode = null;
  gurultuTamponu = null;

  if (ctx && typeof ctx.close === 'function' && ctx.state !== 'closed') {
    try {
      void ctx.close().catch(() => {});
    } catch {
      // Kapatma hatasını yoksay
    }
  }
}

function beforeUnloadDinleyiciBagla(): void {
  if (beforeUnloadBaglandi || typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return;
  }
  beforeUnloadBaglandi = true;
  window.addEventListener('beforeunload', sesSisteminiKapat);
}

function sesGrafiKur(ctx: AudioContext): void {
  const ayar = ayarlariYukle();
  masterGainNode = ctx.createGain();
  sfxBusGainNode = ctx.createGain();
  muzikBusGainNode = ctx.createGain();

  masterGainNode.gain.value = ayar.masterMute ? 0 : ayar.master;
  sfxBusGainNode.gain.value = ayar.sfxMute ? 0 : ayar.sfx * SFX_BUS_TAVAN;
  muzikBusGainNode.gain.value = hedefMuzikBusSeviyesi(ayar);

  sfxBusGainNode.connect(masterGainNode);
  muzikBusGainNode.connect(masterGainNode);

  if (typeof ctx.createDynamicsCompressor === 'function') {
    limiterNode = ctx.createDynamicsCompressor();
    limiterNode.threshold.setValueAtTime(-3, ctx.currentTime);
    limiterNode.knee.setValueAtTime(2, ctx.currentTime);
    limiterNode.ratio.setValueAtTime(20, ctx.currentTime);
    limiterNode.attack.setValueAtTime(0.002, ctx.currentTime);
    limiterNode.release.setValueAtTime(0.08, ctx.currentTime);
    masterGainNode.connect(limiterNode);
    limiterNode.connect(ctx.destination);
  } else {
    limiterNode = null;
    masterGainNode.connect(ctx.destination);
  }
}

export function initAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  ayarlariYukle();
  ilkEtkilesimKilidiniBagla();
  visibilityDinleyiciBagla();
  beforeUnloadDinleyiciBagla();
  try {
    if (!paylasilanCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      paylasilanCtx = new Ctor();
      sesGrafiKur(paylasilanCtx);
    }
    if (paylasilanCtx.state === 'suspended' && typeof paylasilanCtx.resume === 'function') {
      paylasilanCtx
        .resume()
        .then(() => {
          sesKilidiDurumuBildir();
          if (istenenRuhHali && !aktifMuzik) {
            void muzikBaslatVeyaGecisYap(istenenRuhHali);
          }
        })
        .catch(() => {
          sesKilidiDurumuBildir();
        });
    } else {
      sesKilidiDurumuBildir();
    }
    if (istenenRuhHali && !aktifMuzik && paylasilanCtx.state === 'running') {
      void muzikBaslatVeyaGecisYap(istenenRuhHali);
    }
    return paylasilanCtx;
  } catch {
    return null;
  }
}

function gurultuTamponuOlustur(ctx: BaseAudioContext, sureSn: number): AudioBuffer {
  const uzunluk = Math.max(1, Math.floor(ctx.sampleRate * sureSn));
  const tampon = ctx.createBuffer(1, uzunluk, ctx.sampleRate);
  const veri = tampon.getChannelData(0);
  for (let i = 0; i < uzunluk; i += 1) {
    veri[i] = Math.random() * 2 - 1;
  }
  return tampon;
}

function gurultuTamponuAl(ctx: AudioContext): AudioBuffer {
  if (gurultuTamponu && gurultuTamponu.sampleRate === ctx.sampleRate) {
    return gurultuTamponu;
  }
  gurultuTamponu = gurultuTamponuOlustur(ctx, 0.25);
  return gurultuTamponu;
}

export function getSesAyarlari(): SesAyarlari {
  return { ...ayarlariYukle() };
}

export function subscribeSesAyarlari(cb: (ayar: SesAyarlari) => void): () => void {
  ayarDinleyicileri.add(cb);
  return () => {
    ayarDinleyicileri.delete(cb);
  };
}

/**
 * Kullanıcının master sesinin açık olup olmadığını döndürür (varsayılan: açık).
 */
export function sesAcikMi(): boolean {
  const ayar = ayarlariYukle();
  return !ayar.masterMute;
}

/**
 * Master ses tercihini değiştirir veya verilen değere ayarlar.
 */
export function sesTercihiDegistir(yeniDurum?: boolean): boolean {
  const ayar = ayarlariYukle();
  const hedefAcik = typeof yeniDurum === 'boolean' ? yeniDurum : ayar.masterMute;
  mute('master', !hedefAcik);
  return hedefAcik;
}

/**
 * Destekleyen mobil cihazlarda kısa dokunsal titreşim tetikler.
 */
export function titresimTetikle(sureMs: number | number[] = 25): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(sureMs);
  } catch {
    // Desteklenmeyen ortamda hatasız geç
  }
}

function sfxKatmanCal(
  ctx: AudioContext,
  hedefBus: AudioNode,
  referansZaman: number,
  katman: SfxKatman,
  pitchCarpani: number,
  kaynaklar: Array<{ stop: (when?: number) => void }>
): number {
  const baslangic = referansZaman + (katman.gecikme ?? 0);
  const sure = Math.max(0.01, katman.sure);
  const seviye = Math.max(0.0001, katman.volume);

  const gain = ctx.createGain();
  if (katman.tur === 'noise') {
    const kaynak = ctx.createBufferSource();
    kaynak.buffer = gurultuTamponuAl(ctx);

    let sonDugum: AudioNode = kaynak;
    if (katman.filtre) {
      const filtre = ctx.createBiquadFilter();
      filtre.type = katman.filtre.tur;
      filtre.frequency.setValueAtTime(
        Math.max(20, katman.filtre.frekans * pitchCarpani),
        baslangic
      );
      kaynak.connect(filtre);
      sonDugum = filtre;
    }

    gain.gain.setValueAtTime(seviye, baslangic);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      baslangic + Math.max(0.01, katman.zarf.decay)
    );

    sonDugum.connect(gain);
    gain.connect(hedefBus);
    kaynak.start(baslangic);
    const bitis = baslangic + sure + 0.01;
    kaynak.stop(bitis);
    kaynaklar.push(kaynak);
    return bitis;
  }

  const osc = ctx.createOscillator();
  osc.type = katman.tur;
  const basFrekans = Math.max(20, katman.frekans * pitchCarpani);
  const sonFrekans = Math.max(20, (katman.bitisFrekans ?? katman.frekans) * pitchCarpani);
  osc.frequency.setValueAtTime(basFrekans, baslangic);
  osc.frequency.exponentialRampToValueAtTime(sonFrekans, baslangic + sure);

  const attack = Math.max(0.001, katman.zarf.attack);
  const decaySon = Math.max(attack + 0.005, katman.zarf.decay);
  gain.gain.setValueAtTime(0.0001, baslangic);
  gain.gain.linearRampToValueAtTime(seviye, baslangic + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + decaySon);

  let sonDugum: AudioNode = osc;
  if (katman.filtre) {
    const filtre = ctx.createBiquadFilter();
    filtre.type = katman.filtre.tur;
    filtre.frequency.setValueAtTime(katman.filtre.frekans, baslangic);
    osc.connect(filtre);
    sonDugum = filtre;
  }

  sonDugum.connect(gain);
  gain.connect(hedefBus);
  osc.start(baslangic);
  const bitis = baslangic + sure + 0.015;
  osc.stop(bitis);
  kaynaklar.push(osc);
  return bitis;
}

/**
 * Verilen SFX kimliğine göre veri odaklı tanım üzerinden ses efekti üretir.
 * Aynı SFX 30ms içinde tekrar tetiklenmez; eşzamanlı en fazla 4 SFX çalar.
 */
export function playSfx(id: SesTuru | (string & {}), opts?: PlaySfxOpts): void {
  const ayar = ayarlariYukle();
  if (ayar.masterMute || ayar.sfxMute || ayar.master <= 0 || ayar.sfx <= 0) return;

  const tanim = SFX_HARITASI.get(id);
  if (!tanim) return;

  const simdiMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const oncekiMs = sonTetiklemeMs.get(id) ?? -Infinity;
  if (simdiMs - oncekiMs < AYNI_ID_DEBOUNCE_MS) return;
  sonTetiklemeMs.set(id, simdiMs);

  const ctx = initAudio();
  if (!ctx) return;

  const optsVol = opts?.volume !== undefined ? clamp01(opts.volume) : 1;
  if (optsVol <= 0) return;

  const pitchCarpani =
    opts?.pitchCarpani && Number.isFinite(opts.pitchCarpani) && opts.pitchCarpani > 0
      ? opts.pitchCarpani
      : 1;

  try {
    const t = ctx.currentTime;
    aktifSfxler = aktifSfxler.filter((k) => k.bitisZaman > t);
    while (aktifSfxler.length >= MAKS_ESZAMANLI_SFX) {
      const enEski = aktifSfxler.shift();
      enEski?.durdur();
    }

    const sfxGrupGain = ctx.createGain();
    sfxGrupGain.gain.setValueAtTime(optsVol, t);
    sfxGrupGain.connect(sfxBusGainNode ?? ctx.destination);

    const kaynaklar: Array<{ stop: (when?: number) => void }> = [];
    let maxBitis = sfxKatmanCal(ctx, sfxGrupGain, t, tanim, pitchCarpani, kaynaklar);
    if (tanim.katmanlar) {
      for (const ekKatman of tanim.katmanlar) {
        const bitis = sfxKatmanCal(ctx, sfxGrupGain, t, ekKatman, pitchCarpani, kaynaklar);
        if (bitis > maxBitis) maxBitis = bitis;
      }
    }

    const durdur = () => {
      try {
        const kesZaman = ctx.currentTime;
        sfxGrupGain.gain.cancelScheduledValues?.(kesZaman);
        sfxGrupGain.gain.setValueAtTime(Math.max(0.0001, sfxGrupGain.gain.value), kesZaman);
        sfxGrupGain.gain.linearRampToValueAtTime(0.0001, kesZaman + 0.006);
        for (const k of kaynaklar) {
          try {
            k.stop(kesZaman + 0.008);
          } catch {
            // Zaten durmuş kaynağı yoksay
          }
        }
      } catch {
        // Kapanış hatalarını yoksay
      }
    };

    aktifSfxler.push({ id, bitisZaman: maxBitis, durdur });
  } catch {
    // Ses sentez hatasında oyunu kesme
  }
}

export function setVolume(kategori: SesKategorisi, deger: number): number {
  const ayar = ayarlariYukle();
  const temiz = clamp01(deger);
  guncelAyarlar = {
    ...ayar,
    [kategori]: temiz,
  };
  ayarlariKaydet(guncelAyarlar);
  busGainleriniSenkronizeEt();
  dinleyicileriBilgilendir();
  return temiz;
}

export function getVolume(kategori: SesKategorisi): number {
  return ayarlariYukle()[kategori];
}

export function mute(kategori: SesKategorisi, kapali: boolean): boolean {
  const ayar = ayarlariYukle();
  const muteAlani =
    kategori === 'master'
      ? 'masterMute'
      : kategori === 'sfx'
        ? 'sfxMute'
        : 'muzikMute';
  guncelAyarlar = {
    ...ayar,
    [muteAlani]: Boolean(kapali),
  };
  ayarlariKaydet(guncelAyarlar);
  busGainleriniSenkronizeEt();
  dinleyicileriBilgilendir();
  sesKilidiDurumuBildir();
  return Boolean(kapali);
}

// ============================================================================
// OFFLINE AUDIO CONTEXT TABANLI MÜZİK MOTORU (12 SN CLICK-FREE LOOP + 1.5 SN CROSSFADE)
// ============================================================================

function muzikNotaPlanla(
  offline: BaseAudioContext,
  hedef: AudioNode,
  baslangic: number,
  sure: number,
  tur: OscillatorType,
  frekans: number,
  seviye: number,
  attack = 0.012,
  lowpassHz?: number
): void {
  if (baslangic >= MUZIK_LOOP_SURE_SN - 0.02) return;
  const guvenliSure = Math.min(sure, MUZIK_LOOP_SURE_SN - baslangic - 0.015);
  if (guvenliSure <= 0.02) return;

  const osc = offline.createOscillator();
  const gain = offline.createGain();
  osc.type = tur;
  osc.frequency.setValueAtTime(frekans, baslangic);

  const gercekAttack = Math.min(attack, guvenliSure * 0.35);
  gain.gain.setValueAtTime(0.0001, baslangic);
  gain.gain.linearRampToValueAtTime(seviye, baslangic + gercekAttack);
  gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + guvenliSure);

  if (lowpassHz) {
    const lp = offline.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(lowpassHz, baslangic);
    osc.connect(lp);
    lp.connect(gain);
  } else {
    osc.connect(gain);
  }

  gain.connect(hedef);
  osc.start(baslangic);
  osc.stop(baslangic + guvenliSure + 0.005);
}

function muzikDavulPlanla(
  offline: BaseAudioContext,
  hedef: AudioNode,
  noiseBuffer: AudioBuffer,
  baslangic: number,
  tur: 'kick' | 'snare' | 'hat',
  seviye: number
): void {
  if (baslangic >= MUZIK_LOOP_SURE_SN - 0.03) return;

  if (tur === 'kick') {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(128, baslangic);
    osc.frequency.exponentialRampToValueAtTime(42, baslangic + 0.11);
    gain.gain.setValueAtTime(seviye, baslangic);
    gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + 0.12);
    osc.connect(gain);
    gain.connect(hedef);
    osc.start(baslangic);
    osc.stop(baslangic + 0.125);
    return;
  }

  const src = offline.createBufferSource();
  src.buffer = noiseBuffer;
  const filtre = offline.createBiquadFilter();
  filtre.type = tur === 'snare' ? 'bandpass' : 'highpass';
  filtre.frequency.setValueAtTime(tur === 'snare' ? 1650 : 5200, baslangic);

  const sure = tur === 'snare' ? 0.085 : 0.032;
  const gain = offline.createGain();
  gain.gain.setValueAtTime(seviye, baslangic);
  gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + sure);

  src.connect(filtre);
  filtre.connect(gain);
  gain.connect(hedef);
  src.start(baslangic);
  src.stop(baslangic + sure + 0.005);
}

function loopKenarlariniYumusat(buffer: AudioBuffer): void {
  const fadeOrnek = Math.min(Math.floor(buffer.sampleRate * 0.012), Math.floor(buffer.length / 4));
  if (fadeOrnek <= 0) return;
  for (let ch = 0; ch < buffer.numberOfChannels; ch += 1) {
    const veri = buffer.getChannelData(ch);
    for (let i = 0; i < fadeOrnek; i += 1) {
      const carpan = i / fadeOrnek;
      veri[i] *= carpan;
      veri[veri.length - 1 - i] *= carpan;
    }
  }
}

async function muzikTamponuRenderEt(
  ctx: AudioContext,
  ruhHali: MuzikRuhHali
): Promise<AudioBuffer | null> {
  const onbellek = muzikBufferCache.get(ruhHali);
  if (onbellek) return onbellek;

  if (typeof window === 'undefined') return null;
  const OfflineCtor =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!OfflineCtor) return null;

  const sampleRate = ctx.sampleRate || 44100;
  const uzunluk = Math.floor(sampleRate * MUZIK_LOOP_SURE_SN);
  const offline = new OfflineCtor(1, uzunluk, sampleRate);
  const masterBus = offline.createGain();
  masterBus.gain.setValueAtTime(0.85, 0);
  masterBus.connect(offline.destination);
  const noiseBuffer = gurultuTamponuOlustur(offline, 0.12);

  if (ruhHali === 'sakin') {
    // 80 BPM, 4 ölçü (12.0 sn), hüzünlü La minör (Am - F - Dm - E)
    const beat = 60 / 80; // 0.75s
    const olculer = [
      { bas: 110.0, arp: [220.0, 261.63, 329.63, 440.0, 329.63, 261.63, 220.0, 261.63] },
      { bas: 87.31, arp: [174.61, 220.0, 261.63, 349.23, 261.63, 220.0, 174.61, 220.0] },
      { bas: 73.42, arp: [146.83, 220.0, 293.66, 349.23, 293.66, 220.0, 174.61, 220.0] },
      { bas: 82.41, arp: [164.81, 207.65, 246.94, 329.63, 246.94, 207.65, 196.0, 164.81] },
    ];
    olculer.forEach((olcu, barIdx) => {
      const barStart = barIdx * 4 * beat;
      muzikNotaPlanla(offline, masterBus, barStart, 1.45, 'triangle', olcu.bas, 0.34, 0.03, 480);
      muzikNotaPlanla(offline, masterBus, barStart + 2 * beat, 1.4, 'triangle', olcu.bas * 1.5, 0.22, 0.03, 450);
      olcu.arp.forEach((nota, stepIdx) => {
        const t = barStart + stepIdx * (beat * 0.5);
        muzikNotaPlanla(offline, masterBus, t, 0.36, 'sine', nota, 0.18, 0.015, 1300);
      });
    });
  } else if (ruhHali === 'enerjik') {
    // 120 BPM, 6 ölçü (12.0 sn), tempolu salon ritmi (Am - Am - C - G - F - E)
    const beat = 60 / 120; // 0.5s
    const basKokler = [110.0, 110.0, 130.81, 98.0, 87.31, 82.41];
    const ustMelodi = [
      [440, 0, 523.25, 440, 392, 0, 440, 523.25],
      [440, 523.25, 659.25, 0, 587.33, 523.25, 440, 392],
      [523.25, 0, 659.25, 587.33, 523.25, 0, 392, 523.25],
      [392, 493.88, 587.33, 0, 493.88, 392, 329.63, 392],
      [349.23, 0, 440, 523.25, 440, 349.23, 329.63, 293.66],
      [329.63, 415.3, 493.88, 0, 415.3, 493.88, 659.25, 493.88],
    ];
    basKokler.forEach((kok, barIdx) => {
      const barStart = barIdx * 4 * beat;
      for (let i = 0; i < 8; i += 1) {
        const t = barStart + i * (beat * 0.5);
        const basNota = i % 2 === 0 ? kok : kok * 2;
        muzikNotaPlanla(offline, masterBus, t, 0.21, 'sawtooth', basNota, 0.22, 0.006, 720);
        const mel = ustMelodi[barIdx][i];
        if (mel > 0) {
          muzikNotaPlanla(offline, masterBus, t, 0.2, 'triangle', mel, 0.16, 0.008, 2200);
        }
        muzikDavulPlanla(offline, masterBus, noiseBuffer, t, 'hat', i % 2 === 1 ? 0.1 : 0.05);
      }
      for (let b = 0; b < 4; b += 1) {
        const bt = barStart + b * beat;
        if (b === 0 || b === 2) {
          muzikDavulPlanla(offline, masterBus, noiseBuffer, bt, 'kick', 0.34);
        } else {
          muzikDavulPlanla(offline, masterBus, noiseBuffer, bt, 'snare', 0.18);
        }
      }
    });
  } else {
    // gergin: 160 BPM, 8 ölçü (12.0 sn), bas ağırlıklı Frigyen sokak dövüşü gerilimi
    const beat = 60 / 160; // 0.375s
    const basKokler = [55.0, 55.0, 58.27, 58.27, 49.0, 49.0, 41.2, 43.65];
    const motif = [
      [440, 0, 466.16, 440, 0, 329.63, 440, 0],
      [440, 466.16, 523.25, 0, 466.16, 440, 329.63, 0],
      [466.16, 0, 523.25, 466.16, 0, 349.23, 466.16, 0],
      [466.16, 523.25, 587.33, 0, 523.25, 466.16, 440, 0],
      [392, 0, 440, 392, 0, 293.66, 392, 0],
      [392, 440, 466.16, 0, 440, 392, 349.23, 0],
      [329.63, 0, 349.23, 329.63, 0, 246.94, 329.63, 0],
      [349.23, 415.3, 440, 0, 466.16, 440, 415.3, 329.63],
    ];
    basKokler.forEach((kok, barIdx) => {
      const barStart = barIdx * 4 * beat;
      for (let i = 0; i < 8; i += 1) {
        const t = barStart + i * (beat * 0.5);
        const basFrek = i === 6 ? kok * 1.5 : kok;
        muzikNotaPlanla(offline, masterBus, t, 0.16, 'sawtooth', basFrek, 0.34, 0.004, 480);
        muzikNotaPlanla(offline, masterBus, t, 0.16, 'triangle', basFrek * 2, 0.18, 0.004, 650);
        const nota = motif[barIdx][i];
        if (nota > 0) {
          muzikNotaPlanla(offline, masterBus, t, 0.13, 'square', nota, 0.11, 0.005, 1500);
        }
        muzikDavulPlanla(offline, masterBus, noiseBuffer, t, 'hat', 0.075);
      }
      for (let b = 0; b < 4; b += 1) {
        const bt = barStart + b * beat;
        if (b === 0 || b === 2) {
          muzikDavulPlanla(offline, masterBus, noiseBuffer, bt, 'kick', 0.42);
        } else {
          muzikDavulPlanla(offline, masterBus, noiseBuffer, bt, 'snare', 0.22);
        }
      }
    });
  }

  const rendered = await offline.startRendering();
  loopKenarlariniYumusat(rendered);
  muzikBufferCache.set(ruhHali, rendered);
  return rendered;
}

async function muzikBaslatVeyaGecisYap(ruhHali: MuzikRuhHali): Promise<void> {
  const istekId = ++muzikIstekSeq;
  const ctx = paylasilanCtx;
  if (!ctx || !muzikBusGainNode) return;
  if (aktifMuzik?.ruhHali === ruhHali) return;

  try {
    const buffer = await muzikTamponuRenderEt(ctx, ruhHali);
    if (!buffer || istekId !== muzikIstekSeq || istenenRuhHali !== ruhHali) return;
    if (!paylasilanCtx || !muzikBusGainNode) return;

    const simdi = paylasilanCtx.currentTime;
    const eski = aktifMuzik;
    if (sonEskiMuzik && sonEskiMuzik !== eski?.source) {
      try {
        sonEskiMuzik.stop(simdi);
      } catch {
        // Yoksay
      }
      sonEskiMuzik = null;
    }
    if (eski) {
      try {
        eski.gain.gain.cancelScheduledValues?.(simdi);
        eski.gain.gain.setValueAtTime(Math.max(0.0001, eski.gain.gain.value), simdi);
        eski.gain.gain.linearRampToValueAtTime(0.0001, simdi + MUZIK_CROSSFADE_SN);
        eski.source.stop(simdi + MUZIK_CROSSFADE_SN + 0.05);
        sonEskiMuzik = eski.source;
      } catch {
        // Eski kaynağı sessizce kapat
      }
    }

    const yeniGain = paylasilanCtx.createGain();
    const fadeGerekli = Boolean(eski);
    yeniGain.gain.setValueAtTime(fadeGerekli ? 0.0001 : 0.0001, simdi);
    yeniGain.gain.linearRampToValueAtTime(
      1,
      simdi + (fadeGerekli ? MUZIK_CROSSFADE_SN : 0.45)
    );
    yeniGain.connect(muzikBusGainNode);

    const yeniSource = paylasilanCtx.createBufferSource();
    yeniSource.buffer = buffer;
    yeniSource.loop = true;
    yeniSource.connect(yeniGain);
    yeniSource.start(simdi);

    aktifMuzik = { ruhHali, source: yeniSource, gain: yeniGain };
  } catch {
    // OfflineAudioContext başarısız olursa oyunu kesme
  }
}

/**
 * Verilen ruh haline göre 12 sn click-free müzik döngüsü başlatır veya
 * 1.5 sn crossfade ile geçiş yapar.
 */
export function playMusic(ruhHali: MuzikRuhHali): void {
  istenenRuhHali = ruhHali;
  if (aktifMuzik?.ruhHali === ruhHali) return;
  const ctx = initAudio();
  if (!ctx) return;
  void muzikBaslatVeyaGecisYap(ruhHali);
}

/**
 * Çalan müziği verilen fadeMs süresinde yumuşakça susturur.
 */
export function stopMusic(fadeMs = 1500): void {
  istenenRuhHali = null;
  muzikIstekSeq += 1;
  if (!aktifMuzik || !paylasilanCtx) {
    aktifMuzik = null;
    return;
  }

  const sureSn = Math.max(0.02, fadeMs / 1000);
  const simdi = paylasilanCtx.currentTime;
  const eski = aktifMuzik;
  aktifMuzik = null;

  try {
    eski.gain.gain.cancelScheduledValues?.(simdi);
    eski.gain.gain.setValueAtTime(Math.max(0.0001, eski.gain.gain.value), simdi);
    eski.gain.gain.linearRampToValueAtTime(0.0001, simdi + sureSn);
    eski.source.stop(simdi + sureSn + 0.04);
  } catch {
    // Durdurma hatasını yoksay
  }
}
