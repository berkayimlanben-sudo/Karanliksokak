/**
 * ============================================================================
 * TEK MERKEZLİ KARAKTER ÇİZİM BORU HATTI
 * Hem ArenaCombatCanvas hem NeighborhoodCanvas tarafından kullanılır.
 * Harici sprite atlasa kayıtlı karakterleri (şu an Kerem; ileride rakipler ve
 * mahalle NPC'leri) keskin piksel ölçeğiyle doğrudan ana tuvale (ctx) çizer;
 * henüz harici PNG'si olmayan karakterleri ise pCtx üzerindeki mevcut piksel
 * ızgarasına sorunsuz yönlendirir.
 * ============================================================================
 */

import { karakterKareCozumle, karakterPozHesapla } from './characterAnimator';
import { PikselPaleti, PikselSprite, pikselSpriteCiz } from './pixelSprites';
import {
  hariciSpriteCiz,
  hariciSpriteHataliMi,
  hariciSpriteHazirMi,
  HariciSpriteKaresi,
  hedefEkranOlcegiHesapla,
  SpriteAksiyonId,
} from './spriteAtlas';

export interface KarakterCizimPlanGirdisi {
  karakterId: string;
  aksiyon: SpriteAksiyonId;
  gecenSureSn: number;
  ilerlemeOrani?: number;
  reducedMotion?: boolean;
}

export interface KarakterCizimPlani {
  /** Harici atlas tanımlı ve görsel yükleme hatası yok -> eski piksel karaktere asla düşme. */
  hariciAktif: boolean;
  hazir: boolean;
  kare: HariciSpriteKaresi | null;
  hamPozMevcut: boolean;
}

export function karakterCizimPlaniHazirla({
  karakterId,
  aksiyon,
  gecenSureSn,
  ilerlemeOrani = 0,
  reducedMotion = false,
}: KarakterCizimPlanGirdisi): KarakterCizimPlani {
  const cozum = karakterKareCozumle({
    karakterId,
    aksiyon,
    gecenSureSn,
    ilerlemeOrani,
    reducedMotion,
  });

  if (!cozum.atlasVar || !cozum.kare) {
    return {
      hariciAktif: false,
      hazir: false,
      kare: null,
      hamPozMevcut: false,
    };
  }

  const hatali = hariciSpriteHataliMi(cozum.kare);
  if (hatali) {
    return {
      hariciAktif: false,
      hazir: false,
      kare: cozum.kare,
      hamPozMevcut: false,
    };
  }

  const hazir = hariciSpriteHazirMi(cozum.kare) !== null;
  return {
    hariciAktif: true,
    hazir,
    kare: cozum.kare,
    hamPozMevcut: cozum.hamPozMevcut,
  };
}

export interface EskiKarakterKatmanGirdisi {
  pCtx: CanvasRenderingContext2D;
  sprite: PikselSprite;
  palet: PikselPaleti;
  x: number;
  y: number;
  spriteOlcek: number;
  tersCevir?: boolean;
  beyazFlas?: boolean;
  golgeCiz?: boolean;
  golgeY?: number;
  golgeAlfa?: number;
}

export function karakterEskiPikselKatmaniCiz({
  pCtx,
  sprite,
  palet,
  x,
  y,
  spriteOlcek,
  tersCevir = false,
  beyazFlas = false,
  golgeCiz = true,
  golgeY,
  golgeAlfa = 0.56,
}: EskiKarakterKatmanGirdisi): void {
  if (golgeCiz && golgeY !== undefined) {
    pCtx.fillStyle = `rgba(0, 0, 0, ${golgeAlfa})`;
    pCtx.fillRect(x + 2 * spriteOlcek, golgeY, 13 * spriteOlcek, 3);
  }
  pikselSpriteCiz(pCtx, sprite, palet, x, y, spriteOlcek, tersCevir, beyazFlas);
}

export interface HariciKarakterKatmanGirdisi {
  ctx: CanvasRenderingContext2D;
  plan: KarakterCizimPlani;
  aksiyon: SpriteAksiyonId;
  ilerlemeOrani: number;
  gecenSureSn: number;
  merkezEkranX: number;
  zeminEkranY: number;
  hedefBoyPx: number;
  maksBoyPx: number;
  olcekX: number;
  olcekY: number;
  ekstraOfsetX?: number;
  ekstraOfsetY?: number;
  ekstraEgimRadyan?: number;
  tersCevir?: boolean;
  beyazFlas?: boolean;
  golgeAlfa?: number;
  reducedMotion?: boolean;
  blokAktif?: boolean;
  mukemmelBlok?: boolean;
  vurusEfektRengi?: string;
  saldiriIziCiz?: boolean;
  darbeKivilcimiCiz?: boolean;
}

