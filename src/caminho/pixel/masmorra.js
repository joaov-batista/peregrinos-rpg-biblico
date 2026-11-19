// O fundo das salas fechadas (fases, masmorras, salas de chefe, ondas, o Conselho): a parede de verdade atrás da ação.
// Cantaria em fiadas (ou tábuas, ou terra com raízes), janelas em arco por onde se vê o céu e a cidade do tema,
// pilastras entre elas, o rodapé de pedras grandes, a sombra que junta parede e chão, e as manchas de luz que as
// lamparinas fazem na pedra. Pintado UMA vez por sala e guardado: por quadro custa só um drawImage.
import { hash } from '../../util.js';
import { CW, CH, T } from '../nivel.js';
import { PX } from './raster.js';

const TL = T / PX, SW = CW * TL, SH = CH * TL; // 480 x 272
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const limiar = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const hx = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const ruido = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s), u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };

// estilo de parede por tema (null = sala sem parede própria: a céu aberto, o convés, o ventre do peixe)
export function estilo(G) {
  const t = G.def.tema, d = G.tm.deco;
  if (G.def.aberto || G.def.paz || t === 'conves' || t === 'mar' || d === 'costelas' || d === 'dunas' || d === 'seca' || d === 'estrada') return null;
  if (t === 'raiz' || t === 'arvore') return 'caverna';
  if (d === 'arvores') return null;
  if (d === 'mastros') return 'madeira';
  return d === 'masmorra' ? 'masmorra' : d === 'muralha' ? 'muralha' : d === 'tendas' ? 'tendas' : d === 'arcos' ? 'arcos' : 'colunas';
}

// a rampa da parede, tirada das cores do tema: do bloco (escuro) para a borda (a cor da pedra iluminada)
function rampaDe(G, st) {
  const b = hx(G.tm.bloco), d = hx(G.tm.borda), base = st === 'madeira' ? mix(b, [122, 82, 50], 0.5) : st === 'caverna' ? mix(b, [92, 66, 44], 0.45) : b;
  const ks = st === 'masmorra' ? [0.05, 0.1, 0.16, 0.22, 0.3, 0.4] : st === 'colunas' || st === 'arcos' ? [0.1, 0.17, 0.25, 0.33, 0.42, 0.55] : [0.07, 0.13, 0.2, 0.27, 0.35, 0.46];
  return ks.map(k => mix(base, d, k));
}

const cache = new Map(); let areaCache = '';
export function fundoMasmorra(G, cel) {
  const st = estilo(G); if (!st) return null;
  if (areaCache !== G.area + G.def.tema) { cache.clear(); areaCache = G.area + G.def.tema; }
  const k = cel.cx + ',' + cel.cy; let cv = cache.get(k); if (cv) return cv;
  cv = pintar(G, cel, st); cache.set(k, cv); return cv;
}

