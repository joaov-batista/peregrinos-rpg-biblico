// Níveis do Caminho: cada área é uma grade de salas (30×17 tiles) ligadas por portas laterais e poços verticais.
// A planta é sorteada com semente fixa (igual para todos) a partir de pedaços desenhados à mão; a travessia básica
// nunca exige habilidade: só os segredos pedem a Lâmpada, a Firmeza (escalar) ou as Asas (salto duplo).
export const T = 32, CW = 30, CH = 17;
export const VAZIO = 0, SOLIDO = 1, PONTE = 2, ESPINHO = 3, OCULTO = 4, FALSA = 5, PORTAO = 6, TRANCA = 7;
export const L = 1, R = 2, U = 4, D = 8;

export function semente(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Pedaços laterais (8 colunas, alinhados ao chão). e = vício no chão, f = vício voador, v = vaso, s = segredo,
// ~ = plataforma oculta (só existe sob a lâmpada erguida), % = parede falsa (a lâmpada desfaz), ^ = espinhos.
const LADOS = [
  { id: 'livre', linhas: ['...e....'] },
  { id: 'bloco', linhas: ['..##....', '.v##..e.'] },
  { id: 'espinhos', linhas: ['##...##.', '##^^^##.'] },
  { id: 'degraus', linhas: ['......v.', '....====', '........', '........', '.===....', '........', '....e...'] },
  { id: 'torre', linhas: ['...f....', '........', '........', '..###...', '..###...', '..###...'] },
  { id: 'escada', linhas: ['.....e..', '.....##.', '...####.', '.######.'] },
  { id: 'fosso', linhas: ['...==...', '........', '#......#', '#^^^^^^#'] },
  { id: 'varanda', linhas: ['..f.....', '........', '.v......', '.=====..', '........', '........', '....##..', '..e.##..'] },
  { id: 'ruina', linhas: ['....==..', '........', '.#......', '.#......', '.##...e.'] },
  // segredos
  { id: 's-lampada', seg: 'lampada', linhas: ['.s......', '.##.....', '........', '........', '....~~..', '........', '........', '.~~.....', '........', '......e.'] },
  { id: 's-falsa', seg: 'lampada', linhas: ['#####...', '#...%...', '#.s.%...'] },
  { id: 's-firmeza', seg: 'firmeza', linhas: ['s.......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '........', '........', '......e.'] },
  { id: 's-asas', seg: 'asas', linhas: ['...s....', '..===...', '........', '........', '........', '........', '....e...'] }
];
const PEDESTAL = ['...o....', '..###...'];
const CENTROS = [
  ['........'], ['...ee...'], ['...vv...', '.######.'], ['..f..f..', '........', '........', '........', '........'],
  ['..====..', '........', '........', '...e....'], ['...##...', '.v.##.v.']
];
const ARENAS = {
  plana: [],
  plat: [[13, 4, 9], [13, 20, 25], [10, 12, 17]],
  alta: [[13, 3, 7], [13, 22, 26], [10, 8, 12], [10, 17, 21]]
};

const espelha = s => s.split('').reverse().join('');

// Planta: uma linha reta. Início → três câmaras (cada uma guarda um rolo, e os vícios guardam a câmara) → Pedra de Ebenézer → chefe.
// Sem ramos para procurar: o caminho é combate e leitura. Só o tesouro fica num desvio curto, logo acima ou abaixo do início.
function planta(def, rng) {
  const camaras = Math.max(1, def.rolos ?? 3), cols = camaras + 3, rows = 3, g = new Map(), key = (x, y) => x + ',' + y;
  const cel = (x, y, papel) => { const c = { cx: x, cy: y, mask: 0, papel }; g.set(key(x, y), c); return c; };
  const liga = (a, b) => {
    if (b.cx > a.cx) { a.mask |= R; b.mask |= L; } else if (b.cx < a.cx) { a.mask |= L; b.mask |= R; }
    else if (b.cy < a.cy) { a.mask |= U; b.mask |= D; } else { a.mask |= D; b.mask |= U; }
  };
  let cur = cel(0, 1, 'inicio');
  const caminho = [cur], ramos = [];
  for (let x = 1; x < cols; x++) { const n = cel(x, 1, x === cols - 1 ? 'arena' : x === cols - 2 ? 'ebenezer' : 'corredor'); liga(cur, n); cur = n; caminho.push(n); }
  if (def.tesouro !== false) { const n = cel(0, rng() < 0.5 ? 0 : 2, 'tesouro'); liga(caminho[0], n); ramos.push(n); }
  return { cols, rows, celulas: [...g.values()], caminho, ramos };
}

export function gerarNivel(def) {
  const rng = semente(def.seed || 'peregrinos');
  const pl = def.planta ? plantaFixa(def.planta) : planta(def, rng);
  const w = pl.cols * CW, h = pl.rows * CH;
  const N = { w, h, tiles: new Uint8Array(w * h), objs: [], spawns: [], celulas: pl.celulas, cols: pl.cols, rows: pl.rows, luzes: [], def };
  N.tiles.fill(SOLIDO);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) N.tiles[y * w + x] = v; };
  const get = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? SOLIDO : N.tiles[y * w + x];

  // o que cada sala precisa guardar
  const fila = [];
  const rolos = def.planta ? 0 : def.rolos ?? 3;
  let nr = 0;
  for (const c of pl.celulas) if (c.papel === 'rolo') c.itens = [{ tipo: 'rolo', n: nr++ }];
  for (; nr < rolos; nr++) fila.push({ tipo: 'rolo', n: nr });
  (def.estacoes || []).forEach((e, i) => fila.push({ tipo: 'estacao', n: i, id: e.id }));
  (def.npcs || []).forEach((n, i) => fila.push({ tipo: 'npc', n: i }));
  const segredos = (def.segredos || []).slice();
  const corredores = pl.celulas.filter(c => c.papel === 'corredor');
  // distribui os itens pelos corredores (um pedestal de cada lado, no máximo)
  let ci = 0;
  while (fila.length && corredores.length) {
    const c = corredores[ci++ % corredores.length]; c.itens = c.itens || [];
    if (c.itens.length < 2) c.itens.push(fila.shift()); else if (ci > corredores.length * 3) break;
  }
  const inicio = pl.celulas.find(c => c.papel === 'inicio');
  while (fila.length) { inicio.itens = inicio.itens || []; inicio.itens.push(fila.shift()); if (inicio.itens.length > 2) break; }

  const habPorSeg = { lampada: ['s-lampada', 's-falsa'], firmeza: ['s-firmeza'], asas: ['s-asas'] };
  for (const c of pl.celulas) {
    const ox = c.cx * CW, oy = c.cy * CH;
    for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) set(ox + x, oy + y, VAZIO);
    if (c.mask & L) for (let y = 13; y <= 15; y++) set(ox, oy + y, VAZIO);
    if (c.mask & R) for (let y = 13; y <= 15; y++) set(ox + CW - 1, oy + y, VAZIO);
    if (c.mask & U) for (let x = 13; x <= 16; x++) set(ox + x, oy, VAZIO);
    if (c.mask & D) for (let x = 13; x <= 16; x++) set(ox + x, oy + CH - 1, PONTE);
    const poco = c.mask & (U | D);
    const poe = (linhas, col0) => {
      const base = 16 - linhas.length;
      linhas.forEach((ln, i) => { for (let k = 0; k < ln.length; k++) celula(ln[k], ox + col0 + k, oy + base + i); });
    };
    const celula = (ch, x, y) => {
      switch (ch) {
        case '#': set(x, y, SOLIDO); break; case '=': set(x, y, PONTE); break; case '^': set(x, y, ESPINHO); break;
        case '~': set(x, y, OCULTO); break; case '%': set(x, y, FALSA); break;
        case 'e': case 'f': if (c.papel !== 'inicio') N.spawns.push({ voa: ch === 'f', x: x * T + 16, y: y * T + 16, cel: c }); break;
        case 'v': N.objs.push({ tipo: 'vaso', x: x * T + 16, y: (y + 1) * T }); break;
        case 's': N.objs.push({ tipo: 'segredo', x: x * T + 16, y: (y + 1) * T, item: null, cel: c }); break;
        case 'o': c._ped.push({ x: x * T + 16, y: (y + 1) * T }); break;
      }
    };
    c._ped = [];
    if (c.papel === 'arena') {
      for (const [row, a, b] of ARENAS[def.arena || 'plana']) for (let x = a; x <= b; x++) set(ox + x, oy + row, PONTE);
      N.arena = { x0: (ox + 1) * T, x1: (ox + CW - 1) * T, y0: (oy + 1) * T, chao: (oy + CH - 1) * T, cx: (ox + CW / 2) * T, cel: c };
      for (let y = 13; y <= 15; y++) set(ox, oy + y, PORTAO);
      N.porta = { x: ox * T + 16, y: (oy + 16) * T, tx: ox, ty: oy + 13 };
      continue;
    }
    if (c.papel === 'inicio') N.inicio = { x: (ox + 4) * T, y: (oy + 16) * T };
    if (c.tiles) { c.tiles.forEach((ln, i) => { for (let k = 0; k < ln.length; k++) celula(ln[k], ox + 1 + k, oy + 16 - c.tiles.length + i); }); }
    else if (c.papel === 'ebenezer') { poe(LADOS[1].linhas, 2); c._ped.push({ x: (ox + 20) * T + 16, y: (oy + 16) * T }); }
    else if (c.papel !== 'vila') {
      const itens = (c.itens || []).slice();
      for (const lado of [0, 1]) {
        let linhas;
        if (c.papel === 'inicio') linhas = lado === 1 && itens.length ? PEDESTAL : ['........']; // o início fica livre à esquerda, onde o peregrino aparece
        else if (itens.length > lado || (c.papel === 'rolo' && lado === 1 && !c._ped.length && itens.length)) linhas = PEDESTAL;
        else {
          let op = LADOS.filter(f => !f.seg);
          const querSeg = c.papel === 'tesouro' || (segredos.length > N.objs.filter(o => o.tipo === 'segredo').length && rng() < 0.55);
          if (querSeg) { const tipos = def.segTipos || ['lampada', 'lampada', 'firmeza', 'asas']; const t = tipos[Math.floor(rng() * tipos.length)]; op = LADOS.filter(f => habPorSeg[t].includes(f.id)); }
          linhas = op[Math.floor(rng() * op.length)].linhas;
        }
        poe(lado ? linhas.map(espelha) : linhas, lado ? 20 : 2);
      }
      if (!poco && c.papel === 'corredor') poe(CENTROS[Math.floor(rng() * CENTROS.length)], 11);
    }
    if (c.mask & U) for (const row of [13, 10, 8, 5, 2]) for (let x = 12; x <= 17; x++) set(ox + x, oy + row, PONTE);
    // portas sempre livres
    if (c.mask & L) for (let y = 13; y <= 15; y++) set(ox + 1, oy + y, VAZIO);
    if (c.mask & R) for (let y = 13; y <= 15; y++) set(ox + CW - 2, oy + y, VAZIO);
    // itens da sala nos pedestais
    (c.itens || []).forEach((it, i) => { const p = c._ped[i] || { x: (ox + (c.papel === 'inicio' ? 9 + i * 3 : 8 + i * 12)) * T + 16, y: (oy + 16) * T }; N.objs.push({ ...it, x: p.x, y: p.y, cel: c }); });
    if (c.papel === 'ebenezer') N.objs.push({ tipo: 'ebenezer', x: c._ped[0].x, y: c._ped[0].y, cel: c });
    for (const o of c.objs || []) N.objs.push({ ...o, x: (ox + o.col) * T + 16, y: (oy + (o.lin ?? 16)) * T, cel: c });
    N.luzes.push({ x: (ox + 6) * T, y: (oy + 9) * T, r: 150 }, { x: (ox + 24) * T, y: (oy + 9) * T, r: 150 });
  }
  // remove vícios e vasos que ficaram dentro de parede, e segredos sem chão
  const livre = (x, y) => get(Math.floor(x / T), Math.floor(y / T)) === VAZIO;
  N.spawns = N.spawns.filter(s => livre(s.x, s.y));
  N.objs = N.objs.filter(o => o.tipo !== 'vaso' || (livre(o.x, o.y - 8) && get(Math.floor(o.x / T), Math.floor(o.y / T)) !== VAZIO));
  // segredos: os itens raros primeiro, o resto vira bolsa de denários
  const segs = N.objs.filter(o => o.tipo === 'segredo');
  segs.forEach((o, i) => { o.item = segredos[i] || 'bolsa'; o.n = i; });
  N.segredosFora = segredos.slice(segs.length); // não couberam: a fase entrega no baú do chefe
  if (!N.inicio) N.inicio = { x: 4 * T, y: 16 * T };
  return N;
}

