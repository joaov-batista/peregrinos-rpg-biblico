// Renderizador em pixel art do Caminho. O mundo inteiro é pintado numa tela pequena (272 pixels de altura,
// 1 pixel de arte = 2 unidades do mundo) e ampliado sem suavização; só os textos ficam na resolução da tela.
// A lógica do jogo não muda: este arquivo só lê o estado e desenha.
import { clamp, TAU, hash } from '../../util.js';
import { input, wasd } from '../../input.js';
import { TODAS } from '../../content/index.js';
import { T, CH } from '../nivel.js';
import { desenharVicio } from '../bichos.js';
import { quadroVicio } from './viciospx.js';
import { desenharChefe } from '../chefes.js';
import { desenharObjeto } from '../objetos.js';
import { MUNDO } from '../dados.js';
import { OLEO_USO } from '../heroi.js';
import { Sprite, rampa, cor, carimbar, TINTA, BRANCO, PX } from './raster.js';
import { quadroHeroi, quadroPessoa, vulto, AX, AY } from './humano.js';
import { tanque } from '../chefes.js';
import { quadroChefe } from './chefespx.js';
import { pintarPalco } from './palcos.js';
import { cenaPixel, pintarFundoPixel, pintarSalasPixel, pintarBlocosPixel, pintarLuzPixel, TL, mistura, pontilha } from './mundo.js';
import { pintarEfeitos } from './efeitos.js';
import { JESUS_LOOK } from '../getsemani.js';
import { cultoAgora } from '../sinagoga.js';
import { hora, periodo, luzDoDia } from '../moradores.js';
import { pintarLuzSinagoga } from './salas.js';
import { visualPortal, pintarConstrucao } from './construcoes.js';
import { ELEMENTO_DO_CHEFE, zonaElemento, tiroElemento, corDoElemento, elementoAmigo } from './elementos.js';

export const FONTE = '"Pixelify Sans", "Alegreya Sans", monospace';
const baixa = document.createElement('canvas'), bg = baixa.getContext('2d');
const meio = document.createElement('canvas'), mg = meio.getContext('2d');
const luzCv = document.createElement('canvas');
const OURO = rampa('#D9A63C'), PEDRA = rampa('#6E7A88'), MADEIRA = rampa('#7A5A3A'), PAPEL = rampa('#E4D6AC'), BARRO = rampa('#A0694A');

/* ---------- objetos de cena ---------- */
const objs = new Map();
function sprObj(chave, w, h, pinta) { let s = objs.get(chave); if (!s) { s = new Sprite(w, h); pinta(s); s.contorno(TINTA); s.tela(); objs.set(chave, s); if (objs.size > 80) objs.delete(objs.keys().next().value); } return s; }
const CHAMA = [['..y..', '.yY.', '.yYy.', 'yYWYy', '.yYy.'], ['.y...', '.yy..', '.yYy.', 'yYWYy', '.yYy.'], ['...y.', '..yy.', '.yYy.', 'yYWYy', '.yYy.']];
function chama(g, x, y, Tm, k = 0) { const f = CHAMA[Math.floor(Tm * 9 + k) % 3]; for (let j = 0; j < f.length; j++) for (let i = 0; i < f[j].length; i++) { const c = f[j][i]; if (c !== '.') { g.fillStyle = c === 'W' ? '#FFFBE6' : c === 'Y' ? '#FFD86A' : '#FF9A3C'; g.fillRect(x - 2 + i, y - 4 + j, 1, 1); } } }

