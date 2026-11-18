/**
 * ============================================================================
 * MERKEZİ DENGE VE KONFİGÜRASYON MODÜLÜ (D3-ADIM-1)
 * Tüm oyun sayıları (kira, maaş, yemek fiyatı, antrenman artışı, hamle hasarı,
 * stamina maliyeti, rakip statları, gün/zaman süreleri, verim ve itibar eşikleri)
 * tek bir yerde tutulur. Debug panelinden canlı düzenlenebilir.
 * ============================================================================
 */

import type { StatId } from '../data/gameData';
import type { MekanId } from './theme';

export interface MekanDenge {
  yolculukDakika: number;
  yolculukEnerji: number;
}

export interface StatAntrenmanDenge {
  baslangicDegeri: number;
  sureDakika: number;
  enerjiMaliyeti: number;
  toklukMaliyeti: number;
  yorgunlukArtisi: number;
  temelIlerleme: number;
}

export interface YemekDenge {
  fiyat: number;
  sureDakika: number;
  toklukArtisi: number;
  enerjiArtisi: number;
  moralEtkisi: number;
}

export interface EvEsyasiDenge {
  fiyat: number;
  gunlukEnerjiBonus: number;
  gunlukUykuBonus: number;
  gunlukMoralBonus: number;
  gucDayaniklilikBonusYuzde?: number;
}

export interface EvSeviyesiDenge {
  haftalikKira: number;
  gunlukEnerjiToparlanma: number;
  yorgunlukAzaltma: number;
  moralEtkisi: number;
  esyaKapasitesi: number;
  yukseltmeMaliyeti: number;
}

export interface EkIsDenge {
  sureDakika: number;
  enerjiMaliyeti: number;
  toklukMaliyeti: number;
  yorgunlukArtisi: number;
  paraOdulu: number;
  moralEtkisi: number;
  gerekliSaygi?: number;
  gerekliKorku?: number;
  saygiEtkisi?: number;
  korkuEtkisi?: number;
  riskOrani?: number;
}

export interface HamleDenge {
  temelHasar: number;
  staminaMaliyeti: number;
  isabetSansi: number;
  beklemeSuresiMs: number;
  karsiSaldiriFirsati?: number;
  staminaToparlanma?: number;
}

export interface RakipDenge {
  statlar: Record<StatId, number>;
  paraOdulu: number;
  itibarOdulu: number;
  teselliPara: number;
  cekinmeEsik1: number;
  cekinmeYuzde1: number;
  cekinmeEsik2: number;
  cekinmeYuzde2: number;
}

export interface HocaDersiDenge {
  paraMaliyeti: number;
  sureDakika: number;
  enerjiMaliyeti: number;
}

