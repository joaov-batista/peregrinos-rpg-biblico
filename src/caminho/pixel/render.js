// Renderizador em pixel art do Caminho. O mundo inteiro é pintado numa tela pequena (272 pixels de altura,
// 1 pixel de arte = 2 unidades do mundo) e ampliado sem suavização; só os textos ficam na resolução da tela.
// A lógica do jogo não muda: este arquivo só lê o estado e desenha.
import { clamp, TAU, hash } from '../../util.js';
import { input } from '../../input.js';
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
import { quadroChefe } from './chefespx.js';
import { cenaPixel, pintarFundoPixel, pintarSalasPixel, pintarBlocosPixel, pintarLuzPixel, TL, mistura, pontilha } from './mundo.js';
import { pintarEfeitos } from './efeitos.js';

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

function pintarObjeto(g, o, G, x, y, Tm) {
  const tm = G.tm;
  switch (o.tipo) {
    case 'vaso': { const s = sprObj('vaso' + (o.quebrado ? 'q' : ''), 14, 16, s => { if (o.quebrado) { s.ret(2, 13, 4, 2, BARRO[1]); s.ret(8, 14, 3, 1, BARRO[2]); s.px(6, 14, BARRO[0]); return; } s.bola(7, 9, 5, 5.5, BARRO); s.ret(4, 2, 6, 2, BARRO[3]); s.ret(5, 4, 4, 1, BARRO[1]); s.ret(3, 8, 8, 1, BARRO[0]); for (let i = 3; i < 11; i += 2) s.px(i, 9, BARRO[4]); }); carimbar(g, s, x, y, 7, 15); return true; }
    case 'rolo': { const s = sprObj('rolo' + (o.feito ? 'f' : ''), 26, 30, s => { s.ret(11, 14, 4, 13, MADEIRA[1]); s.ret(12, 14, 1, 13, MADEIRA[3]); s.ret(7, 26, 12, 2, MADEIRA[2]); s.ret(7, 26, 12, 1, MADEIRA[3]); s.poli([[3, 12], [22, 8], [23, 11], [4, 15]], MADEIRA[2]);
      const P = o.feito ? rampa('#FFF1C4') : PAPEL; s.poli([[5, 6], [20, 2], [21, 8], [6, 12]], P[2]); s.linha(5, 6, 20, 2, 1, P[4]); for (let k = 0; k < 3; k++) s.linha(8, 8 + k * 2 - 1, 17 - k * 2, 5 + k * 2 - 1, 1, MADEIRA[0]); s.bola(4, 9, 2.2, 3.2, MADEIRA); s.bola(21, 5, 2.2, 3.2, MADEIRA); }); carimbar(g, s, x, y, 13, 28);
      if (o.feito) chama(g, x, y - 34 + (Math.floor(Tm * 3) % 2), Tm); else { g.fillStyle = Math.floor(Tm * 3) % 2 ? tm.acento : '#fff'; g.fillRect(x - 1, y - 36 + (Math.floor(Tm * 2) % 2), 2, 2); } return true; }
    case 'estacao': { const s = sprObj('est' + (o.feito ? 'f' : ''), 18, 28, s => { const R = rampa(o.feito ? '#7FD8BE' : '#D7C08A'); s.poli([[3, 27], [6, 18], [11, 18], [14, 27]], PEDRA[1]); s.linha(6, 18, 11, 18, 1, PEDRA[3]); for (let k = 0; k <= 6; k++) { s.ret(8 - k, 3 + k, k * 2 + 2, 1, k < 2 ? R[4] : R[3 - (k > 4 ? 1 : 0)]); s.ret(8 - k, 15 - k, k * 2 + 2, 1, R[k > 3 ? 2 : 1]); } s.ret(8, 8, 2, 2, BRANCO); }); carimbar(g, s, x, y + (o.feito ? 0 : Math.round(Math.sin(Tm * 2.4 + o.x) * 1.5)) * 0, 9, 27); return true; }
    case 'ebenezer': { const aceso = G.cm.ebenezer?.area === G.area, s = sprObj('eben', 26, 36, s => { s.poli([[4, 35], [6, 10], [11, 2], [18, 6], [22, 35]], PEDRA[2]); s.poli([[4, 35], [6, 10], [9, 6], [10, 35]], PEDRA[3]); s.poli([[17, 8], [18, 6], [22, 35], [18, 35]], PEDRA[1]); s.linha(6, 10, 11, 2, 1, PEDRA[4]); for (const yy of [14, 19, 24]) s.linha(11, yy, 16, yy, 1, PEDRA[0]); s.ret(1, 32, 5, 3, PEDRA[1]); s.ret(21, 31, 4, 4, PEDRA[1]); s.px(8, 30, rampa('#5F8A5C')[2]); s.px(9, 31, rampa('#5F8A5C')[1]); }); carimbar(g, s, x, y, 13, 35);
      if (aceso) { chama(g, x - 1, y - 38, Tm, 1); g.fillStyle = '#FFE9A8'; for (const yy of [21, 16, 11]) g.fillRect(x - 2, y - yy, 5, 1); } return true; }
    case 'portal': case 'saida': case 'retorno': {
      const sem = o.semana ? TODAS.find(s => s.id === o.semana) : null, m = o.mundo ? MUNDO[o.mundo] : null;
      const c = o.tipo === 'saida' ? '#FFE9A8' : o.tipo === 'retorno' ? '#9DB9C7' : m ? '#E58A6A' : ['#FFD23F', '#79D9CD', '#F1C96A', '#C79BFF'][TODAS.indexOf(sem) % 4];
      const s = sprObj('portal', 38, 48, s => { for (let yy = 0; yy < 48; yy++) for (let xx = 0; xx < 38; xx++) { const d = yy < 19 ? Math.hypot(xx - 18.5, yy - 19) : Math.abs(xx - 18.5); if (d <= 18.5 && d > 12.5) s.px(xx, yy, xx < 8 ? PEDRA[3] : xx > 30 ? PEDRA[1] : (yy % 8 === 0 || (yy < 19 && (xx + yy) % 9 === 0)) ? PEDRA[0] : PEDRA[2]); } s.ret(0, 44, 7, 4, PEDRA[1]); s.ret(31, 44, 7, 4, PEDRA[1]); });
      // véu de luz dentro do arco, pontilhado e subindo
      const R = rampa(c); for (let yy = 0; yy < 46; yy++) for (let xx = -12; xx <= 12; xx++) { const dn = yy < 17 ? Math.hypot(xx, 17 - yy) : Math.abs(xx); if (dn > 12) continue; const k = yy / 46; if (pontilha(xx + 40, yy + Math.floor(Tm * 14), 0.9 - k * 0.65)) { g.fillStyle = k < 0.3 ? '#FFFFFF' : k < 0.6 ? c : mistura(c, '#101828', 0.5); g.fillRect(x + xx, y - 46 + yy, 1, 1); } }
      carimbar(g, s, x, y, 19, 47); void R; return true; }
    case 'segredo': { const f = Math.round(Math.sin(Tm * 3 + o.x) * 2), tipo = o.item === 'pedra' ? 'p' : o.item === 'mana' ? 'm' : 'b', s = sprObj('seg' + tipo, 12, 12, s => { if (tipo === 'p') s.bola(6, 6, 4.5, 3.5, rampa('#B9B4A2')); else if (tipo === 'm') { s.bola(6, 6, 3.5, 3.5, rampa('#F4E6BC')); s.px(5, 4, BRANCO); } else { s.bola(6, 7, 4, 3.5, MADEIRA); s.ret(4, 2, 4, 2, OURO[3]); } }); carimbar(g, s, x, y - 8 + f, 6, 6); if (Math.floor(Tm * 4 + o.x) % 3 === 0) { g.fillStyle = '#fff'; g.fillRect(x + 5, y - 15 + f, 1, 1); g.fillRect(x - 6, y - 5 + f, 1, 1); } return true; }
    case 'sacola': { const s = sprObj('sacola', 12, 13, s => { s.bola(6, 8, 4.5, 4, MADEIRA); s.ret(4, 2, 4, 2, OURO[3]); s.px(6, 8, OURO[4]); }); carimbar(g, s, x, y, 6, 12); if (Math.floor(Tm * 5) % 2) { g.fillStyle = '#FFD23F'; g.fillRect(x - 6, y - 16, 1, 1); g.fillRect(x + 5, y - 13, 1, 1); } return true; }
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
  const cx = Math.round(v.cam.x / PX) + tr, cy = Math.round(v.cam.y / PX) + tr2, C = cenaPixel(G.tm, G.def.tema);
  const X = wx => Math.round(wx / PX - cx), Y = wy => Math.round(wy / PX - cy);
  const antigo = fn => { g.save(); g.scale(1 / PX, 1 / PX); g.translate(-cx * PX, -cy * PX); fn(); g.restore(); };

  pintarFundoPixel(g, G, C, vw, vh, cx, cy);
  pintarSalasPixel(g, G, C, vw, vh, cx, cy);
  for (const o of G.objs) { const x = X(o.x); if (x < -60 || x > vw + 60) continue; if (!pintarObjeto(g, o, G, x, Y(o.y), Tm)) antigo(() => desenharObjeto(g, o, G)); }
  pintarBlocosPixel(g, G, C, vw, vh, cx, cy);
  // avisos de golpe: áreas pontilhadas que fecham até o impacto
  for (const z of G.zonas) pintarZona(g, G, z, X, Y, vw, vh, Tm);
  pintarEfeitos(g, G.fxPx, cx, cy, true);
  for (const e of G.inimigos) {
    if (Math.abs(e.x - p.x) > 1200) continue;
    if (e.kind === 'chefe') {
      const q = quadroChefe(e, Tm, G);
      if (q) {
        const vira = e.face > 0 || e.c.semVirar ? 1 : -1, luz = p.lamp ? G.raioLuz() : 0;
        // os clones da Mentira: iguais ao verdadeiro, mas tremem dentro da luz da lâmpada
        for (const cl of e.clones) { const naLuz = luz && Math.hypot(cl.x - p.x, cl.y - p.y) < luz; carimbar(g, q.s, X(cl.x), Y(cl.y), q.ax, q.ay, vira, (cl.alpha ?? 1) * (naLuz ? 0.22 + 0.12 * Math.sin(Tm * 40) : 1) * Math.min(1, cl.t * 2)); }
        carimbar(g, q.s, X(e.x), Y(e.y), q.ax, q.ay, vira); pintarExtrasChefe(g, e, G, X, Y, Tm);
      }
      else antigo(() => desenharChefe(g, e, Tm, G));
    } else {
      const q = quadroVicio(e, Tm);
      if (!q) { antigo(() => desenharVicio(g, e, Tm)); continue; }
      const tonto = e.stun > 0.25, yy = Y(e.y) + (e.voa ? Math.round(Math.sin(Tm * 3 + (e.art?.ph || 0)) * 2) : 0);
      carimbar(g, q.s, X(e.x), yy, q.ax, q.ay, e.face >= 0 ? 1 : -1, e.vista ?? 1);
      if (tonto) for (let i = 0; i < 3; i++) { const a = Tm * 5 + i * 2.09; g.fillStyle = '#FFE9A8'; g.fillRect(X(e.x) + Math.round(Math.cos(a) * 7), yy - Math.round(e.h / PX) - 5 + Math.round(Math.sin(a) * 2), 1, 1); }
    }
  }
  if (G.pecado) { // o vulto à porta: sombra pontilhada de olhos acesos
    const sp = G.pecado, x = X(sp.x), y = Y(sp.y); g.fillStyle = '#0B0812';
    for (let yy = -37; yy <= 22; yy++) { const k = (yy + 37) / 59, l = Math.round(2 + k * 13 + Math.sin(Tm * 3 + yy * 0.3) * 1.5); for (let xx = -l; xx <= l; xx++) if (yy < 16 || pontilha(x + xx, y + yy + Math.floor(Tm * 8), 1 - (yy - 16) / 7)) g.fillRect(x + xx, y + yy, 1, 1); }
    g.fillStyle = Math.floor(Tm * 2) % 5 ? '#EF6981' : '#FFFFFF'; g.fillRect(x - 4, y - 20, 2, 3); g.fillRect(x + 3, y - 20, 2, 3);
  }
  for (const m of G.moedas) { const x = X(m.x), y = Y(m.y), f = Math.floor(m.t * 10) % 4, lg = [3, 2, 1, 2][f]; g.fillStyle = '#17121f'; g.fillRect(x - (lg >> 1) - 1, y - 2, lg + 2, 5); g.fillStyle = m.maldita ? '#B8862B' : '#F2C14E'; g.fillRect(x - (lg >> 1), y - 1, lg, 3); g.fillStyle = '#FFF1BE'; g.fillRect(x - (lg >> 1), y - 1, 1, 1); }
  // outros peregrinos (multijogador) e o herói
  for (const o of G.outros) pintarJogador(g, o.corpo, o.look, o.cls, o.arma, Tm, o.hab, X, Y, false);
  if (!p.morto) pintarJogador(g, p, G.char.look || {}, G.char.cls, G.tipoArma, Tm, G.hab, X, Y, true);
  else if (G.mortoT > 1.2) { const s = quadroHeroi({ ...p, morto: true, atk: null }, G.char.look || {}, G.char.cls, G.tipoArma, Tm, G.hab); s.dissolve(clamp((1.9 - G.mortoT) / 0.7, 0, 1), 5); carimbar(g, s, X(p.x), Y(p.y), AX, AY, p.face); }
  pintarEfeitos(g, G.fxPx, cx, cy, false);
  for (const t of G.tiros) pintarTiro(g, t, X(t.x), Y(t.y), Tm);
  for (const o of G.outros) if (o.corpo.ts) for (const t of o.corpo.ts) pintarTiro(g, { x: t[0], y: t[1], vx: t[2], vy: t[3], r: t[4], tipo: t[5], cor: t[6], amigo: true }, X(t[0]), Y(t[1]), Tm);
  for (const q of G.parts) { const k = q.t / q.max, x = X(q.x), y = Y(q.y); g.fillStyle = q.cor; if (q.anel) { const r = Math.round(q.r / PX * (1 - k)); g.globalAlpha = k > 0.5 ? 1 : 0.6; for (let a = 0; a < 24; a++) if ((a + Math.floor(Tm * 20)) % 3) g.fillRect(x + Math.round(Math.cos(a / 24 * TAU) * r), y + Math.round(Math.sin(a / 24 * TAU) * r), k > 0.6 ? 2 : 1, k > 0.6 ? 2 : 1); g.globalAlpha = 1; } else { const lg = k > 0.5 && q.r > 2 ? 2 : 1; g.fillRect(x, y, lg, lg); } }
  pintarLuzPixel(g, G, vw, vh, cx, cy, luzCv);
  pintarClima(g, G, vw, vh, cx, Tm);
  pintarHud(g, G, vw); barraChefe(g, G, vw);

  // amplia: primeiro por um fator inteiro (pixels nítidos), depois ajusta à tela
  const cvw = G.cv.width, cvh = G.cv.height, k = Math.max(1, Math.ceil(cvh / vh));
  if (meio.width !== vw * k || meio.height !== vh * k) { meio.width = vw * k; meio.height = vh * k; }
  mg.imageSmoothingEnabled = false; mg.drawImage(baixa, 0, 0, vw * k, vh * k);
  const G2 = G.g; G2.setTransform(1, 0, 0, 1, 0, 0); G2.imageSmoothingEnabled = true; G2.imageSmoothingQuality = 'low';
  G2.drawImage(meio, 0, 0, vw * k, vh * k, 0, 0, vw * esc * G.dpr, cvh);
  pintarTextos(G2, G, esc, cx, cy);
}

function pintarJogador(g, p, look, cls, arma, Tm, hab, X, Y, eu) {
  const s = quadroHeroi(p, look, cls, arma, Tm, hab);
  if (p.rastro?.length) for (let i = 0; i < p.rastro.length; i += 3) { const r = p.rastro[i]; carimbar(g, vulto(s, cor('#BFD6E8')), X(r.x), Y(r.y), AX, AY, r.face, 0.18 + r.t * 1.6); }
  if (p.inv > 0 && !p.morto && Math.floor(Tm * 20) % 2 && !(p.flashT > 0)) g.globalAlpha = 0.55;
  carimbar(g, s, X(p.x), Y(p.y), AX, AY, p.face); g.globalAlpha = 1;
  // halo do lampião
  if (p.lampA > 0.3 || p.vig > 0) { const lx = X(p.x + p.face * 12), ly = Y(p.y) - 30; g.fillStyle = '#FFE9A8'; g.globalAlpha = 0.35; for (let a = 0; a < 8; a++) g.fillRect(lx + Math.round(Math.cos(a * 0.785 + Tm * 3) * (5 + (a % 2) * 3)), ly + Math.round(Math.sin(a * 0.785 + Tm * 3) * (5 + (a % 2) * 3)), 1, 1); g.globalAlpha = 1; }
  if (p.orando > 0) { g.fillStyle = '#FFE9A8'; for (let i = 0; i < 9; i++) { const xx = X(p.x) - 7 + ((i * 5) % 15), yy = Y(p.y) - ((Tm * 40 + i * 13) % 46); g.globalAlpha = 0.7; g.fillRect(xx, yy, 1, 2 + (i % 2)); } g.globalAlpha = 1; }
  if (p.carga > 0.15) { g.fillStyle = p.carga >= 0.6 ? '#FFFFFF' : '#FFE9A8'; const r = Math.round(14 - Math.min(0.6, p.carga) * 14); for (let a = 0; a < 10; a++) g.fillRect(X(p.x) + Math.round(Math.cos(a * 0.628 + Tm * 6) * r), Y(p.y) - 14 + Math.round(Math.sin(a * 0.628 + Tm * 6) * r), 1, 1); }
}

function pintarTiro(g, t, x, y, Tm) {
  const r = Math.max(2, Math.round(t.r / PX));
  if (t.tipo === 'choque') { const d = Math.sign(t.vx), f = Math.floor(Tm * 12) % 2; for (let i = 0; i < 9; i++) { const h = [3, 6, 10, 13, 11, 8, 5, 3, 1][i] + (i % 2 ? f : 0); g.fillStyle = i < 4 ? '#fff' : t.cor; g.fillRect(x + d * (4 - i) , y + 6 - h, 1, h); } g.fillStyle = '#17121f'; g.fillRect(x - 5, y + 6, 10, 1); return; }
  if (t.tipo === 'onda') { const d = Math.sign(t.vx); for (let yy = -r * 1.5; yy <= r * 1.5; yy++) { const lg = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(yy / (r * 1.5), 2))) * 5); g.fillStyle = '#FFE08A'; g.fillRect(x + d * (lg - 3), y + yy, 3, 1); g.fillStyle = '#fff'; g.fillRect(x + d * lg, y + yy, 1, 1); } return; }
  // rastro e núcleo
  const vx = t.vx / 60 / PX, vy = t.vy / 60 / PX;
  for (let k = 1; k <= 4; k++) { g.globalAlpha = 0.6 - k * 0.12; g.fillStyle = t.amigo ? '#FFE9A8' : t.cor; const rr = Math.max(1, r - k); g.fillRect(Math.round(x - vx * k * 1.6 - rr / 2), Math.round(y - vy * k * 1.6 - rr / 2), rr, rr); }
  g.globalAlpha = 1; g.fillStyle = '#17121f'; g.fillRect(x - r, y - r + 2, r * 2, r * 2 - 4); g.fillRect(x - r + 2, y - r, r * 2 - 4, r * 2); g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
  g.fillStyle = t.amigo ? '#FFE9A8' : t.cor.startsWith('#') ? t.cor : '#FFD23F'; g.fillRect(x - r + 1, y - r + 2, r * 2 - 2, r * 2 - 4); g.fillRect(x - r + 2, y - r + 1, r * 2 - 4, r * 2 - 2);
  g.fillStyle = '#fff'; g.fillRect(x - 1, y - 2, Math.max(1, r - 2), Math.max(1, r - 2));
}

