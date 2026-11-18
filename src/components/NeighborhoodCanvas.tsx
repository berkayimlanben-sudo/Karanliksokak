import React, { useEffect, useRef } from 'react';
import { ANTRENOR_LISTESI, StatId } from '../data/gameData';
import {
  AGIRLIK_SETI_SPRITE,
  AILE_PALETI,
  BUZDOLABI_SPRITE,
  ELIF_IDLE_0,
  ELIF_IDLE_1,
  EMINE_IDLE_0,
  EMINE_IDLE_1,
  ESYA_PALETI,
  ISITICI_SPRITE,
  KEREM_IDLE_0,
  KEREM_IDLE_1,
  KEREM_PUNCH_0,
  KEREM_PUNCH_1,
  KEREM_PUNCH_2,
  KEREM_WALK_0,
  KEREM_WALK_1,
  KEREM_WALK_2,
  KUM_TORBASI_SPRITE,
  keremPaletiOlustur,
  pikselSpriteCiz,
  YATAK_SPRITE,
} from '../game/pixelSprites';
import { KarakterGorunumu, MekanId, TEMA } from '../game/theme';

const AKSIYON_SURESI = 1.25; // Vuruş / çalışma animasyon süresi (saniye)
const YOLCULUK_SURESI = 0.85; // Mekan değişiminde yürüme ve geçiş süresi (saniye)

interface NeighborhoodCanvasProps {
  mekanId: MekanId;
  gorunum: KarakterGorunumu;
  yorgunluk: number;
  moral: number;
  saatDakika?: number;
  evSeviyesi?: number;
  evEsyalari?: string[];
  aksiyonDarbesi: number;
  aksiyonTuru?: StatId;
  karakterKonumX?: number;
  className?: string;
}

/**
 * ============================================================================
 * PIXEL ART SAHNE VE KARAKTER ÇİZİCİSİ
 * Dış görsel dosyası olmadan tüm mekanları, ev eşyalarını, aile üyelerini ve
 * Kerem'in bekleme / yürüme / vuruş sprite karelerini 1:1 kare piksellerle çizer.
 * ============================================================================
 */
