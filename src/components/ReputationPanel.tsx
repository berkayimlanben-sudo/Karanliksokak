import React, { useMemo } from 'react';
import { AlertTriangle, Check, Heart, Lock, Scale, ShieldCheck, Skull } from 'lucide-react';
import { AHLAKI_GRI_OLAYLAR, ITIBAR_ESIKLERI, ITIBAR_SABITLERI } from '../data/gameData';
import {
  aileRuhHaliGetir,
  hesaplaTuretilmisDegerler,
  metinSablonunuDoldur,
  OyunDurumu,
} from '../game/engine';

interface ReputationPanelProps {
  state: OyunDurumu;
}

/**
 * ============================================================================
 * C3 AŞAMASI: İTİBAR (SAYGI / KORKU) VE AHLAKİ SEÇİMLER PANELİ
 * İki ayrı itibar eksenini, eşik fırsatlarını, aile bağını ve yapılan
 * ahlaki gri seçimlerin özetini net biçimde gösterir.
 * ============================================================================
 */
export const ReputationPanel: React.FC<ReputationPanelProps> = ({ state }) => {
  const turetilmis = useMemo(() => hesaplaTuretilmisDegerler(state), [state]);
  const aileRuhHali = useMemo(() => aileRuhHaliGetir(state), [state]);

  const saygi = state.itibar?.saygi ?? 0;
  const korku = state.itibar?.korku ?? 0;
  const aileIliskisi = state.aileIliskisi ?? 60;
  const ahlakiSecimler = state.ahlakiSecimler ?? [];

  const secimOzetleri = useMemo(() => {
    const liste: Array<{ olayBaslik: string; secenekEtiket: string; sonucMetni: string }> = [];
    for (const olay of AHLAKI_GRI_OLAYLAR) {
      for (const secenek of olay.secenekler) {
        if (ahlakiSecimler.includes(secenek.id)) {
          liste.push({
            olayBaslik: olay.baslik,
            secenekEtiket: metinSablonunuDoldur(secenek.etiket, state),
            sonucMetni: metinSablonunuDoldur(secenek.sonucMetni, state),
          });
        }
      }
    }
    return liste;
  }, [ahlakiSecimler, state]);

  return (
    <div data-testid="reputation-panel" className="space-y-4">
      {/* İki Ayrı İtibar Değeri: Saygı & Korku */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          data-testid="rep-saygi-card"
          className="border border-[#273147] bg-[#121724] p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6CC296] shrink-0" />
              <h3 className="font-display text-lg font-bold text-[#EAECEF]">Saygı</h3>
            </div>
            <span className="font-mono-tabular text-lg font-extrabold text-[#6CC296]">
              {saygi}
              <span className="text-xs font-normal text-[#8B95AB]">/{ITIBAR_SABITLERI.maksItibar}</span>
            </span>
          </div>

          <div className="h-2 bg-[#0B0E17] border border-[#273147] relative">
            <div
              className="h-full bg-[#3D8C66] transition-all duration-200"
              style={{ width: `${Math.min(100, saygi)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#8B95AB]">
            <span>Eşik: 12 / 22</span>
            <span className="text-[#6CC296] font-semibold">
              Sv.{turetilmis.saygiSeviyesi}/2
              {turetilmis.marketIndirimYuzde > 0
                ? ` · %${turetilmis.marketIndirimYuzde} Market`
                : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            <span className="border border-[#3D8C66]/40 bg-[#12221D] px-1.5 py-0.5 text-[#6CC296]">
              12+: %15 İndirim + Dayanışma
            </span>
            <span className="border border-[#3D8C66]/40 bg-[#12221D] px-1.5 py-0.5 text-[#6CC296]">
              22+: %25 İndirim + Esnaf İşi
            </span>
          </div>
        </div>

        <div
          data-testid="rep-korku-card"
          className="border border-[#273147] bg-[#121724] p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-[#E34A4A] shrink-0" />
              <h3 className="font-display text-lg font-bold text-[#EAECEF]">Korku</h3>
            </div>
            <span className="font-mono-tabular text-lg font-extrabold text-[#E34A4A]">
              {korku}
              <span className="text-xs font-normal text-[#8B95AB]">/{ITIBAR_SABITLERI.maksItibar}</span>
            </span>
          </div>

          <div className="h-2 bg-[#0B0E17] border border-[#273147] relative">
            <div
              className="h-full bg-[#D63838] transition-all duration-200"
              style={{ width: `${Math.min(100, korku)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#8B95AB]">
            <span>Eşik: 12 / 22</span>
            <span className="text-[#E34A4A] font-semibold">
              Sv.{turetilmis.korkuSeviyesi}/2
              {turetilmis.haracCeteIsiAcik ? ' · Çete İşi Açık' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            <span className="border border-[#D63838]/40 bg-[#221417] px-1.5 py-0.5 text-[#E34A4A]">
              Çetin 12+ · Emir 20+
            </span>
            <span className="border border-[#D63838]/40 bg-[#221417] px-1.5 py-0.5 text-[#E34A4A]">
              Serkan 30+ · Halil 45+
            </span>
            <span className="border border-[#D99B38]/40 bg-[#1D170E] px-1.5 py-0.5 text-[#D99B38]">
              22+: Çete Tahsilatı
            </span>
          </div>
        </div>
      </div>

      {/* Gerilim & Telafi Notu */}
      <div className="border border-[#D99B38]/40 bg-[#1B1610] px-3.5 py-2.5 flex items-center gap-2.5 text-xs">
        <Scale className="w-4 h-4 text-[#D99B38] shrink-0" />
        <p className="text-[#D0D6E2] leading-snug">
          <strong className="text-[#D99B38]">Denge:</strong> Korku arttıkça yüksek Saygı aşınır; Saygı arttıkça Korku yumuşar. Aile, depo işi ve Ring Tavrı ile telafi edilir.
        </p>
      </div>

      {/* İtibar Eşikleri */}
      <section className="space-y-2">
        <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
          İtibar Eşikleri ve Fırsatlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {ITIBAR_ESIKLERI.map((esik) => {
            const mevcut = esik.tur === 'saygi' ? saygi : korku;
            const acik = mevcut >= esik.esikDeger;
            const isSaygi = esik.tur === 'saygi';

            return (
              <div
                key={esik.id}
                data-testid={`threshold-${esik.id}`}
                className={`border p-3 space-y-1.5 ${
                  acik
                    ? isSaygi
                      ? 'border-[#3D8C66]/70 bg-[#101C18]'
                      : 'border-[#D63838]/70 bg-[#1D1216]'
                    : 'border-[#273147] bg-[#0B0E17]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold text-[#EAECEF]">
                    {esik.baslik}
                  </span>
                  {acik ? (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border ${
                        isSaygi
                          ? 'border-[#3D8C66] bg-[#12221D] text-[#6CC296]'
                          : 'border-[#D63838] bg-[#221417] text-[#E34A4A]'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      AÇIK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono-tabular border border-[#273147] bg-[#121724] text-[#8B95AB]">
                      <Lock className="w-3 h-3" />
                      {mevcut}/{esik.esikDeger}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A3ACBE] leading-snug">{esik.aciklama}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Aile İlişkisi ve Ev Atmosferi */}
      <section className="border border-[#273147] bg-[#121724] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart
              className={`w-4 h-4 shrink-0 ${
                aileRuhHali.ton === 'gergin'
                  ? 'text-[#E34A4A]'
                  : aileRuhHali.ton === 'sicak'
                    ? 'text-[#6CC296]'
                    : 'text-[#D99B38]'
              }`}
            />
            <h3 className="font-display text-lg font-bold text-[#EAECEF]">
              Evdeki Hava: {aileRuhHali.etiket}
            </h3>
          </div>
          <span className="font-mono-tabular text-xs font-bold text-[#EAECEF] border border-[#273147] bg-[#0B0E17] px-2 py-0.5">
            Aile Bağı: {aileIliskisi}/100
          </span>
        </div>
        <p className="text-xs text-[#C8CFDC] leading-snug">{aileRuhHali.aciklama}</p>
      </section>

      {/* Yapılan Ahlaki Seçimler */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
            Ahlaki Seçimlerin
          </h3>
          <span className="font-mono-tabular text-[11px] text-[#8B95AB]">
            {secimOzetleri.length}/{AHLAKI_GRI_OLAYLAR.length} İkilem
          </span>
        </div>

        {secimOzetleri.length === 0 ? (
          <div className="border border-[#273147] bg-[#0B0E17] p-3 text-xs text-[#8B95AB] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D99B38] shrink-0" />
            <span>
              Günler ilerledikçe mahallede doğru cevabı olmayan gri ikilemlerle karşılaşacaksın. Kararların burada iz bırakır.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {secimOzetleri.map((kayit) => (
              <div
                key={kayit.olayBaslik}
                className="border border-[#273147] bg-[#0B0E17] p-3 space-y-1"
              >
                <p className="text-xs font-bold text-[#D99B38]">{kayit.olayBaslik}</p>
                <p className="text-xs font-semibold text-[#EAECEF]">{kayit.secenekEtiket}</p>
                <p className="text-[11px] text-[#8B95AB]">{kayit.sonucMetni}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
