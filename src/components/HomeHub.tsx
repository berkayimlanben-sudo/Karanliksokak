import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Dumbbell,
  Home,
  Moon,
  RotateCcw,
  ShoppingBasket,
  Swords,
  Utensils,
} from 'lucide-react';
import {
  AILE_UYELERI,
  ANTRENOR_DERSLERI,
  ANTRENOR_LISTESI,
  DOVUS_SABITLERI,
  EK_IS_TANIMLARI,
  EV_ESYALARI_LISTESI,
  EV_SEVIYELERI,
  ITIBAR_SABITLERI,
  MEKAN_TANIMLARI,
  RAKIP_LISTESI,
  SAAT_SABITLERI,
  STAT_TANIMLARI,
  StatId,
  YEMEK_LISTESI,
} from '../data/gameData';
import {
  aileRuhHaliGetir,
  aktifDebufflariGetir,
  hesaplaTuretilmisDegerler,
  hocaDersiAlinabilirMi,
  indirimliMarketFiyati,
  komsuItibarYorumuGetir,
  macaGirilebilirMi,
  mekandakiMusaitKomsuOlaylari,
  metinSablonunuDoldur,
  OyunDurumu,
  rakipCekinmeHesapla,
  RingTavri,
  saatMetni,
} from '../game/engine';
import { playSfx } from '../game/sound';
import { MekanId } from '../game/theme';
import { NeighborhoodCanvas } from './NeighborhoodCanvas';
import { MovesPanel } from './MovesPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { ReputationPanel } from './ReputationPanel';
import { EventModal } from './EventModal';
import { AudioControls } from './AudioControls';

interface HomeHubProps {
  state: OyunDurumu;
  onMekanaGit: (hedefMekan: MekanId) => void;
  onAntrenman: (statId: StatId, secenek?: { ucretsizEv?: boolean }) => void;
  onSokakGolgeBoksu: () => void;
  onVardiya: (isId: string) => void;
  onYemek: (yemekId: string) => void;
  onAcilCorba: () => void;
  onAileEtkiles: (uyeId: 'anne_emine' | 'kardes_elif') => void;
  onEvEsyasiAl: (esyaId: string) => void;
  onEvYukselt: () => void;
  onUyuVeGunuBitir: () => void;
  onOlaySecenegi: (secenekId: string) => void;
  onHocaDersiAl: (dersId: string) => void;
  onKomsuEtkiles: (komsuId: string) => void;
  onKomsuSecenegi: (secenekId: string) => void;
  onYetenekAc: (yetenekId: string) => void;
  onKomsuDayanisma: () => void;
  onRingTavriDegistir: (tavir: RingTavri) => void;
  onMacaBasla: (rakipId: string) => void;
  onSifirla: () => void;
}

const BILDIRIM_ETIKETI = {
  bilgi: 'Durum',
  uyari: 'Uyarı',
  basari: 'Gelişme',
  olay: 'Olay',
} as const;

const MEKAN_IKONU: Record<MekanId, React.ComponentType<{ className?: string }>> = {
  ev: Home,
  spor_salonu: Dumbbell,
  market: ShoppingBasket,
  is_yeri: Briefcase,
  sokak_arena: Swords,
};

/**
 * ============================================================================
 * ANA OYUN EKRANI (PUNCH CLUB TARZI MEKAN, ZAMAN VE EV YÖNETİMİ)
 * Sol/Üstte pixel art sahne, ihtiyaç barları ve 5 mekan seçicisi;
 * Sağ/Altta aktif mekanın aktiviteleri yer alır.
 * ============================================================================
 */
