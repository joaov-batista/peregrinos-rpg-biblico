import test from 'node:test';
import assert from 'node:assert/strict';
import { separateEnemies, inView } from '../src/game/spatial.js';
const move = (e, x, y) => { e.x += x; e.y += y; };

test('colisões entre células, coordenadas negativas e chefes mantêm separação', () => {
  for (const x of [-65, -1, 63, 127]) {
    const a = { x, y: 0, r: 12 }, b = { x: x + 10, y: 0, r: 12 };
    separateEnemies([a, b], move); assert.equal(b.x - a.x, 24);
  }
  const boss = { x: 0, y: 0, r: 90, kind: 'boss' }, mob = { x: 95, y: 0, r: 12 };
  separateEnemies([boss, mob], move); assert.equal(boss.x, 0); assert.ok(mob.x > 95);
  mob.submerged = true; const before = mob.x;
  separateEnemies([boss, mob], move); assert.equal(mob.x, before);
});
test('mil inimigos espalhados não geram meio milhão de testes por quadro', () => {
  const enemies = Array.from({ length: 1000 }, (_, i) => ({ x: (i % 40) * 90, y: Math.floor(i / 40) * 90, r: 12 }));
  const checks = separateEnemies(enemies, move);
  assert.ok(checks < 5000, String(checks));
  console.log(`Colisões: ${1000 * 999 / 2} pares na varredura anterior → ${checks} candidatos na grade.`);
});
test('culling deixa margem para sprites e chefes grandes sem desenhar o mundo inteiro', () => {
  assert.equal(inView({ x: -100, y: 100, r: 12 }, 0, 0, 800, 600), true);
  assert.equal(inView({ x: -240, y: 100, r: 100 }, 0, 0, 800, 600), true);
  assert.equal(inView({ x: 2000, y: 100, r: 12 }, 0, 0, 800, 600), false);
});

import { canvasDpr } from '../src/game/resolution.js';
test('celular usa densidade nativa; desktop mantém resolução; limite evita canvas excessivo', () => {
  assert.equal(canvasDpr(844, 390, 3, true), 3);
  assert.equal(canvasDpr(915, 412, 2.625, true), 2.625);
  assert.equal(canvasDpr(1280, 900, 3, false), 2);
  assert.equal(canvasDpr(844, 390, 3, true, false), 2);
  const dpr = canvasDpr(3000, 2000, 4, true);
  assert.ok(3000 * 2000 * dpr * dpr <= 8_000_001);
});
