/**
 * ============================================================================
 * BÖLÜM 2: VERİ LİSTELERİ (GENİŞLETİLEBİLİR VERİ KATMANI)
 * Yeni mekan, yemek, ev eşyası, vardiya, stat, hamle veya rastgele olay
 * eklemek için yalnızca ilgili listeye yeni bir kayıt eklemek yeterlidir.
 * ============================================================================
 */

import { KarakterGorunumu, MekanId } from '../game/theme';
import {
  DENGE,
  dengeAboneOl,
  DengeConfig,
  STAT_YETENEK_ESIK_LISTESI,
} from '../game/balance';

// ----------------------------------------------------------------------------
// 0. Zaman ve Ekonomi Sabitleri (DENGE ile senkron)
// ----------------------------------------------------------------------------
export const SAAT_SABITLERI = {
  sabahBaslangicDakika: DENGE.zaman.sabahBaslangicDakika,
  geceGecEsikDakika: DENGE.zaman.geceGecEsikDakika,
  uyuyakalmaSiniriDakika: DENGE.zaman.uyuyakalmaSiniriDakika,
  uyuyakalmaSabahDakika: DENGE.zaman.uyuyakalmaSabahDakika,
  salonGunlukGirisUcreti: DENGE.antrenman.salonGunlukGirisUcreti,
};

// ----------------------------------------------------------------------------
// 1. Mekan Tanımları (A Aşaması: Dünya ve Yolculuk)
// ----------------------------------------------------------------------------
export interface MekanTanimi {
  id: MekanId;
  isim: string;
  kisaAd: string;
  aciklama: string;
  yolculukDakika: number;
  yolculukEnerji: number;
}

export const MEKAN_TANIMLARI: MekanTanimi[] = [
  {
    id: 'ev',
    isim: 'Aile Evi',
    kisaAd: 'Ev',
    aciklama: 'Annen Emine ve kardeşin Elif ile yaşadığın yer. Yemek, uyku ve ev eşyaları burada.',
    yolculukDakika: DENGE.mekanlar.ev.yolculukDakika,
    yolculukEnerji: DENGE.mekanlar.ev.yolculukEnerji,
  },
  {
    id: 'spor_salonu',
    isim: 'Arka Sokak Spor Salonu',
    kisaAd: 'Spor Salonu',
    aciklama: 'Paslı ağırlıklar, ağır kum torbaları ve ter kokan zemin. Tüm stat antrenmanları burada.',
    yolculukDakika: DENGE.mekanlar.spor_salonu.yolculukDakika,
    yolculukEnerji: DENGE.mekanlar.spor_salonu.yolculukEnerji,
  },
  {
    id: 'market',
    isim: 'Mahalle Marketi',
    kisaAd: 'Market',
    aciklama: 'Soğuk dolapların vızıltısı altında hızlı atıştırmalık ya da ev için haftalık erzak al.',
    yolculukDakika: DENGE.mekanlar.market.yolculukDakika,
    yolculukEnerji: DENGE.mekanlar.market.yolculukEnerji,
  },
  {
    id: 'is_yeri',
    isim: 'Toptancı Depo & Yükleme',
    kisaAd: 'İş Yeri',
    aciklama: 'Kasa taşıma, oto yıkama nöbeti ve ayak işleri. Kira ve geçim parası buradan çıkar.',
    yolculukDakika: DENGE.mekanlar.is_yeri.yolculukDakika,
    yolculukEnerji: DENGE.mekanlar.is_yeri.yolculukEnerji,
  },
  {
    id: 'sokak_arena',
    isim: 'Gece Sokak Arenası',
    kisaAd: 'Sokak Arenası',
    aciklama: 'Lambanın altındaki tebeşir çizgili beton. Yeraltı sokak maçları ve gölge boksu burada döner.',
    yolculukDakika: DENGE.mekanlar.sokak_arena.yolculukDakika,
    yolculukEnerji: DENGE.mekanlar.sokak_arena.yolculukEnerji,
  },
];

// ----------------------------------------------------------------------------
// 2. Stat Tanımları
// ----------------------------------------------------------------------------
export type StatId = 'guc' | 'ceviklik' | 'refleks' | 'dayaniklilik';

export interface StatTanimi {
  id: StatId;
  isim: string;
  kisaKod: string;
  baslangicDegeri: number;
  aciklama: string;
  antrenmanAdi: string;
  antrenmanAciklamasi: string;
  sureDakika: number;
  enerjiMaliyeti: number;
  toklukMaliyeti: number;
  yorgunlukArtisi: number;
  temelIlerleme: number;
}

export const STAT_TANIMLARI: StatTanimi[] = [
  {
    id: 'guc',
    isim: 'Güç',
    kisaKod: 'GÜÇ',
    baslangicDegeri: DENGE.statlar.guc.baslangicDegeri,
    aciklama: 'Ağır yumruk ve tekmelerin hasarını artırır, sert hamlelerin kilidini açar.',
    antrenmanAdi: 'Ağır Torba & Halter',
    antrenmanAciklamasi: 'Yıpranmış deri torbaya kroşe vur, demir plaka kaldır.',
    sureDakika: DENGE.statlar.guc.sureDakika,
    enerjiMaliyeti: DENGE.statlar.guc.enerjiMaliyeti,
    toklukMaliyeti: DENGE.statlar.guc.toklukMaliyeti,
    yorgunlukArtisi: DENGE.statlar.guc.yorgunlukArtisi,
    temelIlerleme: DENGE.statlar.guc.temelIlerleme,
  },
  {
    id: 'ceviklik',
    isim: 'Çeviklik',
    kisaKod: 'ÇEV',
    baslangicDegeri: DENGE.statlar.ceviklik.baslangicDegeri,
    aciklama: 'Hızlı saldırıların isabetini, vuruş sıklığını ve kaçınma şansını belirler.',
    antrenmanAdi: 'Gölge Boksu & İp',
    antrenmanAciklamasi: 'Ayna karşısında ayak oyunu çalış, seri sol-sağ kombinasyonlar at.',
    sureDakika: DENGE.statlar.ceviklik.sureDakika,
    enerjiMaliyeti: DENGE.statlar.ceviklik.enerjiMaliyeti,
    toklukMaliyeti: DENGE.statlar.ceviklik.toklukMaliyeti,
    yorgunlukArtisi: DENGE.statlar.ceviklik.yorgunlukArtisi,
    temelIlerleme: DENGE.statlar.ceviklik.temelIlerleme,
  },
  {
    id: 'refleks',
    isim: 'Refleks',
    kisaKod: 'REF',
    baslangicDegeri: DENGE.statlar.refleks.baslangicDegeri,
    aciklama: 'Rakibin hamlesini önceden okuyup eğilme ve blok başarısını artırır.',
    antrenmanAdi: 'Hız Topu & Eskiv',
    antrenmanAciklamasi: 'Tavana asılı refleks topunu okuyup son milisaniyede başını çek.',
    sureDakika: DENGE.statlar.refleks.sureDakika,
    enerjiMaliyeti: DENGE.statlar.refleks.enerjiMaliyeti,
    toklukMaliyeti: DENGE.statlar.refleks.toklukMaliyeti,
    yorgunlukArtisi: DENGE.statlar.refleks.yorgunlukArtisi,
    temelIlerleme: DENGE.statlar.refleks.temelIlerleme,
  },
  {
    id: 'dayaniklilik',
    isim: 'Dayanıklılık',
    kisaKod: 'DAY',
    baslangicDegeri: DENGE.statlar.dayaniklilik.baslangicDegeri,
    aciklama: 'Maksimum can ve stamina sınırını yükseltir, toparlanmayı hızlandırır.',
    antrenmanAdi: 'Koşu Bandı & Çekirdek',
    antrenmanAciklamasi: 'Nefesin kesilene kadar tempo koşusu ve karın direnci çalış.',
    sureDakika: DENGE.statlar.dayaniklilik.sureDakika,
    enerjiMaliyeti: DENGE.statlar.dayaniklilik.enerjiMaliyeti,
    toklukMaliyeti: DENGE.statlar.dayaniklilik.toklukMaliyeti,
    yorgunlukArtisi: DENGE.statlar.dayaniklilik.yorgunlukArtisi,
    temelIlerleme: DENGE.statlar.dayaniklilik.temelIlerleme,
  },
];

// ----------------------------------------------------------------------------
// 3. Yemek, Market Erzakları ve Ev Eşyaları
// ----------------------------------------------------------------------------
export interface YemekTanimi {
  id: string;
  isim: string;
  mekan: 'ev' | 'market';
  tur: 'hazir_ye' | 'erzak_stok';
  aciklama: string;
  fiyat: number;
  sureDakika: number;
  toklukArtisi: number;
  enerjiArtisi: number;
  moralEtkisi: number;
  stokKazanci?: number;
  stokTuketimi?: number;
}

export const YEMEK_LISTESI: YemekTanimi[] = [
  {
    id: 'ev_yemegi',
    isim: 'Buzdolabından Ev Yemeği',
    mekan: 'ev',
    tur: 'hazir_ye',
    aciklama: 'Tencereden bir tabak sıcak yemek ısıt. Buzdolabından 1 öğün kullanır.',
    ...DENGE.yemekler.ev_yemegi,
    stokTuketimi: 1,
  },
  {
    id: 'market_simit',
    isim: 'Simit & Ayran',
    mekan: 'market',
    tur: 'hazir_ye',
    aciklama: 'Tezgah kenarında hızlıca açlığı bastıran ucuz sokak öğünü.',
    ...DENGE.yemekler.market_simit,
  },
  {
    id: 'market_tavuk_pilav',
    isim: 'Sıcak Tavuk Pilav',
    mekan: 'market',
    tur: 'hazir_ye',
    aciklama: 'Spor sonrası kasları toparlayan doyurucu tabak.',
    ...DENGE.yemekler.market_tavuk_pilav,
  },
  {
    id: 'market_mutfak_poseti',
    isim: 'Mutfak Poşeti (+3 Ev Yemeği)',
    mekan: 'market',
    tur: 'erzak_stok',
    aciklama: 'Evdeki buzdolabına 3 öğünlük erzak ekler. Dışarıdan yemeye göre hesaplıdır.',
    ...DENGE.yemekler.market_mutfak_poseti,
    stokKazanci: 3,
  },
  {
    id: 'market_haftalik_erzak',
    isim: 'Haftalık Erzak (+6 Ev Yemeği)',
    mekan: 'market',
    tur: 'erzak_stok',
    aciklama: 'Buzdolabını bir hafta idare edecek kadar doldurur. En ekonomik seçim.',
    ...DENGE.yemekler.market_haftalik_erzak,
    stokKazanci: 6,
  },
];

export interface EvEsyasiTanimi {
  id: string;
  isim: string;
  fiyat: number;
  aciklama: string;
  gunlukEnerjiBonus: number;
  gunlukUykuBonus: number;
  gunlukMoralBonus: number;
  evdeAntrenmanAcar?: boolean;
  gucDayaniklilikBonusYuzde?: number;
}

export const EV_ESYALARI_LISTESI: EvEsyasiTanimi[] = [
  {
    id: 'yatak_ortopedik',
    isim: 'İkinci El Ortopedik Yatak',
    aciklama: 'Yayları batan somyanın yerini alır. Gece uyku ve enerji toparlanmasını +12 artırır.',
    ...DENGE.evEsyalari.yatak_ortopedik,
  },
  {
    id: 'elektrikli_isitici',
    isim: 'Elektrikli Isıtıcı',
    aciklama: 'Soğuk geceyi kırar. Uyku toparlanmasını +8 ve günlük morali +4 yükseltir.',
    ...DENGE.evEsyalari.elektrikli_isitici,
  },
  {
    id: 'kum_torbasi',
    isim: 'Ev Tipi Kum Torbası',
    aciklama: 'Salona asılan eski kum torbası. Spor salonuna gitmeden evde Güç ve Çeviklik çalışmanı açar.',
    ...DENGE.evEsyalari.kum_torbasi,
    evdeAntrenmanAcar: true,
  },
  {
    id: 'agirlik_seti',
    isim: 'Döküm Ağırlık Seti',
    aciklama: 'Kendi evinde demir kaldırmanı sağlar. Tüm Güç ve Dayanıklılık antrenmanlarını +%20 hızlandırır.',
    ...DENGE.evEsyalari.agirlik_seti,
  },
];

// ----------------------------------------------------------------------------
// 4. Ana Karakter, Giriş Hikayesi ve Aile Üyeleri
// ----------------------------------------------------------------------------
export const KARAKTER_SABITLERI = {
  gercekAd: 'Kerem',
  varsayilanLakap: 'Gölge',
  yas: DENGE.baslangic.yas,
  baslangicPara: DENGE.baslangic.para,
  baslangicEnerji: DENGE.baslangic.enerji,
  maksEnerji: DENGE.baslangic.maksEnerji,
  baslangicTokluk: DENGE.baslangic.tokluk,
  baslangicMoral: DENGE.baslangic.moral,
  baslangicYorgunluk: DENGE.baslangic.yorgunluk,
  baslangicBuzdolabi: DENGE.baslangic.buzdolabiStok,
  girisHikayesi: [
    '20 yaşındasın, adın Kerem. Babanı kaybettikten sonra üniversiteyi yarıda bırakıp bu mahallenin soğuk sokaklarına döndün.',
    'Evde annen Emine ve küçük kız kardeşin Elif var; haftalık kira da evin geçimi de artık senin omuzlarında. Gündüz işte ter dök, akşam salonda çalış, zamanı ve karnını iyi yönet.',
  ],
  onerilenLakaplar: [
    'Gölge',
    'Kuzgun',
    'Balyoz',
    'Beton',
    'Kıvılcım',
    'Paslı',
    'Akrep',
    'Gece',
  ],
};

export interface AileUyesi {
  id: string;
  isim: string;
  yakinlik: 'Anne' | 'Kız Kardeş';
  yas: number;
  kisaNot: string;
  hikayeAsamasi: number;
  ruhHaliNotu: string;
}

