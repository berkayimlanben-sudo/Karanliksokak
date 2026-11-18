import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, Swords, Volume2, VolumeX, Zap } from 'lucide-react';
import { HAMLE_LISTESI, RakipTanimi } from '../data/gameData';
import { dovusAdimi, dovusBaslat, DovusDurumu, oyuncuHamleSec } from '../game/combat';
import { MacSonucOzeti, OyunDurumu } from '../game/engine';
import { sesAcikMi, sesCal, sesTercihiDegistir, titresimTetikle } from '../game/sound';
import { ArenaCombatCanvas } from './ArenaCombatCanvas';

interface ArenaCombatViewProps {
  oyun: OyunDurumu;
  rakip: RakipTanimi;
  onMacBitti: (kazanan: 'oyuncu' | 'rakip' | 'berabere') => MacSonucOzeti;
  onArenadanCik: () => void;
}

const TARZ_ETIKETI = {
  saldirgan: 'Saldırgan',
  cevik: 'Çevik',
  savunmaci: 'Savunmacı',
} as const;

const HAMLE_HARITASI = new Map(HAMLE_LISTESI.map((h) => [h.id, h]));
const TUS_HAMLE_HARITASI = new Map(
  HAMLE_LISTESI.map((h) => [h.kisayolTusu.toUpperCase(), h.id])
);

/**
 * ============================================================================
 * B AŞAMASI: GERÇEK ZAMANLI DÖVÜŞ EKRANI
 * Otomatik akan gerçek zamanlı maçı çalıştırır; oyuncu soğuma süresi ve
 * stamina maliyetli hamle butonlarıyla (veya 1-7 tuşlarıyla) müdahale eder.
 * ============================================================================
 */
