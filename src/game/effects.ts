/**
 * ============================================================================
 * TEK MERKEZLİ EFEKT MOTORU (SARSINTI, HIT-STOP, FLAŞ, HASAR SAYILARI, PARÇACIK)
 * DOM havuzu + requestAnimationFrame kullanır (setInterval yok).
 * prefers-reduced-motion ve WCAG 2.3.1 (<=3 flaş/sn, alfa <=0.3) sınırlarına uyar.
 * ============================================================================
 */

export type EfektKategorisi = 'sarsinti' | 'flas' | 'parcacik' | 'hitStop';

export type HasarSayiTuru =
  | 'hafif'
  | 'orta'
  | 'agir'
  | 'blok'
  | 'mukemmel'
  | 'kombo'
  | 'nakavt'
  | 'kazanc';

export interface EfektAyarlari {
  sarsinti: number;
  flas: number;
  parcacik: number;
  hitStop: number;
}

export interface ParcacikOpts {
  adet?: number;
  renk?: string;
  boyutPx?: number;
  hiz?: number;
  sureMs?: number;
}

export const EFEKT_AYARLARI_ANAHTARI = 'karanlik_sokak_efekt_ayarlari_v1';

const MAKS_SARSINTI_PX = 6;
const MAKS_HITSTOP_MS = 150;
const MAKS_FLAS_ALFA = 0.3;
const MAKS_FLAS_SANIYE = 3;
const HASAR_HAVUZ_BOYUTU = 24;
const PARCACIK_HAVUZ_MOBIL = 50;
const PARCACIK_HAVUZ_MASAUSTU = 150;

const VARSAYILAN_AYARLAR: EfektAyarlari = {
  sarsinti: 100,
  flas: 100,
  parcacik: 100,
  hitStop: 100,
};

interface AktifSarsinti {
  siddet: number;
  baslangic: number;
  sureMs: number;
}

interface AktifFlas {
  alfa: number;
  baslangic: number;
  sureMs: number;
  renk: string;
}

interface HavuzHasarKaydi {
  el: HTMLElement;
  aktif: boolean;
  baslangic: number;
  sureMs: number;
  basX: number;
  basY: number;
  kaymaY: number;
  ofsetX: number;
}

interface HavuzParcacikKaydi {
  el: HTMLElement;
  aktif: boolean;
  baslangic: number;
  sureMs: number;
  basX: number;
  basY: number;
  vx: number;
  vy: number;
}

let ayarlarYuklendi = false;
let guncelAyarlar: EfektAyarlari = { ...VARSAYILAN_AYARLAR };
const ayarDinleyicileri = new Set<(ayar: EfektAyarlari) => void>();
let mediaListenerBaglandi = false;

let sahneKonteyneri: HTMLElement | null = null;
let sarsintiHedefi: HTMLElement | null = null;
let flasKatmani: HTMLElement | null = null;
let hasarHavuzu: HavuzHasarKaydi[] = [];
let parcacikHavuzu: HavuzParcacikKaydi[] = [];

let aktifSarsinti: AktifSarsinti | null = null;
let aktifFlas: AktifFlas | null = null;
let sonFlasZamanlari: number[] = [];
let hitStopBitisMs = 0;
let rafId = 0;

function simdiMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function clamp100(deger: number): number {
  if (!Number.isFinite(deger)) return 0;
  return Math.round(Math.min(100, Math.max(0, deger)));
}

function mobilGorunumMu(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.innerWidth || 1024) < 768;
}

export function reducedMotionAlgilandiMi(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

function ayarlariKaydet(ayar: EfektAyarlari, reducedMotionUygulandi?: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const kayit: EfektAyarlari & { reducedMotionUygulandi?: boolean } = {
      ...ayar,
      ...(reducedMotionUygulandi !== undefined ? { reducedMotionUygulandi } : {}),
    };
    window.localStorage.setItem(EFEKT_AYARLARI_ANAHTARI, JSON.stringify(kayit));
  } catch {
    // Depolama erişilemezse yoksay
  }
}

export function _efektAyarOnbellegiSifirla(): void {
  ayarlarYuklendi = false;
  mediaListenerBaglandi = false;
  guncelAyarlar = { ...VARSAYILAN_AYARLAR };
}

function dinleyicileriBilgilendir(): void {
  const kopya = { ...guncelAyarlar };
  for (const cb of ayarDinleyicileri) {
    cb(kopya);
  }
}

