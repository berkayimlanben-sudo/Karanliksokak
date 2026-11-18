import test from 'node:test';
import assert from 'node:assert/strict';
import {
  animasyonKareIndexSec,
  karakterKareCozumle,
  karakterPozHesapla,
} from './characterAnimator';

test('animasyonKareIndexSec supports loop, progress, and hold playback modes', () => {
  // loop mode wraps continuously based on elapsed time and FPS
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'loop',
      fps: 2,
      kareSayisi: 3,
      gecenSureSn: 0.1,
      ilerlemeOrani: 0,
    }),
    0
  );
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'loop',
      fps: 2,
      kareSayisi: 3,
      gecenSureSn: 0.55,
      ilerlemeOrani: 0,
    }),
    1
  );
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'loop',
      fps: 2,
      kareSayisi: 3,
      gecenSureSn: 1.55,
      ilerlemeOrani: 0,
    }),
    0
  );

  // progress mode maps normalized [0..1] progress across frames and clamps safely
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'progress',
      fps: 10,
      kareSayisi: 3,
      gecenSureSn: 99,
      ilerlemeOrani: 0,
    }),
    0
  );
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'progress',
      fps: 10,
      kareSayisi: 3,
      gecenSureSn: 99,
      ilerlemeOrani: 0.5,
    }),
    1
  );
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'progress',
      fps: 10,
      kareSayisi: 3,
      gecenSureSn: 99,
      ilerlemeOrani: 1.4,
    }),
    2
  );

  // hold mode stops at the final frame
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'hold',
      fps: 8,
      kareSayisi: 4,
      gecenSureSn: 0,
      ilerlemeOrani: 1,
    }),
    3
  );
  assert.equal(
    animasyonKareIndexSec({
      oynatmaModu: 'loop',
      fps: 8,
      kareSayisi: 1,
      gecenSureSn: 5,
      ilerlemeOrani: 0.5,
    }),
    0
  );
});

test('karakterKareCozumle resolves Kerem 8-action frames with progress/hold/loop and respects reducedMotion', () => {
  const idleFrame1 = karakterKareCozumle({
    karakterId: 'kerem',
    aksiyon: 'idle',
    gecenSureSn: 0.5,
  });
  assert.equal(idleFrame1.atlasVar, true);
  assert.equal(idleFrame1.hamPozMevcut, true);
  assert.equal(idleFrame1.oynatmaModu, 'loop');
  assert.equal(idleFrame1.kareIndex, 1);
  assert.equal(idleFrame1.kare?.id, 'kerem_east_idle_1');

  const idleReduced = karakterKareCozumle({
    karakterId: 'kerem',
    aksiyon: 'idle',
    gecenSureSn: 0.5,
    reducedMotion: true,
  });
  assert.equal(idleReduced.kareIndex, 0);
  assert.equal(idleReduced.kare?.id, 'kerem_east_idle_0');

  // Punch progresses windup -> active extension -> follow-through
  const punchActive = karakterKareCozumle({
    karakterId: 'kerem',
    aksiyon: 'punch',
    gecenSureSn: 0,
    ilerlemeOrani: 0.45,
  });
  assert.equal(punchActive.atlasVar, true);
  assert.equal(punchActive.hamPozMevcut, true);
  assert.equal(punchActive.oynatmaModu, 'progress');
  assert.equal(punchActive.kare?.id, 'kerem_east_punch_1');

  // KO progresses through ko_0 -> ko_1 -> ko_2 and holds on final lying pose
  const koFinal = karakterKareCozumle({
    karakterId: 'kerem',
    aksiyon: 'ko',
    gecenSureSn: 0,
    ilerlemeOrani: 1,
  });
  assert.equal(koFinal.hamPozMevcut, true);
  assert.equal(koFinal.oynatmaModu, 'hold');
  assert.equal(koFinal.kare?.id, 'kerem_east_ko_2');

  // Characters without an external atlas return atlasVar = false
  const enemy = karakterKareCozumle({
    karakterId: 'sisko_cetin',
    aksiyon: 'idle',
    gecenSureSn: 0.4,
  });
  assert.equal(enemy.atlasVar, false);
  assert.equal(enemy.kare, null);
});