export function karakterHariciKatmaniCiz({
  ctx,
  plan,
  aksiyon,
  ilerlemeOrani,
  gecenSureSn,
  merkezEkranX,
  zeminEkranY,
  hedefBoyPx,
  maksBoyPx,
  olcekX,
  olcekY,
  ekstraOfsetX = 0,
  ekstraOfsetY = 0,
  ekstraEgimRadyan = 0,
  tersCevir = false,
  beyazFlas = false,
  golgeAlfa = 0.56,
  reducedMotion = false,
  blokAktif = false,
  mukemmelBlok = false,
  vurusEfektRengi = '#D99B38',
  saldiriIziCiz = true,
  darbeKivilcimiCiz = true,
}: HariciKarakterKatmanGirdisi): boolean {
  if (!plan.hariciAktif || !plan.hazir || !plan.kare) return false;

  const kare = plan.kare;
  const ekranOlcegi = hedefEkranOlcegiHesapla(hedefBoyPx, kare.icerikYuksekligi, maksBoyPx);
  const poz = karakterPozHesapla({
    aksiyon,
    ilerlemeOrani,
    gecenSureSn,
    olcekX,
    olcekY,
    ekranOlcegi,
    tersCevir,
    hamPozMevcut: plan.hamPozMevcut,
    reducedMotion,
  });

  const yon = tersCevir ? -1 : 1;

  if (poz.hayaletIziGoster) {
    const izSayisi = Math.max(1, poz.hayaletIziSayisi || 1);
    for (let i = izSayisi; i >= 1; i -= 1) {
      const ghostOfsetX =
        ekstraOfsetX + (poz.hayaletIziPhantom ? (i - 1) * yon * Math.round(4 * ekranOlcegi) : 0);
      hariciSpriteCiz(ctx, kare, {
        merkezEkranX,
        zeminEkranY,
        ekranOlcegi,
        tersCevir,
        ekstraOfsetX: ghostOfsetX,
        ekstraOfsetY,
        alfa: poz.hayaletIziPhantom ? 0.22 + (izSayisi - i) * 0.14 : 0.3,
        golgeCiz: false,
      });
    }
  }

  const toplamOfsetX = ekstraOfsetX + poz.ekstraOfsetX;
  const toplamOfsetY = ekstraOfsetY + poz.ekstraOfsetY;

  const cizildi = hariciSpriteCiz(ctx, kare, {
    merkezEkranX,
    zeminEkranY,
    ekranOlcegi,
    tersCevir,
    ekstraOfsetX: toplamOfsetX,
    ekstraOfsetY: toplamOfsetY,
    egimRadyan: poz.egimRadyan + ekstraEgimRadyan,
    olcekXCarpan: poz.olcekXCarpan,
    olcekYCarpan: poz.olcekYCarpan,
    alfa: poz.alfa,
    beyazFlas,
    golgeAlfa,
    golgeGenislikCarpan: poz.golgeGenislikCarpan,
    golgeOfsetX: poz.golgeOfsetX,
  });

  if (!cizildi) return false;

  const px = Math.max(2, Math.round(olcekX));
  const onX = merkezEkranX + toplamOfsetX + yon * Math.round(10 * ekranOlcegi);
  const gogusY = zeminEkranY + toplamOfsetY - Math.round(28 * ekranOlcegi);

  if (saldiriIziCiz && !reducedMotion) {
    const iz = poz.aktifSaldiriIzi;
    if (iz === 'punch') {
      ctx.fillStyle = '#EAECEF';
      ctx.fillRect(tersCevir ? onX - 7 * px : onX, gogusY, 7 * px, px);
      ctx.fillStyle = vurusEfektRengi;
      ctx.fillRect(tersCevir ? onX - 3 * px : onX - 2 * px, gogusY - 2 * px, 5 * px, px);
      ctx.fillRect(tersCevir ? onX - 5 * px : onX - px, gogusY + 2 * px, 6 * px, px);
    } else if (iz === 'punch_heavy') {
      ctx.fillStyle = '#FB923C';
      ctx.fillRect(tersCevir ? onX - 10 * px : onX, gogusY - 2 * px, 10 * px, 2 * px);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(tersCevir ? onX - 8 * px : onX + px, gogusY, 8 * px, px);
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(tersCevir ? onX - 6 * px : onX, gogusY + 2 * px, 7 * px, px);
    } else if (iz === 'punch_hook') {
      // Kavisli kroşe izi
      const hookX = tersCevir ? onX - 4 * px : onX + 2 * px;
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(hookX - yon * 3 * px, gogusY - 5 * px, 4 * px, px);
      ctx.fillRect(hookX, gogusY - 3 * px, 2 * px, 6 * px);
      ctx.fillRect(hookX - yon * 3 * px, gogusY + 4 * px, 4 * px, px);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(hookX + yon * px, gogusY - 2 * px, px, 4 * px);
    } else if (iz === 'punch_uppercut') {
      // Yukarı fırlayan dikey aparkat şimşeği
      const upX = merkezEkranX + toplamOfsetX + yon * Math.round(13 * ekranOlcegi);
      const upY = zeminEkranY + toplamOfsetY - Math.round(42 * ekranOlcegi);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(upX, upY, 2 * px, 14 * px);
      ctx.fillStyle = '#FEF9C3';
      ctx.fillRect(upX + (tersCevir ? px : 0), upY - 2 * px, px, 11 * px);
    } else if (iz === 'punch_body') {
      // Kaburga hizası kısa sert vuruş izi
      const vucutY = zeminEkranY + toplamOfsetY - Math.round(20 * ekranOlcegi);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(tersCevir ? onX - 7 * px : onX, vucutY, 7 * px, px);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(tersCevir ? onX - 5 * px : onX + px, vucutY + 2 * px, 5 * px, px);
    } else if (iz === 'punch_counter') {
      // Hızlı mavi/buz beyazı kontra hız çizgisi
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(tersCevir ? onX - 10 * px : onX, gogusY - px, 10 * px, px);
      ctx.fillStyle = '#EAECEF';
      ctx.fillRect(tersCevir ? onX - 8 * px : onX + 2 * px, gogusY + px, 8 * px, px);
    } else if (iz === 'kick') {
      const tekmeY = zeminEkranY + toplamOfsetY - Math.round(22 * ekranOlcegi);
      ctx.fillStyle = '#EAECEF';
      ctx.fillRect(tersCevir ? onX - 7 * px : onX - px, tekmeY, 8 * px, px);
      ctx.fillStyle = '#D63838';
      ctx.fillRect(tersCevir ? onX - 7 * px : onX + px, tekmeY - 2 * px, 6 * px, px);
      ctx.fillRect(tersCevir ? onX - 5 * px : onX, tekmeY + 2 * px, 5 * px, px);
    } else if (iz === 'kick_low') {
      // Bilek/diz hizası alçak süpürme çizgisi
      const alcakY = zeminEkranY + toplamOfsetY - Math.round(10 * ekranOlcegi);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(tersCevir ? onX - 8 * px : onX, alcakY, 8 * px, px);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(tersCevir ? onX - 6 * px : onX + px, alcakY - 2 * px, 5 * px, px);
    } else if (iz === 'kick_knee') {
      // Yakın mesafe yukarı/ileri diz darbesi patlaması
      const dizX = merkezEkranX + toplamOfsetX + yon * Math.round(11 * ekranOlcegi);
      const dizY = zeminEkranY + toplamOfsetY - Math.round(21 * ekranOlcegi);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(dizX - 2 * px, dizY - 3 * px, 4 * px, px);
      ctx.fillRect(dizX - px, dizY - px, 3 * px, 4 * px);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(dizX + yon * 2 * px, dizY - 2 * px, 2 * px, 3 * px);
    } else if (iz === 'kick_spin') {
      // Geniş altın + kızıl döner tekme yayı
      const donerX = merkezEkranX + toplamOfsetX + yon * Math.round(11 * ekranOlcegi);
      const donerY = zeminEkranY + toplamOfsetY - Math.round(28 * ekranOlcegi);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(donerX - yon * 2 * px, donerY - 4 * px, 8 * px, 2 * px);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(donerX, donerY, 9 * px, px);
      ctx.fillStyle = '#EAECEF';
      ctx.fillRect(donerX - yon * px, donerY + 3 * px, 7 * px, px);
    }
  }

  if (blokAktif) {
    const celikGardMi = aksiyon === 'block_steel';
    const kalkanX = merkezEkranX + toplamOfsetX + yon * Math.round(11 * ekranOlcegi);
    const kalkanY = zeminEkranY - Math.round(36 * ekranOlcegi);
    const kalkanBoy = Math.round(26 * ekranOlcegi);
    ctx.fillStyle = mukemmelBlok
      ? 'rgba(108, 194, 150, 0.9)'
      : celikGardMi
        ? 'rgba(147, 197, 253, 0.85)'
        : 'rgba(91, 130, 184, 0.65)';
    ctx.fillRect(kalkanX, kalkanY, Math.max(3, 2 * px), kalkanBoy);
    if (celikGardMi) {
      ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
      ctx.fillRect(kalkanX + yon * Math.max(3, 2 * px), kalkanY + 3, Math.max(2, px), kalkanBoy - 6);
    }
  }

  if (darbeKivilcimiCiz && beyazFlas) {
    const darbeEkranX = merkezEkranX + toplamOfsetX + yon * Math.round(6 * ekranOlcegi);
    ctx.fillStyle = '#EAECEF';
    ctx.fillRect(darbeEkranX - 4 * px, gogusY, 8 * px, px);
    ctx.fillRect(darbeEkranX, gogusY - 4 * px, px, 8 * px);
    ctx.fillStyle = '#D99B38';
    ctx.fillRect(darbeEkranX - 3 * px, gogusY - 3 * px, 2 * px, 2 * px);
    ctx.fillRect(darbeEkranX + 2 * px, gogusY + 2 * px, 2 * px, 2 * px);
  }

  return true;
}