function pintarAgua(g, o, G, x, y, Tm) {
  switch (o.tipo) {
    // o mar e o píer: a água cobre o chão dali até o fim da sala (ou até "ate"); por cima, as tábuas do píer e as estacas
    case 'mar': { const cols = (o.ate ? o.ate - o.col + 1 : 29 - o.col) , w = cols * 16, x0 = x - 8, f3 = Tm * 1.6;
      g.fillStyle = '#0C2434'; g.fillRect(x0, y + 4, w, 20); g.fillStyle = '#123A52'; g.fillRect(x0, y + 2, w, 4);
      for (let i = 0; i < w; i += 2) { const yy = y + 1 + Math.round(Math.sin(i * 0.15 + f3 * 2) * 1.2); g.fillStyle = (i + Math.floor(f3 * 6)) % 18 < 2 ? '#BFF0F8' : '#2E6B80'; g.fillRect(x0 + i, yy, 2, 1); }
      g.fillStyle = '#4A3524'; for (let i = 6; i < w; i += 40) g.fillRect(x0 + i, y - 1, 3, 22);
      g.fillStyle = '#17121f'; g.fillRect(x0, y - 3, w, 4); g.fillStyle = '#8A6A44'; g.fillRect(x0, y - 3, w, 2); g.fillStyle = '#6B4A2E'; for (let i = 0; i < w; i += 9) g.fillRect(x0 + i, y - 3, 1, 3);
      return true; }
    case 'barco': { const bal = Math.round(Math.sin(Tm * 1.4) * 1.5), bx = x, by = y + 4 + bal, vira = o.volta ? -1 : 1;
      g.fillStyle = '#17121f'; g.fillRect(bx - 44, by - 16, 88, 14); g.fillRect(bx - 38, by - 2, 76, 4); g.fillStyle = '#6B4A2E'; g.fillRect(bx - 43, by - 15, 86, 12); g.fillStyle = '#8A6A44'; g.fillRect(bx - 43, by - 15, 86, 2); g.fillStyle = '#4A3524'; for (let i = -36; i < 40; i += 12) g.fillRect(bx + i, by - 12, 1, 9);
      g.fillStyle = '#17121f'; g.fillRect(bx - 2, by - 70, 4, 56); g.fillStyle = '#5A3E28'; g.fillRect(bx - 1, by - 69, 2, 54);
      const inf = Math.sin(Tm * 0.9) * 3; g.fillStyle = '#17121f'; g.beginPath(); g.moveTo(bx + 2 * vira, by - 66); g.lineTo(bx + (30 + inf) * vira, by - 40); g.lineTo(bx + 2 * vira, by - 20); g.fill();
      g.fillStyle = '#E8E2CF'; g.beginPath(); g.moveTo(bx + 3 * vira, by - 63); g.lineTo(bx + (27 + inf) * vira, by - 40); g.lineTo(bx + 3 * vira, by - 23); g.fill(); g.fillStyle = '#C9B88A'; g.fillRect(bx + 3 * vira, by - 44, Math.round(18 * vira), 1);
      g.fillStyle = Math.floor(Tm * 2) % 2 ? '#FFD86A' : '#FFB84A'; g.fillRect(bx + 36 * vira, by - 24, 3, 3); return true; }
  }
}
function pintarObjeto(g, o, G, x, y, Tm) {
  const tm = G.tm;
  switch (o.tipo) {
    case 'canteiro': { // terra: mato, arada, molhada; a planta cresce em fases (broto, folhas, madura)
      const S = G.cm.sitio, c = S?.canteiros?.[o.idx] || { estado: 'mato' }, hoje = Math.floor((G.cm.relogio || 0) / 600), molhado = c.regado === hoje, R2 = (a, b, w, h, cc) => { g.fillStyle = cc; g.fillRect(x + a, y + b, w, h); };
      R2(-14, -5, 28, 5, '#17121f'); R2(-13, -4, 26, 4, c.estado === 'mato' ? '#5A4A2E' : molhado ? '#4A3220' : '#7A5A36'); if (c.estado !== 'mato') for (let i = -11; i < 12; i += 4) R2(i, -4, 2, 1, molhado ? '#3A2618' : '#9A7A4E');
      if (c.estado === 'mato') { g.fillStyle = '#4A7A3A'; for (const i of [-10, -5, 1, 6, 10]) { g.fillRect(x + i, y - 8, 1, 4); g.fillRect(x + i + 1, y - 7, 1, 3); } return true; }
      if (c.estado !== 'plantado') return true;
      const P = c.planta, fase = c.pronto ? 3 : Math.min(2, Math.floor((c.cresceu || 0) / (P === 'videira' ? 2 : 1)));
      if (P === 'trigo' || P === 'lentilha') { const cor1 = c.pronto ? '#E8C24A' : fase >= 1 ? '#6FB84A' : '#8ED46A', alt = [3, 7, 11, 13][fase]; for (const i of [-9, -5, -1, 3, 7]) { g.fillStyle = cor1; g.fillRect(x + i, y - 4 - alt, 1, alt); if (fase >= 2) g.fillRect(x + i - 1, y - 4 - alt, 3, 2); if (c.pronto) { g.fillStyle = '#C9A03A'; g.fillRect(x + i, y - 6 - alt, 1, 3); } } }
      else { g.fillStyle = '#6B4A2E'; g.fillRect(x - 1, y - 24, 2, 20); g.fillRect(x - 8, y - 22, 16, 1); if (fase >= 1) { g.fillStyle = '#3F8A3A'; for (const [a, b] of [[-8, -24], [-3, -20], [4, -23], [6, -17], [-6, -14]].slice(0, fase * 2 + 1)) g.fillRect(x + a, y + b, 4, 3); } if (c.pronto) { g.fillStyle = '#7A3A9A'; for (const [a, b] of [[-6, -19], [3, -18]]) { g.fillRect(x + a, y + b, 3, 4); g.fillRect(x + a + 1, y + b + 4, 1, 2); } } }
      if (c.pronto) { g.fillStyle = Math.floor(Tm * 3) % 2 ? '#FFE9A8' : '#FFFFFF'; g.fillRect(x - 1, y - 32, 2, 2); }
      return true; }
    case 'animal': { // galinha, cabra e ovelha andando; um balãozinho de som de vez em quando
      const v = o.vv, xx = x + Math.round((v.x - o.x) / PX), k = v.estado === 'indo' ? Math.floor(Tm * 8) % 2 : 0, S = G.cm.sitio?.animais?.[o.i];
      const s = sprObj('bicho_' + o.especie + k, 24, 18, s => {
        if (o.especie === 'galinha') { const B = rampa('#F2EEE6'); s.bola(10, 11, 5, 4, B); s.bola(15, 7, 2.6, 2.6, B); s.ret(16, 3, 2, 2, cor('#E2463C')); s.ret(18, 7, 2, 1, cor('#F2C14E')); s.px(16, 6, TINTA); s.ret(4, 8, 3, 3, B[2]); s.ret(9, 15, 1, 3 - k, cor('#E8A040')); s.ret(12, 15, 1, 2 + k, cor('#E8A040')); }
        else if (o.especie === 'cabra') { const B = rampa('#8A6A4E'); s.bola(10, 9, 7, 3.6, B); s.bola(18, 6, 3, 2.6, B); s.ret(17, 1, 1, 4, cor('#C9B88A')); s.ret(19, 1, 1, 4, cor('#C9B88A')); s.px(19, 5, TINTA); s.ret(20, 9, 1, 2, B[1]); s.ret(3, 6, 2, 3, B[2]); for (const [lx, o2] of [[5, k], [8, 1 - k], [13, k], [15, 1 - k]]) s.ret(lx, 12 + o2, 2, 5 - o2, B[1]); s.ret(6, 10, 9, 1, B[3]); }
        else { const L = rampa('#EDE8DC'), F = rampa('#3A3030'); s.bola(10, 9, 8, 4.8, L); for (let i = 0; i < 6; i++) s.bola(4 + i * 3, 6 + (i % 2), 2.4, 2, L, 0.3, -0.8); s.bola(19, 8, 3, 2.6, F); s.px(20, 7, cor('#FFFFFF')); s.ret(17, 6, 2, 2, F[2]); for (const [lx, o2] of [[5, k], [8, 1 - k], [13, k], [15, 1 - k]]) s.ret(lx, 13 + o2, 2, 4 - o2, F[2]); } });
      carimbar(g, s, xx, y + 1, 12, 17, v.face || 1);
      if (S?.pronto > 0) { g.fillStyle = '#17121f'; g.fillRect(xx - 4, y - 28, 9, 9); g.fillStyle = '#F4F1E6'; g.fillRect(xx - 3, y - 27, 7, 7); g.fillStyle = o.especie === 'galinha' ? '#E8D8B0' : o.especie === 'cabra' ? '#FFFFFF' : '#C9C4B2'; g.fillRect(xx - 1, y - 25, 3, 3); }
      else if (v.som > 0) { g.fillStyle = '#17121f'; g.fillRect(xx + 6, y - 24, 16, 7); g.fillStyle = '#F4F1E6'; g.fillRect(xx + 7, y - 23, 14, 5); g.fillStyle = '#5A4A3A'; g.fillRect(xx + 9, y - 22, 10, 1); g.fillRect(xx + 9, y - 20, 7, 1); }
      return true; }
    case 'cesto': { const s = sprObj('cesto', 22, 16, s => { const V = rampa('#B8864A'); s.bola(11, 10, 9, 5, V); s.ret(3, 6, 16, 2, V[3]); for (let i = 4; i < 19; i += 3) s.ret(i, 7, 1, 7, V[1]); s.linha(4, 6, 11, 0, 1, V[2]); s.linha(18, 6, 11, 0, 1, V[2]); }); carimbar(g, s, x, y, 11, 15); return true; }
    case 'maquina': { const q = o.qual, m = G.cm.sitio?.maq?.[q];
      if (q === 'forno') { const s = sprObj('forno', 30, 24, s => { const B = rampa('#B8744C'); s.bola(15, 16, 13, 10, B); s.ret(2, 20, 26, 4, B[1]); s.bola(15, 18, 5, 5, rampa('#2A1A12')); s.ret(13, 2, 4, 6, B[2]); }); carimbar(g, s, x, y, 15, 23); if (Math.floor(Tm * 4) % 2) { g.fillStyle = '#FF9A3C'; g.fillRect(x - 2, y - 7, 4, 2); } }
      else if (q === 'prensa') { const s = sprObj('prensa', 40, 30, s => { const P2 = rampa('#9A9488'), M = rampa('#6B4A2E'); s.bola(14, 22, 11, 6, P2); s.bola(14, 16, 7, 5, P2); s.ret(18, 4, 3, 22, M[2]); s.ret(2, 6, 36, 3, M[3]); s.ret(34, 9, 2, 16, M[1]); s.ret(32, 22, 6, 5, P2[2]); }); carimbar(g, s, x, y, 20, 29); }
      else { const s = sprObj('lagar_sitio', 44, 24, s => { const P2 = rampa('#B8A88E'), U = rampa('#6A2E7A'); s.ret(2, 8, 40, 14, P2[2]); s.ret(2, 8, 40, 2, P2[4]); s.ret(5, 10, 34, 6, U[2]); for (let i = 7; i < 37; i += 5) s.bola(i, 11, 2, 1.6, U); s.ret(38, 18, 4, 2, P2[1]); s.ret(36, 20, 6, 4, P2[3]); }); carimbar(g, s, x, y, 22, 23); }
      if (m) { g.fillStyle = m.feito ? '#FFE9A8' : '#C9B88A'; const t = m.feito ? '✓' : '…'; g.fillRect(x - 1, y - 36 - (m.feito ? Math.floor(Tm * 3) % 2 : 0), 3, 3); }
      return true; }
    case 'pomar': { const pronta = G.cm.sitio?.pomar?.[o.idx]?.pronto !== false, s = sprObj('pomar' + (pronta ? 1 : 0), 40, 46, s => { const T2 = rampa('#6B4A2E'), F = rampa('#5A7A4A'); s.ret(18, 26, 5, 20, T2[1]); s.linha(20, 30, 10, 20, 2, T2[1]); for (let i = 0; i < 9; i++) s.bola(8 + (i * 11) % 26, 10 + (i * 7) % 16, 7, 5, F, 0.4, -0.8); if (pronta) for (let i = 0; i < 12; i++) s.ret(6 + (i * 13) % 28, 8 + (i * 5) % 18, 2, 2, cor('#3A4A1A')); }); carimbar(g, s, x, y, 20, 45); return true; }
    case 'cocho': { const s = sprObj('cocho', 28, 12, s => { const M = rampa('#7A4E2E'); s.ret(1, 3, 26, 7, M[2]); s.ret(1, 3, 26, 1, M[4]); s.ret(3, 4, 22, 3, M[0]); s.ret(2, 10, 3, 2, M[1]); s.ret(23, 10, 3, 2, M[1]); }); carimbar(g, s, x, y, 14, 11); if (G.cm.sitio?.cocho === Math.floor((G.cm.relogio || 0) / 600)) { g.fillStyle = '#E8C24A'; g.fillRect(x - 10, y - 9, 20, 2); } return true; }
    case 'galinheiro': { const s = sprObj('galinheiro', 48, 40, s => { const M = rampa('#8A5A36'), Tt = rampa('#9A3E2A'); s.ret(6, 14, 36, 24, M[2]); for (let i = 8; i < 42; i += 5) s.ret(i, 14, 1, 24, M[1]); s.ret(18, 24, 12, 14, cor('#2A1A12')); for (let k = 0; k < 12; k++) s.ret(2 + k * 2, 14 - k, 44 - k * 4, 1, Tt[2]); s.ret(34, 30, 10, 2, M[3]); s.linha(34, 38, 44, 30, 1, M[3]); }); carimbar(g, s, x, y, 24, 39); return true; }
    case 'espantalho': { const s = sprObj('espantalho', 26, 44, s => { const M = rampa('#6B4A2E'), P2 = rampa('#C9A06A'), R2 = rampa('#8E3B4A'); s.ret(12, 10, 2, 34, M[2]); s.ret(2, 16, 22, 2, M[2]); s.bola(13, 8, 5, 5, P2); s.ret(6, 2, 14, 3, M[3]); s.ret(9, 0, 8, 3, M[3]); s.bola(13, 22, 6, 7, R2); s.px(11, 7, TINTA); s.px(15, 7, TINTA); s.ret(0, 14, 3, 6, P2[2]); s.ret(23, 14, 3, 6, P2[2]); }); carimbar(g, s, x, y, 13, 43); return true; }
    case 'cerca': { const w = ((o.ate || o.col) - o.col) * 16; g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 15, w + 2, 2); g.fillRect(x - 1, y - 8, w + 2, 2); g.fillStyle = '#8A6A44'; g.fillRect(x, y - 14, w, 1); g.fillRect(x, y - 7, w, 1); for (let i = 0; i <= w; i += 16) { g.fillStyle = '#17121f'; g.fillRect(x + i - 2, y - 18, 4, 18); g.fillStyle = '#9A7A4E'; g.fillRect(x + i - 1, y - 17, 2, 17); } return true; }
    case 'menora': { const ac = !!o.acesa; g.fillStyle = '#17121f'; g.fillRect(x - 15, y - 40, 31, 42); g.fillStyle = '#C9A63C'; g.fillRect(x - 1, y - 36, 3, 34); g.fillRect(x - 8, y - 3, 17, 3); g.fillRect(x - 13, y - 22, 27, 2);
      for (let b = 1; b <= 3; b++) for (const sg of [-1, 1]) { g.fillRect(x + sg * b * 4, y - 36, 2, 15); } g.fillStyle = ac ? '#FFE9A8' : '#4A4A58'; for (let b = -3; b <= 3; b++) { const f = ac ? Math.floor(Tm * 8 + b) % 2 : 0; g.fillRect(x + b * 4, y - 40 - f, 2, 3 + f); }
      if (ac) { g.globalAlpha = 0.14; g.fillStyle = '#FFD98A'; g.fillRect(x - 30, y - 60, 60, 60); g.globalAlpha = 1; } else { g.fillStyle = '#6A6A78'; for (let i = 0; i < 6; i++) g.fillRect(x - 12 + i * 5, y - 30 + (i % 3) * 7, 1, 1); } return true; }
    case 'amendoeira': { // a árvore grande de copa florida (rosa e branca; no porto, verde com flores amarelas), com pétalas caindo
      const v = !!o.verde, s = sprObj('amendoeira' + (v ? 'v' : ''), 130, 112, s => {
        const T2 = rampa(v ? '#6B4A2E' : '#5A3A2A'), F = v ? ['#2E6A3A', '#3F8A3A', '#6FB84A', '#A8D86A', '#F2E27A'].map(cor) : ['#9A3A6A', '#C85A8A', '#E88AAE', '#F4B8CE', '#FFF0F4'].map(cor);
        s.ret(60, 60, 10, 52, T2[1]); s.ret(62, 60, 3, 52, T2[3]); s.linha(64, 70, 34, 44, 5, T2[1]); s.linha(66, 66, 96, 40, 4, T2[1]); s.linha(64, 84, 46, 70, 3, T2[2]); s.ret(52, 106, 26, 6, T2[1]);
        for (let i = 0; i < 46; i++) { const a = (i * 137.5) * Math.PI / 180, r = 8 + (i % 9) * 5.4, cx = 65 + Math.cos(a) * r * 1.35, cy = 40 + Math.sin(a) * r * 0.75, R = 9 + (i % 4) * 2; s.bola(cx, cy, R, R * 0.8, F, 0.4, -0.7); }
        for (let i = 0; i < 70; i++) s.px(10 + (i * 53) % 110, 6 + (i * 29) % 64, F[4]); });
      carimbar(g, s, x, y, 65, 111);
      g.fillStyle = o.verde ? '#F2E27A' : '#F4B8CE'; for (let i = 0; i < 10; i++) { const t = (Tm * 0.18 + i / 10) % 1, px = x - 50 + ((i * 37) % 100) + Math.sin(Tm * 2 + i) * 6 + t * 20, py = y - 70 + t * 70; g.fillRect(Math.round(px), Math.round(py), 2, 1); }
      return true; }
    case 'banco': { const s = sprObj('banco', 30, 14, s => { const M = rampa('#7A4E2E'); s.ret(1, 4, 28, 3, M[3]); s.ret(1, 4, 28, 1, M[4]); s.ret(2, 0, 26, 3, M[2]); s.ret(3, 7, 3, 7, M[1]); s.ret(24, 7, 3, 7, M[1]); s.ret(1, 7, 28, 1, M[0]); }); carimbar(g, s, x, y, 15, 13); return true; }
    case 'lampiao': { g.fillStyle = '#17121f'; g.fillRect(x - 2, y - 44, 4, 44); g.fillStyle = '#3A3A4A'; g.fillRect(x - 1, y - 44, 2, 44); g.fillRect(x - 5, y - 2, 10, 2); g.fillStyle = '#17121f'; g.fillRect(x - 5, y - 56, 10, 12); g.fillStyle = '#FFD98A'; g.fillRect(x - 4, y - 54, 8, 9); g.fillStyle = '#FFF4C8'; g.fillRect(x - 1, y - 52, 2, 5); g.fillStyle = '#2A2A3A'; g.fillRect(x - 6, y - 58, 12, 3); g.globalAlpha = 0.12; g.fillStyle = '#FFD98A'; g.fillRect(x - 18, y - 66, 36, 30); g.globalAlpha = 1; return true; }
    case 'fogueira': { // pedras em roda, lenha cruzada, chamas que dançam, faíscas que sobem e dois troncos para sentar
      const s = sprObj('fogueira', 64, 16, s => { const P2 = rampa('#8E8A98'), M = rampa('#6B4A2E'); for (let i = 0; i < 9; i++) s.bola(18 + i * 3.5, 12 + Math.abs(i - 4) * -0.4, 2.5, 2, P2); s.linha(22, 13, 42, 7, 3, M[1]); s.linha(22, 7, 42, 13, 3, M[2]); s.ret(0, 9, 12, 6, M[2]); s.ret(0, 9, 12, 1, M[4]); s.bola(11, 12, 2, 3, rampa('#C9A06A')); s.ret(52, 9, 12, 6, M[2]); s.ret(52, 9, 12, 1, M[4]); s.bola(52, 12, 2, 3, rampa('#C9A06A')); });
      carimbar(g, s, x, y, 32, 15);
      const f = Math.floor(Tm * 10); for (let i = -2; i <= 2; i++) { const h = 10 + ((f + i * 3) % 4) * 2 - Math.abs(i) * 3; g.fillStyle = '#E2463C'; g.fillRect(x + i * 2 - 1, y - 6 - h, 3, h); g.fillStyle = '#FF9A3C'; g.fillRect(x + i * 2, y - 6 - h * 0.8, 2, h * 0.8); g.fillStyle = '#FFE08A'; if (Math.abs(i) < 2) g.fillRect(x + i * 2, y - 6 - h * 0.5, 1, h * 0.5); }
      g.fillStyle = '#FFD86A'; for (let i = 0; i < 5; i++) { const t = (Tm * 0.8 + i / 5) % 1; g.fillRect(Math.round(x - 4 + ((i * 7) % 9) + Math.sin(Tm * 4 + i) * 3), Math.round(y - 16 - t * 30), 1, 1); }
      g.globalAlpha = 0.14; g.fillStyle = '#FF9A3C'; g.fillRect(x - 30, y - 28, 60, 28); g.globalAlpha = 1; return true; }
    case 'vaso': { const s = sprObj('vaso' + (o.quebrado ? 'q' : ''), 14, 16, s => { if (o.quebrado) { s.ret(2, 13, 4, 2, BARRO[1]); s.ret(8, 14, 3, 1, BARRO[2]); s.px(6, 14, BARRO[0]); return; } s.bola(7, 9, 5, 5.5, BARRO); s.ret(4, 2, 6, 2, BARRO[3]); s.ret(5, 4, 4, 1, BARRO[1]); s.ret(3, 8, 8, 1, BARRO[0]); for (let i = 3; i < 11; i += 2) s.px(i, 9, BARRO[4]); }); carimbar(g, s, x, y, 7, 15); return true; }
    case 'rolo': { const s = sprObj('rolo' + (o.feito ? 'f' : ''), 26, 30, s => { s.ret(11, 14, 4, 13, MADEIRA[1]); s.ret(12, 14, 1, 13, MADEIRA[3]); s.ret(7, 26, 12, 2, MADEIRA[2]); s.ret(7, 26, 12, 1, MADEIRA[3]); s.poli([[3, 12], [22, 8], [23, 11], [4, 15]], MADEIRA[2]);
      const P = o.feito ? rampa('#FFF1C4') : PAPEL; s.poli([[5, 6], [20, 2], [21, 8], [6, 12]], P[2]); s.linha(5, 6, 20, 2, 1, P[4]); for (let k = 0; k < 3; k++) s.linha(8, 8 + k * 2 - 1, 17 - k * 2, 5 + k * 2 - 1, 1, MADEIRA[0]); s.bola(4, 9, 2.2, 3.2, MADEIRA); s.bola(21, 5, 2.2, 3.2, MADEIRA); }); carimbar(g, s, x, y, 13, 28);
      if (o.feito) chama(g, x, y - 34 + (Math.floor(Tm * 3) % 2), Tm); else { g.fillStyle = Math.floor(Tm * 3) % 2 ? tm.acento : '#fff'; g.fillRect(x - 1, y - 36 + (Math.floor(Tm * 2) % 2), 2, 2); } return true; }
    case 'estacao': { const s = sprObj('est' + (o.feito ? 'f' : ''), 18, 28, s => { const R = rampa(o.feito ? '#7FD8BE' : '#D7C08A'); s.poli([[3, 27], [6, 18], [11, 18], [14, 27]], PEDRA[1]); s.linha(6, 18, 11, 18, 1, PEDRA[3]); for (let k = 0; k <= 6; k++) { s.ret(8 - k, 3 + k, k * 2 + 2, 1, k < 2 ? R[4] : R[3 - (k > 4 ? 1 : 0)]); s.ret(8 - k, 15 - k, k * 2 + 2, 1, R[k > 3 ? 2 : 1]); } s.ret(8, 8, 2, 2, BRANCO); }); carimbar(g, s, x, y + (o.feito ? 0 : Math.round(Math.sin(Tm * 2.4 + o.x) * 1.5)) * 0, 9, 27); return true; }
    case 'ebenezer': { const aceso = G.cm.ebenezer?.area === G.area, s = sprObj('eben', 26, 36, s => { s.poli([[4, 35], [6, 10], [11, 2], [18, 6], [22, 35]], PEDRA[2]); s.poli([[4, 35], [6, 10], [9, 6], [10, 35]], PEDRA[3]); s.poli([[17, 8], [18, 6], [22, 35], [18, 35]], PEDRA[1]); s.linha(6, 10, 11, 2, 1, PEDRA[4]); for (const yy of [14, 19, 24]) s.linha(11, yy, 16, yy, 1, PEDRA[0]); s.ret(1, 32, 5, 3, PEDRA[1]); s.ret(21, 31, 4, 4, PEDRA[1]); s.px(8, 30, rampa('#5F8A5C')[2]); s.px(9, 31, rampa('#5F8A5C')[1]); }); carimbar(g, s, x, y, 13, 35);
      if (aceso) { chama(g, x - 1, y - 38, Tm, 1); g.fillStyle = '#FFE9A8'; for (const yy of [21, 16, 11]) g.fillRect(x - 2, y - yy, 5, 1); } return true; }
    case 'portal': case 'saida': case 'retorno': {
      if (o.porta) return true; // porta desenhada no próprio prédio
      const sem = o.semana ? TODAS.find(s => s.id === o.semana) : null, m = o.mundo ? MUNDO[o.mundo] : null;
      const c = o.tipo === 'saida' ? '#FFE9A8' : o.tipo === 'retorno' ? '#9DB9C7' : o.area ? '#B8E6A0' : m ? '#E58A6A' : ['#FFD23F', '#79D9CD', '#F1C96A', '#C79BFF'][TODAS.indexOf(sem) % 4];
      pintarConstrucao(g, visualPortal(o), o, x, y, Tm, c); return true; // as passagens são construções do mundo
      const s = sprObj('portal', 38, 48, s => { for (let yy = 0; yy < 48; yy++) for (let xx = 0; xx < 38; xx++) { const d = yy < 19 ? Math.hypot(xx - 18.5, yy - 19) : Math.abs(xx - 18.5); if (d <= 18.5 && d > 12.5) s.px(xx, yy, xx < 8 ? PEDRA[3] : xx > 30 ? PEDRA[1] : (yy % 8 === 0 || (yy < 19 && (xx + yy) % 9 === 0)) ? PEDRA[0] : PEDRA[2]); } s.ret(0, 44, 7, 4, PEDRA[1]); s.ret(31, 44, 7, 4, PEDRA[1]); });
      // véu de luz dentro do arco, pontilhado e subindo
      const R = rampa(c); for (let yy = 0; yy < 46; yy++) for (let xx = -12; xx <= 12; xx++) { const dn = yy < 17 ? Math.hypot(xx, 17 - yy) : Math.abs(xx); if (dn > 12) continue; const k = yy / 46; if (pontilha(xx + 40, yy + Math.floor(Tm * 14), 0.9 - k * 0.65)) { g.fillStyle = k < 0.3 ? '#FFFFFF' : k < 0.6 ? c : mistura(c, '#101828', 0.5); g.fillRect(x + xx, y - 46 + yy, 1, 1); } }
      carimbar(g, s, x, y, 19, 47); void R; return true; }
    case 'segredo': { const f = Math.round(Math.sin(Tm * 3 + o.x) * 2), tipo = o.item === 'pedra' ? 'p' : o.item === 'mana' ? 'm' : 'b', s = sprObj('seg' + tipo, 12, 12, s => { if (tipo === 'p') s.bola(6, 6, 4.5, 3.5, rampa('#B9B4A2')); else if (tipo === 'm') { s.bola(6, 6, 3.5, 3.5, rampa('#F4E6BC')); s.px(5, 4, BRANCO); } else { s.bola(6, 7, 4, 3.5, MADEIRA); s.ret(4, 2, 4, 2, OURO[3]); } }); carimbar(g, s, x, y - 8 + f, 6, 6); if (Math.floor(Tm * 4 + o.x) % 3 === 0) { g.fillStyle = '#fff'; g.fillRect(x + 5, y - 15 + f, 1, 1); g.fillRect(x - 6, y - 5 + f, 1, 1); } return true; }
    case 'sacola': { const s = sprObj('sacola', 12, 13, s => { s.bola(6, 8, 4.5, 4, MADEIRA); s.ret(4, 2, 4, 2, OURO[3]); s.px(6, 8, OURO[4]); }); carimbar(g, s, x, y, 6, 12); if (Math.floor(Tm * 5) % 2) { g.fillStyle = '#FFD23F'; g.fillRect(x - 6, y - 16, 1, 1); g.fillRect(x + 5, y - 13, 1, 1); } return true; }
    case 'morador': { // gente da aldeia, indo e vindo
      if (o.vv?.estado === 'dentro') return true; // entrou na sinagoga
      if (o.vv && !(o.escondido > G.T)) { const v = o.vv, xx = x + Math.round((v.x - o.x) / PX), anda = v.estado === 'indo' || v.estado === 'susto', pose = v.estado === 'acena' ? 'mao' : anda ? 'anda' : v.estado === 'orando' ? 'ora' : v.estado === 'casa' && (hora(G) >= 22 || hora(G) < 5) ? 'dorme' : null;
        carimbar(g, quadroPessoa({ ...o.look, cls: null }, anda ? Tm * 2.4 : Tm * 0.6, 'mv' + o.x + (pose || ''), pose), xx, y - (v.estado === 'susto' ? 2 : 0), 24, 40, v.face || 1);
        if (o.patrulha && periodo(G) === 'noite') { const tx2 = xx + (v.face || 1) * 7, fl = Math.floor(G.T * 10) % 3; g.fillStyle = '#5A3A1C'; g.fillRect(tx2, y - 24, 2, 12); g.fillStyle = '#FF8A2A'; g.fillRect(tx2 - 1, y - 28 - fl, 4, 4 + fl); g.fillStyle = '#FFE08A'; g.fillRect(tx2, y - 26, 2, 2); g.globalAlpha = 0.12; g.fillStyle = '#FFB86A'; g.fillRect(tx2 - 14, y - 40, 30, 40); g.globalAlpha = 1; } /* a ronda da noite leva tocha */
        if (v.emoteT > 0 && v.emote) { const ey = y - 34 - Math.round(Math.min(1, (2 - v.emoteT) * 4)) ; g.fillStyle = '#17121f'; g.fillRect(xx - 6, ey - 9, 13, 10); g.fillRect(xx - 1, ey + 1, 3, 2); g.fillStyle = '#F4F1E6'; g.fillRect(xx - 5, ey - 8, 11, 8); g.fillStyle = v.emote === '♥' ? '#E2466A' : v.emote === '!' ? '#E2463C' : '#5A4A3A';
          const E = { '♥': ['.X.X.', 'XXXXX', '.XXX.', '..X..'], '!': ['..X..', '..X..', '..X..', '.....', '..X..'], '♪': ['..XX.', '..X.X', '..X..', 'XXX..', 'XX...'], '…': ['.....', '.....', 'X.X.X'], '☀': ['X.X.X', '.XXX.', 'XXXXX', '.XXX.', 'X.X.X'] }[v.emote] || [];
          E.forEach((ln, r) => [...ln].forEach((ch, k) => { if (ch === 'X') g.fillRect(xx - 2 + k, ey - 7 + r + (E.length < 5 ? 1 : 0), 1, 1); })); }
        return true; }
      if (o.escondido > G.T) return true; // em Sardes, às vezes o vizinho não era gente
      const vai = (o.vai || 3) * 32, f = Math.sin(Tm * 0.35 + o.x), dx = Math.round(f * vai / PX), parado = Math.abs(Math.cos(Tm * 0.35 + o.x)) < 0.25;
      carimbar(g, quadroPessoa({ ...o.look, cls: null }, parado ? 0 : Tm * 2.2, 'm' + o.x), x + dx, y - (parado ? 0 : Math.floor(Tm * 6) % 2), 24, 40, Math.cos(Tm * 0.35 + o.x) >= 0 ? 1 : -1); return true; }
    case 'ave': { // pombas que levantam voo quando o peregrino chega perto
      const perto = Math.abs(G.p.x - o.x) < 110 && Math.abs(G.p.y - o.y) < 120; if (perto && !o.voo) o.voo = Tm; if (o.voo && Tm - o.voo > 9) o.voo = 0;
      const t = o.voo ? Tm - o.voo : 0, bx = x + Math.round(t * 46 * (o.x % 2 ? 1 : -1)), by = y - 2 - Math.round(t * 34 + Math.sin(t * 9) * 2), asa = o.voo ? Math.floor(Tm * 14) % 2 : 0; if (t > 4) return true;
      g.fillStyle = '#17121f'; g.fillRect(bx - 3, by - 3, 7, 4); g.fillStyle = '#D9D2C5'; g.fillRect(bx - 2, by - 2, 5, 2); g.fillStyle = '#9FB0C0'; g.fillRect(bx - 2, by - (asa ? 5 : 2), 3, asa ? 3 : 1); g.fillStyle = '#F2C14E'; g.fillRect(bx + 3, by - 2, 1, 1);
      if (!o.voo && Math.floor(Tm * 1.5 + o.x) % 4 === 0) g.fillRect(bx + 3, by - 1, 1, 1); return true; }
    case 'flor': { if (G.cm.flores?.[o.x] === Math.floor((G.cm.relogio || 0) / 600)) { g.fillStyle = '#3F6A3A'; g.fillRect(x, y - 4, 1, 4); return true; } // colhida hoje: fica o talo
      const b = Math.round(Math.sin(Tm * 1.6 + o.x) * 0.6), cores = ['#E86A8A', '#F2D06A', '#B88AE8', '#F2F0E8'], c = cores[Math.floor(o.x / 32) % 4];
      g.fillStyle = '#2E5A2E'; g.fillRect(x, y - 8, 1, 8); g.fillRect(x - 2, y - 4, 2, 1); g.fillStyle = '#17121f'; g.fillRect(x - 3 + b, y - 13, 7, 6); g.fillStyle = c; g.fillRect(x - 2 + b, y - 12, 5, 4); g.fillRect(x - 1 + b, y - 13, 3, 6); g.fillStyle = '#FFE08A'; g.fillRect(x + b, y - 11, 1, 2); return true; }
    case 'fruto': { if (o.volta > Tm) return true; const b = Math.round(Math.sin(Tm * 2 + o.x) * 1); g.fillStyle = '#17121f'; g.fillRect(x - 3, y - 9 + b, 6, 7); g.fillStyle = '#8E3B5E'; g.fillRect(x - 2, y - 8 + b, 4, 5); g.fillStyle = '#C56A8A'; g.fillRect(x - 2, y - 8 + b, 1, 2); g.fillStyle = '#3F7A4A'; g.fillRect(x, y - 11 + b, 1, 2); return true; }
    case 'poco': { g.fillStyle = '#17121f'; g.fillRect(x - 12, y - 14, 24, 14); g.fillRect(x - 13, y - 40, 3, 28); g.fillRect(x + 10, y - 40, 3, 28); g.fillRect(x - 15, y - 44, 30, 5); g.fillStyle = '#6E6A78'; g.fillRect(x - 11, y - 13, 22, 12); g.fillStyle = '#8E8A98'; for (let i = 0; i < 4; i++) g.fillRect(x - 10 + i * 6, y - 12 + (i % 2) * 5, 4, 3); g.fillStyle = '#6B4A2E'; g.fillRect(x - 12, y - 39, 1, 26); g.fillRect(x + 11, y - 39, 1, 26); g.fillRect(x - 14, y - 43, 28, 3); g.fillStyle = '#C9C3AE'; g.fillRect(x, y - 40, 1, 20); g.fillStyle = '#8A5A3A'; g.fillRect(x - 2, y - 22, 5, 5); g.fillStyle = Math.floor(Tm * 3) % 2 ? '#BFF0F8' : '#7FD4E4'; g.fillRect(x - 9, y - 15, 18, 2); return true; }
    case 'boneco': { const bal = o.bal > 0 ? Math.round(Math.sin(Tm * 40) * 3 * (o.dir || 1)) : 0; if (o.bal > 0) o.bal -= 0.016; g.fillStyle = '#17121f'; g.fillRect(x - 2, y - 30, 4, 30); g.fillRect(x - 9 + bal, y - 30, 18, 18); g.fillRect(x - 5 + bal, y - 40, 10, 11); g.fillRect(x - 13 + bal, y - 26, 26, 3); g.fillStyle = '#6B4A2E'; g.fillRect(x - 1, y - 12, 2, 12); g.fillRect(x - 12 + bal, y - 25, 24, 1); g.fillStyle = '#C9A86A'; g.fillRect(x - 8 + bal, y - 29, 16, 16); g.fillRect(x - 4 + bal, y - 39, 8, 9); g.fillStyle = '#8A7A3A'; for (let i = 0; i < 4; i++) g.fillRect(x - 7 + bal + i * 4, y - 27 + (i % 2) * 6, 2, 4); g.fillStyle = '#B03A2E'; g.fillRect(x - 2 + bal, y - 23, 4, 4); return true; }
    case 'casa': { // casa de adobe de teto plano (anda-se por cima): porta, janela acesa, parapeito e um sinal de quem mora ali
      const tom = { estalagem: '#8A6A4E', marta: '#9A8468', oleiro: '#7E5E4A', viuva: '#8C7A66' }[o.id] || '#8A7460';
      const sp = sprObj('casa' + o.id, 68, 58, s => { const A = rampa(tom), M = rampa('#5A3E28'), J = rampa('#FFD98A');
        s.ret(2, 8, 64, 50, A[2]); for (let y = 8; y < 58; y++) { s.px(2, y, A[1]); s.px(3, y, A[1]); s.px(65, y, A[3]); }
        for (let i = 0; i < 60; i++) { const x = 4 + (i * 37) % 60, y = 12 + (i * 53) % 44; s.px(x, y, i % 3 ? A[1] : A[3]); if (i % 5 === 0) s.ret(x, y, 3, 1, A[1]); }
        s.ret(0, 4, 68, 5, A[3]); s.ret(0, 8, 68, 1, A[0]); for (let x = 1; x < 68; x += 8) s.ret(x, 1, 5, 3, A[2]); // parapeito
        for (let x = 6; x < 64; x += 9) s.ret(x, 11, 3, 2, M[1]); // vigas
        s.ret(26, 30, 14, 28, M[1]); s.ret(27, 31, 12, 27, M[2]); s.ret(32, 31, 1, 27, M[0]); s.px(37, 45, J[3]); s.ret(24, 28, 18, 2, A[4]); // porta
        s.ret(8, 24, 10, 10, M[0]); s.ret(9, 25, 8, 8, J[2]); s.ret(12, 25, 1, 8, M[0]); s.ret(9, 28, 8, 1, M[0]); s.ret(7, 34, 12, 1, A[4]);
        s.ret(50, 24, 8, 10, M[0]); s.ret(51, 25, 6, 8, J[1]);
        if (o.id === 'estalagem') { s.ret(44, 14, 16, 8, M[2]); s.ret(45, 15, 14, 6, M[3]); s.ret(48, 17, 3, 3, J[3]); s.ret(53, 17, 3, 3, J[3]); s.ret(51, 12, 1, 2, M[0]); }
        if (o.id === 'oleiro') for (const [x, c] of [[46, '#B5673C'], [52, '#C98A5A'], [58, '#9A5030']]) { const R2 = rampa(c); s.ret(x, 50, 5, 8, R2[2]); s.ret(x + 1, 48, 3, 2, R2[3]); s.px(x, 52, R2[1]); }
        if (o.id === 'marta') { s.ret(46, 52, 14, 6, M[2]); s.ret(47, 50, 4, 2, '#D9D2C5'); s.ret(54, 50, 4, 2, rampa('#C9A63C')[3]); }
        if (o.id === 'viuva') { s.ret(48, 50, 6, 8, rampa('#B5673C')[2]); s.ret(49, 48, 4, 2, rampa('#B5673C')[3]); s.ret(57, 52, 5, 6, rampa('#D9D2C5')[2]); } });
      carimbar(g, sp, x + 8, y, 34, 57); if (Math.floor(Tm * 3 + x) % 7 === 0) { g.fillStyle = '#FFE9A8'; g.fillRect(x - 15, y - 31, 1, 1); } return true; }
    case 'planta': { const q = o.qual;
      const sp = sprObj('planta' + q, 48, 72, s => { const Tr = rampa(q === 'palmeira' ? '#7A5A3A' : '#5E4630'), F = rampa(q === 'cipreste' ? '#2E5548' : q === 'palmeira' ? '#4E8A4A' : '#6E8A5E'), F2 = rampa(q === 'oliveira' ? '#4F6B4A' : '#2A4A3E');
        if (q === 'cipreste') { s.ret(22, 60, 4, 12, Tr[2]); for (let yy = 4; yy < 62; yy++) { const lg = Math.max(1, Math.round(Math.sin((yy - 4) / 58 * 2.6) * 8)); for (let xx = -lg; xx <= lg; xx++) s.px(24 + xx, yy, xx < -lg * 0.4 ? F[3] : (xx + yy) % 5 === 0 ? F2[1] : F[2]); } }
        else if (q === 'palmeira') { for (let yy = 16; yy < 72; yy++) { const xx = 24 + Math.round(Math.sin(yy * 0.05) * 3); s.ret(xx - 2, yy, 4, 1, yy % 5 === 0 ? Tr[1] : Tr[2]); s.px(xx + 1, yy, Tr[3]); }
          for (let k = 0; k < 7; k++) { const an = -Math.PI * (0.08 + k * 0.14), cx2 = 26, cy2 = 16; for (let t2 = 0; t2 < 22; t2++) { const px2 = cx2 + Math.cos(an) * t2, py2 = cy2 + Math.sin(an) * t2 * 0.7 + t2 * t2 * 0.03; s.ret(px2, py2, 2, 2, t2 % 3 ? F[2] : F[3]); if (t2 % 2) s.px(px2, py2 + 2, F2[1]); } } s.bola(25, 18, 2, 2, rampa('#8E5A2E')); }
        else { s.poli([[20, 71], [22, 50], [18, 40], [23, 38], [27, 50], [29, 71]], Tr[2]); s.linha(22, 46, 12, 34, 3, Tr[2]); s.linha(26, 46, 37, 32, 3, Tr[2]); s.linha(22, 60, 22, 70, 1, Tr[0]);
          for (const [bx, by, rx, ry, R2] of [[12, 28, 11, 9, F2], [37, 26, 10, 9, F2], [24, 20, 15, 12, F], [18, 22, 8, 7, F], [32, 18, 8, 7, F]]) s.bola(bx, by, rx, ry, R2, 0.4, -0.75);
          for (let i = 0; i < 26; i++) { const xx = 4 + (i * 37) % 40, yy = 10 + (i * 23) % 26; if (s.le(xx, yy)) s.px(xx, yy, F[4]); } } });
      carimbar(g, sp, x, y, 24, 71); return true; }
    case 'jesus': { // de joelhos sobre a pedra; uma luz mansa em volta, que não ofusca
      const al = o.alfa ?? 1; if (al <= 0) return true; const pedra = G.objs.find(r => r.tipo === 'rocha'), sobre = pedra && Math.abs(o.x - pedra.x) < 30, yy = y - (sobre ? 14 : 0); // só fica no alto em cima da pedra; andando, pisa no chão
      g.globalAlpha = 0.16 * al; g.fillStyle = '#FFF1BE'; for (let r = 30; r > 8; r -= 7) { for (let a = 0; a < 40; a++) { const an = a / 40 * TAU; if ((a + Math.floor(Tm * 3)) % 2) g.fillRect(Math.round(x + Math.cos(an) * r), Math.round(yy - 22 + Math.sin(an) * r * 0.9), 1, 1); } }
      g.globalAlpha = 0.07 * al; g.fillRect(x - 3, 0, 6, yy - 30); // um raio do alto (Lc 22:43)
      g.globalAlpha = al; carimbar(g, quadroPessoa(JESUS_LOOK, Tm, 'jesus-' + (o.pose || 'pe'), o.pose), x, yy, 24, 40, o.vira || 1); g.globalAlpha = 1; return true; }
    case 'discipulo': g.globalAlpha = o.alfa ?? 1; carimbar(g, quadroPessoa(o.look, Tm, 'disc-' + o.nome, o.acordado ? o.pose : 'dorme'), x, y, 24, 40, o.vira || 1); g.globalAlpha = 1;
      if (!o.acordado && Math.floor(Tm * 1.2 + o.x) % 3 === 0) { g.fillStyle = '#9AA6C8'; const zy = y - 34 - Math.floor((Tm * 6) % 6); g.fillRect(x + 8, zy, 3, 1); g.fillRect(x + 10, zy + 1, 1, 1); g.fillRect(x + 9, zy + 2, 1, 1); g.fillRect(x + 8, zy + 3, 3, 1); } return true;
    case 'rocha': { const sp = sprObj('rocha-getsemani', 56, 22, s => { const R = rampa('#6E6A78'); s.bola(28, 14, 26, 9, R, 0.3, -0.8); s.bola(16, 15, 12, 6, R, 0.3, -0.8); s.ret(4, 18, 48, 4, R[1]); for (let i = 0; i < 18; i++) s.px(6 + (i * 13) % 44, 10 + (i * 7) % 9, R[3]); const M = rampa('#3F6A4A'); for (let i = 0; i < 9; i++) s.px(5 + i * 5, 20 - (i % 2), M[2]); });
      carimbar(g, sp, x, y, 28, 21); return true; }
    case 'lagar': { const sp = sprObj('lagar', 72, 46, s => { const P = rampa('#8E8A98'), M = rampa('#6B4A2E'), A = rampa('#C9B23A');
        s.bola(36, 38, 32, 7, P, 0.3, -0.6); s.ret(6, 38, 60, 7, P[1]); s.ret(10, 37, 52, 2, P[3]); // a bacia
        for (let yy = 0; yy < 26; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, 169 - (yy - 13) ** 2))); s.ret(36 - 4, 10 + yy, 8, 1, yy % 5 ? P[2] : P[1]); s.px(32, 10 + yy, P[0]); s.px(39, 10 + yy, P[3]); } // a mó de pé
        s.bola(36, 23, 5, 13, P, 0.2, -0.6); s.ret(4, 20, 64, 4, M[2]); s.ret(4, 20, 64, 1, M[4]); s.ret(34, 18, 4, 8, M[1]); // a trave
        s.ret(64, 40, 8, 3, A[2]); s.ret(68, 42, 3, 3, A[3]); for (let i = 0; i < 6; i++) s.px(14 + i * 8, 34 - (i % 2), rampa('#3F5A3A')[2]); }); // o azeite na canaleta e azeitonas
      carimbar(g, sp, x, y, 36, 45); return true; }
    case 'biblia': { const b = Math.floor(Tm * 1.5) % 2; g.globalAlpha = 0.18; g.fillStyle = '#FFE9A8'; g.fillRect(x - 14, y - 16, 28, 16); g.globalAlpha = 1;
      g.fillStyle = '#17121f'; g.fillRect(x - 12, y - 8, 24, 8); g.fillStyle = '#6B2E2E'; g.fillRect(x - 11, y - 3, 22, 3); g.fillStyle = '#F1E9D2'; g.fillRect(x - 10, y - 8, 9, 5); g.fillRect(x + 1, y - 8, 9, 5); g.fillStyle = '#C9B88A'; for (let i = 0; i < 3; i++) { g.fillRect(x - 9, y - 7 + i * 1.5, 7, 1); g.fillRect(x + 2, y - 7 + i * 1.5, 7, 1); }
      g.fillStyle = '#B8423A'; g.fillRect(x, y - 8, 1, 7); if (b) { g.fillStyle = '#FFF1BE'; g.fillRect(x - 1, y - 12, 2, 2); } return true; }
    case 'tocha': { const f = Math.floor(Tm * 10 + (o.fase || 0) * 5) % 2, d = o.vira || 1, bx = x, by = y, al = o.alfa ?? 1, R = (xx, yy, w, h) => g.fillRect(d > 0 ? bx + xx : bx - xx - w + 1, by + yy, w, h); // um soldado contra a luz da tocha
      if (al <= 0) return true; g.globalAlpha = al; g.fillStyle = '#05060B';
      if (o.caido) { R(-18, -8, 34, 7); R(-24, -10, 7, 6); R(14, -4, 12, 2); g.fillStyle = '#FF8A2A'; R(24, -7 + f, 4, 4); g.globalAlpha = 1; return true; } // caído de costas (Jo 18:6), a tocha no chão
      const passo = o.indo != null ? Math.floor(Tm * 8 + (o.fase || 0)) % 2 : 0;
      R(-4, -34, 9, 30); R(-4 + passo, -4, 3, 4); R(2 - passo, -4, 3, 4); R(-3, -40, 7, 6); R(-5, -42, 11, 3); R(4, -30, 6, 2); R(8, -44, 2, 16);
      g.fillStyle = '#FF8A2A'; R(7, -50 + f, 4, 6); g.fillStyle = '#FFD86A'; R(8, -48 + f, 2, 3); g.globalAlpha = 0.22 * al; g.fillStyle = '#FF8A2A'; for (let a = 0; a < 16; a++) R(9 + Math.round(Math.cos(a * 0.39 + Tm * 2) * 7), -47 + Math.round(Math.sin(a * 0.39 + Tm * 2) * 7), 1, 1); g.globalAlpha = 1; return true; } // um halo pontilhado em volta da chama (a luz de verdade vem de o.luz)
    case 'pessoa': { // Judas e Malco: gente de verdade no meio da escolta
      const al = o.alfa ?? 1; if (al <= 0) return true; g.globalAlpha = al; carimbar(g, quadroPessoa(o.look, Tm, 'p-' + o.nome, o.pose), x, y, 24, 40, o.vira || 1);
      if (o.ferido) { g.fillStyle = '#B8312A'; g.fillRect(x - (o.vira || 1) * 2, y - 33, 2, 3 + (Math.floor(Tm * 4) % 2)); } g.globalAlpha = 1; return true; }
    case 'anjo': { // quase invisíveis: só um tremor de luz no ar, que a lâmpada mostra um pouco mais
      const al = o.alfa ?? 0; if (al <= 0.01) return true; const p0 = G.p, lamp = p0.lamp && Math.hypot(o.x - p0.x, o.y - p0.y) < G.raioLuz() ? 1 : 0, k = al * (0.3 + 0.35 * lamp) * (0.7 + 0.3 * Math.sin(Tm * 3 + o.fase));
      const cy = y - Math.round(Math.sin(Tm * 1.3 + o.fase) * 2) - (o.curva ? -3 : 0); g.globalAlpha = k; g.fillStyle = '#F4F1FF';
      const tt = Math.floor(Tm * 6); for (let yy = -30; yy < 0; yy++) { const lg = 3 + Math.round((yy + 30) / 8); for (let xx = -lg; xx < lg; xx++) if ((xx + yy + tt) % 2 === 0 || Math.abs(xx) >= lg - 1) g.fillRect(x + xx, cy + yy, 1, 1); } // a veste, pontilhada como ar que tremula
      g.fillRect(x - 2, cy - 36 + (o.curva ? 3 : 0), 5, 5); // a cabeça (baixa quando se curva)
      for (const lado of [-1, 1]) for (let i = 0; i < 14; i++) { const ax = x + lado * (4 + i), ay = cy - 28 - Math.round(Math.sin(i / 14 * Math.PI) * 10) + i; if ((i + Math.floor(Tm * 8)) % 2) g.fillRect(ax, ay, 1, 3); } // as asas
      if (o.espada > 0.05) { g.globalAlpha = Math.min(1, k * 2.4); g.fillStyle = '#FFFFFF'; const L = Math.round(4 + o.espada * 16); g.fillRect(x + 6, cy - 22 - L, 1, L); g.fillStyle = '#FFE9A8'; g.fillRect(x + 4, cy - 22, 5, 1); } // a espada, meio desembainhada
      g.globalAlpha = 1; return true; }
    case 'mar': case 'barco': return true; // desenhados depois dos blocos (pintarAgua), por cima do chão
    // uma vela de rua (lampadário): apagada solta fumaça; acesa, chama e brilho
    case 'vela': { const aceso = !!G.cm.sar?.velas?.[o.id]; o.luz = aceso ? 130 : 0;
      g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 30, 3, 30); g.fillRect(x - 6, y - 2, 13, 2); g.fillRect(x - 5, y - 34, 11, 4); g.fillStyle = '#5A5668'; g.fillRect(x, y - 29, 1, 28); g.fillStyle = '#8E8A98'; g.fillRect(x - 4, y - 33, 9, 2);
      g.fillStyle = '#E8E2CF'; g.fillRect(x - 1, y - 39, 3, 6);
      if (aceso) { chama(g, x - 2, y - 45, Tm, o.col); g.save(); g.globalAlpha = 0.18 + 0.05 * Math.sin(Tm * 6 + o.col); g.fillStyle = '#FFD98A'; g.fillRect(x - 10, y - 50, 21, 18); g.restore(); }
      else { g.fillStyle = '#6E6A78'; for (let i = 0; i < 3; i++) { const k = (Tm * 0.6 + i / 3) % 1; g.globalAlpha = (1 - k) * 0.6; g.fillRect(x + Math.round(Math.sin(Tm * 2 + i) * 2), y - 41 - Math.round(k * 14), 1, 2); } g.globalAlpha = 1; }
      return true; }
    case 'selado': case 'covil': { if (o.tipo === 'covil') { g.fillStyle = '#E4DFCF'; for (const [dx, dy] of [[-30, 0], [-18, -2], [12, 0], [26, -1], [34, 0]]) { g.fillRect(x + dx, y - 3 + dy, 8, 2); g.fillRect(x + dx - 1, y - 4 + dy, 2, 2); } g.fillStyle = '#8A6A44'; g.fillRect(x - 40, y - 2, 80, 2); } return true; }
    case 'cenario': { const q = o.qual, f2 = Math.floor(Tm * 8) % 2;
      if (q === 'forja') { g.fillStyle = '#17121f'; g.fillRect(x + 14, y - 46, 30, 46); g.fillRect(x + 22, y - 62, 10, 16); g.fillStyle = '#4A4658'; g.fillRect(x + 15, y - 45, 28, 44); g.fillRect(x + 23, y - 61, 8, 15); g.fillStyle = '#17121f'; g.fillRect(x + 20, y - 26, 18, 20); g.fillStyle = f2 ? '#FF8A2A' : '#FFD86A'; g.fillRect(x + 22, y - 22, 14, 14); g.fillStyle = '#C9281F'; g.fillRect(x + 22, y - 12, 14, 5); g.fillStyle = '#17121f'; g.fillRect(x - 30, y - 14, 20, 14); g.fillRect(x - 34, y - 20, 28, 7); g.fillStyle = '#7F8C9C'; g.fillRect(x - 33, y - 19, 26, 5); g.fillRect(x - 28, y - 13, 16, 12); g.fillStyle = '#C3DCEA'; g.fillRect(x - 33, y - 19, 26, 1); if (f2) { g.fillStyle = '#FFE26B'; g.fillRect(x + 28, y - 66 - (Math.floor(Tm * 5) % 5), 1, 1); g.fillRect(x + 25, y - 70, 1, 1); } }
      else if (q === 'arca') { // a mini arca de Noé, com os bichos espiando
        g.fillStyle = '#17121f'; g.fillRect(x + 20, y - 26, 84, 26); g.fillRect(x + 34, y - 50, 56, 26); g.fillRect(x + 30, y - 56, 64, 7); g.fillStyle = '#6B4A2E'; g.fillRect(x + 21, y - 25, 82, 24); g.fillStyle = '#8A6A44'; g.fillRect(x + 35, y - 49, 54, 24); g.fillStyle = '#4A3524'; g.fillRect(x + 31, y - 55, 62, 5); for (let i = 0; i < 9; i++) g.fillRect(x + 24 + i * 9, y - 25, 1, 24); g.fillStyle = '#17121f'; for (const dx of [42, 58, 74]) g.fillRect(x + dx, y - 44, 9, 10); g.fillRect(x + 56, y - 20, 12, 20);
        g.fillStyle = '#C98A3A'; g.fillRect(x + 43, y - 41 - f2, 7, 6); g.fillStyle = '#3FA35A'; g.fillRect(x + 60, y - 42, 5, 7); g.fillStyle = '#E2463C'; g.fillRect(x + 60, y - 42, 5, 2); g.fillStyle = '#8A5A3A'; g.fillRect(x + 75, y - 40 - (1 - f2), 7, 5); g.fillStyle = '#D9D2C5'; g.fillRect(x + 92, y - 60, 5, 3); g.fillStyle = '#3F7A4A'; g.fillRect(x + 97, y - 59, 3, 1); }
      else if (q === 'descida') { // a boca da escada que desce ao subsolo: arco de pedra, degraus e uma lâmpada
        g.fillStyle = '#17121f'; g.fillRect(x - 22, y - 34, 6, 34); g.fillRect(x + 32, y - 34, 6, 34); g.fillRect(x - 24, y - 40, 64, 8); g.fillStyle = '#5A5668'; g.fillRect(x - 21, y - 33, 4, 33); g.fillRect(x + 33, y - 33, 4, 33); g.fillRect(x - 23, y - 39, 62, 6); g.fillStyle = '#7A7688'; g.fillRect(x - 23, y - 39, 62, 1);
        g.fillStyle = f2 ? '#FFD86A' : '#FFB84A'; g.fillRect(x + 6, y - 31, 4, 5); g.fillStyle = '#17121f'; g.fillRect(x + 7, y - 33, 2, 2);
        g.fillStyle = '#FFE9A8'; const b = Math.floor(Tm * 3) % 3; g.fillRect(x + 6, y - 18 + b * 2, 4, 2); g.fillRect(x + 4, y - 14 + b * 2, 8, 2); g.fillRect(x + 7, y - 12 + b * 2, 2, 2); }
      else if (q === 'balcao') { // o balcão do coletor: tampo de madeira, frente com painéis, moedas e o livro de contas
        g.fillStyle = '#17121f'; g.fillRect(x - 46, y - 30, 92, 30); g.fillStyle = '#6B4A2E'; g.fillRect(x - 45, y - 26, 90, 25); g.fillStyle = '#8A6A44'; g.fillRect(x - 47, y - 31, 94, 6); g.fillStyle = '#A8865A'; g.fillRect(x - 47, y - 31, 94, 1);
        g.fillStyle = '#4A3524'; for (let i = 0; i < 4; i++) g.fillRect(x - 40 + i * 22, y - 21, 16, 17); g.fillStyle = '#5A4030'; for (let i = 0; i < 4; i++) g.fillRect(x - 39 + i * 22, y - 20, 14, 15);
        g.fillStyle = '#E8D9B0'; g.fillRect(x - 36, y - 36, 18, 5); g.fillStyle = '#B8423A'; g.fillRect(x - 28, y - 36, 1, 5); g.fillStyle = f2 ? '#FFD23F' : '#E8B830'; for (let i = 0; i < 3; i++) g.fillRect(x + 16 + i * 7, y - 34 - (i % 2) * 2, 5, 3 + (i % 2) * 2); }
      else if (q === 'cofre') { // a arca do tesouro e a mesa do coletor
        g.fillStyle = '#17121f'; g.fillRect(x - 30, y - 30, 40, 30); g.fillRect(x + 40, y - 18, 34, 18); g.fillStyle = '#6B4A2E'; g.fillRect(x - 29, y - 22, 38, 21); g.fillStyle = '#8A6A44'; g.fillRect(x - 29, y - 29, 38, 7); g.fillStyle = '#C9A63C'; g.fillRect(x - 29, y - 23, 38, 2); g.fillRect(x - 22, y - 29, 3, 28); g.fillRect(x - 2, y - 29, 3, 28); g.fillRect(x - 12, y - 20, 5, 6);
        g.fillStyle = '#5A3E28'; g.fillRect(x + 41, y - 17, 32, 3); g.fillRect(x + 43, y - 14, 3, 14); g.fillRect(x + 68, y - 14, 3, 14); g.fillStyle = f2 ? '#FFD23F' : '#E8B830'; for (let i = 0; i < 4; i++) g.fillRect(x + 46 + i * 6, y - 20 - (i % 2) * 2, 4, 3 + (i % 2) * 2); }
      else if (q === 'andares') { // a escada de caracol dos andares: degraus que sobem até o teto, corrimão de bronze, lanterna e a placa do andar
        g.fillStyle = '#17121f'; g.fillRect(x - 3, y - 118, 6, 118); g.fillStyle = '#5A3E28'; g.fillRect(x - 2, y - 117, 4, 117);
        for (let i = 0; i < 12; i++) { const ang = i * 0.9 + Tm * 0.0, lx = Math.round(Math.cos(ang) * 16), yy = y - 6 - i * 9, frente = Math.sin(ang) > 0;
          g.fillStyle = '#17121f'; g.fillRect(x + Math.min(0, lx) - 1, yy - 1, Math.abs(lx) + 3, 4); g.fillStyle = frente ? '#8A6A44' : '#5A4030'; g.fillRect(x + Math.min(0, lx), yy, Math.abs(lx) + 1, 2); g.fillStyle = '#C9A63C'; g.fillRect(x + lx, yy - 6, 1, 6); }
        g.fillStyle = '#17121f'; g.fillRect(x + 10, y - 40, 14, 12); g.fillStyle = '#C9A63C'; g.fillRect(x + 11, y - 39, 12, 10); g.fillStyle = '#6B4A2E'; const nA = (G.andarRolos || 0) + 1; for (let i = 0; i < Math.min(nA, 4); i++) g.fillRect(x + 13 + i * 2, y - 36, 1, 4);
        g.fillStyle = f2 ? '#FFD86A' : '#FFB84A'; g.fillRect(x - 12, y - 58, 4, 5); g.fillStyle = '#17121f'; g.fillRect(x - 11, y - 60, 2, 2);
        g.fillStyle = '#FFE9A8'; const b = Math.floor(Tm * 3) % 3; g.fillRect(x - 1, y - 128 + b * 2, 3, 2); g.fillRect(x - 3, y - 124 + b * 2, 7, 2); }
      else if (q === 'redes') { g.fillStyle = '#17121f'; g.fillRect(x - 24, y - 46, 3, 46); g.fillRect(x + 22, y - 46, 3, 46); g.fillRect(x - 26, y - 48, 54, 3); g.fillStyle = '#6B4A2E'; g.fillRect(x - 23, y - 45, 1, 44); g.fillRect(x + 23, y - 45, 1, 44);
        g.fillStyle = '#C9B88A'; for (let i = 0; i < 9; i++) { const sag = Math.round(Math.sin(i / 8 * Math.PI) * 8); for (let k = 0; k < 6; k++) g.fillRect(x - 21 + i * 5, y - 44 + k * 4 + Math.round(sag * k / 6), 1, 3); } for (let k = 0; k < 6; k++) g.fillRect(x - 21, y - 44 + k * 4 + 4, 43, 1);
        g.fillStyle = '#E2463C'; g.fillRect(x - 8, y - 22, 4, 4); g.fillStyle = '#D9A63C'; g.fillRect(x + 6, y - 18, 4, 4); }
      else if (q === 'quadro') { g.fillStyle = '#17121f'; g.fillRect(x - 20, y - 46, 40, 30); g.fillRect(x - 17, y - 16, 3, 16); g.fillRect(x + 14, y - 16, 3, 16); g.fillStyle = '#6B4A2E'; g.fillRect(x - 19, y - 45, 38, 28);
        g.fillStyle = '#E8D9B0'; g.fillRect(x - 15, y - 41, 12, 9); g.fillRect(x + 1, y - 42, 13, 10); g.fillRect(x - 9, y - 29, 14, 9); g.fillStyle = '#8A6A44'; for (const [px, py] of [[-13, -38], [3, -39], [-7, -26]]) g.fillRect(x + px, y + py, 8, 1); g.fillStyle = '#B8423A'; g.fillRect(x - 10, y - 42, 2, 2); g.fillRect(x + 7, y - 43, 2, 2); }
      else if (q === 'sinagoga') { // a casa de oração por fora: pedra clara, telhados de terracota, volumes que se encaixam, porta de madeira em arco, rosácea, janelas redondas, a torre do sino e a mureta com grades e arbustos
        const k = cultoAgora(G), acesa = !!k || periodo(G) === 'noite', R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
        const PD = ['#5E5448', '#9A8E7E', '#BFB3A2', '#D8CFC0', '#EDE6DA'], TE = ['#6A2A1E', '#9A3E2A', '#C0563A', '#E07A50'], MA = ['#3A2416', '#5A3A22', '#7A4E2E', '#9A6A3E'], TI = '#2A2018', VJ = acesa ? '#F2C46A' : '#3A3448', VJ2 = acesa ? '#FFE9A8' : '#4A4458';
        const tri = (xa, ya, xb, yb, xc, yc, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.lineTo(xc, yc); g.closePath(); g.fill(); };
        const parede = (a, b, w, h) => { R(a - 1, b - 1, w + 2, h + 1, TI); R(a, b, w, h, PD[3]); R(a + w - 4, b, 4, h, PD[2]); g.fillStyle = PD[2]; for (let r = 7; r < h; r += 8) for (let c = ((r / 8) % 2) * 6; c < w - 4; c += 12) g.fillRect(a + c, b + r, 5, 1); R(a, b, w, 2, PD[4]); R(a, b + h - 4, w, 4, PD[1]); };
        const ogiva = (cx2, top, w, h, cv, cv2) => { R(cx2 - w / 2 - 2, top + w / 2, w + 4, h - w / 2 + 2, TI); for (let a = 0; a <= w / 2 + 2; a++) { const lg = Math.round(Math.sqrt((w / 2 + 2) ** 2 - (w / 2 + 2 - a) ** 2)); R(cx2 - lg, top - 2 + a, lg * 2, 1, TI); }
          R(cx2 - w / 2, top + w / 2, w, h - w / 2, cv); for (let a = 0; a <= w / 2; a++) { const lg = Math.round(Math.sqrt((w / 2) ** 2 - (w / 2 - a) ** 2)); R(cx2 - lg, top + a, lg * 2, 1, cv); } if (cv2) R(cx2 - w / 4, top + w / 2, Math.max(1, w / 4), h - w / 2 - 2, cv2); R(cx2 - w / 2 - 3, top + h, w + 6, 3, PD[4]); };
        const redonda = (cx2, cy2, r) => { for (let yy = -r - 1; yy <= r + 1; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, (r + 1) ** 2 - yy * yy))); R(cx2 - lg, cy2 + yy, lg * 2, 1, TI); } for (let yy = -r; yy <= r; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy))); R(cx2 - lg, cy2 + yy, lg * 2, 1, VJ); } R(cx2 - r, cy2, r * 2, 1, TI); R(cx2, cy2 - r, 1, r * 2, TI); };
        // a ala direita, baixa, com três janelas redondas e telhado de uma água
        parede(x + 48, y - 54, 104, 54); for (const rx of [70, 96, 122]) redonda(x + rx, y - 30, 6);
        R(x + 44, y - 64, 116, 10, TI); for (let i = 0; i < 112; i += 6) { R(x + 46 + i, y - 62, 6, 8, TE[2]); R(x + 46 + i, y - 62, 1, 8, TE[1]); } R(x + 46, y - 63, 112, 2, TE[3]);
        // a torre do sino, sobre a ala direita
        const tx = x + 92, tt = y - 150; parede(tx, tt, 40, 90); ogiva(tx + 20, tt + 12, 22, 36, '#2A2436'); R(tx - 4, tt + 52, 48, 4, PD[4]); R(tx - 4, tt - 4, 48, 6, PD[4]); R(tx - 4, tt + 2, 48, 2, PD[1]);
        const bal = Math.round(Math.sin(G.T * 7) * (o.balanco || 0) * 4); R(tx + 8, tt + 20, 24, 2, MA[1]); R(tx + 13 + bal, tt + 23, 14, 15, TI); R(tx + 14 + bal, tt + 24, 12, 13, '#D9A63C'); R(tx + 12 + bal, tt + 35, 16, 3, '#D9A63C'); R(tx + 15 + bal, tt + 25, 2, 9, '#FFE08A'); R(tx + 19 + bal * 2, tt + 38, 2, 3, '#5A3A0C');
        tri(tx - 8, tt - 3, tx + 20, tt - 34, tx + 48, tt - 3, TI); tri(tx - 5, tt - 4, tx + 20, tt - 31, tx + 45, tt - 4, TE[2]); tri(tx + 20, tt - 31, tx + 45, tt - 4, tx + 20, tt - 4, TE[1]); R(tx + 19, tt - 40, 3, 9, PD[4]); R(tx + 17, tt - 42, 7, 3, '#C9A63C');
        if (o.balanco > 0.05) { g.globalAlpha = o.balanco * 0.7; g.fillStyle = '#FFE9A8'; for (const [dx, dy] of [[-10, 20], [50, 20], [-14, 30], [54, 30]]) g.fillRect(tx + dx, tt + dy, 5, 1); g.globalAlpha = 1; }
        // a ala esquerda, com janela em ogiva e telhado de duas águas
        parede(x - 142, y - 62, 92, 62); ogiva(x - 96, y - 52, 14, 34, VJ, VJ2);
        tri(x - 148, y - 61, x - 96, y - 92, x - 44, y - 61, TI); tri(x - 144, y - 62, x - 96, y - 89, x - 48, y - 62, TE[2]); tri(x - 96, y - 89, x - 48, y - 62, x - 96, y - 62, TE[1]);
        // o corpo principal, com o frontão para a rua
        parede(x - 52, y - 98, 104, 98);
        tri(x - 60, y - 97, x, y - 146, x + 60, y - 97, TI); tri(x - 56, y - 98, x, y - 142, x + 56, y - 98, PD[3]); tri(x, y - 142, x + 56, y - 98, x, y - 98, PD[2]);
        g.fillStyle = TE[2]; for (let i = 0; i <= 56; i += 3) { g.fillRect(x - 58 + i, y - 99 - i * 0.82, 4, 4); g.fillRect(x + 54 - i, y - 99 - i * 0.82, 4, 4); }
        redonda(x, y - 116, 9); g.fillStyle = acesa ? '#FFE9A8' : '#5A5468'; for (let a = 0; a < 8; a++) g.fillRect(Math.round(x + Math.cos(a * 0.785) * 5), Math.round(y - 116 + Math.sin(a * 0.785) * 5), 1, 1); // a rosácea
        g.fillStyle = '#C9A63C'; g.fillRect(x - 4, y - 131, 9, 2); g.fillRect(x, y - 138, 1, 7); for (let b = 1; b <= 3; b++) { g.fillRect(x - b * 2, y - 134 + b, 1, 1); g.fillRect(x + b * 2, y - 134 + b, 1, 1); g.fillRect(x - b * 2, y - 138, 1, 4 + b); g.fillRect(x + b * 2, y - 138, 1, 4 + b); g.fillRect(x - b * 2 + 1, y - 134 + b, b * 2 - 1, 1); g.fillRect(x + 1, y - 134 + b, b * 2 - 1, 1); } g.fillStyle = '#FFE08A'; for (let b = -3; b <= 3; b++) g.fillRect(x + b * 2, y - 140, 1, 2); // a menorá de sete braços no alto do frontão
        ogiva(x - 34, y - 80, 12, 32, VJ, VJ2); ogiva(x + 34, y - 80, 12, 32, VJ, VJ2);
        // a porta de madeira em arco (no culto, aberta e acesa)
        { const dw = 15, dh = 46; R(x - dw - 3, y - dh, dw * 2 + 6, dh, PD[4]); for (let a = 0; a <= dw + 3; a++) { const lg = Math.round(Math.sqrt((dw + 3) ** 2 - (dw + 3 - a) ** 2)); R(x - lg, y - dh - dw - 3 + a, lg * 2, 1, PD[4]); }
          const fol = k ? '#F2C46A' : MA[2]; R(x - dw, y - dh, dw * 2, dh, fol); for (let a = 0; a <= dw; a++) { const lg = Math.round(Math.sqrt(dw * dw - (dw - a) ** 2)); R(x - lg, y - dh - dw + a, lg * 2, 1, fol); }
          if (k) { R(x - dw, y - dh, 4, dh, MA[1]); R(x + dw - 4, y - dh, 4, dh, MA[1]); R(x - 3, y - dh + 6, 6, dh - 6, '#FFE9A8'); g.globalAlpha = 0.2; R(x - 30, y - 4, 60, 4, '#FFE9A8'); g.globalAlpha = 1; }
          else { R(x - 1, y - dh - dw, 2, dh + dw, MA[0]); g.fillStyle = MA[3]; for (let r = 0; r < dh; r += 7) { g.fillRect(x - dw + 2, y - dh + r, dw - 4, 1); g.fillRect(x + 2, y - dh + r, dw - 4, 1); } R(x - 5, y - 24, 2, 3, '#E8C873'); R(x + 3, y - 24, 2, 3, '#E8C873'); } }
        // degraus, mureta com grades, arbustos e tufos de grama
        R(x - 26, y - 4, 52, 4, PD[2]); R(x - 22, y - 2, 44, 2, PD[4]);
        for (const [a, b] of [[x - 172, x - 60], [x + 60, x + 170]]) { for (let px2 = a; px2 < b; px2 += 22) { R(px2, y - 12, 5, 12, PD[4]); R(px2 + 4, y - 12, 1, 12, PD[1]); R(px2 + 5, y - 9, 17, 9, TI); g.fillStyle = '#4A4A58'; for (let gx = px2 + 7; gx < px2 + 21; gx += 3) g.fillRect(gx, y - 9, 1, 9); } R(a, y - 13, b - a, 2, PD[3]); }
        for (const bx of [x - 48, x + 44, x - 150]) { g.fillStyle = '#2E6A3A'; g.fillRect(bx - 8, y - 8, 16, 8); g.fillStyle = '#4A9A4A'; g.fillRect(bx - 6, y - 10, 12, 4); g.fillStyle = '#7ACB6A'; g.fillRect(bx - 3, y - 10, 4, 2); }
        g.fillStyle = '#C9B86A'; for (const gx of [-120, -80, 70, 110, 150]) { g.fillRect(x + gx, y - 3, 1, 3); g.fillRect(x + gx + 2, y - 4, 1, 4); } }
      else if (q === 'templo') { const luz = G.cm.sar?.feita; g.fillStyle = '#17121f'; g.fillRect(x - 70, y - 96, 140, 96); g.fillRect(x - 78, y - 104, 156, 10); g.beginPath(); g.moveTo(x - 80, y - 104); g.lineTo(x, y - 132); g.lineTo(x + 80, y - 104); g.fill();
        g.fillStyle = luz ? '#8A8296' : '#3A3644'; g.fillRect(x - 68, y - 94, 136, 94); g.beginPath(); g.moveTo(x - 72, y - 105); g.lineTo(x, y - 128); g.lineTo(x + 72, y - 105); g.fill();
        g.fillStyle = luz ? '#B8B0C0' : '#4A4658'; for (const cx of [-58, -36, 32, 54]) g.fillRect(x + cx, y - 92, 6, 92);
        g.fillStyle = luz ? '#FFD98A' : '#0A090C'; g.fillRect(x - 18, y - 60, 36, 60); g.fillRect(x - 14, y - 66, 28, 6);
        if (luz) { g.save(); g.globalAlpha = 0.25 + 0.08 * Math.sin(Tm * 3); g.fillStyle = '#FFE9A8'; g.fillRect(x - 30, y - 72, 60, 72); g.restore(); for (const dx of [-8, 0, 8]) chama(g, x + dx - 2, y - 72, Tm, dx); } }
      else if (q === 'banca') { g.fillStyle = '#17121f'; g.fillRect(x - 40, y - 52, 3, 52); g.fillRect(x + 22, y - 52, 3, 52); g.fillRect(x - 44, y - 58, 72, 8); g.fillRect(x - 40, y - 16, 64, 16); g.fillStyle = '#7A3F8A'; g.fillRect(x - 43, y - 57, 70, 6); for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#9A5AB0' : '#5E2C6E'; g.fillRect(x - 43 + i * 8, y - 51, 8, 4 + (i % 2) * 2); } g.fillStyle = '#6B4A2E'; g.fillRect(x - 39, y - 15, 62, 14); for (const [dx, c] of [[-34, '#8E2B45'], [-22, '#7A3F8A'], [-10, '#C9A63C'], [2, '#5E2C6E'], [12, '#B03A6E']]) { g.fillStyle = c; g.fillRect(x + dx, y - 24, 9, 9); g.fillStyle = '#17121f'; g.fillRect(x + dx, y - 16, 9, 1); } }
      else if (q === 'armas') { g.fillStyle = '#17121f'; g.fillRect(x + 16, y - 44, 46, 4); g.fillRect(x + 18, y - 44, 3, 44); g.fillRect(x + 57, y - 44, 3, 44); g.fillStyle = '#6B4A2E'; g.fillRect(x + 17, y - 43, 44, 2); for (const [dx, h2, c] of [[24, 30, '#C3DCEA'], [32, 22, '#A0662A'], [40, 34, '#C3DCEA'], [48, 26, '#C48A4E']]) { g.fillStyle = '#17121f'; g.fillRect(x + dx - 1, y - 41, 4, h2 + 2); g.fillStyle = c; g.fillRect(x + dx, y - 40, 2, h2); g.fillStyle = '#D9A63C'; g.fillRect(x + dx - 1, y - 40 + h2 - 6, 4, 2); } g.fillStyle = '#17121f'; g.fillRect(x + 66, y - 22, 16, 22); g.fillStyle = '#7F8C9C'; g.fillRect(x + 67, y - 21, 14, 14); g.fillStyle = '#D9A63C'; g.fillRect(x + 72, y - 16, 4, 4); }
      else if (q === 'tear') { g.fillStyle = '#17121f'; g.fillRect(x + 16, y - 46, 3, 46); g.fillRect(x + 46, y - 46, 3, 46); g.fillRect(x + 14, y - 48, 37, 4); g.fillRect(x + 14, y - 12, 37, 4); g.fillStyle = '#6B4A2E'; g.fillRect(x + 15, y - 47, 35, 2); g.fillRect(x + 15, y - 11, 35, 2); for (let i = 0; i < 9; i++) { g.fillStyle = ['#C8C9BC', '#713E49', '#394F62'][i % 3]; g.fillRect(x + 20 + i * 3, y - 44, 2, 20 + ((i * 5 + Math.floor(Tm * 2)) % 9)); } g.fillStyle = '#A18C61'; g.fillRect(x + 54, y - 8, 14, 8); g.fillStyle = '#C8C9BC'; g.fillRect(x + 56, y - 14, 10, 6); g.fillStyle = '#713E49'; g.fillRect(x + 58, y - 18, 6, 4); }
      return true; }
    case 'pedraFunda': { const b = Math.floor(Tm * 4) % 2, pisca = o.t < 2.5 && Math.floor(Tm * 10) % 2; if (pisca) return true; g.fillStyle = '#17121f'; g.fillRect(x - 4, y - 9 - b, 8, 7); g.fillStyle = '#C9C4B2'; g.fillRect(x - 3, y - 8 - b, 6, 5); g.fillStyle = '#FFFFFF'; g.fillRect(x - 2, y - 8 - b, 2, 1); g.fillStyle = '#FFE9A8'; for (let i = 0; i < 4; i++) { const a = Tm * 3 + i * 1.57; g.fillRect(Math.round(x + Math.cos(a) * 11), Math.round(y - 6 + Math.sin(a) * 8), 1, 1); } g.fillRect(x, y - 16 - b * 2, 1, 4); return true; }
    case 'placa': { g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 14, 3, 14); g.fillRect(x - 8, y - 24, 17, 11); g.fillStyle = '#6B4A2E'; g.fillRect(x, y - 13, 1, 13); g.fillStyle = '#A0794A'; g.fillRect(x - 7, y - 23, 15, 9); g.fillStyle = '#5A3E22'; g.fillRect(x - 5, y - 21, 11, 1); g.fillRect(x - 5, y - 18, 8, 1); return true; }
    case 'lamparina': { const f = Math.floor(Tm * 8) % 3; g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 40, 3, 40); g.fillRect(x - 5, y - 50, 11, 11); g.fillStyle = '#6B4A2E'; g.fillRect(x, y - 39, 1, 39); g.fillStyle = '#3A2A1A'; g.fillRect(x - 4, y - 49, 9, 9); g.fillStyle = '#FFB84A'; g.fillRect(x - 2, y - 47, 5, 6); g.fillStyle = '#FFF1BE'; g.fillRect(x - 1, y - 46 - (f === 1 ? 1 : 0), 3, 4); g.fillStyle = '#D9A63C'; g.fillRect(x - 5, y - 51, 11, 1); return true; }
    case 'pista': { const b = Math.floor(Tm * 3) % 2; g.fillStyle = '#0B0F0A'; g.fillRect(x - 9, y - 3, 18, 3); g.fillRect(x - 5, y - 6, 9, 3); g.fillRect(x + 4, y - 5, 2, 2); g.fillStyle = '#1E2A18'; g.fillRect(x - 7, y - 2, 13, 1); g.fillStyle = '#B8E060'; g.fillRect(x - 3 + b * 4, y - 5, 1, 1); g.fillRect(x + 2 - b * 3, y - 2, 1, 1); g.fillStyle = '#FFD23F'; g.fillRect(x - 1, y - 22 - b, 3, 5); g.fillRect(x + 1, y - 17 - b, 1, 3); g.fillRect(x, y - 12 - b, 2, 2); return true; }
    case 'livroRefugio': { const b = Math.floor(Tm * 2) % 2; g.fillStyle = '#17121f'; g.fillRect(x - 6, y - 18, 12, 18); g.fillRect(x - 11, y - 25, 22, 8); g.fillStyle = '#6E6A78'; g.fillRect(x - 5, y - 17, 10, 17); g.fillStyle = '#8A8696'; g.fillRect(x - 5, y - 17, 2, 17); g.fillStyle = '#E9E6DC'; g.fillRect(x - 10, y - 24, 9, 6); g.fillRect(x + 1, y - 24, 9, 6); g.fillStyle = '#8A6A2C'; g.fillRect(x - 1, y - 24, 2, 6); g.fillStyle = '#5A544A'; for (let i = 0; i < 3; i++) { g.fillRect(x - 8, y - 23 + i * 2, 5, 1); g.fillRect(x + 3, y - 23 + i * 2, 5, 1); } g.fillStyle = '#FFE9A8'; g.fillRect(x - 3 + b * 5, y - 29 - b, 1, 2); return true; }
    case 'festa': { g.fillStyle = '#17121f'; g.fillRect(x - 17, y - 13, 34, 4); g.fillRect(x - 15, y - 10, 3, 10); g.fillRect(x + 12, y - 10, 3, 10); g.fillStyle = '#C9C4B2'; g.fillRect(x - 16, y - 12, 32, 2); g.fillStyle = '#8E2B45'; g.fillRect(x - 16, y - 10, 32, 1); g.fillStyle = '#6B4A2E'; g.fillRect(x - 14, y - 9, 1, 9); g.fillRect(x + 13, y - 9, 1, 9); g.fillStyle = '#D9A63C'; g.fillRect(x - 10, y - 16, 5, 4); g.fillStyle = '#B8733E'; g.fillRect(x - 1, y - 17, 4, 5); g.fillRect(x, y - 19, 2, 2); g.fillStyle = '#E8D9A8'; g.fillRect(x + 7, y - 15, 6, 3); g.fillStyle = '#FFB84A'; g.fillRect(x - 13, y - 19 - (Math.floor(Tm * 8) % 2), 1, 3); g.fillRect(x + 14, y - 19 - (Math.floor(Tm * 8 + 1) % 2), 1, 3); return true; }
    case 'enfeite': { const q = o.qual;
      if (q === 'cabana') { g.fillStyle = '#17121f'; g.fillRect(x - 15, y - 30, 2, 30); g.fillRect(x + 13, y - 30, 2, 30); g.fillRect(x - 18, y - 34, 36, 5); g.fillStyle = '#6B4A2E'; g.fillRect(x - 14, y - 29, 1, 29); g.fillRect(x + 14, y - 29, 1, 29); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#3F7A4A' : '#5E9A56'; g.fillRect(x - 17 + i * 3, y - 35 - (i % 3), 3, 5 + (i % 2) * 2); } g.fillStyle = '#C9A63C'; g.fillRect(x - 8, y - 27, 2, 3); g.fillRect(x + 5, y - 26, 2, 3); }
      else if (q === 'feixe') { g.fillStyle = '#17121f'; g.fillRect(x - 6, y - 20, 12, 20); g.fillStyle = '#D9A63C'; for (let i = 0; i < 5; i++) g.fillRect(x - 5 + i * 2, y - 19 - (i % 2) * 3, 2, 19 + (i % 2) * 3); g.fillStyle = '#FFE08A'; for (let i = 0; i < 5; i++) g.fillRect(x - 5 + i * 2, y - 22 - (i % 2) * 3, 1, 4); g.fillStyle = '#8E2B45'; g.fillRect(x - 6, y - 10, 12, 2); }
      else if (q === 'cestos') { for (const [dx, c] of [[-7, '#7A3F8A'], [5, '#5E7A3A']]) { g.fillStyle = '#17121f'; g.fillRect(x + dx - 5, y - 9, 11, 9); g.fillStyle = '#A0794A'; g.fillRect(x + dx - 4, y - 7, 9, 7); g.fillStyle = '#6B4A2E'; g.fillRect(x + dx - 4, y - 4, 9, 1); g.fillStyle = c; g.fillRect(x + dx - 3, y - 10, 7, 3); g.fillRect(x + dx - 1, y - 12, 3, 2); } }
      else if (q === 'estrela') { const b = Math.floor(Tm * 4) % 2; g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 46, 2, 46); g.fillStyle = '#6B4A2E'; g.fillRect(x, y - 45, 1, 45); g.fillStyle = b ? '#FFFFFF' : '#FFE9A8'; g.fillRect(x - 1, y - 58, 2, 14); g.fillRect(x - 6, y - 52, 12, 2); g.fillStyle = '#FFD23F'; g.fillRect(x - 3, y - 55, 6, 8); g.fillRect(x - 4 - b, y - 56 - b, 1, 1); g.fillRect(x + 3 + b, y - 56 - b, 1, 1); g.fillRect(x - 4 - b, y - 47 + b, 1, 1); g.fillRect(x + 3 + b, y - 47 + b, 1, 1); }
      else if (q === 'amendoeira') { g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 30, 3, 30); g.fillStyle = '#6B4A2E'; g.fillRect(x, y - 29, 1, 29); for (let i = 0; i < 14; i++) { const a = i * 0.9, r = 6 + (i % 4) * 3; g.fillStyle = i % 3 ? '#FFD9E8' : '#FFFFFF'; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 34 + Math.sin(a) * r * 0.7), 2, 2); } g.fillStyle = '#FF8FB8'; g.fillRect(x - 3 + (Math.floor(Tm * 2) % 7), y - 20 + (Math.floor(Tm * 5) % 18), 1, 1); }
      else { g.fillStyle = '#17121f'; g.fillRect(x - 13, y - 11, 26, 3); g.fillRect(x - 11, y - 8, 2, 8); g.fillRect(x + 9, y - 8, 2, 8); g.fillStyle = '#E9E6DC'; g.fillRect(x - 12, y - 10, 24, 1); g.fillStyle = '#C9A86A'; g.fillRect(x - 8, y - 13, 6, 2); g.fillRect(x + 2, y - 13, 6, 2); g.fillStyle = '#5E7A3A'; g.fillRect(x - 1, y - 14, 2, 3); }
      return true; }
    case 'arpao': { const b = Math.floor(Tm * 3) % 2; g.fillStyle = '#17121f'; g.fillRect(x - 1, y - 24 - b, 3, 24); g.fillStyle = '#A0662A'; g.fillRect(x, y - 23 - b, 1, 22); g.fillStyle = '#EEF6FB'; g.fillRect(x - 1, y - 28 - b, 3, 5); g.fillRect(x, y - 30 - b, 1, 2); g.fillStyle = '#BFF0F8'; g.fillRect(x - 3 + b * 5, y - 32, 1, 1); return true; }
    case 'arvore': { // o sicômoro de Zaqueu: tronco torto, copa em três massas, figos
      const s = sprObj('sicomoro', 96, 112, s => { const T = rampa('#6B4A2E'), F = rampa('#3F7A4A'), F2 = rampa('#2E5E44');
        s.poli([[40, 111], [44, 70], [38, 44], [46, 40], [52, 66], [58, 111]], T[2]); s.poli([[40, 111], [44, 70], [38, 44], [41, 43], [47, 72], [45, 111]], T[1]); s.linha(52, 66, 57, 110, 1, T[3]);
        s.linha(44, 62, 22, 40, 4, T[2]); s.linha(50, 58, 74, 34, 4, T[2]); s.linha(45, 46, 48, 22, 3, T[1]); for (let y = 76; y < 110; y += 5) s.ret(46 + (y % 2), y, 3, 1, T[0]);
        for (const [x, y, rx, ry, R2] of [[22, 34, 20, 15, F2], [74, 30, 19, 15, F2], [48, 20, 26, 18, F], [30, 22, 14, 11, F], [66, 18, 14, 11, F]]) s.bola(x, y, rx, ry, R2, 0.4, -0.75);
        for (let i = 0; i < 46; i++) { const x = 8 + (i * 37) % 80, y = 6 + (i * 23) % 40; if (s.le(x, y)) { s.px(x, y, F[4]); s.px(x + 1, y + 1, F2[0]); } }
        for (const [x, y] of [[20, 44], [34, 36], [58, 38], [72, 44], [46, 34], [82, 34]]) if (s.le(x, y - 3)) s.bola(x, y, 1.6, 2, rampa('#8E3B5E'));
        s.contorno(TINTA); }); carimbar(g, s, x, y, 48, 111); return true; }
    case 'querubim': { // a leste do jardim: o querubim e a espada de fogo que se revolve
      const s = sprObj('querubim', 56, 60, s => { const A = rampa('#E8E2D0'), M = rampa('#C9A63C');
        for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { s.poli([[28 + sd * 4, 22], [28 + sd * (10 + i * 4), 4 + i * 5], [28 + sd * (8 + i * 3), 30 + i * 3]], A[i % 2 ? 2 : 3]); s.linha(28 + sd * 4, 22, 28 + sd * (10 + i * 4), 4 + i * 5, 1, A[4]); }
        s.poli([[22, 24], [34, 24], [38, 58], [18, 58]], A[2]); s.poli([[22, 24], [26, 24], [22, 58], [18, 58]], A[1]); s.ret(22, 34, 12, 2, M[2]); for (let xx = 19; xx < 38; xx += 3) s.ret(xx, 58, 2, 2, A[1]);
        s.bola(28, 18, 5, 5.5, rampa('#C9B8A0')); s.ret(26, 17, 5, 1, BRANCO); for (let a = 0; a < 10; a++) s.px(28 + Math.cos(a * 0.628) * 8, 16 + Math.sin(a * 0.628) * 8, M[4]); s.contorno(TINTA); });
      carimbar(g, s, x, y - 6 + Math.round(Math.sin(Tm * 1.5) * 2), 28, 59);
      const a = Tm * 2.2, ex = x + 22, ey = y - 34; for (let d = 0; d < 20; d++) { const px = ex + Math.round(Math.cos(a) * d), py = ey + Math.round(Math.sin(a) * d * 0.9); g.fillStyle = d < 4 ? '#C9A63C' : d % 3 ? '#FF9A3C' : '#FFF1BE'; g.fillRect(px, py, d < 4 ? 2 : 1 + (d % 2), d < 4 ? 2 : 1 + (d % 2)); if (d > 5 && d % 4 === 0) chama(g, px, py - 2, Tm, d); }
      return true; }
    case 'porta-pecado': { // a porta sem trinco
      const aberta = G.cm.ovos.includes('graca'), s = sprObj('portap' + (aberta ? 'a' : ''), 34, 52, s => { const P = rampa('#4A4658');
        s.ret(2, 6, 30, 46, P[2]); s.bola(17, 8, 15, 8, P); s.ret(2, 6, 2, 46, P[3]); s.ret(30, 6, 2, 46, P[0]); for (let yy = 12; yy < 52; yy += 7) { s.ret(3, yy, 4, 1, P[0]); s.ret(27, yy + 3, 4, 1, P[0]); }
        const dentro = aberta ? rampa('#FFE9A8') : rampa('#17121f'); s.ret(7, 12, 20, 40, dentro[aberta ? 3 : 2]); s.bola(17, 13, 10, 6, dentro);
        if (aberta) for (let yy = 12; yy < 52; yy += 2) s.ret(9 + (yy % 4), yy, 14, 1, dentro[4]); s.contorno(TINTA); }); carimbar(g, s, x, y, 17, 51);
      if (!aberta) { const r = Math.floor(Tm * 1.5) % 2; g.fillStyle = '#EF6981'; g.fillRect(x - 4, y - 30 + r, 2, 1); g.fillRect(x + 3, y - 30 + r, 2, 1); for (let i = 0; i < 4; i++) { const k = (Tm * 0.4 + i / 4) % 1; g.fillStyle = '#2A2238'; g.fillRect(x - 8 + i * 5 + Math.round(Math.sin(k * 6 + i) * 2), y - 2 - Math.round(k * 12), 2, 2); } }
      else chama(g, x, y - 56, Tm, 2);
      return true; }
    case 'npc': if (o.bicho) { // a jumenta de Balaão
        const s = sprObj('jumenta', 40, 30, s => { const J = rampa('#8E8474'), V = rampa('#D9D2C0');
          for (const [dx, k] of [[9, 1], [13, 0], [25, 1], [29, 0]]) { s.ret(dx, 18, 3, 11, J[k ? 2 : 1]); s.ret(dx, 28, 3, 2, TINTA); }
          s.bola(19, 15, 12, 6, J, 0.4, -0.7); s.bola(19, 18, 9, 3, V, 0.2, -0.4); s.poli([[27, 12], [33, 4], [37, 6], [32, 16]], J[2]); s.bola(35, 7, 4, 4, J, 0.5, -0.7); s.poli([[36, 8], [40, 10], [36, 13]], V[2]);
          s.linha(33, 4, 31, 0, 2, J[1]); s.linha(36, 4, 36, 0, 2, J[3]); s.px(36, 6, TINTA); for (let xx = 28; xx < 33; xx++) s.px(xx, 11 - (xx - 28), TINTA); s.linha(7, 13, 4, 22, 1, J[0]); s.ret(3, 22, 2, 3, TINTA); s.ret(15, 9, 8, 2, rampa('#8E2B45')[2]); s.contorno(TINTA); });
        carimbar(g, s, x, y, 20, 29, G.p.x < o.x ? -1 : 1); return true; }
      carimbar(g, quadroPessoa({ ...o.look, cls: null }, Tm, (o.id || o.nome) + ''), x, y, 24, 40, G.p.x < o.x ? -1 : 1); return true;
  }
  return false;
}

