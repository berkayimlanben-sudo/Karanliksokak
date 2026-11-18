import React, { useEffect, useState } from 'react';
import { RefreshCw, ArrowRight, Volume2 } from 'lucide-react';
import { KARAKTER_SABITLERI } from '../data/gameData';
import { OyunDurumu, rastgeleLakapSec } from '../game/engine';
import { TEMA } from '../game/theme';
import {
  initAudio,
  playSfx,
  sesKilidiBekliyorMu,
  subscribeSesKilidi,
} from '../game/sound';
import { AudioControls } from './AudioControls';
import { NeighborhoodCanvas } from './NeighborhoodCanvas';

interface TitleScreenProps {
  kayitliOyun: OyunDurumu | null;
  onDevamEt: () => void;
  onYeniBaslat: (lakap: string) => void;
}

/**
 * ============================================================================
 * GİRİŞ VE LAKAP SEÇİMİ EKRANI
 * Karakterin 2-3 cümlelik arka plan hikayesini ve lakap seçimini sunar.
 * ============================================================================
 */
export const TitleScreen: React.FC<TitleScreenProps> = ({
  kayitliOyun,
  onDevamEt,
  onYeniBaslat,
}) => {
  const [lakap, setLakap] = useState('');
  const [yeniModu, setYeniModu] = useState(!kayitliOyun);
  const [sesBekliyor, setSesBekliyor] = useState(() => sesKilidiBekliyorMu());

  useEffect(() => {
    setSesBekliyor(sesKilidiBekliyorMu());
    return subscribeSesKilidi(setSesBekliyor);
  }, []);

  const onerilenLakapGetir = () => {
    playSfx('menu_tik');
    const havuz = KARAKTER_SABITLERI.onerilenLakaplar.filter((l) => l !== lakap);
    const secilen = havuz[Math.floor(Math.random() * havuz.length)] ?? rastgeleLakapSec();
    setLakap(secilen);
  };

  useEffect(() => {
    const klavyeDinle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const aktifEl = document.activeElement as HTMLElement | null;
      const aktifEtiket = aktifEl?.tagName;
      if (aktifEl?.isContentEditable || aktifEtiket === 'TEXTAREA' || aktifEtiket === 'SELECT') {
        return;
      }
      if (aktifEtiket === 'INPUT') {
        if (aktifEl?.id === 'lakap-input' && e.key === 'Enter') {
          e.preventDefault();
          onYeniBaslat(lakap);
        }
        return;
      }
      if (aktifEtiket === 'BUTTON' || aktifEtiket === 'A') {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (kayitliOyun && !yeniModu) {
          onDevamEt();
        } else {
          onYeniBaslat(lakap);
        }
      }
    };

    window.addEventListener('keydown', klavyeDinle);
    return () => window.removeEventListener('keydown', klavyeDinle);
  }, [kayitliOyun, yeniModu, lakap, onDevamEt, onYeniBaslat]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between bg-[#0B0E17] text-[#EAECEF]">
      {/* Sağ Üst Ses Kontrolü */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex flex-wrap items-center justify-end gap-2">
        {sesBekliyor && (
          <button
            type="button"
            onClick={() => {
              initAudio();
              playSfx('menu_tik');
            }}
            className="inline-flex items-center gap-1.5 border border-[#3A4766] bg-[#121724]/95 hover:bg-[#181F30] px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#EAECEF] transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#D63838]" />
            <span>Ses için dokun ve başla</span>
          </button>
        )}
        <AudioControls compact />
      </div>
      {/* Arka plan (Masaüstü) / Üst Sahne Şeridi (Mobil): Diegetik 2D gece mahalle sahnesi */}
      <div className="relative h-44 sm:h-52 md:h-auto md:absolute md:inset-0 pointer-events-none shrink-0">
        <NeighborhoodCanvas
          mekanId="sokak_arena"
          gorunum={TEMA.varsayilanKarakterGorunumu}
          yorgunluk={15}
          moral={56}
          saatDakika={1320}
          aksiyonDarbesi={0}
          karakterKonumX={0.72}
        />
        <div
          className="hidden md:block absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,14,23,0.94) 0%, rgba(11,14,23,0.72) 44%, rgba(11,14,23,0.12) 100%)',
          }}
        />
        <div
          className="md:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,14,23,0.18) 0%, rgba(11,14,23,0.35) 55%, rgba(11,14,23,1) 100%)',
          }}
        />

        {/* Mobil Sahne Üstü Başlık Amblemi */}
        <div className="md:hidden absolute inset-x-0 bottom-2 px-4">
          <svg
            viewBox="0 0 420 92"
            className="w-full max-w-[250px] h-auto"
            role="img"
            aria-label="Karanlık Sokak"
          >
            <polygon points="0,8 408,2 400,82 6,88" fill="#121724" stroke="#3A4766" strokeWidth="2" />
            <rect x="14" y="18" width="6" height="54" fill="#D63838" />
            <text
              x="34"
              y="56"
              fill="#EAECEF"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="44"
              letterSpacing="2"
            >
              KARANLIK SOKAK
            </text>
            <text
              x="36"
              y="74"
              fill="#8B95AB"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="11"
              letterSpacing="3"
            >
              HAYATTA KAL · ÇALIŞ · SOKAKTA DÖVÜŞ
            </text>
          </svg>
        </div>
      </div>

      {/* İçerik Sütunu */}
      <div className="relative z-10 px-4 pt-2 pb-4 md:px-14 md:pt-12 max-w-2xl">
        {/* Masaüstü Başlık Amblemi */}
        <div className="hidden md:block mb-6">
          <svg
            viewBox="0 0 420 92"
            className="w-full max-w-[380px] h-auto"
            role="img"
            aria-label="Karanlık Sokak"
          >
            <polygon points="0,8 408,2 400,82 6,88" fill="#121724" stroke="#3A4766" strokeWidth="2" />
            <rect x="14" y="18" width="6" height="54" fill="#D63838" />
            <text
              x="34"
              y="56"
              fill="#EAECEF"
              fontFamily="Barlow Condensed, sans-serif"
              fontWeight="800"
              fontSize="44"
              letterSpacing="2"
            >
              KARANLIK SOKAK
            </text>
            <text
              x="36"
              y="74"
              fill="#8B95AB"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="11"
              letterSpacing="3"
            >
              HAYATTA KAL · ÇALIŞ · SOKAKTA DÖVÜŞ
            </text>
          </svg>
        </div>

        {/* Giriş Hikayesi (2-3 cümle) */}
        <section className="space-y-2 md:space-y-3 border border-[#273147] bg-[#121724]/95 p-4 md:p-6 mb-3 md:mb-6">
          <h1 className="font-display text-xl md:text-3xl font-bold tracking-wide text-[#EAECEF]">
            Evde Bekleyen İki Kişi Var
          </h1>
          {KARAKTER_SABITLERI.girisHikayesi.map((paragraf, idx) => (
            <p key={idx} className="text-xs sm:text-sm md:text-base leading-relaxed text-[#C8CFDC]">
              {paragraf}
            </p>
          ))}
        </section>

        {/* Devam Et veya Yeni Oyun Formu */}
        {kayitliOyun && !yeniModu ? (
          <section className="border border-[#273147] bg-[#121724]/95 p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#273147] pb-3">
              <div>
                <p className="text-xs text-[#8B95AB]">Kayıtlı İlerleme Bulundu</p>
                <p className="font-display text-xl md:text-2xl font-bold text-[#EAECEF]">
                  {kayitliOyun.oyuncu.gercekAd} &ldquo;{kayitliOyun.oyuncu.lakap}&rdquo;
                </p>
              </div>
              <div className="font-mono-tabular text-xs md:text-sm text-[#8B95AB]">
                Gün {kayitliOyun.gun} · {kayitliOyun.para} ₺
                {kayitliOyun.aktifDovusRakipId ? ' · Dövüş Başı' : ''}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3">
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  playSfx('menu_tik');
                  onDevamEt();
                }}
                className="min-h-[46px] md:min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 bg-[#D63838] hover:bg-[#E34A4A] text-white font-display text-lg font-bold tracking-wider px-5 py-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Kaldığın Yerden Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('menu_tik');
                  setYeniModu(true);
                }}
                className="min-h-[44px] md:min-h-[48px] inline-flex items-center justify-center border border-[#3A4766] bg-[#181F30] hover:bg-[#222B42] text-[#EAECEF] text-sm font-medium px-5 py-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                Yeni Başlangıç
              </button>
            </div>
          </section>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              playSfx('menu_tik');
              onYeniBaslat(lakap);
            }}
            className="border border-[#273147] bg-[#121724]/95 p-4 md:p-6 space-y-3 md:space-y-4"
          >
            <div>
              <label
                htmlFor="lakap-input"
                className="block text-sm font-semibold text-[#EAECEF] mb-1"
              >
                Dövüş Çevresindeki Lakabın
              </label>
              <p className="text-[11px] sm:text-xs text-[#8B95AB] mb-2.5">
                Annen Emine ve mahallenin eskileri sana Kerem der; arka sokaklar seni bu lakapla tanır. Boş bırakırsan rastgele seçilir.
              </p>
              <div className="flex gap-2">
                <input
                  id="lakap-input"
                  type="text"
                  maxLength={18}
                  value={lakap}
                  onChange={(e) => setLakap(e.target.value)}
                  placeholder="Örn: Gölge, Kuzgun, Balyoz..."
                  className="min-h-[44px] flex-1 min-w-0 bg-[#0B0E17] border border-[#3A4766] focus:border-[#D63838] focus:outline-none px-3 py-2 text-sm text-[#EAECEF] placeholder-[#606B82]"
                />
                <button
                  type="button"
                  onClick={onerilenLakapGetir}
                  className="min-h-[44px] inline-flex items-center gap-1.5 border border-[#3A4766] bg-[#181F30] hover:bg-[#222B42] text-[#EAECEF] text-xs font-medium px-3 py-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  aria-label="Rastgele lakap öner"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Öner</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
              <button
                type="submit"
                data-start="true"
                className="min-h-[46px] md:min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 bg-[#D63838] hover:bg-[#E34A4A] text-white font-display text-lg font-bold tracking-wider px-6 py-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Sokağa İn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {kayitliOyun && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('menu_tik');
                    setYeniModu(false);
                  }}
                  className="min-h-[44px] md:min-h-[48px] inline-flex items-center justify-center border border-[#3A4766] bg-[#181F30] hover:bg-[#222B42] text-[#EAECEF] text-sm font-medium px-5 py-2.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Vazgeç
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Alt kontrol ipucu satırı */}
      <footer className="relative z-10 px-4 pb-4 md:px-14 md:pb-5 text-[11px] sm:text-xs text-[#8B95AB]">
        <span className="hidden sm:inline">Enter Başlat · </span>Otomatik Kayıt Aktif · Gerçek Ad: Kerem
      </footer>
    </main>
  );
};
