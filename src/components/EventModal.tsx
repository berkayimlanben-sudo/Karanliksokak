import React from 'react';
import {
  EvOlayi,
  KOMSU_LISTESI,
  KomsuHikayeOlayi,
  KomsuOlaySecenegi,
} from '../data/gameData';
import { EtkiRozeti, metinSablonunuDoldur, olayEtkisiRozetleri, OyunDurumu } from '../game/engine';
import { playSfx } from '../game/sound';

interface EventModalProps {
  olay: EvOlayi | KomsuHikayeOlayi;
  state: OyunDurumu;
  onSecenekSec: (secenekId: string) => void;
}

const KATEGORI_ETIKETI: Record<EvOlayi['kategori'], string> = {
  ev: 'Ev Durumu',
  mahalle: 'Mahalle',
  aile: 'Aile',
  baski: 'Baskı',
  ahlaki: 'Ahlaki İkilem',
};

const ROZET_STILI: Record<EtkiRozeti['tur'], string> = {
  arti: 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]',
  eksi: 'border-[#D63838]/60 bg-[#221417] text-[#E34A4A]',
  uyari: 'border-[#D99B38]/60 bg-[#1D170E] text-[#D99B38]',
  notr: 'border-[#273147] bg-[#121724] text-[#A3ACBE]',
};

const KOMSU_HARITASI = new Map(KOMSU_LISTESI.map((k) => [k.id, k]));

function komsuOlayiMi(olay: EvOlayi | KomsuHikayeOlayi): olay is KomsuHikayeOlayi {
  return 'komsuId' in olay;
}

/**
 * ============================================================================
 * EV VE KOMŞU OLAYI PENCERESİ
 * Gün başında tetiklenen ev olayını veya mekandaki komşu hikaye olayını sunar.
 * ============================================================================
 */
export const EventModal: React.FC<EventModalProps> = ({
  olay,
  state,
  onSecenekSec,
}) => {
  const komsu = komsuOlayiMi(olay) ? KOMSU_HARITASI.get(olay.komsuId) : undefined;
  const ustEtiket = komsuOlayiMi(olay)
    ? `${komsu?.isim ?? 'Komşu'} (${komsu?.rol ?? 'Mahalle'}) · Adım ${olay.adim} · Gün ${state.gun}`
    : `${KATEGORI_ETIKETI[olay.kategori]} · Gün ${state.gun}`;

  return (
    <div
      data-testid="event-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#3A4766] bg-[#121724] text-[#EAECEF] shadow-2xl">
        {/* Başlık şeridi */}
        <div className="border-b border-[#273147] px-4 py-3.5 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4 bg-[#181F30]">
          <div>
            <p className="text-xs font-medium text-[#D99B38]">{ustEtiket}</p>
            <h2
              id="event-modal-title"
              className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#EAECEF] mt-0.5"
            >
              {olay.baslik}
            </h2>
          </div>
          <span className="font-mono-tabular text-xs text-[#8B95AB] shrink-0">
            {state.para} ₺ · {state.enerji} EN
          </span>
        </div>

        {/* Açıklama metni */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#273147]">
          <p className="text-sm md:text-base leading-relaxed text-[#D0D6E2]">
            {metinSablonunuDoldur(olay.aciklama, state)}
          </p>
        </div>

        {/* Seçenekler */}
        <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-3">
          {olay.secenekler.map((secenek, index) => {
            const gerekenPara =
              secenek.minParaGerekli ??
              (secenek.etkiler.para && secenek.etkiler.para < 0
                ? Math.abs(secenek.etkiler.para)
                : 0);
            const gerekenEnerji =
              secenek.minEnerjiGerekli ??
              (secenek.etkiler.enerji && secenek.etkiler.enerji < 0
                ? Math.abs(secenek.etkiler.enerji)
                : 0);
            const paraYetersiz = gerekenPara > 0 && state.para < gerekenPara;
            const enerjiYetersiz = gerekenEnerji > 0 && state.enerji < gerekenEnerji;
            const devredisi = paraYetersiz || enerjiYetersiz;
            const rozetler = olayEtkisiRozetleri(secenek.etkiler);

            return (
              <button
                key={secenek.id}
                type="button"
                data-testid={`event-option-${secenek.id}`}
                disabled={devredisi}
                onClick={() => {
                  playSfx('menu_tik');
                  onSecenekSec(secenek.id);
                }}
                className={`w-full min-h-[52px] text-left border px-4 py-3 transition-colors group ${
                  devredisi
                    ? 'border-[#273147] bg-[#0D1019] text-[#5B657A] opacity-65 cursor-not-allowed'
                    : 'border-[#273147] hover:border-[#D63838] bg-[#0B0E17] hover:bg-[#181F30] cursor-pointer'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      devredisi
                        ? 'text-[#8B95AB]'
                        : 'text-[#EAECEF] group-hover:text-white'
                    }`}
                  >
                    {index + 1}. {metinSablonunuDoldur(secenek.etiket, state)}
                  </span>
                  {paraYetersiz ? (
                    <span className="font-mono-tabular text-xs font-semibold text-[#E34A4A] shrink-0">
                      Yetersiz ({gerekenPara} ₺)
                    </span>
                  ) : enerjiYetersiz ? (
                    <span className="font-mono-tabular text-xs font-semibold text-[#E34A4A] shrink-0">
                      Yetersiz ({gerekenEnerji} EN)
                    </span>
                  ) : null}
                </div>
                {rozetler.length > 0 && (
                  <div
                    data-testid={`event-badges-${secenek.id}`}
                    className="flex flex-wrap gap-1.5 mt-2"
                  >
                    {rozetler.map((rozet, idx) => (
                      <span
                        key={`${rozet.metin}-${idx}`}
                        className={`border px-1.5 py-0.5 text-[10px] font-mono-tabular font-semibold ${ROZET_STILI[rozet.tur]}`}
                      >
                        {rozet.metin}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#8B95AB] mt-1.5">
                  {metinSablonunuDoldur(secenek.ipucu, state)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
