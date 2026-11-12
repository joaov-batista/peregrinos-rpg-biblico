// ATAQUE MIRA: segure o golpe para carregar, aponte (mouse, analógico, setas ou arrastando o dedo no botão) e solte.
// Só acontece na direção mirada. Custa caro em azeite e tem espera, para não virar o golpe de sempre.
// Tudo aqui é feito com tiros, efeitos, riscos e golpes comuns, que já viajam pela rede: em grupo, todos veem e o dano vale.
import { sfx } from '../audio.js';
import { T, CW, CH } from './nivel.js';
import { solido } from './corpo.js';

export const MIRA_CUSTO = 66, MIRA_ESPERA = 5, MIRA_CARGA = 0.5;
const rand = (a, b) => a + Math.random() * (b - a);
export const MIRA_NOME = { guerreiro: 'Investida do valente', zelote: 'Três cortes', profeta: 'Chuva de fogo', pastor: 'Rajada do ribeiro', levita: 'Brado de Jericó', juiz: 'Açoite de Sangar', valente: 'Queda da lança' };

// para onde o peregrino aponta: dedo arrastado no botão, analógico direito, mouse, direcional — ou para a frente
export function anguloMira(G, input) {
  const p = G.p, a = input.arrasto;
  if (a && Math.hypot(a.x, a.y) > 26) return Math.atan2(a.y, a.x);
  if (input.padAim != null) return input.padAim;
  if (input.mouseAim && !input.touch && !document.body.classList.contains('pad')) {
    const r = G.cv.getBoundingClientRect(), v = G.vista, wx = v.cam.x + (input.mx - r.left) / r.width * (v.W / v.Z), wy = v.cam.y + (input.my - r.top) / r.height * (v.H / v.Z);
    return Math.atan2(wy - (p.y - 26), wx - p.x);
  }
  const m = input.move(); if (Math.hypot(m.x, m.y) > 0.3) return Math.atan2(m.y, m.x);
  return p.face > 0 ? 0 : Math.PI;
}