/* ---------- HUD ---------- */
const FOLEGO = ['...y...', '..yY...', '..yYy..', '.yYWYy.', '.yYWYy.', '..yYy..', '.ggggg.', '..ggg..'];
const hud = new Sprite(120, 30);
function pintarHud(g, G, vw) {
  const p = G.p, Tm = G.T, s = hud.limpa(), y = { y: cor('#FF9A3C'), Y: cor('#FFD86A'), W: cor('#FFFBE6'), g: OURO[2] }, apag = { y: 0, Y: 0, W: 0, g: PEDRA[1] };
  // a botija de azeite: jarro de barro com o nível à vista
  s.bola(11, 16, 9, 9.5, BARRO); s.ret(7, 3, 8, 3, BARRO[3]); s.ret(8, 6, 6, 2, BARRO[1]);
  const of = clamp(p.oleo / G.oleoMax(), 0, 1), topo = Math.round(24 - of * 15), pronto = p.oleo >= OLEO_USO;
  for (let yy = topo; yy <= 23; yy++) { const lg = Math.round(6.5 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - 16) / 8, 2)))); for (let xx = -lg; xx <= lg; xx++) s.px(11 + xx, yy, yy === topo ? cor(pronto ? '#FFF1BE' : '#C9A85A') : cor(pronto ? (xx > 2 ? '#FFD86A' : '#F2B83C') : '#8A7436')); }
  for (let k = 1; k < Math.round(G.oleoMax() / OLEO_USO); k++) s.ret(5, Math.round(24 - k * OLEO_USO / G.oleoMax() * 15), 2, 1, TINTA);
  for (let i = 0; i < p.vidaMax; i++) s.carimbo(FOLEGO, 24 + i * 9, 4 + (i < p.vida && Math.floor(Tm * 6 + i) % 4 === 0 ? -1 : 0), i < p.vida ? y : apag);
  // passo pronto: três setas que se acendem enquanto ele volta
  const pronto2 = !(p.dashCd > 0), kd = pronto2 ? 1 : 1 - p.dashCd / (p.dashMax || 1.4);
  for (let i = 0; i < 3; i++) { const c = kd >= (i + 1) / 3 ? cor(pronto2 ? '#BFE6F2' : '#6E8FA6') : PEDRA[0], x = 25 + i * 6; for (let j = 0; j < 3; j++) { s.px(x + j, 15 + j, c); s.px(x + j, 19 - j, c); } }
  s.contorno(TINTA);
  g.drawImage(s.tela(), 5, 4);
}
function barraChefe(g, G, vw) {
  const b = G.chefe; if (!b) return;
  const w = Math.min(190, vw - 120), x = Math.round((vw - w) / 2), y = 20, k = clamp(b.hp / b.max, 0, 1);
  g.fillStyle = '#17121f'; g.fillRect(x - 3, y - 2, w + 6, 11); g.fillStyle = '#8A6A2C'; g.fillRect(x - 2, y - 1, w + 4, 9); g.fillStyle = '#D9A63C'; g.fillRect(x - 2, y - 1, w + 4, 1); g.fillStyle = '#231a26'; g.fillRect(x, y + 1, w, 5);
  const lg = Math.round(w * k); g.fillStyle = '#8E2533'; g.fillRect(x, y + 1, lg, 5); g.fillStyle = '#D0465A'; g.fillRect(x, y + 1, lg, 3); g.fillStyle = '#F29A9A'; g.fillRect(x, y + 1, lg, 1);
  for (const f of b.c.fases) if (f.vida < 1) { g.fillStyle = '#FFE9A8'; g.fillRect(x + Math.round(w * f.vida), y, 1, 7); }
  g.fillStyle = '#17121f'; g.fillRect(x + 20, y + 10, w - 40, 4); g.fillStyle = b.quebrado > 0 ? '#FFFFFF' : '#FFD86A'; g.fillRect(x + 21, y + 11, Math.round((w - 42) * clamp(b.post / 100, 0, 1)), 2);
  for (const sx of [x - 6, x + w + 3]) { g.fillStyle = '#17121f'; g.fillRect(sx - 1, y - 1, 5, 9); g.fillStyle = '#D9A63C'; g.fillRect(sx, y, 3, 7); g.fillStyle = '#D0465A'; g.fillRect(sx + 1, y + 2, 1, 3); }
}