export const NeighborhoodCanvas: React.FC<NeighborhoodCanvasProps> = ({
  mekanId,
  gorunum,
  yorgunluk,
  moral,
  saatDakika = 480,
  evSeviyesi = 0,
  evEsyalari = [],
  aksiyonDarbesi,
  aksiyonTuru = 'guc',
  karakterKonumX = 0.45,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const esyaAnahtari = evEsyalari.join(',');

  const stateRef = useRef({
    mekanId,
    gorunum,
    yorgunluk,
    moral,
    saatDakika,
    evSeviyesi,
    evEsyalari,
    esyaAnahtari,
    karakterKonumX,
    aksiyonSuresi: 0,
    aksiyonTuru,
    sonDarbeId: aksiyonDarbesi,
    yolculukSuresi: 0,
    oncekiMekan: mekanId,
    yenidenCiz: true,
  });
  const tekCizimRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const yeniDarbe = aksiyonDarbesi !== stateRef.current.sonDarbeId;
    const mekanDegisti = mekanId !== stateRef.current.oncekiMekan;

    stateRef.current = {
      mekanId,
      gorunum,
      yorgunluk,
      moral,
      saatDakika,
      evSeviyesi,
      evEsyalari,
      esyaAnahtari,
      karakterKonumX,
      aksiyonSuresi: yeniDarbe ? AKSIYON_SURESI : stateRef.current.aksiyonSuresi,
      aksiyonTuru: yeniDarbe ? aksiyonTuru : stateRef.current.aksiyonTuru,
      sonDarbeId: aksiyonDarbesi,
      yolculukSuresi: mekanDegisti ? YOLCULUK_SURESI : stateRef.current.yolculukSuresi,
      oncekiMekan: mekanId,
      yenidenCiz: true,
    };
    tekCizimRef.current?.();
  }, [
    mekanId,
    gorunum,
    yorgunluk,
    moral,
    saatDakika,
    evSeviyesi,
    evEsyalari,
    esyaAnahtari,
    aksiyonDarbesi,
    aksiyonTuru,
    karakterKonumX,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pixelCanvas = document.createElement('canvas');
    const pCtx = pixelCanvas.getContext('2d');
    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d');
    if (!pCtx || !bgCtx) return;

    let displayW = 660;
    let displayH = 380;
    let vw = 220;
    let vh = 126;
    let spriteOlcek = 2;
    let cachedKey = '';

    const zeminYHesa = () => Math.max(64, vh - Math.max(14, Math.round(vh * 0.16)));

    const zerrecikler = Array.from({ length: 14 }, (_, i) => ({
      x: (i * 19) % 100,
      y: 12 + ((i * 11) % 58),
      hiz: 3 + (i % 3) * 2,
      faz: i * 0.8,
    }));

    const arkaplanCiz = (
      mId: MekanId,
      saat: number,
      evSv: number,
      esyalar: string[],
      key: string
    ) => {
      bgCanvas.width = vw;
      bgCanvas.height = vh;
      bgCtx.imageSmoothingEnabled = false;
      cachedKey = key;

      const zeminY = zeminYHesa();
      const palet = TEMA.mekanlar[mId] ?? TEMA.mekanlar.ev;
      const geceMi = saat >= 1200 || saat < 360;
      const aksamMi = saat >= 1020 && saat < 1200;

      // 1. Duvar / gökyüzü üst & alt katmanları
      bgCtx.fillStyle = palet.duvarUst;
      bgCtx.fillRect(0, 0, vw, Math.floor(zeminY * 0.45));
      bgCtx.fillStyle = palet.duvarAlt;
      bgCtx.fillRect(0, Math.floor(zeminY * 0.45), vw, zeminY - Math.floor(zeminY * 0.45));

      if (mId === 'ev') {
        // Duvar kağıdı dikey şerit dokusu
        bgCtx.fillStyle = palet.arkaPlanDetay;
        for (let x = 8; x < vw; x += 14) {
          bgCtx.fillRect(x, 0, 1, zeminY - 4);
        }
        // Süpürgelik
        bgCtx.fillStyle = '#0B0E17';
        bgCtx.fillRect(0, zeminY - 4, vw, 4);

        // Pencere (saat dilimine göre dış gökyüzü)
        const winSize = Math.round(20 * (spriteOlcek / 2));
        const winX = Math.round(vw * 0.44);
        const winY = Math.max(8, Math.round(zeminY * 0.16));
        bgCtx.fillStyle = '#080B12';
        bgCtx.fillRect(winX - 2, winY - 2, winSize + 4, winSize + 4);
        bgCtx.fillStyle = geceMi ? '#0D1326' : aksamMi ? '#2C2645' : '#24354F';
        bgCtx.fillRect(winX, winY, winSize, winSize);
        // Pencereden uzak çatı silueti
        bgCtx.fillStyle = '#070A12';
        bgCtx.fillRect(winX, winY + Math.round(winSize * 0.6), Math.round(winSize * 0.45), Math.round(winSize * 0.4));
        bgCtx.fillRect(winX + Math.round(winSize * 0.52), winY + Math.round(winSize * 0.45), Math.round(winSize * 0.48), Math.round(winSize * 0.55));
        // Pencere çerçeve artısı
        bgCtx.fillStyle = '#181E2E';
        bgCtx.fillRect(winX + Math.floor(winSize / 2) - 1, winY, 2, winSize);
        bgCtx.fillRect(winX, winY + Math.floor(winSize / 2) - 1, winSize, 2);

        // Ev seviyesine göre oda detayı
        if (evSv === 0) {
          bgCtx.fillStyle = '#0E121E';
          bgCtx.fillRect(10, winY + 6, 1, 9);
          bgCtx.fillRect(11, winY + 10, 3, 1);
          bgCtx.fillRect(vw - 26, winY + 2, 1, 10);
        } else if (evSv === 1) {
          bgCtx.fillStyle = '#12151E';
          bgCtx.fillRect(vw - 20, 0, 3, zeminY - 24);
          bgCtx.fillRect(vw - 24, zeminY - 24, 11, 18);
          bgCtx.fillStyle = '#D99B38';
          bgCtx.fillRect(vw - 21, zeminY - 14, 5, 3);
        } else {
          bgCtx.fillStyle = '#3B4866';
          bgCtx.fillRect(winX - 2, winY - 2, 4, winSize + 4);
          bgCtx.fillRect(winX + winSize - 2, winY - 2, 4, winSize + 4);
          bgCtx.fillStyle = '#9BA3B5';
          bgCtx.fillRect(winX + 1, winY + winSize + 4, winSize - 2, 8);
        }

        // Tavandan sarkan ampul ve sıcak ışık üçgeni
        const lambaX = Math.round(vw * 0.5);
        bgCtx.fillStyle = '#080A10';
        bgCtx.fillRect(lambaX, 0, 1, 7);
        bgCtx.fillStyle = '#D99B38';
        bgCtx.fillRect(lambaX - 1, 7, 3, 2);
        bgCtx.fillStyle = 'rgba(217, 155, 56, 0.13)';
        for (let r = 0; r < Math.min(28, Math.floor((zeminY - 12) / 2)); r += 2) {
          bgCtx.fillRect(lambaX - 3 - r, 9 + r * 2, 7 + r * 2, 2);
        }

        // Buzdolabı (sol duvar) ve Yatak (sağ duvar)
        const dolapX = 6;
        pikselSpriteCiz(bgCtx, BUZDOLABI_SPRITE, ESYA_PALETI, dolapX, zeminY, spriteOlcek);

        const yatakGenislik = YATAK_SPRITE.genislik * spriteOlcek;
        const yatakX = vw - yatakGenislik - 6;
        pikselSpriteCiz(bgCtx, YATAK_SPRITE, ESYA_PALETI, yatakX, zeminY - 2, spriteOlcek);

        if (esyalar.includes('yatak_ortopedik')) {
          bgCtx.fillStyle = '#D8D3CA';
          bgCtx.fillRect(
            yatakX + 4 * spriteOlcek,
            zeminY - 2 - 9 * spriteOlcek,
            6 * spriteOlcek,
            2 * spriteOlcek
          );
        }
        if (esyalar.includes('kum_torbasi')) {
          const torbaX = Math.round(vw * 0.31);
          const bagTop = zeminY - 24 * spriteOlcek - 5 * spriteOlcek;
          bgCtx.fillStyle = '#3B455C';
          bgCtx.fillRect(torbaX + 4 * spriteOlcek, 0, spriteOlcek, Math.max(4, bagTop + 4));
          pikselSpriteCiz(
            bgCtx,
            KUM_TORBASI_SPRITE,
            ESYA_PALETI,
            torbaX,
            zeminY - 5 * spriteOlcek,
            spriteOlcek
          );
        }
        if (esyalar.includes('agirlik_seti')) {
          pikselSpriteCiz(
            bgCtx,
            AGIRLIK_SETI_SPRITE,
            ESYA_PALETI,
            Math.round(vw * 0.56),
            zeminY - 1,
            spriteOlcek
          );
        }
        if (esyalar.includes('elektrikli_isitici')) {
          pikselSpriteCiz(
            bgCtx,
            ISITICI_SPRITE,
            ESYA_PALETI,
            vw - 11 * spriteOlcek,
            zeminY + 5,
            spriteOlcek
          );
        }
      } else if (mId === 'spor_salonu') {
        bgCtx.fillStyle = palet.arkaPlanDetay;
        for (let y = 8; y < zeminY; y += 6) {
          const ofset = (y / 6) % 2 === 0 ? 0 : 6;
          for (let x = ofset; x < vw; x += 12) {
            bgCtx.fillRect(x, y, 10, 4);
          }
        }
        // Arka planda boks ringi köşe direkleri ve halatları
        const halatBaz = zeminY - 34 * (spriteOlcek / 2);
        bgCtx.fillStyle = '#0F0A0A';
        bgCtx.fillRect(10, Math.max(12, halatBaz - 8), 3, zeminY - Math.max(12, halatBaz - 8));
        bgCtx.fillRect(vw - 14, Math.max(12, halatBaz - 8), 3, zeminY - Math.max(12, halatBaz - 8));
        bgCtx.fillStyle = '#8F332B';
        bgCtx.fillRect(13, halatBaz, vw - 27, 2);
        bgCtx.fillStyle = '#A86232';
        bgCtx.fillRect(13, halatBaz + 9, vw - 27, 2);
        bgCtx.fillRect(13, halatBaz + 18, vw - 27, 2);

        for (const lx of [Math.round(vw * 0.28), Math.round(vw * 0.72)]) {
          bgCtx.fillStyle = '#080607';
          bgCtx.fillRect(lx, 0, 1, 8);
          bgCtx.fillRect(lx - 4, 8, 9, 3);
          bgCtx.fillStyle = '#E58238';
          bgCtx.fillRect(lx - 2, 11, 5, 2);
          bgCtx.fillStyle = 'rgba(229, 130, 56, 0.12)';
          for (let r = 0; r < 24; r += 2) {
            bgCtx.fillRect(lx - 4 - r, 13 + r * 2, 9 + r * 2, 2);
          }
        }

        const bagX = Math.round(vw * 0.66);
        bgCtx.fillStyle = '#2B1B17';
        bgCtx.fillRect(bagX + 4 * spriteOlcek, 0, spriteOlcek, Math.max(4, zeminY - 24 * spriteOlcek));
        pikselSpriteCiz(
          bgCtx,
          KUM_TORBASI_SPRITE,
          ESYA_PALETI,
          bagX,
          zeminY - 4 * spriteOlcek,
          spriteOlcek
        );
        pikselSpriteCiz(
          bgCtx,
          AGIRLIK_SETI_SPRITE,
          ESYA_PALETI,
          Math.round(vw * 0.12),
          zeminY,
          spriteOlcek
        );
      } else if (mId === 'market') {
        bgCtx.fillStyle = '#0F1E1B';
        for (let y = 10; y < zeminY; y += 8) {
          bgCtx.fillRect(0, y, vw, 1);
        }
        for (const fx of [Math.round(vw * 0.25), Math.round(vw * 0.68)]) {
          bgCtx.fillStyle = '#A6E6C6';
          bgCtx.fillRect(fx - 14, 4, 28, 2);
          bgCtx.fillStyle = 'rgba(108, 194, 150, 0.11)';
          bgCtx.fillRect(fx - 20, 6, 40, zeminY - 8);
        }

        const coolerX = 10;
        const coolerTop = Math.max(12, zeminY - 48);
        bgCtx.fillStyle = '#091210';
        bgCtx.fillRect(coolerX, coolerTop, 36, zeminY - coolerTop);
        bgCtx.fillStyle = '#1E453D';
        bgCtx.fillRect(coolerX + 2, coolerTop + 2, 32, zeminY - coolerTop - 4);
        for (let ry = coolerTop + 8; ry < zeminY - 6; ry += 11) {
          bgCtx.fillStyle = '#6CC296';
          bgCtx.fillRect(coolerX + 4, ry, 28, 2);
          bgCtx.fillStyle = '#A6D6BD';
          for (let bx = coolerX + 6; bx < coolerX + 30; bx += 5) {
            bgCtx.fillRect(bx, ry - 5, 3, 5);
          }
        }

        const shelfX = Math.round(vw * 0.44);
        const shelfTop = Math.max(18, zeminY - 38);
        bgCtx.fillStyle = '#1B2E2A';
        bgCtx.fillRect(shelfX, shelfTop, 42, zeminY - shelfTop);
        for (let ry = shelfTop + 8; ry < zeminY - 6; ry += 10) {
          bgCtx.fillStyle = '#2B4741';
          bgCtx.fillRect(shelfX + 2, ry, 38, 2);
          bgCtx.fillStyle = '#D99B38';
          bgCtx.fillRect(shelfX + 4, ry - 4, 6, 4);
          bgCtx.fillStyle = '#D63838';
          bgCtx.fillRect(shelfX + 14, ry - 4, 5, 4);
          bgCtx.fillStyle = '#6CC296';
          bgCtx.fillRect(shelfX + 24, ry - 5, 7, 5);
        }

        const kasaX = vw - 44;
        bgCtx.fillStyle = '#13221F';
        bgCtx.fillRect(kasaX, zeminY - 22, 36, 22);
        bgCtx.fillStyle = '#29453F';
        bgCtx.fillRect(kasaX - 2, zeminY - 24, 40, 3);
        bgCtx.fillStyle = '#4B635E';
        bgCtx.fillRect(kasaX + 12, zeminY - 30, 12, 6);
      } else if (mId === 'is_yeri') {
        bgCtx.fillStyle = '#19202E';
        for (let y = 12; y < zeminY; y += 5) {
          bgCtx.fillRect(Math.round(vw * 0.24), y, Math.round(vw * 0.5), 3);
        }
        bgCtx.fillStyle = '#0C1018';
        bgCtx.fillRect(Math.round(vw * 0.21), 0, 5, zeminY);
        bgCtx.fillRect(Math.round(vw * 0.74), 0, 5, zeminY);

        const sLampX = Math.round(vw * 0.5);
        bgCtx.fillStyle = '#D99B38';
        bgCtx.fillRect(sLampX - 6, 4, 12, 3);
        bgCtx.fillStyle = 'rgba(217, 155, 56, 0.13)';
        for (let r = 0; r < 26; r += 2) {
          bgCtx.fillRect(sLampX - 6 - r, 8 + r * 2, 13 + r * 2, 2);
        }

        const drawCrate = (cx: number, cy: number, size: number) => {
          bgCtx.fillStyle = '#06080E';
          bgCtx.fillRect(cx, cy, size, size);
          bgCtx.fillStyle = '#5A3B28';
          bgCtx.fillRect(cx + 1, cy + 1, size - 2, size - 2);
          bgCtx.fillStyle = '#3B2518';
          bgCtx.fillRect(cx + 3, cy + 3, size - 6, size - 6);
          bgCtx.fillStyle = '#5A3B28';
          bgCtx.fillRect(cx + 3, cy + Math.floor(size / 2), size - 6, 2);
        };
        drawCrate(10, zeminY - 20, 20);
        drawCrate(31, zeminY - 20, 20);
        drawCrate(19, zeminY - 40, 20);
        drawCrate(vw - 34, zeminY - 22, 22);
        drawCrate(vw - 56, zeminY - 16, 16);
      } else {
        // sokak_arena
        bgCtx.fillStyle = '#070913';
        const binalar = [
          [0, 44, 28],
          [30, 32, 24],
          [56, 48, 32],
          [92, 36, 26],
          [122, 46, 34],
          [160, 38, 42],
          [206, 44, 48],
        ];
        for (const [bx, bh, bw] of binalar) {
          if (bx < vw) {
            bgCtx.fillRect(bx, zeminY - bh, bw, bh);
            bgCtx.fillStyle = '#20263B';
            bgCtx.fillRect(bx, zeminY - bh, bw, 1);
            bgCtx.fillStyle = '#070913';
          }
        }
        bgCtx.fillStyle = 'rgba(217, 155, 56, 0.38)';
        bgCtx.fillRect(10, zeminY - 30, 3, 4);
        bgCtx.fillRect(66, zeminY - 36, 3, 4);
        bgCtx.fillRect(74, zeminY - 24, 3, 4);
        bgCtx.fillRect(134, zeminY - 32, 3, 4);

        bgCtx.fillStyle = '#252B42';
        bgCtx.fillRect(0, zeminY - 20, vw, 1);
        for (let fx = 6; fx < vw; fx += 10) {
          bgCtx.fillRect(fx, zeminY - 20, 1, 20);
        }

        const dirX = Math.round(vw * 0.77);
        const dirTop = Math.max(8, zeminY - 62);
        bgCtx.fillStyle = '#181E30';
        bgCtx.fillRect(dirX, dirTop, 3, zeminY - dirTop);
        bgCtx.fillRect(dirX - 14, dirTop, 16, 2);
        bgCtx.fillStyle = '#D99B38';
        bgCtx.fillRect(dirX - 13, dirTop + 2, 6, 2);
        bgCtx.fillStyle = 'rgba(217, 155, 56, 0.14)';
        for (let r = 0; r < 24; r += 2) {
          bgCtx.fillRect(dirX - 14 - r, dirTop + 4 + r * 2, 8 + r * 2, 2);
        }

        bgCtx.fillStyle = '#D63838';
        bgCtx.fillRect(18, zeminY - 30, 14, 4);
      }

      // Ortak zemin dokusu
      bgCtx.fillStyle = palet.zemin;
      bgCtx.fillRect(0, zeminY, vw, vh - zeminY);
      bgCtx.fillStyle = palet.zeminCizgi;
      bgCtx.fillRect(0, zeminY, vw, 1);
      for (let gx = 0; gx < vw; gx += 16) {
        bgCtx.fillRect(gx, zeminY + 5, 8, 1);
        bgCtx.fillRect(gx + 6, zeminY + 11, 8, 1);
      }

      if (mId === 'sokak_arena') {
        bgCtx.fillStyle = 'rgba(234, 236, 239, 0.28)';
        bgCtx.fillRect(Math.round(vw * 0.25), zeminY + 4, Math.round(vw * 0.45), 1);
        bgCtx.fillRect(Math.round(vw * 0.22), zeminY + 10, Math.round(vw * 0.51), 1);
      }
    };

    const boyutGuncelle = () => {
      const rect = container.getBoundingClientRect();
      displayW = Math.max(280, Math.floor(rect.width));
      displayH = Math.max(120, Math.floor(rect.height));
      canvas.width = displayW;
      canvas.height = displayH;
      ctx.imageSmoothingEnabled = false;

      // 1:1 kare piksel ölçeği (asla dikey/yatay esneme yok)
      const hedefGenislik = 216;
      const hedefYukseklik = 78;
      const pxOlcek = Math.max(
        1,
        Math.floor(Math.min(displayW / hedefGenislik, displayH / hedefYukseklik))
      );

      vw = Math.max(180, Math.round(displayW / pxOlcek));
      vh = Math.max(76, Math.round(displayH / pxOlcek));
      spriteOlcek = vh >= 115 ? 3 : 2;

      pixelCanvas.width = vw;
      pixelCanvas.height = vh;
      pCtx.imageSmoothingEnabled = false;

      const s = stateRef.current;
      const key = `${vw}x${vh}|${s.mekanId}|${Math.floor(s.saatDakika / 120)}|${s.evSeviyesi}|${s.esyaAnahtari}`;
      arkaplanCiz(s.mekanId, s.saatDakika, s.evSeviyesi, s.evEsyalari, key);
    };

    boyutGuncelle();
    const ro = new ResizeObserver(boyutGuncelle);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let lastDraw = 0;
    let elapsed = 0;

    const ciz = (now: number) => {
      if (document.hidden && !stateRef.current.yenidenCiz) {
        lastTime = now;
        if (!reducedMotion) {
          rafId = requestAnimationFrame(ciz);
        }
        return;
      }
      const s = stateRef.current;
      const aktifAnim = s.aksiyonSuresi > 0 || s.yolculukSuresi > 0;
      const minInterval = aktifAnim ? 20 : 60;

      if (lastDraw !== 0 && now - lastDraw < minInterval && !s.yenidenCiz) {
        if (!reducedMotion) {
          rafId = requestAnimationFrame(ciz);
        }
        return;
      }
      lastDraw = now;
      s.yenidenCiz = false;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      lastTime = now;

      const key = `${vw}x${vh}|${s.mekanId}|${Math.floor(s.saatDakika / 120)}|${s.evSeviyesi}|${s.esyaAnahtari}`;
      if (cachedKey !== key) {
        arkaplanCiz(s.mekanId, s.saatDakika, s.evSeviyesi, s.evEsyalari, key);
      }

      if (!reducedMotion && !document.hidden) {
        elapsed += dt;
      }
      if (s.aksiyonSuresi > 0) {
        s.aksiyonSuresi = Math.max(0, s.aksiyonSuresi - (reducedMotion ? AKSIYON_SURESI : dt));
      }
      if (s.yolculukSuresi > 0) {
        s.yolculukSuresi = Math.max(0, s.yolculukSuresi - (reducedMotion ? YOLCULUK_SURESI : dt));
      }

      const zeminY = zeminYHesa();
      pCtx.drawImage(bgCanvas, 0, 0);

      // Evdeyken Emine ve Elif sprite'ları çakışmasız yerleştirilir
      if (s.mekanId === 'ev') {
        const aileKare = Math.floor(elapsed * 1.3) % 2;
        const emineSprite = aileKare === 0 ? EMINE_IDLE_0 : EMINE_IDLE_1;
        const elifSprite = aileKare === 0 ? ELIF_IDLE_0 : ELIF_IDLE_1;

        pikselSpriteCiz(
          pCtx,
          emineSprite,
          AILE_PALETI,
          Math.round(vw * 0.19),
          zeminY + 2,
          spriteOlcek
        );
        pikselSpriteCiz(
          pCtx,
          elifSprite,
          AILE_PALETI,
          Math.round(vw * 0.54),
          zeminY + 2,
          spriteOlcek
        );
      } else if (s.mekanId === 'spor_salonu') {
        // Müslüm Hoca ve Çiğdem Hoca antrenör figürleri
        const hocaKare = Math.floor(elapsed * 1.4) % 2 === 0 ? KEREM_IDLE_0 : KEREM_IDLE_1;
        const muslumPalet = keremPaletiOlustur(ANTRENOR_LISTESI[0].gorunum);
        const cigdemPalet = keremPaletiOlustur(ANTRENOR_LISTESI[1].gorunum);
        pikselSpriteCiz(
          pCtx,
          hocaKare,
          muslumPalet,
          Math.round(vw * 0.22),
          zeminY + 2,
          spriteOlcek
        );
        pikselSpriteCiz(
          pCtx,
          hocaKare,
          cigdemPalet,
          Math.round(vw * 0.82),
          zeminY + 2,
          spriteOlcek,
          true
        );
      } else if (s.mekanId === 'market') {
        // Bakkal Rıza kasanın yanında bekliyor
        const rizaKare = Math.floor(elapsed * 1.2) % 2 === 0 ? KEREM_IDLE_0 : KEREM_IDLE_1;
        const rizaPalet = {
          ...AILE_PALETI,
          s: '#5A5D66',
          c: '#355E4B',
          d: '#233F32',
          p: '#1B222C',
          b: '#C9CDD6',
          r: '#6CC296',
        };
        pikselSpriteCiz(
          pCtx,
          rizaKare,
          rizaPalet,
          Math.max(10, vw - 48 - 16 * spriteOlcek),
          zeminY + 2,
          spriteOlcek,
          true
        );
      } else if (s.mekanId === 'sokak_arena') {
        // Nuri Abi ve sokak tayfası kenarda izliyor
        const sokakKare = Math.floor(elapsed * 1.3) % 2;
        const nuriPalet = {
          ...AILE_PALETI,
          s: '#4E535E',
          c: '#3A3E4A',
          d: '#242730',
          p: '#141720',
          b: '#9BA3B5',
          r: '#D99B38',
        };
        pikselSpriteCiz(
          pCtx,
          sokakKare === 0 ? KEREM_IDLE_0 : KEREM_IDLE_1,
          nuriPalet,
          Math.round(vw * 0.12),
          zeminY + 1,
          spriteOlcek
        );
        pikselSpriteCiz(
          pCtx,
          sokakKare === 0 ? ELIF_IDLE_0 : ELIF_IDLE_1,
          AILE_PALETI,
          Math.round(vw * 0.84),
          zeminY + 2,
          spriteOlcek,
          true
        );
      }

      // Elektrikli ısıtıcı animasyonlu kor parıltısı
      if (s.mekanId === 'ev' && s.evEsyalari.includes('elektrikli_isitici')) {
        const korParlak = Math.floor(elapsed * 4) % 2 === 0;
        const isiticiX = vw - 11 * spriteOlcek;
        pCtx.fillStyle = korParlak ? '#FFAA44' : '#B54E2A';
        pCtx.fillRect(
          isiticiX + 3 * spriteOlcek,
          zeminY + 5 - 8 * spriteOlcek,
          4 * spriteOlcek,
          spriteOlcek
        );
      }

      // Kerem'in animasyonu (yürüme -> vuruş -> bekleme)
      const hedefX = Math.round(vw * s.karakterKonumX) - 8 * spriteOlcek;
      let keremX = hedefX;
      let keremY = zeminY + 3;
      let keremSprite = Math.floor(elapsed * 1.8) % 2 === 0 ? KEREM_IDLE_0 : KEREM_IDLE_1;

      const keremPalet = keremPaletiOlustur(s.gorunum);

      if (s.yolculukSuresi > 0 && !reducedMotion) {
        const ilerleme = 1 - s.yolculukSuresi / YOLCULUK_SURESI;
        keremX = Math.round(-12 + (hedefX + 12) * Math.min(1, ilerleme));
        const yurumeKare = Math.floor(elapsed * 9) % 3;
        keremSprite =
          yurumeKare === 0 ? KEREM_WALK_0 : yurumeKare === 1 ? KEREM_WALK_1 : KEREM_WALK_2;
      } else if (s.aksiyonSuresi > 0 && !reducedMotion) {
        const t = 1 - s.aksiyonSuresi / AKSIYON_SURESI;
        if (s.aksiyonTuru === 'dayaniklilik') {
          const kare = Math.floor(elapsed * 11) % 3;
          keremSprite = kare === 0 ? KEREM_WALK_0 : kare === 1 ? KEREM_WALK_1 : KEREM_WALK_2;
          keremY -= Math.round(Math.abs(Math.sin(t * Math.PI * 6)) * 2);
        } else {
          const faz = (t * 4) % 1;
          if (faz < 0.25) {
            keremSprite = KEREM_PUNCH_0;
            keremX -= 2;
          } else if (faz < 0.68) {
            keremSprite = KEREM_PUNCH_1;
            keremX += 3;
          } else {
            keremSprite = KEREM_PUNCH_2;
            keremX += 1;
          }
        }
      }

      // Zemin gölgesi
      pCtx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      pCtx.fillRect(keremX + 2 * spriteOlcek, zeminY + 1, 12 * spriteOlcek, 3);

      pikselSpriteCiz(pCtx, keremSprite, keremPalet, keremX, keremY, spriteOlcek);

      if (s.aksiyonSuresi > 0 && s.aksiyonTuru !== 'dayaniklilik' && !reducedMotion) {
        const t = 1 - s.aksiyonSuresi / AKSIYON_SURESI;
        const faz = (t * 4) % 1;
        if (faz >= 0.26 && faz <= 0.65) {
          const sx = keremX + 18 * spriteOlcek;
          const sy = keremY - 15 * spriteOlcek;
          pCtx.fillStyle = s.aksiyonTuru === 'guc' ? '#D63838' : '#D99B38';
          pCtx.fillRect(sx, sy, 5, 1);
          pCtx.fillRect(sx + 2, sy - 3, 4, 1);
          pCtx.fillRect(sx + 1, sy + 3, 4, 1);
        }
      }

      pCtx.fillStyle = 'rgba(234, 236, 239, 0.22)';
      for (const m of zerrecikler) {
        const mx = Math.floor(((m.x + elapsed * m.hiz) % 100) * (vw / 100));
        const my = Math.floor((m.y / 80) * zeminY + Math.sin(elapsed * 1.4 + m.faz) * 2);
        pCtx.fillRect(mx, my, 1, 1);
      }

      if (s.yolculukSuresi > YOLCULUK_SURESI - 0.22 && !reducedMotion) {
        const alfa = (s.yolculukSuresi - (YOLCULUK_SURESI - 0.22)) / 0.22;
        pCtx.fillStyle = `rgba(11, 14, 23, ${Math.min(0.85, alfa).toFixed(2)})`;
        pCtx.fillRect(0, 0, vw, vh);
      }

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displayW, displayH);
      ctx.drawImage(pixelCanvas, 0, 0, displayW, displayH);

      if (!reducedMotion) {
        rafId = requestAnimationFrame(ciz);
      }
    };

    if (reducedMotion) {
      tekCizimRef.current = () => {
        rafId = requestAnimationFrame(ciz);
      };
    }

    rafId = requestAnimationFrame(ciz);

    return () => {
      tekCizimRef.current = null;
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        data-testid="neighborhood-canvas"
        style={{ imageRendering: 'pixelated' }}
        className="absolute inset-0 block w-full h-full"
        aria-label="Karanlık Sokak pixel art sahnesi"
      />
    </div>
  );
};
