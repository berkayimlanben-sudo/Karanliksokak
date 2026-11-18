import React, { useEffect, useRef } from 'react';
import { HAMLE_LISTESI } from '../data/gameData';
import { DovuscuDurumu, DovusDurumu } from '../game/combat';
import {
  KEREM_BLOCK,
  KEREM_DODGE,
  KEREM_HIT,
  KEREM_IDLE_0,
  KEREM_IDLE_1,
  KEREM_KICK_0,
  KEREM_KICK_1,
  KEREM_KO,
  KEREM_PUNCH_0,
  KEREM_PUNCH_1,
  KEREM_PUNCH_2,
  keremPaletiOlustur,
  pikselSpriteCiz,
  PikselSprite,
} from '../game/pixelSprites';
import { TEMA } from '../game/theme';

const HAMLE_TURU_HARITASI = new Map(HAMLE_LISTESI.map((h) => [h.id, h.tur]));

interface ArenaCombatCanvasProps {
  dovusRef: React.RefObject<DovusDurumu>;
  className?: string;
}

function spriteSec(d: DovuscuDurumu, elapsed: number): { sprite: PikselSprite; ofsetX: number } {
  if (d.aksiyon === 'ko' || d.can <= 0) {
    return { sprite: KEREM_KO, ofsetX: -4 };
  }
  if (d.aksiyon === 'darbe_aldi') {
    return { sprite: KEREM_HIT, ofsetX: -3 };
  }
  if (d.aksiyon === 'blok') {
    return { sprite: KEREM_BLOCK, ofsetX: 0 };
  }
  if (d.aksiyon === 'kacinma') {
    return { sprite: KEREM_DODGE, ofsetX: -4 };
  }
  if (d.aksiyon === 'yumruk') {
    const oran = 1 - d.aksiyonKalanMs / Math.max(1, d.aksiyonToplamMs);
    if (oran < 0.28) return { sprite: KEREM_PUNCH_0, ofsetX: -1 };
    if (oran < 0.72) return { sprite: KEREM_PUNCH_1, ofsetX: 5 };
    return { sprite: KEREM_PUNCH_2, ofsetX: 2 };
  }
  if (d.aksiyon === 'tekme') {
    const oran = 1 - d.aksiyonKalanMs / Math.max(1, d.aksiyonToplamMs);
    if (oran < 0.35) return { sprite: KEREM_KICK_0, ofsetX: 2 };
    return { sprite: KEREM_KICK_1, ofsetX: 5 };
  }

  const idleKare = Math.floor(elapsed * 2.4) % 2 === 0;
  return { sprite: idleKare ? KEREM_IDLE_0 : KEREM_IDLE_1, ofsetX: 0 };
}

/**
 * ============================================================================
 * B AŞAMASI: GERÇEK ZAMANLI SOKAK ARENASI PIXEL ART TUVALİ
 * İki dövüşçüyü, sahne içi Can/Stamina barlarını, vuruş flaşlarını,
 * ekran sarsıntısını, yüzen hasar sayılarını ve KO yavaşlatmasını çizer.
 * ============================================================================
 */