export const ArenaCombatView: React.FC<ArenaCombatViewProps> = ({
  oyun,
  rakip,
  onMacBitti,
  onArenadanCik,
}) => {
  const [gorunum, setGorunum] = useState<DovusDurumu>(() => dovusBaslat(oyun, rakip));
  const dovusRef = useRef<DovusDurumu>(gorunum);
  const [sonucOzeti, setSonucOzeti] = useState<MacSonucOzeti | null>(null);
  const [sesAcik, setSesAcik] = useState<boolean>(() => sesAcikMi());
  const sonucIslendiRef = useRef(false);
  const onMacBittiRef = useRef(onMacBitti);
  const sonIslenenSayiIdRef = useRef(0);
  const oncekiDurumRef = useRef<DovusDurumu['durum']>('devam_ediyor');

  useEffect(() => {
    onMacBittiRef.current = onMacBitti;
  }, [onMacBitti]);

  // Maç başlangıç gong sesi
  useEffect(() => {
    sesCal('gong');
  }, []);

  const efektleriIsle = useCallback((durum: DovusDurumu) => {
    let nakavtCaldi = false;
    for (const s of durum.yuzenSayilar) {
      if (s.id <= sonIslenenSayiIdRef.current) continue;
      sonIslenenSayiIdRef.current = s.id;
      switch (s.efekt) {
        case 'mukemmel':
          sesCal('mukemmel');
          titresimTetikle(32);
          break;
        case 'kombo':
          sesCal('kombo');
          titresimTetikle(35);
          break;
        case 'sert_yumruk':
          sesCal('sert_yumruk');
          titresimTetikle(35);
          break;
        case 'blok':
          sesCal('blok');
          titresimTetikle(22);
          break;
        case 'kacinma':
          sesCal('kacinma');
          titresimTetikle(20);
          break;
        case 'yumruk':
          sesCal('yumruk');
          titresimTetikle(22);
          break;
        case 'nakavt':
          sesCal('nakavt');
          titresimTetikle(45);
          nakavtCaldi = true;
          break;
      }
    }

    if (oncekiDurumRef.current !== 'ko_yavaslatma' && durum.durum === 'ko_yavaslatma') {
      if (!nakavtCaldi) {
        sesCal('nakavt');
        titresimTetikle(45);
      }
    }
    oncekiDurumRef.current = durum.durum;
  }, []);

  const handleSesDegistir = useCallback(() => {
    const yeni = sesTercihiDegistir();
    setSesAcik(yeni);
    if (yeni) {
      sesCal('tik');
    }
  }, []);

  const hamleTetikle = useCallback((hamleId: string) => {
    const onceki = dovusRef.current;
    const guncel = oyuncuHamleSec(onceki, hamleId);
    if (guncel === onceki) return;
    dovusRef.current = guncel;
    setGorunum(guncel);

    const hamle = HAMLE_HARITASI.get(hamleId);
    if ((hamle?.staminaToparlanma ?? 0) > 0) {
      sesCal('blok');
      titresimTetikle(20);
    } else if (hamle?.tur === 'kacinma') {
      sesCal('kacinma');
      titresimTetikle(20);
    } else {
      sesCal('tik');
    }
  }, []);

  // Klavye kısayolları (1..0, Q, W, E)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const hamleId = TUS_HAMLE_HARITASI.get(e.key.toUpperCase());
      if (hamleId) {
        e.preventDefault();
        hamleTetikle(hamleId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hamleTetikle]);

  // Gerçek zamanlı döngü (60Hz canvas ref güncellemesi, ~16Hz React HUD güncellemesi)
  useEffect(() => {
    let rafId = 0;
    let onceki = performance.now();
    let sonUiGuncelleme = 0;

    const adim = (simdi: number) => {
      const dtMs = Math.min(Math.max(simdi - onceki, 0), 50);
      onceki = simdi;

      const mevcut = dovusRef.current;
      if (mevcut.durum !== 'bitti') {
        const sonraki = dovusAdimi(mevcut, dtMs);
        dovusRef.current = sonraki;
        efektleriIsle(sonraki);

        if (sonraki.durum === 'bitti' && sonraki.kazanan && !sonucIslendiRef.current) {
          sonucIslendiRef.current = true;
          const ozet = onMacBittiRef.current(sonraki.kazanan);
          setSonucOzeti(ozet);
          setGorunum(sonraki);
          return;
        }

        if (simdi - sonUiGuncelleme >= 65 || sonraki.durum !== mevcut.durum) {
          sonUiGuncelleme = simdi;
          setGorunum(sonraki);
        }
      }

      rafId = requestAnimationFrame(adim);
    };

    rafId = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(rafId);
  }, [efektleriIsle]);

  const { oyuncu, rakip: rakipDurum } = gorunum;

  return (
    <div
      data-testid="arena-combat-view"
      className="min-h-[100dvh] w-full bg-[#0B0E17] text-[#EAECEF] flex flex-col items-center justify-center p-2.5 sm:p-5"
    >
      <div className="w-full max-w-4xl border border-[#273147] bg-[#121724] flex flex-col">
        {/* Üst Eşleşme Şeridi */}
        <header className="border-b border-[#273147] bg-[#0B0E17] px-3 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Swords className="w-4 h-4 text-[#D63838] shrink-0" />
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-wide truncate">
              {oyuncu.lakap} vs {rakip.lakap}
            </h1>
            <span className="text-[11px] border border-[#273147] bg-[#121724] px-2 py-0.5 text-[#D99B38] shrink-0">
              {TARZ_ETIKETI[rakip.tarz]}
            </span>
            {(gorunum.rakipCekinmeYuzde ?? 0) > 0 && (
              <span
                data-testid="opponent-intimidated-badge"
                className="text-[11px] border border-[#D63838]/60 bg-[#221417] px-2 py-0.5 text-[#E34A4A] font-semibold shrink-0"
              >
                Çekiniyor -%{gorunum.rakipCekinmeYuzde} Stam
              </span>
            )}
            {gorunum.oyuncuHazirlikCezasiMetni && (
              <span
                data-testid="player-prep-debuff-badge"
                className="text-[11px] border border-[#D99B38]/60 bg-[#1D170E] px-2 py-0.5 text-[#D99B38] font-semibold shrink-0"
              >
                {gorunum.oyuncuHazirlikCezasiMetni}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono-tabular">
            <span data-testid="player-hp" className="text-[#EAECEF]">
              Sen: {Math.ceil(oyuncu.can)}/{oyuncu.maksCan}
            </span>
            <span data-testid="opponent-hp" className="text-[#8B95AB]">
              Rakip: {Math.ceil(rakipDurum.can)}/{rakipDurum.maksCan}
            </span>
            <button
              type="button"
              data-testid="sound-toggle-btn"
              onClick={handleSesDegistir}
              aria-label={sesAcik ? 'Sesi Kapat' : 'Sesi Aç'}
              title={sesAcik ? 'Ses Açık' : 'Ses Kapalı'}
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center border border-[#273147] bg-[#121724] hover:border-[#3A4766] text-[#EAECEF] transition-colors cursor-pointer"
            >
              {sesAcik ? (
                <Volume2 className="w-4 h-4 text-[#D99B38]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8B95AB]" />
              )}
            </button>
          </div>
        </header>

        {/* Gerçek Zamanlı Pixel Art Arena Sahnesi */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full bg-[#090D1A] border-b border-[#273147]">
          <ArenaCombatCanvas dovusRef={dovusRef} />
        </div>

        {/* Tek Satır Canlı Dövüş Akışı */}
        <div className="border-b border-[#273147] bg-[#0B0E17] px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#EAECEF] font-medium truncate">{gorunum.sonOlayMetni}</p>
          <div className="flex items-center gap-2.5 font-mono-tabular shrink-0">
            {(oyuncu.komboZincirSayisi ?? 0) >= 1 && (oyuncu.komboSuresiKalanMs ?? 0) > 0 && (
              <span className="text-[#6CC296] font-semibold">
                Kombo x{oyuncu.komboZincirSayisi}
              </span>
            )}
            {oyuncu.yavasladiMi && (
              <span
                data-testid="player-slowed-badge"
                className="border border-[#D63838]/60 bg-[#221417] px-1.5 py-0.5 text-[10px] font-semibold text-[#E34A4A]"
              >
                Nefes Kesildi · Yavaş
              </span>
            )}
            <span className="text-[#D99B38]">
              Stamina: {Math.round(oyuncu.stamina)}/{oyuncu.maksStamina}
            </span>
          </div>
        </div>

        {/* Alt Bölüm: Ya Hamle Kontrol Tuşları Ya Da Maç Sonucu */}
        {gorunum.durum === 'bitti' && sonucOzeti ? (
          <div
            data-testid="combat-result"
            className="p-4 sm:p-6 space-y-4 bg-[#121724]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    sonucOzeti.kazanan === 'oyuncu'
                      ? 'text-[#6CC296]'
                      : sonucOzeti.kazanan === 'berabere'
                        ? 'text-[#D99B38]'
                        : 'text-[#E34A4A]'
                  }`}
                >
                  {sonucOzeti.kazanan === 'oyuncu'
                    ? 'Sokak Zaferi'
                    : sonucOzeti.kazanan === 'berabere'
                      ? 'Berabere Karar'
                      : 'Mağlubiyet'}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-[#EAECEF] mt-0.5">
                  {sonucOzeti.kazanan === 'oyuncu'
                    ? `${rakip.lakap} Devrildi!`
                    : sonucOzeti.kazanan === 'berabere'
                      ? 'Süre Doldu — Başa Baş'
                      : `${rakip.lakap} Üstün Geldi`}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-xs text-[#8B95AB]">
                {(sonucOzeti.yetenekPuaniDegisimi ?? 0) > 0 && (
                  <span
                    data-testid="match-skill-point-reward"
                    className="border border-[#D99B38]/60 bg-[#1D170E] px-2 py-0.5 text-[#D99B38] font-bold"
                  >
                    +{sonucOzeti.yetenekPuaniDegisimi} Yetenek Puanı
                  </span>
                )}
                <span>
                  İsabet: {oyuncu.vurduguIsabet} · Kaçınma: {oyuncu.kacindigiSayi}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="border border-[#273147] bg-[#0B0E17] p-3">
                <p className="text-[11px] text-[#8B95AB]">Para Kazancı</p>
                <p className="font-mono-tabular text-base sm:text-lg font-bold text-[#6CC296] mt-0.5">
                  +{sonucOzeti.paraDegisimi} ₺
                </p>
              </div>
              <div className="border border-[#273147] bg-[#0B0E17] p-3">
                <p className="text-[11px] text-[#8B95AB]">Saygı / Korku</p>
                <p className="font-mono-tabular text-sm sm:text-base font-bold text-[#D99B38] mt-0.5">
                  {(sonucOzeti.saygiDegisimi ?? 0) >= 0
                    ? `+${sonucOzeti.saygiDegisimi ?? 0}`
                    : sonucOzeti.saygiDegisimi}{' '}
                  S /{' '}
                  {(sonucOzeti.korkuDegisimi ?? 0) >= 0
                    ? `+${sonucOzeti.korkuDegisimi ?? 0}`
                    : sonucOzeti.korkuDegisimi}{' '}
                  K
                </p>
              </div>
              <div className="border border-[#273147] bg-[#0B0E17] p-3">
                <p className="text-[11px] text-[#8B95AB]">Moral</p>
                <p
                  className={`font-mono-tabular text-base sm:text-lg font-bold mt-0.5 ${
                    sonucOzeti.moralDegisimi >= 0 ? 'text-[#6CC296]' : 'text-[#E34A4A]'
                  }`}
                >
                  {sonucOzeti.moralDegisimi >= 0
                    ? `+${sonucOzeti.moralDegisimi}`
                    : sonucOzeti.moralDegisimi}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-[#A3ACBE]">
                Sokak tecrübesi: <span className="text-[#EAECEF] font-semibold">{sonucOzeti.statNotu}</span>
              </p>
              <button
                type="button"
                data-testid="exit-arena-btn"
                onClick={onArenadanCik}
                className="min-h-[44px] px-6 py-2.5 bg-[#D63838] hover:bg-[#E34A4A] text-white font-display text-lg font-bold tracking-wide transition-colors cursor-pointer"
              >
                Arenadan Çık
              </button>
            </div>
          </div>
        ) : (
          (() => {
            const gorunenHamleler = HAMLE_LISTESI.filter(
              (h) => (!h.yetenekId && !h.hocaDersId) || oyuncu.acikHamleIds.includes(h.id)
            );
            const saldiriHamleleri = gorunenHamleler.filter((h) => h.tur !== 'kacinma');
            const savunmaHamleleri = gorunenHamleler.filter((h) => h.tur === 'kacinma');

            const hamleButonuRender = (hamle: (typeof HAMLE_LISTESI)[number]) => {
              const acik = oyuncu.acikHamleIds.includes(hamle.id);
              const kalanBekleme = oyuncu.beklemeSureleri[hamle.id] ?? 0;
              const beklemeOrani = Math.min(
                100,
                Math.round((kalanBekleme / Math.max(1, hamle.beklemeSuresiMs)) * 100)
              );
              const staminaYeterli = oyuncu.stamina >= hamle.staminaMaliyeti;
              const siradaMi = oyuncu.siraHamleId === hamle.id;
              const blokTuru = (hamle.staminaToparlanma ?? 0) > 0;
              const aktifSavunma =
                (blokTuru && oyuncu.blokKalanMs > 0) ||
                (hamle.tur === 'kacinma' && !blokTuru && oyuncu.kacinmaKalanMs > 0);
              const tiklanabilir =
                gorunum.durum === 'devam_ediyor' &&
                acik &&
                kalanBekleme <= 0 &&
                staminaYeterli;

              return (
                <button
                  key={hamle.id}
                  type="button"
                  data-testid={`move-btn-${hamle.id}`}
                  data-move-group={hamle.tur === 'kacinma' ? 'savunma' : 'saldiri'}
                  disabled={!tiklanabilir}
                  onClick={() => hamleTetikle(hamle.id)}
                  className={`relative overflow-hidden min-h-[54px] px-2.5 py-2 border text-left transition-colors ${
                    !acik
                      ? 'border-[#273147] bg-[#0B0E17] text-[#5B657A] cursor-not-allowed'
                      : siradaMi || aktifSavunma
                        ? 'border-[#D99B38] bg-[#221D15] text-[#EAECEF] cursor-pointer'
                        : tiklanabilir
                          ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D63838] hover:bg-[#222B42] text-[#EAECEF] cursor-pointer'
                          : 'border-[#273147] bg-[#0D1019] text-[#6B768F] cursor-not-allowed'
                  }`}
                >
                  {/* Soğuma doluluk şeridi */}
                  {kalanBekleme > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 bg-[#D63838]/20 pointer-events-none"
                      style={{ width: `${beklemeOrani}%` }}
                    />
                  )}

                  <div className="relative flex items-center justify-between gap-1">
                    <span className="font-display text-sm sm:text-base font-bold leading-none truncate">
                      {hamle.isim}
                    </span>
                    <span className="font-mono-tabular text-[10px] text-[#8B95AB] shrink-0">
                      [{hamle.kisayolTusu}]
                    </span>
                  </div>

                  <div className="relative mt-1.5 flex items-center justify-between gap-1 text-[10px] font-mono-tabular text-[#8B95AB]">
                    {!acik ? (
                      <span className="text-[#D99B38]">Kilitli</span>
                    ) : kalanBekleme > 0 ? (
                      <span className="text-[#E34A4A]">
                        {(kalanBekleme / 1000).toFixed(1)}s
                      </span>
                    ) : hamle.tur === 'kacinma' ? (
                      <span className="inline-flex items-center gap-0.5 text-[#5B82B8]">
                        <Shield className="w-3 h-3" />
                        {blokTuru ? '+Nefes' : 'Sıyrıl'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[#D99B38]">
                        <Zap className="w-3 h-3" />
                        {hamle.temelHasar} Has
                      </span>
                    )}

                    <span>
                      {hamle.staminaMaliyeti > 0 ? `${hamle.staminaMaliyeti} ST` : '0 ST'}
                    </span>
                  </div>
                </button>
              );
            };

            return (
              <div className="p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#8B95AB]">
                  <span>
                    Dövüş otomatik akar; tuşlara basarak sıradaki saldırıyı seç ya da anında blok/kaçınma yap.
                  </span>
                  <span className="hidden sm:inline font-mono-tabular">
                    Kısayol: {gorunenHamleler.map((h) => h.kisayolTusu).join(' · ')}
                  </span>
                </div>

                <div
                  data-testid="move-grid"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  <div className="flex flex-col gap-2 sm:contents">
                    <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider text-[#D99B38]">
                      Saldırı (Sol)
                    </span>
                    {saldiriHamleleri.map(hamleButonuRender)}
                  </div>

                  <div className="flex flex-col gap-2 sm:contents">
                    <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wider text-[#5B82B8]">
                      Savunma (Sağ)
                    </span>
                    {savunmaHamleleri.map(hamleButonuRender)}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