function reducedMotionDinleyiciBagla(): void {
  if (
    mediaListenerBaglandi ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return;
  }
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof mq.addEventListener === 'function') {
      mediaListenerBaglandi = true;
      mq.addEventListener('change', (ev: MediaQueryListEvent) => {
        if (ev.matches) {
          guncelAyarlar = { sarsinti: 0, flas: 0, parcacik: 0, hitStop: 0 };
          ayarlariKaydet(guncelAyarlar, true);
          dinleyicileriBilgilendir();
        } else {
          ayarlariKaydet(guncelAyarlar, false);
        }
      });
    }
  } catch {
    // matchMedia dinleyicisi desteklenmiyorsa geç
  }
}

function ayarlariYukle(): EfektAyarlari {
  if (typeof window === 'undefined') {
    return guncelAyarlar;
  }
  reducedMotionDinleyiciBagla();
  if (ayarlarYuklendi) return guncelAyarlar;

  ayarlarYuklendi = true;
  const rmAktif = reducedMotionAlgilandiMi();
  try {
    const ham = window.localStorage?.getItem(EFEKT_AYARLARI_ANAHTARI);
    if (ham) {
      const parsed = JSON.parse(ham) as Partial<EfektAyarlari> & {
        reducedMotionUygulandi?: boolean;
      };
      if (rmAktif && !parsed.reducedMotionUygulandi) {
        guncelAyarlar = { sarsinti: 0, flas: 0, parcacik: 0, hitStop: 0 };
        ayarlariKaydet(guncelAyarlar, true);
        return guncelAyarlar;
      }
      guncelAyarlar = {
        sarsinti: typeof parsed.sarsinti === 'number' ? clamp100(parsed.sarsinti) : 100,
        flas: typeof parsed.flas === 'number' ? clamp100(parsed.flas) : 100,
        parcacik: typeof parsed.parcacik === 'number' ? clamp100(parsed.parcacik) : 100,
        hitStop: typeof parsed.hitStop === 'number' ? clamp100(parsed.hitStop) : 100,
      };
      if (!rmAktif && parsed.reducedMotionUygulandi) {
        ayarlariKaydet(guncelAyarlar, false);
      }
      return guncelAyarlar;
    }

    if (rmAktif) {
      guncelAyarlar = { sarsinti: 0, flas: 0, parcacik: 0, hitStop: 0 };
      ayarlariKaydet(guncelAyarlar, true);
      return guncelAyarlar;
    }

    guncelAyarlar = { ...VARSAYILAN_AYARLAR };
  } catch {
    guncelAyarlar = rmAktif
      ? { sarsinti: 0, flas: 0, parcacik: 0, hitStop: 0 }
      : { ...VARSAYILAN_AYARLAR };
  }
  return guncelAyarlar;
}

export function getEfektAyarlari(): EfektAyarlari {
  return { ...ayarlariYukle() };
}

export function subscribeEfektAyarlari(cb: (ayar: EfektAyarlari) => void): () => void {
  ayarDinleyicileri.add(cb);
  return () => {
    ayarDinleyicileri.delete(cb);
  };
}

/**
 * Kategori bazlı efekt seviyesini (0-100) okur veya günceller.
 */
export function efektSeviyesi(kategori: EfektKategorisi, deger?: number): number {
  const mevcut = ayarlariYukle();
  if (deger === undefined) {
    return mevcut[kategori];
  }
  const temiz = clamp100(deger);
  guncelAyarlar = {
    ...mevcut,
    [kategori]: temiz,
  };
  ayarlariKaydet(guncelAyarlar, reducedMotionAlgilandiMi());
  dinleyicileriBilgilendir();

  if (kategori === 'sarsinti' && temiz === 0 && sarsintiHedefi) {
    aktifSarsinti = null;
    sarsintiHedefi.style.transform = '';
  }
  if (kategori === 'hitStop' && temiz === 0) {
    hitStopBitisMs = 0;
  }
  return temiz;
}