test('karakterPozHesapla mirrors directional offsets, skips -90deg flip on dedicated KO frames, and softens tilt', () => {
  const punchActiveRight = karakterPozHesapla({
    aksiyon: 'punch',
    ilerlemeOrani: 0.45,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    tersCevir: false,
    hamPozMevcut: false,
  });
  assert.equal(punchActiveRight.aktifSaldiriIzi, 'punch');
  assert.ok(punchActiveRight.ekstraOfsetX > 0);
  assert.ok(punchActiveRight.egimRadyan > 0);

  const punchActiveLeft = karakterPozHesapla({
    aksiyon: 'punch',
    ilerlemeOrani: 0.45,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    tersCevir: true,
    hamPozMevcut: false,
  });
  assert.equal(punchActiveLeft.ekstraOfsetX, -punchActiveRight.ekstraOfsetX);
  assert.equal(punchActiveLeft.egimRadyan, -punchActiveRight.egimRadyan);

  // When dedicated pose PNG exists, artificial tilt is softened to 25%
  const punchWithPose = karakterPozHesapla({
    aksiyon: 'punch',
    ilerlemeOrani: 0.45,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    tersCevir: false,
    hamPozMevcut: true,
  });
  assert.ok(Math.abs(punchWithPose.egimRadyan) < Math.abs(punchActiveRight.egimRadyan));
  assert.equal(punchWithPose.ekstraOfsetX, punchActiveRight.ekstraOfsetX);

  const dodge = karakterPozHesapla({
    aksiyon: 'dodge',
    ilerlemeOrani: 0.5,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(dodge.hayaletIziGoster, true);

  // Fallback KO rotates -90deg; dedicated KO sprite does not rotate again
  const koFallback = karakterPozHesapla({
    aksiyon: 'ko',
    ilerlemeOrani: 1,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: false,
    reducedMotion: true,
  });
  assert.equal(koFallback.egimRadyan, -Math.PI / 2);
  assert.ok(koFallback.golgeGenislikCarpan > 2);

  const koDedicated = karakterPozHesapla({
    aksiyon: 'ko',
    ilerlemeOrani: 1,
    gecenSureSn: 1,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
    reducedMotion: true,
  });
  assert.equal(koDedicated.egimRadyan, 0);
  assert.ok(koDedicated.golgeGenislikCarpan > 2);
});

test('karakterPozHesapla and karakterKareCozumle distinguish skill-tree and trainer move animations', () => {
  const uppercutKare = karakterKareCozumle({
    karakterId: 'kerem',
    aksiyon: 'punch_uppercut',
    gecenSureSn: 0,
    ilerlemeOrani: 0.45,
  });
  assert.equal(uppercutKare.hamPozMevcut, true);
  assert.equal(uppercutKare.kare?.id, 'kerem_east_punch_uppercut_1');

  const uppercutPoz = karakterPozHesapla({
    aksiyon: 'punch_uppercut',
    ilerlemeOrani: 0.45,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(uppercutPoz.aktifSaldiriIzi, 'punch_uppercut');
  assert.ok(uppercutPoz.ekstraOfsetY < 0, 'Aparkat yukarı fırlamalı');

  const bodyPoz = karakterPozHesapla({
    aksiyon: 'punch_body',
    ilerlemeOrani: 0.45,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(bodyPoz.aktifSaldiriIzi, 'punch_body');
  assert.ok(bodyPoz.ekstraOfsetY > 0, 'Vücut kroşesi alçak kaburga seviyesine inmeli');

  const spinPoz = karakterPozHesapla({
    aksiyon: 'kick_spin',
    ilerlemeOrani: 0.5,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(spinPoz.aktifSaldiriIzi, 'kick_spin');
  assert.ok(spinPoz.ekstraOfsetY < -5);

  const lowKickPoz = karakterPozHesapla({
    aksiyon: 'kick_low',
    ilerlemeOrani: 0.5,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(lowKickPoz.aktifSaldiriIzi, 'kick_low');
  assert.ok(lowKickPoz.ekstraOfsetY > 0);

  const phantomPoz = karakterPozHesapla({
    aksiyon: 'dodge_phantom',
    ilerlemeOrani: 0.5,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.equal(phantomPoz.hayaletIziGoster, true);
  assert.equal(phantomPoz.hayaletIziSayisi, 2);
  assert.equal(phantomPoz.hayaletIziPhantom, true);
  assert.ok(phantomPoz.ekstraOfsetX < -20);

  const duckPoz = karakterPozHesapla({
    aksiyon: 'dodge_duck',
    ilerlemeOrani: 0.5,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.ok(duckPoz.ekstraOfsetY > 10, 'Eğilme aşağı çökmeli');

  const steelBlockPoz = karakterPozHesapla({
    aksiyon: 'block_steel',
    ilerlemeOrani: 0.5,
    gecenSureSn: 0,
    olcekX: 2,
    olcekY: 2,
    ekranOlcegi: 4,
    hamPozMevcut: true,
  });
  assert.ok(steelBlockPoz.golgeGenislikCarpan > 1);
});
