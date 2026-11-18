import React, { useEffect, useId, useState } from 'react';
import { getEfektAyarlari, subscribeEfektAyarlari } from '../game/effects';
import { MekanId } from '../game/theme';

interface AtmosphereLayerProps {
  mekanId: MekanId;
}

const SALON_TOZ_PARCACIKLARI = [
  { x: 10, y: 24, size: 3, delay: '0s', duration: '5.5s' },
  { x: 18, y: 62, size: 2, delay: '-1.4s', duration: '6.8s' },
  { x: 25, y: 38, size: 4, delay: '-2.2s', duration: '7.2s' },
  { x: 33, y: 74, size: 2, delay: '-0.7s', duration: '5.9s' },
  { x: 40, y: 28, size: 3, delay: '-3.1s', duration: '6.4s' },
  { x: 47, y: 55, size: 2, delay: '-1.9s', duration: '5.2s' },
  { x: 54, y: 20, size: 3, delay: '-4.0s', duration: '7.5s' },
  { x: 61, y: 66, size: 4, delay: '-2.6s', duration: '6.1s' },
  { x: 68, y: 42, size: 2, delay: '-0.9s', duration: '5.8s' },
  { x: 74, y: 78, size: 3, delay: '-3.5s', duration: '6.9s' },
  { x: 80, y: 32, size: 2, delay: '-1.2s', duration: '6.2s' },
  { x: 86, y: 58, size: 3, delay: '-2.8s', duration: '7.0s' },
  { x: 92, y: 26, size: 2, delay: '-4.4s', duration: '5.6s' },
  { x: 14, y: 46, size: 3, delay: '-3.8s', duration: '6.6s' },
] as const;

const SOKAK_PENCERELER = [
  { left: '11%', top: '48%', w: '6px', h: '8px', delay: '0s' },
  { left: '24%', top: '54%', w: '8px', h: '10px', delay: '-1.3s' },
  { left: '72%', top: '46%', w: '7px', h: '9px', delay: '-2.4s' },
  { left: '89%', top: '53%', w: '6px', h: '8px', delay: '-0.8s' },
] as const;

const YAGMUR_DAMLALARI = [
  { x: 24, y: 14, l: 12 },
  { x: 58, y: 62, l: 14 },
  { x: 92, y: 28, l: 11 },
  { x: 126, y: 78, l: 13 },
  { x: 160, y: 18, l: 12 },
  { x: 194, y: 54, l: 14 },
  { x: 228, y: 34, l: 11 },
  { x: 262, y: 82, l: 13 },
  { x: 296, y: 20, l: 12 },
  { x: 330, y: 66, l: 14 },
  { x: 362, y: 40, l: 11 },
  { x: 382, y: 88, l: 12 },
] as const;

/**
 * ============================================================================
 * MEKAN ATMOSFER KATMANI
 * GPU uyumlu CSS transform/opacity animasyonları (layout tetiklemez).
 * Tüm yoğunluk effects.ts -> efektSeviyesi('parcacik') ayarına bağlıdır.
 * ============================================================================
 */
export const AtmosphereLayer: React.FC<AtmosphereLayerProps> = ({ mekanId }) => {
  const [parcacikSeviyesi, setParcacikSeviyesi] = useState<number>(
    () => getEfektAyarlari().parcacik
  );
  const patternId = useId();

  useEffect(() => {
    return subscribeEfektAyarlari((ayarlar) => {
      setParcacikSeviyesi(ayarlar.parcacik);
    });
  }, []);

  if (parcacikSeviyesi <= 0) {
    return null;
  }

  const yogunluk = Math.max(0, Math.min(1, parcacikSeviyesi / 100));

  return (
    <div
      data-testid={`atmosphere-layer-${mekanId}`}
      aria-hidden="true"
      style={{ opacity: yogunluk }}
      className="pointer-events-none absolute inset-0 overflow-hidden z-[5]"
    >
      {/* EV: Loş ışık titremesi (opacity 0.9 - 1.0 pulse) */}
      {mekanId === 'ev' && (
        <div
          data-testid="atmosphere-home-flicker"
          className="absolute inset-0 animate-atmosfer-ev-titreme will-change-[opacity]"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(255, 206, 132, 0.14) 0%, rgba(16, 20, 34, 0.12) 55%, rgba(5, 7, 12, 0.28) 100%)',
          }}
        />
      )}

      {/* SPOR SALONU: Toz parçacıkları (max 15, transform keyframe) */}
      {mekanId === 'spor_salonu' && (
        <div data-testid="atmosphere-gym-dust" className="absolute inset-0">
          {SALON_TOZ_PARCACIKLARI.map((toz, idx) => (
            <span
              key={idx}
              className="absolute rounded-full bg-[#F5D08A]/65 animate-atmosfer-toz will-change-[transform,opacity]"
              style={{
                left: `${toz.x}%`,
                top: `${toz.y}%`,
                width: `${toz.size}px`,
                height: `${toz.size}px`,
                animationDelay: toz.delay,
                animationDuration: toz.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* DIŞ MEKANLAR (Market / İş Yeri): Hafif sokak sisi */}
      {(mekanId === 'market' || mekanId === 'is_yeri') && (
        <div
          data-testid="atmosphere-street-mist"
          className="absolute inset-y-0 -inset-x-10 animate-atmosfer-sis will-change-transform"
          style={{
            background:
              'linear-gradient(180deg, transparent 40%, rgba(139, 149, 171, 0.1) 76%, rgba(11, 14, 23, 0.2) 100%)',
          }}
        />
      )}

      {/* SOKAK ARENASI: Hafif sis + parlayan pencereler + sınırlı yağmur deseni (<=20 damla) */}
      {mekanId === 'sokak_arena' && (
        <>
          <div
            data-testid="atmosphere-arena-mist"
            className="absolute inset-y-0 -inset-x-12 animate-atmosfer-sis will-change-transform"
            style={{
              background:
                'radial-gradient(ellipse at 32% 78%, rgba(148, 163, 184, 0.18) 0%, transparent 62%), radial-gradient(ellipse at 72% 72%, rgba(100, 116, 139, 0.14) 0%, transparent 58%)',
            }}
          />

          <div data-testid="atmosphere-arena-windows" className="absolute inset-0">
            {SOKAK_PENCERELER.map((pencere, idx) => (
              <span
                key={idx}
                className="absolute bg-[#F5C26B]/55 animate-atmosfer-pencere will-change-[opacity,box-shadow]"
                style={{
                  left: pencere.left,
                  top: pencere.top,
                  width: pencere.w,
                  height: pencere.h,
                  animationDelay: pencere.delay,
                }}
              />
            ))}
          </div>

          <svg
            data-testid="atmosphere-arena-rain"
            className="absolute -top-28 inset-x-0 w-full h-[calc(100%+112px)] opacity-35 animate-atmosfer-yagmur will-change-transform"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={patternId}
                width="390"
                height="110"
                patternUnits="userSpaceOnUse"
              >
                {YAGMUR_DAMLALARI.map((d, idx) => (
                  <line
                    key={idx}
                    x1={d.x}
                    y1={d.y}
                    x2={d.x - 3}
                    y2={d.y + d.l}
                    stroke="#B8C7E0"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                ))}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        </>
      )}
    </div>
  );
};