function havuzuKur(konteyner: HTMLElement): void {
  if (typeof document === 'undefined') return;

  const flasEl = document.createElement('div');
  flasEl.setAttribute('aria-hidden', 'true');
  flasEl.dataset.testid = 'effects-flash-overlay';
  flasEl.style.cssText =
    'position:absolute;inset:0;pointer-events:none;opacity:0;background:#ffffff;will-change:opacity;z-index:25;';
  konteyner.appendChild(flasEl);
  flasKatmani = flasEl;

  hasarHavuzu = [];
  for (let i = 0; i < HASAR_HAVUZ_BOYUTU; i += 1) {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.dataset.efektHavuz = 'hasar';
    span.style.cssText =
      'position:absolute;left:0;top:0;pointer-events:none;opacity:0;font-family:"JetBrains Mono",monospace;font-weight:800;line-height:1;white-space:nowrap;text-shadow:2px 2px 0 #06080E,-1px -1px 0 #06080E;will-change:transform,opacity;z-index:24;';
    konteyner.appendChild(span);
    hasarHavuzu.push({
      el: span,
      aktif: false,
      baslangic: 0,
      sureMs: 600,
      basX: 0,
      basY: 0,
      kaymaY: 36,
      ofsetX: 0,
    });
  }

  const parcacikKapasite = mobilGorunumMu()
    ? PARCACIK_HAVUZ_MOBIL
    : PARCACIK_HAVUZ_MASAUSTU;
  parcacikHavuzu = [];
  for (let i = 0; i < parcacikKapasite; i += 1) {
    const nokta = document.createElement('div');
    nokta.setAttribute('aria-hidden', 'true');
    nokta.dataset.efektHavuz = 'parcacik';
    nokta.style.cssText =
      'position:absolute;left:0;top:0;width:4px;height:4px;pointer-events:none;opacity:0;will-change:transform,opacity;z-index:23;';
    konteyner.appendChild(nokta);
    parcacikHavuzu.push({
      el: nokta,
      aktif: false,
      baslangic: 0,
      sureMs: 320,
      basX: 0,
      basY: 0,
      vx: 0,
      vy: 0,
    });
  }
}

export function efektKatmaniniBagla(
  sahneEl: HTMLElement,
  sarsintiEl: HTMLElement | null = sahneEl
): void {
  if (sahneKonteyneri === sahneEl && sarsintiHedefi === sarsintiEl) return;
  efektKatmaniniAyir();
  sahneKonteyneri = sahneEl;
  sarsintiHedefi = sarsintiEl;
  havuzuKur(sahneEl);
}

export function efektKatmaniniAyir(): void {
  if (rafId && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId);
  }
  rafId = 0;
  aktifSarsinti = null;
  aktifFlas = null;
  hitStopBitisMs = 0;

  if (sarsintiHedefi) {
    sarsintiHedefi.style.transform = '';
  }
  flasKatmani?.remove();
  for (const h of hasarHavuzu) h.el.remove();
  for (const p of parcacikHavuzu) p.el.remove();

  flasKatmani = null;
  hasarHavuzu = [];
  parcacikHavuzu = [];
  sahneKonteyneri = null;
  sarsintiHedefi = null;
}