/* ---------- quadro ---------- */
export function renderPixel(G) {
  const v = G.vista, p = G.p, Tm = G.T, vh = CH * TL, esc = v.H / vh, vw = Math.ceil(v.W / esc);
  if (baixa.width !== vw || baixa.height !== vh) { baixa.width = vw; baixa.height = vh; }
  const g = bg; g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, 0, 0);
  const tr = G.tremorA ? Math.round((Math.random() - 0.5) * Math.min(4, G.tremorA * 0.35)) : 0, tr2 = G.tremorA ? Math.round((Math.random() - 0.5) * Math.min(4, G.tremorA * 0.35)) : 0;
  const cx = Math.round(v.cam.x / PX) + tr, cy = Math.round((v.cam.y + (G.balanco || 0)) / PX) + tr2, C = cenaPixel(G.tm, G.def.tema);
  const X = wx => Math.round(wx / PX - cx), Y = wy => Math.round(wy / PX - cy);
  const antigo = fn => { g.save(); g.scale(1 / PX, 1 / PX); g.translate(-cx * PX, -cy * PX); fn(); g.restore(); };

  pintarFundoPixel(g, G, C, vw, vh, cx, cy);
  pintarSalasPixel(g, G, C, vw, vh, cx, cy);
  if (G.area.startsWith('sinagoga')) pintarLuzSinagoga(g, G, cx, cy, luzDoDia(G).d > 0.3);
  for (const o of G.objs) { const x = X(o.x), xv = o.vv ? X(o.vv.x) : x; if (xv < -60 || xv > vw + 60) continue; /* quem anda é visto onde está, não onde mora */ if (o.oculto && !G.achou(o)) { const k = G.p.lampA * clamp(1 - (Math.hypot(o.x - G.p.x, o.y - G.p.y) - 200) / 160, 0, 1); if (k < 0.05) continue; g.globalAlpha = k; } if (!pintarObjeto(g, o, G, x, Y(o.y), Tm)) antigo(() => desenharObjeto(g, o, G)); g.globalAlpha = 1; }
  if (G.def.mundo && G.N.arena) pintarArenaTema(g, G, X, Y, Tm);
  const chefe = G.N.arena && G.inimigos.find(e => e.kind === 'chefe' && e.cen);
  if (chefe) pintarPalco(g, G, chefe, X, Y, Tm, false); // o cenário que muda durante a luta
  pintarBlocosPixel(g, G, C, vw, vh, cx, cy);
  for (const o of G.objs) if (o.tipo === 'mar' || o.tipo === 'barco') pintarAgua(g, o, G, X(o.x), Y(o.y), Tm);
  // avisos de golpe: áreas pontilhadas que fecham até o impacto
  for (const z of G.zonas) pintarZona(g, G, z, X, Y, vw, vh, Tm);
  pintarEfeitos(g, G.fxPx, cx, cy, true);
  // figurantes: os zelotes de pé na sala, depois da luta, fazendo o gesto de respeito
  for (const e of G.figurantes || []) { e.alpha = Math.min(1, (e.alpha ?? 1) + 0.035); const q = quadroChefe(e, Tm, G); if (!q) continue; const k = q.esc || 1; g.save(); g.translate(X(e.x), Y(e.y)); g.scale((e.face > 0 ? 1 : -1) * k, k); g.drawImage(q.s.tela(), -q.ax, -q.ay); g.restore(); }
  for (const e of G.inimigos) {
    if (Math.abs(e.x - p.x) > 1200) continue;
    if (e.kind === 'chefe') {
      const q = quadroChefe(e, Tm, G);
      if (q) {
        const vira = (e.face > 0 || e.c.semVirar ? 1 : -1) * (q.inv ? -1 : 1), luz = p.lamp ? G.raioLuz() : 0;
        // os clones da Mentira: iguais ao verdadeiro, mas tremem dentro da luz da lâmpada
        for (const cl of e.clones) { const naLuz = luz && Math.hypot(cl.x - p.x, cl.y - p.y) < luz; carimbar(g, q.s, X(cl.x), Y(cl.y), q.ax, q.ay, vira, (cl.alpha ?? 1) * (naLuz ? 0.22 + 0.12 * Math.sin(Tm * 40) : 1) * Math.min(1, cl.t * 2)); }
        medirChefe(e, q, vira);
        if (q.esc > 1) { const cv = q.s.tela(), k = q.esc; g.save(); g.translate(X(e.x), Y(e.y)); g.scale(vira * k, k); g.drawImage(cv, -q.ax, -q.ay); g.restore(); }
        else carimbar(g, q.s, X(e.x), Y(e.y), q.ax, q.ay, vira);
        pintarExtrasChefe(g, e, G, X, Y, Tm);
        if (window.__verHb && e.hb) { g.strokeStyle = '#0F0'; g.lineWidth = 2; g.strokeRect(X(e.x + e.hb.dx - e.hb.w / 2), Y(e.y + e.hb.y0), e.hb.w / PX, e.hb.h / PX); } // depuração: a caixa de dano
      }
      else antigo(() => desenharChefe(g, e, Tm, G));
    } else {
      const q = quadroVicio(e, Tm);
      if (!q) { antigo(() => desenharVicio(g, e, Tm)); continue; }
      const tonto = e.stun > 0.25, yy = Y(e.y) + (e.voa ? Math.round(Math.sin(Tm * 3 + (e.art?.ph || 0)) * 2) : 0);
      if (e.elite) { const cv = q.s.tela(), k = e.escDesenho || 1.35; g.save(); g.translate(X(e.x), yy); g.scale((e.face >= 0 ? 1 : -1) * k, k); g.drawImage(cv, -q.ax, -q.ay); g.restore(); const cy2 = yy - Math.round(e.h / PX) - 4; g.fillStyle = '#F2C14E'; g.fillRect(X(e.x) - 4, cy2, 9, 2); for (const dx of [-4, 0, 4]) g.fillRect(X(e.x) + dx, cy2 - 2, 1, 2); }
      else carimbar(g, q.s, X(e.x), yy, q.ax, q.ay, e.face >= 0 ? 1 : -1, e.vista ?? 1);
      if (tonto) for (let i = 0; i < 3; i++) { const a = Tm * 5 + i * 2.09; g.fillStyle = '#FFE9A8'; g.fillRect(X(e.x) + Math.round(Math.cos(a) * 7), yy - Math.round(e.h / PX) - 5 + Math.round(Math.sin(a) * 2), 1, 1); }
    }
  }
  if (G.pecado) { // o vulto à porta: sombra pontilhada de olhos acesos
    const sp = G.pecado, x = X(sp.x), y = Y(sp.y); g.fillStyle = '#0B0812';
    for (let yy = -37; yy <= 22; yy++) { const k = (yy + 37) / 59, l = Math.round(2 + k * 13 + Math.sin(Tm * 3 + yy * 0.3) * 1.5); for (let xx = -l; xx <= l; xx++) if (yy < 16 || pontilha(x + xx, y + yy + Math.floor(Tm * 8), 1 - (yy - 16) / 7)) g.fillRect(x + xx, y + yy, 1, 1); }
    g.fillStyle = Math.floor(Tm * 2) % 5 ? '#EF6981' : '#FFFFFF'; g.fillRect(x - 4, y - 20, 2, 3); g.fillRect(x + 3, y - 20, 2, 3);
  }
  for (const m of G.moedas) { const x = X(m.x), y = Y(m.y), f = Math.floor(m.t * 10) % 4, lg = [3, 2, 1, 2][f]; g.fillStyle = '#17121f'; g.fillRect(x - (lg >> 1) - 1, y - 2, lg + 2, 5); g.fillStyle = m.maldita ? '#B8862B' : '#F2C14E'; g.fillRect(x - (lg >> 1), y - 1, lg, 3); g.fillStyle = '#FFF1BE'; g.fillRect(x - (lg >> 1), y - 1, 1, 1); }
  if (G.pet) { // o companheiro: sprites com contorno, passo animado, rabo que abana, asas que batem
    const q = G.pet, x = X(q.x), y = Y(q.y), f = q.face || 1, k = Math.floor(Tm * (q.anda || q.alvo ? 10 : 3)) % 2, mord = q.alvo && q.mordida > 0;
    if (q.tipo === 'cachorro') { const s = sprObj('cao' + k + (mord ? 'm' : ''), 26, 18, s => { const B = rampa('#9A6A3E'), Lr = rampa('#D9B88A');
        s.bola(11, 10, 7, 4.2, B); s.ret(7, 11, 9, 2, Lr[3]); s.bola(19, 6, 4.2, 3.6, B); s.ret(21, mord ? 6 : 7, 4, 2, Lr[3]); s.px(24, mord ? 6 : 7, TINTA); if (mord) s.ret(21, 9, 4, 1, Lr[2]);
        s.ret(16, 3, 2, 5, B[1]); s.px(20, 5, TINTA); s.ret(15, 8, 2, 4, cor('#C83A3A')); s.px(16, 11, cor('#F2C14E'));
        s.linha(4, 9, 1, k ? 3 : 5, 2, B[2]); for (const [lx, o2] of [[6, k], [9, 1 - k], [13, k], [16, 1 - k]]) s.ret(lx, 13 + o2, 2, 4 - o2, B[1]); });
      carimbar(g, s, x, y + 1, 13, 17, f); }
    else if (q.tipo === 'leao') { const pulo = q.salto > 0 ? 4 : 0, s = sprObj('leao' + k + (mord ? 'm' : '') + (pulo ? 's' : ''), 30, 22, s => { const C = rampa('#D9A04A'), J = rampa('#8A4A1E');
        s.bola(13, 13, 8, 4.8, C); s.ret(8, 15, 10, 2, C[4]); s.bola(21, 9, 6, 6, J); s.bola(22, 9, 3.8, 3.4, C); s.ret(24, mord ? 9 : 10, 4, 2, C[4]); s.px(27, mord ? 9 : 10, TINTA); if (mord) s.ret(24, 12, 4, 1, cor('#F4E6BC'));
        s.px(23, 8, TINTA); s.ret(18, 3, 2, 2, J[2]); s.ret(23, 3, 2, 2, J[2]);
        s.linha(5, 12, 1, k ? 7 : 9, 2, C[2]); s.ret(0, k ? 5 : 7, 3, 3, J[1]);
        if (pulo) { s.ret(7, 17, 3, 3, C[1]); s.ret(19, 15, 3, 3, C[1]); } else for (const [lx, o2] of [[7, k], [11, 1 - k], [16, k], [20, 1 - k]]) { s.ret(lx, 17 + o2, 3, 4 - o2, C[1]); s.ret(lx, 20, 3, 1, C[4]); } });
      carimbar(g, s, x, y + 1, 15, 21, f); }
    else { const bate = Math.floor(Tm * (mord ? 18 : 9)) % 2, s = sprObj('papagaio' + bate, 18, 20, s => { const V = rampa('#3FA35A'), Az = rampa('#2F6FD0'), Vm = rampa('#E2463C');
        s.ret(5, 13, 2, 6, Az[2]); s.ret(7, 14, 2, 5, rampa('#F2C14E')[3]); s.bola(8, 10, 3.6, 4.6, V); s.bola(9, 5, 3.4, 3.2, Vm); s.ret(12, 4, 3, 2, rampa('#F2C14E')[3]); s.px(14, 6, TINTA); s.px(10, 4, cor('#FFFFFF')); s.px(11, 4, TINTA);
        if (bate) s.bola(5, 5, 5, 2.4, Az); else s.bola(5, 12, 5, 2.4, Az); });
      carimbar(g, s, x, y + 6, 9, 19, f); }
  }
  if (p.pedra && !p.morto) { // a funda carregada: a linha mostra para onde a pedra vai (uma só chance)
    const a = G.ctl?.mira ?? (p.face > 0 ? 0 : Math.PI); let tx = p.x + Math.cos(a) * 14, ty = p.y - 28 + Math.sin(a) * 14, vx = Math.cos(a) * 900, vy = Math.sin(a) * 900;
    for (let i = 0; i < 22; i++) { vy += 240 * 0.03; tx += vx * 0.03; ty += vy * 0.03; if (i % 2 === (Math.floor(Tm * 12) % 2)) { g.fillStyle = i < 16 ? '#FFE9A8' : '#8A6A2C'; g.fillRect(X(tx), Y(ty), 2, 2); } }
    const hx = X(p.x) + p.face * 5, hy = Y(p.y) - 30; g.fillStyle = '#17121f'; g.fillRect(hx - 2, hy - 2, 5, 5); g.fillStyle = '#E8E4D6'; g.fillRect(hx - 1, hy - 1, 3, 3);
  }
  if (p.arpao && !p.morto) { const hx = X(p.x) - p.face * 4, hy = Y(p.y) - 34; g.fillStyle = '#A0662A'; g.fillRect(hx, hy, 1, 26); g.fillStyle = '#EEF6FB'; g.fillRect(hx - 1, hy - 4, 3, 4); }
  // outros peregrinos (multijogador) e o herói
  for (const o of G.outros) pintarJogador(g, o.corpo, o.look, o.cls, o.arma, Tm, o.hab, X, Y, false, o.armaCor, o.armaRar);
  if (!p.morto) pintarJogador(g, p, G.char.look || {}, G.char.cls, G.tipoArma, Tm, G.hab, X, Y, true, G.arma?.lamina, G.arma?.rar);
  if (G.pomba) pintarPomba(g, G.pomba, X, Y, Tm);
  else if (G.mortoT > 1.2) { const s = quadroHeroi({ ...p, morto: true, atk: null }, G.char.look || {}, G.char.cls, G.tipoArma, Tm, G.hab); s.dissolve(clamp((1.9 - G.mortoT) / 0.7, 0, 1), 5); carimbar(g, s, X(p.x), Y(p.y), AX, AY, p.face); }
  pintarEfeitos(g, G.fxPx, cx, cy, false);
  elAtual = G.chefe && ELEMENTO_DO_CHEFE[G.chefe.id]; for (const t of G.tiros) pintarTiro(g, t, X(t.x), Y(t.y), Tm);
  for (const o of G.outros) if (o.corpo.ts) for (const t of o.corpo.ts) pintarTiro(g, { x: t[0], y: t[1], vx: t[2], vy: t[3], r: t[4], tipo: t[5], cor: t[6], amigo: true }, X(t[0]), Y(t[1]), Tm);
  // poeira do pulo e da queda: duas nuvenzinhas que se abrem para os lados, crescem e se desfazem
  for (const d of G.poeiras || []) { const k = 1 - d.t / d.max, cx0 = X(d.x), cy0 = Y(d.y);
    for (const sd of [-1, 1]) for (const [dx, dy, rr, at] of [[3, -1, 2.6, 0], [6, -2, 2, 0.12], [9, -1, 1.5, 0.22]]) { const kk = clamp((k - at) / (1 - at), 0, 1); if (kk <= 0) continue; const r = Math.max(1, Math.round(rr * d.f * (0.5 + Math.sin(kk * Math.PI) * 0.9))), x = cx0 + sd * Math.round((dx + kk * 9) * d.f), y = cy0 + dy - Math.round(kk * 3 * d.f);
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + 1) { if (kk > 0.55 && (xx + yy + cx0) % 2) continue; g.fillStyle = yy < 0 ? '#E8E0D0' : yy === r ? '#8A7E70' : '#C9BFAE'; g.fillRect(x + xx, y + yy, 1, 1); } }
    for (let i = 0; i < 3; i++) { const kk = clamp(k * 1.3 - i * 0.1, 0, 1); if (kk > 0 && kk < 1) { g.fillStyle = '#D8CFC0'; g.fillRect(cx0 + Math.round((i - 1) * 5 * d.f * (1 + kk)), cy0 - 3 - Math.round(kk * 8 * d.f), 1, 1); } } }
  for (const q of G.parts) { const k = q.t / q.max, x = X(q.x), y = Y(q.y); g.fillStyle = q.cor; if (q.anel) { const r = Math.round(q.r / PX * (1 - k)); g.globalAlpha = k > 0.5 ? 1 : 0.6; for (let a = 0; a < 24; a++) if ((a + Math.floor(Tm * 20)) % 3) g.fillRect(x + Math.round(Math.cos(a / 24 * TAU) * r), y + Math.round(Math.sin(a / 24 * TAU) * r), k > 0.6 ? 2 : 1, k > 0.6 ? 2 : 1); g.globalAlpha = 1; } else { const lg = k > 0.5 && q.r > 2 ? 2 : 1; g.fillRect(x, y, lg, lg); } }
  if (G.N.pocos) for (const o of G.N.pocos) { const x = X(o.x), y = Y(o.y) + 3; if (x < -20 || x > vw + 4) continue; for (let i = 0; i < 16; i++) { const h1 = Math.round(Math.sin((o.x + i) * 0.4 + Tm * 3) * 1.5); g.fillStyle = '#123847'; g.fillRect(x + i, y + h1, 1, 40); g.fillStyle = (i + Math.floor(Tm * 6)) % 5 < 2 ? '#BFF0F8' : '#3A9AB0'; g.fillRect(x + i, y + h1, 1, 1); } }
  if (G.def.mundo === 'leviata' && G.N.arena) { // o mar bate no costado: ondas na frente de tudo
    const yy = Y(G.N.arena.chao) + 4; for (let xx = 0; xx < vw; xx++) { const h1 = Math.round(Math.sin((xx + cx) * 0.09 + Tm * 2.2) * 2 + Math.sin((xx + cx) * 0.031 - Tm * 1.3) * 3); g.fillStyle = '#123847'; g.fillRect(xx, yy + h1, 1, vh - yy); g.fillStyle = (xx + Math.floor(Tm * 6)) % 9 < 3 ? '#BFF0F8' : '#3A9AB0'; g.fillRect(xx, yy + h1, 1, 1); if ((xx * 7 + Math.floor(Tm * 3)) % 23 === 0) { g.fillStyle = '#1C5A6E'; g.fillRect(xx, yy + h1 + 5, 4, 1); } }
  }
  if (chefe) pintarPalco(g, G, chefe, X, Y, Tm, true);
  pintarLuzPixel(g, G, vw, vh, cx, cy, luzCv);
  pintarClima(g, G, vw, vh, cx, Tm);
  pintarHud(g, G, vw); barraChefe(g, G, vw);

  // amplia: primeiro por um fator inteiro (pixels nítidos), depois ajusta à tela
  const cvw = G.cv.width, cvh = G.cv.height, k = Math.max(1, Math.ceil(cvh / vh));
  const G2 = G.g; G2.setTransform(1, 0, 0, 1, 0, 0);
  if (G.leve) { G2.imageSmoothingEnabled = false; G2.drawImage(baixa, 0, 0, vw, vh, 0, 0, vw * esc * G.dpr, cvh); } /* aparelho lento: um passo só */
  else { if (meio.width !== vw * k || meio.height !== vh * k) { meio.width = vw * k; meio.height = vh * k; }
    mg.imageSmoothingEnabled = false; mg.drawImage(baixa, 0, 0, vw * k, vh * k);
    G2.imageSmoothingEnabled = true; G2.imageSmoothingQuality = 'low'; G2.drawImage(meio, 0, 0, vw * k, vh * k, 0, 0, vw * esc * G.dpr, cvh); }
  pintarTextos(G2, G, esc, cx, cy);
}

