import React, { useMemo, useState } from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import {
  HAMLE_LISTESI,
  STAT_TANIMLARI,
  YETENEK_AGACI,
  YETENEK_DALLARI,
  YetenekDaliId,
} from '../data/gameData';
import {
  hesaplaYetenekPasifleri,
  OyunDurumu,
  yetenekAcilabilirMi,
} from '../game/engine';
import { playSfx } from '../game/sound';

interface SkillTreePanelProps {
  state: OyunDurumu;
  onYetenekAc: (yetenekId: string) => void;
}

const STAT_ISIMLERI: Record<string, string> = Object.fromEntries(
  STAT_TANIMLARI.map((s) => [s.id, s.isim])
);
const YETENEK_ISIMLERI: Record<string, string> = Object.fromEntries(
  YETENEK_AGACI.map((y) => [y.id, y.isim])
);
const HAMLE_HARITASI = new Map(HAMLE_LISTESI.map((h) => [h.id, h]));

/**
 * ============================================================================
 * C1 AŞAMASI: PİXEL ART YETENEK AĞACI PANELİ
 * 4 dal × 5 kademe yapısını mobil uyumlu sekmeler ve dikey bağlantı
 * çizgileriyle gösterir; kilitli/açılabilir/açık durumlarını net ayırır.
 * ============================================================================
 */
