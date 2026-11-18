import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _efektAyarOnbellegiSifirla,
  EFEKT_AYARLARI_ANAHTARI,
  efektKatmaniniAyir,
  efektKatmaniniBagla,
  efektSeviyesi,
  flas,
  getEfektAyarlari,
  hasarSayisi,
  hitStop,
  hitStopAktifMi,
  parcacik,
  sarsinti,
  subscribeEfektAyarlari,
} from './effects';

function sahteElemanOlustur() {
  let transformDegeri = '';
  let opacityDegeri = '';
  let transformYazmaSayisi = 0;

  const el = {
    style: {
      cssText: '',
      width: '',
      height: '',
      background: '',
      color: '',
      fontSize: '',
      get transform() {
        return transformDegeri;
      },
      set transform(v: string) {
        transformDegeri = v;
        transformYazmaSayisi += 1;
      },
      get opacity() {
        return opacityDegeri;
      },
      set opacity(v: string) {
        opacityDegeri = v;
      },
    },
    dataset: {} as Record<string, string>,
    textContent: '',
    clientWidth: 640,
    clientHeight: 280,
    children: [] as unknown[],
    setAttribute() {},
    appendChild(child: unknown) {
      this.children.push(child);
      return child;
    },
    remove() {},
    get transformYazmaSayisi() {
      return transformYazmaSayisi;
    },
    sayaciSifirla() {
      transformYazmaSayisi = 0;
    },
  };
  return el;
}