export function soltarMira(G, ang) {
  const p = G.p, cls = G.char.cls, base = G.danoBase() * (G.hab.espada ? 1.3 : 1), ux = Math.cos(ang), uy = Math.sin(ang), ox = p.x, oy = p.y - 26;
  p.oleo -= MIRA_CUSTO; p.miraCd = MIRA_ESPERA; if (Math.abs(ux) > 0.15) p.face = Math.sign(ux);
  const atk = () => ({ dir: 'lado', hits: new Set(), semOleo: true, carga: true });
  const tiro = o => G.tiros.push({ semOleo: true, x: ox + ux * 18, y: oy + uy * 18, vx: 0, vy: 0, r: 7, amigo: true, vida: 1, cor: '#FFF1BE', tipo: 'pedra', ...o });
  const depois = (ms, fn) => setTimeout(() => { if (G.running && !G.p.morto && G.p === p) fn(); }, ms);
  G.textoEm(p.x, p.y - 70, MIRA_NOME[cls] || 'Ataque mira', '#FFE9A8', 13); G.clarao = 0.1; G.tremor(6); sfx('magic');
  switch (cls) {
    case 'zelote': { // três cortes num traço só: atravessa quase num piscar
      G.investidaMira = { t: 0, dur: 0.16, ux, uy, vel: 1900, dano: base * 2, larg: 64, atk: atk(), cortes: [], ecos: 2, cor: '#C79BFF', inv: 0.4 };
      for (let i = 0; i < 3; i++) G.efeito('corteAdaga', ox + ux * (60 + i * 90), oy + uy * (60 + i * 90) + 26, i % 2 ? -p.face : p.face, { vel: 1.2 - i * 0.2 });
      G.risco(ox, oy, ox + ux * 320, oy + uy * 320, '#C79BFF', 5); break; }
    case 'profeta': { // sete meteoros caem do céu sobre o ponto mirado
      const tx = ox + ux * 300, ty = oy + uy * 300, lado = Math.abs(ux) > 0.2 ? Math.sign(ux) : p.face;
      G.risco(ox, oy, tx, ty, '#FF8A2A', 3); G.efeito('pilar', tx, ty + 26);
      for (let i = 0; i < 7; i++) depois(i * 110, () => { const ax = tx + rand(-110, 110), sx = ax - lado * 240, sy = ty - 430, d = Math.hypot(ax - sx, ty + 40 - sy);
        G.tiros.push({ semOleo: true, x: sx, y: sy, vx: (ax - sx) / d * 820, vy: (ty + 40 - sy) / d * 820, r: 13, amigo: true, vida: 1.6, cor: '#FF8A2A', tipo: 'fogo', dano: base * 2.2, estoura: { raio: 74, dano: base * 1.6, fx: 'explosaoFogo' }, altoAte: ty - 60 }); sfx('shoot'); });
      break; }
    case 'pastor': { // doze pedras do ribeiro em quatro levas, todas na mesma linha
      G.risco(ox, oy, ox + ux * 360, oy + uy * 360, '#FFF1BE', 3); G.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p });
      for (let l = 0; l < 4; l++) depois(l * 80, () => { for (let i = -1; i <= 1; i++) { const b = ang + i * 0.07 + rand(-0.02, 0.02); tiro({ x: p.x + Math.cos(b) * 18, y: p.y - 26 + Math.sin(b) * 18, vx: Math.cos(b) * 960, vy: Math.sin(b) * 960, dano: base * 0.9, r: 6, vida: 0.9, g: 120, tipo: 'pedra', brilho: true, fura: true }); } sfx('shoot'); });
      break; }
    case 'levita': { // um brado só, enorme, que bate nas paredes e volta
      G.efeito('giroSom', p.x, p.y - 6, p.face, { gruda: p }); G.fx.anel(ox, oy, '#BFF0F8', 150); G.risco(ox, oy, ox + ux * 200, oy + uy * 200, '#BFF0F8', 6);
      tiro({ vx: ux * 640, vy: uy * 640, r: 18, r0: 18, vida: 2.6, max: 9, tipo: 'som', fura: true, quica: 5, dano: base * 2.4, cor: '#BFF0F8' });
      p.vx -= ux * 220; break; }
    case 'juiz': { // a chicotada longa; se pegar alguém, mais três o procuram
      const alc = 330, a = atk(); let alvo = null;
      for (let d = 30; d <= alc; d += 30) { const x = ox + ux * d, y = oy + uy * d; if (solido(G.N, Math.floor(x / T), Math.floor(y / T))) break;
        for (const e of G.inimigos) if (e.hp > 0 && !e.morrendo && !a.hits.has(e) && Math.abs(e.x - x) < e.w / 2 + 26 && Math.abs(e.y - e.h / 2 - y) < e.h / 2 + 26) { if (!alvo) alvo = e; }
        G.golpear({ x: x - 26, y: y - 26, w: 52, h: 52 }, base * 2.6, a); }
      G.risco(ox, oy, ox + ux * alc, oy + uy * alc, '#C98A4E', 4, true); G.efeito('estalo', ox + ux * alc * 0.8, oy + uy * alc * 0.8 + 26, p.face);
      if (alvo) for (let i = 1; i <= 3; i++) depois(i * 150, () => { if (alvo.hp <= 0 || alvo.morrendo) return; G.risco(p.x, p.y - 26, alvo.x, alvo.y - alvo.h / 2, '#FFD9A0', 3, true); G.efeito('estalo', alvo.x, alvo.y - alvo.h / 2 + 26, i % 2 ? 1 : -1); G.atingir(alvo, base * 1.5, p.x, { dir: 'lado', hits: new Set(), semOleo: true, carga: true }); sfx('swing'); G.tremor(4); });
      break; }
    case 'valente': { // some no céu e cai onde mirou, com lanças e fogo
      const sala = Math.floor(p.x / (CW * T)) * CW * T, tx = Math.max(sala + 2 * T, Math.min(sala + (CW - 2) * T, p.x + (Math.abs(ux) > 0.2 ? ux : p.face * 0.9) * 360));
      G.quedaMira = { fase: 0, t: 0, tx, dano: base * 7, y0: p.y }; p.vy = -1500; p.inv = Math.max(p.inv, 2.2); G.risco(p.x, p.y - 20, p.x + ux * 60, p.y - 420, '#E8C873', 4); G.efeito('baque', p.x, p.y);
      break; }
    default: { // guerreiro: a investida pesada, de espada à frente
      G.investidaMira = { t: -0.14, dur: 0.24, ux, uy, vel: 1150, dano: base * 6, larg: 72, atk: atk(), cortes: [], cor: '#FFF1BE', inv: 0.55, pesado: true };
      G.efeito('estocadaLonga', p.x, p.y, p.face, { gruda: p }); G.risco(ox, oy, ox + ux * 280, oy + uy * 280, '#FFF1BE', 6); }
  }
}