// o chicote: uma curva que se desenrola da mão até a ponta, com o estalo no fim
function pintarChicote(g, p, X, Y, dir, face, k, alc, cor) {
  const u = { lado: [1, 0], cima: [0, -1], baixo: [0, 1], diagC: [0.72, -0.7], diagB: [0.72, 0.7], rasteira: [1, 0.12] }[dir] || [1, 0];
  const ox = X(p.x) + face * 6, oy = Y(p.y) - (dir === 'rasteira' ? 6 : 15), ext = Math.min(1, k * 2.2), L = alc / PX, n = 22;
  for (let i = 0; i <= n; i++) {
    const s = i / n; if (s > ext) break;
    const onda = Math.sin(s * 9 - k * 16) * (1 - k) * 7 * s, x = ox + face * u[0] * L * s - u[1] * onda * face, y = oy + u[1] * L * s + u[0] * onda - Math.sin(s * Math.PI) * 5 * (1 - k) * u[0];
    g.fillStyle = '#17121f'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); g.fillStyle = s > 0.8 ? '#FFF0D4' : cor; g.fillRect(Math.round(x), Math.round(y), s > 0.6 ? 1 : 2, s > 0.6 ? 1 : 2);
    if (i === n && k > 0.35 && k < 0.8) { g.fillStyle = '#FFFFFF'; for (let a = 0; a < 6; a++) g.fillRect(Math.round(x + Math.cos(a * 1.05) * 4), Math.round(y + Math.sin(a * 1.05) * 4), 2, 1); }
  }
}

