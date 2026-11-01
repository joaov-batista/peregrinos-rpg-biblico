import test from 'node:test';
import assert from 'node:assert/strict';
import { OfflineSaves } from '../src/offline.js';

const copy = x => structuredClone(x);
function setup() {
  const values = new Map();
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  const saves = new OfflineSaves(storage);
  let cloud = { id: 'hero', name: 'Teste', level: 2, score: 100, data: { gold: 200, inventory: ['espada'], quests: {} }, updated_at: '2026-10-31T10:00:00.123456+00:00' };
  let writes = 0;
  const transport = {
    read: async () => copy(cloud),
    write: async (id, c, base, next) => {
      if (!cloud || cloud.updated_at !== base) return null;
      assert.ok(c.score - cloud.score <= 20000);
      cloud = { ...copy(c), updated_at: next.replace('Z', '+00:00') }; writes++;
      return copy(cloud);
    }
  };
  const char = saves.remember('account-a', cloud);
  return { saves, storage, values, char, transport, get cloud() { return cloud; }, set cloud(v) { cloud = v; }, get writes() { return writes; } };
}

test('offline salva inventário, missões e moedas; reabrir e sincronizar não duplica recompensas', async () => {
  const f = setup();
  f.char.data.gold = 75; f.char.data.inventory.push('papagaio'); f.char.data.quests.q1 = { st: 'feita' }; f.char.score = 200;
  f.saves.stage('account-a', f.char);
  f.char.data.gold = 999; // o snapshot não compartilha referências com o jogo
  const reopened = new OfflineSaves(f.storage);
  assert.equal(reopened.list('account-a')[0].data.gold, 75);
  await reopened.sync('account-a', f.transport); await reopened.sync('account-a', f.transport);
  assert.equal(f.cloud.data.gold, 75); assert.equal(f.writes, 1);
  assert.equal(f.cloud.data.quests.q1.st, 'feita');
  assert.deepEqual(reopened.status('account-a'), { pending: 0, conflicts: 0 });
});
test('falha na rede mantém o progresso e nova tentativa envia depois', async () => {
  const f = setup(); f.char.score = 300; f.saves.stage('account-a', f.char);
  await assert.rejects(f.saves.sync('account-a', { read: async () => { throw Error('offline'); } }));
  assert.equal(f.saves.status('account-a').pending, 1);
  await f.saves.sync('account-a', f.transport); assert.equal(f.cloud.score, 300);
});
test('resposta perdida depois do commit é reconhecida mesmo após reiniciar', async () => {
  const f = setup(); f.char.score = 400; f.saves.stage('account-a', f.char);
  await assert.rejects(f.saves.sync('account-a', { ...f.transport, write: async (...args) => {
    await f.transport.write(...args); throw Error('resposta perdida');
  } }));
  await new OfflineSaves(f.storage).sync('account-a', f.transport);
  assert.equal(f.writes, 1); assert.equal(f.saves.status('account-a').conflicts, 0);
});
test('salvar novamente durante o envio não perde o novo snapshot', async () => {
  const f = setup(); f.char.data.gold = 100; f.saves.stage('account-a', f.char);
  let first = true;
  await f.saves.sync('account-a', { ...f.transport, write: async (...args) => {
    if (first) { first = false; f.char.data.gold = 25; f.saves.stage('account-a', f.char); }
    return f.transport.write(...args);
  } });
  assert.equal(f.cloud.data.gold, 25); assert.equal(f.writes, 2);
});
test('conflito preserva versões completas e exige escolha; nunca soma dinheiro', async () => {
  const f = setup(); f.char.data.gold = 80; f.saves.stage('account-a', f.char);
  f.cloud.data.gold = 130; f.cloud.updated_at = '2026-10-31T11:00:00Z';
  await f.saves.sync('account-a', f.transport);
  assert.equal(f.writes, 0); assert.equal(f.saves.conflict('account-a', 'hero').remote.data.gold, 130);
  assert.equal(f.saves.list('account-a')[0].data.gold, 80);
  f.saves.resolve('account-a', 'hero', 'local'); await f.saves.sync('account-a', f.transport);
  assert.equal(f.cloud.data.gold, 80); assert.ok([...f.values.keys()].some(k => k.includes('.backup.')));
});
test('escolher nuvem preserva backup local; exclusão remota não ressuscita personagem', async () => {
  const f = setup(); f.saves.stage('account-a', f.char); f.cloud = null;
  await f.saves.sync('account-a', f.transport);
  assert.throws(() => f.saves.resolve('account-a', 'hero', 'local'), /apagado/);
  f.saves.resolve('account-a', 'hero', 'cloud'); assert.equal(f.saves.list('account-a').length, 0);
  assert.ok([...f.values.keys()].some(k => k.includes('.backup.')));
});
test('uma escrita concorrente entre leitura e envio é rejeitada pelo CAS', async () => {
  const f = setup(); f.saves.stage('account-a', f.char);
  await f.saves.sync('account-a', { ...f.transport, write: async (...args) => {
    f.cloud.updated_at = '2026-10-31T12:00:00Z'; return f.transport.write(...args);
  } });
  assert.equal(f.writes, 0); assert.equal(f.saves.status('account-a').conflicts, 1);
});
test('contas diferentes e abas com snapshot antigo não sobrescrevem saves', () => {
  const f = setup(), stale = copy(f.char);
  assert.deepEqual(f.saves.list('account-b'), []);
  assert.throws(() => f.saves.stage('account-b', f.char), /outra conta/);
  f.char.data.gold = 30; f.saves.stage('account-a', f.char);
  assert.throws(() => f.saves.stage('account-a', stale), /outra aba/);
  assert.equal(f.saves.list('account-a')[0].data.gold, 30);
});
test('falta de espaço não confirma uma gravação que falhou', () => {
  const f = setup(), version = f.char._saveVersion;
  f.storage.setItem = () => { throw Error('QuotaExceededError'); };
  assert.throws(() => f.saves.stage('account-a', f.char), /Quota/);
  assert.equal(f.char._saveVersion, version); assert.equal(f.saves.status('account-a').pending, 0);
});
test('longa jornada offline respeita a proteção de 20 mil pontos por gravação', async () => {
  const f = setup(); f.char.score = 55100; f.saves.stage('account-a', f.char);
  await f.saves.sync('account-a', f.transport);
  assert.equal(f.cloud.score, 55100); assert.equal(f.writes, 3); assert.equal(f.saves.status('account-a').pending, 0);
});
test('atualizar seleção não descarta personagens com envio pendente', () => {
  const f = setup(); f.char.data.gold = 15; f.saves.stage('account-a', f.char);
  f.saves.refresh('account-a', [f.cloud]); assert.equal(f.saves.list('account-a')[0].data.gold, 15);
  f.saves.refresh('account-a', []); assert.equal(f.saves.list('account-a').length, 1);
});
test('consultar seleção em outra aba não invalida snapshot se a nuvem não mudou', () => {
  const f = setup(); f.saves.refresh('account-a', [f.cloud]);
  assert.doesNotThrow(() => f.saves.stage('account-a', f.char));
});
