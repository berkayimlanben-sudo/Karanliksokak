/**
 * ============================================================================
 * DIŞ DOSYASIZ WEB AUDIO RETRO SES SENTEZLEYİCİ VE MOBİL TİTREŞİM
 * AudioContext kullanarak dövüş seslerini gerçek zamanlı üretir;
 * ses açık/kapalı tercihini localStorage üzerinde saklar.
 * ============================================================================
 */

export type SesTuru =
  | 'gong'
  | 'yumruk'
  | 'sert_yumruk'
  | 'blok'
  | 'kacinma'
  | 'mukemmel'
  | 'kombo'
  | 'nakavt'
  | 'tik';

export const SES_TERCIH_ANAHTARI = 'karanlik_sokak_ses_acik';

let paylasilanCtx: AudioContext | null = null;
let gurultuTamponu: AudioBuffer | null = null;

function audioContextAl(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!paylasilanCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      paylasilanCtx = new Ctor();
    }
    if (paylasilanCtx.state === 'suspended') {
      paylasilanCtx.resume().catch(() => {
        // Tarayıcı kullanıcı etkileşimi bekliyorsa sessizce geç
      });
    }
    return paylasilanCtx;
  } catch {
    return null;
  }
}

function gurultuTamponuAl(ctx: AudioContext): AudioBuffer {
  if (gurultuTamponu && gurultuTamponu.sampleRate === ctx.sampleRate) {
    return gurultuTamponu;
  }
  const uzunluk = Math.floor(ctx.sampleRate * 0.25);
  const tampon = ctx.createBuffer(1, uzunluk, ctx.sampleRate);
  const veri = tampon.getChannelData(0);
  for (let i = 0; i < uzunluk; i += 1) {
    veri[i] = Math.random() * 2 - 1;
  }
  gurultuTamponu = tampon;
  return tampon;
}

/**
 * Kullanıcının ses tercihini okur (varsayılan: açık).
 */
export function sesAcikMi(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  try {
    const kayit = window.localStorage.getItem(SES_TERCIH_ANAHTARI);
    return kayit !== '0';
  } catch {
    return true;
  }
}

/**
 * Ses tercihini değiştirir veya verilen değere ayarlar ve yeni durumu döndürür.
 */
export function sesTercihiDegistir(yeniDurum?: boolean): boolean {
  const hedef = typeof yeniDurum === 'boolean' ? yeniDurum : !sesAcikMi();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SES_TERCIH_ANAHTARI, hedef ? '1' : '0');
    } catch {
      // Depolama erişilemezse yoksay
    }
  }
  return hedef;
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

function tonCal(
  ctx: AudioContext,
  baslangic: number,
  tur: OscillatorType,
  frekansBas: number,
  frekansSon: number,
  sureSn: number,
  seviye: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tur;
  osc.frequency.setValueAtTime(Math.max(20, frekansBas), baslangic);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, frekansSon), baslangic + sureSn);

  gain.gain.setValueAtTime(0.0001, baslangic);
  gain.gain.linearRampToValueAtTime(seviye, baslangic + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + sureSn);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(baslangic);
  osc.stop(baslangic + sureSn + 0.015);
}

function gurultuCal(
  ctx: AudioContext,
  baslangic: number,
  filtreTuru: BiquadFilterType,
  frekans: number,
  sureSn: number,
  seviye: number
): void {
  const kaynak = ctx.createBufferSource();
  kaynak.buffer = gurultuTamponuAl(ctx);

  const filtre = ctx.createBiquadFilter();
  filtre.type = filtreTuru;
  filtre.frequency.setValueAtTime(frekans, baslangic);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(seviye, baslangic);
  gain.gain.exponentialRampToValueAtTime(0.0001, baslangic + sureSn);

  kaynak.connect(filtre);
  filtre.connect(gain);
  gain.connect(ctx.destination);
  kaynak.start(baslangic);
  kaynak.stop(baslangic + sureSn + 0.01);
}

/**
 * Verilen türe göre harici dosya olmadan retro ses efekti sentezler.
 */
export function sesCal(tur: SesTuru): void {
  if (!sesAcikMi()) return;
  const ctx = audioContextAl();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    switch (tur) {
      case 'gong':
        tonCal(ctx, t, 'triangle', 220, 216, 0.72, 0.14);
        tonCal(ctx, t, 'sine', 330, 326, 0.65, 0.11);
        tonCal(ctx, t, 'sine', 528, 520, 0.48, 0.07);
        break;
      case 'yumruk':
        tonCal(ctx, t, 'sine', 190, 62, 0.095, 0.16);
        gurultuCal(ctx, t, 'bandpass', 720, 0.06, 0.1);
        break;
      case 'sert_yumruk':
        tonCal(ctx, t, 'triangle', 150, 42, 0.16, 0.22);
        tonCal(ctx, t, 'sawtooth', 95, 38, 0.12, 0.08);
        gurultuCal(ctx, t, 'lowpass', 620, 0.11, 0.16);
        break;
      case 'blok':
        tonCal(ctx, t, 'triangle', 110, 58, 0.09, 0.14);
        gurultuCal(ctx, t, 'lowpass', 290, 0.055, 0.09);
        break;
      case 'kacinma':
        tonCal(ctx, t, 'sine', 280, 620, 0.08, 0.07);
        gurultuCal(ctx, t, 'highpass', 1400, 0.075, 0.06);
        break;
      case 'mukemmel':
        tonCal(ctx, t, 'triangle', 587, 592, 0.09, 0.12);
        tonCal(ctx, t + 0.065, 'sine', 880, 900, 0.15, 0.14);
        break;
      case 'kombo':
        tonCal(ctx, t, 'triangle', 440, 440, 0.075, 0.11);
        tonCal(ctx, t + 0.055, 'triangle', 554, 554, 0.075, 0.12);
        tonCal(ctx, t + 0.11, 'sine', 659, 680, 0.15, 0.14);
        break;
      case 'nakavt':
        tonCal(ctx, t, 'sawtooth', 120, 32, 0.45, 0.2);
        tonCal(ctx, t, 'triangle', 392, 196, 0.52, 0.14);
        gurultuCal(ctx, t, 'lowpass', 480, 0.22, 0.18);
        break;
      case 'tik':
        tonCal(ctx, t, 'sine', 740, 520, 0.032, 0.05);
        break;
    }
  } catch {
    // Ses sentez hatasında oyunu kesme
  }
}