export const AILE_UYELERI: AileUyesi[] = [
  {
    id: 'anne_emine',
    isim: 'Emine',
    yakinlik: 'Anne',
    yas: 48,
    kisaNot: 'Geceleri dikiş dikerek evi ayakta tutmaya çalışıyor ama gözleri eskisi gibi görmüyor.',
    hikayeAsamasi: 1,
    ruhHaliNotu: 'Kira günü yaklaştıkça sessizleşiyor.',
  },
  {
    id: 'kardes_elif',
    isim: 'Elif',
    yakinlik: 'Kız Kardeş',
    yas: 12,
    kisaNot: 'Ortaokula gidiyor. Evdeki yokluğu belli etmemek için hep derslerine sığınıyor.',
    hikayeAsamasi: 1,
    ruhHaliNotu: 'Abisinin yüzündeki morlukları görmesin diye uğraşıyorsun.',
  },
];

// ----------------------------------------------------------------------------
// 5. Hamle Sistemi (B Aşaması Gerçek Zamanlı Dövüş İçin Veri Yapısı)
// ----------------------------------------------------------------------------
export type HamleTuru = 'yumruk' | 'tekme' | 'kacinma';

export interface HamleVerisi {
  id: string;
  isim: string;
  tur: HamleTuru;
  temelHasar: number;
  staminaMaliyeti: number;
  isabetSansi: number;
  beklemeSuresiMs: number;
  kisayolTusu: string;
  statEtkileri: Partial<Record<StatId, number>>;
  acilisSarti: Partial<Record<StatId, number>>;
  aciklama: string;
  karsiSaldiriFirsati?: number;
  staminaToparlanma?: number;
  komboEtiketi?: string;
  ozelEfekt?: string;
  yetenekId?: string;
  hocaDersId?: string;
}

export const HAMLE_LISTESI: HamleVerisi[] = [
  {
    id: 'duz_yumruk',
    isim: 'Düz Yumruk',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.duz_yumruk,
    kisayolTusu: '1',
    statEtkileri: { ceviklik: 1.2, guc: 0.6 },
    acilisSarti: {},
    aciklama: 'Hızlı ve düşük maliyetli temel vuruş. Çeviklik ile isabeti yükselir.',
    komboEtiketi: 'acilim',
  },
  {
    id: 'sert_yumruk',
    isim: 'Sert Yumruk',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.sert_yumruk,
    kisayolTusu: '2',
    statEtkileri: { guc: 1.6, ceviklik: 0.3 },
    acilisSarti: { guc: 7 },
    aciklama: 'Yavaş ama sarsıcı kroşe. Açılması için omuz ve yumruk gücü şart.',
    komboEtiketi: 'bitirici',
  },
  {
    id: 'alcak_tekme',
    isim: 'Alçak Tekme',
    tur: 'tekme',
    ...DENGE.dovus.hamleler.alcak_tekme,
    kisayolTusu: '3',
    statEtkileri: { ceviklik: 1.1, guc: 0.7 },
    acilisSarti: {},
    aciklama: 'Rakibin dizine ve baldırına inen hızlı tekme. Dengesini bozar.',
    komboEtiketi: 'denge_bozucu',
  },
  {
    id: 'yan_tekme',
    isim: 'Yan Tekme',
    tur: 'tekme',
    ...DENGE.dovus.hamleler.yan_tekme,
    kisayolTusu: '4',
    statEtkileri: { guc: 1.5, ceviklik: 0.5 },
    acilisSarti: { guc: 8, ceviklik: 6 },
    aciklama: 'Yüksek stamina harcayan ama isabet edince mesafeyi açan sert tekme.',
    komboEtiketi: 'bitirici',
  },
  {
    id: 'blok',
    isim: 'Blok',
    tur: 'kacinma',
    ...DENGE.dovus.hamleler.blok,
    kisayolTusu: '5',
    statEtkileri: { refleks: 1.0, dayaniklilik: 0.9 },
    acilisSarti: {},
    aciklama: 'Gardını sıkılaştırıp gelen hasarı azaltır ve nefeslenip stamina toparlatır.',
  },
  {
    id: 'geri_cekil',
    isim: 'Geri Çekil',
    tur: 'kacinma',
    ...DENGE.dovus.hamleler.geri_cekil,
    kisayolTusu: '6',
    statEtkileri: { ceviklik: 1.3, refleks: 0.6 },
    acilisSarti: {},
    aciklama: 'Adım geri atıp saldırıdan sıyrıl. Başarılı olursa karşı saldırı fırsatı doğar.',
  },
  {
    id: 'egil_yana_kay',
    isim: 'Eğil / Yana Kay',
    tur: 'kacinma',
    ...DENGE.dovus.hamleler.egil_yana_kay,
    kisayolTusu: '7',
    statEtkileri: { refleks: 1.5, ceviklik: 0.5 },
    acilisSarti: { refleks: 6 },
    aciklama: 'Rakibin omzunu okuyup altından kayma. Yüksek karşı saldırı açığı yaratır.',
  },
  // --- C1 Yetenek Ağacından Açılan Hamleler ---
  {
    id: 'sol_krose',
    isim: 'Sol Kroşe',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.sol_krose,
    kisayolTusu: '8',
    statEtkileri: { guc: 1.2, ceviklik: 0.8 },
    acilisSarti: {},
    yetenekId: 'y_cene_kancasi',
    aciklama: 'Yetenek ağacından açılan yan açılı sert kroşe. Rakibin dengesini sarsar.',
    komboEtiketi: 'denge_bozucu',
  },
  {
    id: 'cene_aparkati',
    isim: 'Çene Aparkatı',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.cene_aparkati,
    kisayolTusu: '9',
    statEtkileri: { guc: 1.7, ceviklik: 0.4 },
    acilisSarti: {},
    yetenekId: 'y_sokak_aparkati',
    aciklama: 'Alttan çeneye çıkan yıkıcı aparkat. Kombo bitirici olarak yüksek hasar vurur.',
    komboEtiketi: 'bitirici',
  },
  {
    id: 'diz_darbesi',
    isim: 'Diz Darbesi',
    tur: 'tekme',
    ...DENGE.dovus.hamleler.diz_darbesi,
    kisayolTusu: '0',
    statEtkileri: { ceviklik: 1.1, guc: 0.9 },
    acilisSarti: {},
    yetenekId: 't_diz_darbesi',
    aciklama: 'Yakın mesafede karına inen hızlı ve keskin diz vuruşu.',
    komboEtiketi: 'denge_bozucu',
  },
  {
    id: 'doner_tekme',
    isim: 'Döner Tekme',
    tur: 'tekme',
    ...DENGE.dovus.hamleler.doner_tekme,
    kisayolTusu: 'Q',
    statEtkileri: { ceviklik: 1.3, guc: 1.0 },
    acilisSarti: {},
    yetenekId: 't_doner_tekme',
    aciklama: 'Tüm vücut dönüşüyle inen ağır tekme. Yüksek nakavt potansiyeli taşır.',
    komboEtiketi: 'bitirici',
  },
  {
    id: 'celik_gard',
    isim: 'Çelik Gard',
    tur: 'kacinma',
    ...DENGE.dovus.hamleler.celik_gard,
    kisayolTusu: 'W',
    statEtkileri: { refleks: 1.1, dayaniklilik: 1.2 },
    acilisSarti: {},
    yetenekId: 's_celik_gard',
    aciklama: 'Gelişmiş savunma duruşu: darbeyi sertçe emer ve +24 stamina kazandırır.',
  },
  {
    id: 'hayalet_adim',
    isim: 'Hayalet Adım',
    tur: 'kacinma',
    ...DENGE.dovus.hamleler.hayalet_adim,
    kisayolTusu: 'E',
    statEtkileri: { refleks: 1.6, ceviklik: 0.8 },
    acilisSarti: {},
    yetenekId: 's_hayalet_eskiv',
    aciklama: 'Ani yan sıyrılma ile rakibi boşa düşürür ve çok geniş karşı saldırı açığı yaratır.',
  },
  // --- C2 Antrenörlerden Öğrenilen Özel Hamleler ---
  {
    id: 'vucut_krosesi',
    isim: 'Vücut Kroşesi',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.vucut_krosesi,
    kisayolTusu: 'R',
    statEtkileri: { guc: 1.4, ceviklik: 0.6 },
    acilisSarti: {},
    hocaDersId: 'muslum_vucut_krosesi',
    aciklama: 'Müslüm Hoca’nın öğrettiği kaburga hizası kısa kroşe. Rakibin dengesini sarsar.',
    komboEtiketi: 'denge_bozucu',
  },
  {
    id: 'capraz_kontra',
    isim: 'Çapraz Kontra',
    tur: 'yumruk',
    ...DENGE.dovus.hamleler.capraz_kontra,
    kisayolTusu: 'T',
    statEtkileri: { refleks: 1.3, ceviklik: 1.1 },
    acilisSarti: {},
    hocaDersId: 'cigdem_capraz_kontra',
    aciklama: 'Çiğdem Hoca’nın öğrettiği hızlı açılış vuruşu. Yüksek isabetle kombo başlatır.',
    komboEtiketi: 'acilim',
  },
];

// ----------------------------------------------------------------------------
// 6. Ev Seviyeleri (Veri Listesi)
// ----------------------------------------------------------------------------
export interface EvSeviyesi {
  seviye: number;
  id: string;
  isim: string;
  haftalikKira: number;
  gunlukEnerjiToparlanma: number;
  yorgunlukAzaltma: number;
  moralEtkisi: number;
  esyaKapasitesi: number;
  yukseltmeMaliyeti: number;
  aciklama: string;
}

export const EV_SEVIYELERI: EvSeviyesi[] = [
  {
    seviye: 0,
    id: 'rutubetli_bodrum',
    isim: 'Rutubetli Bodrum Katı',
    ...DENGE.evler.rutubetli_bodrum,
    aciklama: 'Duvarları nem kokan, yayları çökmüş eski yataklı zemin altı daire. Sokak gürültüsü hiç dinmez.',
  },
  {
    seviye: 1,
    id: 'sobali_daire',
    isim: 'Sobalı Arka Sokak Dairesi',
    ...DENGE.evler.sobali_daire,
    aciklama: 'İki göz, güneş almasa da kuru ve kapısı kilitlenen mütevazı bir daire. Emine ve Elif burada daha rahat uyur.',
  },
  {
    seviye: 2,
    id: 'aydinlik_ara_kat',
    isim: 'Aydınlık Ara Kat Daire',
    ...DENGE.evler.aydinlik_ara_kat,
    aciklama: 'Kaloriferli, sessiz ve temiz bir mahalle dairesi. İyi dinlenmek ve antrenman yapmak için gerçek bir sığınak.',
  },
];

// ----------------------------------------------------------------------------
// 7. İş Yeri Vardiyaları (Zaman + Enerji + Açlık Harcar, Para Kazandırır)
// ----------------------------------------------------------------------------
export interface EkIsTanimi {
  id: string;
  isim: string;
  aciklama: string;
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
  riskNotu?: string;
}

export const EK_IS_TANIMLARI: EkIsTanimi[] = [
  {
    id: 'el_ilani',
    isim: 'El İlanı & Kurye Desteği',
    aciklama: 'Düşük enerjiyle bile yapılabilen kısa süreli ayak işi. Zor durumda kurtarıcıdır.',
    ...DENGE.isYerleri.el_ilani,
  },
  {
    id: 'gece_oto_yikama',
    isim: 'Oto Yıkama Vardiyası',
    aciklama: 'Sanayi köşesindeki istasyonda vardiya. Soğuk su elini yakar ama düzenlidir.',
    ...DENGE.isYerleri.gece_oto_yikama,
  },
  {
    id: 'hal_hamalligi',
    isim: 'Depo Yükleme & Kasa Taşıma',
    aciklama: 'Ağır kasaları kamyona yükle. Sırtını zorlar ama kira için en yüksek ücreti bırakır.',
    ...DENGE.isYerleri.hal_hamalligi,
  },
  {
    id: 'guvenilir_esnaf_teslimat',
    isim: 'Esnaf Emanet & Kasa Teslimatı',
    aciklama: 'Yüksek Saygı ile açılan güvenilir iş. Mahalle esnafı değerli paket ve nakdi sana emanet eder.',
    ...DENGE.isYerleri.guvenilir_esnaf_teslimat,
  },
  {
    id: 'haracci_tahsilat_isi',
    isim: 'Çete İşi: Gece Tahsilatı',
    aciklama: 'Yüksek Korku ile açılan kirli ama yüksek ödemeli gece tahsilatı.',
    ...DENGE.isYerleri.haracci_tahsilat_isi,
    riskNotu: '%35 Arbede (-14 EN · -12 Uyku)',
  },
];

// ----------------------------------------------------------------------------
// 8. Rastgele Ev Olayları ve Ahlaki Seçim Olayları
// ----------------------------------------------------------------------------
export interface OlayEtkisi {
  para?: number;
  moral?: number;
  enerji?: number;
  tokluk?: number;
  yorgunluk?: number;
  itibar?: number;
  saygi?: number;
  korku?: number;
  aileIliskisi?: number;
  sureDakika?: number;
  buzdolabiStok?: number;
  statIlerleme?: Partial<Record<StatId, number>>;
}

export interface OlaySecenegi {
  id: string;
  etiket: string;
  ipucu: string;
  sonucMetni: string;
  minParaGerekli?: number;
  minEnerjiGerekli?: number;
  etkiler: OlayEtkisi;
}

export interface EvOlayi {
  id: string;
  baslik: string;
  aciklama: string;
  cikmaOlasiligi: number;
  tekSeferlik?: boolean; // True ise hikaye boyunca yalnızca bir kez çıkar
  cikmaSarti?: {
    minGun?: number;
    maksEvSeviyesi?: number;
  };
  kategori: 'ev' | 'mahalle' | 'aile' | 'baski' | 'ahlaki';
  hikayeZinciriId?: string;
  secenekler: OlaySecenegi[];
}

