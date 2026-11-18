import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bug,
  Download,
  FastForward,
  Music,
  RotateCcw,
  Sliders,
  Square,
  Swords,
  Trash2,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import { RAKIP_LISTESI, RakipTanimi, StatId } from '../data/gameData';
import { DENGE, dengeAlanlariniListele, dengeGuncelle, dengeSifirla } from '../game/balance';
import type { OyunDurumu } from '../game/engine';
import { MuzikRuhHali, playMusic, playSfx, SFX_LISTESI, stopMusic } from '../game/sound';
import {
  subscribeTelemetriLoglari,
  TelemetriKaydi,
  telemetriJsonIndir,
  telemetriLoglariniTemizle,
} from '../game/telemetry';

const MUZIK_RUH_HALLERI: Array<{ id: MuzikRuhHali; etiket: string }> = [
  { id: 'sakin', etiket: 'Sakin (80 BPM)' },
  { id: 'enerjik', etiket: 'Enerjik (120 BPM)' },
  { id: 'gergin', etiket: 'Gergin (160 BPM)' },
];

type DebugSekme = 'durum' | 'denge' | 'telemetri' | 'ses';

export function debugSesPaneliAktifMi(isDev: boolean, _search?: string): boolean {
  // Prodüksiyonda (?debug=1 dahil) debug paneli kesinlikle kapalıdır.
  return Boolean(isDev);
}

export interface AudioDebugPanelProps {
  oyunDurumu: OyunDurumu | null;
  onOyunDurumuAyarla?: (yeniDurum: OyunDurumu, kaynak?: string) => void;
  onAnindaGunBitir?: () => void;
  onKiraGununeAtla?: () => void;
  onZorlaMacBaslat?: (rakip: RakipTanimi) => void;
  onDengeDegisti?: () => void;
  onHataTesti?: () => void;
}

function sayiSinirla(deger: number, min: number, maks: number): number {
  if (!Number.isFinite(deger)) return min;
  return Math.max(min, Math.min(maks, Math.round(deger)));
}

/**
 * ============================================================================
 * GELİŞTİRİCİ DEBUG PANELİ (Yalnızca DEV ortamında render edilir)
 * Durum & hile ayarları, canlı balance.ts düzenleyici, yapılandırılmış telemetri
 * ve ses tetikleyicilerini tek panelde sunar.
 * ============================================================================
 */
