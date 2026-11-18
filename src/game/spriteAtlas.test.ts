import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hariciSpriteKaresiAl,
  hedefEkranOlcegiHesapla,
  spriteCizimDikdortgeniHesapla,
} from './spriteAtlas';

test('Kerem east pilot atlas lookup resolves idle frames and falls back cleanly on missing poses', () => {
  const idle0 = hariciSpriteKaresiAl('kerem', 'idle', 0);
  const idle1 = hariciSpriteKaresiAl('kerem', 'idle', 1);
  const idleWrap = hariciSpriteKaresiAl('kerem', 'idle', 2);

  assert.ok(idle0);
  assert.ok(idle1);
  assert.equal(idle0.yol, '/assets/sprites/kerem/east/idle_0.png');
  assert.equal(idle1.yol, '/assets/sprites/kerem/east/idle_1.png');
  assert.equal(idleWrap?.yol, idle0.yol);

  const hit = hariciSpriteKaresiAl('kerem', 'hit', 0);
  assert.ok(hit);

  // Henüz PNG üretilmeyen aksiyonlar ve diğer karakterler null döner
  assert.equal(hariciSpriteKaresiAl('kerem', 'kick', 0), null);
  assert.equal(hariciSpriteKaresiAl('kerem', 'ko', 0), null);
  assert.equal(hariciSpriteKaresiAl('sisko_cetin', 'idle', 0), null);
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