// Planta escrita à mão (Refúgio e arenas dos chefes do mundo): uma fileira de salas.
function plantaFixa(lista) {
  const celulas = lista.map((c, i) => ({ cx: i, cy: 0, mask: (i > 0 ? L : 0) | (i < lista.length - 1 ? R : 0), ...c }));
  return { cols: lista.length, rows: 1, celulas, caminho: celulas, ramos: [] };
}

export const tileEm = (N, tx, ty) => tx < 0 || ty < 0 || tx >= N.w || ty >= N.h ? SOLIDO : N.tiles[ty * N.w + tx];

// Verificação de travessia (usada nos testes): BFS em posições "de pé" com um modelo simples do pulo.
// hab: { lampada, firmeza, asas }. Devolve o conjunto de posições alcançáveis a partir do início.
export function alcancaveis(N, hab = {}) {
  const sol = (x, y) => { const t = tileEm(N, x, y); return t === SOLIDO || t === PORTAO || t === TRANCA || (t === FALSA && !hab.lampada) || (t === OCULTO && hab.lampada); };
  const chao = (x, y) => { const t = tileEm(N, x, y); return sol(x, y) || t === PONTE; };
  const livre = (x, y) => !sol(x, y) && tileEm(N, x, y) !== ESPINHO;
  const pe = (x, y) => livre(x, y) && livre(x, y - 1) && chao(x, y + 1);
  const sx = Math.floor(N.inicio.x / T), sy = Math.floor(N.inicio.y / T) - 1;
  const vistos = new Set(), fila = [[sx, sy]], k = (x, y) => y * N.w + x;
  const salto = hab.asas ? 6 : 3;
  vistos.add(k(sx, sy));
  while (fila.length) {
    const [x, y] = fila.pop();
    for (let dx = -5; dx <= 5; dx++) for (let dy = -salto; dy <= 34; dy++) {
      const nx = x + dx, ny = y + dy;
      if (vistos.has(k(nx, ny)) || !pe(nx, ny)) continue;
      const sobe = Math.max(0, -dy);
      if (Math.abs(dx) > (dy > 0 ? 5 : 5 - Math.max(0, sobe - 1))) continue;
      // coluna livre para subir, e travessia livre na altura do pulo
      let ok = true; const topo = Math.min(y, ny) - (dy <= 0 ? 1 : 0);
      for (let yy = y; yy >= topo && ok; yy--) if (sol(x, yy)) ok = false;
      const passo = Math.sign(dx);
      for (let xx = x + passo; passo && xx !== nx + passo && ok; xx += passo) if (sol(xx, topo) || sol(xx, topo + 1) && dy <= 0 && xx !== nx) ok = false;
      for (let yy = topo; yy <= ny && ok; yy++) if (sol(nx, yy)) ok = false;
      // ponte abaixo: atravessa descendo; parede: só com firmeza sobe mais que o pulo
      if (ok) { vistos.add(k(nx, ny)); fila.push([nx, ny]); }
    }
    if (hab.firmeza) for (const dx of [-1, 1]) {
      // escala uma parede vizinha (o pé dela pode estar até 3 tiles acima do chão)
      let yy = y; while (yy > y - 4 && !sol(x + dx, yy)) yy--;
      if (!sol(x + dx, yy)) continue;
      let ok = true; for (let q = y; q >= yy; q--) if (!livre(x, q)) ok = false;
      while (ok && sol(x + dx, yy) && livre(x, yy) && yy > 0) yy--;
      if (ok && livre(x, yy) && pe(x + dx, yy) && !vistos.has(k(x + dx, yy))) { vistos.add(k(x + dx, yy)); fila.push([x + dx, yy]); }
    }
  }
  return { tem: (px, py) => vistos.has(k(Math.floor(px / T), Math.floor(py / T) - 1)), n: vistos.size };
}
