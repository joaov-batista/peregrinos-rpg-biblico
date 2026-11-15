// Chefes: cada um luta do seu jeito. Nenhum golpe é dividido com outro chefe, todo golpe acontece numa luta
// simulada e todo golpe termina sozinho (nenhum fica preso no limite de segurança).
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.document ??= { documentElement: { style: { setProperty() {} } }, body: { classList: { add() {}, remove() {}, toggle() {} } } };
globalThis.localStorage ??= { getItem() { return null; }, setItem() {} };
const { CHEFES, novoChefe, atualizarChefe } = await import('../src/caminho/chefes.js');
const { ESTILOS } = await import('../src/caminho/estilos.js');
const { T, SOLIDO, VAZIO, PONTE } = await import('../src/caminho/nivel.js');

test('nenhum golpe é repetido entre chefes e todo chefe tem estilo completo', () => {
  const dono = new Map();
  for (const [id, c] of Object.entries(CHEFES)) {
    const E = ESTILOS[id];
    assert.ok(E, id + ' sem estilo');
    assert.equal(typeof E.mover, 'function', id + ' sem jeito de se mover');
    assert.equal(typeof E.palco, 'function', id + ' sem palco');
    const usados = new Set(Object.entries(c.golpes).map(([n, d]) => d.fn || n));
    assert.ok(usados.size >= 4, id + ' precisa de pelo menos 4 golpes próprios');
    for (const nome of usados) {
      assert.equal(typeof E.golpes[nome], 'function', id + ': golpe ' + nome + ' não existe');
      for (const [outro, F] of Object.entries(ESTILOS)) if (outro !== id) assert.notEqual(F.golpes[nome], E.golpes[nome], nome + ' repetido em ' + outro);
      assert.ok(!dono.has(nome), nome + ' usado por ' + id + ' e por ' + dono.get(nome)); dono.set(nome, id);
    }
    for (const f of c.fases) for (const g of f.golpes) assert.ok(c.golpes[g], id + ': fase usa ' + g + ' que não existe');
    const nasFases = new Set(c.fases.flatMap(f => f.golpes).map(n => c.golpes[n].fn || n));
    for (const nome of usados) assert.ok(nasFases.has(nome), id + ': ' + nome + ' nunca aparece numa fase');
  }
});

// uma arena simulada com as plataformas da arena "plat"
function mundo(arena) {
  const w = 40, h = 20, tiles = new Uint8Array(w * h).fill(VAZIO);
  for (let x = 0; x < w; x++) tiles[17 * w + x] = SOLIDO;
  for (let y = 0; y < h; y++) { tiles[y * w] = SOLIDO; tiles[y * w + 31] = SOLIDO; }
  if (arena !== 'plana') for (const [row, a, b] of [[14, 4, 9], [14, 20, 25], [11, 12, 17]]) for (let x = a; x <= b; x++) tiles[row * w + x] = PONTE;
  return { w, h, tiles, arena: { x0: T, x1: 31 * T, y0: 2 * T, chao: 17 * T, cx: 16 * T } };
}
function jogoFalso(id) {
  const N = mundo(CHEFES[id].arena), A = N.arena, nada = () => {};
  const p = { x: A.cx - 150, y: A.chao, vx: 0, vy: 0, face: 1, chao: true, vida: 99, inv: 0, lamp: false, dashT: 0, stunT: 0 };
  const G = { N, p, eu: p, tiros: [], zonas: [], moedas: [], parts: [], inimigos: [], dif: { hp: 1, aviso: 1, vel: 1, ritmo: 1 }, escuroAlvo: 0, clarao: 0, peso: 0, puxao: null, invertido: 0,
    fx: { po: nada, sobe: nada, anel: nada, faisca: nada }, efeito: nada, fala: nada, grito: nada, textoEm: nada, tremor: nada, limparPerigos() { G.tiros = []; G.zonas = []; },
    estaEscrito: nada, postura: nada, soprar: nada, chefeCaiu: nada, raioLuz: () => 150, nascer(t, x, y) { const e = { kind: 'vicio', x, y, hp: 1 }; G.inimigos.push(e); return e; } };
  return G;
}

