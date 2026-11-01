import test from 'node:test';
import assert from 'node:assert/strict';
import { creatureMotion } from '../src/game/creature-motion.js';
import { recordEnemyPosition, interpolateEnemy } from '../src/game/enemy-interpolation.js';
import { shape, jointLimb } from '../src/game/creature-primitives.js';

function walking(hz) {
  const e = { x: 0, y: 0, spd: 80, type: 'inveja', stun: 0 };
  creatureMotion(e, 0); let motion;
  for (let i = 1; i <= hz; i++) { e.x = i * 80 / hz; motion = creatureMotion(e, i / hz); }
  return { e, motion };
}
test('passada acompanha distância e funciona a 30, 60 e 120 quadros por segundo', () => {
  const states = [30, 60, 120].map(hz => walking(hz).motion);
  for (const m of states) {
    assert.ok(m.move > .98); assert.ok(m.lookX > .98);
    assert.ok(Math.abs(m.left.swing + m.right.swing) < 1e-9);
    assert.ok(Math.abs(m.cycle - states[0].cycle) < 1e-9);
  }
});
test('parar desacelera a pose; voltar à câmera e teleportar não causam passadas falsas', () => {
  const { e, motion } = walking(60);
  let stopped;
  for (let i = 1; i <= 60; i++) stopped = creatureMotion(e, 1 + i / 60);
  assert.ok(stopped.move < .001); assert.equal(stopped.cycle, motion.cycle);
  e.x += 1000; const jump = creatureMotion(e, 2.016);
  assert.equal(jump.move, 0); assert.equal(jump.cycle, stopped.cycle);
  e.x += 150; const returned = creatureMotion(e, 8);
  assert.equal(returned.move, 0);
});
test('preparo, golpe e reação são suaves e não alteram estado do combate', () => {
  const e = { x: 10, y: 20, hp: 80, r: 15, atk: 40, telegraph: .4, artAttack: 0, stun: 0 };
  creatureMotion(e, 0);
  for (let i = 1; i <= 20; i++) creatureMotion(e, i / 60);
  const prep = creatureMotion(e, .35); assert.ok(prep.attack > .95);
  e.telegraph = 0; e.artAttack++; e.flash = .12;
  const before = structuredClone(e), hit = creatureMotion(e, .37);
  assert.equal(hit.strike, 1); assert.equal(hit.hit, 1); assert.deepEqual(e, before);
  let recovered;
  for (let i = 1; i <= 30; i++) recovered = creatureMotion(e, .37 + i / 60);
  assert.ok(recovered.strike < .001 && recovered.attack < .001);
});
test('atordoamento para a passada; mudança de direção não vira instantaneamente', () => {
  const { e, motion } = walking(60); e.stun = 1; e.x += 10;
  const stunned = creatureMotion(e, 1.016);
  assert.equal(stunned.cycle, motion.cycle);
  e.stun = 0; e.x -= 2; const turn = creatureMotion(e, 1.032);
  assert.ok(turn.lookX > 0 && turn.lookX < motion.lookX);
});
test('poses remotas usam campos visuais e preservam os temporizadores do chefe', () => {
  const e = { x: 0, y: 0, act: null, step: 0, stepT: 3, artRemote: true, artAct: 'pisao', artStep: 1 };
  creatureMotion(e, 0);
  let m;
  for (let i = 1; i < 20; i++) m = creatureMotion(e, i / 60);
  assert.ok(m.attack > .95); assert.equal(e.act, null); assert.equal(e.stepT, 3);
});
test('posições recebidas mantêm velocidade uniforme entre pacotes, sem extrapolar', () => {
  const e = { x: 0, y: 0, spd: 100 }; recordEnemyPosition(e, 0, 0, 0);
  const positions = [];
  for (let frame = 1; frame <= 72; frame++) {
    const t = frame / 60;
    if (frame % 9 === 0) recordEnemyPosition(e, t * 100, 0, t);
    interpolateEnemy(e, t);
    if (frame >= 18) positions.push(e.x);
  }
  for (let i = 1; i < positions.length; i++) assert.ok(Math.abs(positions[i] - positions[i-1] - 100 / 60) < 1e-6);
  interpolateEnemy(e, 5); assert.equal(e.x, 120); interpolateEnemy(e, 8); assert.equal(e.x, 120);
});
test('teleporte e retorno de conexão reposicionam sem deslizar pelo mapa', () => {
  const e = { x: 0, y: 0, spd: 100, d: { ai: 'blink' } };
  recordEnemyPosition(e, 0, 0, 0); recordEnemyPosition(e, 65, 0, .15);
  assert.equal(e.x, 65); interpolateEnemy(e, .16); assert.equal(e.x, 65);
  recordEnemyPosition(e, 400, 200, 5); assert.equal(e.x, 400); assert.equal(e.y, 200);
});
test('traços animados não expulsam paths estáticos nem são construídos duas vezes por membro', () => {
  const previous = globalThis.Path2D, seen = new Map();
  globalThis.Path2D = class { constructor(d) { seen.set(d, (seen.get(d) || 0) + 1); } };
  const g = { fill() {}, stroke() {} }, fixed = 'M0 0L2 2Z';
  try {
    shape(g, fixed, '#fff');
    for (let i = 0; i < 1000; i++) jointLimb(g, `M0 0Q${i} 1 4 5`, '#123', 3, false);
    shape(g, fixed, '#fff');
    assert.equal(seen.get(fixed), 1); assert.equal([...seen.values()].reduce((a,b) => a+b, 0), 1001);
  } finally { globalThis.Path2D = previous; }
});