export const EV_OLAYLARI: EvOlayi[] = [
  {
    id: 'elektrik_kesintisi',
    baslik: 'Kesik Hat ve İhbarname',
    aciklama:
      'Eve döndüğünde sigortalar inmiş, kapının altında kırmızı mühürlü elektrik ihbarnamesi duruyor. Annen Emine mutfakta mum yakmış, kardeşin Elif pencereden sızan sokak lambası ışığında defterine eğiliyor.',
    cikmaOlasiligi: 1,
    kategori: 'ev',
    secenekler: [
      {
        id: 'faturayi_ode',
        etiket: 'Gecikmiş faturayı hemen öde (-220 ₺)',
        ipucu: 'Cebin yanar ama ev aydınlanır',
        sonucMetni:
          'Köşedeki bayiden borcu kapattın. Işıklar yanınca Emine tek kelime etmedi ama omuzlarının gevşediğini gördün.',
        etkiler: { para: -220, moral: 10 },
      },
      {
        id: 'komsu_uzatma',
        etiket: 'Yan daireden çekinerek uzatma kablosu iste',
        ipucu: 'Para gitmez, enerjin ve gururun aşınır',
        sonucMetni:
          'Üst kattaki Cemil Amca "Baban hayattayken böyle değildiniz {gercekAd}" diye mırıldanıp kabloyu uzattı. Gururun incindi ama oda aydınlandı.',
        etkiler: { enerji: -12, moral: -4, itibar: -1, saygi: -1 },
      },
      {
        id: 'karanlikta_idare',
        etiket: 'Bu gece mumla idare et, yarın bakarsın',
        ipucu: 'Para kalır ama evde hava ağırlaşır',
        sonucMetni:
          'Karanlık salonda soğuk çay içip erken yattınız. Elif sesini çıkarmadı ama gece boyu uyuyamadın.',
        etkiler: { moral: -10, yorgunluk: 10 },
      },
    ],
  },
  {
    id: 'kardes_okul',
    baslik: 'Masanın Köşesindeki Liste',
    aciklama:
      'Elif okuldan döndüğünde çantasını sessizce kapının arkasına koydu. Masanın ucuna kıvrılmış bir kağıt bırakmış: yeni dönem kaynak kitap ve servis katkısı. Senden istemeye çekindiği belli.',
    cikmaOlasiligi: 1,
    kategori: 'aile',
    secenekler: [
      {
        id: 'kitaplari_al',
        etiket: 'Parayı sessizce kağıdın üstüne koy (-190 ₺)',
        ipucu: 'Kira bütçesini zorlar, evin havasını ısıtır',
        sonucMetni:
          'Sabah Elif parayı görünce koşup koluna sarıldı. "Büyüyünce hepsini geri vereceğim abi" dedi. Bu cümle günün yorgunluğunu sildi.',
        etkiler: { para: -190, moral: 14 },
      },
      {
        id: 'eski_kitap_ara',
        etiket: 'Eski tanıdıklardan ikinci el kitap topla',
        ipucu: 'Enerji harcar, mahalleyle bağı korur',
        sonucMetni:
          'Üç sokak ötedeki kırtasiyeciyle pazarlık edip yarım fiyata eski baskıları toparladın. Eve elin boş dönmedin ama ayakların şişti.',
        etkiler: { enerji: -18, yorgunluk: 10, moral: 5, itibar: 1, saygi: 1 },
      },
      {
        id: 'erteleme_iste',
        etiket: '"Haftaya toparlarız Elif" deyip ertele',
        ipucu: 'Bütçeyi korur ama kardeşini üzer',
        sonucMetni:
          'Elif başını sallayıp "Sorun değil abi, arkadaştan fotokopi çekerim" dedi. İçindeki sızı akşama kadar geçmedi.',
        etkiler: { moral: -12 },
      },
    ],
  },
  {
    id: 'baba_tanidigi',
    baslik: 'Kahvehane Önünde Eski Bir Ses',
    aciklama:
      'Sokağın köşesinde babanın eski dostu Nuri Abi seni gerçek adınla durduruyor: "Kerem, gel bakalım. Baban rahmetli olmadan önce şu bakkalda ufak bir veresiye bırakmıştı. Kimseye açmadım ama esnaf artık sıkışık."',
    cikmaOlasiligi: 1,
    tekSeferlik: true,
    kategori: 'mahalle',
    secenekler: [
      {
        id: 'borcu_kapat',
        etiket: 'Babanın kalan hesabını öde (-240 ₺)',
        ipucu: 'Maddi yük, mahallede yüksek saygı (bir kere kapanır)',
        sonucMetni:
          'Nuri Abi omzuna vurdu: "Babanın oğluymuşsun Kerem. Bu mahallede sözün yere düşmez." Bakkal da hesabı tamamen kapattı.',
        etkiler: { para: -240, moral: 6, itibar: 3, saygi: 3 },
      },
      {
        id: 'yuk_tasi',
        etiket: 'Para yerine bakkala çuval taşı',
        ipucu: 'Enerjin düşer ama borcu emeğinle tamamen eritirsin',
        sonucMetni:
          'Çuvalları depoya dizerken ter içinde kaldın. Nuri Abi "Helal olsun, ekmeğini taştan çıkarıyorsun" diyerek veresiye defterini kapattı.',
        etkiler: { enerji: -24, yorgunluk: 14, itibar: 2, saygi: 2, statIlerleme: { guc: 20 } },
      },
      {
        id: 'vakit_iste',
        etiket: '"Şu ara kira derdim var Nuri Abi, hesabı kapatamıyorum" de',
        ipucu: 'Para ve enerji korunur, mahallede soğukluk kalır',
        sonucMetni:
          'Nuri Abi başını öne eğip "Anlıyorum evlat, ben de Nuri bakkalla aranı hallettim, bir daha kapına gelinmeyecek" dedi ama eski sıcaklık biraz söndü.',
        etkiler: { moral: -6, itibar: -1, saygi: -1 },
      },
    ],
  },
  {
    id: 'kira_baskisi_kapida',
    baslik: 'Merdiven Boşluğunda Soğuk Bakış',
    aciklama:
      'Gece yarısına doğru kapı sertçe vuruluyor. Ev sahibinin yeğeni koridorda dikilmiş, "Apartman aidatı ve tadilat payı çıktı, geciktirmeyin" diye dikleniyor. İçeriden annen Emine\'nin tedirgin sesi geliyor.',
    cikmaOlasiligi: 1,
    cikmaSarti: { minGun: 2 },
    kategori: 'baski',
    secenekler: [
      {
        id: 'sinir_ciz',
        etiket: 'Kapıyı çekip dışarı çık, gözünü kaçırmadan sınır çiz',
        ipucu: 'Yorgunluk artar ama {oyuncuAdi} namı büyür',
        sonucMetni:
          'Sesini yükseltmedin ama duruşun yetti. "Kira günü geldiğinde kapıma gel, annemin kapısına değil" dedin. Merdivenden ses çıkarmadan indi.',
        etkiler: { yorgunluk: 10, moral: 6, itibar: 2, korku: 2, statIlerleme: { refleks: 25 } },
      },
      {
        id: 'avans_ver',
        etiket: 'Tatsızlık çıkmasın diye avans ver (-150 ₺)',
        ipucu: 'Evdekiler gerilmez ama cebinden gider',
        sonucMetni:
          'Cebindeki parayı uzatıp adamı savdın. Annen rahatladı ama kendini ezilmiş hissetmek geceni zehir etti.',
        etkiler: { para: -150, moral: -5 },
      },
      {
        id: 'ofkeyi_antremana_dok',
        etiket: 'İçeri girmeden arka avluda yumruklarını duvara göm',
        ipucu: 'Enerji gider, öfken güce dönüşür',
        sonucMetni:
          'Adam gidince yarım saat soğukta gölge boksu ve beton yumruklama yaptın. Parmak boğumların sızlıyor ama elin daha sert.',
        etkiler: { enerji: -18, yorgunluk: 12, moral: -4, statIlerleme: { guc: 30 } },
      },
    ],
  },
  {
    id: 'emine_dikis_makinesi',
    baslik: 'Bozulan Dikiş Makinesi',
    aciklama:
      'Annen Emine sabah erkenden eski dikiş makinesinin başında uğraşıyor; kayış kopmuş, terziden aldığı ek iş elinde kalmış. "İki etek dikecektim, akşamüstü teslim edecektim" diye iç çekiyor.',
    cikmaOlasiligi: 1,
    cikmaSarti: { minGun: 2 },
    kategori: 'aile',
    secenekler: [
      {
        id: 'tamir_parcasi_al',
        etiket: 'Çarşıdan yeni kayış ve yağ al (-90 ₺)',
        ipucu: 'Ufak bir masraf, Emine işini teslim edip nefes alır',
        sonucMetni:
          'Kayışı kendin taktın; makine tıkır tıkır çalışmaya başladı. Akşama kadar Emine iki parça işi bitirip ev masrafına destek oldu.',
        etkiler: { para: -90, moral: 10 },
      },
      {
        id: 'elinden_tamir_et',
        etiket: 'Eski bir kabloyla geçici kasnak uydur',
        ipucu: 'Para gitmez, vaktin ve enerjin gider',
        sonucMetni:
          'Bir saat uğraştın ama makineyi döndürmeyi başardın. Emine elini öpüp teşekkür etti.',
        etkiler: { enerji: -14, yorgunluk: 8, moral: 6 },
      },
    ],
  },
  {
    id: 'mahalle_komsu_yardimi',
    baslik: 'Kömürlük Kapısında Yaşlı Komşu',
    aciklama:
      'Alt kattaki Şükran Teyze kışlık erzak kolilerini merdivenden çıkaramıyor. Yorgun görünüyorsun ama yaşlı kadın elinde filelerle nefes nefese bekliyor.',
    cikmaOlasiligi: 1,
    kategori: 'mahalle',
    secenekler: [
      {
        id: 'kolileri_tasi',
        etiket: 'Kolileri üç kat yukarı sırtlan',
        ipucu: 'Enerji gider ama dayanıklılık ve mahalle saygısı artar',
        sonucMetni:
          'Ağır çuvalları tek seferde çıkardın. Şükran Teyze "Allah senden razı olsun Kerem" deyip eline bir kavanoz ev yapımı tarhana tutuşturdu.',
        etkiler: { enerji: -15, tokluk: 12, moral: 6, itibar: 1, saygi: 1, statIlerleme: { dayaniklilik: 22 } },
      },
      {
        id: 'sadece_birini_al',
        etiket: 'En ağır koliyi kapısına bırakıp aceleyle işe yetiş',
        ipucu: 'Dengeli yardım, az efor',
        sonucMetni:
          'En ağır koliyi çıkarıp selam verdin. Hem vaktini korudun hem komşuyu yarı yolda bırakmadın.',
        etkiler: { enerji: -6, moral: 3 },
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 9. B Aşaması: Sokak Arenası Rakipleri ve Gerçek Zamanlı Dövüş Sabitleri
// ----------------------------------------------------------------------------
export type RakipTarzi = 'saldirgan' | 'cevik' | 'savunmaci';

export interface RakipTanimi {
  id: string;
  isim: string;
  lakap: string;
  tarz: RakipTarzi;
  seviyeEtiketi: string;
  aciklama: string;
  statlar: Record<StatId, number>;
  paraOdulu: number;
  itibarOdulu: number;
  teselliPara: number;
  cekinmeEsik1: number;
  cekinmeYuzde1: number;
  cekinmeEsik2: number;
  cekinmeYuzde2: number;
  gorunum: KarakterGorunumu;
}

export const DOVUS_SABITLERI = {
  macSureDakika: DENGE.dovus.macSureDakika,
  macEnerjiMaliyeti: DENGE.dovus.macEnerjiMaliyeti,
  macToklukMaliyeti: DENGE.dovus.macToklukMaliyeti,
  macUykuKaybi: DENGE.dovus.macUykuKaybi,
  maksMacSuresiMs: DENGE.dovus.maksMacSuresiMs,
  koYavaslatmaMs: DENGE.dovus.koYavaslatmaMs,
};

export const RAKIP_LISTESI: RakipTanimi[] = [
  {
    id: 'sisko_cetin',
    isim: 'Çetin',
    lakap: 'Kamyoncu Çetin',
    tarz: 'saldirgan',
    seviyeEtiketi: 'Çaylak · Sokak Köşesi',
    aciklama: 'Ağır cüsseli ve kaba kuvvetle yüklenen bir bıçkın. Gardını açık bırakır, kaçınınca kolay av olur.',
    ...DENGE.dovus.rakipler.sisko_cetin,
    statlar: { ...DENGE.dovus.rakipler.sisko_cetin.statlar },
    gorunum: {
      tenRengi: '#C49074',
      golgeTenRengi: '#8E5E46',
      sacRengi: '#2C221E',
      ustKiyafetRengi: '#4A2525',
      ustKiyafetGolge: '#2E1414',
      altKiyafetRengi: '#1B1F29',
      bandajRengi: '#C7B8A1',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
  {
    id: 'jilet_emir',
    isim: 'Emir',
    lakap: 'Jilet Emir',
    tarz: 'cevik',
    seviyeEtiketi: 'Orta · Arka Avlu',
    aciklama: 'Hızlı ayak oyunu ve alçak tekmelerle sürekli mesafe bozar. Çevikliği yüksektir.',
    ...DENGE.dovus.rakipler.jilet_emir,
    statlar: { ...DENGE.dovus.rakipler.jilet_emir.statlar },
    gorunum: {
      tenRengi: '#D4A88E',
      golgeTenRengi: '#9B7058',
      sacRengi: '#0D1017',
      ustKiyafetRengi: '#203E3A',
      ustKiyafetGolge: '#122623',
      altKiyafetRengi: '#131620',
      bandajRengi: '#EAECEF',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
  {
    id: 'demir_serkan',
    isim: 'Serkan',
    lakap: 'Demir Serkan',
    tarz: 'savunmaci',
    seviyeEtiketi: 'Zorlu · Depo Önü',
    aciklama: 'Gardını kolay kolay indirmez, rakibin staminasını tüketip sert yan tekme ile bitirir.',
    ...DENGE.dovus.rakipler.demir_serkan,
    statlar: { ...DENGE.dovus.rakipler.demir_serkan.statlar },
    gorunum: {
      tenRengi: '#B9876E',
      golgeTenRengi: '#825742',
      sacRengi: '#3B3F4A',
      ustKiyafetRengi: '#353C4E',
      ustKiyafetGolge: '#1E222E',
      altKiyafetRengi: '#161820',
      bandajRengi: '#D99B38',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
  {
    id: 'kasap_halil',
    isim: 'Halil',
    lakap: 'Kasap Halil',
    tarz: 'saldirgan',
    seviyeEtiketi: 'Usta · Gece Şampiyonu',
    aciklama: 'Mahallenin en korkulan sokak dövüşçüsü. Ağır kroşeleri bloklanmazsa birkaç saniyede yıkar.',
    ...DENGE.dovus.rakipler.kasap_halil,
    statlar: { ...DENGE.dovus.rakipler.kasap_halil.statlar },
    gorunum: {
      tenRengi: '#C18C72',
      golgeTenRengi: '#855540',
      sacRengi: '#121318',
      ustKiyafetRengi: '#521A1A',
      ustKiyafetGolge: '#300E0E',
      altKiyafetRengi: '#0E1016',
      bandajRengi: '#E34A4A',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
];

// ----------------------------------------------------------------------------
// 10. C1 Aşaması: Yetenek Ağacı (4 Dal × 5 Kademe = 20 Düğüm)
// Yeni yetenek eklemek için aşağıdaki listeye yeni bir kayıt eklemek yeterlidir.
// ----------------------------------------------------------------------------
export const STAT_YETENEK_ESIKLERI = STAT_YETENEK_ESIK_LISTESI;

export type YetenekDaliId = 'yumruk' | 'tekme' | 'savunma' | 'dayaniklilik';

export interface YetenekDaliTanimi {
  id: YetenekDaliId;
  isim: string;
  kisaAciklama: string;
  vurguRenk: string;
}

export interface YetenekEtkisi {
  ekMaksCan?: number;
  ekMaksStamina?: number;
  staminaToparlanmaYuzde?: number;
  yumrukHasarYuzde?: number;
  tekmeHasarYuzde?: number;
  isabetBonusu?: number;
  blokKesintiYuzde?: number;
  kacinmaSansiBonusu?: number;
  karsiSaldiriCarpanBonusu?: number;
  antrenmanVerimBonusu?: number;
  gunlukEnerjiBonusu?: number;
  acilanHamleId?: string;
}

export interface YetenekDugumu {
  id: string;
  dal: YetenekDaliId;
  kademe: 1 | 2 | 3 | 4 | 5;
  isim: string;
  aciklama: string;
  oncekiYetenekId: string | null;
  statSarti: Partial<Record<StatId, number>>;
  puanMaliyeti: number;
  etki: YetenekEtkisi;
  ozetEtiket: string;
}

export const YETENEK_DALLARI: YetenekDaliTanimi[] = [
  {
    id: 'yumruk',
    isim: 'Yumruk',
    kisaAciklama: 'Yakın mesafe kroşe, aparkat ve yumruk hasarı.',
    vurguRenk: '#D63838',
  },
  {
    id: 'tekme',
    isim: 'Tekme',
    kisaAciklama: 'Diz darbesi, döner tekme ve mesafe kontrolü.',
    vurguRenk: '#D99B38',
  },
  {
    id: 'savunma',
    isim: 'Savunma / Kaçınma',
    kisaAciklama: 'Çelik gard, hayalet adım, blok ve kontra gücü.',
    vurguRenk: '#5B82B8',
  },
  {
    id: 'dayaniklilik',
    isim: 'Dayanıklılık / Pasifler',
    kisaAciklama: 'Maksimum can, hızlı stamina yenileme ve verim.',
    vurguRenk: '#6CC296',
  },
];

export const YETENEK_AGACI: YetenekDugumu[] = [
  // --- DAL 1: YUMRUK ---
  {
    id: 'y_sik_bandaj',
    dal: 'yumruk',
    kademe: 1,
    isim: 'Sıkı Bandaj',
    aciklama: 'El taraklarını doğru sarmayı öğrenirsin. Tüm yumrukların daha sert iner.',
    oncekiYetenekId: null,
    statSarti: {},
    puanMaliyeti: 1,
    etki: { yumrukHasarYuzde: 10 },
    ozetEtiket: 'Pasif: +%10 Yumruk Hasarı',
  },
  {
    id: 'y_cene_kancasi',
    dal: 'yumruk',
    kademe: 2,
    isim: 'Çene Kancası',
    aciklama: 'Yakın mesafede rakibin dengesini bozan Sol Kroşe tekniğini açar.',
    oncekiYetenekId: 'y_sik_bandaj',
    statSarti: { guc: 5 },
    puanMaliyeti: 1,
    etki: { acilanHamleId: 'sol_krose' },
    ozetEtiket: 'Yeni Hamle: Sol Kroşe',
  },
  {
    id: 'y_agir_bogum',
    dal: 'yumruk',
    kademe: 3,
    isim: 'Ağır Boğum',
    aciklama: 'Omuz dönüşünü yumruğa gömersin. Yumruk hasarın ve isabetin yükselir.',
    oncekiYetenekId: 'y_cene_kancasi',
    statSarti: { guc: 6 },
    puanMaliyeti: 2,
    etki: { yumrukHasarYuzde: 15, isabetBonusu: 4 },
    ozetEtiket: 'Pasif: +%15 Yumruk, +%4 İsabet',
  },
  {
    id: 'y_sokak_aparkati',
    dal: 'yumruk',
    kademe: 4,
    isim: 'Sokak Aparkatı',
    aciklama: 'Kombo sonunda yüksek darbe vuran Çene Aparkatı hamlesini açar.',
    oncekiYetenekId: 'y_agir_bogum',
    statSarti: { guc: 8 },
    puanMaliyeti: 2,
    etki: { acilanHamleId: 'cene_aparkati' },
    ozetEtiket: 'Yeni Hamle: Çene Aparkatı',
  },
  {
    id: 'y_balyoz',
    dal: 'yumruk',
    kademe: 5,
    isim: 'Balyoz Yumruğu',
    aciklama: 'Ağır siklet sokak vuruşu. Yumruk gücü ve karşı saldırı çarpanı zirveye çıkar.',
    oncekiYetenekId: 'y_sokak_aparkati',
    statSarti: { guc: 10 },
    puanMaliyeti: 3,
    etki: { yumrukHasarYuzde: 20, karsiSaldiriCarpanBonusu: 0.15 },
    ozetEtiket: 'Pasif: +%20 Yumruk, +0.15 Karşı',
  },

  // --- DAL 2: TEKME ---
  {
    id: 't_esnek_kalca',
    dal: 'tekme',
    kademe: 1,
    isim: 'Esnek Kalça',
    aciklama: 'Kalça açını geliştirip tüm tekmelere ekstra itiş gücü eklersin.',
    oncekiYetenekId: null,
    statSarti: {},
    puanMaliyeti: 1,
    etki: { tekmeHasarYuzde: 10 },
    ozetEtiket: 'Pasif: +%10 Tekme Hasarı',
  },
  {
    id: 't_diz_darbesi',
    dal: 'tekme',
    kademe: 2,
    isim: 'Yakın Diz Darbesi',
    aciklama: 'Yüksek isabetle denge bozan Diz Darbesi hamlesini repertuara ekler.',
    oncekiYetenekId: 't_esnek_kalca',
    statSarti: { ceviklik: 6 },
    puanMaliyeti: 1,
    etki: { acilanHamleId: 'diz_darbesi' },
    ozetEtiket: 'Yeni Hamle: Diz Darbesi',
  },
  {
    id: 't_keskin_baldir',
    dal: 'tekme',
    kademe: 3,
    isim: 'Keskin Baldır',
    aciklama: 'Kırbaç gibi dönen ayak ucuyla tekme hasarını ve isabeti artırırsın.',
    oncekiYetenekId: 't_diz_darbesi',
    statSarti: { ceviklik: 7 },
    puanMaliyeti: 2,
    etki: { tekmeHasarYuzde: 15, isabetBonusu: 5 },
    ozetEtiket: 'Pasif: +%15 Tekme, +%5 İsabet',
  },
  {
    id: 't_doner_tekme',
    dal: 'tekme',
    kademe: 4,
    isim: 'Döner Tekme',
    aciklama: 'Yüksek hasarlı kombo bitirici Döner Tekme hamlesini açar.',
    oncekiYetenekId: 't_keskin_baldir',
    statSarti: { ceviklik: 9, guc: 7 },
    puanMaliyeti: 2,
    etki: { acilanHamleId: 'doner_tekme' },
    ozetEtiket: 'Yeni Hamle: Döner Tekme',
  },
  {
    id: 't_gok_gurultusu',
    dal: 'tekme',
    kademe: 5,
    isim: 'Gök Gürültüsü',
    aciklama: 'Ayak oyunu ve tekme ustalığının zirvesi; hasar ve kaçınma şansı yükselir.',
    oncekiYetenekId: 't_doner_tekme',
    statSarti: { ceviklik: 11 },
    puanMaliyeti: 3,
    etki: { tekmeHasarYuzde: 22, kacinmaSansiBonusu: 6 },
    ozetEtiket: 'Pasif: +%22 Tekme, +%6 Kaçınma',
  },

  // --- DAL 3: SAVUNMA / KAÇINMA ---
  {
    id: 's_sogukkanli_goz',
    dal: 'savunma',
    kademe: 1,
    isim: 'Soğukkanlı Göz',
    aciklama: 'Rakibin omuz hareketini okuyarak sıyrılma ve blok verimini artırırsın.',
    oncekiYetenekId: null,
    statSarti: {},
    puanMaliyeti: 1,
    etki: { kacinmaSansiBonusu: 6, blokKesintiYuzde: 5 },
    ozetEtiket: 'Pasif: +%6 Kaçınma, +%5 Blok',
  },
  {
    id: 's_celik_gard',
    dal: 'savunma',
    kademe: 2,
    isim: 'Çelik Gard',
    aciklama: 'Daha yüksek stamina kazandıran gelişmiş Çelik Gard savunmasını açar.',
    oncekiYetenekId: 's_sogukkanli_goz',
    statSarti: { refleks: 5 },
    puanMaliyeti: 1,
    etki: { acilanHamleId: 'celik_gard' },
    ozetEtiket: 'Yeni Hamle: Çelik Gard',
  },
  {
    id: 's_keskin_kontra',
    dal: 'savunma',
    kademe: 3,
    isim: 'Keskin Kontra',
    aciklama: 'Boşa düşen darbeleri daha sert cezalandırır, gardını sıkılaştırırsın.',
    oncekiYetenekId: 's_celik_gard',
    statSarti: { refleks: 7 },
    puanMaliyeti: 2,
    etki: { karsiSaldiriCarpanBonusu: 0.2, blokKesintiYuzde: 8 },
    ozetEtiket: 'Pasif: +0.20 Karşı, +%8 Blok',
  },
  {
    id: 's_hayalet_eskiv',
    dal: 'savunma',
    kademe: 4,
    isim: 'Hayalet Eskiv',
    aciklama: 'Yüksek sıyrılma ve kontra penceresi açan Hayalet Adım hamlesini açar.',
    oncekiYetenekId: 's_keskin_kontra',
    statSarti: { refleks: 8, ceviklik: 7 },
    puanMaliyeti: 2,
    etki: { acilanHamleId: 'hayalet_adim' },
    ozetEtiket: 'Yeni Hamle: Hayalet Adım',
  },
  {
    id: 's_golge_refleksi',
    dal: 'savunma',
    kademe: 5,
    isim: 'Gölge Refleksi',
    aciklama: 'Darbelere karşı neredeyse dokunulmaz bir ritim ve yıkıcı kontra gücü.',
    oncekiYetenekId: 's_hayalet_eskiv',
    statSarti: { refleks: 10 },
    puanMaliyeti: 3,
    etki: { kacinmaSansiBonusu: 10, karsiSaldiriCarpanBonusu: 0.25 },
    ozetEtiket: 'Pasif: +%10 Kaçınma, +0.25 Karşı',
  },

  // --- DAL 4: DAYANIKLILIK / PASİFLER ---
  {
    id: 'd_derin_nefes',
    dal: 'dayaniklilik',
    kademe: 1,
    isim: 'Derin Nefes',
    aciklama: 'Ringe nefesini kontrol ederek çıkarsın. Stamina sınırı ve yenilenmesi artar.',
    oncekiYetenekId: null,
    statSarti: {},
    puanMaliyeti: 1,
    etki: { staminaToparlanmaYuzde: 15, ekMaksStamina: 8 },
    ozetEtiket: 'Pasif: +8 Stamina, +%15 Yenileme',
  },
  {
    id: 'd_beton_cene',
    dal: 'dayaniklilik',
    kademe: 2,
    isim: 'Beton Çene',
    aciklama: 'Sert darbelere direncin yükselir; maksimum canın kalıcı olarak artar.',
    oncekiYetenekId: 'd_derin_nefes',
    statSarti: { dayaniklilik: 6 },
    puanMaliyeti: 1,
    etki: { ekMaksCan: 16 },
    ozetEtiket: 'Pasif: +16 Maksimum Can',
  },
  {
    id: 'd_ikinci_ruzgar',
    dal: 'dayaniklilik',
    kademe: 3,
    isim: 'İkinci Rüzgar',
    aciklama: 'Uzayan raundlarda bile ciğerlerin açılır, nefesin çok daha hızlı dolar.',
    oncekiYetenekId: 'd_beton_cene',
    statSarti: { dayaniklilik: 7 },
    puanMaliyeti: 2,
    etki: { staminaToparlanmaYuzde: 20, ekMaksStamina: 12 },
    ozetEtiket: 'Pasif: +12 Stamina, +%20 Yenileme',
  },
  {
    id: 'd_sokak_disiplini',
    dal: 'dayaniklilik',
    kademe: 4,
    isim: 'Sokak Disiplini',
    aciklama: 'Antrenmanlardan daha fazla verim alır, sabaha daha dinç uyanırsın.',
    oncekiYetenekId: 'd_ikinci_ruzgar',
    statSarti: { dayaniklilik: 8 },
    puanMaliyeti: 2,
    etki: { ekMaksCan: 14, antrenmanVerimBonusu: 8, gunlukEnerjiBonusu: 6 },
    ozetEtiket: 'Pasif: +14 Can, +%8 Verim, +6 EN',
  },
  {
    id: 'd_demir_beden',
    dal: 'dayaniklilik',
    kademe: 5,
    isim: 'Demir Beden',
    aciklama: 'Kolay devrilmeyen bir dövüşçü fiziği. Can, stamina ve blok direnci yükselir.',
    oncekiYetenekId: 'd_sokak_disiplini',
    statSarti: { dayaniklilik: 10 },
    puanMaliyeti: 3,
    etki: { ekMaksCan: 28, staminaToparlanmaYuzde: 25, blokKesintiYuzde: 7 },
    ozetEtiket: 'Pasif: +28 Can, +%25 Stam, +%7 Blok',
  },
];

// ----------------------------------------------------------------------------
// 11. C2 Aşaması: Spor Salonu Antrenörleri & Özel Dersleri
// Yeni hoca veya ders eklemek için aşağıdaki listelere kayıt eklemek yeterlidir.
// ----------------------------------------------------------------------------
export interface AntrenorTanimi {
  id: string;
  isim: string;
  lakap: string;
  uzmanlik: string;
  aciklama: string;
  diyalog: string;
  gorunum: KarakterGorunumu;
}

export interface AntrenorDersi {
  id: string;
  antrenorId: string;
  isim: string;
  aciklama: string;
  ozetEtiket: string;
  paraMaliyeti: number;
  sureDakika: number;
  enerjiMaliyeti: number;
  statSarti: Partial<Record<StatId, number>>;
  oncekiDersId?: string;
  etki: YetenekEtkisi & {
    ekYetenekPuani?: number;
  };
}

export const ANTRENOR_LISTESI: AntrenorTanimi[] = [
  {
    id: 'hoca_muslum',
    isim: 'Müslüm Hoca',
    lakap: 'Eski Ağır Siklet',
    uzmanlik: 'Güç · Yakın Dövüş · Gard',
    aciklama: 'Salondaki en eski boks hocası. Babanı gençliğinden tanır, kısa ve sert yakın mesafe yumrukları öğretir.',
    diyalog: 'Baban da yumruğu saklamazdı Kerem. Sokakta sana {oyuncuAdi} diyorlarmış ama sağlam gard yoksa isim karın doyurmaz.',
    gorunum: {
      tenRengi: '#B9876E',
      golgeTenRengi: '#825742',
      sacRengi: '#6B7280',
      ustKiyafetRengi: '#4A2525',
      ustKiyafetGolge: '#2E1414',
      altKiyafetRengi: '#161820',
      bandajRengi: '#D99B38',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
  {
    id: 'hoca_cigdem',
    isim: 'Çiğdem Hoca',
    lakap: 'Kulüp Antrenörü',
    uzmanlik: 'Çeviklik · Refleks · Tekme',
    aciklama: 'Amatör liglerden kalma disiplinli kickboks antrenörü. Nefes kontrolü, kontra ve seri ayak oyunu çalıştırır.',
    diyalog: 'Sadece sert vurarak ayakta kalamazsın {oyuncuAdi}. Darbeyi okuyup zamanında karşılık verirsen herkesi düşürürsün.',
    gorunum: {
      tenRengi: '#D4A88E',
      golgeTenRengi: '#9B7058',
      sacRengi: '#1E1B24',
      ustKiyafetRengi: '#203E3A',
      ustKiyafetGolge: '#122623',
      altKiyafetRengi: '#12151E',
      bandajRengi: '#EAECEF',
      konturRengi: '#06080E',
      yapiOlcegi: 1.0,
    },
  },
];

export const ANTRENOR_DERSLERI: AntrenorDersi[] = [
  {
    id: 'muslum_vucut_krosesi',
    antrenorId: 'hoca_muslum',
    isim: 'Kömürlük Kroşesi Dersi',
    aciklama: 'Müslüm Hoca kaburga altına giren kısa vücut kroşesini torba başında birebir gösterir.',
    ozetEtiket: 'Hamle: Vücut Kroşesi [R] + +%10 Yumruk',
    ...DENGE.hocaDersleri.muslum_vucut_krosesi,
    statSarti: { guc: 5 },
    etki: { acilanHamleId: 'vucut_krosesi', yumrukHasarYuzde: 10 },
  },
  {
    id: 'muslum_civi_durus',
    antrenorId: 'hoca_muslum',
    isim: 'Çivi Gibi Durmak',
    aciklama: 'Ağır darbe alırken çeneni saklayıp gövdeni kilitleme dersi. Kalıcı can ve blok direnci kazandırır.',
    ozetEtiket: 'Pasif: +14 Maks Can · +%6 Blok',
    ...DENGE.hocaDersleri.muslum_civi_durus,
    statSarti: { dayaniklilik: 6 },
    etki: { ekMaksCan: 14, blokKesintiYuzde: 6 },
  },
  {
    id: 'muslum_agir_disiplin',
    antrenorId: 'hoca_muslum',
    isim: 'Ağır Torba Disiplini',
    aciklama: 'Antrenman temposunu düzene sokan özel program. Verimi kalıcı artırır ve bir ustalık puanı verir.',
    ozetEtiket: 'Pasif: +%10 Verim · +1 YP',
    ...DENGE.hocaDersleri.muslum_agir_disiplin,
    statSarti: { guc: 8, dayaniklilik: 7 },
    oncekiDersId: 'muslum_vucut_krosesi',
    etki: { antrenmanVerimBonusu: 10, ekYetenekPuani: 1 },
  },
  {
    id: 'cigdem_ritim_ipi',
    antrenorId: 'hoca_cigdem',
    isim: 'İp Üstü Ritim & Nefes',
    aciklama: 'Üç dakikalık aralıksız tempo ile nefesini düzenlersin. Dövüşte stamina yenilemesi ve isabet artar.',
    ozetEtiket: 'Pasif: +%10 Stamina Yenileme · +%5 İsabet',
    ...DENGE.hocaDersleri.cigdem_ritim_ipi,
    statSarti: { ceviklik: 5 },
    etki: { staminaToparlanmaYuzde: 10, isabetBonusu: 5 },
  },
  {
    id: 'cigdem_capraz_kontra',
    antrenorId: 'hoca_cigdem',
    isim: 'Ters Kontra Eskivi',
    aciklama: 'Çiğdem Hoca refleks topu önünde hızlı Çapraz Kontra açılışını ve yan sıyrılmayı öğretir.',
    ozetEtiket: 'Hamle: Çapraz Kontra [T] + +%6 Kaçınma',
    ...DENGE.hocaDersleri.cigdem_capraz_kontra,
    statSarti: { refleks: 6, ceviklik: 6 },
    etki: { acilanHamleId: 'capraz_kontra', kacinmaSansiBonusu: 6 },
  },
  {
    id: 'cigdem_firtina_tekmesi',
    antrenorId: 'hoca_cigdem',
    isim: 'Fırtına Tekmesi Tekniği',
    aciklama: 'Kalça dönüşünü hızlandırarak tekmelerini ve karşı saldırı gücünü keskinleştirir.',
    ozetEtiket: 'Pasif: +%15 Tekme · +0.15 Kontra',
    ...DENGE.hocaDersleri.cigdem_firtina_tekmesi,
    statSarti: { ceviklik: 8 },
    oncekiDersId: 'cigdem_ritim_ipi',
    etki: { tekmeHasarYuzde: 15, karsiSaldiriCarpanBonusu: 0.15 },
  },
];

// ----------------------------------------------------------------------------
// 12. C2 Aşaması: Sabit Komşu Karakterler ve Koşullu Hikaye Zincirleri
// ----------------------------------------------------------------------------
export interface KomsuTanimi {
  id: string;
  isim: string;
  rol: string;
  hitapSekli: string;
  mekanlar: MekanId[];
  kisaNot: string;
  karakterTuru: 'firsat' | 'destek' | 'sorun';
}

export interface KomsuOlayKosulu {
  minGun?: number;
  minPara?: number;
  maksPara?: number;
  minMacGalibiyet?: number;
  gerekliSecimId?: string;
  gerekliBayrak?: string;
  haricBayrak?: string;
}

export interface KomsuSecenekEtkisi extends OlayEtkisi {
  sureDakika?: number;
  buzdolabiStok?: number;
  yetenekPuani?: number;
  bayrakEkle?: string;
}

export interface KomsuOlaySecenegi {
  id: string;
  etiket: string;
  ipucu: string;
  sonucMetni: string;
  minParaGerekli?: number;
  minEnerjiGerekli?: number;
  etkiler: KomsuSecenekEtkisi;
}

export interface KomsuHikayeOlayi {
  id: string;
  komsuId: string;
  adim: number;
  mekanlar: MekanId[];
  baslik: string;
  aciklama: string;
  kosul: KomsuOlayKosulu;
  secenekler: KomsuOlaySecenegi[];
}

export const KOMSU_LISTESI: KomsuTanimi[] = [
  {
    id: 'bakkal_riza',
    isim: 'Bakkal Rıza',
    rol: 'Mahalle Bakkalı',
    hitapSekli: 'Kerem',
    mekanlar: ['market'],
    kisaNot: 'Babanın eski müşterisi ve dostu. Zor günde uygun erzak ve kasa işi çıkarabilir.',
    karakterTuru: 'firsat',
  },
  {
    id: 'nuri_usta',
    isim: 'Nuri Abi',
    rol: 'Babanın Eski Arkadaşı',
    hitapSekli: 'Kerem / {oyuncuAdi}',
    mekanlar: ['sokak_arena', 'ev'],
    kisaNot: 'Kahve köşesinden mahalleyi izler; dövüş çevresindeki söylentileri ve babanın hatıralarını bilir.',
    karakterTuru: 'destek',
  },
  {
    id: 'ev_sahibi_kemal',
    isim: 'Ev Sahibi Kemal',
    rol: 'Apartman Sahibi',
    hitapSekli: 'Kerem',
    mekanlar: ['ev'],
    kisaNot: 'Kirayı bir gün bile aksatmaya tahammülü yoktur. Sürekli masraf ve baskı çıkarır.',
    karakterTuru: 'sorun',
  },
  {
    id: 'mahalle_cocuklari',
    isim: 'Yusuf & Mahalle Çocukları',
    rol: 'Sokak Tayfası',
    hitapSekli: '{oyuncuAdi} Abi',
    mekanlar: ['sokak_arena'],
    kisaNot: 'Sokak lambası altında top koşturup maçları izlerler. İpucu da getirirler, bela da.',
    karakterTuru: 'firsat',
  },
  {
    id: 'komsu_sukran',
    isim: 'Şükran Teyze',
    rol: 'Alt Kat Komşusu',
    hitapSekli: 'Kerem',
    mekanlar: ['ev', 'market'],
    kisaNot: 'Annen Emine ile dertleşen yaşlı komşu. Babanı hayırla anar, ufak iş ve sıcak yemek paylaşır.',
    karakterTuru: 'destek',
  },
];

export const KOMSU_OLAYLARI: KomsuHikayeOlayi[] = [
  // --- 1. BAKKAL RIZA (3 ADIM) ---
  {
    id: 'riza_1_tezgah',
    komsuId: 'bakkal_riza',
    adim: 1,
    mekanlar: ['market'],
    baslik: 'Tezgah Arkasından Tanıdık Ses',
    aciklama:
      'Bakkal Rıza rafları düzeltirken seni görünce elindeki bezi bırakıyor: "Gel bakalım {gercekAd}. Baban hayattayken her sabah buradan iki sıcak ekmek alır, halimi hatırımı sormadan çıkmazdı. Evde durumlar nasıl?"',
    kosul: { minGun: 1 },
    secenekler: [
      {
        id: 'riza_saygili',
        etiket: '"İdare ediyoruz Rıza Abi, babamın selamını unutmayız."',
        ipucu: 'Sıcak bağ kurar (+4 Moral, +1 Ev Yemeği)',
        sonucMetni:
          'Rıza Abi tezgahın altından bir poşet kuru çay uzattı: "Babanın oğlu yalnız kalmaz {gercekAd}, kapım açık."',
        etkiler: { moral: 4, buzdolabiStok: 1, bayrakEkle: 'riza_dost' },
      },
      {
        id: 'riza_dik',
        etiket: '"Kendi yükümü kendim taşıyorum Rıza Abi, kimseye borçlanmam."',
        ipucu: 'Gururunu korur (+15 Dayanıklılık ilerleme, +2 Moral)',
        sonucMetni:
          'Rıza başını sallayıp gülümsedi: "Aynı baban gibi diksin {gercekAd}. Yine de ucuz iş veya mal düşerse haber ederim."',
        etkiler: { moral: 2, statIlerleme: { dayaniklilik: 15 }, bayrakEkle: 'riza_bagimsiz' },
      },
    ],
  },
  {
    id: 'riza_2_sogutucu',
    komsuId: 'bakkal_riza',
    adim: 2,
    mekanlar: ['market'],
    baslik: 'Bozuk Soğutucu ve Ucuz Erzak',
    aciklama:
      'Rıza Abi arka depodan telaşla çıkıyor: "Sütlük dolabının motoru tekledi {gercekAd}, mallar bozulmadan eritmem lazım. Dışarıda 150 liraya alacağın ev erzağını sana maliyetine ayırdım, ya da kasaları taşımama yardım et."',
    kosul: { minGun: 3 },
    secenekler: [
      {
        id: 'riza_ucuz_erzak',
        etiket: 'Maliyetine 3 öğün ev erzağı al (-60 ₺)',
        ipucu: 'Normalin yarı fiyatına +3 Ev Yemeği stoğu',
        minParaGerekli: 60,
        sonucMetni:
          'Poşetleri sırtlandın. Rıza "Annen Emine’ye selam söyle {gercekAd}, bu hafta mutfak biraz rahatlar" dedi.',
        etkiler: { para: -60, buzdolabiStok: 3, moral: 5, sureDakika: 15, bayrakEkle: 'riza_erzak_aldi' },
      },
      {
        id: 'riza_kasa_yardim',
        etiket: 'Para yerine arka depodaki kasaları düzenle',
        ipucu: '40 dk · -12 EN → Ücretsiz +2 Ev Yemeği ve +15 Güç',
        minEnerjiGerekli: 12,
        sonucMetni:
          'Ağır içecek kasalarını buzluğa taşıdın. Rıza eline iki taze paket tutuşturdu: "Alın terinin hakkı {gercekAd}."',
        etkiler: {
          enerji: -12,
          sureDakika: 40,
          buzdolabiStok: 2,
          statIlerleme: { guc: 15 },
          moral: 3,
          bayrakEkle: 'riza_calisti',
        },
      },
    ],
  },
  {
    id: 'riza_3_toptanci',
    komsuId: 'bakkal_riza',
    adim: 3,
    mekanlar: ['market'],
    baslik: 'Toptancı Kamyonu Fırsatı',
    aciklama:
      'Rıza Abi seni kapıda yakalayıp fısıldıyor: "Sabah toptancı kamyonu şoförsüz değil ama hamalsız geldi {gercekAd}. Seni babanın hatırına önerdim; bir saatte malı indirirsen nakit paranı peşin alırsın."',
    kosul: { minGun: 6 },
    secenekler: [
      {
        id: 'riza_kamyon_indir',
        etiket: 'Kamyonu hemen boşalt (-22 EN · 60 dk)',
        ipucu: '+155 ₺ nakit + +20 Güç ilerleme',
        minEnerjiGerekli: 22,
        sonucMetni:
          'Ter içinde son koliyi indirdin. Şoför ücreti sayıp verdi; Rıza da "Bu çocuk işini yarım bırakmaz" diye övdü.',
        etkiler: {
          enerji: -22,
          sureDakika: 60,
          para: 155,
          statIlerleme: { guc: 20 },
          moral: 4,
          bayrakEkle: 'riza_tamam',
        },
      },
      {
        id: 'riza_sonraya_birak',
        etiket: 'Şu an enerjim yok, teşekkür edip geç',
        ipucu: 'Rıza ile dostluk sürer (+2 Moral)',
        sonucMetni:
          'Rıza "Canın sağ olsun {gercekAd}, önce kendi sağlığın. Başka fırsat çıkarsa yine söylerim" dedi.',
        etkiler: { moral: 2, bayrakEkle: 'riza_tamam' },
      },
    ],
  },

  // --- 2. NURİ ABİ (BABANIN ESKİ ARKADAŞI - 3 ADIM) ---
  {
    id: 'nuri_1_hatira',
    komsuId: 'nuri_usta',
    adim: 1,
    mekanlar: ['sokak_arena', 'ev'],
    baslik: 'Eski Dostun Gözü Üstünde',
    aciklama:
      'Babanın eski tamirhane arkadaşı Nuri Abi yolunu kesip omzuna dokunuyor: "Kerem... Sokak lambasının altında gölge boksu yaptığını gördüm. Rahmetli babanla az köşe başında sabahlamadık. Çocuklar sana {oyuncuAdi} diyormuş, doğru mu?"',
    kosul: { minGun: 2 },
    secenekler: [
      {
        id: 'nuri_dinle',
        etiket: '"Doğru Nuri Abi. Babam bu sokakta nasıl ayakta kalırdı?"',
        ipucu: 'Refleks +18%, +6 Moral ve Nuri güveni açılır',
        sonucMetni:
          'Nuri gülümseyip gözlerini kıstı: "Baban ilk vuranı değil, ikinci hamleyi okuyan ayakta kalır derdi {gercekAd}."',
        etkiler: { moral: 6, statIlerleme: { refleks: 18 }, bayrakEkle: 'nuri_yakin' },
      },
      {
        id: 'nuri_mesafeli',
        etiket: '"Mecburiyetten çıkıyorum Nuri Abi, evde kira bekliyor."',
        ipucu: 'Güç +15% ve kısa iş kapısı açar',
        sonucMetni:
          'Nuri başını salladı: "Anlıyorum {oyuncuAdi}. Yumruğun sert ama başını dik tut, kendini ezdirme."',
        etkiler: { statIlerleme: { guc: 15 }, bayrakEkle: 'nuri_mesafeli' },
      },
    ],
  },
  {
    id: 'nuri_2_ipucu',
    komsuId: 'nuri_usta',
    adim: 2,
    mekanlar: ['sokak_arena'],
    baslik: 'Arka Avludan Dövüş İpucu',
    aciklama:
      'Nuri Abi duvar dibinde çay içerken yanına çağırıyor: "Bu geceki dövüşçüleri izledim {oyuncuAdi}. Çetin solunu indirip nefes alıyor, Emir ise fazla hızlı zıplayıp staminasını yakıyor. İstersen yarım saat ayak oyunu bakalım, istersen sanayide ufak bir tamir işi var."',
    kosul: { minGun: 4 },
    secenekler: [
      {
        id: 'nuri_taktik_calis',
        etiket: 'Sokak taktiği çalış (-12 EN · 30 dk)',
        ipucu: '+25 Refleks, +25 Çeviklik ilerleme ve +5 Moral',
        minEnerjiGerekli: 12,
        sonucMetni:
          'Nuri el hareketleriyle rakibin omuz dönüşünü nasıl okuyacağını gösterdi. Ringe çok daha hazır hissediyorsun.',
        etkiler: {
          enerji: -12,
          sureDakika: 30,
          statIlerleme: { refleks: 25, ceviklik: 25 },
          moral: 5,
          bayrakEkle: 'nuri_taktik_aldi',
        },
      },
      {
        id: 'nuri_sanayi_isi',
        etiket: 'Tamirhanede parça taşıma işine git (-20 EN · 60 dk)',
        ipucu: '+135 ₺ nakit kazandırır',
        minEnerjiGerekli: 20,
        sonucMetni:
          'Sanayi sokağında ağır jant ve motor parçalarını dizdin. Kira bütçesi için temiz para çıktı.',
        etkiler: {
          enerji: -20,
          sureDakika: 60,
          para: 135,
          bayrakEkle: 'nuri_is_yapti',
        },
      },
    ],
  },
  {
    id: 'nuri_3_emanet',
    komsuId: 'nuri_usta',
    adim: 3,
    mekanlar: ['ev'],
    baslik: 'Babanın Eski Bandaj Kutusu',
    aciklama:
      'Akşam kapı çalınıyor; eşikte Nuri Abi duruyor. Elinde yıpranmış teneke bir kutu var: "Babanın gençliğinde sardığı bez bandajlar ve not defteri yıllardır dolabımdaydı Kerem. Artık gerçek sahibine, {oyuncuAdi}’ye geçme vakti."',
    kosul: { minGun: 7, gerekliBayrak: 'nuri_yakin' },
    secenekler: [
      {
        id: 'nuri_emanet_al',
        etiket: 'Kutuyu teslim al ve Nuri Abi ile dertleş (20 dk)',
        ipucu: '+1 Yetenek Puanı ve +10 Moral',
        sonucMetni:
          'Kutunun içindeki sargı tekniği notları elini güçlendirdi. Nuri "Yolun açık olsun Kerem" deyip merdivenden indi.',
        etkiler: {
          sureDakika: 20,
          yetenekPuani: 1,
          moral: 10,
          bayrakEkle: 'nuri_tamam',
        },
      },
    ],
  },
  {
    id: 'nuri_3_destek',
    komsuId: 'nuri_usta',
    adim: 3,
    mekanlar: ['ev'],
    baslik: 'Sessiz Kapı Ziyareti',
    aciklama:
      'Nuri Abi kapının önünden geçerken duraksıyor: "Fazla konuşmayı sevmezsin bilirim Kerem. Babanın hatırına şu ufak zarfı annen görmeden masaya bırak, bu ay kira sıkıysa nefes aldırır."',
    kosul: { minGun: 7, gerekliBayrak: 'nuri_mesafeli' },
    secenekler: [
      {
        id: 'nuri_zarf_al',
        etiket: 'Teşekkür edip desteği kabul et',
        ipucu: '+85 ₺ ve +4 Moral',
        sonucMetni:
          'Nuri elini sıkıp "Sadece ringde değil, evde de dik dur {oyuncuAdi}" dedi.',
        etkiler: { para: 85, moral: 4, bayrakEkle: 'nuri_tamam' },
      },
    ],
  },

  // --- 3. EV SAHİBİ KEMAL (SORUN ÇIKARAN - 4 ADIM) ---
  {
    id: 'kemal_1_yoklama',
    komsuId: 'ev_sahibi_kemal',
    adim: 1,
    mekanlar: ['ev'],
    baslik: 'Merdiven Başında Soğuk Yoklama',
    aciklama:
      'Ev sahibi Kemal elinde makbuz koçanıyla kapıya dayanmış: "Kerem, baban varken kira aksamazdı. Bu bodruma talip çok; ay sonunu ya da haftayı bahane etmeyin, gününde eksiksiz isterim."',
    kosul: { minGun: 2 },
    secenekler: [
      {
        id: 'kemal_alttan_al',
        etiket: '"Merak etme Kemal Bey, gününde elinde olacak."',
        ipucu: 'Ortamı yumuşatır (-2 Moral)',
        sonucMetni:
          'Kemal homurdanıp merdivene yöneldi: "Sözüne bakacağım Kerem, laf değil para konuşur."',
        etkiler: { moral: -2, bayrakEkle: 'kemal_sakin' },
      },
      {
        id: 'kemal_dik_dur',
        etiket: '"Kira günü gelmeden annemin kapısını çalma Kemal Bey."',
        ipucu: 'Sınır çizersin (+4 Moral, +15 Dayanıklılık), Kemal bilenir',
        sonucMetni:
          'Kemal gözlerini kısıp seni süzdü: "Delikanlılık yapıyorsun ama masraf çıkınca görürüm seni."',
        etkiler: { moral: 4, statIlerleme: { dayaniklilik: 15 }, bayrakEkle: 'kemal_gergin' },
      },
    ],
  },
  {
    id: 'kemal_2_tesisat',
    komsuId: 'ev_sahibi_kemal',
    adim: 2,
    mekanlar: ['ev'],
    baslik: 'Tesisat Masrafı ve Bahane',
    aciklama:
      'Kemal bodrum koridorundaki damlayan boruyu gösterip kapıyı çalıyor: "Alt tesisat su kaçırıyor Kerem. Ya usta parasını paylaşırsınız ya da kendi elinle tamir edersin; yoksa haftaya kiraya eklerim."',
    kosul: { minGun: 4 },
    secenekler: [
      {
        id: 'kemal_tamir_et',
        etiket: 'İngiliz anahtarını alıp boruyu kendin sık (-15 EN · 45 dk)',
        ipucu: 'Para çıkmaz, +20 Güç ilerleme kazandırır',
        minEnerjiGerekli: 15,
        sonucMetni:
          'Soğuk suyun altında paslı somunu sıktın, contayı yeniledin. Kemal söyleyecek söz bulamadan çekildi.',
        etkiler: {
          enerji: -15,
          sureDakika: 45,
          statIlerleme: { guc: 20 },
          moral: 2,
          bayrakEkle: 'kemal_tamir_yapti',
        },
      },
      {
        id: 'kemal_pay_ode',
        etiket: 'Tatsızlık çıkmasın diye payını öde (-110 ₺)',
        ipucu: 'Cebinden gider ama zaman ve enerji korunur',
        minParaGerekli: 110,
        sonucMetni:
          'Parayı avucuna saydın. Kemal cebine atıp ses çıkarmadan yukarı çıktı.',
        etkiler: { para: -110, moral: -3, bayrakEkle: 'kemal_odendi' },
      },
      {
        id: 'kemal_reddet',
        etiket: '"Bina tesisatı mal sahibinin işidir, ödemiyorum."',
        ipucu: 'Para ve enerji kalır ama Kemal iyice gerilir (-7 Moral)',
        sonucMetni:
          'Kemal "Bunun hesabını kira günü sorarım Kerem" deyip kapıyı sertçe çekti.',
        etkiler: { moral: -7, bayrakEkle: 'kemal_dusman' },
      },
    ],
  },
  {
    id: 'kemal_3_baski',
    komsuId: 'ev_sahibi_kemal',
    adim: 3,
    mekanlar: ['ev'],
    baslik: 'Kira Öncesi Sıkıştırma',
    aciklama:
      'Kemal merdivende yolunu kesiyor: "Yarın öbür gün kira günü Kerem. Hazır mısın, yoksa apartman kömürlüğündeki eski molozları taşıyıp kiradan biraz düşüreyim mi?"',
    kosul: { minGun: 6 },
    secenekler: [
      {
        id: 'kemal_moloz_tasi',
        etiket: 'Kömürlüğü temizleyip masraftan düş (-20 EN · 75 dk)',
        ipucu: '+115 ₺ kira desteği ve +15 Dayanıklılık',
        minEnerjiGerekli: 20,
        sonucMetni:
          'Toz toprak içinde moloz çuvallarını dışarı çıkardın. Kemal ister istemez makbuza 115 ₺ peşin düştü.',
        etkiler: {
          enerji: -20,
          sureDakika: 75,
          para: 115,
          statIlerleme: { dayaniklilik: 15 },
          bayrakEkle: 'kemal_moloz_yapti',
        },
      },
      {
        id: 'kemal_hazirim_de',
        etiket: '"Kira günü kapıya gel Kemal Bey, hesabımız tam olacak."',
        ipucu: 'Vakit kaybetmezsin, Kemal ile gerilim sürer (-1 Moral)',
        sonucMetni:
          'Kemal gözlerini kısıp defterine bir çizik attı: "Göreceğiz bakalım."',
        etkiler: { moral: -1, bayrakEkle: 'kemal_rest_cekti' },
      },
    ],
  },
  {
    id: 'kemal_4_nam',
    komsuId: 'ev_sahibi_kemal',
    adim: 4,
    mekanlar: ['ev'],
    baslik: 'Sokaktaki Nam Kapıya Ulaştı',
    aciklama:
      'Kemal ilk kez kapıda sesini yükseltmeden konuşuyor: "Kahvede duydum, sokak arenasında {oyuncuAdi} diye nam salmışsın. Bak Kerem, kimle dövüştüğün beni ilgilendirmez ama annenin dairesine bir daha ters bakmam."',
    kosul: { minGun: 9, minMacGalibiyet: 1 },
    secenekler: [
      {
        id: 'kemal_saygi_siniri',
        etiket: '"Kiran zamanında gelir, annem de huzurla oturur. Anlaştık."',
        ipucu: '+8 Moral ve kalıcı ev huzuru',
        sonucMetni:
          'Kemal ilk kez başıyla selam verip uzaklaştı. Merdivendeki gergin hava nihayet dağıldı.',
        etkiler: { moral: 8, bayrakEkle: 'kemal_tamam' },
      },
    ],
  },

  // --- 4. MAHALLE ÇOCUKLARI: YUSUF & TAYFA (3 ADIM) ---
  {
    id: 'cocuklar_1_izleme',
    komsuId: 'mahalle_cocuklari',
    adim: 1,
    mekanlar: ['sokak_arena'],
    baslik: 'Tebeşir Çizgisinin Kenarındaki Gözler',
    aciklama:
      'Sokak lambasının altında top oynayan Yusuf ve iki arkadaşı antrenmanını görünce koşa koşa yanına geliyor: "{oyuncuAdi} Abi! Geçen günkü yumruğu bir daha göstersene, biz de büyüyünce senin gibi dövüşeceğiz!"',
    kosul: { minGun: 1 },
    secenekler: [
      {
        id: 'cocuklar_goster',
        etiket: 'Onlara doğru gard duruşunu göster (-8 EN · 25 dk)',
        ipucu: '+8 Moral ve +18 Çeviklik ilerleme',
        minEnerjiGerekli: 8,
        sonucMetni:
          'Çocuklar ellerini çenesine çekip senin adımlarını taklit etti. Yusuf "En büyük {oyuncuAdi} Abi!" diye bağırarak koştu.',
        etkiler: {
          enerji: -8,
          sureDakika: 25,
          moral: 8,
          statIlerleme: { ceviklik: 18 },
          bayrakEkle: 'cocuklar_hayran',
        },
      },
      {
        id: 'cocuklar_kovala',
        etiket: '"Burası oyun yeri değil çocuklar, hava kararıyor eve gidin."',
        ipucu: 'Vakit kaybetmezsin ama mesafe kalır',
        sonucMetni:
          'Çocuklar topu koltuklarının altına alıp arka sokağa doğru uzaklaştı.',
        etkiler: { bayrakEkle: 'cocuklar_mesafeli' },
      },
    ],
  },
  {
    id: 'cocuklar_2_fisilti',
    komsuId: 'mahalle_cocuklari',
    adim: 2,
    mekanlar: ['sokak_arena'],
    baslik: 'Sokağın Küçük Gözcüleri',
    aciklama:
      'Yusuf nefes nefese yanına koşuyor: "{oyuncuAdi} Abi! İlerideki serseriler yeni rakiplerin kimlerin yanında çalıştığını konuşuyordu. Bizim top da patladı, simit parası ateşlersen ne duyduysak anlatayım!"',
    kosul: { minGun: 3 },
    secenekler: [
      {
        id: 'cocuklar_simit_al',
        etiket: 'Çocuklara simit ve top yaması ısmarla (-30 ₺)',
        ipucu: '+30 Refleks, +20 Çeviklik ve +8 Moral',
        minParaGerekli: 30,
        sonucMetni:
          'Çocuklar ağzı kulaklarında arenaya giren dövüşçülerin alışkanlıklarını tek tek anlattı. Kritik bir refleks avantajı kazandın.',
        etkiler: {
          para: -30,
          moral: 8,
          statIlerleme: { refleks: 30, ceviklik: 20 },
          bayrakEkle: 'cocuklar_gozcu',
        },
      },
      {
        id: 'cocuklar_gecistir',
        etiket: 'Şu an boş param yok, kısaca dinleyip gönder',
        ipucu: '+10 Refleks ilerleme',
        sonucMetni:
          'Yusuf iki cümle fısıldayıp sokak köşesine döndü; yine de fena bilgi değil.',
        etkiler: { statIlerleme: { refleks: 10 }, moral: 2 },
      },
    ],
  },
  {
    id: 'cocuklar_3_sorun',
    komsuId: 'mahalle_cocuklari',
    adim: 3,
    mekanlar: ['sokak_arena'],
    baslik: 'Arka Sokakta Kapanan Yol',
    aciklama:
      'Gece lambasının ötesinden bağırtılar geliyor! İki iri serseri Yusuf ve arkadaşlarının önünü kesmiş, cep harçlıklarını almaya çalışıyor. Çocuklar seni görünce "{oyuncuAdi} Abi yetiş!" diye sesleniyor.',
    kosul: { minGun: 5 },
    secenekler: [
      {
        id: 'cocuklar_koru',
        etiket: 'Araya girip serserileri sokaktan kovala (-15 EN · 30 dk)',
        ipucu: '+10 Moral, +22 Güç ilerleme ve kahvehane esnafından +80 ₺ teşekkür',
        minEnerjiGerekli: 15,
        sonucMetni:
          'Sert bir bakış ve iki savurma serserileri kaçırmaya yetti. Köşedeki çay ocağı sahibi "Helal olsun {oyuncuAdi}" deyip eline yemek harçlığı sıkıştırdı.',
        etkiler: {
          enerji: -15,
          sureDakika: 30,
          moral: 10,
          para: 80,
          statIlerleme: { guc: 22 },
          bayrakEkle: 'cocuklar_tamam',
        },
      },
      {
        id: 'cocuklar_uzaklastir',
        etiket: 'Dikkatlerini dağıtıp çocukları ara kapıdan eve kaçır (-8 EN)',
        ipucu: 'Kavgasız kurtuluş (+4 Moral)',
        minEnerjiGerekli: 8,
        sonucMetni:
          'Çocukları ara merdivenden güvenli sokağa geçirdin. Başları beladan kurtuldu.',
        etkiler: { enerji: -8, moral: 4, bayrakEkle: 'cocuklar_tamam' },
      },
    ],
  },

  // --- 5. KOMŞU ŞÜKRAN TEYZE (3 ADIM) ---
  {
    id: 'sukran_1_komsu',
    komsuId: 'komsu_sukran',
    adim: 1,
    mekanlar: ['ev', 'market'],
    baslik: 'Merdivende Sıcak Tarhana Tası',
    aciklama:
      'Alt kat komşusu Şükran Teyze elinde örtülü bir kaseyle seni yakalıyor: "Kerem evladım, annen Emine gözlerini yorup dikiş dikiyor, sen de gece gündüz koşturuyorsun. Baban rahmetli benim tüpümü hiç eksik etmezdi; şu sıcak çorbadan bir tas da sen al."',
    kosul: { minGun: 1 },
    secenekler: [
      {
        id: 'sukran_tesekkur',
        etiket: 'Ellerinden öpüp ev için bir kap al (15 dk)',
        ipucu: '+20 Tokluk, +10 Enerji, +5 Moral',
        sonucMetni:
          'Sıcak tarhana içini ısıttı. Şükran Teyze "İhtiyacınız olursa çekinmeyin Kerem" dedi.',
        etkiler: { sureDakika: 15, tokluk: 20, enerji: 10, moral: 5, bayrakEkle: 'sukran_dost' },
      },
    ],
  },
  {
    id: 'sukran_2_ucuz_yemek',
    komsuId: 'komsu_sukran',
    adim: 2,
    mekanlar: ['ev', 'market'],
    baslik: 'Börek Tepsisi ve Komşu Payı',
    aciklama:
      'Şükran Teyze kapıyı aralıyor: "Kerem oğlum, bugün fazla yemek ve kuru bakliyat yaptım. Market fiyatının çok altına iki büyük saklama kabı hazırladım, istersen hemen dolaba koy."',
    kosul: { minGun: 3 },
    secenekler: [
      {
        id: 'sukran_kap_al',
        etiket: 'Malzeme parası verip 2 ev öğünü al (-45 ₺)',
        ipucu: 'Çok ucuza +2 Ev Yemeği stoğu ve +4 Moral',
        minParaGerekli: 45,
        sonucMetni:
          'İki dolu kap ev yemeğini buzdolabına yerleştirdin; dışarıdan yemek masrafından büyük tasarruf ettin.',
        etkiler: { para: -45, buzdolabiStok: 2, moral: 4, bayrakEkle: 'sukran_erzak_aldi' },
      },
      {
        id: 'sukran_yardim_et',
        etiket: 'Pazar filelerini yukarı taşı (-10 EN · 25 dk)',
        ipucu: 'Para harcamadan +1 Ev Yemeği ve +12 Dayanıklılık',
        minEnerjiGerekli: 10,
        sonucMetni:
          'Üç kat ağır fileleri çıkardın. Şükran Teyze bir tabak sarmayı eline tutuşturdu.',
        etkiler: {
          enerji: -10,
          sureDakika: 25,
          buzdolabiStok: 1,
          statIlerleme: { dayaniklilik: 12 },
          moral: 4,
        },
      },
    ],
  },
  {
    id: 'sukran_3_terzi',
    komsuId: 'komsu_sukran',
    adim: 3,
    mekanlar: ['ev'],
    baslik: 'Dikiş Sandığı ve Teslimat İşi',
    aciklama:
      'Şükran Teyze ile annen Emine beraber mahalledeki bir butiğe perde ve örtü dikmiş: "Kerem, benim dizlerim tutmuyor; şu iki paketi karşı caddeye teslim edersen terzi emeğinizi hemen ödeyecekmiş."',
    kosul: { minGun: 6 },
    secenekler: [
      {
        id: 'sukran_teslimat',
        etiket: 'Paketleri caddeye teslim et (-14 EN · 45 dk)',
        ipucu: '+110 ₺ ve +6 Moral',
        minEnerjiGerekli: 14,
        sonucMetni:
          'Ağır kumaş balyalarını terziye yetiştirdin; Emine’nin de yüzü güldü, eve sıcak nakit girdi.',
        etkiler: {
          enerji: -14,
          sureDakika: 45,
          para: 110,
          moral: 6,
          bayrakEkle: 'sukran_tamam',
        },
      },
      {
        id: 'sukran_sonra',
        etiket: 'Şu an maç/iş koşuşturmam var, akşama kalsın',
        ipucu: 'Moral korunur',
        sonucMetni:
          'Şükran Teyze "Olur evladım, sen işine bak" deyip paketleri kenara koydu.',
        etkiler: { moral: 1, bayrakEkle: 'sukran_tamam' },
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 13. C3 Aşaması: İtibar Eşikleri (Saygı & Korku) ve Ahlaki Gri Seçimler
// Yeni ahlaki olay eklemek için AHLAKI_GRI_OLAYLAR listesine kayıt eklemek yeterlidir.
// ----------------------------------------------------------------------------
export interface ItibarEsigiTanimi {
  id: string;
  tur: 'saygi' | 'korku';
  esikDeger: number;
  baslik: string;
  aciklama: string;
}

export const ITIBAR_SABITLERI = {
  saygiEsik1: DENGE.verimVeEsikler.saygiEsik1,
  saygiEsik2: DENGE.verimVeEsikler.saygiEsik2,
  korkuEsik1: DENGE.verimVeEsikler.korkuEsik1,
  korkuEsik2: DENGE.verimVeEsikler.korkuEsik2,
  maksItibar: DENGE.verimVeEsikler.maksItibar,
};

export const ITIBAR_ESIKLERI: ItibarEsigiTanimi[] = [
  {
    id: 'saygi_1',
    tur: 'saygi',
    esikDeger: ITIBAR_SABITLERI.saygiEsik1,
    baslik: 'Tanınan Genç (Saygı 12+)',
    aciklama: 'Market alışverişinde %15 komşu indirimi ve Evde günlük Mahalle Dayanışması yardımı açılır.',
  },
  {
    id: 'saygi_2',
    tur: 'saygi',
    esikDeger: ITIBAR_SABITLERI.saygiEsik2,
    baslik: 'Mahallenin Güveni (Saygı 22+)',
    aciklama: 'Market indirimi %25 olur ve İş Yerinde güvenilir Esnaf Emanet Teslimatı teklifi açılır.',
  },
  {
    id: 'korku_1',
    tur: 'korku',
    esikDeger: ITIBAR_SABITLERI.korkuEsik1,
    baslik: 'Sert İsim (Korku 12+)',
    aciklama: 'Çaylak rakipler çekinir (-%12 Stam). Orta ve üst rakipler daha yüksek Korku ister.',
  },
  {
    id: 'korku_2',
    tur: 'korku',
    esikDeger: ITIBAR_SABITLERI.korkuEsik2,
    baslik: 'Karanlık Nam (Korku 22+)',
    aciklama: 'Çete Tahsilatı açılır. Çetin -%20, Emir (20+) -%10 siner; Serkan (30+) ve Halil (45+) dirençlidir.',
  },
];

export const AHLAKI_GRI_OLAYLAR: EvOlayi[] = [
  {
    id: 'ahlaki_haracci',
    baslik: 'Karanlık Köşedeki Teklif',
    aciklama:
      'Mahallenin tefecisi İbo’nun adamı seni köşeye çekip kalın bir zarf uzatıyor: "Eski kiracıların borcunu topluyoruz {oyuncuAdi}. Kapıda yanımızda dikilip gözdağı vereceksin; tek yumruk atmadan kira paranı çıkarırsın."',
    cikmaOlasiligi: 2.5,
    tekSeferlik: true,
    cikmaSarti: { minGun: 2 },
    kategori: 'ahlaki',
    secenekler: [
      {
        id: 'haracci_kabul',
        etiket: 'İşi kabul et ve borçlunun kapısına dikil',
        ipucu: 'Yüksek kolay para, evde huzursuzluk',
        minEnerjiGerekli: 18,
        sonucMetni:
          'Dükkan sahibi yüzüne bakınca kilidi açıp parayı çıkardı. Cebin doldu ama eve dönerken annenin şüpheli bakışından kaçtın.',
        etkiler: {
          enerji: -18,
          sureDakika: 60,
          para: 380,
          korku: 7,
          saygi: -5,
          moral: -8,
          aileIliskisi: -6,
        },
      },
      {
        id: 'haracci_araci',
        etiket: 'Zarfı alma, borçluya gizlice ek süre pazarlığı yap',
        ipucu: 'Orta yol; iki taraf da tam memnun olmaz',
        minEnerjiGerekli: 10,
        sonucMetni:
          'İki tarafın ortasını buldun. İbo’nun adamı homurdandı, esnaf da tam rahatlamadı ama kavgasız geçiştirdin.',
        etkiler: {
          enerji: -10,
          sureDakika: 40,
          para: 95,
          saygi: 2,
          korku: 2,
          moral: -4,
        },
      },
      {
        id: 'haracci_reddet',
        etiket: 'Zarfı geri itip mahalle esnafını uyar',
        ipucu: 'Kolay para kaçar, güven artar',
        minEnerjiGerekli: 8,
        sonucMetni:
          'Esnaf sana minnetle baktı ama tefecinin adamı soğukça gülüp gitti; kira yükü yine sadece omuzlarında.',
        etkiler: {
          enerji: -8,
          yorgunluk: 6,
          saygi: 6,
          korku: -3,
          moral: 4,
          aileIliskisi: 3,
        },
      },
    ],
  },
  {
    id: 'ahlaki_komsu_antrenman',
    baslik: 'Salona Giderken Merdivendeki Yük',
    aciklama:
      'Spor salonundaki çalışma saatine yetişmeye çalışırken, üst kattaki marangoz Salih Usta’nın kömür çuvalları ve ilaç kolileriyle merdivende tıkandığını görüyorsun.',
    cikmaOlasiligi: 2.5,
    tekSeferlik: true,
    cikmaSarti: { minGun: 3 },
    kategori: 'ahlaki',
    secenekler: [
      {
        id: 'komsu_yardim_antreman_kacir',
        etiket: 'Antrenmanı iptal et, Salih Usta’nın işini tamamen hallet',
        ipucu: 'İdman kaçar, mahalle bağı güçlenir',
        minEnerjiGerekli: 22,
        sonucMetni:
          'Kömürleri bodruma indirdin, ilaçları dizdin. Salih Usta eline zorla harçlık sıkıştırdı ama salon saati çoktan geçti.',
        etkiler: {
          enerji: -22,
          sureDakika: 60,
          para: 45,
          saygi: 6,
          moral: 5,
          aileIliskisi: 4,
          statIlerleme: { dayaniklilik: 10 },
        },
      },
      {
        id: 'komsu_yarim_yardim',
        etiket: 'Sadece en ağır koliyi kapıya bırakıp salona koş',
        ipucu: 'İdmana yetişirsin, yarı yardım',
        minEnerjiGerekli: 8,
        sonucMetni:
          'Ağır koliyi merdiven başına bırakıp koştun. İdmana yetiştin ama Salih Usta’nın yorgun bakışı aklında kaldı.',
        etkiler: {
          enerji: -8,
          sureDakika: 20,
          saygi: 2,
          moral: -2,
          statIlerleme: { ceviklik: 16 },
        },
      },
      {
        id: 'komsu_gormezden_gel',
        etiket: 'Görmemiş gibi kulaklığı takıp sert idmana yetiş',
        ipucu: 'Yüksek stat kazancı, apartmanda soğukluk',
        sonucMetni:
          'Salonda torbayı parçaladın ve hızlandın; ama apartmanda kimse yüzüne bakmak istemedi.',
        etkiler: {
          sureDakika: 45,
          statIlerleme: { guc: 28, ceviklik: 22 },
          korku: 3,
          saygi: -5,
          moral: -4,
        },
      },
    ],
  },
  {
    id: 'ahlaki_aile_risk',
    baslik: 'Emine’nin İlacı ve Elif’in Sınavı',
    aciklama:
      'Annen Emine’nin tansiyon ilacı bitmiş; aynı gün Elif’in deneme sınavı ücreti isteniyor. Eczacı veresiye yazmıyor ama arka sokaktaki kaçakçı gece bir koli taşırsan nakit veriyor.',
    cikmaOlasiligi: 2.5,
    tekSeferlik: true,
    cikmaSarti: { minGun: 4 },
    kategori: 'ahlaki',
    secenekler: [
      {
        id: 'aile_riskli_koli',
        etiket: 'Kaçakçının paketini gece arka kapıdan taşıyıp ikisini de öde',
        ipucu: 'Kirli iş ama acil nakit ve aile rahatı',
        minEnerjiGerekli: 24,
        sonucMetni:
          'Anne ilacını aldı, Elif de sınavına girdi. Ama arka sokakta seni karanlık işlerin adamıyla görenler oldu.',
        etkiler: {
          enerji: -24,
          yorgunluk: 16,
          sureDakika: 60,
          para: 270,
          aileIliskisi: 10,
          moral: 6,
          korku: 6,
          saygi: -5,
        },
      },
      {
        id: 'aile_kira_kesintisi',
        etiket: 'Riske girme, dispanser kuyruğunda bekle ve sınavı ertele',
        ipucu: 'Elif gezi/sınav fırsatını kaçırır',
        minEnerjiGerekli: 20,
        sonucMetni:
          'Yarım gün dispanser kuyruğunda bekleyip ilacı çözdün, ama Elif’in sınav/gezi payını ertelemek zorunda kaldın.',
        etkiler: {
          enerji: -20,
          sureDakika: 90,
          saygi: 3,
          moral: -8,
          aileIliskisi: -7,
        },
      },
      {
        id: 'aile_cebinden_ode',
        etiket: 'Kira bütçesinden kesip ilacı ve Elif’in ücretini öde',
        ipucu: 'Kira bütçesi erir, aile bağı güçlenir',
        minParaGerekli: 160,
        sonucMetni:
          'Evde yüzler güldü, Emine sessizce dua etti. Ama haftalık kira için çok daha fazla çalışman gerekecek.',
        etkiler: {
          para: -160,
          aileIliskisi: 12,
          moral: 8,
          saygi: 4,
        },
      },
    ],
  },
  {
    id: 'ahlaki_alaysi_ders',
    baslik: 'Kahvehane Önündeki Alaycı Kahkaha',
    aciklama:
      'Kahvenin önünden geçerken müteahhitin oğlu Tarık ve arkadaşları gülüyor: "Üniversiteyi bırakıp hamal olan {gercekAd}’e bakın! Bir de kendine {oyuncuAdi} dedirtiyormuş." Annenin dikiş işini de alaya alınca kan beynine sıçrıyor.',
    cikmaOlasiligi: 2.5,
    tekSeferlik: true,
    cikmaSarti: { minGun: 5 },
    kategori: 'ahlaki',
    secenekler: [
      {
        id: 'alaysi_sert_ders',
        etiket: 'Yakasına yapışıp kalabalığın ortasında yere ser',
        ipucu: 'Sokakta nam salar ama anneni üzer',
        minEnerjiGerekli: 14,
        sonucMetni:
          'Tek hamlede Tarık’ı yere oturtunca kahvede çıt çıkmadı. Korktular ama annene "oğlun sokakta kavga çıkarıyor" haberi gitti.',
        etkiler: {
          enerji: -14,
          sureDakika: 20,
          korku: 8,
          saygi: -5,
          moral: 5,
          aileIliskisi: -5,
          statIlerleme: { guc: 25 },
        },
      },
      {
        id: 'alaysi_sogukkanli_uyar',
        etiket: 'Gözünü kırpmadan yanına yürü ve elini kaldırmadan sustur',
        ipucu: 'Soğukkanlı duruş, öfke içine kalır',
        sonucMetni:
          'Yumruk atmadın ama duruşun kahveyi buz kesti. Tarık lafını yuttu, yaşlılar başını onaylar gibi salladı.',
        etkiler: {
          saygi: 6,
          korku: 2,
          moral: -2,
          statIlerleme: { refleks: 20 },
        },
      },
      {
        id: 'alaysi_arenaya_cagir',
        etiket: '"Cesaretin varsa gece sokak lambasının altına gel" deyip dön',
        ipucu: 'İki taraflı ün, huzursuzluk',
        sonucMetni:
          'Tarık gece gelmeye cesaret edemedi ama bütün sokak senin adını konuştu; iki taraf da seni tartıyor.',
        etkiler: {
          korku: 4,
          saygi: 3,
          moral: -3,
          statIlerleme: { ceviklik: 15 },
        },
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 14. Gelecek Aşamalar İçin Yer Tutucu Veri Listeleri & Canlı Denge Senkronizasyonu
// ----------------------------------------------------------------------------
export const GELECEK_ASAMA_YER_TUTUCULARI = {
  dCilaOgeleri: [] as Array<{ id: string; isim: string }>,
};

function verileriDengeyleSenkronizeEt(denge: DengeConfig): void {
  SAAT_SABITLERI.sabahBaslangicDakika = denge.zaman.sabahBaslangicDakika;
  SAAT_SABITLERI.geceGecEsikDakika = denge.zaman.geceGecEsikDakika;
  SAAT_SABITLERI.uyuyakalmaSiniriDakika = denge.zaman.uyuyakalmaSiniriDakika;
  SAAT_SABITLERI.uyuyakalmaSabahDakika = denge.zaman.uyuyakalmaSabahDakika;
  SAAT_SABITLERI.salonGunlukGirisUcreti = denge.antrenman.salonGunlukGirisUcreti;

  KARAKTER_SABITLERI.yas = denge.baslangic.yas;
  KARAKTER_SABITLERI.baslangicPara = denge.baslangic.para;
  KARAKTER_SABITLERI.baslangicEnerji = denge.baslangic.enerji;
  KARAKTER_SABITLERI.maksEnerji = denge.baslangic.maksEnerji;
  KARAKTER_SABITLERI.baslangicTokluk = denge.baslangic.tokluk;
  KARAKTER_SABITLERI.baslangicMoral = denge.baslangic.moral;
  KARAKTER_SABITLERI.baslangicYorgunluk = denge.baslangic.yorgunluk;
  KARAKTER_SABITLERI.baslangicBuzdolabi = denge.baslangic.buzdolabiStok;

  DOVUS_SABITLERI.macSureDakika = denge.dovus.macSureDakika;
  DOVUS_SABITLERI.macEnerjiMaliyeti = denge.dovus.macEnerjiMaliyeti;
  DOVUS_SABITLERI.macToklukMaliyeti = denge.dovus.macToklukMaliyeti;
  DOVUS_SABITLERI.macUykuKaybi = denge.dovus.macUykuKaybi;
  DOVUS_SABITLERI.maksMacSuresiMs = denge.dovus.maksMacSuresiMs;
  DOVUS_SABITLERI.koYavaslatmaMs = denge.dovus.koYavaslatmaMs;

  ITIBAR_SABITLERI.saygiEsik1 = denge.verimVeEsikler.saygiEsik1;
  ITIBAR_SABITLERI.saygiEsik2 = denge.verimVeEsikler.saygiEsik2;
  ITIBAR_SABITLERI.korkuEsik1 = denge.verimVeEsikler.korkuEsik1;
  ITIBAR_SABITLERI.korkuEsik2 = denge.verimVeEsikler.korkuEsik2;
  ITIBAR_SABITLERI.maksItibar = denge.verimVeEsikler.maksItibar;

  for (const m of MEKAN_TANIMLARI) {
    Object.assign(m, denge.mekanlar[m.id]);
  }
  for (const s of STAT_TANIMLARI) {
    Object.assign(s, denge.statlar[s.id]);
  }
  for (const y of YEMEK_LISTESI) {
    const kaynak = denge.yemekler[y.id as keyof typeof denge.yemekler];
    if (kaynak) Object.assign(y, kaynak);
  }
  for (const e of EV_ESYALARI_LISTESI) {
    const kaynak = denge.evEsyalari[e.id as keyof typeof denge.evEsyalari];
    if (kaynak) Object.assign(e, kaynak);
  }
  for (const ev of EV_SEVIYELERI) {
    const kaynak = denge.evler[ev.id as keyof typeof denge.evler];
    if (kaynak) Object.assign(ev, kaynak);
  }
  for (const is of EK_IS_TANIMLARI) {
    const kaynak = denge.isYerleri[is.id as keyof typeof denge.isYerleri];
    if (kaynak) Object.assign(is, kaynak);
  }
  for (const h of HAMLE_LISTESI) {
    const kaynak = denge.dovus.hamleler[h.id];
    if (kaynak) Object.assign(h, kaynak);
  }
  for (const r of RAKIP_LISTESI) {
    const kaynak = denge.dovus.rakipler[r.id];
    if (kaynak) {
      r.paraOdulu = kaynak.paraOdulu;
      r.itibarOdulu = kaynak.itibarOdulu;
      r.teselliPara = kaynak.teselliPara;
      r.cekinmeEsik1 = kaynak.cekinmeEsik1;
      r.cekinmeYuzde1 = kaynak.cekinmeYuzde1;
      r.cekinmeEsik2 = kaynak.cekinmeEsik2;
      r.cekinmeYuzde2 = kaynak.cekinmeYuzde2;
      r.statlar = { ...kaynak.statlar };
    }
  }
  for (const d of ANTRENOR_DERSLERI) {
    const kaynak = denge.hocaDersleri[d.id];
    if (kaynak) Object.assign(d, kaynak);
  }
}

dengeAboneOl(verileriDengeyleSenkronizeEt);