function pintarZona(g, G, z, X, Y, vw, vh, Tm) {
  const A = G.N.arena, p = G.p, ativa = z.aviso <= 0, c = z.cor.startsWith('#') ? z.cor : `rgb(${z.cor})`, pisca = Math.floor(Tm * 12) % 2;
  if (z.tipo === 'circ') {
    const x = X(z.x), y = Y(z.y), r = Math.round(z.r / PX), k = ativa ? 1 : clamp(1 - z.aviso / 0.9, 0, 1);
    g.fillStyle = ativa ? '#fff' : c;
    for (let a = 0; a < 40; a++) if (ativa || (a + Math.floor(Tm * 10)) % 2) g.fillRect(x + Math.round(Math.cos(a / 40 * TAU) * r), y + Math.round(Math.sin(a / 40 * TAU) * r), 1, 1);
    for (let yy = -r; yy <= r; yy += ativa ? 1 : 2) for (let xx = -r; xx <= r; xx += ativa ? 1 : 2) { const d = Math.hypot(xx, yy) / r; if (d < k && (ativa || pontilha(xx + 99, yy + 99, 0.3 + k * 0.3))) g.fillRect(x + xx, y + yy, 1, 1); }
    return;
  }
  const y0w = z.tipo === 'col' ? (z.y0 ?? (A ? A.y0 : p.y - 600)) : z.y, y1w = z.tipo === 'col' ? (z.y1 ?? (A ? A.chao : p.y + 100)) : z.y + z.h, xw = z.tipo === 'col' ? z.x - z.w / 2 : z.x;
  const x = X(xw), y = Y(y0w), w = Math.round(z.w / PX), h = Math.round((y1w - y0w) / PX);
  if (ativa) {
    g.fillStyle = z.tipo === 'poca' ? c : '#fff'; if (z.tipo === 'poca') { for (let i = 0; i < w; i++) g.fillRect(x + i, y + h - 3 - ((i + Math.floor(Tm * 6)) % 3 === 0 ? 1 : 0), 1, 4); g.fillStyle = '#fff'; for (let i = 2; i < w; i += 5) g.fillRect(x + i, y + h - 5 - ((i + Math.floor(Tm * 8)) % 4), 1, 1); return; }
    g.fillRect(x + 1, y, w - 2, h); g.fillStyle = c; g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); if (z.tipo === 'col') for (let i = 0; i < 8; i++) g.fillRect(x - 3 + ((i * 7) % (w + 6)), y + h - 1 - ((i * 5) % 9), 1, 2);
    return;
  }
  if (z.tipo === 'ret') return;
  const k = clamp(1 - z.aviso / 0.9, 0, 1); g.fillStyle = c;
  for (let yy = 0; yy < h; yy += 1) for (let xx = (yy & 1); xx < w; xx += 2) if (pontilha(xx, yy + Math.floor(Tm * 16), 0.12 + k * 0.4)) g.fillRect(x + xx, y + yy, 1, 1);
  g.fillStyle = pisca ? '#fff' : c; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); if (z.tipo === 'col') { g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); }
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
  for (const t of G.textos) { const x = t.fixo ? t.fixo.x : t.x, y = t.fixo ? t.fixo.y - t.fixo.h - 16 : t.y; g.globalAlpha = Math.min(1, t.t * 2); txt(t.txt, sx(x), sy(y), Math.round(t.tam * 0.62 * e / 1.3), t.cor, 'center'); }
  g.globalAlpha = 1;
  for (const o of G.outros) txt(o.nome, sx(o.corpo.x), sy(o.corpo.y - 68), 8 * u * 1.5, '#BFE3D8', 'center');
  if (G.perto && !input.touch) { const o = G.perto; txt((document.body.classList.contains('pad') ? 'Y' : 'E') + ' · ' + o.rot, sx(o.x), sy(o.y - (o.tipo === 'npc' ? 80 : 104)), 8 * u * 1.4, '#F2E9D0', 'center'); }
  for (const o of G.objs) if ((o.tipo === 'portal' || o.tipo === 'saida' || o.tipo === 'retorno') && Math.abs(o.x - p.x) < 900) {
    const sem = o.semana ? TODAS.find(s => s.id === o.semana) : null, nome = o.tipo === 'saida' ? 'Seguir' : o.tipo === 'retorno' ? 'Refúgio' : sem ? sem.estudo : MUNDO[o.mundo].nome;
    txt(nome, sx(o.x), sy(o.y - 104), 8 * u * 1.3, '#F2E9D0', 'center');
    if (sem) txt(sem.fases.filter(f => cm.feitas[sem.id + ':' + f.n]).length + '/5', sx(o.x), sy(o.y - 122), 8 * u, '#C9B88A', 'center');
  }
  for (const z of G.zonas) if (z.tipo === 'faixa' && z.aviso > 0) txt(z.baixo ? 'PULE' : 'FIQUE NO CHÃO', sx(z.x + z.w / 2), sy(z.baixo ? z.y - 14 : z.y + z.h + 30), 8 * u * 1.5, '#fff', 'center');
  // HUD
  const base = Math.max(13, Math.round(e * 6)), x0 = 30 * e;
  const xg = 52 * e; txt(String(Math.floor(G.char.data.gold)), xg + base * 0.9, 24 * e, base, '#FFE08A'); g.fillStyle = '#17121f'; g.beginPath(); g.arc(xg + base * 0.3, 24 * e - base * 0.33, base * 0.42, 0, TAU); g.fill(); g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(xg + base * 0.3, 24 * e - base * 0.33, base * 0.3, 0, TAU); g.fill();
  let lin = 27 * e;
  if (cm.sacola) txt('sacola caída: ' + cm.sacola.gold, x0 + base * 4, lin, base * 0.8, '#C9B88A');
  if (def.fase) { lin += base * 1.25; const rol = cm.selos[G.area].length; txt('ROLOS ' + rol + '/3' + (def.estacoes ? '   DECISÕES ' + cm.est[G.area].length + '/' + def.estacoes.length : '') + (G.N.portaAberta && !G.venceu ? '   PORTA ABERTA' : ''), 7 * e, lin, base * 0.9, rol >= 3 ? '#FFE9A8' : '#E6E0CF'); }
  if (G.peso) { lin += base * 1.2; txt('PESO DE MAMOM ×' + G.peso, 7 * e, lin, base * 0.8, '#FFD23F'); }
  if (G.chefe) { const b = G.chefe; txt(b.d.nome.toUpperCase(), v.W * d / 2, 15 * e, base * 0.95, '#F4D9A0', 'center'); }
  if (G.gritoTxt) { const a = Math.min(1, G.gritoTxt.t, (2.6 - G.gritoTxt.t) * 4); g.globalAlpha = a; txt(G.gritoTxt.txt, v.W * d / 2, v.H * d * 0.3, Math.min(base * 2.2, v.W * d / 26), '#F4D9A0', 'center'); g.globalAlpha = 1; }
  if (G.pecado) { const s = G.pecado, w = 240 * d, x = v.W * d / 2 - w / 2, y = (v.H - 70) * d; g.fillStyle = '#17121f'; g.fillRect(x - 3 * d, y - 3 * d, w + 6 * d, 16 * d); g.fillStyle = '#FFE9A8'; g.fillRect(x, y, w * Math.min(1, s.graca / 4), 10 * d); txt('GRAÇA', v.W * d / 2, y - 8 * d, base, '#F2E9D0', 'center'); }
  const f = Math.max(G.fade, p.morto ? clamp(1.2 - G.mortoT, 0, 1) : 0);
  if (f > 0) { g.fillStyle = `rgba(6,7,15,${f})`; g.fillRect(0, 0, G.cv.width, G.cv.height); }
  if (G.clarao > 0) { g.fillStyle = `rgba(255,246,220,${Math.min(0.5, G.clarao * 2)})`; g.fillRect(0, 0, G.cv.width, G.cv.height); }
}