export const ArenaCombatCanvas: React.FC<ArenaCombatCanvasProps> = ({
  dovusRef,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelCanvas = document.createElement('canvas');
    const pCtx = pixelCanvas.getContext('2d');
    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d');
    if (!pCtx || !bgCtx) return;

    let displayW = 640;
    let displayH = 300;
    let vw = 240;
    let vh = 112;
    let spriteOlcek = 2;
    let hudFont = '700 12px "JetBrains Mono", monospace';
    let badgeFont = '700 10px "JetBrains Mono", monospace';
    let dmgFont = '800 16px "JetBrains Mono", monospace';
    let koFont = '800 38px "Barlow Condensed", sans-serif';

    const arkaplanCiz = () => {
      bgCanvas.width = vw;
      bgCanvas.height = vh;
      bgCtx.imageSmoothingEnabled = false;

      const palet = TEMA.mekanlar.sokak_arena;
      const zeminY = vh - Math.max(18, Math.round(vh * 0.2));

      // Gece gökyüzü ve arka duvar
      bgCtx.fillStyle = palet.duvarUst;
      bgCtx.fillRect(0, 0, vw, Math.floor(zeminY * 0.48));
      bgCtx.fillStyle = palet.duvarAlt;
      bgCtx.fillRect(0, Math.floor(zeminY * 0.48), vw, zeminY - Math.floor(zeminY * 0.48));

      // Uzak apartman siluetleri ve pencereler
      bgCtx.fillStyle = '#070913';
      const binalar = [
        [0, 54, 34],
        [36, 42, 28],
        [68, 58, 38],
        [110, 44, 30],
        [144, 56, 40],
        [188, 46, 36],
        [228, 52, 46],
      ];
      for (const [bx, bh, bw] of binalar) {
        if (bx < vw) {
          bgCtx.fillRect(bx, zeminY - bh, bw, bh);
          bgCtx.fillStyle = '#1E243B';
          bgCtx.fillRect(bx, zeminY - bh, bw, 1);
          bgCtx.fillStyle = '#070913';
        }
      }

      bgCtx.fillStyle = 'rgba(217, 155, 56, 0.36)';
      bgCtx.fillRect(14, zeminY - 38, 3, 4);
      bgCtx.fillRect(80, zeminY - 44, 3, 4);
      bgCtx.fillRect(156, zeminY - 36, 3, 4);
      bgCtx.fillRect(198, zeminY - 32, 3, 4);

      // Tel örgü ve arka sokak seyirci siluetleri
      bgCtx.fillStyle = '#20263B';
      bgCtx.fillRect(0, zeminY - 22, vw, 1);
      for (let fx = 6; fx < vw; fx += 10) {
        bgCtx.fillRect(fx, zeminY - 22, 1, 22);
      }

      // Gölgedeki izleyici siluetleri
      const izleyiciler = [16, 34, vw - 44, vw - 26];
      for (const sx of izleyiciler) {
        bgCtx.fillStyle = '#0B0D16';
        bgCtx.fillRect(sx, zeminY - 19, 8, 19);
        bgCtx.fillRect(sx + 2, zeminY - 24, 5, 5);
      }

      // Sokak lambası ışık konisi (üst HUD süre sayacının altında, dövüşçülerin üstünde)
      const lambaX = Math.round(vw * 0.5);
      const lambaY = 26;
      bgCtx.fillStyle = '#141928';
      bgCtx.fillRect(0, lambaY - 1, vw, 1);
      bgCtx.fillRect(lambaX - 2, lambaY - 2, 4, 2);
      bgCtx.fillStyle = '#D99B38';
      bgCtx.fillRect(lambaX - 4, lambaY, 8, 2);
      bgCtx.fillStyle = 'rgba(217, 155, 56, 0.11)';
      for (let r = 0; r < Math.min(28, Math.floor((zeminY - (lambaY + 2)) / 2)); r += 2) {
        bgCtx.fillRect(lambaX - 5 - r, lambaY + 2 + r * 2, 10 + r * 2, 2);
      }

      // Asfalt zemin ve tebeşir arena çizgileri
      bgCtx.fillStyle = palet.zemin;
      bgCtx.fillRect(0, zeminY, vw, vh - zeminY);
      bgCtx.fillStyle = palet.zeminCizgi;
      bgCtx.fillRect(0, zeminY, vw, 1);
      bgCtx.fillStyle = 'rgba(234, 236, 239, 0.34)';
      bgCtx.fillRect(Math.round(vw * 0.2), zeminY + 5, Math.round(vw * 0.6), 1);
      bgCtx.fillRect(Math.round(vw * 0.16), zeminY + 11, Math.round(vw * 0.68), 1);
    };

    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let hazirCizim: (() => void) | null = null;

    const boyutGuncelle = () => {
      const rect = container.getBoundingClientRect();
      displayW = Math.max(280, Math.floor(rect.width));
      displayH = Math.max(150, Math.floor(rect.height));
      canvas.width = displayW;
      canvas.height = displayH;
      ctx.imageSmoothingEnabled = false;

      const pxOlcek = Math.max(1, Math.floor(Math.min(displayW / 240, displayH / 98)));
      vw = Math.max(210, Math.round(displayW / pxOlcek));
      vh = Math.max(92, Math.round(displayH / pxOlcek));
      spriteOlcek = vh >= 112 ? 3 : 2;

      pixelCanvas.width = vw;
      pixelCanvas.height = vh;
      pCtx.imageSmoothingEnabled = false;
      hudFont = `700 ${Math.max(11, Math.round(displayW * 0.019))}px "JetBrains Mono", monospace`;
      badgeFont = `700 ${Math.max(10, Math.round(displayW * 0.016))}px "JetBrains Mono", monospace`;
      dmgFont = `800 ${Math.max(13, Math.round(displayW * 0.025))}px "JetBrains Mono", monospace`;
      koFont = `800 ${Math.max(28, Math.round(displayW * 0.06))}px "Barlow Condensed", sans-serif`;
      arkaplanCiz();
      hazirCizim?.();
    };

    boyutGuncelle();
    const ro = new ResizeObserver(boyutGuncelle);
    ro.observe(container);

    const barCiz = (
      x: number,
      y: number,
      w: number,
      h: number,
      oran: number,
      renk: string
    ) => {
      pCtx.fillStyle = '#06080E';
      pCtx.fillRect(x - 1, y - 1, w + 2, h + 2);
      pCtx.fillStyle = '#171C2B';
      pCtx.fillRect(x, y, w, h);
      const dolu = Math.max(0, Math.min(w, Math.round(w * oran)));
      if (dolu > 0) {
        pCtx.fillStyle = renk;
        pCtx.fillRect(x, y, dolu, h);
      }
    };

    const sahneyiCiz = () => {
      const d = dovusRef.current;
      pCtx.drawImage(bgCanvas, 0, 0);

      if (d) {
        const zeminY = vh - Math.max(18, Math.round(vh * 0.2));
        const merkezX = Math.round(vw * 0.5);

        // 1. Dövüşçüleri çiz (yakın mesafe karşı karşıya)
        const oyuncuPoz = spriteSec(d.oyuncu, elapsed);
        const rakipPoz = spriteSec(d.rakip, elapsed + 0.35);

        const hazirlananTur = d.rakip.hazirlananHamleId
          ? HAMLE_TURU_HARITASI.get(d.rakip.hazirlananHamleId)
          : undefined;
        const telgrafAktif =
          d.durum === 'devam_ediyor' &&
          d.rakip.aksiyon === 'idle' &&
          d.rakip.otomatikSayacMs <= 550 &&
          (hazirlananTur === 'yumruk' || hazirlananTur === 'tekme');

        const oyuncuBaseX = merkezX - Math.round(20 * spriteOlcek);
        const rakipBaseX = merkezX + Math.round(4 * spriteOlcek);

        const oX = oyuncuBaseX + oyuncuPoz.ofsetX;
        const rX = rakipBaseX - rakipPoz.ofsetX + (telgrafAktif ? 2 : 0);
        const oY = zeminY + 4;
        const rY = zeminY + 4;

        // Zemin gölgeleri
        pCtx.fillStyle = 'rgba(0, 0, 0, 0.58)';
        pCtx.fillRect(oX + 2 * spriteOlcek, zeminY + 1, 13 * spriteOlcek, 3);
        pCtx.fillRect(rX + 2 * spriteOlcek, zeminY + 1, 13 * spriteOlcek, 3);

        // Rakip saldırı hazırlığı (telgraf) yumruk parıltısı
        if (telgrafAktif) {
          const pariltiParlak = Math.floor(d.rakip.otomatikSayacMs / 90) % 2 === 0;
          pCtx.fillStyle = pariltiParlak
            ? 'rgba(227, 74, 74, 0.38)'
            : 'rgba(217, 155, 56, 0.28)';
          pCtx.fillRect(rX - 2, zeminY - 17 * spriteOlcek, 4, 8 * spriteOlcek);
        }

        // Oyuncu sprite (sağa bakar)
        pikselSpriteCiz(
          pCtx,
          oyuncuPoz.sprite,
          keremPaletiOlustur(d.oyuncu.gorunum),
          oX,
          oY,
          spriteOlcek,
          false,
          d.oyuncu.darbeFlasMs > 0
        );

        // Rakip sprite (sola bakar)
        pikselSpriteCiz(
          pCtx,
          rakipPoz.sprite,
          keremPaletiOlustur(d.rakip.gorunum),
          rX,
          rY,
          spriteOlcek,
          true,
          d.rakip.darbeFlasMs > 0
        );

        // Rakip tepesinde pixel `!` saldırı telgrafı
        if (telgrafAktif) {
          const parlak = Math.floor(d.rakip.otomatikSayacMs / 85) % 2 === 0;
          const unlemX = rX + 7 * spriteOlcek;
          const unlemY = Math.max(25, zeminY - 24 * spriteOlcek - 11);
          pCtx.fillStyle = '#06080E';
          pCtx.fillRect(unlemX - 1, unlemY - 1, 4, 10);
          pCtx.fillStyle = parlak ? '#E34A4A' : '#D99B38';
          pCtx.fillRect(unlemX, unlemY, 2, 5);
          pCtx.fillRect(unlemX, unlemY + 6, 2, 2);
        }

        // Vuruş çarpma kıvılcımı
        if (d.rakip.darbeFlasMs > 0 || d.oyuncu.darbeFlasMs > 0) {
          const darbeX = d.rakip.darbeFlasMs > 0 ? rX + 4 * spriteOlcek : oX + 10 * spriteOlcek;
          const darbeY = zeminY - 14 * spriteOlcek;
          pCtx.fillStyle = '#EAECEF';
          pCtx.fillRect(darbeX - 4, darbeY, 8, 1);
          pCtx.fillRect(darbeX, darbeY - 4, 1, 8);
          pCtx.fillStyle = '#D99B38';
          pCtx.fillRect(darbeX - 3, darbeY - 3, 2, 2);
          pCtx.fillRect(darbeX + 2, darbeY + 2, 2, 2);
        }

        // Blok / Karşı Saldırı piksel kalkan çerçevesi
        if (d.oyuncu.blokKalanMs > 0) {
          pCtx.fillStyle =
            (d.oyuncu.mukemmelSavunmaKalanMs ?? 0) > 0
              ? 'rgba(108, 194, 150, 0.8)'
              : 'rgba(91, 130, 184, 0.55)';
          pCtx.fillRect(oX + 14 * spriteOlcek, zeminY - 18 * spriteOlcek, 2, 12 * spriteOlcek);
        }
        if (d.rakip.blokKalanMs > 0) {
          pCtx.fillStyle = 'rgba(91, 130, 184, 0.55)';
          pCtx.fillRect(rX - 2, zeminY - 18 * spriteOlcek, 2, 12 * spriteOlcek);
        }

        // 2. Sahne içi Can & Stamina barları (üst piksel HUD)
        const barGen = Math.max(54, Math.round(vw * 0.34));
        const solBarX = 8;
        const sagBarX = vw - barGen - 8;

        // Oyuncu (sol)
        barCiz(solBarX, 13, barGen, 4, d.oyuncu.can / Math.max(1, d.oyuncu.maksCan), '#D63838');
        barCiz(
          solBarX,
          19,
          barGen,
          2,
          d.oyuncu.stamina / Math.max(1, d.oyuncu.maksStamina),
          d.oyuncu.yavasladiMi ? '#E34A4A' : '#D99B38'
        );

        // Rakip (sağ)
        barCiz(sagBarX, 13, barGen, 4, d.rakip.can / Math.max(1, d.rakip.maksCan), '#D63838');
        barCiz(
          sagBarX,
          19,
          barGen,
          2,
          d.rakip.stamina / Math.max(1, d.rakip.maksStamina),
          d.rakip.yavasladiMi ? '#E34A4A' : '#D99B38'
        );

        // KO yavaşlatma karanlık vinyeti
        if (d.durum === 'ko_yavaslatma') {
          pCtx.fillStyle = 'rgba(11, 14, 23, 0.38)';
          pCtx.fillRect(0, 0, vw, vh);
        }
      }

      // Ekran sarsıntısı + ana tuvale aktarım
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displayW, displayH);

      let shakeX = 0;
      let shakeY = 0;
      if (d && d.ekranSarsintiMs > 0 && d.sarsintiSiddeti > 0) {
        const siddet = d.sarsintiSiddeti;
        shakeX = Math.round((Math.random() - 0.5) * 2 * siddet);
        shakeY = Math.round((Math.random() - 0.5) * 1.6 * siddet);
      }

      ctx.drawImage(pixelCanvas, shakeX, shakeY, displayW, displayH);

      // Keskin metin katmanı: isimler, süre, yüzen hasar sayıları, KO mührü
      if (d) {
        const olcekOran = displayW / vw;
        ctx.textBaseline = 'top';
        ctx.font = hudFont;

        // Sol oyuncu adı & can
        ctx.fillStyle = '#EAECEF';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${d.oyuncu.lakap.toUpperCase()} ${Math.ceil(d.oyuncu.can)}/${d.oyuncu.maksCan}`,
          Math.round(8 * olcekOran),
          Math.round(2 * olcekOran)
        );

        // Sağ rakip adı & can
        ctx.textAlign = 'right';
        ctx.fillText(
          `${Math.ceil(d.rakip.can)}/${d.rakip.maksCan} ${d.rakip.isim.toUpperCase()}`,
          displayW - Math.round(8 * olcekOran),
          Math.round(2 * olcekOran)
        );

        // Merkez kalan süre
        const kalanSn = Math.max(0, Math.ceil((d.maksSureMs - d.gecenSureMs) / 1000));
        ctx.textAlign = 'center';
        ctx.fillStyle = kalanSn <= 15 ? '#E34A4A' : '#D99B38';
        ctx.fillText(`${kalanSn}s`, displayW / 2, Math.round(10 * olcekOran));

        // Durum rozetleri (KARŞI SALDIRI / YAVAŞLADI)
        ctx.font = badgeFont;
        if (d.oyuncu.karsiSaldiriKalanMs > 0) {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#6CC296';
          ctx.fillText('KARŞI SALDIRI AÇIK!', Math.round(8 * olcekOran), Math.round(25 * olcekOran));
        } else if (d.oyuncu.yavasladiMi) {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#E34A4A';
          ctx.fillText('NEFESSİZ · YAVAŞ', Math.round(8 * olcekOran), Math.round(25 * olcekOran));
        }

        if (d.rakip.yavasladiMi) {
          ctx.textAlign = 'right';
          ctx.fillStyle = '#E34A4A';
          ctx.fillText('YAVAŞLADI', displayW - Math.round(8 * olcekOran), Math.round(25 * olcekOran));
        }

        // Yüzen hasar ve kaçınma sayıları
        const zeminEkranY = displayH * (1 - Math.max(18, Math.round(vh * 0.2)) / vh);
        ctx.textAlign = 'center';
        ctx.font = dmgFont;
        for (const s of d.yuzenSayilar) {
          const gecenOran = 1 - s.kalanMs / Math.max(1, s.toplamMs);
          const hedefX =
            (s.hedef === 'oyuncu' ? displayW * 0.41 : displayW * 0.59) + s.ofsetX * olcekOran;
          const hedefY =
            zeminEkranY -
            spriteOlcek * 22 * olcekOran +
            (s.ofsetY ?? 0) * olcekOran -
            gecenOran * (displayH * 0.16);
          ctx.globalAlpha = Math.max(0, Math.min(1, s.kalanMs / 250));
          ctx.fillStyle = '#06080E';
          ctx.fillText(s.metin, hedefX + 2, hedefY + 2);
          ctx.fillStyle = s.renk;
          ctx.fillText(s.metin, hedefX, hedefY);
        }
        ctx.globalAlpha = 1;

        // KO yavaşlatma yazısı
        if (d.durum === 'ko_yavaslatma') {
          ctx.font = koFont;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#06080E';
          ctx.fillText('NAKAVT!', displayW / 2 + 3, displayH * 0.34 + 3);
          ctx.fillStyle = d.kazanan === 'oyuncu' ? '#6CC296' : '#E34A4A';
          ctx.fillText('NAKAVT!', displayW / 2, displayH * 0.34);
        }
      }
    };

    hazirCizim = sahneyiCiz;

    const ciz = (now: number) => {
      if (document.hidden) {
        lastTime = now;
        rafId = requestAnimationFrame(ciz);
        return;
      }
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      lastTime = now;

      const d = dovusRef.current;
      const zamanCarpani = d?.durum === 'ko_yavaslatma' ? 0.25 : 1;
      if (!d || d.hitstopKalanMs <= 0) {
        elapsed += dt * zamanCarpani;
      }

      sahneyiCiz();

      if (d?.durum !== 'bitti') {
        rafId = requestAnimationFrame(ciz);
      }
    };

    rafId = requestAnimationFrame(ciz);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [dovusRef]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        data-testid="combat-canvas"
        style={{ imageRendering: 'pixelated' }}
        className="block w-full h-full"
        aria-label="Gerçek zamanlı sokak dövüşü sahnesi"
      />
    </div>
  );
};