// a cada quadro: a investida em linha reta (guerreiro, zelote) e a queda do valente
export function passoMira(G, dt) {
  const p = G.p, I = G.investidaMira, Q = G.quedaMira;
  if (p.morto) { G.investidaMira = G.quedaMira = null; return; }
  if (I) {
    I.t += dt; p.inv = Math.max(p.inv, 0.12); p.stunT = 0; p.atkCd = Math.max(p.atkCd, 0.1);
    if (I.t < 0) { p.vx = -I.ux * 60; p.vy = Math.min(p.vy, 0); } // o recuo antes do bote
    else {
      // anda pela linha em passos curtos (a física comum frearia o bote); para na primeira parede
      const cheio = (x, y) => solido(G.N, Math.floor(x / T), Math.floor(y / T)); let falta = I.vel * dt; p.vx = 0; p.vy = 0; p.face = Math.sign(I.ux) || p.face;
      if (I.cortes.length && I.t > I.cortes[0]) { I.cortes.shift(); I.atk.hits.clear(); sfx('swing'); }
      while (falta > 0) { const d = Math.min(10, falta), nx = p.x + I.ux * d; let ny = p.y + I.uy * d; falta -= d;
        if (I.uy > 0 && cheio(nx, ny + 1)) ny = p.y; // mirando para o chão, o bote desliza rente a ele
        if (cheio(nx + Math.sign(I.ux) * 10, ny - 6) || cheio(nx + Math.sign(I.ux) * 10, ny - 46) || cheio(nx, ny - 54)) { I.t = I.dur; break; }
        p.x = nx; p.y = ny; G.golpear({ x: p.x - I.larg / 2, y: p.y - 26 - I.larg / 2, w: I.larg, h: I.larg }, I.dano, I.atk); }
      if (Math.random() < dt * 60) G.parts.push({ x: p.x, y: p.y - 26 + rand(-10, 10), vx: -I.ux * 80, vy: -I.uy * 80, t: 0.25, max: 0.25, r: 2, cor: I.cor, g: 0 });
      if (I.t >= I.dur) { p.vx *= 0.25; p.vy = Math.min(p.vy * 0.2, 120); if (I.pesado) { G.tremor(10); G.efeito('baque', p.x, p.y); G.golpear({ x: p.x - 70, y: p.y - 80, w: 140, h: 90 }, I.dano * 0.4, { dir: 'lado', hits: new Set(), semOleo: true, carga: true }); } if (I.ecos) { const feridos = [...I.atk.hits].filter(e => e && e.hp > 0 && !e.morrendo && e.kind); // os outros dois cortes chegam depois que ele já passou
          for (let k = 1; k <= I.ecos; k++) setTimeout(() => { if (!G.running) return; for (const e of feridos) if (e.hp > 0 && !e.morrendo && G.inimigos.includes(e)) { G.efeito('corteAdaga', e.x, e.y - e.h / 2 + 26, k % 2 ? 1 : -1, { vel: 1.3 }); G.atingir(e, I.dano, e.x - I.ux, { dir: 'lado', hits: new Set(), semOleo: true, carga: true }); } if (feridos.length) { sfx('swing'); G.tremor(4); } }, k * 130); }
        G.investidaMira = null; }
    }
  }
  if (Q) {
    Q.t += dt; p.inv = Math.max(p.inv, 0.3); p.atkCd = Math.max(p.atkCd, 0.2); p.vx = 0;
    if (Q.fase === 0) { p.vy = -900; p.y -= 1500 * dt; if (Q.t > 0.3) { Q.fase = 1; Q.t = 0; const topo = Math.floor((Q.y0 - 2) / (CH * T)) * CH * T; p.x = Q.tx; p.y = topo + 2 * T; p.vy = 0; // reaparece no alto, sobre o alvo
        for (let i = 0; i < 9; i++) setTimeout(() => { if (G.running) G.tiros.push({ semOleo: true, x: Q.tx + rand(-210, 210), y: topo + T, vx: rand(-40, 40), vy: 1050, r: 8, amigo: true, vida: 1.1, cor: '#E8C873', tipo: 'lanca', dano: Q.dano * 0.18, estoura: { raio: 44, dano: Q.dano * 0.1, fx: 'explosaoFogo' } }); }, i * 55); } }
    else if (Q.fase === 1) { p.vy = 0; if (Q.t > 0.22) { Q.fase = 2; Q.t = 0; sfx('boss'); } }
    else { p.vy = 2300; if (p.y < Q.y0 - 40) p.desce = 0.12; if ((p.chao && p.y >= Q.y0 - 40) || Q.t > 0.9) { G.quedaMira = null; p.vy = 0; G.tremor(18); G.clarao = 0.16; sfx('hit'); G.efeito('baque', p.x, p.y); G.efeito('explosaoFogo', p.x, p.y); G.fx.anel(p.x, p.y - 10, '#FFB05A', 220);
        G.golpear({ x: p.x - 150, y: p.y - 150, w: 300, h: 170 }, Q.dano, { dir: 'cima', hits: new Set(), semOleo: true, carga: true });
        for (const s of [-1, 1]) for (let k = 1; k <= 3; k++) G.zonas.push({ tipo: 'col', x: p.x + s * k * 62, w: 50, aviso: 0.05 + k * 0.09, dur: 0.3, cor: '#FF8A2A', amigo: Q.dano * 0.2, y0: p.y - 150, y1: p.y + 20 }); } }
  }
}