export const AudioDebugPanel: React.FC<AudioDebugPanelProps> = ({
  oyunDurumu,
  onOyunDurumuAyarla,
  onAnindaGunBitir,
  onKiraGununeAtla,
  onZorlaMacBaslat,
  onDengeDegisti,
  onHataTesti,
}) => {
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
  const [sekme, setSekme] = useState<DebugSekme>('durum');

  // Ses durumu
  const [sonTetiklenen, setSonTetiklenen] = useState<string | null>(null);
  const [aktifTestMuzik, setAktifTestMuzik] = useState<MuzikRuhHali | null>(null);

  // Durum editörü taslak değerleri
  const [taslakPara, setTaslakPara] = useState('350');
  const [taslakGun, setTaslakGun] = useState('1');
  const [taslakEnerji, setTaslakEnerji] = useState('100');
  const [taslakTokluk, setTaslakTokluk] = useState('82');
  const [taslakMoral, setTaslakMoral] = useState('58');
  const [taslakGenelItibar, setTaslakGenelItibar] = useState('0');
  const [taslakSaygi, setTaslakSaygi] = useState('0');
  const [taslakKorku, setTaslakKorku] = useState('0');

  // Rakip seçimi ve stat özelleştirme
  const [seciliRakipId, setSeciliRakipId] = useState<string>(RAKIP_LISTESI[0].id);
  const [rakipStatTaslak, setRakipStatTaslak] = useState<Record<StatId, number>>({
    ...RAKIP_LISTESI[0].statlar,
  });

  // Denge editörü
  const [dengeArama, setDengeArama] = useState('');
  const [dengeGrup, setDengeGrup] = useState('tumu');
  const [dengeVersiyon, setDengeVersiyon] = useState(0);

  // Telemetri logları
  const [telemetriLoglari, setTelemetriLoglari] = useState<TelemetriKaydi[]>([]);

  useEffect(() => {
    if (!gosterilebilir) return;
    return subscribeTelemetriLoglari((loglar) => {
      setTelemetriLoglari(loglar);
    });
  }, [gosterilebilir]);

  useEffect(() => {
    if (!oyunDurumu) return;
    setTaslakPara(String(oyunDurumu.para));
    setTaslakGun(String(oyunDurumu.gun));
    setTaslakEnerji(String(oyunDurumu.enerji));
    setTaslakTokluk(String(oyunDurumu.tokluk));
    setTaslakMoral(String(oyunDurumu.moral));
    setTaslakGenelItibar(String(oyunDurumu.itibar.genel));
    setTaslakSaygi(String(oyunDurumu.itibar.saygi));
    setTaslakKorku(String(oyunDurumu.itibar.korku));
  }, [oyunDurumu]);

  useEffect(() => {
    const rakip = RAKIP_LISTESI.find((r) => r.id === seciliRakipId) ?? RAKIP_LISTESI[0];
    setRakipStatTaslak({ ...rakip.statlar });
  }, [seciliRakipId, dengeVersiyon]);

  const dengeAlanlari = useMemo(() => {
    void dengeVersiyon;
    return dengeAlanlariniListele();
  }, [dengeVersiyon]);

  const dengeGruplari = useMemo(() => {
    const set = new Set(dengeAlanlari.map((a) => a.grup));
    return ['tumu', ...Array.from(set)];
  }, [dengeAlanlari]);

  const filtrelenmisDenge = useMemo(() => {
    const arama = dengeArama.trim().toLowerCase();
    return dengeAlanlari.filter((alan) => {
      if (dengeGrup !== 'tumu' && alan.grup !== dengeGrup) return false;
      if (arama && !alan.yol.toLowerCase().includes(arama)) return false;
      return true;
    });
  }, [dengeAlanlari, dengeArama, dengeGrup]);

  if (!gosterilebilir) return null;

  const handleDurumUygula = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!oyunDurumu || !onOyunDurumuAyarla) return;

    const yeniPara = Math.max(0, Math.round(Number(taslakPara) || 0));
    const yeniGun = Math.max(1, Math.round(Number(taslakGun) || 1));
    const yeniEnerji = sayiSinirla(Number(taslakEnerji), 0, oyunDurumu.maksEnerji);
    const yeniTokluk = sayiSinirla(Number(taslakTokluk), 0, 100);
    const yeniMoral = sayiSinirla(Number(taslakMoral), 0, 100);
    const maksItibar = DENGE.verimVeEsikler.maksItibar;
    const yeniGenel = Math.max(0, Math.round(Number(taslakGenelItibar) || 0));
    const yeniSaygi = sayiSinirla(Number(taslakSaygi), 0, maksItibar);
    const yeniKorku = sayiSinirla(Number(taslakKorku), 0, maksItibar);

    onOyunDurumuAyarla(
      {
        ...oyunDurumu,
        para: yeniPara,
        gun: yeniGun,
        enerji: yeniEnerji,
        tokluk: yeniTokluk,
        moral: yeniMoral,
        itibar: {
          genel: yeniGenel,
          saygi: yeniSaygi,
          korku: yeniKorku,
        },
      },
      'debug_manuel'
    );
  };

  const handleZorlaDovus = () => {
    if (!oyunDurumu || !onZorlaMacBaslat) return;
    const temelRakip = RAKIP_LISTESI.find((r) => r.id === seciliRakipId) ?? RAKIP_LISTESI[0];
    onZorlaMacBaslat({
      ...temelRakip,
      statlar: {
        guc: Math.max(1, Math.round(rakipStatTaslak.guc || 1)),
        ceviklik: Math.max(1, Math.round(rakipStatTaslak.ceviklik || 1)),
        refleks: Math.max(1, Math.round(rakipStatTaslak.refleks || 1)),
        dayaniklilik: Math.max(1, Math.round(rakipStatTaslak.dayaniklilik || 1)),
      },
    });
  };

  const handleDengeGuncelle = (yol: string, hamDeger: string) => {
    const sayi = Number(hamDeger);
    if (!Number.isFinite(sayi)) return;
    if (dengeGuncelle(yol, sayi)) {
      setDengeVersiyon((v) => v + 1);
      onDengeDegisti?.();
    }
  };

  const handleDengeSifirla = () => {
    dengeSifirla();
    setDengeVersiyon((v) => v + 1);
    onDengeDegisti?.();
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-[60]">
      {!acik ? (
        <button
          type="button"
          data-testid="audio-debug-toggle"
          onClick={() => setAcik(true)}
          className="inline-flex items-center gap-1.5 border border-[#3A4766] bg-[#121724]/95 hover:border-[#D99B38] px-2.5 py-1.5 text-[11px] font-semibold text-[#C8CFDC] shadow-lg transition-colors cursor-pointer"
          title="Debug Panelini Aç (?debug=1)"
        >
          <Bug className="w-3.5 h-3.5 text-[#D99B38]" />
          <span>Debug</span>
        </button>
      ) : (
        <section
          data-testid="audio-debug-panel"
          aria-label="Geliştirici Debug Paneli"
          className="w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] max-h-[82vh] flex flex-col border border-[#3A4766] bg-[#121724]/98 text-[#EAECEF] shadow-2xl"
        >
          <header className="border-b border-[#273147] bg-[#181F30] px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bug className="w-3.5 h-3.5 text-[#D99B38] shrink-0" />
              <h3 className="font-display text-sm font-bold tracking-wide text-[#EAECEF] truncate">
                Geliştirici Debug Paneli (DEV)
              </h3>
            </div>
            <button
              type="button"
              data-testid="audio-debug-close"
              onClick={() => setAcik(false)}
              aria-label="Debug Panelini Kapat"
              className="p-1 border border-[#273147] bg-[#0B0E17] hover:border-[#D63838] text-[#EAECEF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </header>

          {/* Sekmeler */}
          <nav
            aria-label="Debug Panel Sekmeleri"
            className="grid grid-cols-4 border-b border-[#273147] bg-[#0F1420] text-[11px] font-semibold"
          >
            <button
              type="button"
              data-testid="debug-tab-state"
              onClick={() => setSekme('durum')}
              className={`inline-flex items-center justify-center gap-1 py-2 border-r border-[#273147] cursor-pointer transition-colors ${
                sekme === 'durum'
                  ? 'bg-[#1D2539] text-[#F5D08A] border-b-2 border-b-[#D99B38]'
                  : 'text-[#8B95AB] hover:text-[#EAECEF]'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Durum</span>
            </button>
            <button
              type="button"
              data-testid="debug-tab-balance"
              onClick={() => setSekme('denge')}
              className={`inline-flex items-center justify-center gap-1 py-2 border-r border-[#273147] cursor-pointer transition-colors ${
                sekme === 'denge'
                  ? 'bg-[#1D2539] text-[#F5D08A] border-b-2 border-b-[#D99B38]'
                  : 'text-[#8B95AB] hover:text-[#EAECEF]'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Denge</span>
            </button>
            <button
              type="button"
              data-testid="debug-tab-telemetry"
              onClick={() => setSekme('telemetri')}
              className={`inline-flex items-center justify-center gap-1 py-2 border-r border-[#273147] cursor-pointer transition-colors ${
                sekme === 'telemetri'
                  ? 'bg-[#1D2539] text-[#F5D08A] border-b-2 border-b-[#D99B38]'
                  : 'text-[#8B95AB] hover:text-[#EAECEF]'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Log ({telemetriLoglari.length})</span>
            </button>
            <button
              type="button"
              data-testid="debug-tab-audio"
              onClick={() => setSekme('ses')}
              className={`inline-flex items-center justify-center gap-1 py-2 cursor-pointer transition-colors ${
                sekme === 'ses'
                  ? 'bg-[#1D2539] text-[#F5D08A] border-b-2 border-b-[#D99B38]'
                  : 'text-[#8B95AB] hover:text-[#EAECEF]'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Ses</span>
            </button>
          </nav>

          <div className="p-3 space-y-3 overflow-y-auto text-xs">
            {/* SEKME 1: DURUM & HİLE */}
            {sekme === 'durum' && (
              <>
                {!oyunDurumu ? (
                  <p className="text-[11px] text-[#8B95AB] border border-[#273147] bg-[#0B0E17] p-2.5">
                    Durum ayarları için önce bir oyun başlatın veya &quot;Devam Et&quot;e basın.
                  </p>
                ) : (
                  <>
                    {/* Hızlı Gün & Kira Aksiyonları */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        data-testid="debug-end-day"
                        onClick={() => onAnindaGunBitir?.()}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold border border-[#3A4766] bg-[#182236] hover:border-[#D99B38] text-[#EAECEF] cursor-pointer"
                      >
                        <FastForward className="w-3 h-3 text-[#D99B38]" />
                        <span>Anında Gün Bitir</span>
                      </button>
                      <button
                        type="button"
                        data-testid="debug-jump-rent-day"
                        onClick={() => onKiraGununeAtla?.()}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold border border-[#D99B38]/60 bg-[#241E12] hover:border-[#D99B38] text-[#F5D08A] cursor-pointer"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>Kira Gününe Atla</span>
                      </button>
                    </div>

                    {/* Sayısal Değerler */}
                    <form onSubmit={handleDurumUygula} className="space-y-2 border border-[#273147] bg-[#0B0E17] p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#EAECEF]">
                          Oyuncu Durumu (Gün {oyunDurumu.gun})
                        </span>
                        <button
                          type="button"
                          data-testid="debug-para-1000"
                          onClick={() => {
                            setTaslakPara('1000');
                            onOyunDurumuAyarla?.(
                              { ...oyunDurumu, para: 1000 },
                              'debug_hizli_para'
                            );
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-mono-tabular border border-[#273147] bg-[#181F30] hover:border-[#6CC296] text-[#6CC296] cursor-pointer"
                        >
                          Para = 1000 ₺
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Para (₺)</span>
                          <input
                            type="number"
                            data-testid="debug-input-para"
                            value={taslakPara}
                            onChange={(e) => setTaslakPara(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Gün</span>
                          <input
                            type="number"
                            min={1}
                            data-testid="debug-input-gun"
                            value={taslakGun}
                            onChange={(e) => setTaslakGun(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Enerji (0–{oyunDurumu.maksEnerji})</span>
                          <input
                            type="number"
                            min={0}
                            max={oyunDurumu.maksEnerji}
                            data-testid="debug-input-enerji"
                            value={taslakEnerji}
                            onChange={(e) => setTaslakEnerji(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Tokluk (0–100)</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            data-testid="debug-input-tokluk"
                            value={taslakTokluk}
                            onChange={(e) => setTaslakTokluk(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Moral (0–100)</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            data-testid="debug-input-moral"
                            value={taslakMoral}
                            onChange={(e) => setTaslakMoral(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Genel İtibar</span>
                          <input
                            type="number"
                            min={0}
                            data-testid="debug-input-itibar"
                            value={taslakGenelItibar}
                            onChange={(e) => setTaslakGenelItibar(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Saygı</span>
                          <input
                            type="number"
                            min={0}
                            max={DENGE.verimVeEsikler.maksItibar}
                            data-testid="debug-input-saygi"
                            value={taslakSaygi}
                            onChange={(e) => setTaslakSaygi(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[#8B95AB]">Korku</span>
                          <input
                            type="number"
                            min={0}
                            max={DENGE.verimVeEsikler.maksItibar}
                            data-testid="debug-input-korku"
                            value={taslakKorku}
                            onChange={(e) => setTaslakKorku(e.target.value)}
                            className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        data-testid="debug-apply-state"
                        className="w-full py-1.5 text-[11px] font-semibold border border-[#6CC296]/70 bg-[#14261E] hover:border-[#6CC296] text-[#6CC296] cursor-pointer"
                      >
                        Durum Değerlerini Uygula
                      </button>
                    </form>

                    {/* Rakip Seçimi & Stat Override + Zorla Dövüş */}
                    <div className="space-y-2 border border-[#273147] bg-[#0B0E17] p-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#EAECEF]">
                        <Swords className="w-3.5 h-3.5 text-[#D63838]" />
                        <span>Rakip Seç &amp; Stat Düzenle</span>
                      </div>

                      <label className="flex flex-col gap-0.5 text-[11px]">
                        <span className="text-[#8B95AB]">Rakip</span>
                        <select
                          data-testid="debug-opponent-select"
                          value={seciliRakipId}
                          onChange={(e) => setSeciliRakipId(e.target.value)}
                          className="px-2 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF]"
                        >
                          {RAKIP_LISTESI.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.lakap} ({r.seviyeEtiketi})
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                        {(['guc', 'ceviklik', 'refleks', 'dayaniklilik'] as StatId[]).map(
                          (statKey) => (
                            <label key={statKey} className="flex flex-col gap-0.5">
                              <span className="text-[#8B95AB] uppercase">{statKey.slice(0, 3)}</span>
                              <input
                                type="number"
                                min={1}
                                max={30}
                                data-testid={`debug-opponent-stat-${statKey}`}
                                value={rakipStatTaslak[statKey]}
                                onChange={(e) =>
                                  setRakipStatTaslak((prev) => ({
                                    ...prev,
                                    [statKey]: Math.max(1, Number(e.target.value) || 1),
                                  }))
                                }
                                className="px-1.5 py-1 bg-[#121724] border border-[#273147] text-[#EAECEF] font-mono-tabular"
                              />
                            </label>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid="debug-force-fight"
                        onClick={handleZorlaDovus}
                        className="w-full py-1.5 text-[11px] font-semibold border border-[#D63838]/70 bg-[#241317] hover:border-[#E34A4A] text-[#F2A6A6] cursor-pointer"
                      >
                        Seçili Rakiple Maçı Başlat (Zorla)
                      </button>
                    </div>

                    {onHataTesti && (
                      <button
                        type="button"
                        data-testid="debug-trigger-crash"
                        onClick={onHataTesti}
                        className="w-full py-1.5 text-[10px] font-semibold border border-[#3A4766] bg-[#141118] hover:border-[#E34A4A] text-[#8B95AB] hover:text-[#F2A6A6] cursor-pointer"
                      >
                        ErrorBoundary Testi (Bileşen Çökert)
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* SEKME 2: CANLI BALANCE.TS DÜZENLEYİCİ */}
            {sekme === 'denge' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8B95AB]">
                    Canlı bellek düzenleme (kaydetmez)
                  </span>
                  <button
                    type="button"
                    data-testid="debug-balance-reset"
                    onClick={handleDengeSifirla}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-[#3A4766] bg-[#181F30] hover:border-[#D99B38] text-[#F5D08A] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Varsayılana Dön</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    aria-label="Denge Grubu Filtrele"
                    data-testid="debug-balance-group"
                    value={dengeGrup}
                    onChange={(e) => setDengeGrup(e.target.value)}
                    className="px-2 py-1 text-[11px] bg-[#0B0E17] border border-[#273147] text-[#EAECEF]"
                  >
                    {dengeGruplari.map((g) => (
                      <option key={g} value={g}>
                        {g === 'tumu' ? 'Tüm Gruplar' : g}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label="Denge Alanı Ara"
                    data-testid="debug-balance-search"
                    placeholder="Ara (örn: kira, hasar)"
                    value={dengeArama}
                    onChange={(e) => setDengeArama(e.target.value)}
                    className="px-2 py-1 text-[11px] bg-[#0B0E17] border border-[#273147] text-[#EAECEF]"
                  />
                </div>

                <div className="max-h-[48vh] overflow-y-auto border border-[#273147] bg-[#0B0E17] divide-y divide-[#1D2539]">
                  {filtrelenmisDenge.map((alan) => (
                    <label
                      key={alan.yol}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px]"
                    >
                      <span className="font-mono-tabular text-[#C8CFDC] truncate" title={alan.yol}>
                        {alan.yol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        data-testid={`debug-balance-${alan.yol}`}
                        value={alan.deger}
                        onChange={(e) => handleDengeGuncelle(alan.yol, e.target.value)}
                        className="w-20 shrink-0 px-1.5 py-0.5 text-right bg-[#121724] border border-[#273147] text-[#F5D08A] font-mono-tabular"
                      />
                    </label>
                  ))}
                  {filtrelenmisDenge.length === 0 && (
                    <p className="p-2.5 text-[11px] text-[#8B95AB]">Eşleşen ayar bulunamadı.</p>
                  )}
                </div>
              </div>
            )}

            {/* SEKME 3: TELEMETRİ LOGLARI */}
            {sekme === 'telemetri' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid="debug-download-logs"
                    onClick={() => telemetriJsonIndir()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold border border-[#6CC296]/70 bg-[#14261E] hover:border-[#6CC296] text-[#6CC296] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Logu İndir (JSON)</span>
                  </button>
                  <button
                    type="button"
                    data-testid="debug-clear-logs"
                    onClick={() => telemetriLoglariniTemizle()}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold border border-[#273147] bg-[#0B0E17] hover:border-[#D63838] text-[#C8CFDC] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Temizle</span>
                  </button>
                </div>

                <div
                  data-testid="debug-telemetry-list"
                  className="max-h-[48vh] overflow-y-auto border border-[#273147] bg-[#0B0E17] p-2 space-y-1 font-mono-tabular text-[10px]"
                >
                  {telemetriLoglari.length === 0 ? (
                    <p className="text-[#8B95AB]">
                      Henüz yapılandırılmış log yok. Gün bitir, kira öde, para kazan veya dövüş.
                    </p>
                  ) : (
                    [...telemetriLoglari].reverse().map((log) => (
                      <div
                        key={log.id}
                        className="border-b border-[#181F30] pb-1 text-[#C8CFDC] break-all"
                      >
                        <span className="text-[#D99B38]">{log.satir}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SEKME 4: SES TETİKLEYİCİLERİ (D1 KORUNDU) */}
            {sekme === 'ses' && (
              <>
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
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
