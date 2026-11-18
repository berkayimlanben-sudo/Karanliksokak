import React from 'react';
import { Lock, Check } from 'lucide-react';
import {
  ANTRENOR_DERSLERI,
  ANTRENOR_LISTESI,
  HAMLE_LISTESI,
  HamleTuru,
  STAT_TANIMLARI,
  YETENEK_AGACI,
} from '../data/gameData';
import { hamleAcikMi, StatDurumu } from '../game/engine';
import { StatId } from '../data/gameData';

interface MovesPanelProps {
  statlar: Record<StatId, StatDurumu>;
  acikYetenekIds?: string[];
  ogrenilenHocaDersIds?: string[];
}

const TUR_ADLARI: Record<HamleTuru, string> = {
  yumruk: 'Yumruk',
  tekme: 'Tekme',
  kacinma: 'Kaçınma / Savunma',
};

const STAT_KISA: Record<string, string> = Object.fromEntries(
  STAT_TANIMLARI.map((s) => [s.id, s.isim])
);
const YETENEK_ISIMLERI: Record<string, string> = Object.fromEntries(
  YETENEK_AGACI.map((y) => [y.id, y.isim])
);
const ANTRENOR_ISIMLERI: Record<string, string> = Object.fromEntries(
  ANTRENOR_LISTESI.map((a) => [a.id, a.isim])
);
const HOCA_DERS_HARITASI = new Map(ANTRENOR_DERSLERI.map((d) => [d.id, d]));

/**
 * ============================================================================
 * HAMLE VERİSİ VE KİLİT DURUMU PANELİ
 * Veri listesindeki hamleleri, stat etkilerini ve açılma şartlarını gösterir.
 * ============================================================================
 */
export const MovesPanel: React.FC<MovesPanelProps> = ({
  statlar,
  acikYetenekIds = [],
  ogrenilenHocaDersIds = [],
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-[#273147] pb-3">
        <h3 className="font-display text-xl font-bold tracking-wide text-[#EAECEF]">
          Hamle Repertuarı
        </h3>
        <p className="text-xs text-[#8B95AB] mt-1">
          Sokak Arenası maçlarında kullanacağın hamleler. Stat çalıştıkça, Yetenek Ağacı açtıkça ve Spor Salonunda hocalardan ders aldıkça yeni teknikler eklenir.
        </p>
      </div>

      <div className="divide-y divide-[#273147] border border-[#273147] bg-[#0B0E17]">
        {HAMLE_LISTESI.map((hamle) => {
          const acik = hamleAcikMi(hamle, statlar, acikYetenekIds, ogrenilenHocaDersIds);
          const etkiMetni = Object.entries(hamle.statEtkileri)
            .map(([id, k]) => `${STAT_KISA[id] ?? id} ×${k}`)
            .join(' · ');

          const parcalar: string[] = [];
          if (hamle.yetenekId) {
            parcalar.push(`Yetenek: ${YETENEK_ISIMLERI[hamle.yetenekId] ?? hamle.yetenekId}`);
          }
          if (hamle.hocaDersId) {
            const ders = HOCA_DERS_HARITASI.get(hamle.hocaDersId);
            const hocaAdi = ders ? (ANTRENOR_ISIMLERI[ders.antrenorId] ?? 'Antrenör') : 'Antrenör';
            parcalar.push(`Hoca: ${hocaAdi} (${ders?.isim ?? hamle.hocaDersId})`);
          }
          for (const [id, min] of Object.entries(hamle.acilisSarti)) {
            parcalar.push(`${STAT_KISA[id] ?? id} ${min}`);
          }
          const sartMetni = parcalar.join(' · ');

          return (
            <div
              key={hamle.id}
              className={`p-3 sm:p-4 transition-colors ${acik ? 'bg-[#0B0E17]' : 'bg-[#0D1019] opacity-80'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-display text-lg font-bold text-[#EAECEF]">
                      {hamle.isim}
                    </span>
                    <span className="text-xs text-[#8B95AB]">· {TUR_ADLARI[hamle.tur]}</span>
                    <span className="font-mono-tabular text-[11px] text-[#6B768F]">
                      [{hamle.kisayolTusu}]
                    </span>
                  </div>
                  <p className="text-xs text-[#A3ACBE] mt-1 leading-snug">{hamle.aciklama}</p>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium">
                  {acik ? (
                    <span className="inline-flex items-center gap-1 text-[#6CC296]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Açık</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#D99B38]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Gereken: {sartMetni}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[11px] sm:text-xs font-mono-tabular text-[#8B95AB]">
                <span>Hasar: {hamle.temelHasar > 0 ? hamle.temelHasar : 'Yok'}</span>
                <span>Stamina: {hamle.staminaMaliyeti}</span>
                <span>İsabet: %{hamle.isabetSansi}</span>
                <span>Soğuma: {(hamle.beklemeSuresiMs / 1000).toFixed(1)}s</span>
                <span>Etki: {etkiMetni}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
