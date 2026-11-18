import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { HAMLE_LISTESI } from '../data/gameData';
import {
  aksiyonAileYedegi,
  aksiyonAnimasyonTanimiAl,
  HAMLE_SPRITE_AKSIYON_HARITASI,
  hamleSpriteAksiyonuBul,
  hariciSpriteKaresiAl,
  hariciYedekKareAl,
  hedefEkranOlcegiHesapla,
  karakterHariciAtlasiVarMi,
  SpriteAksiyonId,
  spriteCizimDikdortgeniHesapla,
  spriteSheetKareleriOlustur,
} from './spriteAtlas';

test('Kerem east atlas resolves all 19 animation actions and returns null for un-authored characters', () => {
  const idle0 = hariciSpriteKaresiAl('kerem', 'idle', 0);
  const idle1 = hariciSpriteKaresiAl('kerem', 'idle', 1);
  const idleWrap = hariciSpriteKaresiAl('kerem', 'idle', 2);

  assert.ok(idle0);
  assert.ok(idle1);
  assert.equal(idle0.yol, '/assets/sprites/kerem/east/idle_0.png');
  assert.equal(idle1.yol, '/assets/sprites/kerem/east/idle_1.png');
  assert.equal(idleWrap?.yol, idle0.yol);

  assert.equal(hariciSpriteKaresiAl('kerem', 'walk', 3)?.yol, '/assets/sprites/kerem/east/walk_3.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'punch', 1)?.yol, '/assets/sprites/kerem/east/punch_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'punch_uppercut', 1)?.yol, '/assets/sprites/kerem/east/punch_uppercut_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'kick', 1)?.yol, '/assets/sprites/kerem/east/kick_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'kick_spin', 1)?.yol, '/assets/sprites/kerem/east/kick_spin_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'block', 0)?.yol, '/assets/sprites/kerem/east/block_0.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'block_steel', 1)?.yol, '/assets/sprites/kerem/east/block_steel_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'dodge', 1)?.yol, '/assets/sprites/kerem/east/dodge_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'dodge_phantom', 1)?.yol, '/assets/sprites/kerem/east/dodge_phantom_1.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'hit', 0)?.yol, '/assets/sprites/kerem/east/hit_0.png');
  assert.equal(hariciSpriteKaresiAl('kerem', 'ko', 2)?.yol, '/assets/sprites/kerem/east/ko_2.png');

  // Henüz harici atlası olmayan karakterler null döner
  assert.equal(hariciSpriteKaresiAl('sisko_cetin', 'idle', 0), null);
});