export interface DengeConfig {
  zaman: {
    sabahBaslangicDakika: number;
    geceGecEsikDakika: number;
    uyuyakalmaSiniriDakika: number;
    uyuyakalmaSabahDakika: number;
    geceUykuKayipHer30Dk: number;
    kiraDonguGun: number;
    sokakGolgeBoksuDakika: number;
    aileEtkilesimDakika: number;
    acilCorbaDakika: number;
    komsuDayanismaDakika: number;
    yolculukUykuKaybi: number;
  };
  baslangic: {
    yas: number;
    para: number;
    enerji: number;
    maksEnerji: number;
    tokluk: number;
    moral: number;
    yorgunluk: number;
    buzdolabiStok: number;
    aileIliskisi: number;
  };
  mekanlar: Record<MekanId, MekanDenge>;
  statlar: Record<StatId, StatAntrenmanDenge>;
  yemekler: Record<
    'ev_yemegi' | 'market_simit' | 'market_tavuk_pilav' | 'market_mutfak_poseti' | 'market_haftalik_erzak',
    YemekDenge
  >;
  evEsyalari: Record<
    'yatak_ortopedik' | 'elektrikli_isitici' | 'kum_torbasi' | 'agirlik_seti',
    EvEsyasiDenge
  >;
  evler: Record<'rutubetli_bodrum' | 'sobali_daire' | 'aydinlik_ara_kat', EvSeviyesiDenge>;
  isYerleri: Record<
    | 'el_ilani'
    | 'gece_oto_yikama'
    | 'hal_hamalligi'
    | 'guvenilir_esnaf_teslimat'
    | 'haracci_tahsilat_isi',
    EkIsDenge
  >;
  antrenman: {
    salonGunlukGirisUcreti: number;
    minToklukEsigi: number;
    evTorbaVerimCarpani: number;
    agirlikSetiBonusYuzde: number;
    minIlerleme: number;
    sokakGolgeBoksuEnerji: number;
    sokakGolgeBoksuTokluk: number;
    sokakGolgeBoksuUykuKaybi: number;
    sokakGolgeBoksuIlerleme: number;
    sokakGolgeBoksuMinIlerleme: number;
  };
  ekonomiVeYasam: {
    bayilmaEnerjiHedefi: number;
    bayilmaUykuKazanimi: number;
    normalUykuTabanEk: number;
    geceAclikKaybi: number;
    geceToklukTaban: number;
    bayilmaMoralCezasi: number;
    kiraOdendiMoralBonus: number;
    kiraIlkUyariMoralCezasi: number;
    kiraDusmeMoralCezasi: number;
    kiraIkinciUyariMoralCezasi: number;
    kiraIkinciUyariItibarKaybi: number;
    evEsyasiMoralBonus: number;
    evYukseltMoralBonus: number;
    arbedeEkEnerjiKaybi: number;
    arbedeEkUykuKaybi: number;
    acilCorbaMaxPara: number;
    acilCorbaMaxTokluk: number;
    acilCorbaTokluk: number;
    acilCorbaEnerji: number;
    acilCorbaMoral: number;
    anneMoral: number;
    elifMoral: number;
    aileIliskiArtis: number;
    komsuDayanismaPara: number;
    komsuDayanismaStok: number;
    komsuDayanismaMoral: number;
  };
  verimVeEsikler: {
    moralCarpaniTaban: number;
    moralCarpaniAralik: number;
    dusukMoralEsik: number;
    uykuKritikEsik: number;
    yorgunlukKritikEsik: number;
    uykuKritikCarpan: number;
    uykuOrtaEsik: number;
    yorgunlukOrtaEsik: number;
    uykuOrtaCarpan: number;
    toklukKritikEsik: number;
    toklukKritikCarpan: number;
    toklukOrtaEsik: number;
    toklukOrtaCarpan: number;
    toklukHafifEsik: number;
    toklukHafifCarpan: number;
    uyuyakalmaVerimCarpani: number;
    hazirlikDusukEsik: number;
    hazirlikDusukStaminaCarpan: number;
    uyuyakalmaStaminaCarpan: number;
    maksCanTaban: number;
    maksCanDayaniklilikCarpan: number;
    maksStaminaTaban: number;
    maksStaminaDayaniklilikCarpan: number;
    saygiEsik1: number;
    saygiEsik2: number;
    korkuEsik1: number;
    korkuEsik2: number;
    maksItibar: number;
    itibarSurtunmeBaslangic: number;
    itibarSurtunmeYuksekEsik: number;
    itibarSurtunmeCarpan: number;
    marketIndirim1: number;
    marketIndirim2: number;
    olayTetiklemeGunFarki: number;
    olayTetiklemeOlasilik: number;
    ahlakiOlayOncelikOlasilik: number;
  };
  dovus: {
    macSureDakika: number;
    macEnerjiMaliyeti: number;
    macToklukMaliyeti: number;
    macUykuKaybi: number;
    minToklukEsigi: number;
    maksMacSuresiMs: number;
    koYavaslatmaMs: number;
    koHizCarpani: number;
    telgrafPenceresiMs: number;
    komboPenceresiMs: number;
    kombo2xCarpan: number;
    kombo3xCarpan: number;
    gucHasarTaban: number;
    gucHasarCarpan: number;
    karsiSaldiriStandartCarpan: number;
    karsiSaldiriMukemmelCarpan: number;
    staminaRegenTaban: number;
    staminaRegenDayaniklilikCarpan: number;
    staminaRegenDusukOran: number;
    staminaRegenDusukCarpan: number;
    yavaslamaStaminaOran: number;
    vurusAraligiYavasCarpan: number;
    vurusAraligiTabanMs: number;
    vurusAraligiCeviklikCarpan: number;
    vurusAraligiMinMs: number;
    vurusAraligiMaxMs: number;
    oyuncuIlkSayacMs: number;
    rakipIlkSayacMsNormal: number;
    rakipIlkSayacMsCekinme1: number;
    rakipIlkSayacMsCekinme2: number;
    rakipBaslangicMinStamina: number;
    mukemmelBlokStaminaOdulu: number;
    agirVurusHasarEsigi: number;
    rastgeleSapmaTaban: number;
    rastgeleSapmaAralik: number;
    berabereOranEsigi: number;
    kazanmaMoral: number;
    berabereMoral: number;
    kaybetmeMoral: number;
    berabereParaOran: number;
    kazanmaStatPuan: number;
    berabereStatPuan: number;
    kaybetmeStatPuan: number;
    hamleler: Record<string, HamleDenge>;
    rakipler: Record<string, RakipDenge>;
  };
  hocaDersleri: Record<string, HocaDersiDenge>;
}

