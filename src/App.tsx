import { useCallback, useEffect, useState } from 'react';
import { KARAKTER_SABITLERI, RAKIP_LISTESI, RakipTanimi, StatId } from './data/gameData';
import {
  acilCorbaIc,
  aileyleEtkiles,
  antrenmanYap,
  dovusSonucunuUygula,
  durumuKaydet,
  durumuYukle,
  evdeUyuVeGunuBitir,
  evEsyasiAl,
  evYukselt,
  hocaDersiAl,
  kaydiSil,
  komsuDayanismasiAl,
  komsuEtkilesimiBaslat,
  komsuSecenegiUygula,
  macaGirilebilirMi,
  MacSonucOzeti,
  mekanaGit,
  olaySecenegiUygula,
  OyunDurumu,
  ringTavriDegistir,
  RingTavri,
  sokakGolgeBoksu,
  vardiyaYap,
  yemekYe,
  yeniOyunOlustur,
  yetenekAc,
} from './game/engine';
import { MekanId, temaDegiskenleriniUygula } from './game/theme';
import { getSesAyarlari, mute, MuzikRuhHali, playMusic, playSfx } from './game/sound';
import { TitleScreen } from './components/TitleScreen';
import { HomeHub } from './components/HomeHub';
import { ArenaCombatView } from './components/ArenaCombatView';
import { AudioDebugPanel } from './components/AudioDebugPanel';

/**
 * ============================================================================
 * BÖLÜM 4: ANA UYGULAMA KÖKÜ
 * Ekran durumunu ('title' | 'playing' | 'fighting') yönetir, otomatik kayıt ile senkronize eder.
 * ============================================================================
 */
const RAKIP_HARITASI = new Map(RAKIP_LISTESI.map((r) => [r.id, r]));

