import { useCallback, useEffect, useRef, useState } from 'react';
import { KARAKTER_SABITLERI, RAKIP_LISTESI, RakipTanimi, StatId } from './data/gameData';
import { DENGE, dengeAboneOl } from './game/balance';
import {
  durumuKaydet,
  durumuYukle,
  evdeUyuVeGunuBitir,
  kaydiSil,
  kiraBorcuOde,
  komsuOlayiniKapat,
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
  acilCorbaIc,
  aileyleEtkiles,
  antrenmanYap,
  dovusSonucunuUygula,
  evEsyasiAl,
  evYukselt,
  hocaDersiAl,
  komsuDayanismasiAl,
  komsuEtkilesimiBaslat,
  komsuSecenegiUygula,
} from './game/engine';
import { telemetriDovusSonucuLogla, telemetriDurumFarkiniLogla } from './game/telemetry';
import { MekanId, temaDegiskenleriniUygula } from './game/theme';
import { getSesAyarlari, mute, MuzikRuhHali, playMusic, playSfx } from './game/sound';
import { TitleScreen } from './components/TitleScreen';
import { HomeHub } from './components/HomeHub';
import { ArenaCombatView } from './components/ArenaCombatView';
import { AudioDebugPanel } from './components/AudioDebugPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * ============================================================================
 * BÖLÜM 4: ANA UYGULAMA KÖKÜ
 * Ekran durumunu ('title' | 'playing' | 'fighting') yönetir, güvenli otomatik
 * kayıt (gün sonu + dövüş başı/sonu) ve ErrorBoundary ile korur.
 * ============================================================================
 */
const RAKIP_HARITASI = new Map(RAKIP_LISTESI.map((r) => [r.id, r]));

interface AppIcerikProps {
  baslangicDurumu?: OyunDurumu | null;
}