// tiros especiais do ataque mira: o que quica nas paredes e o que estoura ao morrer. Devolve true se o tiro seguiu vivo por conta própria.
export function tiroEspecial(G, t, dt) {
  const N = G.N, cheio = (x, y) => solido(N, Math.floor(x / T), Math.floor(y / T));
  if (t.quica > 0 && cheio(t.x, t.y)) {
    const px = t.x - t.vx * dt, py = t.y - t.vy * dt, bx = cheio(t.x, py), by = cheio(px, t.y);
    if (bx || !by) t.vx *= -1; if (by || !bx) t.vy *= -1;
    t.x = px; t.y = py; t.quica--; t.hits = new Set(); t.r0 = Math.max(10, t.r0 - 1); G.fx.anel(t.x, t.y, '#BFF0F8', 60); sfx('block'); G.tremor(3);
    if (t.quica <= 0) t.fura = false;
    return true;
  }
  return false;
}
export function estourar(G, t) {
  const e = t.estoura; if (!e || t.estourou) return; t.estourou = true;
  G.efeito(e.fx, t.x, t.y + 10); G.tremor(5); sfx('hit');
  G.golpear({ x: t.x - e.raio, y: t.y - e.raio, w: e.raio * 2, h: e.raio * 2 }, e.dano, { dir: 'lado', hits: new Set(), semOleo: true, carga: true });
}
