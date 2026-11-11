// O Caminho (remake lateral): toda área gerada precisa ser atravessável só com o pulo básico,
// e cada segredo precisa ser alcançável com alguma habilidade.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.document ??= { documentElement: { style: { setProperty() {} } }, body: { classList: { add() {}, remove() {}, toggle() {} } } };
globalThis.localStorage ??= { getItem() { return null; }, setItem() {} };
const { gerarNivel, alcancaveis, T, tileEm, VAZIO } = await import('../src/caminho/nivel.js');
const { areaDef, MUNDO, ARMADURA, RELIQUIAS } = await import('../src/caminho/dados.js');
const { CHEFES } = await import('../src/caminho/chefes.js');
const { TODAS } = await import('../src/content/index.js');
const { BOSSES } = await import('../src/data/bestiary.js');
const { CINEMAS, CINEMA_CHEFE } = await import('../src/content/cinematicas.js');

const areas = ['refugio', ...Object.keys(MUNDO).map(m => 'mundo:' + m), ...TODAS.flatMap(s => s.fases.map(f => s.id + ':' + f.n))];

test('toda área é atravessável sem habilidades', () => {
  for (const id of areas) {
    const def = areaDef(id), N = gerarNivel(def), base = alcancaveis(N), tudo = alcancaveis(N, { lampada: true, firmeza: true, asas: true });
    for (const o of N.objs) {
      if (o.tipo === 'vaso' || o.tipo === 'ave' || o.tipo === 'morador') continue; // enfeites
      const onde = `${id}: ${o.tipo} em ${Math.round(o.x / T)},${Math.round(o.y / T)}`;
      if (o.tipo === 'segredo') assert.ok(tudo.tem(o.x, o.y), onde + ' fora de alcance mesmo com a armadura');
      else assert.ok(base.tem(o.x, o.y), onde + ' fora de alcance');
    }
    if (N.porta) assert.ok(base.tem(N.porta.x - T, N.porta.y), id + ': a porta do chefe não é alcançável');
    if (def.fase) {
      assert.equal(N.objs.filter(o => o.tipo === 'rolo').length, 3, id + ': faltam rolos');
      assert.equal(N.objs.filter(o => o.tipo === 'estacao').length, (def.estacoes || []).length, id + ': faltam estações');
      assert.ok(N.objs.some(o => o.tipo === 'ebenezer'), id + ': sem Ebenézer');
      assert.ok(N.spawns.length >= 2, id + ': poucos vícios'); // as ondas das emboscadas completam o combate
    }
    for (const s of N.spawns) assert.equal(tileEm(N, Math.floor(s.x / T), Math.floor(s.y / T)), VAZIO, id + ': vício dentro da parede');
  }
});

test('as plantas são iguais para todos (semente fixa)', () => {
  const a = gerarNivel(areaDef('semana-01:1')), b = gerarNivel(areaDef('semana-01:1'));
  assert.deepEqual([...a.tiles], [...b.tiles]);
});

test('todo chefe tem dados completos, fases em ordem e golpes existentes', () => {
  for (const s of TODAS) for (const f of s.fases) assert.ok(CHEFES[f.chefe], 'sem padrão para ' + f.chefe);
  for (const m of Object.values(MUNDO)) assert.ok(CHEFES[m.chefe] && RELIQUIAS[m.premio]);
  for (const [id, c] of Object.entries(CHEFES)) {
    assert.ok(BOSSES[id], id + ' não está no bestiário');
    assert.equal(c.fases[0].vida, 1);
    c.fases.forEach((f, i) => { if (i) assert.ok(f.vida < c.fases[i - 1].vida, id + ': fases fora de ordem'); for (const g of f.golpes) assert.ok(c.golpes[g], id + ': golpe ' + g + ' não existe'); });
    assert.ok(CINEMAS[CINEMA_CHEFE[id] || 'chefe-' + id], id + ' sem cutscene');
  }
});

test('recompensas existem e as semanas têm conteúdo para os rolos', () => {
  for (const s of TODAS) {
    assert.ok(ARMADURA[s.recompensaSemana] || RELIQUIAS[s.recompensaSemana], s.id + ': prêmio da semana');
    assert.ok(CINEMAS[s.id] && CINEMAS[s.id + '-fim']);
    for (const f of s.fases) {
      assert.ok(ARMADURA[f.recompensa] || RELIQUIAS[f.recompensa], s.id + ':' + f.n + ' prêmio ' + f.recompensa);
      assert.ok(f.quiz.length >= 10 && f.licao && f.versiculo?.ref && CINEMAS[s.id + '-fase-' + f.n]);
      for (const q of f.quiz) assert.ok(q.a.length >= 2 && new Set(q.a).size === q.a.length, 'respostas repetidas: ' + q.q);
    }
  }
});