function pintarJogador(g, p, look, cls, arma, Tm, hab, X, Y, eu, armaCor, armaRar) {
  if (arma === 'chicote' && p.atk && !p.atk.semCaixa) pintarChicote(g, p, X, Y, p.atk.dir, p.atk.face, Math.min(1, p.atk.t / p.atk.dur), 118, '#C48A4E');
  if (p.acoite) pintarChicote(g, p, X, Y, 'lado', p.acoite.face, Math.min(1, p.acoite.t / p.acoite.dur), p.acoite.alc, '#FFE08A');
  const s = quadroHeroi(p, look, cls, arma, Tm, hab, armaCor ? { armaCor } : {});
  if (p.rastro?.length) for (let i = 0; i < p.rastro.length; i += 3) { const r = p.rastro[i]; carimbar(g, vulto(s, cor('#BFD6E8')), X(r.x), Y(r.y), AX, AY, r.face, 0.18 + r.t * 1.6); }
  if (p.inv > 0 && !p.morto && Math.floor(Tm * 20) % 2 && !(p.flashT > 0)) g.globalAlpha = 0.55;
  carimbar(g, s, X(p.x), Y(p.y), AX, AY, p.face); g.globalAlpha = 1;
  // armas épicas e lendárias brilham na mão: centelhas da cor da lâmina sobem em volta
  if ((armaRar === 'epica' || armaRar === 'lendaria') && !p.morto) { const n = armaRar === 'lendaria' ? 6 : 3, hx = X(p.x + p.face * 12), hy = Y(p.y) - 16; g.fillStyle = armaCor || '#FFE08A';
    for (let i = 0; i < n; i++) { const k = (Tm * 0.9 + i / n) % 1; g.globalAlpha = (1 - k) * (armaRar === 'lendaria' ? 0.95 : 0.6); g.fillRect(hx + Math.round(Math.sin(i * 2.3 + Tm * 3) * 6), hy - Math.round(k * 14), 1, 1); }
    if (armaRar === 'lendaria') { g.globalAlpha = 0.18 + 0.1 * Math.sin(Tm * 4); g.fillRect(hx - 2, hy - 2, 5, 5); } g.globalAlpha = 1; }
  // halo do lampião
  if (p.lampA > 0.3 || p.vig > 0) { const lx = X(p.x + p.face * 12), ly = Y(p.y) - 30; g.fillStyle = '#FFE9A8'; g.globalAlpha = 0.35; for (let a = 0; a < 8; a++) g.fillRect(lx + Math.round(Math.cos(a * 0.785 + Tm * 3) * (5 + (a % 2) * 3)), ly + Math.round(Math.sin(a * 0.785 + Tm * 3) * (5 + (a % 2) * 3)), 1, 1); g.globalAlpha = 1; }
  if (p.orando > 0) { g.fillStyle = '#FFE9A8'; for (let i = 0; i < 9; i++) { const xx = X(p.x) - 7 + ((i * 5) % 15), yy = Y(p.y) - ((Tm * 40 + i * 13) % 46); g.globalAlpha = 0.7; g.fillRect(xx, yy, 1, 2 + (i % 2)); } g.globalAlpha = 1; }
  if (p.carga > 0.15) { g.fillStyle = p.carga >= 0.6 ? '#FFFFFF' : '#FFE9A8'; const r = Math.round(14 - Math.min(0.6, p.carga) * 14); for (let a = 0; a < 10; a++) g.fillRect(X(p.x) + Math.round(Math.cos(a * 0.628 + Tm * 6) * r), Y(p.y) - 14 + Math.round(Math.sin(a * 0.628 + Tm * 6) * r), 1, 1); }
}

// a pomba de luz que desce na oração + golpe: cai do alto num feixe e some num clarão ao tocar o chão
const POMBA = ['.......WW..', '..WW..WWWo.', '.WWWW.WWWW.', 'WWWWWWWWW..', '.WWWWWWWW..', '..WWWWWW...', '...WWWW....', '....WW.....'];
function pintarPomba(g, P, X, Y, Tm) {
  const k = Math.min(1, P.t / 0.42), x = X(P.x), chao = Y(P.y), y = Math.round(chao - 190 + k * k * 150), fim = P.t > 0.42 ? Math.max(0, 1 - (P.t - 0.42) / 0.9) : 1;
  g.save(); g.globalAlpha = 0.28 * fim; const gr = g.createLinearGradient(0, chao - 220, 0, chao); gr.addColorStop(0, 'rgba(255,244,207,0)'); gr.addColorStop(1, 'rgba(255,244,207,.9)'); g.fillStyle = gr; g.fillRect(x - 14, chao - 220, 28, 220); g.restore();
  if (P.t > 0.42) return;
  const asa = Math.floor(Tm * 12) % 2; g.fillStyle = '#FFF8E6';
  for (let r = 0; r < POMBA.length; r++) for (let c = 0; c < POMBA[r].length; c++) { const ch = POMBA[r][c]; if (ch === '.') continue; g.fillStyle = ch === 'o' ? '#E8B04A' : '#FFF8E6'; g.fillRect(x - 5 + c, y + r - (asa && r < 3 ? 1 : 0), 1, 1); }
  g.globalAlpha = 0.35; g.fillStyle = '#FFF4CF'; g.fillRect(x - 8, y - 3, 17, 14); g.globalAlpha = 1;
}

