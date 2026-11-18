import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSesAyarlari,
  getVolume,
  initAudio,
  mute,
  playMusic,
  playSfx,
  SES_AYARLARI_ANAHTARI,
  SES_TERCIH_ANAHTARI,
  sesKilidiBekliyorMu,
  SFX_LISTESI,
  setVolume,
  stopMusic,
} from './sound';

test('playSfx bilinmeyen kimlik verildiğinde hata fırlatmaz', () => {
  assert.doesNotThrow(() => {
    playSfx('bilinmeyen_ses_kimligi');
    playSfx('');
    playSfx('gong', { volume: 0.5, pitchCarpani: 1.1 });
  });
});

test('setVolume değeri 0-1 aralığına clamp eder', () => {
  assert.equal(setVolume('master', 1.8), 1);
  assert.equal(getVolume('master'), 1);

  assert.equal(setVolume('sfx', -0.4), 0);
  assert.equal(getVolume('sfx'), 0);

  assert.equal(setVolume('muzik', 0.65), 0.65);
  assert.equal(getVolume('muzik'), 0.65);

  assert.equal(setVolume('sfx', Number.NaN), 0);
  assert.equal(setVolume('sfx', 1), 1);
});

test('SFX_LISTESI 17 veri odaklı sesi içerir ve süre sınırlarına uyar', () => {
  assert.equal(SFX_LISTESI.length, 17);
  const idler = new Set<string>(SFX_LISTESI.map((s) => s.id));

  const beklenenIdler = [
    'gong',
    'yumruk',
    'tekme',
    'sert_vurus',
    'blok',
    'kacinma',
    'mukemmel',
    'kombo',
    'nakavt',
    'mac_kazanma',
    'mac_kaybetme',
    'para_kazanma',
    'kira_uyarisi',
    'gun_sonu',
    'yetenek_ac',
    'mekan_gecis',
    'menu_tik',
  ];

  for (const id of beklenenIdler) {
    assert.ok(idler.has(id), `${id} SFX_LISTESI içinde olmalı`);
  }
  assert.equal(idler.has('sert_yumruk'), false);
  assert.equal(idler.has('tik'), false);

  const uzunSesler = new Set(['gong', 'nakavt', 'mac_kazanma', 'mac_kaybetme']);
  for (const sfx of SFX_LISTESI) {
    const maksBitis = Math.max(
      sfx.sure + (sfx.gecikme ?? 0),
      ...(sfx.katmanlar ?? []).map((k) => k.sure + (k.gecikme ?? 0))
    );
    const limit = uzunSesler.has(sfx.id) ? 0.8 : 0.305;
    assert.ok(
      maksBitis <= limit,
      `${sfx.id} toplam süresi (${maksBitis}s) ${limit}s sınırını aşmamalı`
    );
  }

  assert.doesNotThrow(() => {
    initAudio();
    playMusic('sakin');
    stopMusic(200);
    mute('sfx', true);
    mute('sfx', false);
  });
});