function AppIcerik({ baslangicDurumu }: AppIcerikProps) {
  const [kayitliOyun, setKayitliOyun] = useState<OyunDurumu | null>(() =>
    baslangicDurumu !== undefined ? baslangicDurumu : durumuYukle()
  );
  const [oyunDurumu, setOyunDurumu] = useState<OyunDurumu | null>(() => {
    if (baslangicDurumu !== undefined) {
      return baslangicDurumu;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return durumuYukle() ?? yeniOyunOlustur(KARAKTER_SABITLERI.varsayilanLakap);
      }
    }
    return null;
  });
  const [aktifRakip, setAktifRakip] = useState<RakipTanimi | null>(() => {
    if (oyunDurumu?.aktifDovusRakipId) {
      return RAKIP_HARITASI.get(oyunDurumu.aktifDovusRakipId) ?? null;
    }
    return null;
  });
  const [macAnahtari, setMacAnahtari] = useState(0);
  const [, setDengeRevizyon] = useState(0);
  const [debugCokme, setDebugCokme] = useState(false);
  const oyunDurumuRef = useRef<OyunDurumu | null>(oyunDurumu);
  oyunDurumuRef.current = oyunDurumu;

  if (debugCokme) {
    throw new Error('Test amaçlı simüle edilen bileşen çökmesi');
  }

  // Canlı denge değişikliklerinde bileşeni yeniden çiz
  useEffect(() => {
    return dengeAboneOl(() => {
      setDengeRevizyon((r) => r + 1);
    });
  }, []);

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

  // Dövüş ortasında kayıt yok: yalnızca dövüş dışında otomatik kaydet
  useEffect(() => {
    if (oyunDurumu && !aktifRakip) {
      durumuKaydet(oyunDurumu);
    }
  }, [oyunDurumu, aktifRakip]);

  // Sekme kapanırken dövüş ortasında değilsek son güvenli noktayı yaz
  useEffect(() => {
    const guvenliKaydet = () => {
      if (oyunDurumuRef.current && !aktifRakip) {
        durumuKaydet(oyunDurumuRef.current);
      }
    };
    window.addEventListener('pagehide', guvenliKaydet);
    return () => window.removeEventListener('pagehide', guvenliKaydet);
  }, [aktifRakip]);

  const handleDevamEt = useCallback(() => {
    const hedef = durumuYukle() ?? kayitliOyun;
    if (hedef) {
      const bekleyenRakip = hedef.aktifDovusRakipId
        ? RAKIP_HARITASI.get(hedef.aktifDovusRakipId) ?? null
        : null;
      oyunDurumuRef.current = hedef;
      setOyunDurumu(hedef);
      setMacAnahtari((k) => k + 1);
      setAktifRakip(bekleyenRakip);
    }
  }, [kayitliOyun]);

  const handleYeniBaslat = useCallback((lakap: string) => {
    const yeni = yeniOyunOlustur(lakap);
    durumuKaydet(yeni);
    oyunDurumuRef.current = yeni;
    setKayitliOyun(yeni);
    setAktifRakip(null);
    setOyunDurumu(yeni);
  }, []);

  const handleSifirla = useCallback(() => {
    kaydiSil();
    oyunDurumuRef.current = null;
    setKayitliOyun(null);
    setAktifRakip(null);
    setOyunDurumu(null);
  }, []);

  const durumGuncelle = useCallback(
    (fn: (onceki: OyunDurumu) => OyunDurumu, kaynak = 'aksiyon') => {
      const onceki = oyunDurumuRef.current;
      if (!onceki) return;
      const sonraki = fn(onceki);
      if (sonraki === onceki) return;
      oyunDurumuRef.current = sonraki;
      telemetriDurumFarkiniLogla(onceki, sonraki, kaynak);
      if (
        !aktifRakip &&
        (sonraki.gun !== onceki.gun || kaynak === 'uyku' || kaynak === 'debug_gun_bitir')
      ) {
        durumuKaydet(sonraki);
      }
      setOyunDurumu(sonraki);
    },
    [aktifRakip]
  );

  const handleMacaBasla = useCallback(
    (rakipId: string) => {
      const mevcut = oyunDurumuRef.current;
      if (!mevcut) return;
      const hazir = macaGirilebilirMi(mevcut);
      if (!hazir.uygun) return;
      const rakip = RAKIP_HARITASI.get(rakipId);
      if (rakip) {
        // Dövüş başında autosave: olası sekme kapanmasında dövüş başına dönülür
        const dovusBasiDurum: OyunDurumu = {
          ...mevcut,
          aktifDovusRakipId: rakip.id,
        };
        durumuKaydet(dovusBasiDurum);
        oyunDurumuRef.current = dovusBasiDurum;
        setKayitliOyun(dovusBasiDurum);
        setOyunDurumu(dovusBasiDurum);
        setMacAnahtari((k) => k + 1);
        setAktifRakip(rakip);
      }
    },
    []
  );

  const handleMacBitti = useCallback(
    (kazanan: 'oyuncu' | 'rakip' | 'berabere'): MacSonucOzeti => {
      const mevcut = oyunDurumuRef.current;
      if (!mevcut || !aktifRakip) {
        return {
          kazanan,
          paraDegisimi: 0,
          itibarDegisimi: 0,
          moralDegisimi: 0,
          statNotu: '',
        };
      }
      const { yeniDurum, ozet } = dovusSonucunuUygula(
        mevcut,
        aktifRakip.id,
        kazanan
      );
      telemetriDurumFarkiniLogla(mevcut, yeniDurum, 'dovus');
      telemetriDovusSonucuLogla(yeniDurum, aktifRakip.id, ozet);
      // Dövüş sonunda hemen autosave (aktifDovusRakipId temizlenmiş olarak)
      durumuKaydet(yeniDurum);
      oyunDurumuRef.current = yeniDurum;
      setKayitliOyun(yeniDurum);
      setOyunDurumu(yeniDurum);
      return ozet;
    },
    [aktifRakip]
  );

  const handleArenadanCik = useCallback(() => {
    setAktifRakip(null);
  }, []);

  const handleDebugDurumAyarla = useCallback(
    (yeniDurum: OyunDurumu, kaynak = 'debug_manuel') => {
      durumGuncelle(() => yeniDurum, kaynak);
    },
    [durumGuncelle]
  );

  const handleDebugAnindaGunBitir = useCallback(() => {
    durumGuncelle((onceki) => {
      const engelsiz: OyunDurumu =
        onceki.aktifOlay || onceki.aktifKomsuOlayi
          ? { ...onceki, aktifOlay: null, aktifKomsuOlayi: null }
          : onceki;
      return evdeUyuVeGunuBitir(engelsiz);
    }, 'debug_gun_bitir');
  }, [durumGuncelle]);

  const handleDebugKiraGununeAtla = useCallback(() => {
    durumGuncelle((onceki) => {
      const dongu = Math.max(1, DENGE.zaman.kiraDonguGun);
      const kalan = onceki.gun % dongu === 0 ? dongu : dongu - (onceki.gun % dongu);
      const hedefGun = onceki.gun + kalan;
      return {
        ...onceki,
        gun: hedefGun,
        aktifOlay: null,
        aktifKomsuOlayi: null,
        sonBildirim: {
          gun: hedefGun,
          saatMetni: onceki.sonBildirim?.saatMetni,
          metin: `[DEBUG] Gün ${hedefGun} (kira günü) olarak ayarlandı. Uyuyunca kira kesilir.`,
          tur: 'bilgi',
        },
      };
    }, 'debug_kira_atla');
  }, [durumGuncelle]);

  const handleDebugZorlaMacBaslat = useCallback(
    (rakip: RakipTanimi) => {
      const mevcut = oyunDurumuRef.current;
      if (!mevcut) return;
      const dovusBasiDurum: OyunDurumu = {
        ...mevcut,
        aktifDovusRakipId: rakip.id,
      };
      durumuKaydet(dovusBasiDurum);
      oyunDurumuRef.current = dovusBasiDurum;
      setKayitliOyun(dovusBasiDurum);
      setOyunDurumu(dovusBasiDurum);
      setMacAnahtari((k) => k + 1);
      setAktifRakip(rakip);
    },
    []
  );

  const aktifEkran = !oyunDurumu ? (
    <TitleScreen
      kayitliOyun={kayitliOyun}
      onDevamEt={handleDevamEt}
      onYeniBaslat={handleYeniBaslat}
    />
  ) : aktifRakip ? (
    <ArenaCombatView
      key={`${aktifRakip.id}-${macAnahtari}`}
      oyun={oyunDurumu}
      rakip={aktifRakip}
      onMacBitti={handleMacBitti}
      onArenadanCik={handleArenadanCik}
    />
  ) : (
    <HomeHub
      state={oyunDurumu}
      onMekanaGit={(hedefMekan: MekanId) =>
        durumGuncelle((s) => mekanaGit(s, hedefMekan), 'yolculuk')
      }
      onAntrenman={(statId: StatId, secenek) =>
        durumGuncelle((s) => antrenmanYap(s, statId, secenek), 'antrenman')
      }
      onSokakGolgeBoksu={() =>
        durumGuncelle((s) => sokakGolgeBoksu(s), 'golge_boksu')
      }
      onVardiya={(isId: string) =>
        durumGuncelle((s) => vardiyaYap(s, isId), 'vardiya')
      }
      onYemek={(yemekId: string) =>
        durumGuncelle((s) => yemekYe(s, yemekId), 'yemek')
      }
      onAcilCorba={() => durumGuncelle((s) => acilCorbaIc(s), 'acil_corba')}
      onAileEtkiles={(uyeId) =>
        durumGuncelle((s) => aileyleEtkiles(s, uyeId), 'aile')
      }
      onEvEsyasiAl={(esyaId: string) =>
        durumGuncelle((s) => evEsyasiAl(s, esyaId), 'ev_esyasi')
      }
      onEvYukselt={() => durumGuncelle((s) => evYukselt(s), 'ev_yukselt')}
      onKiraBorcuOde={() => durumGuncelle((s) => kiraBorcuOde(s), 'kira_borcu_ode')}
      onUyuVeGunuBitir={() =>
        durumGuncelle((s) => evdeUyuVeGunuBitir(s), 'uyku')
      }
      onOlaySecenegi={(secenekId: string) =>
        durumGuncelle((s) => olaySecenegiUygula(s, secenekId), 'olay')
      }
      onHocaDersiAl={(dersId: string) =>
        durumGuncelle((s) => hocaDersiAl(s, dersId), 'hoca_dersi')
      }
      onKomsuEtkiles={(komsuId: string) =>
        durumGuncelle((s) => komsuEtkilesimiBaslat(s, komsuId), 'komsu')
      }
      onKomsuSecenegi={(secenekId: string) =>
        durumGuncelle((s) => komsuSecenegiUygula(s, secenekId), 'komsu')
      }
      onKomsuOlayiniKapat={() =>
        durumGuncelle((s) => komsuOlayiniKapat(s), 'komsu_kapat')
      }
      onYetenekAc={(yetenekId: string) =>
        durumGuncelle((s) => yetenekAc(s, yetenekId), 'yetenek')
      }
      onKomsuDayanisma={() =>
        durumGuncelle((s) => komsuDayanismasiAl(s), 'komsu_dayanisma')
      }
      onRingTavriDegistir={(tavir: RingTavri) =>
        durumGuncelle((s) => ringTavriDegistir(s, tavir), 'ring_tavri')
      }
      onMacaBasla={handleMacaBasla}
      onSifirla={handleSifirla}
    />
  );

  return (
    <>
      {aktifEkran}
      <AudioDebugPanel
        oyunDurumu={oyunDurumu}
        onOyunDurumuAyarla={handleDebugDurumAyarla}
        onAnindaGunBitir={handleDebugAnindaGunBitir}
        onKiraGununeAtla={handleDebugKiraGununeAtla}
        onZorlaMacBaslat={handleDebugZorlaMacBaslat}
        onDengeDegisti={() => setDengeRevizyon((r) => r + 1)}
        onHataTesti={() => setDebugCokme(true)}
      />
    </>
  );
}

