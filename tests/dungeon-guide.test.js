import test from 'node:test';
import assert from 'node:assert/strict';
import { dungeonBossGuide, canLockEnemy } from '../src/game/dungeon-guide.js';
const boss = (id, x, clone = false) => ({ id, x, y: 0, clone, r: 20, hp: 100, kind: 'boss', d: { nome: id } });
test('chefes das dungeons não recebem seta; Mentira sem ilusões também não', () => {
  for (const id of ['mamom','procrastinacao','imoralidade','satanas','mentira']) assert.equal(dungeonBossGuide({ enemies: [boss(id, 0)] }), null);
});
test('seta escolhe somente ilusão viva e acompanha troca de posição imediatamente', () => {
  const real = boss('mentira', 0), fake = boss('mentira', 100, true), other = boss('mentira', 200, true);
  const game = { enemies: [real, fake, other] }, guide = dungeonBossGuide(game);
  assert.equal(game.falseGuideTarget, fake); assert.equal(guide.x, 100);
  [real.x, fake.x] = [fake.x, real.x];
  assert.equal(guide.x, 0); assert.notEqual(guide.x, real.x);
  assert.equal(dungeonBossGuide(game).x, fake.x);
  fake.hp = 0; assert.equal(dungeonBossGuide(game).x, other.x);
  game.enemies = [real]; assert.equal(dungeonBossGuide(game), null);
});
test('ilusões sobrepostas à verdadeira não recebem marcador e o retículo nunca escolhe a real', () => {
  const real = boss('mentira', 0), fake = boss('mentira', 5, true);
  const game = { enemies: [real, fake] };
  assert.equal(dungeonBossGuide(game), null);
  fake.x = 100; assert.ok(dungeonBossGuide(game));
  real.hp = 0; assert.equal(dungeonBossGuide(game), null);
  assert.equal(canLockEnemy(real), false); assert.equal(canLockEnemy(fake), true);
  assert.equal(canLockEnemy(boss('mamom', 0)), true);
});