let elAtual = null; /* o elemento do chefe em luta: os dardos dele saem na matéria dele */
function pintarTiro(g, t, x, y, Tm) {
  if (!t.cor) t.cor = '#D8C8F0';
  const r = Math.max(2, Math.round(t.r / PX));
  if (elAtual && !t.amigo && !t.tipo && tiroElemento(g, elAtual, t, x, y, r, Tm)) return;
  if (t.tipo === 'choque') { const d = Math.sign(t.vx), f = Math.floor(Tm * 12) % 2; for (let i = 0; i < 9; i++) { const h = [3, 6, 10, 13, 11, 8, 5, 3, 1][i] + (i % 2 ? f : 0); g.fillStyle = i < 4 ? '#fff' : t.cor; g.fillRect(x + d * (4 - i) , y + 6 - h, 1, h); } g.fillStyle = '#17121f'; g.fillRect(x - 5, y + 6, 10, 1); return; }
  if (t.tipo === 'fogo' || (elAtual === 'fogo' && !t.tipo && !t.amigo)) { // bola de fogo: halo, cauda de línguas que ondulam, núcleo branco em losango e fagulhas que ficam para trás
    const vel = Math.hypot(t.vx, t.vy) || 1, ux = t.vx / vel, uy = t.vy / vel, f = Math.floor(Tm * 20), R = r + 1;
    g.globalAlpha = 0.22; g.fillStyle = '#FF8A2A'; g.fillRect(x - R - 3, y - R - 2, R * 2 + 6, R * 2 + 4); g.fillRect(x - R - 1, y - R - 4, R * 2 + 2, R * 2 + 8); g.globalAlpha = 1;
    for (let k = 9; k >= 1; k--) { // cauda: mais fina e mais vermelha para trás, serpenteando
      const d = k * 2.2, on = Math.sin(Tm * 22 + k * 0.9) * (k * 0.35), rr = Math.max(1, Math.round(R * (1 - k / 11))), cx2 = x - ux * d - uy * on, cy2 = y - uy * d + ux * on - k * 0.25;
      g.fillStyle = k > 6 ? '#7A1A14' : k > 4 ? '#C9281F' : k > 2 ? '#FF6A1F' : '#FFB53A'; g.fillRect(Math.round(cx2 - rr), Math.round(cy2 - rr), rr * 2, rr * 2); }
    for (let yy = -R; yy <= R; yy++) { const lg = R - Math.abs(yy) + ((yy + f) % 2 ? 0 : 1); g.fillStyle = Math.abs(yy) > R * 0.55 ? '#FF8A2A' : '#FFD23F'; g.fillRect(x - lg, y + yy, lg * 2, 1); }
    const n = Math.max(1, R - 2); for (let yy = -n; yy <= n; yy++) { const lg = n - Math.abs(yy); g.fillStyle = '#FFF6C8'; g.fillRect(x - lg + Math.round(ux), y + yy, Math.max(1, lg * 2), 1); }
    g.fillStyle = '#FFFFFF'; g.fillRect(x - 1 + Math.round(ux * 2), y - 1, 2, 2);
    for (let k = 0; k < 4; k++) { const d = 8 + ((f * 3 + k * 7) % 14), lado = ((f + k * 5) % 7) - 3; g.fillStyle = k % 2 ? '#FFE26B' : '#FF8A2A'; g.fillRect(Math.round(x - ux * d - uy * lado), Math.round(y - uy * d + ux * lado - (d * 0.2)), 1, 1); }
    return; }
  if (t.tipo === 'som') { // onda de som: três arcos voltados para onde ela vai
    const a = Math.atan2(t.vy, t.vx); g.fillStyle = '#BFF0F8';
    for (let k = 0; k < 3; k++) { const rr = r + k * 3 - 2; g.globalAlpha = 1 - k * 0.3; for (let q = -5; q <= 5; q++) { const b = a + q * 0.16; g.fillRect(x + Math.round(Math.cos(b) * rr - Math.cos(a) * k * 4), y + Math.round(Math.sin(b) * rr - Math.sin(a) * k * 4), k ? 1 : 2, k ? 1 : 2); } }
    g.globalAlpha = 1; return; }
  if (t.tipo === 'lanca') { const d = Math.sign(t.vx); g.fillStyle = '#17121f'; g.fillRect(x - d * 16 - (d < 0 ? 0 : 0), y - 1, 22, 3); g.fillStyle = '#A0662A'; g.fillRect(Math.min(x - d * 16, x + d * 4), y, 20, 1); g.fillStyle = '#EEF6FB'; for (let k = 0; k < 6; k++) g.fillRect(x + d * (4 + k), y - Math.floor((5 - k) / 2), 1, 1 + (5 - k - ((5 - k) % 2 ? 1 : 0)));
    for (let k = 1; k <= 5; k++) { g.globalAlpha = 0.5 - k * 0.08; g.fillStyle = '#FFE08A'; g.fillRect(x - d * (16 + k * 5), y, 4, 1); } g.globalAlpha = 1; return; }
  if (t.tipo === 'onda') { const d = Math.sign(t.vx); for (let yy = -r * 1.5; yy <= r * 1.5; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(yy / (r * 1.5), 2))) * 5); g.fillStyle = '#FFE08A'; g.fillRect(x + d * (lg - 3), y + yy, 3, 1); g.fillStyle = '#fff'; g.fillRect(x + d * lg, y + yy, 1, 1); } return; }
  if (!t.amigo) { // os dardos dos vícios e dos chefes: bolas de energia que pulsam, com aura, faíscas em órbita e um rastro que ondula
    const C = /^#[0-9a-f]{6}$/i.test(t.cor || '') ? t.cor : '#C79BFF', claro = mistura(C, '#FFFFFF', 0.55), escuro = mistura(C, '#05060B', 0.5), sem = (t.x * 7 + t.y * 3) % 6.28;
    const R = r + (Math.floor(Tm * 14 + sem) % 3 === 0 ? 1 : 0), vel = Math.hypot(t.vx, t.vy) || 1, ux = t.vx / vel, uy = t.vy / vel, F = Math.floor(Tm * 24 + sem);
    for (let k = 6; k >= 1; k--) { const on = Math.sin(Tm * 18 + k * 1.1 + sem) * k * 0.45, rr = Math.max(1, Math.round(R * (1 - k / 7.5))), cx2 = Math.round(x - ux * k * 2.6 - uy * on), cy2 = Math.round(y - uy * k * 2.6 + ux * on);
      g.globalAlpha = 0.75 - k * 0.1; g.fillStyle = k > 3 ? escuro : C; g.fillRect(cx2 - rr, cy2 - rr + 1, rr * 2, rr * 2 - 2); g.fillRect(cx2 - rr + 1, cy2 - rr, rr * 2 - 2, rr * 2); }
    g.globalAlpha = 0.35; g.fillStyle = C; const A = R + 3; for (let yy = -A; yy <= A; yy++) for (let xx = -A; xx <= A; xx++) { const d2 = xx * xx + yy * yy; if (d2 <= A * A && d2 > (R + 1) * (R + 1) && (xx + yy + F) % 2 === 0) g.fillRect(x + xx, y + yy, 1, 1); }
    g.globalAlpha = 1;
    const disco = (rr, c) => { g.fillStyle = c; for (let yy = -rr; yy <= rr; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, rr * rr - yy * yy))); g.fillRect(x - lg, y + yy, lg * 2 || 1, 1); } };
    disco(R + 1, '#17121f'); disco(R, C); disco(Math.max(1, Math.round(R * 0.62)), claro);
    g.fillStyle = '#FFFFFF'; g.fillRect(x - 1 + Math.round(ux), y - 1, 2, 2); g.fillRect(x - Math.round(R * 0.45), y - Math.round(R * 0.5), 1, 1);
    for (let k = 0; k < 3; k++) { const an = Tm * 9 * (k % 2 ? -1 : 1) + k * 2.094 + sem, rr = R + 2 + (k === 1 ? 1 : 0); g.fillStyle = k === 2 ? '#FFFFFF' : claro; g.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(y + Math.sin(an) * rr * 0.85), 1, 1); }
    if (F % 9 === 0) { g.fillStyle = claro; let ax = x + R, ay = y; for (let i = 0; i < 4; i++) { ax += 1; ay += i % 2 ? -1 : 1; g.fillRect(ax, ay, 1, 1); } } // estalo de energia
    return; }
  // rastro e núcleo
  const vx = t.vx / 60 / PX, vy = t.vy / 60 / PX;
  for (let k = 1; k <= 4; k++) { g.globalAlpha = 0.6 - k * 0.12; g.fillStyle = t.amigo ? '#FFE9A8' : t.cor; const rr = Math.max(1, r - k); g.fillRect(Math.round(x - vx * k * 1.6 - rr / 2), Math.round(y - vy * k * 1.6 - rr / 2), rr, rr); }
  g.globalAlpha = 1; g.fillStyle = '#17121f'; g.fillRect(x - r, y - r + 2, r * 2, r * 2 - 4); g.fillRect(x - r + 2, y - r, r * 2 - 4, r * 2); g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
  g.fillStyle = t.amigo ? '#FFE9A8' : (t.cor || '#FFD23F').startsWith('#') ? t.cor : '#FFD23F'; g.fillRect(x - r + 1, y - r + 2, r * 2 - 2, r * 2 - 4); g.fillRect(x - r + 2, y - r + 1, r * 2 - 4, r * 2 - 2);
  g.fillStyle = '#fff'; g.fillRect(x - 1, y - 2, Math.max(1, r - 2), Math.max(1, r - 2));
}

function pintarZona(g, G, z, X, Y, vw, vh, Tm) {
  const A = G.N.arena, p = G.p, ativa = z.aviso <= 0; let c = !z.cor ? '#D8C8F0' : z.cor.startsWith('#') ? z.cor : `rgb(${z.cor})`, pisca = Math.floor(Tm * 12) % 2;
  const luzPerto = p.lamp && Math.hypot(z.x + (z.tipo === 'muro' ? z.w / 2 : 0) - p.x, (z.y ?? p.y) - p.y) < G.raioLuz();
  if (z.oculta && !ativa && !luzPerto) { if (pisca && Math.floor(Tm * 3) % 3 === 0) { g.fillStyle = c; g.globalAlpha = 0.25; g.fillRect(X(z.x), Y(z.y + z.h) - 1, Math.round(z.w / PX), 1); g.globalAlpha = 1; } return; } // a cilada só aparece à luz
  if (z.isca && z.sinal) { const x = X(z.x), y = Y(z.y), r = Math.round(z.r / PX); g.fillStyle = luzPerto ? '#FFE9A8' : c; for (let a = 0; a < 40; a++) if ((a + Math.floor(Tm * 10)) % 2) g.fillRect(x + Math.round(Math.cos(a / 40 * TAU) * r), y + Math.round(Math.sin(a / 40 * TAU) * r), 1, 1); if (luzPerto) { g.globalAlpha = 0.35; for (let yy = -r; yy <= r; yy += 2) for (let xx = -r; xx <= r; xx += 2) if (xx * xx + yy * yy < r * r) g.fillRect(x + xx, y + yy, 1, 1); g.globalAlpha = 1; } return; } // o abrigo verdadeiro brilha sob a lâmpada
  if (z.tipo === 'muro' && ativa && z.dur > 0.4) { const x = X(z.x), y = Y(z.y), w = Math.round(z.w / PX), h = Math.round(z.h / PX); g.fillStyle = c; g.globalAlpha = 0.85; g.fillRect(x, y, w, h); g.globalAlpha = 1; g.fillStyle = '#FFFFFF'; g.fillRect(x, y, w, 1); for (let i = 0; i < w; i += 4) g.fillRect(x + i, y + ((i + Math.floor(Tm * 12)) % Math.max(1, h)), 1, 1); return; } // paredes que andam: onda, escudo, âncora, ouro
  if (z.tipo === 'circ') {
    const x = X(z.x), y = Y(z.y), r = Math.round(z.r / PX), k = ativa ? 1 : clamp(1 - z.aviso / 0.9, 0, 1);
    g.fillStyle = ativa ? '#fff' : c;
    for (let a = 0; a < 40; a++) if (ativa || (a + Math.floor(Tm * 10)) % 2) g.fillRect(x + Math.round(Math.cos(a / 40 * TAU) * r), y + Math.round(Math.sin(a / 40 * TAU) * r), 1, 1);
    for (let yy = -r; yy <= r; yy += ativa ? 1 : 2) for (let xx = -r; xx <= r; xx += ativa ? 1 : 2) { const d = Math.hypot(xx, yy) / r; if (d < k && (ativa || pontilha(xx + 99, yy + 99, 0.3 + k * 0.3))) g.fillRect(x + xx, y + yy, 1, 1); }
    return;
  }
  const y0w = z.tipo === 'col' ? (z.y0 ?? (A ? A.y0 : p.y - 600)) : z.y, y1w = z.tipo === 'col' ? (z.y1 ?? (A ? A.chao : p.y + 100)) : z.y + z.h, xw = z.tipo === 'col' ? z.x - z.w / 2 : z.x;
  const x = X(xw), y = Y(y0w), w = Math.round(z.w / PX), h = Math.round((y1w - y0w) / PX);
  if (z.santo) { // a luz do Espírito: um véu claro com o miolo aceso e centelhas, nunca um bloco chapado
    if (!ativa) return; const k = clamp(z.dur / 0.4, 0, 1); g.save(); g.globalAlpha = 0.22 * k; g.fillStyle = c; g.fillRect(x, y, w, h);
    g.globalAlpha = 0.55 * k; g.fillStyle = '#FFF8E6'; if (z.tipo === 'col') g.fillRect(x + (w >> 1) - 1, y, 3, h); else g.fillRect(x, y + (h >> 1) - 1, w, 2);
    g.globalAlpha = 0.9 * k; for (let i = 0; i < (z.tipo === 'col' ? 10 : 26); i++) { const px = z.tipo === 'col' ? x + ((i * 7 + Math.floor(Tm * 30)) % w) : x + ((i * 37 + Math.floor(Tm * 40)) % w), py = z.tipo === 'col' ? y + ((i * 53 + Math.floor(Tm * 120)) % h) : y + ((i * 11 + Math.floor(Tm * 20)) % h); g.fillRect(px, py, 1, 2); }
    g.restore(); return;
  }
  const el = z.isca ? null : z.amigo ? elementoAmigo(z) : G.chefe && ELEMENTO_DO_CHEFE[G.chefe.id];
  if (el && (z.tipo === 'col' || z.tipo === 'faixa')) { /* a matéria do chefe: fogo sobe, raio risca, pedra cai */
    const k = ativa ? 1 : clamp(1 - z.aviso / 0.9, 0, 1);
    if (ativa) { if (zonaElemento(g, el, z, x, y, w, h, true, 1, Tm)) return; }
    else { zonaElemento(g, el, z, x, y, w, h, false, k, Tm); if (z.amigo) return; c = corDoElemento(el) || c; } /* golpe amigo não precisa de aviso pontilhado */ /* o aviso: pontilhado legível na cor do elemento, com os sinais dele no chão */
  }
  if (ativa) {
    g.fillStyle = z.tipo === 'poca' ? c : '#fff'; if (z.tipo === 'poca') { for (let i = 0; i < w; i++) g.fillRect(x + i, y + h - 3 - ((i + Math.floor(Tm * 6)) % 3 === 0 ? 1 : 0), 1, 4); g.fillStyle = '#fff'; for (let i = 2; i < w; i += 5) g.fillRect(x + i, y + h - 5 - ((i + Math.floor(Tm * 8)) % 4), 1, 1); return; }
    g.fillRect(x + 1, y, w - 2, h); g.fillStyle = c; g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); if (z.tipo === 'col') for (let i = 0; i < 8; i++) g.fillRect(x - 3 + ((i * 7) % (w + 6)), y + h - 1 - ((i * 5) % 9), 1, 2);
    return;
  }
  if (z.tipo === 'ret' || (z.isca && ativa)) return;
  const k = clamp(1 - z.aviso / 0.9, 0, 1); g.fillStyle = c;
  for (let yy = 0; yy < h; yy += 1) for (let xx = (yy & 1); xx < w; xx += 2) if (pontilha(xx, yy + Math.floor(Tm * 16), 0.12 + k * 0.4)) g.fillRect(x + xx, y + yy, 1, 1);
  g.fillStyle = pisca ? '#fff' : c; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); if (z.tipo === 'col') { g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); }
}

// O palco de cada gigante: a plateia dos dois exércitos no vale de Elá, a savana aberta do Beemote, o barco no mar do Leviatã.
function pintarArenaTema(g, G, X, Y, Tm) {
  const A = G.N.arena, chao = Y(A.chao), x0 = X(A.x0), x1 = X(A.x1), larg = x1 - x0, vibra = G.tremorA > 2 || (G.chefe && G.chefe.flash > 0) ? 1 : 0;
  if (G.def.mundo === 'golias') {
    // duas encostas e dois exércitos assistindo: Israel à esquerda, os filisteus à direita (1Sm 17:3)
    for (const lado of [0, 1]) for (let fila = 0; fila < 4; fila++) for (let i = 0; i < 16; i++) {
      const k = i / 16, x = lado ? x1 - 8 - k * larg * 0.36 - fila * 3 : x0 + 8 + k * larg * 0.36 + fila * 3, y = chao - 34 - fila * 13 - Math.round((1 - k) * 26) - ((vibra || Math.floor(Tm * 2 + i + fila) % 7 === 0) && (i + fila) % 2 ? 2 : 0), longe = fila * 0.14;
      g.globalAlpha = 0.85 - longe; g.fillStyle = lado ? '#3A1E22' : '#2B3140'; g.fillRect(x - 2, y, 5, 8); g.fillRect(x - 1, y - 4, 3, 4);
      g.fillStyle = lado ? '#B03A2E' : '#C9C3AE'; g.fillRect(x - 1, y - 5, 3, 1); if (lado) g.fillRect(x, y - 7, 1, 2);
      g.fillStyle = '#17121f'; g.fillRect(x + (lado ? -4 : 4), y - 12 - ((vibra && i % 3 === 0) ? 3 : 0), 1, 20); g.fillStyle = '#9FB0C0'; g.fillRect(x + (lado ? -4 : 4), y - 14 - ((vibra && i % 3 === 0) ? 3 : 0), 1, 2);
      if (i % 5 === 2 && fila === 1) { g.fillStyle = lado ? '#8E2B45' : '#C9A63C'; g.fillRect(x + (lado ? -4 : 5), y - 22, 5, 4); g.fillStyle = '#17121f'; g.fillRect(x + (lado ? -4 : 4), y - 22, 1, 12); }
    }
    g.globalAlpha = 1;
  } else if (G.def.mundo === 'behemote') {
    // savana: sol baixo, acácias de copa chata e capim alto que balança
    g.fillStyle = '#F2B25A'; g.globalAlpha = 0.5; for (let r = 26; r > 0; r -= 2) { g.globalAlpha = 0.06 + (26 - r) * 0.012; g.fillRect(x0 + larg * 0.72 - r, chao - 120 - r, r * 2, r * 2); } g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { const x = x0 + 30 + i * larg / 5 + (i % 2) * 18, h = 54 + (i * 13) % 26; g.fillStyle = '#1A1410'; g.fillRect(x, chao - h, 3, h); g.fillRect(x - 6, chao - h + 8, 7, 2); g.fillRect(x + 3, chao - h + 14, 8, 2);
      for (let j = 0; j < 9; j++) { const lg = 26 - Math.abs(j - 2) * 3; g.fillStyle = j < 2 ? '#3A3A1E' : '#24260F'; g.fillRect(x + 1 - lg + (j % 2) * 2, chao - h - 8 + j * 2, lg * 2, 2); } }
    for (let xx = x0; xx < x1; xx += 3) { const h = 6 + ((xx * 7) % 9), b = Math.round(Math.sin(Tm * 2 + xx * 0.08) * 2); g.fillStyle = (xx * 3) % 5 ? '#6B5A26' : '#8E7A32'; g.fillRect(xx + b, chao - h, 1, h); g.fillRect(xx, chao - (h >> 1), 1, h >> 1); }
  } else if (G.def.mundo === 'leviata') {
    // o barco: mastro, verga, vela recolhida, cordame e amurada; o convés é o chão da luta
    const mx = (x0 + x1) >> 1, bal = Math.round(Math.sin(Tm * 0.9) * 2);
    g.fillStyle = '#1B1410'; g.fillRect(mx - 2, chao - 210, 5, 210); g.fillRect(mx - 70 + bal, chao - 196, 140, 3);
    g.fillStyle = '#B9AE94'; for (let i = -66; i < 66; i++) g.fillRect(mx + i + bal, chao - 193, 1, 5 + Math.round(Math.abs(Math.sin(i * 0.19)) * 5));
    g.fillStyle = '#2A1F18'; for (let k = 0; k <= 60; k++) { g.fillRect(mx - 68 + bal + Math.round(-k * (mx - x0 - 80) / 60), chao - 194 + Math.round(k * 190 / 60), 1, 1); g.fillRect(mx + 68 + bal + Math.round(k * (x1 - mx - 80) / 60), chao - 194 + Math.round(k * 190 / 60), 1, 1); }
    for (let xx = x0 + 4; xx < x1; xx += 14) { g.fillStyle = '#2A1F18'; g.fillRect(xx, chao - 12, 2, 12); } g.fillRect(x0, chao - 13, larg, 2);
    g.fillStyle = '#8E2B45'; g.fillRect(mx + 3, chao - 216, 12 + bal, 5);
  }
}

