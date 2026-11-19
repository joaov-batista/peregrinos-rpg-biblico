// A fase da célula ("Jesus me escolheu", em /celula): cinco páginas curtas que precisam ser atravessáveis só com o
// pulo básico, cinco chefes completos (dados, golpes, arte, cutscene), quizzes difíceis (quatro opções, sem repetição)
// e a apuração da votação da sala.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.document ??= { documentElement: { style: { setProperty() {} } }, body: { classList: { add() {}, remove() {}, toggle() {} } } };
globalThis.localStorage ??= { getItem() { return null; }, setItem() {} };
const { gerarNivel, alcancaveis, T } = await import('../src/caminho/nivel.js');
const { areaDef, DIFICULDADES } = await import('../src/caminho/dados.js');
const { CHEFES } = await import('../src/caminho/chefes.js');
const { ESTILOS } = await import('../src/caminho/estilos.js');
const { EVENTOS, TODAS } = await import('../src/content/index.js');
const { BOSSES } = await import('../src/data/bestiary.js');
const { CINEMAS } = await import('../src/content/cinematicas.js');
const { CHEFES_G, GRANDES } = await import('../src/caminho/pixel/chefes-g.js');
const { apurar, pacoteQuiz } = await import('../src/celula/rede.js');

const sem = EVENTOS.find(s => s.id === 'celula-escolheu');

test('a fase da célula fica fora do jogo principal', () => {
  assert.ok(sem, 'a semana da célula existe');
  assert.ok(!TODAS.includes(sem), 'não aparece no Salão nem no Refúgio');
  assert.equal(sem.fases.length, 5); assert.ok(DIFICULDADES.celula);
});

test('as cinco páginas são curtas e atravessáveis', () => {
  for (const f of sem.fases) {
    const id = sem.id + ':' + f.n, def = areaDef(id), N = gerarNivel(def), base = alcancaveis(N);
    assert.equal(N.objs.filter(o => o.tipo === 'rolo').length, 2, id + ': dois rolos');
    assert.equal(N.objs.filter(o => o.tipo === 'npc').length, 3, id + ': três personagens explicam a Palavra');
    for (const o of N.objs) if (!['vaso', 'ave', 'fruto', 'escrito'].includes(o.tipo)) assert.ok(base.tem(o.x, o.y), `${id}: ${o.tipo} em ${Math.round(o.x / T)} fora de alcance`);
    assert.ok(N.porta && base.tem(N.porta.x - T, N.porta.y), id + ': porta do chefe');
    assert.ok(def.evento && !N.objs.some(o => o.tipo === 'segredo'), id + ': sem segredos nem desvios');
  }
});

test('cinco chefes completos: dados, golpes, arte e cutscene', () => {
  const ids = sem.fases.map(f => f.chefe);
  assert.equal(new Set(ids).size, 5);
  for (const id of ids) {
    const c = CHEFES[id];
    assert.ok(c && BOSSES[id]?.nome && BOSSES[id].intro && BOSSES[id].derrota, id + ': dados');
    assert.ok(CHEFES_G[id], id + ': arte em pixel');
    assert.ok(CINEMAS['chefe-' + id], id + ': cutscene');
    for (const fase of c.fases) for (const g of fase.golpes) { const def = c.golpes[g]; assert.ok(def, id + ': golpe ' + g); assert.ok(ESTILOS[id].golpes[def.fn || g], id + ': estilo do golpe ' + g); }
    assert.ok(c.dica, id + ': dica');
  }
  for (const n of [1, 2, 3, 4, 5]) assert.ok(CINEMAS['celula-escolheu-fase-' + n], 'cutscene da página ' + n);
  assert.ok(CINEMAS['celula-escolheu'] && CINEMAS['celula-escolheu-fim']);
});

test('quizzes difíceis: quatro opções diferentes, explicação e sem repetir', () => {
  const todas = new Set();
  for (const f of sem.fases) {
    assert.ok(f.quiz.length >= 8, f.nome + ': pelo menos 8 perguntas');
    for (const q of f.quiz) {
      assert.equal(q.a.length, 4, q.q); assert.equal(new Set(q.a).size, 4, q.q + ': opções repetidas'); assert.ok(q.porque, q.q + ': sem explicação');
      assert.ok(!todas.has(q.q), 'pergunta repetida: ' + q.q); todas.add(q.q);
    }
  }
});

test('a votação: opções embaralhadas e a apuração (empate e silêncio são erro)', () => {
  const q = sem.fases[0].quiz[0]; let mudou = false;
  for (let i = 0; i < 30; i++) { const p = pacoteQuiz(q); assert.equal(p.op[p.certa], q.a[0]); if (p.certa !== 0) mudou = true; }
  assert.ok(mudou, 'a certa nem sempre é a primeira');
  assert.deepEqual(apurar([3, 1, 0, 0], 0), { venc: 0, certo: true, empate: false });
  assert.equal(apurar([2, 2, 0, 0], 0).certo, false);
  assert.equal(apurar([0, 0, 0, 0], 0).certo, false);
  assert.equal(apurar([0, 5, 1, 0], 2).certo, false);
});