function pintar(G, cel, st) {
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const g = cv.getContext('2d'), img = g.createImageData(SW, SH), D = img.data, R = rampaDe(G, st), luz = hx(G.tm.acento || '#FFD98A');
  const sd = (cel.cx * 31 + cel.cy * 17 + 7) | 0;
  const ox = cel.cx * SW, oy = cel.cy * SH; // as luzes do nível estão em coordenadas do mundo
  const lamp = G.N.luzes.map(l => ({ x: l.x / PX - ox, y: l.y / PX - oy, r: (l.r || 120) / PX * 0.5 })).filter(l => l.x > -80 && l.x < SW + 80 && l.y > -40 && l.y < SH + 40);
  // janelas e pilastras (não em toda sala: as de chefe ficam mais fechadas)
  const arena = G.N.arena && G.N.arena.cel === cel, nJan = st === 'caverna' ? 0 : arena ? 1 : 2;
  const jan = []; for (let i = 0; i < nJan; i++) { const cx = Math.round(SW * (nJan === 1 ? 0.5 : i ? 0.7 : 0.3) + (hash(sd, i) - 0.5) * 30), larg = st === 'masmorra' ? 26 : 40 + Math.round(hash(sd, i + 4) * 8), topo = st === 'masmorra' ? 70 : 56; jan.push({ x0: cx - larg / 2, x1: cx + larg / 2, cx, y0: topo, y1: topo + (st === 'masmorra' ? 44 : 92), r: larg / 2 }); }
  const pil = st === 'caverna' || st === 'madeira' ? [] : nJan === 2 ? [Math.round((jan[0].cx + jan[1].cx) / 2), 24, SW - 24] : [Math.round(SW * 0.22), Math.round(SW * 0.78)];
  const naJanela = (x, y, m = 0) => jan.find(j => x >= j.x0 - m && x < j.x1 + m && y < j.y1 + m && (y >= j.y0 + j.r || Math.hypot(x - j.cx + 0.5, y - (j.y0 + j.r)) < j.r + m) && y >= j.y0 - m);
  // as fiadas: cada uma com os seus blocos de comprimentos diferentes
  const alt = st === 'muralha' ? 11 : st === 'masmorra' ? 9 : st === 'madeira' ? 7 : 8;
  const fiada = []; for (let f = 0; f * alt < SH; f++) { const xs = [-Math.floor(hash(f, sd) * 20)]; while (xs[xs.length - 1] < SW) xs.push(xs[xs.length - 1] + (st === 'madeira' ? 60 + Math.floor(hash(f, xs.length, sd) * 60) : (st === 'muralha' ? 20 : 13) + Math.floor(hash(f, xs.length, sd + 1) * (st === 'muralha' ? 16 : 12)))); fiada.push(xs); }
  const put = (x, y, c) => { const i = (y * SW + x) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (naJanela(x, y)) continue; // aberto: o céu e a cidade do fundo aparecem
    let v; // posição na rampa (0..5)
    if (st === 'caverna') { // terra batida com veios, pedras enterradas e raízes descendo
      const n = ruido(x / 22, y / 14, sd) * 0.6 + ruido(x / 7, y / 5, sd + 3) * 0.4; v = 1.4 + n * 2.2;
      const pedra = ruido(x / 9, y / 7, sd + 9); if (pedra > 0.72) v = pedra > 0.78 ? 3.6 - (y % 7 === 0 ? 1 : 0) : 1;
      const raiz = Math.abs(ruido(x / 5 + y / 40, y / 60, sd + 5) - 0.5); if (raiz < 0.035 && ruido(x / 30, y / 30, sd + 6) > 0.4) v = raiz < 0.015 ? 3.2 : 0.6;
    } else {
      const f = Math.floor(y / alt), r = y % alt, xs = fiada[f]; let b = 0; while (xs[b + 1] <= x) b++; const bx = x - xs[b], bl = xs[b + 1] - xs[b];
      const tom = hash(f, b, sd + 2), suj = ruido(x / 40, y / 30, sd + 4);
      v = 2.3 + tom * 1.1 - suj * 0.8;
      if (st === 'madeira') { if (r === alt - 1) v = 0.5; else if (r === 0) v += 0.8; if (bx === 0) v = 0.6; if (bx === 1) v += 0.5; if (Math.abs(ruido(x / 18, f * 3 + r / 3, sd) - 0.5) < 0.04) v -= 0.8; if ((bx === 4 || bx === bl - 5) && r === 3) v = 0.3; } // tábuas com veio e pregos
      else { if (r === alt - 1 || bx === 0) v = 0.4; else if (r === 0 || bx === 1) v += 0.9; else if (r === alt - 2 || bx === bl - 1) v -= 0.6;
        if (hash(x, y, sd + 7) > 0.985 && (r < 2 || bx < 2)) v -= 1.2; // lascas nas quinas
        if (st === 'masmorra' && ruido(x / 6, y / 26, sd + 8) > 0.74 && y > SH * 0.4) v = 1.1 + (y & 1) * 0.3; } // escorrido de umidade
    }
    // a luz: o alto fica no escuro, o pé da parede junta sombra com o chão, e as lamparinas acendem a pedra em volta
    v -= Math.max(0, 1 - y / 70) * 1.2; v -= Math.max(0, (y - (SH - 40)) / 24) * 1.1;
    let l = 0; for (const L of lamp) { const d = Math.hypot((x - L.x) * 1.15, (y - L.y - L.r * 0.25) * 0.85) / L.r; /* a luz cai mais para baixo */ if (d < 1) l = Math.max(l, 1 - d); }
    v += l * l * 2.6;
    const i0 = Math.max(0, Math.min(5, Math.floor(v))), fr = v - Math.floor(v), i = fr > 0.5 + (limiar(x, y) - 0.5) * 0.4 && i0 < 5 ? i0 + 1 : i0; // pontilhado só na passagem entre tons (pedra lisa, sem chuvisco)
    put(x, y, l > 0.25 ? mix(R[i], luz, l * 0.22) : R[i]);
  }
  g.putImageData(img, 0, 0);
  const P = (x, y, w, h, c) => { g.fillStyle = typeof c === 'string' ? c : `rgb(${c[0]},${c[1]},${c[2]})`; g.fillRect(x, y, w, h); };
  // a moldura das janelas: aduelas em volta do arco, o vão (a espessura da parede) e o peitoril
  for (const j of jan) {
    for (let a = 0; a <= 32; a++) { const t = Math.PI + a / 32 * Math.PI, cy = j.y0 + j.r; for (let d = 0; d < 4; d++) { const X = Math.round(j.cx - 0.5 + Math.cos(t) * (j.r + d)), Y = Math.round(cy + Math.sin(t) * (j.r + d)); P(X, Y, 1, 1, a % 4 === 0 ? R[0] : d === 0 ? R[1] : d === 3 ? R[5] : R[4 - (a % 2)]); } }
    for (let y = j.y0 + j.r; y < j.y1; y++) { P(j.x0 - 4, y, 4, 1, (y - j.y0) % 8 === 0 ? R[0] : R[4]); P(j.x1, y, 4, 1, (y - j.y0) % 8 === 0 ? R[0] : R[2]); P(j.x0, y, 3, 1, R[1]); } // o vão do lado esquerdo, na sombra
    P(j.x0 - 6, j.y1, j.x1 - j.x0 + 12, 2, R[5]); P(j.x0 - 6, j.y1 + 2, j.x1 - j.x0 + 12, 3, R[2]); P(j.x0 - 6, j.y1 + 5, j.x1 - j.x0 + 12, 1, R[0]); // o peitoril
    if (st === 'masmorra') { for (let x = j.x0 + 5; x < j.x1; x += 6) P(x, j.y0, 2, j.y1 - j.y0, '#15121A'); P(j.x0, j.y0 + j.r + 6, j.x1 - j.x0, 2, '#15121A'); } // a grade de ferro
    // a luz da janela cai na parede de baixo, em pontilhado
    for (let y = j.y1 + 6; y < Math.min(SH - 18, j.y1 + 60); y++) for (let x = j.x0 + 2 + Math.round((y - j.y1) * 0.25); x < j.x1 - 2 + Math.round((y - j.y1) * 0.25); x++) if (limiar(x, y) < 0.22 * (1 - (y - j.y1) / 60)) P(x, y, 1, 1, R[5]);
  }
  // pilastras: base, fuste com caneluras, capitel
  for (const px of pil) { const w = st === 'muralha' ? 22 : 16, x0 = px - w / 2;
    for (let y = 30; y < SH - 16; y++) { P(x0, y, w, 1, R[2]); P(x0, y, 2, 1, R[4]); P(x0 + w - 3, y, 3, 1, R[1]); if (st !== 'muralha') { P(x0 + 5, y, 1, 1, R[1]); P(x0 + 6, y, 1, 1, R[3]); P(x0 + w - 7, y, 1, 1, R[1]); } }
    P(x0 - 4, 26, w + 8, 4, R[4]); P(x0 - 4, 30, w + 8, 1, R[0]); P(x0 - 2, 31, w + 4, 2, R[3]); // capitel
    P(x0 - 4, SH - 22, w + 8, 6, R[3]); P(x0 - 4, SH - 22, w + 8, 1, R[5]); P(x0 - 4, SH - 17, w + 8, 1, R[0]); } // base
  // o rodapé: uma fiada de pedras grandes, e o pé da parede escurecido
  if (st !== 'caverna') for (let x = 0; x < SW; x += 24) { const o = (cel.cx * 7 + x) % 5; P(x, SH - 27 + o % 2, 24, 1, R[4]); P(x, SH - 18, 24, 1, R[0]); P(x + 23, SH - 27, 1, 10, R[0]); }
  // o que dá vida ao lugar, de acordo com o tema
  if (st === 'tendas') for (let x = 10; x < SW; x += 70) { const c = ['#8E2E4A', '#3A5A8A', '#C9A63C', '#5A7A3A'][Math.floor(hash(x, sd) * 4)]; for (let i = 0; i < 46; i++) { const y = 18 + Math.round(Math.sin(i / 45 * Math.PI) * 10); P(x + i, 16, 1, y - 16, c); P(x + i, y, 1, 1, '#1A1018'); if (i % 6 === 0) P(x + i, 16, 1, y - 18, 'rgba(0,0,0,.25)'); } } // panos esticados no alto
  if (st === 'masmorra' || st === 'muralha') for (let k = 0; k < 2; k++) { const x = Math.round(SW * (0.15 + k * 0.62) + hash(sd, k + 9) * 20); for (let y = 16; y < 16 + 40 + k * 14; y += 2) { P(x + (y % 4 ? 0 : 1), y, 2, 2, R[0]); P(x + (y % 4 ? 1 : 0), y, 1, 1, R[3]); } P(x - 2, 56 + k * 14, 6, 4, R[0]); P(x - 1, 57 + k * 14, 4, 2, R[3]); } // correntes penduradas
  if (st === 'caverna') for (let k = 0; k < 7; k++) { const x = Math.round(hash(sd, k) * SW), h = 20 + Math.round(hash(k, sd) * 50); for (let y = 16; y < 16 + h; y++) { const xx = x + Math.round(Math.sin(y * 0.15 + k) * 2); P(xx, y, 2, 1, R[1]); P(xx, y, 1, 1, R[3]); } } // raízes que descem do teto
  return cv;
}