export const HomeHub: React.FC<HomeHubProps> = ({
  state,
  onMekanaGit,
  onAntrenman,
  onSokakGolgeBoksu,
  onVardiya,
  onYemek,
  onAcilCorba,
  onAileEtkiles,
  onEvEsyasiAl,
  onEvYukselt,
  onUyuVeGunuBitir,
  onOlaySecenegi,
  onHocaDersiAl,
  onKomsuEtkiles,
  onKomsuSecenegi,
  onYetenekAc,
  onKomsuDayanisma,
  onRingTavriDegistir,
  onMacaBasla,
  onSifirla,
}) => {
  const [sagGorunum, setSagGorunum] = useState<
    'mekan' | 'hamleler' | 'yetenek_agaci' | 'itibar'
  >('mekan');
  const [aksiyonDarbesi, setAksiyonDarbesi] = useState(0);
  const [sonAksiyonTuru, setSonAksiyonTuru] = useState<StatId>('guc');
  const [sifirlamaOnayi, setSifirlamaOnayi] = useState(false);
  const sagPanelRef = useRef<HTMLElement | null>(null);
  const prevParaRef = useRef(state.para);
  const prevGunRef = useRef(state.gun);
  const prevKiraUyariRef = useRef(state.kiraUyariSayisi);

  useEffect(() => {
    sagPanelRef.current?.scrollTo({ top: 0 });
  }, [state.aktifMekan, sagGorunum]);

  const turetilmis = useMemo(() => hesaplaTuretilmisDegerler(state), [state]);

  useEffect(() => {
    if (state.para > prevParaRef.current) {
      playSfx('para_kazanma');
    }
    if (state.gun > prevGunRef.current) {
      const kiraUyariTetiklendi =
        state.kiraUyariSayisi > prevKiraUyariRef.current ||
        (turetilmis.kirayaKalanGun <= 2 && turetilmis.kiraEksikTutar > 0);
      playSfx(kiraUyariTetiklendi ? 'kira_uyarisi' : 'gun_sonu');
    }
    prevParaRef.current = state.para;
    prevGunRef.current = state.gun;
    prevKiraUyariRef.current = state.kiraUyariSayisi;
  }, [
    state.para,
    state.gun,
    state.kiraUyariSayisi,
    turetilmis.kirayaKalanGun,
    turetilmis.kiraEksikTutar,
  ]);
  const aktifDebufflar = useMemo(() => aktifDebufflariGetir(state), [state]);
  const aileRuhHali = useMemo(() => aileRuhHaliGetir(state), [state]);
  const { mevcutEv, sonrakiEv } = turetilmis;
  const macHazirlik = useMemo(() => macaGirilebilirMi(state), [state]);
  const aktifMekanTanimi = useMemo(
    () => MEKAN_TANIMLARI.find((m) => m.id === state.aktifMekan) ?? MEKAN_TANIMLARI[0],
    [state.aktifMekan]
  );

  const mekanKomsuListesi = useMemo(
    () => mekandakiMusaitKomsuOlaylari(state, state.aktifMekan),
    [state]
  );

  const mekanHazirKomsuSayisi = useMemo(() => {
    const sayilar: Record<MekanId, number> = {
      ev: 0,
      spor_salonu: 0,
      market: 0,
      is_yeri: 0,
      sokak_arena: 0,
    };
    for (const mId of ['ev', 'market', 'sokak_arena'] as const) {
      sayilar[mId] = mekandakiMusaitKomsuOlaylari(state, mId).filter((k) => Boolean(k.olay)).length;
    }
    return sayilar;
  }, [state]);

  const aktifOlayEngeli = Boolean(state.aktifOlay || state.aktifKomsuOlayi);

  const antrenmanTetikle = (statId: StatId, ucretsizEv = false) => {
    const tanim = STAT_TANIMLARI.find((s) => s.id === statId);
    const girisGerekli = !ucretsizEv && !turetilmis.salonGirisOdendiMi;
    const girisYeterli = !girisGerekli || state.para >= SAAT_SABITLERI.salonGunlukGirisUcreti;

    if (
      tanim &&
      !aktifOlayEngeli &&
      state.enerji >= tanim.enerjiMaliyeti &&
      state.tokluk >= 5 &&
      girisYeterli
    ) {
      setSonAksiyonTuru(statId);
      setAksiyonDarbesi((v) => v + 1);
      playSfx('menu_tik');
    }
    onAntrenman(statId, ucretsizEv ? { ucretsizEv: true } : undefined);
  };

  const hocaDersiTetikle = (dersId: string, antrenorId: string) => {
    const kontrol = hocaDersiAlinabilirMi(state, dersId);
    if (!aktifOlayEngeli && kontrol.alinabilir) {
      setSonAksiyonTuru(antrenorId === 'hoca_muslum' ? 'guc' : 'refleks');
      setAksiyonDarbesi((v) => v + 1);
      playSfx('yetenek_ac');
    }
    onHocaDersiAl(dersId);
  };

  const golgeBoksuTetikle = () => {
    if (!aktifOlayEngeli && state.enerji >= 14) {
      setSonAksiyonTuru('ceviklik');
      setAksiyonDarbesi((v) => v + 1);
      playSfx('menu_tik');
    }
    onSokakGolgeBoksu();
  };

  const mekanSec = (hedefMekan: MekanId) => {
    if (hedefMekan !== state.aktifMekan) {
      playSfx('mekan_gecis');
    } else {
      playSfx('menu_tik');
    }
    setSagGorunum('mekan');
    onMekanaGit(hedefMekan);
  };

  const gorunumAcKapa = (hedef: 'itibar' | 'yetenek_agaci' | 'hamleler') => {
    playSfx('menu_tik');
    setSagGorunum((v) => (v === hedef ? 'mekan' : hedef));
  };

  const acilCorbaMusait =
    state.para < 35 && state.buzdolabiStok === 0 && state.tokluk < 50;

  const komsularBolumuRender = () => {
    if (mekanKomsuListesi.length === 0) return null;

    const turEtiketi = {
      firsat: { yazi: 'Fırsat', renk: 'text-[#6CC296] border-[#3D8C66]/50 bg-[#12221D]' },
      destek: { yazi: 'Destek', renk: 'text-[#D99B38] border-[#D99B38]/40 bg-[#1D170E]' },
      sorun: { yazi: 'Baskı', renk: 'text-[#E34A4A] border-[#D63838]/50 bg-[#221417]' },
    } as const;

    return (
      <section data-testid="neighbors-section" className="space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
            Mahalle & Komşular
          </h3>
          <span className="text-[11px] text-[#8B95AB]">
            Gün ve seçimlere göre hikaye olayları açılır
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {mekanKomsuListesi.map((item) => {
            const { komsu, olay, sonrakiAdimKosulu, tamamlandiMi, mevcutAdim, toplamAdim } = item;
            const rozet = turEtiketi[komsu.karakterTuru];

            let beklemeMetni = 'Şimdilik yeni bir gelişme yok';
            if (tamamlandiMi) {
              beklemeMetni = 'Hikaye tamamlandı';
            } else if (sonrakiAdimKosulu) {
              if (!sonrakiAdimKosulu.mekanlar.includes(state.aktifMekan)) {
                const mekanAdi =
                  MEKAN_TANIMLARI.find((m) => sonrakiAdimKosulu.mekanlar.includes(m.id))?.kisaAd ??
                  'Diğer Mekan';
                beklemeMetni = `${mekanAdi} tarafında bekliyor`;
              } else if (sonrakiAdimKosulu.kosul.minGun && state.gun < sonrakiAdimKosulu.kosul.minGun) {
                beklemeMetni = `Gün ${sonrakiAdimKosulu.kosul.minGun}+ açılır`;
              } else if (
                sonrakiAdimKosulu.kosul.minMacGalibiyet &&
                (state.macKazanmaSayisi ?? 0) < sonrakiAdimKosulu.kosul.minMacGalibiyet
              ) {
                beklemeMetni = `${sonrakiAdimKosulu.kosul.minMacGalibiyet} galibiyet gerekir`;
              }
            }

            return (
              <div
                key={komsu.id}
                data-testid={`neighbor-card-${komsu.id}`}
                className={`border p-3 flex flex-col justify-between gap-2.5 ${
                  olay
                    ? 'border-[#D99B38] bg-[#161925]'
                    : 'border-[#273147] bg-[#121724]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-display text-base sm:text-lg font-bold text-[#EAECEF] block leading-tight">
                        {komsu.isim}
                      </span>
                      <span className="text-[11px] text-[#8B95AB]">
                        {komsu.rol} · Hitap: {metinSablonunuDoldur(komsu.hitapSekli, state)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`border px-1.5 py-0.5 text-[10px] font-semibold ${rozet.renk}`}>
                        {rozet.yazi}
                      </span>
                      <span className="font-mono-tabular text-[10px] border border-[#273147] bg-[#0B0E17] px-1.5 py-0.5 text-[#A3ACBE]">
                        {mevcutAdim}/{toplamAdim}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#C8CFDC] mt-1.5 leading-snug">{komsu.kisaNot}</p>
                  {(() => {
                    const itibarYorumu = komsuItibarYorumuGetir(komsu.id, state);
                    if (!itibarYorumu) return null;
                    return (
                      <p className="text-[11px] italic text-[#D99B38] border-l-2 border-[#D99B38]/60 pl-2 mt-1.5 leading-snug">
                        {itibarYorumu}
                      </p>
                    );
                  })()}
                </div>

                {olay ? (
                  <button
                    type="button"
                    data-testid={`neighbor-talk-${komsu.id}`}
                    onClick={() => {
                      playSfx('menu_tik');
                      onKomsuEtkiles(komsu.id);
                    }}
                    className="min-h-[42px] w-full px-3 py-2 text-xs font-bold bg-[#D99B38] hover:bg-[#E5AC4E] text-[#0B0E17] transition-colors cursor-pointer text-left flex items-center justify-between gap-2"
                  >
                    <span className="truncate">Görüş: {olay.baslik}</span>
                    <span className="font-mono-tabular text-[11px] shrink-0">Adım {olay.adim}</span>
                  </button>
                ) : (
                  <div className="min-h-[38px] border border-[#273147] bg-[#0D1019] px-3 py-2 text-[11px] font-medium text-[#8B95AB] flex items-center justify-between gap-2">
                    <span>{beklemeMetni}</span>
                    <span className="font-mono-tabular text-[#6B768F]">
                      {tamamlandiMi ? 'Tamam' : 'Beklemede'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="h-[100dvh] overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible w-full bg-[#0B0E17] text-[#EAECEF] flex flex-col lg:flex-row">
      {/* SOL SÜTUN (Masaüstü) / SABİT ÜST BÖLÜM (Mobil): Pixel Art Sahne, İhtiyaçlar ve Mekan Çubuğu */}
      <section className="shrink-0 z-20 w-full lg:w-[46%] lg:sticky lg:top-0 lg:h-screen flex flex-col border-b lg:border-b-0 lg:border-r border-[#273147] bg-[#0B0E17]">
        {/* Pixel Art Sahne */}
        <div className="relative h-48 sm:h-56 lg:h-[370px] xl:h-[430px] w-full overflow-hidden">
          <NeighborhoodCanvas
            mekanId={state.aktifMekan}
            gorunum={state.oyuncu.gorunum}
            yorgunluk={state.yorgunluk}
            moral={state.moral}
            saatDakika={state.saatDakika}
            evSeviyesi={state.evSeviyesi}
            evEsyalari={state.evEsyalari}
            aksiyonDarbesi={aksiyonDarbesi}
            aksiyonTuru={sonAksiyonTuru}
            karakterKonumX={state.aktifMekan === 'ev' ? 0.44 : 0.46}
          />

          {/* Üst Kenar HUD (sadece okuma) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 px-3 py-2 sm:p-4 flex items-start justify-between gap-2 bg-gradient-to-b from-black/90 via-black/45 to-transparent">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-[#A3ACBE] truncate">
                {state.oyuncu.gercekAd} ·{' '}
                <span className="text-[#EAECEF] font-semibold">{state.oyuncu.lakap}</span> ·{' '}
                <span className="text-[#D99B38]">{aktifMekanTanimi.kisaAd}</span>
              </p>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-wide text-[#EAECEF] leading-none">
                  GÜN {state.gun}
                </h1>
                <span
                  data-testid="clock-display"
                  className={`font-mono-tabular text-sm sm:text-lg font-bold leading-none ${
                    turetilmis.geceGecMi ? 'text-[#E34A4A]' : 'text-[#EAECEF]'
                  }`}
                >
                  {saatMetni(state.saatDakika)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 shrink-0">
              <div className="text-right">
                <p
                  data-testid="money-display"
                  className="font-mono-tabular text-base sm:text-2xl font-bold text-[#EAECEF] leading-tight"
                >
                  {state.para} ₺
                </p>
                <p
                  className={`font-mono-tabular text-[11px] sm:text-xs mt-0.5 ${
                    turetilmis.kirayaKalanGun <= 2 && turetilmis.kiraEksikTutar > 0
                      ? 'text-[#E34A4A] font-semibold'
                      : 'text-[#D99B38]'
                  }`}
                >
                  {turetilmis.kirayaKalanGun === 1
                    ? 'Bugün Kira'
                    : `Kira ${turetilmis.kirayaKalanGun}g`}{' '}
                  ·{' '}
                  {turetilmis.kiraEksikTutar > 0
                    ? `Eksik ${turetilmis.kiraEksikTutar} ₺`
                    : 'Hazır'}
                </p>
              </div>
              <AudioControls compact />
            </div>
          </div>
        </div>

        {/* Mobil Tek Sıralı İhtiyaç Şeridi */}
        <div className="lg:hidden border-t border-[#273147] bg-[#0B0E17] px-3 py-1.5">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <div className="flex justify-between text-[11px] leading-none mb-1">
                <span className="text-[#8B95AB]">Enerji</span>
                <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                  {state.enerji}
                </span>
              </div>
              <div className="h-1.5 bg-[#181F30] border border-[#273147]">
                <div
                  className="h-full bg-[#D99B38] transition-all duration-200"
                  style={{ width: `${Math.round((state.enerji / state.maksEnerji) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] leading-none mb-1">
                <span className="text-[#8B95AB]">Tokluk</span>
                <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                  {state.tokluk}
                </span>
              </div>
              <div className="h-1.5 bg-[#181F30] border border-[#273147]">
                <div
                  className={`h-full transition-all duration-200 ${
                    state.tokluk <= 25 ? 'bg-[#E34A4A]' : 'bg-[#6CC296]'
                  }`}
                  style={{ width: `${state.tokluk}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] leading-none mb-1">
                <span className="text-[#8B95AB]">Uyku</span>
                <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                  {state.uyku}
                </span>
              </div>
              <div className="h-1.5 bg-[#181F30] border border-[#273147]">
                <div
                  className={`h-full transition-all duration-200 ${
                    state.uyku <= 25 ? 'bg-[#E34A4A]' : 'bg-[#5B82B8]'
                  }`}
                  style={{ width: `${state.uyku}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] leading-none mb-1">
                <span className="text-[#8B95AB]">Moral</span>
                <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                  {state.moral}
                </span>
              </div>
              <div className="h-1.5 bg-[#181F30] border border-[#273147]">
                <div
                  className="h-full bg-[#3D8C66] transition-all duration-200"
                  style={{ width: `${state.moral}%` }}
                />
              </div>
            </div>
          </div>

          <div
            data-testid="mobile-reputation-hud"
            className="mt-1.5 pt-1 border-t border-[#273147]/70 flex items-center justify-between text-[11px] font-mono-tabular"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#6CC296] font-semibold">
                Saygı: {state.itibar.saygi}
              </span>
              <span className="text-[#E34A4A] font-semibold">
                Korku: {state.itibar.korku}
              </span>
            </div>
            <span className="text-[#A3ACBE]">
              Aile Bağı: <strong className="text-[#EAECEF]">{state.aileIliskisi ?? 60}</strong>
            </span>
          </div>
        </div>

        {/* Mobil Sabit Mekan Seçici Çubuğu */}
        <nav
          aria-label="Mekanlar"
          className="lg:hidden border-t border-[#273147] bg-[#121724] grid grid-cols-5"
        >
          {MEKAN_TANIMLARI.map((mekan) => {
            const aktif = sagGorunum === 'mekan' && state.aktifMekan === mekan.id;
            const Ikon = MEKAN_IKONU[mekan.id];
            const hazirSayi = mekanHazirKomsuSayisi[mekan.id] ?? 0;
            return (
              <button
                key={mekan.id}
                type="button"
                data-location={mekan.id}
                onClick={() => mekanSec(mekan.id)}
                className={`relative min-h-[44px] px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold border-b-2 transition-colors cursor-pointer ${
                  aktif
                    ? 'border-[#D63838] text-[#EAECEF] bg-[#181F30]'
                    : 'border-transparent text-[#8B95AB] hover:text-[#EAECEF]'
                }`}
              >
                <Ikon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-full">
                  {mekan.id === 'spor_salonu'
                    ? 'Salon'
                    : mekan.id === 'sokak_arena'
                      ? 'Arena'
                      : mekan.kisaAd}
                </span>
                {hazirSayi > 0 && (
                  <span
                    aria-label={`${hazirSayi} komşu olayı hazır`}
                    className="absolute top-1 right-1.5 w-2 h-2 bg-[#D99B38]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Masaüstü Sahne Altı: 4 İhtiyaç + Stat Özeti + Bildirim */}
        <div className="hidden lg:flex flex-1 flex-col justify-between border-t border-[#273147] bg-[#0B0E17] px-4 py-3.5 gap-3 overflow-y-auto">
          <div className="space-y-3">
            {/* 4 İhtiyaç Barı */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8B95AB]">Enerji</span>
                  <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                    {state.enerji}/{state.maksEnerji}
                  </span>
                </div>
                <div className="h-2 bg-[#181F30] border border-[#273147]">
                  <div
                    className="h-full bg-[#D99B38] transition-all duration-200"
                    style={{ width: `${Math.round((state.enerji / state.maksEnerji) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8B95AB]">Tokluk</span>
                  <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                    {state.tokluk}/100
                  </span>
                </div>
                <div className="h-2 bg-[#181F30] border border-[#273147]">
                  <div
                    className={`h-full transition-all duration-200 ${
                      state.tokluk <= 25 ? 'bg-[#E34A4A]' : 'bg-[#6CC296]'
                    }`}
                    style={{ width: `${state.tokluk}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8B95AB]">Uyku</span>
                  <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                    {state.uyku}/100
                  </span>
                </div>
                <div className="h-2 bg-[#181F30] border border-[#273147]">
                  <div
                    className={`h-full transition-all duration-200 ${
                      state.uyku <= 25 ? 'bg-[#E34A4A]' : 'bg-[#5B82B8]'
                    }`}
                    style={{ width: `${state.uyku}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8B95AB]">Moral</span>
                  <span className="font-mono-tabular font-semibold text-[#EAECEF]">
                    {state.moral}/100
                  </span>
                </div>
                <div className="h-2 bg-[#181F30] border border-[#273147]">
                  <div
                    className="h-full bg-[#3D8C66] transition-all duration-200"
                    style={{ width: `${state.moral}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4 Stat & Can/Stamina Özeti */}
            <div className="grid grid-cols-5 gap-2 border-t border-[#273147]/80 pt-3">
              {STAT_TANIMLARI.map((stat) => {
                const durum = state.statlar[stat.id];
                return (
                  <div key={stat.id} className="border border-[#273147] bg-[#121724] px-2.5 py-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold text-[#8B95AB]">
                        {stat.kisaKod}
                      </span>
                      <span className="font-mono-tabular text-sm font-bold text-[#EAECEF]">
                        {durum.deger}
                      </span>
                    </div>
                    <div className="h-1 bg-[#0B0E17] mt-1.5">
                      <div
                        className="h-full bg-[#D63838]"
                        style={{ width: `${durum.ilerleme}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border border-[#273147] bg-[#121724] px-2.5 py-2">
                <span className="block text-[11px] font-semibold text-[#8B95AB]">CAN / STAM</span>
                <span className="font-mono-tabular text-xs font-bold text-[#EAECEF] mt-0.5 block">
                  {turetilmis.maksCan} / {turetilmis.maksStamina}
                </span>
              </div>
            </div>

            {/* Saygı & Korku İtibar Şeridi */}
            <div
              data-testid="desktop-reputation-hud"
              className="grid grid-cols-3 gap-2 border-t border-[#273147]/80 pt-2.5"
            >
              <div className="border border-[#273147] bg-[#121724] px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#8B95AB]">Saygı</span>
                <span className="font-mono-tabular text-xs font-bold text-[#6CC296]">
                  {state.itibar.saygi}
                  {turetilmis.marketIndirimYuzde > 0
                    ? ` (-%${turetilmis.marketIndirimYuzde})`
                    : ''}
                </span>
              </div>
              <div className="border border-[#273147] bg-[#121724] px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#8B95AB]">Korku</span>
                <span className="font-mono-tabular text-xs font-bold text-[#E34A4A]">
                  {state.itibar.korku}
                  {turetilmis.korkuSeviyesi > 0 ? ` (Sv.${turetilmis.korkuSeviyesi})` : ''}
                </span>
              </div>
              <div className="border border-[#273147] bg-[#121724] px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#8B95AB]">Aile Bağı</span>
                <span className="font-mono-tabular text-xs font-bold text-[#D99B38]">
                  {state.aileIliskisi ?? 60}/100
                </span>
              </div>
            </div>
          </div>

          {/* Son Bildirim */}
          {state.sonBildirim && (
            <div className="border border-[#273147] bg-[#121724] px-3.5 py-2.5">
              <div className="flex items-start gap-2 text-xs xl:text-sm">
                <span
                  className={`font-semibold shrink-0 ${
                    state.sonBildirim.tur === 'uyari'
                      ? 'text-[#E34A4A]'
                      : state.sonBildirim.tur === 'basari'
                        ? 'text-[#6CC296]'
                        : 'text-[#D99B38]'
                  }`}
                >
                  [{BILDIRIM_ETIKETI[state.sonBildirim.tur]}]
                </span>
                <p className="text-[#D4DAE6] leading-snug">{state.sonBildirim.metin}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SAĞ SÜTUN: Masaüstü Mekan Çubuğu ve Aktif Mekan Aktiviteleri */}
      <section
        ref={sagPanelRef}
        className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible flex flex-col min-w-0"
      >
        {/* Masaüstü Mekan Navigasyonu + Yetenekler + Hamleler */}
        <nav
          aria-label="Mekanlar"
          className="hidden lg:flex flex-wrap border-b border-[#273147] bg-[#121724] px-2.5 xl:px-4 py-0 items-center justify-between gap-1.5"
        >
          <div className="flex flex-wrap items-center gap-0.5">
            {MEKAN_TANIMLARI.map((mekan) => {
              const aktif = sagGorunum === 'mekan' && state.aktifMekan === mekan.id;
              const Ikon = MEKAN_IKONU[mekan.id];
              const hazirSayi = mekanHazirKomsuSayisi[mekan.id] ?? 0;
              return (
                <button
                  key={mekan.id}
                  type="button"
                  data-location={mekan.id}
                  onClick={() => mekanSec(mekan.id)}
                  className={`min-h-[44px] px-2 xl:px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    aktif
                      ? 'border-[#D63838] text-[#EAECEF] bg-[#181F30]'
                      : 'border-transparent text-[#8B95AB] hover:text-[#EAECEF]'
                  }`}
                >
                  <Ikon className="w-3.5 h-3.5 shrink-0" />
                  <span>{mekan.kisaAd}</span>
                  {hazirSayi > 0 && (
                    <span
                      title={`${hazirSayi} komşu olayı hazır`}
                      className="px-1 py-0.5 text-[10px] leading-none font-mono-tabular bg-[#D99B38] text-[#0B0E17] font-bold"
                    >
                      {hazirSayi}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 py-1">
            <button
              type="button"
              data-testid="nav-reputation-btn"
              onClick={() => gorunumAcKapa('itibar')}
              className={`min-h-[32px] px-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                sagGorunum === 'itibar'
                  ? 'border-[#6CC296] bg-[#12221D] text-[#EAECEF]'
                  : 'border-[#3A4766] bg-[#0B0E17] text-[#EAECEF] hover:border-[#6CC296]'
              }`}
            >
              <span>İtibar</span>
              <span className="font-mono-tabular text-[11px] text-[#6CC296]">
                {state.itibar.saygi}
              </span>
              <span className="text-[#5B657A]">/</span>
              <span className="font-mono-tabular text-[11px] text-[#E34A4A]">
                {state.itibar.korku}
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-skill-tree-btn"
              onClick={() => gorunumAcKapa('yetenek_agaci')}
              className={`min-h-[32px] px-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                sagGorunum === 'yetenek_agaci'
                  ? 'border-[#D99B38] bg-[#221D15] text-[#EAECEF]'
                  : 'border-[#3A4766] bg-[#0B0E17] text-[#EAECEF] hover:border-[#D99B38]'
              }`}
            >
              <span>{sagGorunum === 'yetenek_agaci' ? 'Mekan' : 'Yetenek'}</span>
              <span className="font-mono-tabular text-[#D99B38]">
                ({turetilmis.yetenekPuani} YP)
              </span>
            </button>

            <button
              type="button"
              data-testid="nav-moves-btn"
              onClick={() => gorunumAcKapa('hamleler')}
              className={`min-h-[32px] px-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                sagGorunum === 'hamleler'
                  ? 'border-[#D63838] bg-[#181F30] text-[#EAECEF]'
                  : 'border-[#3A4766] bg-[#0B0E17] text-[#A3ACBE] hover:text-[#EAECEF]'
              }`}
            >
              {sagGorunum === 'hamleler'
                ? 'Mekan'
                : `Hamle (${turetilmis.acikHamleIds.length})`}
            </button>
          </div>
        </nav>

        {/* İçerik Alanı */}
        <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-4xl w-full">
          {/* Mobil Bildirim Kutusu */}
          {state.sonBildirim && (
            <div className="lg:hidden border border-[#273147] bg-[#121724] px-3 py-2">
              <div className="flex items-start gap-2 text-xs">
                <span
                  className={`font-semibold shrink-0 ${
                    state.sonBildirim.tur === 'uyari'
                      ? 'text-[#E34A4A]'
                      : state.sonBildirim.tur === 'basari'
                        ? 'text-[#6CC296]'
                        : 'text-[#D99B38]'
                  }`}
                >
                  [{BILDIRIM_ETIKETI[state.sonBildirim.tur]}]
                </span>
                <p className="text-[#D4DAE6] leading-snug">{state.sonBildirim.metin}</p>
              </div>
            </div>
          )}

          {/* Aktif Cezalar / Debuff Şeridi (Az metin, net sayısal etki) */}
          {aktifDebufflar.length > 0 && (
            <div
              data-testid="active-debuffs-strip"
              className="border border-[#273147] bg-[#101420] px-3 py-2 flex flex-wrap items-center gap-1.5"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B95AB] mr-1">
                Cezalar:
              </span>
              {aktifDebufflar.map((debuff) => (
                <span
                  key={debuff.id}
                  data-testid={`debuff-chip-${debuff.id}`}
                  title={debuff.cozum}
                  className={`border px-2 py-0.5 text-[11px] font-mono-tabular inline-flex items-center gap-1.5 ${
                    debuff.siddet === 'kritik'
                      ? 'border-[#D63838]/70 bg-[#221417] text-[#F18B8B]'
                      : 'border-[#D99B38]/60 bg-[#1D170E] text-[#E6B86A]'
                  }`}
                >
                  <span className="font-sans font-bold">{debuff.baslik}</span>
                  <span>{debuff.etki}</span>
                  <span className="text-[10px] text-[#9BA5BA] font-sans">({debuff.cozum})</span>
                </span>
              ))}
            </div>
          )}

          {/* Mekan Başlığı ve Hızlı Özet */}
          <div className="border border-[#273147] bg-[#121724] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#EAECEF]">
                {sagGorunum === 'itibar'
                  ? 'İtibar & Ahlaki Seçimler'
                  : sagGorunum === 'yetenek_agaci'
                    ? 'Yetenek Ağacı'
                    : sagGorunum === 'hamleler'
                      ? 'Hamle Repertuarı'
                      : aktifMekanTanimi.isim}
              </h2>
              <p className="text-xs text-[#8B95AB] mt-0.5">
                {sagGorunum === 'itibar'
                  ? 'Mahalledeki Saygı ve Korku değerlerin farklı fırsatlar açar; seçimlerin eve ve komşulara yansır.'
                  : sagGorunum === 'yetenek_agaci'
                    ? 'Maç galibiyeti ve stat seviyelerinden kazandığın puanlarla teknikler ve pasifler aç.'
                    : sagGorunum === 'hamleler'
                      ? 'Sokak Arenasında kullanabileceğin dövüş teknikleri, stat ve yetenek şartları.'
                      : aktifMekanTanimi.aciklama}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-mono-tabular">
              <span
                data-testid="efficiency-badge"
                className={`border px-2.5 py-1 ${
                  turetilmis.antrenmanVerimi < 75
                    ? 'border-[#D63838]/70 bg-[#221417] text-[#F18B8B]'
                    : turetilmis.antrenmanVerimi < 95
                      ? 'border-[#D99B38]/60 bg-[#1D170E] text-[#E6B86A]'
                      : turetilmis.antrenmanVerimi >= 105
                        ? 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                        : 'border-[#273147] bg-[#0B0E17] text-[#A3ACBE]'
                }`}
              >
                Verim %{turetilmis.antrenmanVerimi}
              </span>
              <span className="border border-[#273147] bg-[#0B0E17] px-2.5 py-1 text-[#A3ACBE]">
                Dolap: {state.buzdolabiStok}
              </span>
              <button
                type="button"
                data-testid="mobile-reputation-btn"
                onClick={() => gorunumAcKapa('itibar')}
                className={`lg:hidden border px-2.5 py-1 font-sans font-semibold cursor-pointer ${
                  sagGorunum === 'itibar'
                    ? 'border-[#6CC296] bg-[#12221D] text-[#EAECEF]'
                    : 'border-[#3A4766] bg-[#181F30] text-[#EAECEF]'
                }`}
              >
                {sagGorunum === 'itibar'
                  ? 'Mekan'
                  : `İtibar (${state.itibar.saygi}/${state.itibar.korku})`}
              </button>
              <button
                type="button"
                data-testid="mobile-skill-tree-btn"
                onClick={() => gorunumAcKapa('yetenek_agaci')}
                className={`lg:hidden border px-2.5 py-1 font-sans font-semibold cursor-pointer ${
                  sagGorunum === 'yetenek_agaci'
                    ? 'border-[#D99B38] bg-[#221D15] text-[#EAECEF]'
                    : 'border-[#3A4766] bg-[#181F30] text-[#D99B38]'
                }`}
              >
                {sagGorunum === 'yetenek_agaci'
                  ? 'Mekan'
                  : `Yetenek (${turetilmis.yetenekPuani} YP)`}
              </button>
              <button
                type="button"
                data-testid="mobile-moves-btn"
                onClick={() => gorunumAcKapa('hamleler')}
                className={`lg:hidden border px-2.5 py-1 font-sans font-semibold cursor-pointer ${
                  sagGorunum === 'hamleler'
                    ? 'border-[#D63838] bg-[#221417] text-[#EAECEF]'
                    : 'border-[#3A4766] bg-[#181F30] text-[#EAECEF]'
                }`}
              >
                {sagGorunum === 'hamleler'
                  ? 'Mekan'
                  : `Hamle (${turetilmis.acikHamleIds.length})`}
              </button>
            </div>
          </div>

          {sagGorunum === 'itibar' ? (
            <ReputationPanel state={state} />
          ) : sagGorunum === 'yetenek_agaci' ? (
            <SkillTreePanel state={state} onYetenekAc={onYetenekAc} />
          ) : sagGorunum === 'hamleler' ? (
            <MovesPanel
              statlar={state.statlar}
              acikYetenekIds={state.acikYetenekIds ?? []}
              ogrenilenHocaDersIds={state.ogrenilenHocaDersIds ?? []}
            />
          ) : (
            <>
              {/* ============================================================
                  MEKAN 1: AİLE EVİ
                 ============================================================ */}
              {state.aktifMekan === 'ev' && (
                <div className="space-y-4">
                  {/* Temel Ev Aksiyonları (Uyku & Buzdolabı) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      data-testid="sleep-btn"
                      onClick={onUyuVeGunuBitir}
                      className="min-h-[52px] px-4 py-3 bg-[#D63838] hover:bg-[#E34A4A] text-white text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-display text-base sm:text-lg font-bold tracking-wide">
                          Yatakta Uyu ve Günü Bitir
                        </p>
                        <p className="text-[11px] text-white/85">
                          08:00’a uyan · +{mevcutEv.gunlukEnerjiToparlanma} EN · Ücretsiz
                        </p>
                      </div>
                      <Moon className="w-5 h-5 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSfx('menu_tik');
                        onYemek('ev_yemegi');
                      }}
                      disabled={state.buzdolabiStok <= 0}
                      className={`min-h-[52px] px-4 py-3 border text-left flex items-center justify-between gap-3 transition-colors ${
                        state.buzdolabiStok > 0
                          ? 'border-[#3A4766] bg-[#181F30] hover:border-[#6CC296] hover:bg-[#222B42] text-[#EAECEF] cursor-pointer'
                          : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <p className="font-display text-base sm:text-lg font-bold tracking-wide">
                          Buzdolabından Ev Yemeği
                        </p>
                        <p className="text-[11px] opacity-80">
                          Stok: {state.buzdolabiStok} öğün · 20 dk · +40 Tokluk, +14 EN
                        </p>
                      </div>
                      <Utensils className="w-5 h-5 shrink-0" />
                    </button>
                  </div>

                  {/* Anti-Ölüm Sarmalı: Acil Ev Çorbası */}
                  {acilCorbaMusait && (
                    <div className="border border-[#6CC296]/50 bg-[#12221D] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <p className="text-xs font-semibold text-[#6CC296]">
                          Emine Tencereye Baktı (Zor Gün Desteği)
                        </p>
                        <p className="text-xs text-[#C8CFDC] mt-0.5">
                          Paran ve dolaptaki yemeğin bittiğinde annen sıcak bir kase mercimek çorbası çıkarır.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('menu_tik');
                          onAcilCorba();
                        }}
                        className="min-h-[42px] px-4 py-2 bg-[#3D8C66] hover:bg-[#4AA378] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Sıcak Çorba İç (Ücretsiz · +38 Tokluk)
                      </button>
                    </div>
                  )}

                  {/* Evde Kum Torbası Antrenmanı (varsa) */}
                  {turetilmis.evdeAntrenmanAcik && (
                    <section className="border border-[#273147] bg-[#121724] p-3 sm:p-4 space-y-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-[#EAECEF]">
                          Evdeki Kum Torbası (Giriş Ücretsiz)
                        </h3>
                        <span className="text-[11px] text-[#8B95AB]">Evde %85 verim</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(['guc', 'ceviklik'] as const).map((statId) => {
                          const stat = STAT_TANIMLARI.find((s) => s.id === statId)!;
                          const durum = state.statlar[statId];
                          const yeterli = state.enerji >= stat.enerjiMaliyeti && state.tokluk >= 5;
                          return (
                            <button
                              key={statId}
                              type="button"
                              onClick={() => antrenmanTetikle(statId, true)}
                              disabled={!yeterli}
                              className={`min-h-[44px] px-3 py-2 border text-left transition-colors ${
                                yeterli
                                  ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D63838] text-[#EAECEF] cursor-pointer'
                                  : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                              }`}
                            >
                              <div className="flex justify-between text-xs font-semibold">
                                <span>Evde {stat.isim} Çalış</span>
                                <span className="font-mono-tabular">
                                  Sv.{durum.deger} ({durum.ilerleme}%)
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8B95AB] mt-0.5">
                                {stat.sureDakika} dk · -{stat.enerjiMaliyeti} EN · -{stat.toklukMaliyeti} Tokluk
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Aile Üyeleri (Emine & Elif) ve Evdeki Hava */}
                  <section className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
                        Evdekiler
                      </h3>
                      <span
                        className={`text-[11px] font-semibold border px-2 py-0.5 ${
                          aileRuhHali.ton === 'gergin'
                            ? 'border-[#D63838]/60 bg-[#221417] text-[#E34A4A]'
                            : aileRuhHali.ton === 'sicak'
                              ? 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                              : 'border-[#D99B38]/50 bg-[#1D170E] text-[#D99B38]'
                        }`}
                      >
                        Ev Havası: {aileRuhHali.etiket} ({state.aileIliskisi ?? 60}/100)
                      </span>
                    </div>
                    <p className="text-xs text-[#8B95AB]">{aileRuhHali.aciklama}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {AILE_UYELERI.map((uye) => {
                        const isEmine = uye.id === 'anne_emine';
                        const konusulduMu = isEmine
                          ? state.anneKonusmaGunu === state.gun
                          : state.elifKonusmaGunu === state.gun;

                        return (
                          <div
                            key={uye.id}
                            className="border border-[#273147] bg-[#121724] p-3 flex flex-col justify-between gap-2.5"
                          >
                            <div>
                              <div className="flex items-baseline justify-between">
                                <span className="font-display text-lg font-bold text-[#EAECEF]">
                                  {uye.isim}
                                </span>
                                <span className="text-xs text-[#8B95AB]">
                                  {uye.yakinlik} · {uye.yas} yaş
                                </span>
                              </div>
                              <p className="text-xs text-[#C8CFDC] mt-1 leading-snug">
                                {uye.kisaNot}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={konusulduMu}
                              onClick={() => {
                                playSfx('menu_tik');
                                onAileEtkiles(isEmine ? 'anne_emine' : 'kardes_elif');
                              }}
                              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold border transition-colors ${
                                konusulduMu
                                  ? 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                                  : 'border-[#3A4766] bg-[#181F30] hover:border-[#D99B38] text-[#EAECEF] cursor-pointer'
                              }`}
                            >
                              {konusulduMu
                                ? 'Bugün Konuşuldu'
                                : isEmine
                                  ? 'Annenle Çay İç (20 dk · +7 Moral, +1 Saygı)'
                                  : 'Elif’in Dersine Bak (20 dk · +6 Moral, +1 Saygı)'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Saygı Eşiği: Mahalle Dayanışması (C3) */}
                  <section
                    data-testid="neighbor-solidarity-card"
                    className={`border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      turetilmis.komsuDayanismasiAcik
                        ? 'border-[#3D8C66]/60 bg-[#101C18]'
                        : 'border-[#273147] bg-[#0D1019]'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          turetilmis.komsuDayanismasiAcik ? 'text-[#6CC296]' : 'text-[#8B95AB]'
                        }`}
                      >
                        Mahalle Dayanışması (Saygı {ITIBAR_SABITLERI.saygiEsik1}+ Fırsatı)
                      </p>
                      <p className="text-xs text-[#C8CFDC] mt-0.5">
                        {turetilmis.komsuDayanismasiAcik
                          ? 'Komşuların güvenini kazandığın için günde bir kez sıcak yemek ve ufak destek bırakırlar.'
                          : `Açmak için ${ITIBAR_SABITLERI.saygiEsik1} Saygı gerekiyor (Mevcut: ${state.itibar.saygi}).`}
                      </p>
                    </div>
                    {turetilmis.komsuDayanismasiAcik ? (
                      <button
                        type="button"
                        data-testid="neighbor-solidarity-btn"
                        disabled={(state.komsuDayanismaGunu ?? 0) === state.gun}
                        onClick={() => {
                          playSfx('menu_tik');
                          onKomsuDayanisma();
                        }}
                        className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          (state.komsuDayanismaGunu ?? 0) === state.gun
                            ? 'border border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                            : 'bg-[#3D8C66] hover:bg-[#4AA378] text-white cursor-pointer'
                        }`}
                      >
                        {(state.komsuDayanismaGunu ?? 0) === state.gun
                          ? 'Bugün Alındı'
                          : 'Desteği Al (+1 Öğün · +35 ₺ · +5 Moral)'}
                      </button>
                    ) : (
                      <span className="font-mono-tabular text-[11px] border border-[#273147] bg-[#121724] px-2.5 py-1 text-[#8B95AB] shrink-0">
                        Kilitli ({state.itibar.saygi}/{ITIBAR_SABITLERI.saygiEsik1})
                      </span>
                    )}
                  </section>

                  {/* Evdeki & Kapıdaki Komşular (C2) */}
                  {komsularBolumuRender()}

                  {/* Ev Eşyaları */}
                  <section className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
                        Ev Eşyaları ({state.evEsyalari.length}/{mevcutEv.esyaKapasitesi})
                      </h3>
                      <span className="text-[11px] text-[#8B95AB]">
                        Alınan eşyalar odada görünür
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {EV_ESYALARI_LISTESI.map((esya) => {
                        const sahip = state.evEsyalari.includes(esya.id);
                        const paraYeterli = state.para >= esya.fiyat;
                        const yerVar = state.evEsyalari.length < mevcutEv.esyaKapasitesi;
                        return (
                          <div
                            key={esya.id}
                            className="border border-[#273147] bg-[#121724] p-3 flex flex-col justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-display text-base font-bold text-[#EAECEF]">
                                  {esya.isim}
                                </span>
                                <span className="font-mono-tabular text-xs font-semibold text-[#D99B38]">
                                  {sahip ? 'Odada Kurulu' : `${esya.fiyat} ₺`}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8B95AB] mt-1 leading-snug">
                                {esya.aciklama}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={sahip || !paraYeterli || !yerVar}
                              onClick={() => {
                                playSfx('menu_tik');
                                onEvEsyasiAl(esya.id);
                              }}
                              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold border transition-colors ${
                                sahip
                                  ? 'border-[#3D8C66]/50 bg-[#12221D] text-[#6CC296] cursor-default'
                                  : paraYeterli && yerVar
                                    ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D99B38] text-[#EAECEF] cursor-pointer'
                                    : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                              }`}
                            >
                              {sahip ? 'Kurulu' : `Satın Al (${esya.fiyat} ₺)`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Ev Seviyesi ve Taşınma */}
                  <section className="border border-[#273147] bg-[#121724] p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#8B95AB]">
                          Ev Seviyesi {mevcutEv.seviye + 1}/{EV_SEVIYELERI.length}
                        </span>
                        <h3 className="font-display text-lg font-bold text-[#EAECEF]">
                          {mevcutEv.isim}
                        </h3>
                      </div>
                      <span className="font-mono-tabular text-xs font-semibold text-[#D99B38]">
                        Haftalık Kira: {mevcutEv.haftalikKira} ₺
                      </span>
                    </div>

                    {sonrakiEv ? (
                      <div className="border-t border-[#273147] pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <p className="text-xs font-semibold text-[#EAECEF]">
                            Taşın: {sonrakiEv.isim}
                          </p>
                          <p className="text-[11px] text-[#8B95AB]">
                            Yeni Kira: {sonrakiEv.haftalikKira} ₺/hafta · Enerji: +
                            {sonrakiEv.gunlukEnerjiToparlanma}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('menu_tik');
                            onEvYukselt();
                          }}
                          disabled={state.para < sonrakiEv.yukseltmeMaliyeti}
                          className={`min-h-[40px] px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                            state.para >= sonrakiEv.yukseltmeMaliyeti
                              ? 'bg-[#D63838] hover:bg-[#E34A4A] text-white cursor-pointer'
                              : 'border border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                          }`}
                        >
                          Taşın ({sonrakiEv.yukseltmeMaliyeti} ₺)
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#6CC296]">
                        Ailen mahalledeki en iyi dairede oturuyor.
                      </p>
                    )}
                  </section>
                </div>
              )}

              {/* ============================================================
                  MEKAN 2: SPOR SALONU
                 ============================================================ */}
              {state.aktifMekan === 'spor_salonu' && (
                <div className="space-y-3">
                  <div className="border border-[#273147] bg-[#121724] px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span>
                      {turetilmis.salonGirisOdendiMi ? (
                        <span className="text-[#6CC296] font-semibold">
                          Bugünkü salon girişin ödendi. İstediğin kadar çalışabilirsin.
                        </span>
                      ) : (
                        <span className="text-[#D99B38]">
                          Günlük giriş ücreti: {SAAT_SABITLERI.salonGunlukGirisUcreti} ₺ (bugünlük ilk antrenmanda alınır)
                        </span>
                      )}
                    </span>
                    {turetilmis.gucDayaniklilikBonusYuzde > 0 && (
                      <span className="font-mono-tabular text-[#6CC296]">
                        Ağırlık Seti Bonusu: +%{turetilmis.gucDayaniklilikBonusYuzde}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {STAT_TANIMLARI.map((stat) => {
                      const durum = state.statlar[stat.id];
                      const girisUcreti = turetilmis.salonGirisOdendiMi
                        ? 0
                        : SAAT_SABITLERI.salonGunlukGirisUcreti;
                      const musait =
                        state.enerji >= stat.enerjiMaliyeti &&
                        state.tokluk >= 5 &&
                        state.para >= girisUcreti;

                      return (
                        <div
                          key={stat.id}
                          className="border border-[#273147] bg-[#121724] p-3.5 flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-display text-lg font-bold text-[#EAECEF]">
                                {stat.isim}
                              </span>
                              <span className="font-mono-tabular text-base font-bold text-[#EAECEF]">
                                Sv. {durum.deger}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8B95AB] mt-0.5 leading-snug">
                              {stat.aciklama}
                            </p>

                            <div className="mt-2.5">
                              <div className="flex justify-between text-[11px] font-mono-tabular text-[#8B95AB] mb-1">
                                <span>{stat.antrenmanAdi}</span>
                                <span>{durum.ilerleme}/100</span>
                              </div>
                              <div className="h-1.5 bg-[#0B0E17] border border-[#273147]">
                                <div
                                  className="h-full bg-[#D63838] transition-all duration-200"
                                  style={{ width: `${durum.ilerleme}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            data-train={stat.id}
                            onClick={() => antrenmanTetikle(stat.id, false)}
                            disabled={!musait}
                            className={`min-h-[42px] w-full px-3 py-2 text-xs font-semibold border transition-colors ${
                              musait
                                ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D63838] hover:bg-[#222B42] text-[#EAECEF] cursor-pointer'
                                : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                            }`}
                          >
                            Çalış ({stat.sureDakika} dk · -{stat.enerjiMaliyeti} EN · -{stat.toklukMaliyeti} Tok
                            {girisUcreti > 0 ? ` · -${girisUcreti} ₺` : ''})
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* C2 Antrenörler & Özel Dersler */}
                  <section data-testid="trainers-section" className="space-y-3 pt-2">
                    <div className="border-b border-[#273147] pb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-bold tracking-wide text-[#EAECEF]">
                          Antrenörler & Özel Dersler
                        </h3>
                        <p className="text-[11px] text-[#8B95AB]">
                          Hocalar para, süre ve stat şartıyla özel dövüş teknikleri ve kalıcı pasifler öğretir.
                        </p>
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[#D99B38]">
                        {(state.ogrenilenHocaDersIds ?? []).length}/{ANTRENOR_DERSLERI.length} Ders
                      </span>
                    </div>

                    <div className="space-y-3">
                      {ANTRENOR_LISTESI.map((hoca) => {
                        const dersler = ANTRENOR_DERSLERI.filter((d) => d.antrenorId === hoca.id);
                        return (
                          <div
                            key={hoca.id}
                            data-testid={`trainer-card-${hoca.id}`}
                            className="border border-[#273147] bg-[#121724] p-3.5 space-y-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#273147] pb-2.5">
                              <div>
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <h4 className="font-display text-lg font-bold text-[#EAECEF]">
                                    {hoca.isim}
                                  </h4>
                                  <span className="text-xs text-[#D99B38] font-medium">
                                    · {hoca.lakap}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8B95AB] mt-0.5">
                                  Uzmanlık: {hoca.uzmanlik}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs italic text-[#D0D6E2] border-l-2 border-[#D99B38] pl-2.5">
                              “{metinSablonunuDoldur(hoca.diyalog, state)}”
                            </p>

                            <div className="space-y-2">
                              {dersler.map((ders) => {
                                const kontrol = hocaDersiAlinabilirMi(state, ders.id);
                                const statSart = Object.entries(ders.statSarti)
                                  .map(([id, min]) => {
                                    const sTanim = STAT_TANIMLARI.find((s) => s.id === id);
                                    return `${sTanim?.isim ?? id} ${min}`;
                                  })
                                  .join(' · ');

                                return (
                                  <div
                                    key={ders.id}
                                    data-testid={`trainer-lesson-${ders.id}`}
                                    className={`border p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                      kontrol.ogrenildiMi
                                        ? 'border-[#3D8C66]/60 bg-[#101C18]'
                                        : 'border-[#273147] bg-[#0B0E17]'
                                    }`}
                                  >
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-[#EAECEF]">
                                          {ders.isim}
                                        </span>
                                        <span className="font-mono-tabular text-[11px] text-[#D99B38]">
                                          {ders.paraMaliyeti} ₺ · {ders.sureDakika} dk · -{ders.enerjiMaliyeti} EN
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[#A3ACBE]">{ders.aciklama}</p>
                                      <p className="text-[11px] font-semibold text-[#6CC296]">
                                        {ders.ozetEtiket}
                                        {statSart ? ` · Şart: ${statSart}` : ''}
                                      </p>
                                    </div>

                                    {kontrol.ogrenildiMi ? (
                                      <span className="shrink-0 border border-[#3D8C66]/60 bg-[#12221D] px-3 py-1.5 text-xs font-semibold text-[#6CC296]">
                                        Öğrenildi
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        data-testid={`trainer-lesson-btn-${ders.id}`}
                                        disabled={!kontrol.alinabilir}
                                        onClick={() => hocaDersiTetikle(ders.id, hoca.id)}
                                        className={`shrink-0 min-h-[40px] px-3.5 py-2 text-xs font-semibold border transition-colors whitespace-nowrap ${
                                          kontrol.alinabilir
                                            ? 'border-[#D99B38] bg-[#D99B38] hover:bg-[#E5AC4E] text-[#0B0E17] cursor-pointer'
                                            : 'border-[#273147] bg-[#0D1019] text-[#8B95AB] cursor-not-allowed'
                                        }`}
                                      >
                                        {kontrol.alinabilir
                                          ? `Dersi Al (-${ders.paraMaliyeti} ₺)`
                                          : kontrol.neden ?? 'Kilitli'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* ============================================================
                  MEKAN 3: MAHALLE MARKETİ
                 ============================================================ */}
              {state.aktifMekan === 'market' && (
                <div className="space-y-4">
                  {turetilmis.marketIndirimYuzde > 0 && (
                    <div
                      data-testid="market-discount-banner"
                      className="border border-[#3D8C66]/60 bg-[#101C18] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-[#6CC296] font-semibold">
                        Saygı İndirimi Aktif: Mahalle esnafı tüm market ürünlerinde %
                        {turetilmis.marketIndirimYuzde} indirim uyguluyor.
                      </span>
                      <span className="font-mono-tabular text-[#6CC296] font-bold shrink-0">
                        Saygı {state.itibar.saygi}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {YEMEK_LISTESI.filter((y) => y.mekan === 'market').map((urun) => {
                      const indirimliFiyat = indirimliMarketFiyati(
                        urun.fiyat,
                        turetilmis.marketIndirimYuzde
                      );
                      const indirimVar = indirimliFiyat < urun.fiyat;
                      const paraYeterli = state.para >= indirimliFiyat;

                      return (
                        <div
                          key={urun.id}
                          className="border border-[#273147] bg-[#121724] p-3.5 flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-display text-lg font-bold text-[#EAECEF]">
                                {urun.isim}
                              </span>
                              <div className="font-mono-tabular text-sm font-bold flex items-baseline gap-1.5 shrink-0">
                                {indirimVar && (
                                  <span className="text-xs line-through text-[#6B768F]">
                                    {urun.fiyat} ₺
                                  </span>
                                )}
                                <span className={indirimVar ? 'text-[#6CC296]' : 'text-[#D99B38]'}>
                                  {indirimliFiyat} ₺
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-[#8B95AB] mt-1 leading-snug">
                              {urun.aciklama}
                            </p>
                          </div>

                          <button
                            type="button"
                            data-testid={`market-buy-${urun.id}`}
                            onClick={() => {
                              playSfx('menu_tik');
                              onYemek(urun.id);
                            }}
                            disabled={!paraYeterli}
                            className={`min-h-[42px] w-full px-3 py-2 text-xs font-semibold border transition-colors ${
                              paraYeterli
                                ? 'border-[#3A4766] bg-[#181F30] hover:border-[#6CC296] hover:bg-[#222B42] text-[#EAECEF] cursor-pointer'
                                : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                            }`}
                          >
                            {urun.tur === 'erzak_stok'
                              ? `Eve Erzak Al (-${indirimliFiyat} ₺ · +${urun.stokKazanci} Öğün)`
                              : `Hemen Ye (-${indirimliFiyat} ₺ · +${urun.toklukArtisi} Tok · +${urun.enerjiArtisi} EN)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Market Çevresi Komşuları (C2) */}
                  {komsularBolumuRender()}
                </div>
              )}

              {/* ============================================================
                  MEKAN 4: İŞ YERİ (VARDİYALAR + İTİBAR KİLİTLİ TEKLİFLER)
                 ============================================================ */}
              {state.aktifMekan === 'is_yeri' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {EK_IS_TANIMLARI.map((is) => {
                    const saygiEksik =
                      is.gerekliSaygi !== undefined && state.itibar.saygi < is.gerekliSaygi;
                    const korkuEksik =
                      is.gerekliKorku !== undefined && state.itibar.korku < is.gerekliKorku;
                    const itibarKilitli = saygiEksik || korkuEksik;
                    const yeterliEnerji = state.enerji >= is.enerjiMaliyeti;
                    const tiklanabilir = !itibarKilitli && yeterliEnerji;

                    return (
                      <div
                        key={is.id}
                        data-testid={`job-card-${is.id}`}
                        className={`border p-3.5 flex flex-col justify-between gap-2.5 ${
                          itibarKilitli
                            ? 'border-[#273147] bg-[#0D1019]'
                            : is.gerekliKorku
                              ? 'border-[#D63838]/60 bg-[#181216]'
                              : is.gerekliSaygi
                                ? 'border-[#3D8C66]/60 bg-[#101C18]'
                                : 'border-[#273147] bg-[#121724]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-lg font-bold text-[#EAECEF]">
                              {is.isim}
                            </span>
                            <span className="font-mono-tabular text-sm font-bold text-[#6CC296] shrink-0">
                              +{is.paraOdulu} ₺
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold font-mono-tabular">
                            {is.gerekliSaygi && (
                              <span
                                className={`border px-1.5 py-0.5 font-sans ${
                                  saygiEksik
                                    ? 'border-[#273147] bg-[#121724] text-[#8B95AB]'
                                    : 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                                }`}
                              >
                                Saygı {is.gerekliSaygi}+
                              </span>
                            )}
                            {is.gerekliKorku && (
                              <span
                                className={`border px-1.5 py-0.5 font-sans ${
                                  korkuEksik
                                    ? 'border-[#273147] bg-[#121724] text-[#8B95AB]'
                                    : 'border-[#D63838]/60 bg-[#221417] text-[#E34A4A]'
                                }`}
                              >
                                Korku {is.gerekliKorku}+
                              </span>
                            )}
                            <span className="border border-[#273147] bg-[#0B0E17] px-1.5 py-0.5 text-[#A3ACBE]">
                              {is.sureDakika} dk
                            </span>
                            <span className="border border-[#273147] bg-[#0B0E17] px-1.5 py-0.5 text-[#E6B86A]">
                              -{is.enerjiMaliyeti} EN
                            </span>
                            <span className="border border-[#273147] bg-[#0B0E17] px-1.5 py-0.5 text-[#A3ACBE]">
                              -{is.toklukMaliyeti} Tok
                            </span>
                            {is.moralEtkisi !== undefined && is.moralEtkisi !== 0 && (
                              <span
                                className={`border px-1.5 py-0.5 ${
                                  is.moralEtkisi > 0
                                    ? 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                                    : 'border-[#D63838]/60 bg-[#221417] text-[#F18B8B]'
                                }`}
                              >
                                {is.moralEtkisi > 0 ? `+${is.moralEtkisi}` : is.moralEtkisi} Moral
                              </span>
                            )}
                            {is.saygiEtkisi !== undefined && is.saygiEtkisi !== 0 && (
                              <span
                                className={`border px-1.5 py-0.5 ${
                                  is.saygiEtkisi > 0
                                    ? 'border-[#3D8C66]/60 bg-[#12221D] text-[#6CC296]'
                                    : 'border-[#D63838]/60 bg-[#221417] text-[#F18B8B]'
                                }`}
                              >
                                {is.saygiEtkisi > 0 ? `+${is.saygiEtkisi}` : is.saygiEtkisi} Saygı
                              </span>
                            )}
                            {is.korkuEtkisi !== undefined && is.korkuEtkisi !== 0 && (
                              <span
                                className={`border px-1.5 py-0.5 ${
                                  is.korkuEtkisi > 0
                                    ? 'border-[#D99B38]/60 bg-[#1D170E] text-[#E6B86A]'
                                    : 'border-[#273147] bg-[#0B0E17] text-[#A3ACBE]'
                                }`}
                              >
                                {is.korkuEtkisi > 0 ? `+${is.korkuEtkisi}` : is.korkuEtkisi} Korku
                              </span>
                            )}
                            {is.riskNotu && (
                              <span className="border border-[#D99B38]/50 bg-[#1D170E] px-1.5 py-0.5 text-[#D99B38] font-sans">
                                {is.riskNotu}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8B95AB] leading-snug">{is.aciklama}</p>
                        </div>

                        <button
                          type="button"
                          data-shift={is.id}
                          onClick={() => {
                            playSfx('menu_tik');
                            onVardiya(is.id);
                          }}
                          disabled={!tiklanabilir}
                          className={`min-h-[42px] w-full px-3 py-2 text-xs font-semibold border transition-colors ${
                            tiklanabilir
                              ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D99B38] hover:bg-[#222B42] text-[#EAECEF] cursor-pointer'
                              : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                          }`}
                        >
                          {saygiEksik
                            ? `Kilitli (${is.gerekliSaygi} Saygı Gerekir)`
                            : korkuEksik
                              ? `Kilitli (${is.gerekliKorku} Korku Gerekir)`
                              : 'Vardiyaya Başla'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============================================================
                  MEKAN 5: GECE SOKAK ARENASI
                 ============================================================ */}
              {state.aktifMekan === 'sokak_arena' && (
                <div className="space-y-3.5">
                  {/* Ücretsiz Sokak Gölge Boksu */}
                  <div className="border border-[#273147] bg-[#121724] p-4 space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-bold text-[#EAECEF]">
                          Sokak Lambası Altında Gölge Boksu
                        </h3>
                        <p className="text-xs text-[#8B95AB] mt-0.5">
                          Cebinde paran yoksa bile sokak taşlarında ücretsiz ayak oyunu ve yumruk çalışabilirsin.
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs text-[#6CC296]">
                        Ücretsiz · 45 dk
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={golgeBoksuTetikle}
                      disabled={state.enerji < 14}
                      className={`min-h-[44px] w-full px-4 py-2 text-xs font-semibold border transition-colors ${
                        state.enerji >= 14
                          ? 'border-[#3A4766] bg-[#181F30] hover:border-[#D63838] text-[#EAECEF] cursor-pointer'
                          : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                      }`}
                    >
                      Gölge Boksu Yap (45 dk · -14 EN · -8 Tokluk · +Çeviklik)
                    </button>
                  </div>

                  {/* Yeraltı Sokak Maçları (B Aşaması Gerçek Zamanlı Dövüş + C3 Ring Tavrı) */}
                  <section className="space-y-2.5">
                    <div className="border border-[#273147] bg-[#121724] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#EAECEF]">
                          Yeraltı Sokak Maçları
                        </h3>
                        <p className="text-[11px] text-[#8B95AB]">
                          Can: {turetilmis.maksCan} · Stamina: {turetilmis.maksStamina} · Saygı:{' '}
                          <span className="text-[#6CC296] font-semibold">{state.itibar.saygi}</span> · Korku:{' '}
                          <span className="text-[#E34A4A] font-semibold">{state.itibar.korku}</span> · Galibiyet:{' '}
                          {state.macKazanmaSayisi ?? 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => gorunumAcKapa('yetenek_agaci')}
                          className="min-h-[36px] px-3 py-1.5 text-xs font-semibold border border-[#D99B38]/60 bg-[#1D170E] hover:border-[#D99B38] text-[#D99B38] whitespace-nowrap cursor-pointer"
                        >
                          Yetenek Ağacı ({turetilmis.yetenekPuani} YP)
                        </button>
                        <button
                          type="button"
                          onClick={() => gorunumAcKapa('hamleler')}
                          className="min-h-[36px] px-3 py-1.5 text-xs font-semibold border border-[#3A4766] bg-[#181F30] hover:border-[#D63838] text-[#EAECEF] whitespace-nowrap cursor-pointer"
                        >
                          Hamleler ({turetilmis.acikHamleIds.length})
                        </button>
                      </div>
                    </div>

                    {/* Ring Tavrı Seçimi (C3) */}
                    <div
                      data-testid="ring-stance-selector"
                      className="border border-[#273147] bg-[#121724] p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-[#A3ACBE]">
                        Ring Tavrı:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
                        {(
                          [
                            { id: 'temiz', label: 'Temiz (+Saygı)' },
                            { id: 'dengeli', label: 'Dengeli' },
                            { id: 'sert', label: 'Sert (+Korku)' },
                          ] as const
                        ).map((sec) => {
                          const aktif = (state.ringTavri ?? 'dengeli') === sec.id;
                          return (
                            <button
                              key={sec.id}
                              type="button"
                              data-testid={`ring-stance-${sec.id}`}
                              onClick={() => {
                                playSfx('menu_tik');
                                onRingTavriDegistir(sec.id);
                              }}
                              className={`min-h-[34px] px-2.5 py-1 text-[11px] font-semibold border transition-colors cursor-pointer ${
                                aktif
                                  ? sec.id === 'temiz'
                                    ? 'border-[#6CC296] bg-[#12221D] text-[#6CC296]'
                                    : sec.id === 'sert'
                                      ? 'border-[#E34A4A] bg-[#221417] text-[#E34A4A]'
                                      : 'border-[#D99B38] bg-[#221D15] text-[#D99B38]'
                                  : 'border-[#273147] bg-[#0B0E17] text-[#8B95AB] hover:text-[#EAECEF]'
                              }`}
                            >
                              {sec.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {(() => {
                      const hazirlik = macHazirlik;
                      const tarzEtiketi = {
                        saldirgan: 'Saldırgan',
                        cevik: 'Çevik',
                        savunmaci: 'Savunmacı',
                      } as const;

                      return (
                        <>
                          {!hazirlik.uygun && hazirlik.neden && (
                            <p className="text-xs text-[#D99B38] border border-[#D99B38]/40 bg-[#1B1610] px-3 py-2">
                              {hazirlik.neden}
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {RAKIP_LISTESI.map((rakip) => {
                              const yenildi = (state.yenilenRakipIds ?? []).includes(rakip.id);
                              const cekinme = rakipCekinmeHesapla(state.itibar.korku, rakip);
                              return (
                                <div
                                  key={rakip.id}
                                  className="border border-[#273147] bg-[#121724] p-3.5 flex flex-col justify-between gap-2.5"
                                >
                                  <div>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="font-display text-lg font-bold text-[#EAECEF]">
                                        {rakip.lakap}
                                      </span>
                                      <span className="font-mono-tabular text-xs font-bold text-[#6CC296]">
                                        +{rakip.paraOdulu} ₺
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                                      <span className="text-[#D99B38] font-medium">
                                        {tarzEtiketi[rakip.tarz]}
                                      </span>
                                      <span className="text-[#8B95AB]">· {rakip.seviyeEtiketi}</span>
                                      {yenildi && (
                                        <span className="text-[#6CC296] font-semibold">
                                          · Yenildi
                                        </span>
                                      )}
                                      {cekinme.yuzde > 0 ? (
                                        <span
                                          data-testid={`opponent-fear-badge-${rakip.id}`}
                                          className="border border-[#D63838]/50 bg-[#221417] px-1.5 py-0.5 text-[10px] font-semibold text-[#E34A4A]"
                                        >
                                          Çekiniyor -%{cekinme.yuzde} Stam
                                        </span>
                                      ) : (
                                        <span
                                          data-testid={`opponent-fear-badge-${rakip.id}`}
                                          className="border border-[#273147] bg-[#0B0E17] px-1.5 py-0.5 text-[10px] font-semibold text-[#8B95AB]"
                                        >
                                          Dirençli · Korku {cekinme.sonrakiEsik}+
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#8B95AB] mt-1.5 leading-snug">
                                      {rakip.aciklama}
                                    </p>
                                    <p className="font-mono-tabular text-[11px] text-[#A3ACBE] mt-2">
                                      GÜÇ {rakip.statlar.guc} · ÇEV {rakip.statlar.ceviklik} · REF{' '}
                                      {rakip.statlar.refleks} · DAY {rakip.statlar.dayaniklilik} · +
                                      {rakip.itibarOdulu} İtibar
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    data-fight={rakip.id}
                                    disabled={!hazirlik.uygun}
                                    onClick={() => {
                                      playSfx('menu_tik');
                                      onMacaBasla(rakip.id);
                                    }}
                                    className={`min-h-[42px] w-full px-3 py-2 text-xs font-semibold border transition-colors ${
                                      hazirlik.uygun
                                        ? 'border-[#D63838] bg-[#D63838] hover:bg-[#E34A4A] text-white cursor-pointer'
                                        : 'border-[#273147] bg-[#0D1019] text-[#5B657A] cursor-not-allowed'
                                    }`}
                                  >
                                    Maça Çık ({DOVUS_SABITLERI.macSureDakika} dk · -
                                    {DOVUS_SABITLERI.macEnerjiMaliyeti} EN · -
                                    {DOVUS_SABITLERI.macToklukMaliyeti} Tok)
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </section>

                  {/* Sokak Arenası Komşuları (C2) */}
                  {komsularBolumuRender()}
                </div>
              )}
            </>
          )}

          {/* Alt Günlük Kayıtlar & Sıfırlama */}
          <section className="space-y-3 border-t border-[#273147] pt-3 pb-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-[#8B95AB]">Son Kayıtlar</h3>
              <ul className="space-y-1 text-xs text-[#B3BCCB]">
                {state.gecmis.slice(0, 4).map((kayit, index) => (
                  <li key={index} className="flex items-baseline gap-2">
                    <span className="font-mono-tabular text-[#8B95AB] shrink-0">
                      G{kayit.gun} {kayit.saatMetni ?? ''}:
                    </span>
                    <span>{kayit.metin}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#273147]/60">
              <span className="text-[11px] text-[#606B82]">
                Otomatik kayıt tarayıcıda saklanır.
              </span>
              {!sifirlamaOnayi ? (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('menu_tik');
                    setSifirlamaOnayi(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8B95AB] hover:text-[#EAECEF] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Yeni Oyun Başlat</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#E34A4A]">Kayıt silinsin mi?</span>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('menu_tik');
                      setSifirlamaOnayi(false);
                      onSifirla();
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#D63838] text-white cursor-pointer"
                  >
                    Evet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('menu_tik');
                      setSifirlamaOnayi(false);
                    }}
                    className="px-2.5 py-1 text-[11px] border border-[#3A4766] bg-[#181F30] text-[#EAECEF] cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* Aktif Komşu veya Rastgele Ev Olayı Modalı */}
      {state.aktifKomsuOlayi ? (
        <EventModal
          olay={state.aktifKomsuOlayi}
          state={state}
          onSecenekSec={onKomsuSecenegi}
        />
      ) : state.aktifOlay ? (
        <EventModal
          olay={state.aktifOlay}
          state={state}
          onSecenekSec={onOlaySecenegi}
        />
      ) : null}
    </div>
  );
};