function donguyuBaslat(): void {
  if (rafId || typeof requestAnimationFrame !== 'function') return;
  const kare = (simdi: number) => {
    let devam = false;

    // 1. Sarsıntı
    if (aktifSarsinti && sarsintiHedefi) {
      const gecen = simdi - aktifSarsinti.baslangic;
      if (gecen >= aktifSarsinti.sureMs) {
        aktifSarsinti = null;
        sarsintiHedefi.style.transform = '';
      } else {
        const kalanOran = 1 - gecen / Math.max(1, aktifSarsinti.sureMs);
        const genlik = aktifSarsinti.siddet * kalanOran;
        const dx = Math.round((Math.random() * 2 - 1) * genlik * 10) / 10;
        const dy = Math.round((Math.random() * 2 - 1) * genlik * 0.8 * 10) / 10;
        sarsintiHedefi.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        devam = true;
      }
    }

    // 2. Flaş
    if (aktifFlas && flasKatmani) {
      const gecen = simdi - aktifFlas.baslangic;
      if (gecen >= aktifFlas.sureMs) {
        aktifFlas = null;
        flasKatmani.style.opacity = '0';
      } else {
        const kalanOran = 1 - gecen / Math.max(1, aktifFlas.sureMs);
        flasKatmani.style.background = aktifFlas.renk;
        flasKatmani.style.opacity = String(Number((aktifFlas.alfa * kalanOran).toFixed(3)));
        devam = true;
      }
    }

    // 3. Havuzdan hasar sayıları (600ms yukarı kayarak kaybolur)
    for (const kayit of hasarHavuzu) {
      if (!kayit.aktif) continue;
      const gecen = simdi - kayit.baslangic;
      if (gecen >= kayit.sureMs) {
        kayit.aktif = false;
        kayit.el.style.opacity = '0';
      } else {
        const t = gecen / Math.max(1, kayit.sureMs);
        const y = kayit.basY - t * kayit.kaymaY;
        const x = kayit.basX + kayit.ofsetX * t;
        const alfa = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
        kayit.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateX(-50%)`;
        kayit.el.style.opacity = String(Number(alfa.toFixed(2)));
        devam = true;
      }
    }

    // 4. Havuzdan parçacıklar
    for (const p of parcacikHavuzu) {
      if (!p.aktif) continue;
      const gecen = simdi - p.baslangic;
      if (gecen >= p.sureMs) {
        p.aktif = false;
        p.el.style.opacity = '0';
      } else {
        const sn = gecen / 1000;
        const t = gecen / Math.max(1, p.sureMs);
        const x = p.basX + p.vx * sn;
        const y = p.basY + p.vy * sn + 120 * sn * sn;
        p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        p.el.style.opacity = String(Number((1 - t).toFixed(2)));
        devam = true;
      }
    }

    if (devam) {
      rafId = requestAnimationFrame(kare);
    } else {
      rafId = 0;
    }
  };

  rafId = requestAnimationFrame(kare);
}

/**
 * Ekran sarsıntısı tetikler.
 * Hafif: 2px/80ms, Orta: 4px/120ms, Ağır: 6px/180ms. Maks 6px.
 * efektSeviyesi('sarsinti') === 0 ise DOM'a hiç dokunmaz.
 */
export function sarsinti(siddet: number, sureMs?: number): void {
  const ayar = ayarlariYukle();
  if (ayar.sarsinti <= 0 || !Number.isFinite(siddet) || siddet <= 0) return;

  const olcekliSiddet = Math.min(MAKS_SARSINTI_PX, siddet) * (ayar.sarsinti / 100);
  if (olcekliSiddet <= 0 || !sarsintiHedefi) return;

  const varsayilanSure = siddet <= 2 ? 80 : siddet <= 4 ? 120 : 180;
  const hedefSure = Math.max(40, Math.min(250, sureMs ?? varsayilanSure));
  const t = simdiMs();

  if (!aktifSarsinti || olcekliSiddet >= aktifSarsinti.siddet) {
    aktifSarsinti = {
      siddet: olcekliSiddet,
      baslangic: t,
      sureMs: hedefSure,
    };
  }
  donguyuBaslat();
}

/**
 * Kısa darbe donması (hit-stop) başlatır.
 * Hafif: 30ms, Orta: 60ms, Ağır: 100ms. Maks 150ms.
 */
export function hitStop(ms: number): void {
  const ayar = ayarlariYukle();
  if (ayar.hitStop <= 0 || !Number.isFinite(ms) || ms <= 0) return;

  const olcekliMs = Math.min(MAKS_HITSTOP_MS, ms) * (ayar.hitStop / 100);
  if (olcekliMs <= 0) return;

  const hedefBitis = simdiMs() + olcekliMs;
  if (hedefBitis > hitStopBitisMs) {
    hitStopBitisMs = hedefBitis;
  }
}

export function hitStopAktifMi(): boolean {
  return simdiMs() < hitStopBitisMs;
}

/**
 * Kısa ekran flaşı uygular (alfa <= 0.3, WCAG 2.3.1 maks 3 flaş/sn).
 */
export function flas(alfa: number, ms = 100, renk = '#ffffff'): void {
  const ayar = ayarlariYukle();
  if (ayar.flas <= 0 || !Number.isFinite(alfa) || alfa <= 0) return;

  const olcekliAlfa = Math.min(MAKS_FLAS_ALFA, alfa) * (ayar.flas / 100);
  if (olcekliAlfa <= 0) return;

  const t = simdiMs();
  sonFlasZamanlari = sonFlasZamanlari.filter((z) => t - z < 1000);
  if (sonFlasZamanlari.length >= MAKS_FLAS_SANIYE) return;
  sonFlasZamanlari.push(t);

  if (!flasKatmani) return;
  aktifFlas = {
    alfa: olcekliAlfa,
    baslangic: t,
    sureMs: Math.max(40, Math.min(300, ms)),
    renk,
  };
  donguyuBaslat();
}

function hasarStiliHesapla(deger: number, tur?: HasarSayiTuru): { renk: string; boyutPx: number } {
  if (tur === 'blok') {
    return { renk: '#FFFFFF', boyutPx: 14 };
  }
  if (tur === 'mukemmel') {
    return { renk: '#6CC296', boyutPx: 20 };
  }
  if (tur === 'kazanc') {
    return { renk: '#6CC296', boyutPx: 16 };
  }
  if (tur === 'nakavt' || deger > 24) {
    return { renk: '#EF4444', boyutPx: 24 };
  }
  if (tur === 'agir' || deger >= 17) {
    return { renk: '#FB923C', boyutPx: 21 };
  }
  if (tur === 'orta' || deger >= 10) {
    return { renk: '#FDE047', boyutPx: 18 };
  }
  const boyut = Math.max(14, Math.min(16, 14 + Math.floor(Math.max(0, deger) / 5)));
  return { renk: '#FFFFFF', boyutPx: boyut };
}

/**
 * DOM havuzundan hasar sayısı (veya kazanım metni) çıkarır.
 * 600ms yukarı kayarak kaybolur; güce göre beyaz->sarı->turuncu->kırmızı (14->24px).
 */
export function hasarSayisi(
  x: number,
  y: number,
  deger: number | string,
  tur?: HasarSayiTuru
): void {
  if (!sahneKonteyneri || hasarHavuzu.length === 0) return;

  let slot = hasarHavuzu.find((h) => !h.aktif);
  if (!slot) {
    slot = hasarHavuzu.reduce((enEski, aday) =>
      aday.baslangic < enEski.baslangic ? aday : enEski
    );
  }

  const sayisalDeger =
    typeof deger === 'number'
      ? Math.abs(deger)
      : Number.parseInt(String(deger).replace(/[^0-9]/g, ''), 10) || 10;
  const { renk, boyutPx } = hasarStiliHesapla(sayisalDeger, tur);

  const metin =
    typeof deger === 'number'
      ? tur === 'kazanc'
        ? `+${Math.round(deger)}`
        : `-${Math.round(Math.abs(deger))}`
      : deger;

  const gen = sahneKonteyneri.clientWidth || 600;
  const yuk = sahneKonteyneri.clientHeight || 280;
  const guvenliX = Math.max(24, Math.min(gen - 64, x));
  const guvenliY = Math.max(28, Math.min(yuk - 30, y));

  slot.aktif = true;
  slot.baslangic = simdiMs();
  slot.sureMs = tur === 'kazanc' ? 800 : 600;
  slot.basX = guvenliX;
  slot.basY = guvenliY;
  slot.kaymaY = tur === 'kazanc' ? 42 : 36;
  slot.ofsetX = (Math.random() - 0.5) * 16;

  slot.el.textContent = metin;
  slot.el.style.color = renk;
  slot.el.style.fontSize = `${boyutPx}px`;
  slot.el.style.transform = `translate3d(${guvenliX.toFixed(1)}px, ${guvenliY.toFixed(1)}px, 0)`;
  slot.el.style.opacity = '1';

  donguyuBaslat();
}

/**
 * DOM havuzundan darbe parçacıkları fırlatır (mobilde max 50, masaüstünde max 150).
 */
export function parcacik(x: number, y: number, opts?: ParcacikOpts): void {
  const ayar = ayarlariYukle();
  if (ayar.parcacik <= 0 || !sahneKonteyneri || parcacikHavuzu.length === 0) return;

  const maks = mobilGorunumMu() ? PARCACIK_HAVUZ_MOBIL : PARCACIK_HAVUZ_MASAUSTU;
  const temelAdet = Math.max(1, Math.min(24, opts?.adet ?? 8));
  const adet = Math.max(1, Math.round(temelAdet * (ayar.parcacik / 100)));
  const renk = opts?.renk ?? '#D99B38';
  const boyut = Math.max(2, Math.min(8, opts?.boyutPx ?? 4));
  const hiz = Math.max(40, Math.min(320, opts?.hiz ?? 140));
  const sureMs = Math.max(140, Math.min(600, opts?.sureMs ?? 300));
  const t = simdiMs();

  let uretilen = 0;
  for (let i = 0; i < parcacikHavuzu.length && uretilen < adet && i < maks; i += 1) {
    const slot = parcacikHavuzu[i];
    if (slot.aktif) continue;

    const aci = (Math.PI * 2 * uretilen) / Math.max(1, adet) + (Math.random() - 0.5) * 0.5;
    const hizCarpan = 0.55 + Math.random() * 0.7;

    slot.aktif = true;
    slot.baslangic = t;
    slot.sureMs = sureMs;
    slot.basX = x;
    slot.basY = y;
    slot.vx = Math.cos(aci) * hiz * hizCarpan;
    slot.vy = Math.sin(aci) * hiz * hizCarpan - 45;

    slot.el.style.width = `${boyut}px`;
    slot.el.style.height = `${boyut}px`;
    slot.el.style.background = renk;
    slot.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    slot.el.style.opacity = '1';
    uretilen += 1;
  }

  if (uretilen > 0) {
    donguyuBaslat();
  }
}