export default function App() {
  const [kayitliOyun, setKayitliOyun] = useState<OyunDurumu | null>(() => durumuYukle());
  const [oyunDurumu, setOyunDurumu] = useState<OyunDurumu | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return durumuYukle() ?? yeniOyunOlustur(KARAKTER_SABITLERI.varsayilanLakap);
      }
    }
    return null;
  });
  const [aktifRakip, setAktifRakip] = useState<RakipTanimi | null>(null);

  // Tema CSS değişkenlerini yükleme anında uygula
  useEffect(() => {
    temaDegiskenleriniUygula();
  }, []);

  // Global [M] tuşu ile master mute aç/kapat
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'm' && e.key !== 'M') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const aktif = document.activeElement?.tagName;
      if (aktif === 'INPUT' || aktif === 'TEXTAREA' || aktif === 'SELECT') return;
      e.preventDefault();
      const yeniKapali = !getSesAyarlari().masterMute;
      mute('master', yeniKapali);
      if (!yeniKapali) {
        playSfx('menu_tik');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Oyun durumunu document.body.dataset.state üzerine yansıt
  useEffect(() => {
    document.body.dataset.state = !oyunDurumu
      ? 'title'
      : aktifRakip
        ? 'fighting'
        : 'playing';
  }, [oyunDurumu, aktifRakip]);

  // Aktif ekran ve mekana göre müzik ruh halini 1.5 sn crossfade ile güncelle
  const aktifMuzikRuhHali: MuzikRuhHali = !oyunDurumu
    ? 'sakin'
    : aktifRakip
      ? 'gergin'
      : oyunDurumu.aktifMekan === 'spor_salonu'
        ? 'enerjik'
        : oyunDurumu.aktifMekan === 'sokak_arena'
          ? 'gergin'
          : 'sakin';

  useEffect(() => {
    playMusic(aktifMuzikRuhHali);
  }, [aktifMuzikRuhHali]);

  // Her değişiklikte otomatik kaydet
  useEffect(() => {
    if (oyunDurumu) {
      durumuKaydet(oyunDurumu);
    }
  }, [oyunDurumu]);

  const handleDevamEt = useCallback(() => {
    if (kayitliOyun) {
      setOyunDurumu(kayitliOyun);
    }
  }, [kayitliOyun]);

  const handleYeniBaslat = useCallback((lakap: string) => {
    const yeni = yeniOyunOlustur(lakap);
    durumuKaydet(yeni);
    setKayitliOyun(yeni);
    setAktifRakip(null);
    setOyunDurumu(yeni);
  }, []);

  const handleSifirla = useCallback(() => {
    kaydiSil();
    setKayitliOyun(null);
    setAktifRakip(null);
    setOyunDurumu(null);
  }, []);

  const durumGuncelle = useCallback((fn: (onceki: OyunDurumu) => OyunDurumu) => {
    setOyunDurumu((onceki) => (onceki ? fn(onceki) : onceki));
  }, []);

  const handleMacaBasla = useCallback(
    (rakipId: string) => {
      if (!oyunDurumu) return;
      const hazir = macaGirilebilirMi(oyunDurumu);
      if (!hazir.uygun) return;
      const rakip = RAKIP_HARITASI.get(rakipId);
      if (rakip) {
        setAktifRakip(rakip);
      }
    },
    [oyunDurumu]
  );

  const handleMacBitti = useCallback(
    (kazanan: 'oyuncu' | 'rakip' | 'berabere'): MacSonucOzeti => {
      if (!oyunDurumu || !aktifRakip) {
        return {
          kazanan,
          paraDegisimi: 0,
          itibarDegisimi: 0,
          moralDegisimi: 0,
          statNotu: '',
        };
      }
      const { yeniDurum, ozet } = dovusSonucunuUygula(
        oyunDurumu,
        aktifRakip.id,
        kazanan
      );
      setOyunDurumu(yeniDurum);
      return ozet;
    },
    [oyunDurumu, aktifRakip]
  );

  const handleArenadanCik = useCallback(() => {
    setAktifRakip(null);
  }, []);

  const aktifEkran = !oyunDurumu ? (
    <TitleScreen
      kayitliOyun={kayitliOyun}
      onDevamEt={handleDevamEt}
      onYeniBaslat={handleYeniBaslat}
    />
  ) : aktifRakip ? (
    <ArenaCombatView
      oyun={oyunDurumu}
      rakip={aktifRakip}
      onMacBitti={handleMacBitti}
      onArenadanCik={handleArenadanCik}
    />
  ) : (
    <HomeHub
      state={oyunDurumu}
      onMekanaGit={(hedefMekan: MekanId) =>
        durumGuncelle((s) => mekanaGit(s, hedefMekan))
      }
      onAntrenman={(statId: StatId, secenek) =>
        durumGuncelle((s) => antrenmanYap(s, statId, secenek))
      }
      onSokakGolgeBoksu={() => durumGuncelle((s) => sokakGolgeBoksu(s))}
      onVardiya={(isId: string) => durumGuncelle((s) => vardiyaYap(s, isId))}
      onYemek={(yemekId: string) => durumGuncelle((s) => yemekYe(s, yemekId))}
      onAcilCorba={() => durumGuncelle((s) => acilCorbaIc(s))}
      onAileEtkiles={(uyeId) => durumGuncelle((s) => aileyleEtkiles(s, uyeId))}
      onEvEsyasiAl={(esyaId: string) => durumGuncelle((s) => evEsyasiAl(s, esyaId))}
      onEvYukselt={() => durumGuncelle((s) => evYukselt(s))}
      onUyuVeGunuBitir={() => durumGuncelle((s) => evdeUyuVeGunuBitir(s))}
      onOlaySecenegi={(secenekId: string) =>
        durumGuncelle((s) => olaySecenegiUygula(s, secenekId))
      }
      onHocaDersiAl={(dersId: string) =>
        durumGuncelle((s) => hocaDersiAl(s, dersId))
      }
      onKomsuEtkiles={(komsuId: string) =>
        durumGuncelle((s) => komsuEtkilesimiBaslat(s, komsuId))
      }
      onKomsuSecenegi={(secenekId: string) =>
        durumGuncelle((s) => komsuSecenegiUygula(s, secenekId))
      }
      onYetenekAc={(yetenekId: string) =>
        durumGuncelle((s) => yetenekAc(s, yetenekId))
      }
      onKomsuDayanisma={() => durumGuncelle((s) => komsuDayanismasiAl(s))}
      onRingTavriDegistir={(tavir: RingTavri) =>
        durumGuncelle((s) => ringTavriDegistir(s, tavir))
      }
      onMacaBasla={handleMacaBasla}
      onSifirla={handleSifirla}
    />
  );

  return (
    <>
      {aktifEkran}
      <AudioDebugPanel />
    </>
  );
}