test('em luta simulada, cada chefe usa todos os golpes e cada golpe termina sozinho', () => {
  for (const id of Object.keys(CHEFES)) {
    const G = jogoFalso(id), b = novoChefe(id, G.N.arena, G.dif), vistos = new Set(), dt = 1 / 60;
    G.inimigos.push(b); G.chefe = b;
    let inicio = 0, maior = 0, atual = null;
    for (let i = 0; i < 60 * 240; i++) {
      // o peregrino anda de um lado para o outro e pula às vezes; a vida do chefe desce aos poucos para passar por todas as fases
      const t = i * dt; G.p.x = G.N.arena.cx + Math.sin(t * 0.7) * 300; G.p.face = Math.cos(t * 0.7) > 0 ? 1 : -1; G.p.chao = Math.floor(t) % 5 !== 0; G.p.vida = 99;
      b.hp = Math.max(1, b.max * (1 - t / 200)); b.quebrado = 0; b.tonto = 0;
      atualizarChefe(G, b, dt);
      for (const z of G.zonas) { if (z.aviso > 0) z.aviso -= dt; else z.dur -= dt; } G.zonas = G.zonas.filter(z => z.aviso > 0 || z.dur > 0);
      for (const q of G.tiros) { q.vida -= dt; if (q.g) q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; } G.tiros = G.tiros.filter(q => q.vida > 0);
      if (b.mov && b.mov !== atual) { atual = b.mov; inicio = t; vistos.add(b.c.golpes[b.mov.nome].fn || b.mov.nome); }
      if (b.mov) maior = Math.max(maior, t - inicio); else atual = null;
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y), id + ': posição inválida');
    }
    const todos = new Set(Object.entries(CHEFES[id].golpes).map(([n, d]) => d.fn || n));
    for (const g of todos) assert.ok(vistos.has(g), id + ': o golpe ' + g + ' nunca saiu');
    assert.ok(maior < 11.5, id + ': um golpe ficou preso por ' + maior.toFixed(1) + ' s');
  }
});

test('vícios, salas de chefe e fases: cada um tem o seu, sem repetir', async () => {
  const { VICIOS } = await import('../src/caminho/bichos.js');
  const { ARENAS } = await import('../src/caminho/nivel.js');
  const { PERIGOS, MARCAS } = await import('../src/caminho/perigos.js');
  const { TODAS } = await import('../src/content/index.js');
  // cada vício luta de um jeito que nenhum outro usa
  const ais = Object.entries(VICIOS).map(([id, v]) => [id, v.ai]);
  for (const [id, ai] of ais) assert.equal(ais.filter(([, a]) => a === ai).length, 1, id + ' divide o comportamento "' + ai + '" com outro vício');
  // cada chefe tem uma sala própria, e nenhuma planta de sala se repete
  const arenas = Object.entries(CHEFES).map(([id, c]) => [id, c.arena]);
  for (const [id, a] of arenas) { assert.ok(ARENAS[a], id + ': sala ' + a + ' não existe'); assert.equal(arenas.filter(([, b]) => b === a).length, 1, id + ' divide a sala ' + a); }
  const plantas = arenas.map(([, a]) => JSON.stringify(ARENAS[a])); assert.equal(new Set(plantas).size, plantas.length, 'duas salas com a mesma planta');
  // cada fase tem o seu perigo e a sua sala marcante, diferentes de todas as outras
  const chefesDeFase = TODAS.flatMap(s => s.fases.map(f => f.chefe));
  for (const c of chefesDeFase) { assert.equal(typeof PERIGOS[c]?.f, 'function', c + ' sem perigo de fase'); assert.ok(MARCAS[c], c + ' sem sala marcante'); }
  const nomes = chefesDeFase.map(c => PERIGOS[c].nome), marcas = chefesDeFase.map(c => MARCAS[c].join('|'));
  assert.equal(new Set(nomes).size, nomes.length, 'perigo de fase repetido'); assert.equal(new Set(marcas).size, marcas.length, 'sala marcante repetida');
});
