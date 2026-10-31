import test from 'node:test';
import assert from 'node:assert/strict';
import { bossDamage, strikeShell } from '../src/game/combatRules.js';
import { BOSSES } from '../src/data/bestiary.js';
import { QUESTS, MISSION_PATH } from '../src/data/npcs.js';
import { xpNeed } from '../src/game/player.js';
import { CHALLENGE_MOVES } from '../src/game/bossChallenges.js';

test('Leviatã rejeita ataques comuns, inclusive armas normais de lança', () => {
  const boss = { id: 'leviata', kind: 'boss', max: 10800 };
  for (const marker of [null, undefined, 'lanca', 'melee']) assert.equal(bossDamage(boss, 999999, marker), 0);
  assert.equal(bossDamage(boss, 1, 'spear'), 292);
  assert.equal(bossDamage(boss, 999999, 'reflect'), 194);
});
test('equipamento não permite apagar um chefe em poucos golpes', () => {
  assert.equal(bossDamage({ kind: 'boss', max: 10000 }, 99999), 250);
  assert.equal(bossDamage({ kind: 'enemy' }, 80), 80);
});
test('carcaça exige oito impactos pesados e só quebra por uma janela', () => {
  const b = { id: 'behemote' };
  for (let i = 0; i < 100; i++) strikeShell(b, 9);
  assert.equal(b.shellHits, undefined);
  for (let i = 0; i < 7; i++) assert.equal(strikeShell(b, 30), false);
  assert.equal(strikeShell(b, 30), true);
  assert.equal(b.shellOpen, 6);
  strikeShell(b, 30); assert.equal(b.shellHits, 0);
  b.shellOpen = 0; strikeShell(b, 30); assert.equal(b.shellHits, 1);
});
test('missões têm trilha acíclica, recomendações crescentes e recompensas secretas', () => {
  let prev = null, level = 0;
  for (const [id, lv] of MISSION_PATH) { assert.ok(QUESTS[id]); assert.equal(QUESTS[id].requer, prev); assert.ok(lv > level); prev = id; level = lv; }
  assert.equal(QUESTS.q_ecos.qtd, 3); assert.equal(QUESTS.q_lampada.qtd, 5);
  assert.ok(xpNeed(1) > 40); assert.ok(xpNeed(10) > 40 * 10 ** 1.55);
});
test('sono avisa antes de atingir, limita a cinco invocações e não dá XP', () => {
  const b = { nid: 'boss', hp: 100, step: 0, atk: 20, x: 0, y: 0 };
  const hits = [], G = { p: { x: 0, y: 0 }, enemies: [], tele: [], addText() {}, damagePlayer(...a) { hits.push(a); }, cur: { map: { collides: () => false } }, makeEnemy(type, x, y) { return { type, x, y, hp: 10, r: 10 }; } };
  CHALLENGE_MOVES.sono(G, b, { n: 5 }, 0, { p: G.p });
  assert.equal(hits.length, 0); assert.equal(G.tele[0].t, 1.2);
  G.tele[0].onEnd(); assert.equal(hits.length, 1); assert.equal(G.enemies.length, 5);
  G.tele[0].onEnd(); assert.equal(G.enemies.length, 5);
  assert.ok(G.enemies.every(e => e.xp === 0 && e.ouro === 0));
});
test('prisão expira e deixa abertura; terremoto emenda chifrada', () => {
  const b = { step: 0, hp: 100, atk: 50, x: 0, y: 0 }, G = { p: { x: 0, y: 0 }, tele: [], hazards: [], addText() {}, endAct(b) { b.act = null; } };
  CHALLENGE_MOVES.barreira(G, b, {}, 0, { p: G.p }); G.tele[0].onEnd();
  assert.equal(G.hazards.length, 10); assert.ok(G.hazards.every(h => h.solid && h.t === 6));
  b.stepT = 2; CHALLENGE_MOVES.barreira(G, b, {}, 0, { p: G.p }); assert.equal(b.nextAct, 'terremoto');
  CHALLENGE_MOVES.terremoto(G, b, {}, 0, { p: G.p }); assert.equal(b.nextAct, 'investida');
});
test('respawn curto e três estocadas desde a primeira fase', () => {
  assert.equal(BOSSES.leviata.respawn, 60); assert.equal(BOSSES.behemote.respawn, 75);
  assert.equal(BOSSES.golias.golpes.lanca.repete, 2);
});
