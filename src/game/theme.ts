/**
 * ============================================================================
 * BÖLÜM 1: GÖRSEL TEMA VE PIXEL ART PALET SİSTEMİ
 * Tüm renkler, mekan atmosferleri, tipografi ve pixel art sprite paleti
 * tek bir noktadan yönetilir.
 * ============================================================================
 */

export type MekanId =
  | 'ev'
  | 'spor_salonu'
  | 'market'
  | 'is_yeri'
  | 'sokak_arena';

export interface MekanPaleti {
  id: MekanId;
  isim: string;
  duvarUst: string;
  duvarAlt: string;
  arkaPlanDetay: string;
  zemin: string;
  zeminCizgi: string;
  isikRengi: string;
  vurguRengi: string;
  sisRengi: string;
}

export interface KarakterGorunumu {
  tenRengi: string;
  golgeTenRengi: string;
  sacRengi: string;
  ustKiyafetRengi: string;
  ustKiyafetGolge: string;
  altKiyafetRengi: string;
  bandajRengi: string;
  konturRengi: string;
  yapiOlcegi: number;
}

export const TEMA = {
  // Ana arayüz paleti (Kısıtlı, koyu ve yetişkin tonlar)
  renkler: {
    tuvalArkaplan: '#0B0E17', // Derin gece laciverti (60% baskın alan)
    panelArkaplan: '#121724', // Koyu kurşun-mavi yüzey (30% yapısal yüzey)
    panelIkinci: '#181F30', // İkincil katman
    cizgiInce: '#273147', // İnce panel çerçevesi
    cizgiBelirgin: '#3A4766', // Aktif odak çerçevesi
    metinAna: '#EAECEF', // Kırık beyaz okunaklı metin
    metinSoluk: '#8B95AB', // İkincil bilgi metni
    vurgu: '#D63838', // Sert sokak kırmızısı (10% vurgu)
    vurguAcik: '#E34A4A',
    uyariKehribar: '#D99B38', // Sıcak ampul / kira ve açlık uyarısı
    basariYesil: '#3D8C66', // Mat koyu yeşil
    uykuMavi: '#5B82B8', // Dinlenme / uyku göstergesi
  },

  // Mekan başına hakim renk tonu
  mekanlar: {
    ev: {
      id: 'ev',
      isim: 'Aile Evi',
      duvarUst: '#131724',
      duvarAlt: '#1E2438', // Sıcak loş gece mavisi & ampul sarısı
      arkaPlanDetay: '#283047',
      zemin: '#191518',
      zeminCizgi: '#2A2226',
      isikRengi: 'rgba(217, 155, 56, 0.24)',
      vurguRengi: '#D99B38',
      sisRengi: 'rgba(18, 22, 36, 0.25)',
    },
    spor_salonu: {
      id: 'spor_salonu',
      isim: 'Arka Sokak Spor Salonu',
      duvarUst: '#1C110E',
      duvarAlt: '#3A1F17', // Sıcak turuncu-kahve salon atmosferi
      arkaPlanDetay: '#4D2B20',
      zemin: '#18100E',
      zeminCizgi: '#2E1E19',
      isikRengi: 'rgba(229, 130, 56, 0.26)',
      vurguRengi: '#E58238',
      sisRengi: 'rgba(92, 42, 24, 0.22)',
    },
    market: {
      id: 'market',
      isim: 'Mahalle Marketi',
      duvarUst: '#0B1413',
      duvarAlt: '#162925', // Soğuk floresan yeşili
      arkaPlanDetay: '#223D37',
      zemin: '#0E1716',
      zeminCizgi: '#1C2E2B',
      isikRengi: 'rgba(124, 198, 168, 0.20)',
      vurguRengi: '#6CC296',
      sisRengi: 'rgba(22, 41, 37, 0.24)',
    },
    is_yeri: {
      id: 'is_yeri',
      isim: 'Toptancı Depo',
      duvarUst: '#10141C',
      duvarAlt: '#222938', // Endüstriyel çelik gri + sodyum lambası
      arkaPlanDetay: '#2E374B',
      zemin: '#0F1218',
      zeminCizgi: '#262C3B',
      isikRengi: 'rgba(214, 148, 62, 0.22)',
      vurguRengi: '#D99B38',
      sisRengi: 'rgba(18, 22, 30, 0.28)',
    },
    sokak_arena: {
      id: 'sokak_arena',
      isim: 'Gece Sokak Arenası',
      duvarUst: '#090D1A',
      duvarAlt: '#241F3D', // Koyu mavi / mor sokak atmosferi
      arkaPlanDetay: '#171C30',
      zemin: '#0B0E17',
      zeminCizgi: '#232A40',
      isikRengi: 'rgba(214, 56, 56, 0.22)',
      vurguRengi: '#D63838',
      sisRengi: 'rgba(36, 31, 61, 0.30)',
    },
  } satisfies Record<MekanId, MekanPaleti>,

  // Başlangıç karakter görünüm parametreleri
  varsayilanKarakterGorunumu: {
    tenRengi: '#CFA084',
    golgeTenRengi: '#9B6E56',
    sacRengi: '#15171E',
    ustKiyafetRengi: '#263044', // Koyu kapüşonlu/ceket
    ustKiyafetGolge: '#171D2B',
    altKiyafetRengi: '#141822',
    bandajRengi: '#D8D3CA', // Kirli beyaz el sargısı
    konturRengi: '#06080E',
    yapiOlcegi: 1.0,
  } satisfies KarakterGorunumu,

  tipografi: {
    baslikFont: "'Barlow Condensed', system-ui, sans-serif",
    govdeFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    sayiFont: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const;

/**
 * Tema nesnesindeki renkleri tarayıcının CSS değişkenlerine yazar.
 */
export function temaDegiskenleriniUygula(): void {
  if (typeof document === 'undefined') return;
  const kok = document.documentElement;
  kok.style.setProperty('--bg-canvas', TEMA.renkler.tuvalArkaplan);
  kok.style.setProperty('--bg-surface', TEMA.renkler.panelArkaplan);
  kok.style.setProperty('--bg-surface-alt', TEMA.renkler.panelIkinci);
  kok.style.setProperty('--border-hairline', TEMA.renkler.cizgiInce);
  kok.style.setProperty('--border-strong', TEMA.renkler.cizgiBelirgin);
  kok.style.setProperty('--text-primary', TEMA.renkler.metinAna);
  kok.style.setProperty('--text-muted', TEMA.renkler.metinSoluk);
  kok.style.setProperty('--accent-primary', TEMA.renkler.vurgu);
  kok.style.setProperty('--accent-primary-hover', TEMA.renkler.vurguAcik);
  kok.style.setProperty('--accent-amber', TEMA.renkler.uyariKehribar);
}