export const STAT_YETENEK_ESIK_LISTESI = [6, 8, 10, 12] as const;

export const VARSAYILAN_DENGE: DengeConfig = {
  zaman: {
    sabahBaslangicDakika: 8 * 60,
    geceGecEsikDakika: 22 * 60,
    uyuyakalmaSiniriDakika: 26 * 60,
    uyuyakalmaSabahDakika: 10 * 60,
    geceUykuKayipHer30Dk: 3,
    kiraDonguGun: 7,
    sokakGolgeBoksuDakika: 45,
    aileEtkilesimDakika: 20,
    acilCorbaDakika: 20,
    komsuDayanismaDakika: 15,
    yolculukUykuKaybi: 2,
  },
  baslangic: {
    yas: 20,
    para: 350,
    enerji: 100,
    maksEnerji: 100,
    tokluk: 82,
    moral: 58,
    yorgunluk: 10,
    buzdolabiStok: 2,
    aileIliskisi: 60,
  },
  mekanlar: {
    ev: { yolculukDakika: 15, yolculukEnerji: 2 },
    spor_salonu: { yolculukDakika: 20, yolculukEnerji: 3 },
    market: { yolculukDakika: 15, yolculukEnerji: 2 },
    is_yeri: { yolculukDakika: 25, yolculukEnerji: 4 },
    sokak_arena: { yolculukDakika: 20, yolculukEnerji: 3 },
  },
  statlar: {
    guc: {
      baslangicDegeri: 4,
      sureDakika: 60,
      enerjiMaliyeti: 26,
      toklukMaliyeti: 14,
      yorgunlukArtisi: 18,
      temelIlerleme: 46,
    },
    ceviklik: {
      baslangicDegeri: 5,
      sureDakika: 55,
      enerjiMaliyeti: 24,
      toklukMaliyeti: 13,
      yorgunlukArtisi: 16,
      temelIlerleme: 46,
    },
    refleks: {
      baslangicDegeri: 4,
      sureDakika: 50,
      enerjiMaliyeti: 22,
      toklukMaliyeti: 11,
      yorgunlukArtisi: 14,
      temelIlerleme: 48,
    },
    dayaniklilik: {
      baslangicDegeri: 5,
      sureDakika: 65,
      enerjiMaliyeti: 28,
      toklukMaliyeti: 16,
      yorgunlukArtisi: 20,
      temelIlerleme: 46,
    },
  },
  yemekler: {
    ev_yemegi: {
      fiyat: 0,
      sureDakika: 20,
      toklukArtisi: 40,
      enerjiArtisi: 14,
      moralEtkisi: 3,
    },
    market_simit: {
      fiyat: 35,
      sureDakika: 15,
      toklukArtisi: 32,
      enerjiArtisi: 10,
      moralEtkisi: 2,
    },
    market_tavuk_pilav: {
      fiyat: 75,
      sureDakika: 20,
      toklukArtisi: 62,
      enerjiArtisi: 22,
      moralEtkisi: 6,
    },
    market_mutfak_poseti: {
      fiyat: 95,
      sureDakika: 10,
      toklukArtisi: 0,
      enerjiArtisi: 0,
      moralEtkisi: 2,
    },
    market_haftalik_erzak: {
      fiyat: 175,
      sureDakika: 10,
      toklukArtisi: 0,
      enerjiArtisi: 0,
      moralEtkisi: 5,
    },
  },
  evEsyalari: {
    yatak_ortopedik: {
      fiyat: 280,
      gunlukEnerjiBonus: 12,
      gunlukUykuBonus: 12,
      gunlukMoralBonus: 1,
    },
    elektrikli_isitici: {
      fiyat: 220,
      gunlukEnerjiBonus: 4,
      gunlukUykuBonus: 8,
      gunlukMoralBonus: 4,
    },
    kum_torbasi: {
      fiyat: 340,
      gunlukEnerjiBonus: 0,
      gunlukUykuBonus: 0,
      gunlukMoralBonus: 2,
    },
    agirlik_seti: {
      fiyat: 420,
      gunlukEnerjiBonus: 0,
      gunlukUykuBonus: 0,
      gunlukMoralBonus: 2,
      gucDayaniklilikBonusYuzde: 20,
    },
  },
  evler: {
    rutubetli_bodrum: {
      haftalikKira: 900,
      gunlukEnerjiToparlanma: 72,
      yorgunlukAzaltma: 32,
      moralEtkisi: -2,
      esyaKapasitesi: 4,
      yukseltmeMaliyeti: 0,
    },
    sobali_daire: {
      haftalikKira: 1650,
      gunlukEnerjiToparlanma: 88,
      yorgunlukAzaltma: 48,
      moralEtkisi: 2,
      esyaKapasitesi: 4,
      yukseltmeMaliyeti: 1200,
    },
    aydinlik_ara_kat: {
      haftalikKira: 2800,
      gunlukEnerjiToparlanma: 100,
      yorgunlukAzaltma: 65,
      moralEtkisi: 6,
      esyaKapasitesi: 6,
      yukseltmeMaliyeti: 2500,
    },
  },
  isYerleri: {
    el_ilani: {
      sureDakika: 90,
      enerjiMaliyeti: 15,
      toklukMaliyeti: 10,
      yorgunlukArtisi: 10,
      paraOdulu: 95,
      moralEtkisi: 0,
    },
    gece_oto_yikama: {
      sureDakika: 150,
      enerjiMaliyeti: 25,
      toklukMaliyeti: 16,
      yorgunlukArtisi: 16,
      paraOdulu: 195,
      moralEtkisi: 0,
    },
    hal_hamalligi: {
      sureDakika: 180,
      enerjiMaliyeti: 34,
      toklukMaliyeti: 22,
      yorgunlukArtisi: 22,
      paraOdulu: 265,
      moralEtkisi: -2,
      saygiEtkisi: 1,
    },
    guvenilir_esnaf_teslimat: {
      sureDakika: 120,
      enerjiMaliyeti: 18,
      toklukMaliyeti: 12,
      yorgunlukArtisi: 12,
      paraOdulu: 255,
      moralEtkisi: 3,
      gerekliSaygi: 22,
      saygiEtkisi: 2,
    },
    haracci_tahsilat_isi: {
      sureDakika: 90,
      enerjiMaliyeti: 16,
      toklukMaliyeti: 8,
      yorgunlukArtisi: 10,
      paraOdulu: 450,
      moralEtkisi: -5,
      gerekliKorku: 22,
      saygiEtkisi: -4,
      korkuEtkisi: 3,
      riskOrani: 0.35,
    },
  },
  antrenman: {
    salonGunlukGirisUcreti: 20,
    minToklukEsigi: 5,
    evTorbaVerimCarpani: 0.85,
    agirlikSetiBonusYuzde: 20,
    minIlerleme: 12,
    sokakGolgeBoksuEnerji: 14,
    sokakGolgeBoksuTokluk: 8,
    sokakGolgeBoksuUykuKaybi: 10,
    sokakGolgeBoksuIlerleme: 24,
    sokakGolgeBoksuMinIlerleme: 10,
  },
  ekonomiVeYasam: {
    bayilmaEnerjiHedefi: 68,
    bayilmaUykuKazanimi: 62,
    normalUykuTabanEk: 28,
    geceAclikKaybi: 12,
    geceToklukTaban: 15,
    bayilmaMoralCezasi: 8,
    kiraOdendiMoralBonus: 6,
    kiraIlkUyariMoralCezasi: 15,
    kiraDusmeMoralCezasi: 18,
    kiraIkinciUyariMoralCezasi: 20,
    kiraIkinciUyariItibarKaybi: 1,
    evEsyasiMoralBonus: 4,
    evYukseltMoralBonus: 12,
    arbedeEkEnerjiKaybi: 14,
    arbedeEkUykuKaybi: 12,
    acilCorbaMaxPara: 35,
    acilCorbaMaxTokluk: 50,
    acilCorbaTokluk: 38,
    acilCorbaEnerji: 20,
    acilCorbaMoral: 4,
    anneMoral: 7,
    elifMoral: 6,
    aileIliskiArtis: 2,
    komsuDayanismaPara: 35,
    komsuDayanismaStok: 1,
    komsuDayanismaMoral: 5,
  },
  verimVeEsikler: {
    moralCarpaniTaban: 0.8,
    moralCarpaniAralik: 0.4,
    dusukMoralEsik: 35,
    uykuKritikEsik: 20,
    yorgunlukKritikEsik: 80,
    uykuKritikCarpan: 0.55,
    uykuOrtaEsik: 45,
    yorgunlukOrtaEsik: 50,
    uykuOrtaCarpan: 0.78,
    toklukKritikEsik: 15,
    toklukKritikCarpan: 0.55,
    toklukOrtaEsik: 35,
    toklukOrtaCarpan: 0.78,
    toklukHafifEsik: 55,
    toklukHafifCarpan: 0.92,
    uyuyakalmaVerimCarpani: 0.8,
    hazirlikDusukEsik: 25,
    hazirlikDusukStaminaCarpan: 0.78,
    uyuyakalmaStaminaCarpan: 0.85,
    maksCanTaban: 60,
    maksCanDayaniklilikCarpan: 8,
    maksStaminaTaban: 40,
    maksStaminaDayaniklilikCarpan: 6,
    saygiEsik1: 12,
    saygiEsik2: 22,
    korkuEsik1: 12,
    korkuEsik2: 22,
    maksItibar: 100,
    itibarSurtunmeBaslangic: 10,
    itibarSurtunmeYuksekEsik: 18,
    itibarSurtunmeCarpan: 0.5,
    marketIndirim1: 15,
    marketIndirim2: 25,
    olayTetiklemeGunFarki: 2,
    olayTetiklemeOlasilik: 0.55,
    ahlakiOlayOncelikOlasilik: 0.55,
  },
  dovus: {
    macSureDakika: 45,
    macEnerjiMaliyeti: 20,
    macToklukMaliyeti: 10,
    macUykuKaybi: 14,
    minToklukEsigi: 10,
    maksMacSuresiMs: 90_000,
    koYavaslatmaMs: 1500,
    koHizCarpani: 0.3,
    telgrafPenceresiMs: 550,
    komboPenceresiMs: 3500,
    kombo2xCarpan: 1.25,
    kombo3xCarpan: 1.35,
    gucHasarTaban: 0.72,
    gucHasarCarpan: 0.11,
    karsiSaldiriStandartCarpan: 1.38,
    karsiSaldiriMukemmelCarpan: 1.65,
    staminaRegenTaban: 8.5,
    staminaRegenDayaniklilikCarpan: 0.65,
    staminaRegenDusukOran: 0.2,
    staminaRegenDusukCarpan: 0.78,
    yavaslamaStaminaOran: 0.22,
    vurusAraligiYavasCarpan: 1.7,
    vurusAraligiTabanMs: 1560,
    vurusAraligiCeviklikCarpan: 72,
    vurusAraligiMinMs: 740,
    vurusAraligiMaxMs: 1700,
    oyuncuIlkSayacMs: 850,
    rakipIlkSayacMsNormal: 1100,
    rakipIlkSayacMsCekinme1: 1450,
    rakipIlkSayacMsCekinme2: 1750,
    rakipBaslangicMinStamina: 10,
    mukemmelBlokStaminaOdulu: 12,
    agirVurusHasarEsigi: 20,
    rastgeleSapmaTaban: 0.9,
    rastgeleSapmaAralik: 0.2,
    berabereOranEsigi: 0.03,
    kazanmaMoral: 10,
    berabereMoral: -2,
    kaybetmeMoral: -8,
    berabereParaOran: 0.4,
    kazanmaStatPuan: 16,
    berabereStatPuan: 15,
    kaybetmeStatPuan: 15,
    hamleler: {
      duz_yumruk: { temelHasar: 10, staminaMaliyeti: 10, isabetSansi: 84, beklemeSuresiMs: 850 },
      sert_yumruk: { temelHasar: 22, staminaMaliyeti: 22, isabetSansi: 68, beklemeSuresiMs: 1850 },
      alcak_tekme: { temelHasar: 13, staminaMaliyeti: 14, isabetSansi: 80, beklemeSuresiMs: 1150 },
      yan_tekme: { temelHasar: 26, staminaMaliyeti: 28, isabetSansi: 65, beklemeSuresiMs: 2200 },
      blok: {
        temelHasar: 0,
        staminaMaliyeti: 0,
        isabetSansi: 92,
        beklemeSuresiMs: 1100,
        staminaToparlanma: 16,
      },
      geri_cekil: {
        temelHasar: 0,
        staminaMaliyeti: 8,
        isabetSansi: 74,
        beklemeSuresiMs: 1400,
        karsiSaldiriFirsati: 20,
      },
      egil_yana_kay: {
        temelHasar: 0,
        staminaMaliyeti: 10,
        isabetSansi: 78,
        beklemeSuresiMs: 1750,
        karsiSaldiriFirsati: 35,
      },
      sol_krose: { temelHasar: 16, staminaMaliyeti: 14, isabetSansi: 82, beklemeSuresiMs: 1300 },
      cene_aparkati: { temelHasar: 26, staminaMaliyeti: 24, isabetSansi: 74, beklemeSuresiMs: 2100 },
      diz_darbesi: { temelHasar: 18, staminaMaliyeti: 16, isabetSansi: 83, beklemeSuresiMs: 1400 },
      doner_tekme: { temelHasar: 30, staminaMaliyeti: 28, isabetSansi: 70, beklemeSuresiMs: 2400 },
      celik_gard: {
        temelHasar: 0,
        staminaMaliyeti: 0,
        isabetSansi: 96,
        beklemeSuresiMs: 1700,
        staminaToparlanma: 24,
      },
      hayalet_adim: {
        temelHasar: 0,
        staminaMaliyeti: 10,
        isabetSansi: 86,
        beklemeSuresiMs: 1650,
        karsiSaldiriFirsati: 45,
      },
      vucut_krosesi: { temelHasar: 19, staminaMaliyeti: 15, isabetSansi: 84, beklemeSuresiMs: 1450 },
      capraz_kontra: { temelHasar: 17, staminaMaliyeti: 11, isabetSansi: 90, beklemeSuresiMs: 1200 },
    },
    rakipler: {
      sisko_cetin: {
        statlar: { guc: 5, ceviklik: 3, refleks: 3, dayaniklilik: 6 },
        paraOdulu: 165,
        itibarOdulu: 2,
        teselliPara: 25,
        cekinmeEsik1: 12,
        cekinmeYuzde1: 12,
        cekinmeEsik2: 22,
        cekinmeYuzde2: 20,
      },
      jilet_emir: {
        statlar: { guc: 5, ceviklik: 7, refleks: 6, dayaniklilik: 5 },
        paraOdulu: 285,
        itibarOdulu: 3,
        teselliPara: 35,
        cekinmeEsik1: 20,
        cekinmeYuzde1: 10,
        cekinmeEsik2: 32,
        cekinmeYuzde2: 16,
      },
      demir_serkan: {
        statlar: { guc: 7, ceviklik: 5, refleks: 7, dayaniklilik: 8 },
        paraOdulu: 430,
        itibarOdulu: 5,
        teselliPara: 45,
        cekinmeEsik1: 30,
        cekinmeYuzde1: 8,
        cekinmeEsik2: 45,
        cekinmeYuzde2: 14,
      },
      kasap_halil: {
        statlar: { guc: 9, ceviklik: 6, refleks: 6, dayaniklilik: 9 },
        paraOdulu: 640,
        itibarOdulu: 8,
        teselliPara: 60,
        cekinmeEsik1: 45,
        cekinmeYuzde1: 6,
        cekinmeEsik2: 65,
        cekinmeYuzde2: 12,
      },
    },
  },
  hocaDersleri: {
    muslum_vucut_krosesi: { paraMaliyeti: 130, sureDakika: 60, enerjiMaliyeti: 16 },
    muslum_civi_durus: { paraMaliyeti: 180, sureDakika: 75, enerjiMaliyeti: 18 },
    muslum_agir_disiplin: { paraMaliyeti: 250, sureDakika: 90, enerjiMaliyeti: 22 },
    cigdem_ritim_ipi: { paraMaliyeti: 120, sureDakika: 55, enerjiMaliyeti: 15 },
    cigdem_capraz_kontra: { paraMaliyeti: 195, sureDakika: 75, enerjiMaliyeti: 18 },
    cigdem_firtina_tekmesi: { paraMaliyeti: 260, sureDakika: 90, enerjiMaliyeti: 20 },
  },
};