export const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  state,
  onYetenekAc,
}) => {
  const [seciliDal, setSeciliDal] = useState<YetenekDaliId>('yumruk');
  const acikIds = useMemo(() => state.acikYetenekIds ?? [], [state.acikYetenekIds]);
  const ogrenilenHocaDersIds = useMemo(
    () => state.ogrenilenHocaDersIds ?? [],
    [state.ogrenilenHocaDersIds]
  );
  const pasifler = useMemo(
    () => hesaplaYetenekPasifleri(acikIds, ogrenilenHocaDersIds),
    [acikIds, ogrenilenHocaDersIds]
  );
  const mevcutPuan = state.yetenekPuani ?? 0;

  const dalDugumleri = useMemo(
    () =>
      YETENEK_AGACI.filter((d) => d.dal === seciliDal).sort(
        (a, b) => a.kademe - b.kademe
      ),
    [seciliDal]
  );

  const aktifDalTanimi =
    YETENEK_DALLARI.find((d) => d.id === seciliDal) ?? YETENEK_DALLARI[0];

  const pasifEtiketleri = useMemo(() => {
    const liste: Array<{ etiket: string; deger: string }> = [];
    if (pasifler.ekMaksCan > 0)
      liste.push({ etiket: 'Maks Can', deger: `+${pasifler.ekMaksCan}` });
    if (pasifler.ekMaksStamina > 0)
      liste.push({ etiket: 'Maks Stamina', deger: `+${pasifler.ekMaksStamina}` });
    if (pasifler.staminaToparlanmaYuzde > 0)
      liste.push({
        etiket: 'Stamina Yenileme',
        deger: `+%${pasifler.staminaToparlanmaYuzde}`,
      });
    if (pasifler.yumrukHasarYuzde > 0)
      liste.push({ etiket: 'Yumruk Hasar', deger: `+%${pasifler.yumrukHasarYuzde}` });
    if (pasifler.tekmeHasarYuzde > 0)
      liste.push({ etiket: 'Tekme Hasar', deger: `+%${pasifler.tekmeHasarYuzde}` });
    if (pasifler.isabetBonusu > 0)
      liste.push({ etiket: 'İsabet', deger: `+%${pasifler.isabetBonusu}` });
    if (pasifler.blokKesintiYuzde > 0)
      liste.push({ etiket: 'Blok Direnci', deger: `+%${pasifler.blokKesintiYuzde}` });
    if (pasifler.kacinmaSansiBonusu > 0)
      liste.push({ etiket: 'Kaçınma', deger: `+%${pasifler.kacinmaSansiBonusu}` });
    if (pasifler.karsiSaldiriCarpanBonusu > 0)
      liste.push({
        etiket: 'Kontra Gücü',
        deger: `+${Math.round(pasifler.karsiSaldiriCarpanBonusu * 100)}%`,
      });
    if (pasifler.antrenmanVerimBonusu > 0)
      liste.push({ etiket: 'Antrenman', deger: `+%${pasifler.antrenmanVerimBonusu}` });
    if (pasifler.gunlukEnerjiBonusu > 0)
      liste.push({ etiket: 'Sabah Enerji', deger: `+${pasifler.gunlukEnerjiBonusu}` });
    return liste;
  }, [pasifler]);

  return (
    <div data-testid="skill-tree-panel" className="space-y-4">
      {/* Üst Puan & Bilgi Şeridi */}
      <div className="border border-[#273147] bg-[#0B0E17] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D99B38] shrink-0" />
            <span className="font-display text-lg sm:text-xl font-bold tracking-wide text-[#EAECEF]">
              Mevcut Yetenek Puanı
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#8B95AB] mt-0.5">
            Maç galibiyeti (+1/+2 YP) ve stat eşikleri (Sv. 6, 8, 10, 12 → +1 YP) puan kazandırır.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            data-testid="skill-points-badge"
            className="border-2 border-[#D99B38] bg-[#1D170E] px-3.5 py-1.5 font-mono-tabular text-base sm:text-lg font-extrabold text-[#D99B38]"
          >
            {mevcutPuan} YP
          </div>
          <div className="border border-[#273147] bg-[#121724] px-3 py-1.5 font-mono-tabular text-xs text-[#A3ACBE]">
            {acikIds.length}/{YETENEK_AGACI.length} Açık
          </div>
        </div>
      </div>

      {/* Aktif Pasif Bonus Özeti */}
      <div className="border border-[#273147] bg-[#121724] px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8B95AB] mb-1.5">
          Aktif Pasif Etkiler
        </p>
        {pasifEtiketleri.length === 0 ? (
          <p className="text-xs text-[#6B768F]">
            Henüz pasif yetenek açılmadı. İlk kademeden başlayarak kalıcı bonuslar kazanabilirsin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {pasifEtiketleri.map((p) => (
              <span
                key={p.etiket}
                className="border border-[#3D8C66]/50 bg-[#12221D] px-2 py-0.5 text-[11px] font-mono-tabular text-[#6CC296]"
              >
                {p.etiket}: {p.deger}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4 Dal Sekme Çubuğu (Mobilde 2x2, Masaüstünde 4 Sütun) */}
      <div
        role="tablist"
        aria-label="Yetenek Dalları"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {YETENEK_DALLARI.map((dal) => {
          const dalNodes = YETENEK_AGACI.filter((d) => d.dal === dal.id);
          const acikSayisi = dalNodes.filter((d) => acikIds.includes(d.id)).length;
          const acilabilirVarMi = dalNodes.some(
            (d) => yetenekAcilabilirMi(state, d.id).acilabilir
          );
          const aktif = seciliDal === dal.id;

          return (
            <button
              key={dal.id}
              type="button"
              role="tab"
              aria-selected={aktif}
              data-testid={`skill-branch-${dal.id}`}
              onClick={() => {
                playSfx('menu_tik');
                setSeciliDal(dal.id);
              }}
              className={`min-h-[48px] px-3 py-2 border text-left transition-colors cursor-pointer relative ${
                aktif
                  ? 'bg-[#181F30] text-[#EAECEF]'
                  : 'border-[#273147] bg-[#0D1019] text-[#8B95AB] hover:text-[#EAECEF] hover:border-[#3A4766]'
              }`}
              style={aktif ? { borderColor: dal.vurguRenk } : undefined}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-display text-sm sm:text-base font-bold leading-tight truncate">
                  {dal.isim}
                </span>
                {acilabilirVarMi && (
                  <span
                    title="Açılabilir yetenek var"
                    className="w-2 h-2 shrink-0 bg-[#D99B38]"
                  />
                )}
              </div>
              <span className="font-mono-tabular text-[11px] text-[#8B95AB] block mt-0.5">
                {acikSayisi}/{dalNodes.length} Kademe
              </span>
            </button>
          );
        })}
      </div>

      {/* Seçili Dal Açıklaması */}
      <div
        className="border-l-4 border border-[#273147] bg-[#0B0E17] px-3 py-2 text-xs text-[#A3ACBE]"
        style={{ borderLeftColor: aktifDalTanimi.vurguRenk }}
      >
        <span className="font-display text-sm font-bold text-[#EAECEF] mr-2">
          {aktifDalTanimi.isim}:
        </span>
        {aktifDalTanimi.kisaAciklama}
      </div>

      {/* 5 Kademeli Dikey Pixel Art Ağaç Akışı */}
      <div className="space-y-0">
        {dalDugumleri.map((dugum, index) => {
          const kontrol = yetenekAcilabilirMi(state, dugum.id);
          const acikMi = kontrol.acikMi;
          const acilabilir = kontrol.acilabilir;
          const acilanHamle = dugum.etki.acilanHamleId
            ? HAMLE_HARITASI.get(dugum.etki.acilanHamleId)
            : undefined;
          const statSartMetni = Object.entries(dugum.statSarti)
            .map(([id, min]) => `${STAT_ISIMLERI[id] ?? id} ${min}`)
            .join(' · ');

          return (
            <React.Fragment key={dugum.id}>
              {/* Düğümler Arası Pixel Bağlantı Çizgisi */}
              {index > 0 && (
                <div className="flex justify-center py-0.5" aria-hidden="true">
                  <div
                    className="w-1 h-4"
                    style={{
                      backgroundColor: acikMi
                        ? '#3D8C66'
                        : acilabilir
                          ? aktifDalTanimi.vurguRenk
                          : '#273147',
                    }}
                  />
                </div>
              )}

              <div
                data-testid={`skill-node-${dugum.id}`}
                className={`border p-3 sm:p-4 transition-colors ${
                  acikMi
                    ? 'border-[#3D8C66] bg-[#101C18]'
                    : acilabilir
                      ? 'bg-[#151B2B]'
                      : 'border-[#273147] bg-[#0D1019]'
                }`}
                style={
                  !acikMi && acilabilir
                    ? { borderColor: aktifDalTanimi.vurguRenk }
                    : undefined
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-mono-tabular font-bold border"
                        style={{
                          borderColor: acikMi
                            ? '#3D8C66'
                            : acilabilir
                              ? aktifDalTanimi.vurguRenk
                              : '#273147',
                          color: acikMi
                            ? '#6CC296'
                            : acilabilir
                              ? '#EAECEF'
                              : '#8B95AB',
                          backgroundColor: '#0B0E17',
                        }}
                      >
                        K{dugum.kademe}
                      </span>
                      <h4 className="font-display text-lg font-bold text-[#EAECEF] leading-none">
                        {dugum.isim}
                      </h4>
                      <span className="font-mono-tabular text-[11px] px-1.5 py-0.5 border border-[#273147] bg-[#0B0E17] text-[#D99B38]">
                        {dugum.puanMaliyeti} YP
                      </span>
                    </div>

                    <p className="text-xs text-[#B3BCCB] leading-snug">
                      {dugum.aciklama}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px]">
                      <span
                        className={`font-semibold ${
                          acikMi ? 'text-[#6CC296]' : 'text-[#D99B38]'
                        }`}
                      >
                        {dugum.ozetEtiket}
                      </span>
                      {acilanHamle && (
                        <span className="font-mono-tabular text-[#8B95AB]">
                          Tuş [{acilanHamle.kisayolTusu}] ·{' '}
                          {acilanHamle.temelHasar > 0
                            ? `${acilanHamle.temelHasar} Hasar`
                            : 'Savunma'}{' '}
                          · {acilanHamle.staminaMaliyeti} ST
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8B95AB]">
                      {dugum.oncekiYetenekId && (
                        <span>
                          Önceki: {YETENEK_ISIMLERI[dugum.oncekiYetenekId] ?? dugum.oncekiYetenekId}
                        </span>
                      )}
                      {statSartMetni && <span>Şart: {statSartMetni}</span>}
                      {!dugum.oncekiYetenekId && !statSartMetni && (
                        <span>Başlangıç düğümü</span>
                      )}
                    </div>
                  </div>

                  {/* Sağ Aksiyon / Durum Alanı */}
                  <div className="shrink-0 flex sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-1 sm:pt-0">
                    {acikMi ? (
                      <span className="inline-flex items-center gap-1.5 border border-[#3D8C66]/60 bg-[#12221D] px-3 py-1.5 text-xs font-semibold text-[#6CC296]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Açık</span>
                      </span>
                    ) : acilabilir ? (
                      <button
                        type="button"
                        data-testid={`unlock-skill-${dugum.id}`}
                        onClick={() => {
                          playSfx('yetenek_ac');
                          onYetenekAc(dugum.id);
                        }}
                        className="min-h-[42px] px-4 py-2 text-xs font-bold bg-[#D99B38] hover:bg-[#E5AC4E] text-[#0B0E17] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Yeteneği Aç (-{dugum.puanMaliyeti} YP)
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 border border-[#273147] bg-[#0B0E17] px-2.5 py-1.5 text-[11px] font-medium text-[#8B95AB]">
                        <Lock className="w-3.5 h-3.5 text-[#D99B38] shrink-0" />
                        <span>{kontrol.neden ?? 'Kilitli'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