function pintarExtrasChefe(g, b, G, X, Y, Tm) {
  const x = X(b.x), y = Y(b.y), h = Math.round(b.h / PX);
  if (b.raios) { // os raios do relógio: pontilhados no aviso, cheios quando ferem
    const r = b.raios, cy = y - Math.round(h * 0.55), aviso = r.aviso > 0; g.fillStyle = aviso ? '#FFE9A8' : b.d.cor || '#FFB05A';
    for (let i = 0; i < r.n; i++) { const a = r.a + i * TAU / r.n, ux = Math.cos(a), uy = Math.sin(a); for (let d = 15; d < r.len / PX; d += aviso ? 4 : 1) { g.fillRect(x + Math.round(ux * d), cy + Math.round(uy * d), aviso ? 1 : 2, aviso ? 1 : 2); } }
    if (!aviso) { g.fillStyle = '#FFFFFF'; for (let i = 0; i < r.n; i++) { const a = r.a + i * TAU / r.n; for (let d = 15; d < r.len / PX; d += 3) g.fillRect(x + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d), 1, 1); } }
  }
  if (b.encanta) { g.fillStyle = '#FF8FB8'; for (let i = 0; i < 3; i++) { const rr = (340 - ((Tm * 150 + i * 110) % 330)) / PX; for (let a = 0; a < 40; a++) if ((a + i) % 2) g.fillRect(x + Math.round(Math.cos(a * 0.157) * rr), y - (h >> 1) + Math.round(Math.sin(a * 0.157) * rr), 1, 1); } }
  if (b.quebrado > 0 || b.tonto > 0) for (let i = 0; i < 3; i++) { const a = Tm * 4 + i * 2.09; g.fillStyle = '#FFE9A8'; const sx = x + Math.round(Math.cos(a) * 13), sy = y - h - 8 + Math.round(Math.sin(a) * 3); g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); }
  if (b.exposto > 0 && Math.floor(Tm * 10) % 2) { g.fillStyle = '#FFE9A8'; for (let a = 0; a < 12; a++) g.fillRect(x + Math.round(Math.cos(a * 0.52) * 8), y - Math.round(h * 0.86) + Math.round(Math.sin(a * 0.52) * 8), 1, 1); }
}

function pintarClima(g, G, vw, vh, cx, Tm) {
  const tipo = G.tm.part, n = tipo === 'chuva' ? 46 : 22; g.fillStyle = G.tm.acento;
  for (let i = 0; i < n; i++) {
    const r = hash(i, 3, 9), r2 = hash(i, 7, 2); let x, y;
    if (tipo === 'chuva') { x = (r * vw * 1.3 - Tm * 60 - cx * 0.4) % vw; y = (r2 * vh + Tm * (260 + r * 120)) % vh; g.globalAlpha = 0.35; g.fillRect(Math.round((x + vw) % vw), Math.round(y), 1, 4); continue; }
    if (tipo === 'brasa' || tipo === 'vagalume' || tipo === 'bolha') { x = r * vw + Math.sin(Tm * (0.5 + r2) + i) * 10 - cx * 0.25; y = vh - ((r2 * vh + Tm * (8 + r * 12)) % vh); g.globalAlpha = Math.floor(Tm * 3 + i) % 3 ? 0.7 : 0.25; }
    else if (tipo === 'estrela') { x = r * vw - cx * 0.1; y = r2 * vh * 0.7; g.globalAlpha = Math.floor(Tm * 2 + i) % 4 ? 0.2 : 0.7; }
    else { x = r * vw * 1.2 + Tm * (6 + r2 * 9) * (tipo === 'areia' ? 5 : 1) - cx * 0.3; y = (r2 * vh + Tm * (tipo === 'po' ? 3 : 12 + r * 8) + Math.sin(Tm + i) * 4) % vh; g.globalAlpha = tipo === 'po' ? 0.28 : 0.55; }
    g.fillRect(Math.round(((x % vw) + vw) % vw), Math.round(y), 1, tipo === 'folha' || tipo === 'petala' ? 2 : 1);
  }
  g.globalAlpha = 1;
  // vinheta pontilhada nos cantos
  g.fillStyle = '#06070f';
  for (let y = 0; y < vh; y += 1) { const k = Math.abs(y / vh - 0.5) * 2; for (const lado of [0, 1]) for (let i = 0; i < 12; i++) { const x = lado ? vw - 1 - i : i, f = (1 - i / 12) * (0.12 + k * 0.3); if (pontilha(x, y, f)) g.fillRect(x, y, 1, 1); } }
}

// textos na resolução da tela, com fonte de pixel
function pintarTextos(g, G, esc, cx, cy) {
  const d = G.dpr, e = esc * d, v = G.vista, p = G.p, cm = G.cm, def = G.def, u = Math.max(1, Math.round(e / 2.4));
  const txt = (s, x, y, tam, corT, alinha = 'left') => { g.font = `600 ${tam}px ${FONTE}`; g.textAlign = alinha; g.lineJoin = 'round'; g.lineWidth = Math.max(2, tam / 4.5); g.strokeStyle = '#17121f'; g.strokeText(s, x, y); g.fillStyle = corT; g.fillText(s, x, y); };
  const sx = wx => (wx / PX - cx) * e, sy = wy => (wy / PX - cy) * e;
  for (const t of G.textos) { const x = t.fixo ? t.fixo.x : t.x, y = t.fixo ? t.fixo.y - t.fixo.h - 16 : t.y, tam = Math.round(t.tam * 0.62 * e / 1.3); g.font = `600 ${tam}px ${FONTE}`; const meia = g.measureText(t.txt).width / 2 + tam * 0.6, W = g.canvas.width; g.globalAlpha = Math.min(1, t.t * 2); txt(t.txt, meia * 2 < W ? clamp(sx(x), meia, W - meia) : W / 2, sy(y), tam, t.cor, 'center'); } // a fala nunca sai pela borda da tela
  g.globalAlpha = 1;
  for (const o of G.outros) { txt(o.nome, sx(o.corpo.x), sy(o.corpo.y - 68), 8 * u * 1.5, '#BFE3D8', 'center'); const n = Math.max(0, Math.ceil(o.corpo.vida || 0)), mx = o.corpo.vidaMax || 5; for (let i = 0; i < mx; i++) { const xx = sx(o.corpo.x) + (i - mx / 2) * 4 * u, yy = sy(o.corpo.y - 82); g.fillStyle = '#17121f'; g.fillRect(xx - u, yy - u, 4 * u, 4 * u); g.fillStyle = i < n ? '#FF9A3C' : '#4A4658'; g.fillRect(xx, yy, 2 * u, 2 * u); } }
  // ataque mira: a linha de pontaria enquanto carrega e os riscos de luz dos golpes soltos
  if (p.carga >= 0.5 && G.ctl?.mira != null && !p.morto) { const a = G.ctl.mira, ux = Math.cos(a), uy = Math.sin(a), q = Math.max(4, 4 * u), f = Math.floor(G.T * 20);
    for (let d = 26; d < 330; d += 10) { if ((Math.floor(d / 10) + f) % 4 === 0) continue; g.fillStyle = d > 290 ? '#FFFFFF' : '#FFD23F'; g.globalAlpha = 1 - d / 600; g.fillRect(Math.round(sx(p.x + ux * d) - q / 2), Math.round(sy(p.y - 26 + uy * d) - q / 2), q, q); }
    g.globalAlpha = 1; const tx = sx(p.x + ux * 330), ty = sy(p.y - 26 + uy * 330); g.fillStyle = '#17121f'; g.fillRect(tx - 5 * u, ty - 5 * u, 10 * u, 10 * u); g.fillStyle = '#FFE9A8'; g.fillRect(tx - 4 * u, ty - 4 * u, 8 * u, 8 * u); g.fillStyle = '#17121f'; g.fillRect(tx - 2 * u, ty - 2 * u, 4 * u, 4 * u); }
  for (const r of G.riscos || []) { const k = r.t / r.max, n = Math.max(6, Math.round(Math.hypot(r.x1 - r.x0, r.y1 - r.y0) / 6)), gr = Math.max(1, Math.round(r.g * u * (0.4 + k * 0.6))), nx = -(r.y1 - r.y0), ny = r.x1 - r.x0, nl = Math.hypot(nx, ny) || 1;
    for (let i = 0; i <= n; i++) { const q = i / n; if (q > 1 - (1 - k) * 0.5 && !r.chicote) continue; const on = r.chicote ? Math.sin(q * 9 + k * 12) * 14 * (1 - q) * k : 0, x = sx(r.x0 + (r.x1 - r.x0) * q + nx / nl * on), y = sy(r.y0 + (r.y1 - r.y0) * q + ny / nl * on);
      g.globalAlpha = Math.min(1, k * 1.6); g.fillStyle = r.cor; g.fillRect(Math.round(x - gr), Math.round(y - gr), gr * 2, gr * 2); if (gr > 1) { g.fillStyle = '#FFFFFF'; g.fillRect(Math.round(x - gr / 2), Math.round(y - gr / 2), gr, gr); } } g.globalAlpha = 1; }
  for (const o of G.objs) if (o.chama && !G.cena) { const yy = sy(o.y - 78 - Math.abs(Math.sin(G.T * 3)) * 6); txt('!', sx(o.x), yy, 8 * u * 2.4, '#FFD23F', 'center'); } // quem tem algo da história a dizer
  for (const o of G.objs) if (o.tipo === 'placa') { const k = clamp(1.6 - Math.hypot(o.x - p.x, o.y - p.y) / 90, 0, 1); if (k > 0.02) { g.globalAlpha = k; const pal = o.txt.split(' '), linhas = ['']; for (const w of pal) { if ((linhas[linhas.length - 1] + ' ' + w).length > 38) linhas.push(w); else linhas[linhas.length - 1] += (linhas[linhas.length - 1] ? ' ' : '') + w; } linhas.forEach((l, i) => txt(l, sx(o.x), sy(o.y - 40 - (linhas.length - 1 - i) * 11), 8 * u * 1.4, '#F4E6BC', 'center')); g.globalAlpha = 1; } }
  for (const o of G.objs) if (o.tipo === 'escrito') { const k = clamp(G.p.lampA * 1.4 - Math.max(0, Math.hypot(o.x - p.x, o.y - p.y) - 260) / 120, 0, 1); if (k > 0.02) { g.globalAlpha = k; txt(o.txt, sx(o.x), sy(o.y), 8 * u * 1.5, '#FFE9A8', 'center'); g.globalAlpha = 1; } }
  for (const c of G.N.celulas) if (c.deco && c.nome) { const meio = c.deco === 'biblioteca' || c.deco === 'cisterna' ? 104 : 240, x = sx(c.cx * 30 * 32 + meio * 2), y = sy((c.cy * 17) * 32 + 64); if (x > -300 && x < g.canvas.width + 300) txt(c.nome, x, y, 8 * u * 2.2, '#FFE9A8', 'center'); }
  { const ob = !G.cena && G.objetivo?.(); if (ob && !G.ui.blocking) { // a missão: seta dourada sobre o alvo, ou na borda da tela apontando para ele
    const x = sx(ob.x), y = sy(ob.y - 132), W2 = g.canvas.width, m = 40 * u, pula = Math.round(Math.sin(G.T * 6) * 3 * u), fora = x < m || x > W2 - m;
    g.fillStyle = '#17121f'; const seta = (ax, ay, dx, dy, c) => { g.fillStyle = c; for (let i = 0; i < 5; i++) { const lg = (5 - i) * 2 * u; if (dy) g.fillRect(ax - lg / 2, ay + i * 2 * u * dy, lg, 2 * u); else g.fillRect(ax + i * 2 * u * dx, ay - lg / 2, 2 * u, lg); } };
    if (!fora) { seta(x, y + pula - u, 0, 1, '#17121f'); seta(x, y + pula - 2 * u, 0, 1, '#FFD23F'); txt(ob.rot, x, y + pula - 8 * u, 8 * u * 1.6, '#FFE9A8', 'center'); }
    else { const esq = x < m, ax = esq ? m : W2 - m, ay = Math.min(g.canvas.height - 90 * u, Math.max(90 * u, sy(ob.y - 60))); seta(ax + (esq ? -pula : pula) + (esq ? -u : u), ay, esq ? -1 : 1, 0, '#17121f'); seta(ax + (esq ? -pula : pula), ay, esq ? -1 : 1, 0, '#FFD23F'); txt('missão', ax + (esq ? 16 * u : -16 * u), ay + 4 * u, 8 * u * 2, '#FFE9A8', esq ? 'left' : 'right'); } } }
  if (G.perto && !input.touch) { const o = G.perto; const tecla = document.body.classList.contains('pad') ? 'Y' : wasd() ? 'F' : 'E', sabe = (G.cm.visto.usos?.[o.rot] || 0) >= 3; txt(sabe && o.tipo !== 'npc' ? tecla : tecla + ' · ' + o.rot, sx(o.vv ? o.vv.x : o.x), sy(o.y - (o.tipo === 'npc' ? 80 : o.tipo === 'portal' || o.tipo === 'saida' || o.tipo === 'retorno' ? 142 : 104)), 8 * u * 1.4, '#F2E9D0', 'center'); }
  for (const o of G.objs) if ((o.tipo === 'portal' || o.tipo === 'saida' || o.tipo === 'retorno') && !o.porta && Math.abs(o.x - p.x) < 900 && !(o.oculto && !G.achou(o))) {
    const sem = o.semana ? TODAS.find(s => s.id === o.semana) : null, nome = o.tipo === 'saida' ? 'Seguir' : o.tipo === 'retorno' ? 'Refúgio' : o.rotulo ? o.rotulo : sem ? sem.estudo : MUNDO[o.mundo].nome;
    txt(nome, sx(o.x), sy(o.y - 104), 8 * u * 1.3, '#F2E9D0', 'center');
    if (sem) txt(sem.fases.filter(f => cm.feitas[sem.id + ':' + f.n]).length + '/5', sx(o.x), sy(o.y - 122), 8 * u, '#C9B88A', 'center');
  }
  for (const z of G.zonas) if (z.tipo === 'faixa' && z.aviso > 0 && !z.amigo) txt(z.baixo ? 'PULE' : 'FIQUE NO CHÃO', sx(z.x + z.w / 2), sy(z.baixo ? z.y - 14 : z.y + z.h + 30), 8 * u * 1.5, '#fff', 'center');
  // HUD
  const base = Math.max(13, Math.round(e * 6)), x0 = 30 * e;
  const xg = 52 * e; txt(String(Math.floor(G.char.data.gold)), xg + base * 0.9, 24 * e, base, '#FFE08A'); g.fillStyle = '#17121f'; g.beginPath(); g.arc(xg + base * 0.3, 24 * e - base * 0.33, base * 0.42, 0, TAU); g.fill(); g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(xg + base * 0.3, 24 * e - base * 0.33, base * 0.3, 0, TAU); g.fill();
  let lin = 27 * e;
  if (cm.sacola) txt('sacola caída: ' + cm.sacola.gold, x0 + base * 4, lin, base * 0.8, '#C9B88A');
  if (def.fase) { lin += base * 1.25; const rol = cm.selos[G.area].length; txt('ROLOS ' + rol + '/3' + (def.estacoes ? '   DECISÕES ' + cm.est[G.area].length + '/' + def.estacoes.length : '') + (G.N.portaAberta && !G.venceu ? '   PORTA ABERTA' : ''), 7 * e, lin, base * 0.9, rol >= 3 ? '#FFE9A8' : '#E6E0CF'); }
  if (G.peso) { lin += base * 1.2; txt('PESO DE MAMOM ×' + G.peso, 7 * e, lin, base * 0.8, '#FFD23F'); }
  // companheiros da sala (mesmo PC ou de fora): a vida de cada um, sempre à vista
  const chamas = (x, y, n, max, q) => { for (let i = 0; i < max; i++) { const vivo = i < n, xx = x + i * q * 3.2; g.fillStyle = '#17121f'; g.fillRect(xx - q * 0.2, y - q * 2.6, q * 2.4, q * 3); g.fillStyle = vivo ? '#FF9A3C' : '#4A4658'; g.fillRect(xx, y - q * 2.4, q * 2, q * 2.6); g.fillStyle = vivo ? '#FFD86A' : '#5E5A6E'; g.fillRect(xx + q * 0.5, y - q * 1.6, q, q * 1.6); if (vivo) { g.fillStyle = '#FFFBE6'; g.fillRect(xx + q * 0.7, y - q * 0.9, q * 0.6, q * 0.6); } } };
  const comp = [...(G.vidasTela || []).map(v => ({ nome: v.nome, vida: v.hp, vidaMax: v.max, area: G.area })), ...(G.mp ? G.mp.lista().filter(c => !(c.irmao && G.vidasTela)) : [])];
  if (comp.length) { const q = Math.max(3, Math.round(base * 0.34));
    for (const c of comp) { lin += base * 1.7; const n = Math.max(0, Math.ceil(c.vida || 0)), mx = c.vidaMax || 5;
      txt(c.nome || 'Peregrino', 7 * e, lin, base * 1.1, n > 0 ? '#BFE3D8' : '#E07A6E'); g.font = `600 ${base * 1.1}px ${FONTE}`; const lx = 7 * e + g.measureText(c.nome || 'Peregrino').width + base * 0.6;
      chamas(lx, lin, n, mx, q); if (c.area !== G.area) txt(c.onde, lx + mx * q * 3.2 + base * 0.4, lin, base * 0.7, '#8C93AD'); } }

  if (G.chefe) { const b = G.chefe; txt(b.d.nome.toUpperCase(), v.W * d / 2, 15 * e, base * 0.95, '#F4D9A0', 'center'); }
  if (G.dicaTxt && !G.luta) { // primeiros passos: uma faixa no rodapé
    const q = G.dicaTxt, W = v.W * d, H = v.H * d, tam = Math.max(12, Math.round(base * 0.82)), larg = Math.min(W * (input.touch ? 0.42 : 0.6), 560 * d), x = input.touch ? W * 0.5 - larg * 0.5 - W * 0.04 : W / 2 - larg / 2;
    g.font = `600 ${tam}px ${FONTE}`; const pal = q.txt.split(' '), linhas = []; let ln = '';
    for (const w of pal) { if (g.measureText(ln + ' ' + w).width > larg - tam * 2 && ln) { linhas.push(ln); ln = w; } else ln = ln ? ln + ' ' + w : w; } linhas.push(ln);
    const alt = tam * 1.35 * (linhas.length + 1) + tam * 1.2, y = H - alt - (input.touch ? 14 : 30) * d;
    g.fillStyle = 'rgba(10,9,18,.86)'; g.fillRect(x, y, larg, alt); g.fillStyle = '#C9B88A'; g.fillRect(x, y, larg, Math.max(1, d)); g.fillRect(x, y + alt - Math.max(1, d), larg, Math.max(1, d));
    txt(q.titulo + '   ' + q.n + '/' + q.de, x + larg / 2, y + tam * 1.5, tam * 0.9, '#FFE9A8', 'center');
    linhas.forEach((l, i) => txt(l, x + larg / 2, y + tam * 1.5 + tam * 1.35 * (i + 1), tam, '#F2E9D0', 'center'));
  }
  if (G.gritoTxt) { const a = Math.min(1, G.gritoTxt.t, (2.6 - G.gritoTxt.t) * 4); g.globalAlpha = a; txt(G.gritoTxt.txt, v.W * d / 2, v.H * d * 0.3, Math.min(base * 2.2, v.W * d / 26), '#F4D9A0', 'center'); g.globalAlpha = 1; }
  if (G.pecado) { const s = G.pecado, w = 240 * d, x = v.W * d / 2 - w / 2, y = (v.H - 70) * d; g.fillStyle = '#17121f'; g.fillRect(x - 3 * d, y - 3 * d, w + 6 * d, 16 * d); g.fillStyle = '#FFE9A8'; g.fillRect(x, y, w * Math.min(1, s.graca / 4), 10 * d); txt('GRAÇA', v.W * d / 2, y - 8 * d, base, '#F2E9D0', 'center'); }
  const f = Math.max(G.fade, p.morto ? clamp(1.2 - G.mortoT, 0, 1) : 0);
  if (f > 0) { g.fillStyle = `rgba(6,7,15,${f})`; g.fillRect(0, 0, G.cv.width, G.cv.height); }
  if (G.clarao > 0) { g.fillStyle = `rgba(255,246,220,${Math.min(0.5, G.clarao * 2)})`; g.fillRect(0, 0, G.cv.width, G.cv.height); }
}

// A caixa de dano do chefe é o tamanho real do desenho: mede o que está pintado no quadro (a cada poucos quadros) e guarda
// em e.hb, relativo aos pés. Tira um pouco das bordas (capa solta, ponta de arma). O maior tamanho visto decide o peso dele.
function medirChefe(e, q, vira) {
  if ((e.hbN = (e.hbN || 0) + 1) % 4 !== 1 && e.hb) return;
  const s = q.s, W = s.w, H = s.h, B = s.b; let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) { const o = y * W; for (let x = 0; x < W; x++) if (B[o + x] >>> 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
  if (x1 < 0) return;
  const k = (q.esc || 1) * PX, w = (x1 - x0 + 1) * k, h = (y1 - y0 + 1) * k; // pixel do desenho → unidade do mundo (cada pixel vale PX)
  e.hb = { dx: ((x0 + x1 + 1) / 2 - q.ax) * k * vira, w: Math.max(30, w * 0.82), y0: (y0 - q.ay) * k + h * 0.06, h: Math.max(40, h * 0.9) };
  const area = e.hb.w * e.hb.h; if (!(e.hbArea >= area * 0.98) && !e.morrendo) { e.hbArea = Math.max(e.hbArea || 0, area); tanque(e, e.hbArea); }
}