function derinKlonla<T>(deger: T): T {
  return JSON.parse(JSON.stringify(deger)) as T;
}

/**
 * Çalışma zamanı canlı denge konfigürasyonu (varsayılanlardan klonlanır).
 */
export const DENGE: DengeConfig = derinKlonla(VARSAYILAN_DENGE);

type DengeDinleyici = (denge: DengeConfig) => void;
const dinleyiciler = new Set<DengeDinleyici>();

export function getDenge(): DengeConfig {
  return DENGE;
}

export function dengeAboneOl(fn: DengeDinleyici): () => void {
  dinleyiciler.add(fn);
  return () => {
    dinleyiciler.delete(fn);
  };
}

function dinleyicileriBilgilendir(): void {
  for (const fn of dinleyiciler) {
    fn(DENGE);
  }
}

/**
 * Nokta ile ayrılmış yol üzerinden (örn. "evler.rutubetli_bodrum.haftalikKira")
 * canlı DENGE değerini günceller ve aboneleri senkronize eder.
 */
export function dengeGuncelle(yol: string, yeniDeger: number): boolean {
  if (!Number.isFinite(yeniDeger)) return false;
  const parcalar = yol.split('.').filter(Boolean);
  if (parcalar.length === 0) return false;

  let hedef: Record<string, unknown> = DENGE as unknown as Record<string, unknown>;
  for (let i = 0; i < parcalar.length - 1; i += 1) {
    const anahtar = parcalar[i];
    const sonraki = hedef[anahtar];
    if (!sonraki || typeof sonraki !== 'object') return false;
    hedef = sonraki as Record<string, unknown>;
  }

  const sonAnahtar = parcalar[parcalar.length - 1];
  if (typeof hedef[sonAnahtar] !== 'number') return false;

  hedef[sonAnahtar] = yeniDeger;
  dinleyicileriBilgilendir();
  return true;
}