test('Web Audio mock ile limiter, devralma, 30ms debounce ve max-4 polifoni doğrulanır', async () => {
  const depo = new Map<string, string>([[SES_TERCIH_ANAHTARI, '0']]);
  let stopSayisi = 0;
  let oscSayisi = 0;
  const compressorParametreleri: Array<{ threshold: number; ratio: number }> = [];

  const param = (baslangic = 0) => ({
    value: baslangic,
    setValueAtTime(v: number) {
      this.value = v;
    },
    linearRampToValueAtTime(v: number) {
      this.value = v;
    },
    exponentialRampToValueAtTime(v: number) {
      this.value = v;
    },
    setTargetAtTime(v: number) {
      this.value = v;
    },
    cancelScheduledValues() {},
  });

  class MockOfflineAudioContext {
    sampleRate: number;
    length: number;
    destination = {};
    constructor(_ch: number, len: number, sr: number) {
      this.length = len;
      this.sampleRate = sr;
    }
    createGain() {
      return { gain: param(1), connect() {} };
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: param(440),
        connect() {},
        start() {},
        stop() {},
      };
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: param(500), connect() {} };
    }
    createBuffer(_ch: number, len: number, sr: number) {
      return {
        sampleRate: sr,
        length: len,
        numberOfChannels: 1,
        getChannelData: () => new Float32Array(len),
      };
    }
    createBufferSource() {
      return { buffer: null, connect() {}, start() {}, stop() {} };
    }
    async startRendering() {
      return this.createBuffer(1, this.length, this.sampleRate);
    }
  }

  let loopBaslatildi = false;
  const crossfadeHedefleri: number[] = [];
  let suspendSayisi = 0;
  let resumeSayisi = 0;
  let closeSayisi = 0;
  let etkilesimAlindi = false;

  const windowDinleyiciler = new Map<string, Set<() => void>>();
  const docDinleyiciler = new Map<string, Set<() => void>>();

  class MockAudioContext {
    currentTime = 1.0;
    sampleRate = 44100;
    state: 'suspended' | 'running' | 'closed' = 'suspended';
    destination = {};
    resume() {
      resumeSayisi += 1;
      if (etkilesimAlindi) {
        this.state = 'running';
        return Promise.resolve();
      }
      return Promise.reject(new Error('gesture required'));
    }
    suspend() {
      suspendSayisi += 1;
      this.state = 'suspended';
      return Promise.resolve();
    }
    close() {
      closeSayisi += 1;
      this.state = 'closed';
      return Promise.resolve();
    }
    createGain() {
      return {
        gain: {
          ...param(1),
          linearRampToValueAtTime(v: number, when: number) {
            this.value = v;
            crossfadeHedefleri.push(Number((when - 1.0).toFixed(2)));
          },
        },
        connect() {},
      };
    }
    createDynamicsCompressor() {
      const comp = {
        threshold: param(0),
        knee: param(0),
        ratio: param(1),
        attack: param(0),
        release: param(0),
        connect() {
          compressorParametreleri.push({
            threshold: comp.threshold.value,
            ratio: comp.ratio.value,
          });
        },
      };
      return comp;
    }
    createBiquadFilter() {
      return { type: 'lowpass', frequency: param(500), connect() {} };
    }
    createBuffer(_ch: number, len: number) {
      return {
        sampleRate: 44100,
        length: len,
        numberOfChannels: 1,
        getChannelData: () => new Float32Array(len),
      };
    }
    createBufferSource() {
      const src = {
        buffer: null,
        loop: false,
        connect() {},
        start() {
          if (src.loop) loopBaslatildi = true;
        },
        stop() {
          stopSayisi += 1;
        },
      };
      return src;
    }
    createOscillator() {
      oscSayisi += 1;
      return {
        type: 'sine',
        frequency: param(440),
        connect() {},
        start() {},
        stop() {
          stopSayisi += 1;
        },
      };
    }
  }

  const oncekiWindow = (globalThis as { window?: unknown }).window;
  const oncekiDocument = (globalThis as { document?: unknown }).document;
  const mockDoc = {
    visibilityState: 'visible' as 'visible' | 'hidden',
    addEventListener: (tur: string, fn: () => void) => {
      if (!docDinleyiciler.has(tur)) docDinleyiciler.set(tur, new Set());
      docDinleyiciler.get(tur)?.add(fn);
    },
    removeEventListener: (tur: string, fn: () => void) => {
      docDinleyiciler.get(tur)?.delete(fn);
    },
  };
  (globalThis as { document: unknown }).document = mockDoc;
  (globalThis as { window: unknown }).window = {
    AudioContext: MockAudioContext,
    OfflineAudioContext: MockOfflineAudioContext,
    addEventListener: (tur: string, fn: () => void) => {
      if (!windowDinleyiciler.has(tur)) windowDinleyiciler.set(tur, new Set());
      windowDinleyiciler.get(tur)?.add(fn);
    },
    removeEventListener: (tur: string, fn: () => void) => {
      windowDinleyiciler.get(tur)?.delete(fn);
    },
    localStorage: {
      getItem: (k: string) => depo.get(k) ?? null,
      setItem: (k: string, v: string) => {
        depo.set(k, v);
      },
    },
  };

  try {
    // 1. Eski karanlik_sokak_ses_acik='0' değeri otomatik devralınır
    const devralinan = getSesAyarlari();
    assert.equal(devralinan.masterMute, true);
    assert.ok(depo.has(SES_AYARLARI_ANAHTARI));

    // Ses açılır ve tercih güncellenir
    mute('master', false);
    setVolume('sfx', 0.8);
    const kaydedilen = JSON.parse(depo.get(SES_AYARLARI_ANAHTARI) ?? '{}');
    assert.equal(kaydedilen.masterMute, false);
    assert.equal(kaydedilen.sfx, 0.8);

    // 2. Limiter threshold=-3 ve ratio=20 ile bağlanır, ilk jest öncesi kilit bekler
    const ctx = initAudio() as unknown as MockAudioContext;
    assert.equal(compressorParametreleri.length, 1);
    assert.equal(compressorParametreleri[0].threshold, -3);
    assert.equal(compressorParametreleri[0].ratio, 20);
    assert.equal(sesKilidiBekliyorMu(), true, 'İlk kullanıcı jesti öncesi ses kilidi aktif olmalı');

    // İlk pointerdown jestiyle AudioContext.resume() açılır
    etkilesimAlindi = true;
    for (const fn of windowDinleyiciler.get('pointerdown') ?? []) {
      fn();
    }
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(ctx.state, 'running');
    assert.equal(sesKilidiBekliyorMu(), false, 'İlk jest sonrası ses kilidi kalkmalı');

    // 3. Aynı SFX 30ms içinde tekrar tetiklenirse yoksayılır
    const oncekiOsc = oscSayisi;
    playSfx('menu_tik');
    playSfx('menu_tik');
    assert.equal(oscSayisi - oncekiOsc, 1);

    // 4. 5 farklı SFX tetiklenince en eski aktif SFX durdurulur (max 4 polifoni)
    const oncekiStop = stopSayisi;
    playSfx('gong');
    playSfx('nakavt');
    playSfx('mac_kazanma');
    playSfx('mac_kaybetme');
    const durdurmaOncesi = stopSayisi - oncekiStop;
    playSfx('yetenek_ac');
    const durdurmaSonrasi = stopSayisi - oncekiStop;
    assert.ok(
      durdurmaSonrasi > durdurmaOncesi,
      '5. eşzamanlı SFX en eski SFX katmanlarını kesmeli'
    );
    // 5. OfflineAudioContext ile 3 ruh hali müziği ve 1.5sn crossfade
    playMusic('sakin');
    await new Promise((r) => setTimeout(r, 15));
    assert.equal(loopBaslatildi, true, 'Müzik loop=true AudioBufferSourceNode ile başlamalı');

    playMusic('enerjik');
    await new Promise((r) => setTimeout(r, 15));
    assert.ok(
      crossfadeHedefleri.includes(1.5),
      'Ruh hali değişiminde 1.5 sn crossfade uygulanmalı'
    );

    playMusic('gergin');
    await new Promise((r) => setTimeout(r, 15));

    // 6. Sekme gizlenince fade-out + suspend(), görünür olunca resume() + fade-in
    mockDoc.visibilityState = 'hidden';
    for (const fn of docDinleyiciler.get('visibilitychange') ?? []) {
      fn();
    }
    await new Promise((r) => setTimeout(r, 160));
    assert.equal(suspendSayisi, 1, 'Sekme gizlenince suspend() çağrılmalı');
    assert.equal(ctx.state, 'suspended');

    const resumeOncesi = resumeSayisi;
    mockDoc.visibilityState = 'visible';
    for (const fn of docDinleyiciler.get('visibilitychange') ?? []) {
      fn();
    }
    await new Promise((r) => setTimeout(r, 15));
    assert.equal(resumeSayisi, resumeOncesi + 1, 'Sekme görünür olunca resume() çağrılmalı');
    assert.equal(ctx.state, 'running');

    stopMusic(500);

    // 7. beforeunload olayı AudioContext'i temiz kapatır
    for (const fn of windowDinleyiciler.get('beforeunload') ?? []) {
      fn();
    }
    assert.equal(closeSayisi, 1, 'beforeunload ile AudioContext.close() çağrılmalı');
    assert.equal(ctx.state, 'closed');
  } finally {
    if (oncekiWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = oncekiWindow;
    }
    if (oncekiDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = oncekiDocument;
    }
  }
});
