/**
 * ============================================================================
 * YAPILANDIRILMIŞ TELEMETRİ MODÜLÜ (D3-ADIM-1)
 * Gün sonu, dövüş sonucu, kira durumu, para değişimi ve yetenek açımını
 * `[gun=5][kira=odendi][para=120][enerji=60]` formatında console.info'ya yazar
 * ve debug panelinden JSON olarak indirilebilmesi için bellekte tutar.
 * ============================================================================
 */

import type { MacSonucOzeti, OyunDurumu } from './engine';
import { DENGE } from './balance';

export type TelemetriOlayTuru =
  | 'gun_sonu'
  | 'dovus_sonucu'
  | 'kira_durumu'
  | 'para_degisimi'
  | 'yetenek_acimi';

export interface TelemetriKaydi {
  id: number;
  zaman: string;
  olay: TelemetriOlayTuru;
  satir: string;
  veri: Record<string, string | number | boolean>;
}

const MAKS_TELEMETRI_KAYDI = 500;
let sonrakiLogId = 1;
let logTamponu: TelemetriKaydi[] = [];
const dinleyiciler = new Set<(loglar: TelemetriKaydi[]) => void>();

function formatliEtiketSatiri(
  olay: TelemetriOlayTuru,
  veri: Record<string, string | number | boolean>
): string {
  const parcalar = [`[olay=${olay}]`];
  for (const [k, v] of Object.entries(veri)) {
    parcalar.push(`[${k}=${v}]`);
  }
  return parcalar.join('');
}

function aboneleriBilgilendir(): void {
  const kopya = [...logTamponu];
  for (const fn of dinleyiciler) {
    fn(kopya);
  }
}

/**
 * Yapılandırılmış telemetri olayını belleğe ekler ve `console.info` üzerinden yayınlar.
 */
export function telemetriLogla(
  olay: TelemetriOlayTuru,
  veri: Record<string, string | number | boolean>
): TelemetriKaydi {
  const satir = formatliEtiketSatiri(olay, veri);
  const kayit: TelemetriKaydi = {
    id: sonrakiLogId++,
    zaman: new Date().toISOString(),
    olay,
    satir,
    veri: { ...veri },
  };

  logTamponu =
    logTamponu.length >= MAKS_TELEMETRI_KAYDI
      ? [...logTamponu.slice(-(MAKS_TELEMETRI_KAYDI - 1)), kayit]
      : [...logTamponu, kayit];

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(satir);
  }

  aboneleriBilgilendir();
  return kayit;
}

export function getTelemetriLoglari(): TelemetriKaydi[] {
  return [...logTamponu];
}

export function telemetriLoglariniTemizle(): void {
  logTamponu = [];
  aboneleriBilgilendir();
}

export function subscribeTelemetriLoglari(
  fn: (loglar: TelemetriKaydi[]) => void
): () => void {
  dinleyiciler.add(fn);
  fn([...logTamponu]);
  return () => {
    dinleyiciler.delete(fn);
  };
}

/**
 * Bellekte biriken tüm yapılandırılmış telemetri loglarını JSON dosyası olarak indirir.
 */
export function telemetriJsonIndir(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const icerik = JSON.stringify(
      {
        uygulama: 'karanlik-sokak',
        disaAktarimZamani: new Date().toISOString(),
        toplamKayit: logTamponu.length,
        kayitlar: logTamponu,
      },
      null,
      2
    );
    const blob = new Blob([icerik], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karanlik-sokak-telemetri-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * İki oyun durumu arasındaki farklardan gün sonu, kira durumu, para değişimi
 * ve yetenek açımı olaylarını algılayıp telemetriye düşer.
 */
export function telemetriDurumFarkiniLogla(
  onceki: OyunDurumu,
  sonraki: OyunDurumu,
  kaynak = 'aksiyon'
): void {
  // 1. Gün sonu ve kira durumu
  if (sonraki.gun > onceki.gun) {
    const kiraGunuMuydu = onceki.gun % Math.max(1, DENGE.zaman.kiraDonguGun) === 0;
    let kiraDurumu = 'beklemede';
    if (kiraGunuMuydu) {
      if (sonraki.evSeviyesi < onceki.evSeviyesi) {
        kiraDurumu = 'ev_dustu';
      } else if (sonraki.kiraUyariSayisi > onceki.kiraUyariSayisi) {
        kiraDurumu = 'uyari';
      } else if (sonraki.kiraUyariSayisi === 0 && sonraki.para <= onceki.para) {
        kiraDurumu = 'odendi';
      } else {
        kiraDurumu = 'odenemedi';
      }
    }

    telemetriLogla('gun_sonu', {
      gun: onceki.gun,
      yeni_gun: sonraki.gun,
      kira: kiraDurumu,
      para: sonraki.para,
      enerji: sonraki.enerji,
      tokluk: sonraki.tokluk,
      moral: sonraki.moral,
    });

    if (kiraGunuMuydu) {
      telemetriLogla('kira_durumu', {
        gun: onceki.gun,
        kira: kiraDurumu,
        para: sonraki.para,
        ev_seviyesi: sonraki.evSeviyesi,
        uyari: sonraki.kiraUyariSayisi,
      });
    }
  }

  // 2. Para değişimi
  const paraFarki = sonraki.para - onceki.para;
  if (paraFarki !== 0) {
    telemetriLogla('para_degisimi', {
      gun: sonraki.gun,
      degisim: paraFarki > 0 ? `+${paraFarki}` : `${paraFarki}`,
      para: sonraki.para,
      kaynak,
      mekan: sonraki.aktifMekan,
    });
  }

  // 3. Yetenek açımı
  const oncekiYetenekler = new Set(onceki.acikYetenekIds ?? []);
  const yeniAcilanlar = (sonraki.acikYetenekIds ?? []).filter(
    (id) => !oncekiYetenekler.has(id)
  );
  for (const yetenekId of yeniAcilanlar) {
    telemetriLogla('yetenek_acimi', {
      gun: sonraki.gun,
      yetenek: yetenekId,
      yp_kalan: sonraki.yetenekPuani ?? 0,
    });
  }
}

/**
 * Dövüş sonucu olayını telemetriye düşer.
 */
export function telemetriDovusSonucuLogla(
  durum: OyunDurumu,
  rakipId: string,
  ozet: MacSonucOzeti
): void {
  telemetriLogla('dovus_sonucu', {
    gun: durum.gun,
    rakip: rakipId,
    kazanan: ozet.kazanan,
    para_degisimi: ozet.paraDegisimi >= 0 ? `+${ozet.paraDegisimi}` : `${ozet.paraDegisimi}`,
    para: durum.para,
    enerji: durum.enerji,
    itibar: durum.itibar.genel,
  });
}