/**
 * Tüm canlı DENGE değerlerini varsayılan başlangıç değerlerine döndürür.
 */
export function dengeSifirla(): void {
  const varsayilan = derinKlonla(VARSAYILAN_DENGE);
  (Object.keys(varsayilan) as Array<keyof DengeConfig>).forEach((k) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (DENGE as any)[k] = varsayilan[k];
  });
  dinleyicileriBilgilendir();
}

export interface DengeAlaniOzeti {
  yol: string;
  grup: string;
  etiket: string;
  deger: number;
}

/**
 * Debug panelinde canlı düzenlenebilecek tüm sayısal DENGE yollarını düz liste olarak döndürür.
 */
export function dengeAlanlariniListele(): DengeAlaniOzeti[] {
  const liste: DengeAlaniOzeti[] = [];

  const gez = (nesne: Record<string, unknown>, onEk: string, grup: string) => {
    for (const [anahtar, val] of Object.entries(nesne)) {
      const yol = onEk ? `${onEk}.${anahtar}` : anahtar;
      if (typeof val === 'number') {
        liste.push({
          yol,
          grup,
          etiket: yol.replace(`${grup}.`, ''),
          deger: val,
        });
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        gez(val as Record<string, unknown>, yol, grup);
      }
    }
  };

  for (const [grup, val] of Object.entries(DENGE)) {
    if (val && typeof val === 'object') {
      gez(val as Record<string, unknown>, grup, grup);
    }
  }

  return liste;
}