test('prefers-reduced-motion algılanınca tüm efekt kategorileri otomatik 0 olur ve elle açılabilir', () => {
  const depo = new Map<string, string>();
  const oncekiWindow = (globalThis as { window?: unknown }).window;
  const oncekiDocument = (globalThis as { document?: unknown }).document;
  const oncekiRaf = (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
  const oncekiCancelRaf = (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;

  let domCreateSayisi = 0;
  let rafCagrildi = false;

  (globalThis as { window: unknown }).window = {
    innerWidth: 1280,
    matchMedia: (q: string) => ({
      matches: q.includes('prefers-reduced-motion: reduce'),
      addEventListener() {},
    }),
    localStorage: {
      getItem: (k: string) => depo.get(k) ?? null,
      setItem: (k: string, v: string) => {
        depo.set(k, v);
      },
    },
  };

  (globalThis as { document: unknown }).document = {
    createElement: () => {
      domCreateSayisi += 1;
      return sahteElemanOlustur();
    },
  };

  (globalThis as { requestAnimationFrame: unknown }).requestAnimationFrame = () => {
    rafCagrildi = true;
    return 1;
  };
  (globalThis as { cancelAnimationFrame: unknown }).cancelAnimationFrame = () => {};

  try {
    // 1. prefers-reduced-motion: reduce ilk okumada 4 kategoriyi de 0 yapar
    const ilkAyarlar = getEfektAyarlari();
    assert.deepEqual(ilkAyarlar, {
      sarsinti: 0,
      flas: 0,
      parcacik: 0,
      hitStop: 0,
    });
    assert.ok(depo.has(EFEKT_AYARLARI_ANAHTARI));

    // Sahneyi bağla (havuz bir kez oluşturulur)
    const sahne = sahteElemanOlustur();
    const sarsintiHedef = sahteElemanOlustur();
    efektKatmaniniBagla(
      sahne as unknown as HTMLElement,
      sarsintiHedef as unknown as HTMLElement
    );
    const havuzSonrasiCreate = domCreateSayisi;

    // 2. efektSeviyesi('sarsinti') === 0 iken sarsinti() hiçbir DOM değişikliği yapmaz
    sarsintiHedef.sayaciSifirla();
    rafCagrildi = false;
    sarsinti(6);
    assert.equal(sarsintiHedef.transformYazmaSayisi, 0);
    assert.equal(domCreateSayisi, havuzSonrasiCreate);
    assert.equal(rafCagrildi, false);

    // 3. Kullanıcı elle efekt seviyesini açabilir ve sarsinti() çalışır
    assert.equal(efektSeviyesi('sarsinti', 100), 100);
    rafCagrildi = false;
    sarsinti(6);
    assert.equal(rafCagrildi, true);

    // Tekrar 0'a çekilince eski transform temizlenir ve yeni sarsinti() DOM'a dokunmaz
    assert.equal(efektSeviyesi('sarsinti', 0), 0);
    sarsintiHedef.sayaciSifirla();
    rafCagrildi = false;
    sarsinti(4);
    assert.equal(sarsintiHedef.transformYazmaSayisi, 0);
    assert.equal(rafCagrildi, false);

    // 4. Hit-stop 150ms sınırı ve 0 ayarında devre dışı kalması
    efektSeviyesi('hitStop', 100);
    hitStop(500);
    assert.equal(hitStopAktifMi(), true);
    efektSeviyesi('hitStop', 0);
    assert.equal(hitStopAktifMi(), false);

    // 5. Flaş WCAG saniyede max 3 sınırı ve hasar/parçacık havuzunun yeni DOM elemanı üretmemesi
    efektSeviyesi('flas', 100);
    efektSeviyesi('parcacik', 100);
    flas(0.8, 100);
    flas(0.2, 100);
    flas(0.2, 100);
    flas(0.2, 100); // 4. flaş aynı saniyede engellenir

    hasarSayisi(200, 100, 28, 'agir');
    parcacik(200, 100, { adet: 12 });
    assert.equal(
      domCreateSayisi,
      havuzSonrasiCreate,
      'Hasar sayıları ve parçacıklar havuzdan gelmeli, yeni DOM elemanı yaratmamalı'
    );

    let sonBildirilenParcacik = -1;
    const aboneliktenCik = subscribeEfektAyarlari((ayar) => {
      sonBildirilenParcacik = ayar.parcacik;
    });
    efektSeviyesi('parcacik', 45);
    assert.equal(sonBildirilenParcacik, 45);
    efektSeviyesi('parcacik', 0);
    assert.equal(sonBildirilenParcacik, 0);
    aboneliktenCik();

    efektKatmaniniAyir();
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
    if (oncekiRaf === undefined) {
      delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    } else {
      (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = oncekiRaf;
    }
    if (oncekiCancelRaf === undefined) {
      delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
    } else {
      (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = oncekiCancelRaf;
    }
    _efektAyarOnbellegiSifirla();
  }
});

test('önceki oturumda kaydedilen tam efektler, OS reduced-motion açılınca ilk yüklemede sıfırlanır ve elle açılan ayar korunur', () => {
  const oncekiWindow = (globalThis as { window?: unknown }).window;
  const depo = new Map<string, string>([
    [
      EFEKT_AYARLARI_ANAHTARI,
      JSON.stringify({ sarsinti: 100, flas: 80, parcacik: 90, hitStop: 100 }),
    ],
  ]);

  (globalThis as { window: unknown }).window = {
    innerWidth: 1280,
    matchMedia: (q: string) => ({
      matches: q.includes('prefers-reduced-motion: reduce)'),
      addEventListener() {},
    }),
    localStorage: {
      getItem: (k: string) => depo.get(k) ?? null,
      setItem: (k: string, v: string) => {
        depo.set(k, v);
      },
    },
  };

  try {
    _efektAyarOnbellegiSifirla();
    assert.deepEqual(getEfektAyarlari(), {
      sarsinti: 0,
      flas: 0,
      parcacik: 0,
      hitStop: 0,
    });

    // Kullanıcı reduced-motion açıkken elle bir kategoriyi açarsa sonraki yüklemede korunmalı
    efektSeviyesi('sarsinti', 75);
    _efektAyarOnbellegiSifirla();
    assert.equal(getEfektAyarlari().sarsinti, 75);
  } finally {
    _efektAyarOnbellegiSifirla();
    if (oncekiWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = oncekiWindow;
    }
  }
});