export default function App() {
  const [oturumAnahtari, setOturumAnahtari] = useState(0);
  const [kurtarmaDurumu, setKurtarmaDurumu] = useState<OyunDurumu | null | undefined>(
    undefined
  );

  const handleKurtarKaydiYukle = useCallback(() => {
    const yuklenen = durumuYukle();
    if (yuklenen) {
      const guvenli: OyunDurumu = {
        ...yuklenen,
        aktifDovusRakipId: null,
        aktifOlay: null,
        aktifKomsuOlayi: null,
      };
      durumuKaydet(guvenli);
      setKurtarmaDurumu(guvenli);
    } else {
      setKurtarmaDurumu(null);
    }
    setOturumAnahtari((k) => k + 1);
  }, []);

  const handleKurtarYeniOyun = useCallback(() => {
    kaydiSil();
    const yeni = yeniOyunOlustur(KARAKTER_SABITLERI.varsayilanLakap);
    durumuKaydet(yeni);
    setKurtarmaDurumu(yeni);
    setOturumAnahtari((k) => k + 1);
  }, []);

  return (
    <ErrorBoundary
      onKaydiYukle={handleKurtarKaydiYukle}
      onYeniOyun={handleKurtarYeniOyun}
    >
      <AppIcerik key={oturumAnahtari} baslangicDurumu={kurtarmaDurumu} />
    </ErrorBoundary>
  );
}