test('hariciYedekKareAl confirms dedicated pose frames and existing PNG files across all 19 Kerem actions', () => {
  assert.equal(karakterHariciAtlasiVarMi('kerem'), true);
  assert.equal(karakterHariciAtlasiVarMi('sisko_cetin'), false);

  const keremAksiyonlar: SpriteAksiyonId[] = [
    'idle',
    'walk',
    'punch',
    'punch_heavy',
    'punch_hook',
    'punch_uppercut',
    'punch_body',
    'punch_counter',
    'kick',
    'kick_low',
    'kick_knee',
    'kick_spin',
    'block',
    'block_steel',
    'dodge',
    'dodge_duck',
    'dodge_phantom',
    'hit',
    'ko',
  ];

  for (const aksiyon of keremAksiyonlar) {
    const tanim = aksiyonAnimasyonTanimiAl('kerem', aksiyon);
    assert.ok(tanim, `kerem ${aksiyon} tanımı mevcut olmalı`);
    for (let i = 0; i < tanim.kareler.length; i += 1) {
      const sonuc = hariciYedekKareAl('kerem', aksiyon, i);
      assert.ok(sonuc, `kerem ${aksiyon}[${i}] harici PNG karesi dönmeli`);
      assert.equal(sonuc.hamPozMevcut, true);
      const dosyaYolu = path.join(process.cwd(), 'public', sonuc.kare.yol.replace(/^\//, ''));
      assert.equal(fs.existsSync(dosyaYolu), true, `Sprite dosyası bulunamadı: ${dosyaYolu}`);
    }
  }

  assert.equal(hariciYedekKareAl('sisko_cetin', 'idle', 0), null);
});

test('hamleSpriteAksiyonuBul maps all 15 HAMLE_LISTESI moves to distinct sprite animations', () => {
  const eslesenAksiyonlar = new Set<SpriteAksiyonId>();
  for (const hamle of HAMLE_LISTESI) {
    assert.ok(HAMLE_SPRITE_AKSIYON_HARITASI[hamle.id], `${hamle.id} atlas haritasında olmalı`);
    const dovusAksiyon =
      hamle.tur === 'tekme'
        ? 'tekme'
        : hamle.tur === 'yumruk'
          ? 'yumruk'
          : (hamle.staminaToparlanma ?? 0) > 0
            ? 'blok'
            : 'kacinma';
    const cozulen = hamleSpriteAksiyonuBul(hamle.id, dovusAksiyon, 100);
    eslesenAksiyonlar.add(cozulen);
  }
  assert.equal(eslesenAksiyonlar.size, HAMLE_LISTESI.length);

  assert.equal(hamleSpriteAksiyonuBul('cene_aparkati', 'yumruk', 0), 'ko');
  assert.equal(hamleSpriteAksiyonuBul('cene_aparkati', 'darbe_aldi', 50), 'hit');
  assert.equal(hamleSpriteAksiyonuBul(null, 'yumruk', 50), 'punch');
  assert.equal(hamleSpriteAksiyonuBul(null, 'idle', 50), 'idle');

  assert.equal(aksiyonAileYedegi('punch_uppercut'), 'punch');
  assert.equal(aksiyonAileYedegi('kick_spin'), 'kick');
  assert.equal(aksiyonAileYedegi('block_steel'), 'block');
  assert.equal(aksiyonAileYedegi('dodge_phantom'), 'dodge');
});

test('hedefEkranOlcegiHesapla preserves integer square pixels and respects HUD max height cap', () => {
  assert.equal(hedefEkranOlcegiHesapla(198, 44), 5);
  assert.equal(hedefEkranOlcegiHesapla(176, 44), 4);
  assert.equal(hedefEkranOlcegiHesapla(90, 44), 2);
  assert.equal(hedefEkranOlcegiHesapla(18, 44), 1);

  // HUD tavanına sığdırmak için ölçek aşağı çekilir
  assert.equal(hedefEkranOlcegiHesapla(210, 44, 180), 4);
});

test('spriteCizimDikdortgeniHesapla plants feet onto zeminEkranY using altBosluk and centers horizontally', () => {
  const kare = hariciSpriteKaresiAl('kerem', 'idle', 0)!;
  const rect = spriteCizimDikdortgeniHesapla({
    merkezEkranX: 300,
    zeminEkranY: 270,
    kare,
    ekranOlcegi: 4,
  });

  // 48 * 4 = 192; centerX = 24 * 4 = 96 -> drawX = 300 - 96 = 204
  assert.equal(rect.drawW, 192);
  assert.equal(rect.drawH, 192);
  assert.equal(rect.drawX, 204);

  // Feet row is at (48 - 2) * 4 = 184px from top of frame -> drawY = 270 - 184 = 86
  assert.equal(rect.drawY, 86);
  assert.equal(rect.drawY + (kare.yukseklik - kare.altBosluk) * 4, 270);
});

test('spriteSheetKareleriOlustur slices horizontal sprite sheet frames cleanly', () => {
  const kareler = spriteSheetKareleriOlustur({
    idOnEki: 'kerem_punch',
    yol: '/assets/sprites/kerem/east/punch_sheet.png',
    kareGenislik: 48,
    kareYukseklik: 48,
    kareSayisi: 3,
    icerikYuksekligi: 44,
    altBosluk: 2,
    merkezX: 24,
    satirIndex: 1,
  });

  assert.equal(kareler.length, 3);
  assert.deepEqual(
    kareler.map((k) => ({
      id: k.id,
      kaynakX: k.kaynakX,
      kaynakY: k.kaynakY,
      kaynakGenislik: k.kaynakGenislik,
      kaynakYukseklik: k.kaynakYukseklik,
    })),
    [
      { id: 'kerem_punch_0', kaynakX: 0, kaynakY: 48, kaynakGenislik: 48, kaynakYukseklik: 48 },
      { id: 'kerem_punch_1', kaynakX: 48, kaynakY: 48, kaynakGenislik: 48, kaynakYukseklik: 48 },
      { id: 'kerem_punch_2', kaynakX: 96, kaynakY: 48, kaynakGenislik: 48, kaynakYukseklik: 48 },
    ]
  );
});

test('aksiyonAnimasyonTanimiAl returns normalized playback mode and FPS', () => {
  const idleTanim = aksiyonAnimasyonTanimiAl('kerem', 'idle');
  assert.ok(idleTanim);
  assert.equal(idleTanim.oynatmaModu, 'loop');
  assert.equal(idleTanim.fps, 2.4);
  assert.equal(idleTanim.kareler.length, 2);

  const hitTanim = aksiyonAnimasyonTanimiAl('kerem', 'hit');
  assert.ok(hitTanim);
  assert.equal(hitTanim.oynatmaModu, 'progress');
  assert.equal(hitTanim.fps, 8);

  assert.equal(aksiyonAnimasyonTanimiAl('bilinmeyen', 'idle'), null);
});

