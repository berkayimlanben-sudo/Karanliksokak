import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react';
import {
  getSesAyarlari,
  mute,
  playSfx,
  SesAyarlari,
  SesKategorisi,
  setVolume,
  subscribeSesAyarlari,
} from '../game/sound';

interface AudioControlsProps {
  compact?: boolean;
}

const KATEGORI_SATIRLARI: Array<{
  id: SesKategorisi;
  muteKey: 'masterMute' | 'sfxMute' | 'muzikMute';
  etiket: string;
  aciklama: string;
}> = [
  {
    id: 'master',
    muteKey: 'masterMute',
    etiket: 'Master (Genel)',
    aciklama: 'Tüm ses ve müzik çıkışı [M]',
  },
  {
    id: 'sfx',
    muteKey: 'sfxMute',
    etiket: 'SFX (Efektler)',
    aciklama: 'Dövüş darbeleri, menü ve uyarılar',
  },
  {
    id: 'muzik',
    muteKey: 'muzikMute',
    etiket: 'Müzik',
    aciklama: 'Mahalle, salon ve arena atmosferi',
  },
];

/**
 * ============================================================================
 * HER ZAMAN ERİŞİLEBİLİR SES KONTROLÜ (MUTE BUTONU + 3 SLİDER AYAR PANELİ)
 * ============================================================================
 */
export const AudioControls: React.FC<AudioControlsProps> = ({ compact = false }) => {
  const [ayarlar, setAyarlar] = useState<SesAyarlari>(() => getSesAyarlari());
  const [panelAcik, setPanelAcik] = useState(false);

  useEffect(() => {
    setAyarlar(getSesAyarlari());
    return subscribeSesAyarlari((yeni) => setAyarlar(yeni));
  }, []);

  const masterAcik = !ayarlar.masterMute && ayarlar.master > 0;

  const handleMasterMuteToggle = () => {
    const yeniKapali = !ayarlar.masterMute;
    mute('master', yeniKapali);
    if (!yeniKapali) {
      playSfx('menu_tik');
    }
  };

  return (
    <>
      <div className="pointer-events-auto inline-flex items-center gap-1 shrink-0">
        <button
          type="button"
          data-testid="sound-toggle-btn"
          onClick={handleMasterMuteToggle}
          aria-label={masterAcik ? 'Sesi Kapat (M)' : 'Sesi Aç (M)'}
          title={masterAcik ? 'Ses Açık (M)' : 'Ses Kapalı (M)'}
          className={`inline-flex items-center justify-center gap-1 border border-[#273147] bg-[#121724]/95 hover:border-[#3A4766] text-[#EAECEF] transition-colors cursor-pointer ${
            compact ? 'min-h-[30px] px-1.5 text-[10px]' : 'min-h-[34px] px-2 text-xs'
          }`}
        >
          {masterAcik ? (
            <Volume2 className="w-3.5 h-3.5 text-[#D99B38] shrink-0" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-[#E34A4A] shrink-0" />
          )}
          <span className="hidden sm:inline font-mono-tabular text-[10px] text-[#8B95AB]">
            M
          </span>
        </button>

        <button
          type="button"
          data-testid="audio-settings-btn"
          onClick={() => {
            playSfx('menu_tik');
            setPanelAcik(true);
          }}
          aria-label="Ses Ayarları"
          title="Ses Ayarları"
          className={`inline-flex items-center justify-center border border-[#273147] bg-[#121724]/95 hover:border-[#D99B38] text-[#EAECEF] transition-colors cursor-pointer ${
            compact ? 'min-h-[30px] min-w-[30px]' : 'min-h-[34px] min-w-[34px]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#A3ACBE]" />
        </button>
      </div>

      {panelAcik && (
        <div
          data-testid="audio-settings-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-settings-title"
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            playSfx('menu_tik');
            setPanelAcik(false);
          }}
        >
          <div
            className="w-full max-w-md border border-[#3A4766] bg-[#121724] text-[#EAECEF] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#273147] bg-[#181F30] px-4 py-3 flex items-center justify-between gap-2">
              <div>
                <h2
                  id="audio-settings-title"
                  className="font-display text-xl font-bold tracking-wide text-[#EAECEF]"
                >
                  Ses Ayarları
                </h2>
                <p className="text-[11px] text-[#8B95AB]">
                  Tercihler oyun kaydından bağımsız saklanır.
                </p>
              </div>
              <button
                type="button"
                data-testid="audio-settings-close"
                onClick={() => {
                  playSfx('menu_tik');
                  setPanelAcik(false);
                }}
                aria-label="Ses Ayarlarını Kapat"
                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center border border-[#273147] bg-[#0B0E17] hover:border-[#D63838] text-[#EAECEF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {KATEGORI_SATIRLARI.map((satir) => {
                const deger = ayarlar[satir.id];
                const kapali = ayarlar[satir.muteKey];
                const yuzde = Math.round(deger * 100);

                return (
                  <div
                    key={satir.id}
                    className="border border-[#273147] bg-[#0B0E17] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#EAECEF]">
                          {satir.etiket}
                        </p>
                        <p className="text-[11px] text-[#8B95AB]">{satir.aciklama}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-tabular text-xs font-bold text-[#D99B38] w-10 text-right">
                          {kapali ? '0%' : `%${yuzde}`}
                        </span>
                        <button
                          type="button"
                          data-testid={`mute-${satir.id}-btn`}
                          onClick={() => {
                            const yeni = !kapali;
                            mute(satir.id, yeni);
                            if (!yeni) playSfx('menu_tik');
                          }}
                          className={`min-h-[30px] px-2.5 text-[11px] font-semibold border transition-colors cursor-pointer ${
                            kapali
                              ? 'border-[#D63838] bg-[#221417] text-[#E34A4A]'
                              : 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                          }`}
                        >
                          {kapali ? 'Kapalı' : 'Açık'}
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={yuzde}
                      aria-label={`${satir.etiket} seviyesi`}
                      data-testid={`slider-${satir.id}`}
                      onChange={(e) => {
                        const oran = Number(e.target.value) / 100;
                        setVolume(satir.id, oran);
                        if (kapali && oran > 0) {
                          mute(satir.id, false);
                        }
                      }}
                      className="w-full h-2 accent-[#D99B38] cursor-pointer"
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#8B95AB]">
                <span>Kısayol: [M] Master sesi aç/kapat</span>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('menu_tik');
                    setPanelAcik(false);
                  }}
                  className="px-3 py-1.5 border border-[#3A4766] bg-[#181F30] hover:border-[#D99B38] text-[#EAECEF] font-semibold cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
