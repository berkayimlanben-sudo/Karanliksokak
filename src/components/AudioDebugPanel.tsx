import React, { useMemo, useState } from 'react';
import { Bug, Music, Square, Volume2, X } from 'lucide-react';
import { MuzikRuhHali, playMusic, playSfx, SFX_LISTESI, stopMusic } from '../game/sound';

const MUZIK_RUH_HALLERI: Array<{ id: MuzikRuhHali; etiket: string }> = [
  { id: 'sakin', etiket: 'Sakin (80 BPM)' },
  { id: 'enerjik', etiket: 'Enerjik (120 BPM)' },
  { id: 'gergin', etiket: 'Gergin (160 BPM)' },
];

export function debugSesPaneliAktifMi(isDev: boolean, search: string): boolean {
  if (isDev) return true;
  try {
    const params = new URLSearchParams(search);
    return params.get('debug') === '1';
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * GELİŞTİRİCİ / ?debug=1 SES TEST PANELİ
 * Prodüksiyonda (?debug=1 olmadan) kesinlikle render edilmez.
 * ============================================================================
 */
export const AudioDebugPanel: React.FC = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const queryDebugAcik = useMemo(() => {
    try {
      return new URLSearchParams(search).get('debug') === '1';
    } catch {
      return false;
    }
  }, [search]);

  const gosterilebilir = debugSesPaneliAktifMi(Boolean(import.meta.env.DEV), search);
  const [acik, setAcik] = useState(queryDebugAcik);
  const [sonTetiklenen, setSonTetiklenen] = useState<string | null>(null);
  const [aktifTestMuzik, setAktifTestMuzik] = useState<MuzikRuhHali | null>(null);

  if (!gosterilebilir) return null;

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-40">
      {!acik ? (
        <button
          type="button"
          data-testid="audio-debug-toggle"
          onClick={() => setAcik(true)}
          className="inline-flex items-center gap-1.5 border border-[#3A4766] bg-[#121724]/95 hover:border-[#D99B38] px-2.5 py-1.5 text-[11px] font-semibold text-[#C8CFDC] shadow-lg transition-colors cursor-pointer"
          title="Ses Debug Panelini Aç (?debug=1)"
        >
          <Bug className="w-3.5 h-3.5 text-[#D99B38]" />
          <span>Ses Debug</span>
        </button>
      ) : (
        <section
          data-testid="audio-debug-panel"
          aria-label="Ses Debug Paneli"
          className="w-[320px] sm:w-[360px] max-w-[calc(100vw-24px)] max-h-[75vh] flex flex-col border border-[#3A4766] bg-[#121724]/98 text-[#EAECEF] shadow-2xl"
        >
          <header className="border-b border-[#273147] bg-[#181F30] px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bug className="w-3.5 h-3.5 text-[#D99B38] shrink-0" />
              <h3 className="font-display text-sm font-bold tracking-wide text-[#EAECEF] truncate">
                Ses Debug Paneli ({SFX_LISTESI.length} SFX · 3 Müzik)
              </h3>
            </div>
            <button
              type="button"
              data-testid="audio-debug-close"
              onClick={() => setAcik(false)}
              aria-label="Ses Debug Panelini Kapat"
              className="p-1 border border-[#273147] bg-[#0B0E17] hover:border-[#D63838] text-[#EAECEF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </header>

          <div className="p-3 space-y-3 overflow-y-auto">
            {/* 3 Müzik Ruh Hali */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#8B95AB]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#EAECEF]">
                  <Music className="w-3 h-3 text-[#D99B38]" />
                  Müzik Ruh Halleri
                </span>
                <span>{aktifTestMuzik ? `Aktif: ${aktifTestMuzik}` : 'Durumu izle'}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MUZIK_RUH_HALLERI.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`debug-music-${m.id}`}
                    onClick={() => {
                      playMusic(m.id);
                      setAktifTestMuzik(m.id);
                    }}
                    className={`px-2 py-1.5 text-[11px] font-medium border text-left transition-colors cursor-pointer ${
                      aktifTestMuzik === m.id
                        ? 'border-[#D99B38] bg-[#221E14] text-[#F5D08A]'
                        : 'border-[#273147] bg-[#0B0E17] hover:border-[#3A4766] text-[#C8CFDC]'
                    }`}
                  >
                    {m.etiket}
                  </button>
                ))}
                <button
                  type="button"
                  data-testid="debug-music-stop"
                  onClick={() => {
                    stopMusic(400);
                    setAktifTestMuzik(null);
                  }}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold border border-[#D63838]/60 bg-[#221417] hover:border-[#E34A4A] text-[#E34A4A] transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                  <span>Müziği Durdur</span>
                </button>
              </div>
            </div>

            {/* 17 SFX Butonları */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#8B95AB]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#EAECEF]">
                  <Volume2 className="w-3 h-3 text-[#D63838]" />
                  SFX Tetikleyiciler ({SFX_LISTESI.length})
                </span>
                {sonTetiklenen && (
                  <span className="font-mono-tabular text-[10px] text-[#D99B38]">
                    {sonTetiklenen}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SFX_LISTESI.map((sfx) => (
                  <button
                    key={sfx.id}
                    type="button"
                    data-testid={`debug-sfx-${sfx.id}`}
                    onClick={() => {
                      playSfx(sfx.id);
                      setSonTetiklenen(sfx.id);
                    }}
                    className="px-2 py-1.5 text-[11px] font-mono-tabular border border-[#273147] bg-[#0B0E17] hover:border-[#D99B38] hover:text-[#EAECEF] text-[#C8CFDC] text-left truncate transition-colors cursor-pointer"
                  >
                    {sfx.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
