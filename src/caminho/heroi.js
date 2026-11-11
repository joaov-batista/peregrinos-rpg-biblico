// O peregrino em vista lateral: movimento, a Lâmpada (vigília), a oração, os golpes e o desenho articulado.
import { clamp, lerp, TAU, rand } from '../util.js';
import { sfx } from '../audio.js';
import { vibrar } from '../gamepad.js';
import { drawWeapon } from '../game/character-art.js';
import { T } from './nivel.js';
import { mover, paredeAoLado, tocaEspinho } from './corpo.js';

// Todo peregrino nasce com salto duplo, passo pronto (com espera longa) e a vigília, que só defende no tempo certo.
export const VEL = 276, GRAV = 2050, PULO = 700, QUEDA = 920, OLEO_USO = 33;
// Cada arma golpeia do seu jeito. "tiro" faz do golpe um disparo (pastor, profeta e levita lutam de longe);
// "fx" é o efeito próprio do golpe de lado; "cor" pinta os efeitos de cima, de baixo e do impacto.
export const ARMAS = {
  espada: { alc: 62, alt: 46, cd: 0.34, d: 1, len: 26, fx: 'corte', cor: 'aco' },
  adaga: { alc: 46, alt: 40, cd: 0.24, d: 0.5, len: 16, fx: 'corteAdaga', cor: 'roxo', duplo: true, avanco: 90 },
  lanca: { alc: 96, alt: 28, cd: 0.46, d: 1.2, len: 34, fx: 'estocada', cor: 'bronze' },
  chicote: { alc: 118, alt: 30, cd: 0.5, d: 0.95, len: 18, fx: null, cor: 'couro', chicote: true },
  cajado: { alc: 54, alt: 44, cd: 0.5, d: 1.05, len: 30, fx: 'corteFogo', cor: 'fogo', tiro: { tipo: 'fogo', v: 470, r: 8, vida: 0.75 } },
  trombeta: { alc: 54, alt: 50, cd: 0.56, d: 0.8, len: 20, fx: 'corteSom', cor: 'som', empurra: 1.8, tiro: { tipo: 'som', v: 390, r: 9, vida: 0.44, fura: true } },
  funda: { alc: 46, alt: 40, cd: 0.42, d: 0.95, len: 20, fx: 'corteCurto', cor: 'aco', tiro: { tipo: 'pedra', v: 640, r: 5, vida: 0.8, g: 380 } }
};
// direção do golpe → vetor (x multiplicado pela face)
export const DIRS = { lado: [1, 0], cima: [0, -1], baixo: [0, 1], diagC: [0.72, -0.7], diagB: [0.72, 0.7], rasteira: [1, 0] };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const aprox = (a, b, d) => a < b ? Math.min(b, a + d) : Math.max(b, a - d);

export function novoHeroi(x, y, vidaMax) {
  return {
    x, y, vx: 0, vy: 0, w: 18, h: 54, face: 1, chao: false, parede: 0, coyote: 0, buf: 0, pulos: 0, dashT: 0, dashCd: 0, dashAr: true,
    atk: null, atkCd: 0, atkBuf: 0, carga: 0, combo: 0, lamp: false, lampA: 0, vig: 0, vigCd: 0, inv: 0, stunT: 0, travaX: 0, desce: 0,
    vida: vidaMax, vidaMax, oleo: 0, orando: 0, seguro: { x, y }, segT: 0, morto: false, desliza: 0,
    // animação
    passo: 0, sq: 1, incl: 0, capa: null, pisca: 0, olhar: 0, tAr: 0, rastro: []
  };
}

export function atualizarHeroi(G, dt) {
  const p = G.p, c = G.ctl, hab = G.hab, N = G.N, arma = G.arma;
  if (p.morto) return;
  for (const k of ['inv', 'stunT', 'travaX', 'dashCd', 'atkCd', 'vigCd', 'desce', 'atkBuf']) if (p[k] > 0) p[k] -= dt;
  const preso = p.stunT > 0;
  const emDash = p.dashT > 0;

  // ---- Vigília: erguer a lâmpada. Os primeiros instantes são a defesa perfeita. ----
  const podeLamp = !preso && !emDash && !p.atk && p.orando <= 0;
  if (c.lampP && podeLamp) { p.vig = p.vigCd > 0 ? 0.09 : (hab.escudo ? 0.3 : 0.22); p.vigCd = 0.75; sfx('click'); }
  p.lamp = c.lamp && podeLamp;
  if (p.vig > 0) p.vig -= dt;
  if (!p.lamp) p.vig = 0;
  p.lampA = damp(p.lampA, p.lamp ? 1 : 0, 16, dt);

  // ---- Oração: gasta azeite para recuperar um fôlego; fica parado e vulnerável ----
  if (c.orar && p.chao && !preso && !emDash && !p.lamp && p.oleo >= OLEO_USO && p.vida < p.vidaMax) {
    p.orando += dt; if (p.orando < dt * 1.5) sfx('magic');
    if (p.orando >= 0.95) { p.orando = 0; p.oleo -= OLEO_USO; p.vida++; sfx('heal'); G.efeito('cura', p.x, p.y, 1, { gruda: p }); G.fx.anel(p.x, p.y - 20, '#FFE9A8', 60); G.fx.sobe(p.x, p.y - 10, 14, '#FFE9A8'); }
  } else p.orando = 0;

  // ---- correr ----
  const lento = (p.lamp ? 0.5 : 1) * (G.lentidao || 1);
  const alvo = p.orando > 0 ? 0 : c.mx * VEL * lento;
  if (!preso && !emDash && p.travaX <= 0) p.vx = aprox(p.vx, alvo, (p.chao ? 2700 : 1750) * dt);
  if (preso && p.chao) p.vx = aprox(p.vx, 0, 900 * dt);
  if (c.mx && !p.atk && !preso && !emDash && p.travaX <= 0) p.face = Math.sign(c.mx);

  // ---- pular / deslizar na parede ----
  p.buf = c.pulo ? 0.13 : p.buf - dt;
  p.coyote = p.chao ? 0.1 : p.coyote - dt;
  p.desliza = 0;
  if (hab.firmeza && !p.chao && !emDash && p.vy > 0) {
    const lado = c.mx > 0.3 ? 1 : c.mx < -0.3 ? -1 : 0;
    if (lado && paredeAoLado(N, p, lado)) { p.desliza = lado; p.vy = Math.min(p.vy, 115); p.pulos = hab.asas ? 2 : 1; p.dashAr = true; p.face = -lado; if (Math.random() < dt * 14) G.fx.po(p.x + lado * 9, p.y - 20, 1, '#C9D2C4'); }
  }
  if (p.buf > 0 && !preso && p.orando <= 0) {
    if (c.my > 0.5 && p.chao && p.naPonte && (c.pulo || (p.baixoT = (p.baixoT || 0) + dt) > 0.12)) { p.desce = 0.2; p.buf = 0; p.chao = false; p.baixoT = 0; c.pulo = false; }
    if (!(c.my > 0.5)) p.baixoT = 0;
    else if (p.coyote > 0) { p.vy = -PULO; p.coyote = 0; p.buf = 0; p.sq = 1.22; sfx('step'); G.fx.po(p.x, p.y, 5, '#C9D2C4'); p.dashT = 0; }
    else if (hab.firmeza && (p.desliza || paredeAoLado(N, p, 1) || paredeAoLado(N, p, -1))) {
      const lado = p.desliza || (paredeAoLado(N, p, 1) ? 1 : -1);
      p.vy = -PULO * 0.95; p.vx = -lado * 300; p.travaX = 0.14; p.face = -lado; p.buf = 0; p.sq = 1.2; sfx('step'); G.fx.po(p.x + lado * 9, p.y - 16, 5, '#C9D2C4');
    }
    else if (p.pulos > 0) { p.pulos--; p.vy = -PULO * 0.9; p.buf = 0; p.sq = 1.25; sfx('dodge'); G.fx.asas(p.x, p.y - 22); }
  }
  if (!c.puloSeg && p.vy < -330 && !p.pogo) p.vy = -330; // soltar o botão encurta o pulo
  if (p.vy >= 0) p.pogo = false;

  // ---- passo pronto (dash) ----
  // todo peregrino tem o passo pronto, mas ele demora a voltar (os Calçados da Paz encurtam a espera)
  if (c.dash && p.dashCd <= 0 && !preso && (p.chao || p.dashAr) && p.orando <= 0) {
    p.dashT = 0.19; p.dashCd = p.dashMax = hab.calcados ? 0.6 : 1.4; p.dashDir = c.mx ? Math.sign(c.mx) : p.face; p.face = p.dashDir;
    if (!p.chao) p.dashAr = false; p.atk = null; p.lamp = false; sfx('dodge');
    // passo rasteiro (para baixo + passo): passa por baixo do golpe e atravessa o adversário sem ser ferido
    p.rasteiro = c.my > 0.35; if (p.rasteiro) { p.inv = Math.max(p.inv, 0.42); p.dashT = 0.26; G.textoEm(p.x, p.y - 62, 'passo rasteiro', '#BFD6E8', 11); } G.fx.po(p.x, p.y - 4, 6, '#E8E2C8');
  }
  if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.dashDir * 600; p.vy = 0;
    p.rastro.push({ x: p.x, y: p.y, t: 0.22, face: p.face });
  } else p.vy = Math.min(QUEDA, p.vy + GRAV * dt);
  for (const r of p.rastro) r.t -= dt;
  while (p.rastro.length && p.rastro[0].t <= 0) p.rastro.shift();

  // ---- golpes ----
  if (c.atk) p.atkBuf = 0.13;
  if (p.atkBuf > 0 && p.atkCd <= 0 && !p.lamp && !preso && !emDash && p.orando <= 0) {
    // oito direções: para os lados, para cima, para baixo (no ar quica; no chão é rasteira) e as diagonais
    const dir = c.my < -0.5 ? (c.mx ? 'diagC' : 'cima') : c.my > 0.5 ? (p.chao ? 'rasteira' : c.mx ? 'diagB' : 'baixo') : 'lado';
    const [ux, uy] = DIRS[dir], tiro = arma.tiro && dir !== 'baixo' && dir !== 'rasteira' ? arma.tiro : null, cor = hab.espada ? 'luz' : arma.cor;
    p.atk = { t: 0, dur: arma.duplo ? 0.24 : 0.17, dir, face: p.face, hits: new Set(), n: p.combo++, semCaixa: !!tiro };
    p.atkCd = arma.cd; p.atkBuf = 0; sfx(tiro ? 'shoot' : 'swing');
    const fxDe = { cima: 'cima_' + cor, diagC: 'cima_' + cor, baixo: 'baixo_' + cor, diagB: 'baixo_' + cor }[dir] || arma.fx;
    if (fxDe) G.efeito(fxDe === 'corte' && hab.espada ? 'corteLuz' : fxDe, p.x, p.y, p.face, { gruda: p, dx: dir === 'diagC' || dir === 'diagB' ? p.face * 14 : 0, dy: dir === 'baixo' || dir === 'diagB' ? 24 : dir === 'rasteira' ? 20 : 0, vel: 1.25 });
    if (arma.avanco && dir === 'lado' && p.chao) p.vx = p.face * arma.avanco * 3;
    if (tiro) G.tiros.push({ x: p.x + p.face * ux * 16, y: p.y - 28 + uy * 14, vx: p.face * ux * tiro.v, vy: uy * tiro.v - (tiro.g ? 60 : 0), g: tiro.g || 0, r: tiro.r, r0: tiro.r, dano: G.danoBase() * arma.d, amigo: true, vida: tiro.vida, max: tiro.vida, cor: '#FFF1BE', tipo: tiro.tipo, fura: tiro.fura, basico: true });
  }
  if (p.atk) {
    const a = p.atk; a.t += dt;
    if (arma.duplo && !a.segundo && a.t > 0.11) { a.segundo = true; a.hits.clear(); a.reagiu = false; sfx('swing'); if (a.dir === 'lado') G.efeito(arma.fx, p.x, p.y - 8, a.face, { gruda: p, dy: -8, vel: 1.4 }); } // a adaga fere duas vezes
    if (a.t > 0.03 && a.t < a.dur && !a.semCaixa) {
      const alc = arma.alc, f = a.face; let cx, cy, w, h;
      if (a.dir === 'lado') { cx = p.x + f * (alc / 2 + 4); cy = p.y - 28; w = alc; h = arma.alt; }
      else if (a.dir === 'rasteira') { cx = p.x + f * (alc / 2 + 4); cy = p.y - 11; w = alc * 1.1; h = 22; }
      else if (a.dir === 'cima') { cx = p.x; cy = p.y - 50 - alc / 2; w = arma.alt + 6; h = alc; }
      else if (a.dir === 'baixo') { cx = p.x; cy = p.y + alc / 2 - 6; w = arma.alt + 6; h = alc; }
      else if (a.dir === 'diagC') { cx = p.x + f * alc * 0.5; cy = p.y - 54 - alc * 0.28; w = h = alc * 0.85; }
      else { cx = p.x + f * alc * 0.48; cy = p.y + alc * 0.26; w = h = alc * 0.85; }
      const r = G.golpear({ x: cx - w / 2, y: cy - h / 2, w, h }, G.danoBase() * arma.d, a);
      if (r && !a.reagiu) {
        a.reagiu = true;
        if (a.dir === 'baixo' || a.dir === 'diagB') { p.vy = -560; p.pogo = true; p.pulos = hab.asas ? 2 : 1; p.dashAr = true; if (a.dir === 'diagB') p.vx -= f * 90; }
        else if (a.dir === 'lado' || a.dir === 'rasteira') { p.vx -= f * 150; }
        else if (p.vy < 0) p.vy *= 0.5;
        if (arma.chicote) G.efeito('estalo', cx + f * w * 0.4 * (a.dir === 'cima' || a.dir === 'baixo' ? 0 : 1), cy, f);
      }
    }
    if (a.t >= a.dur + 0.05) p.atk = null;
  }
  // Espada do Espírito: segurar o golpe carrega uma onda de luz ("Está escrito")
  if (hab.espada && c.atkSeg && !p.lamp && !preso) {
    p.carga += dt; if (p.carga > 0.6 && p.carga - dt <= 0.6) sfx('key');
  } else {
    if (p.carga >= 0.6 && !preso) {
      G.tiros.push({ x: p.x + p.face * 20, y: p.y - 22, vx: p.face * 560, vy: 0, r: 20, dano: G.danoBase() * 2.4, amigo: true, vida: 0.7, cor: '#FFF1BE', tipo: 'onda', fura: true });
      sfx('magic'); G.tremor(4); p.vx -= p.face * 120;
    }
    p.carga = 0;
  }
  // verso (especial da vocação)
  if (c.verso && p.oleo >= OLEO_USO && !preso && !p.lamp && p.orando <= 0) G.verso();

  // ---- física ----
  const noAr = !p.chao, vyAntes = p.vy;
  mover(N, p, dt);
  if (p.chao) {
    if (noAr && vyAntes > 260) { p.sq = clamp(1 - vyAntes / 2600, 0.7, 0.9); G.fx.po(p.x, p.y, vyAntes > 600 ? 9 : 4, '#C9D2C4'); sfx('step'); }
    p.pulos = hab.asas ? 2 : 1; p.dashAr = true; p.tAr = 0;
    p.segT -= dt;
    if (p.segT <= 0 && !p.naPonte && !tocaEspinho(N, { ...p, w: p.w + 40 })) { p.segT = 0.25; p.seguro = { x: p.x, y: p.y }; }
  } else p.tAr += dt;
  if (tocaEspinho(N, p) && p.inv <= 0.01) G.ferirHeroi(1, null, { espinho: true });
  if (p.y > N.h * T + 200) G.ferirHeroi(1, null, { espinho: true });

  // ---- animação ----
  p.passo += Math.abs(p.vx) * dt / 44 * (p.chao ? 1 : 0.25);
  p.sq = damp(p.sq, 1, 12, dt);
  p.incl = damp(p.incl, clamp(p.vx / VEL, -1.4, 1.4) * (emDash ? 0.5 : 0.16), 12, dt);
  p.pisca -= dt; if (p.pisca < -0.12) p.pisca = rand(1.8, 4.5);
  atualizarCapa(p, dt);
}

// capa: corrente de pontos que segue os ombros com atraso (em coordenadas do mundo)
function atualizarCapa(p, dt) {
  const n = 6, ax = p.x - p.face * 4, ay = p.y - 40 + (p.orando > 0 ? 8 : 0);
  if (!p.capa) p.capa = Array.from({ length: n }, (_, i) => ({ x: ax - p.face * i * 3, y: ay + i * 6 }));
  const vento = Math.sin(performance.now() / 380) * 1.4;
  let px = ax, py = ay;
  p.capa.forEach((q, i) => {
    if (i === 0) { q.x = ax; q.y = ay; return; }
    // alvo: abaixo e atrás do ponto anterior; a velocidade empurra para trás
    const tx = px - p.face * (1.6 + i * 0.4) - Math.max(-4.2, Math.min(4.2, p.vx * 0.014)) + vento * i * 0.25, ty = py + 5.6 - Math.max(-2.5, Math.min(4, p.vy * 0.005));
    const k = 34 - i * 3;
    q.x = damp(q.x, tx, k, dt); q.y = damp(q.y, ty, k, dt);
    // comprimento fixo entre os pontos
    const dx = q.x - px, dy = q.y - py, d = Math.hypot(dx, dy) || 1, L = 5.4;
    q.x = px + dx / d * L; q.y = py + dy / d * L;
    px = q.x; py = q.y;
  });
  p.capa[0].x = ax; p.capa[0].y = ay;
}

/* ---------------- desenho ---------------- */
const INK = '#080F19';
function traco(g, pts, cor, larg) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = cor; g.lineWidth = larg; g.stroke(); }
function membro(g, pts, cor, larg) { traco(g, pts, INK, larg + 2); traco(g, pts, cor, larg); }

export function desenharHeroi(g, p, look, arma, tipoArma, Tm, hab = {}) {
  const skin = look.skin || '#C68B59', tunic = look.tunic || '#526C78', cape = look.cape && look.cape !== 'none' ? look.cape : '#394F62';
  g.lineCap = 'round'; g.lineJoin = 'round';
  // rastro do passo pronto
  for (const r of p.rastro) { g.save(); g.globalAlpha = r.t * 1.6; g.translate(r.x, r.y); g.scale(r.face, 1); g.fillStyle = '#E9E3C6'; g.beginPath(); g.ellipse(0, -20, 9, 19, 0, 0, TAU); g.fill(); g.restore(); }
  if (p.inv > 0 && !p.morto && Math.floor(Tm * 22) % 2) g.globalAlpha = 0.45;

  // capa (em coordenadas do mundo)
  if (p.capa) {
    // fita com largura perpendicular ao caimento: abre na barra, nunca vira um fio
    const c = p.capa, esq = [], dir = [];
    for (let i = 0; i < c.length; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, w = 3.6 + i * 1.15;
      esq.push([c[i].x - dy / d * w, c[i].y + dx / d * w]); dir.push([c[i].x + dy / d * w, c[i].y - dx / d * w]);
    }
    g.beginPath(); g.moveTo(esq[0][0], esq[0][1]);
    for (let i = 1; i < esq.length; i++) g.lineTo(esq[i][0], esq[i][1]);
    const u = c.length - 1; g.lineTo(c[u].x + (c[u].x - c[u - 1].x) * 0.5, c[u].y + (c[u].y - c[u - 1].y) * 0.5 + 1.5);
    for (let i = dir.length - 1; i >= 0; i--) g.lineTo(dir[i][0], dir[i][1]);
    g.closePath(); g.fillStyle = cape; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); g.moveTo(c[1].x, c[1].y); for (let i = 2; i < c.length; i++) g.lineTo(c[i].x, c[i].y); g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = 1; g.stroke();
  }

  g.save();
  g.translate(p.x, p.y); g.scale(p.face, 1);
  const sy = p.sq, sx = 1 / Math.sqrt(sy);
  g.rotate(p.incl * (p.chao ? 1 : 0.7)); g.scale(sx, sy);
  const corre = p.chao ? Math.min(1, Math.abs(p.vx) / VEL) : 0, ph = p.passo * TAU;
  const noAr = !p.chao, sobe = noAr && p.vy < 0;
  const ajoelha = p.orando > 0 ? Math.min(1, p.orando * 5) : 0;
  const bob = Math.abs(Math.sin(ph)) * 1.6 * corre + Math.sin(Tm * 2.2) * 0.5 * (1 - corre) - ajoelha * 7;
  const quadril = { x: 0, y: -15 + bob * -1 + ajoelha * 7 };

  // pernas: dois segmentos, pés em elipse durante a corrida
  const perna = (fase, frente) => {
    let fx, fy;
    if (ajoelha) { fx = frente ? 6 : -7; fy = 0; }
    else if (noAr) { fx = (frente ? 5 : -5) + (sobe ? -2 : 2) * (frente ? 1 : -1); fy = sobe ? -5 + (frente ? -4 : 0) : -1 + (frente ? 0 : -3); }
    else if (p.desliza) { fx = 4; fy = frente ? -3 : -8; }
    else { fx = Math.sin(ph + fase) * 8.5 * corre + (frente ? 2 : -2) * (1 - corre); fy = -Math.max(0, Math.cos(ph + fase)) * 6 * corre; }
    const jx = (quadril.x + fx) / 2 + 3.2 + (ajoelha ? (frente ? 3 : -1) : 0), jy = (quadril.y + fy) / 2 - 1 + (ajoelha && !frente ? 5 : 0);
    membro(g, [[quadril.x, quadril.y], [jx, jy], [fx, fy]], frente ? '#3A4654' : '#2B3440', 3.3);
    membro(g, [[fx - 1, fy], [fx + 4.5, fy]], '#1C2530', 3.2);
  };
  perna(Math.PI, false);

  // corpo: túnica
  const ty = quadril.y;
  g.beginPath(); g.moveTo(-6.5, ty + 4); g.quadraticCurveTo(-8, ty - 9, -5, ty - 17); g.lineTo(5.5, ty - 17); g.quadraticCurveTo(8.5, ty - 8, 7, ty + 4);
  g.quadraticCurveTo(0, ty + 7, -6.5, ty + 4); g.closePath();
  const gr = g.createLinearGradient(-8, 0, 9, 0); gr.addColorStop(0, sombra(tunic, -0.28)); gr.addColorStop(0.6, tunic); gr.addColorStop(1, sombra(tunic, 0.14));
  g.fillStyle = gr; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
  // cinto (dourado quando cingido com a verdade)
  traco(g, [[-6.6, ty - 3], [7.2, ty - 3]], hab.firmeza ? '#D7B25A' : '#5B4A3A', 2.2);
  if (hab.couraca) { g.fillStyle = 'rgba(214,222,214,.5)'; g.beginPath(); g.moveTo(-4, ty - 15); g.lineTo(5, ty - 15); g.lineTo(4, ty - 6); g.lineTo(-3, ty - 6); g.closePath(); g.fill(); }
  perna(0, true);

  // cabeça e capuz
  const hy = ty - 25 + (ajoelha ? 3 : 0), hx = 1 + (ajoelha ? 3 : 0);
  g.beginPath(); g.moveTo(hx - 9, hy + 7); g.quadraticCurveTo(hx - 11, hy - 9, hx - 1, hy - 11); g.quadraticCurveTo(hx + 9, hy - 10, hx + 8.5, hy - 1);
  g.quadraticCurveTo(hx + 8, hy + 6, hx + 2, hy + 8.5); g.closePath();
  g.fillStyle = cape; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
  // ponta do capuz, que balança
  const bal = Math.sin(Tm * 3 + p.passo) * 1.5 - p.vx * 0.012;
  g.beginPath(); g.moveTo(hx - 8, hy - 6); g.quadraticCurveTo(hx - 15 + bal, hy - 10, hx - 16 + bal * 1.6, hy - 2 - p.vy * 0.004); g.quadraticCurveTo(hx - 12, hy - 1, hx - 9.5, hy + 2); g.closePath();
  g.fillStyle = cape; g.fill(); g.stroke();
  // rosto na sombra do capuz
  g.beginPath(); g.ellipse(hx + 2.6, hy - 0.5, 5.2, 6.3, 0.08, 0, TAU); g.fillStyle = hab.capacete ? '#C9CFC4' : skin; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.1; g.stroke();
  g.fillStyle = 'rgba(8,15,25,.32)'; g.beginPath(); g.ellipse(hx + 1.2, hy - 3.6, 5.2, 3.4, 0.08, Math.PI, TAU); g.fill();
  if (p.pisca > 0 && !p.morto) { g.fillStyle = INK; g.beginPath(); g.ellipse(hx + 4.6, hy - 0.4, 1.15, 1.9, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(hx + 4.7, hy - 1.5, 0.9, 0.9); }
  else traco(g, [[hx + 3.4, hy - 0.2], [hx + 5.8, hy - 0.2]], INK, 1);

  // braço da lâmpada (atrás quando abaixada, erguida à frente na vigília)
  const la = p.lampA, om = { x: -1, y: ty - 14 };
  const lm = { x: lerp(-5, 9, la), y: lerp(ty - 3, ty - 31, la) + (ajoelha ? 6 : 0) };
  membro(g, [[om.x, om.y], [(om.x + lm.x) / 2 - 2, (om.y + lm.y) / 2 + 2], [lm.x, lm.y]], sombra(tunic, -0.15), 2.6);
  lampada(g, lm.x, lm.y + 2, Tm, 0.55 + la * 0.45 + (p.vig > 0 ? 0.6 : 0), p.oleoFrac ?? 1);

  // braço da arma
  const ombro = { x: 3, y: ty - 14 };
  let ang = 0.95 + Math.sin(ph) * 0.35 * corre, mao;
  const a = p.atk;
  if (a) {
    const k = Math.min(1, a.t / a.dur), e = 1 - Math.pow(1 - k, 3);
    if (a.dir === 'lado') ang = lerp(-2.1, 1.25, e) * (a.n % 2 ? -1 : 1) + (a.n % 2 ? -0.3 : 0);
    else if (a.dir === 'cima') ang = lerp(0.2, -3.1, e) - 0.2;
    else ang = lerp(-0.4, 2.7, e) + 0.5;
    mao = { x: ombro.x + Math.cos(ang) * 9, y: ombro.y + Math.sin(ang) * 9 };
  } else if (p.carga > 0.15) { ang = -2.4 + Math.sin(Tm * 30) * 0.03 * Math.min(1, p.carga); mao = { x: ombro.x - 5, y: ombro.y - 5 }; }
  else if (ajoelha) { ang = 1.5; mao = { x: 8, y: ty - 6 }; }
  else mao = { x: ombro.x + 5 + Math.sin(ph) * 2 * corre, y: ombro.y + 9 - Math.abs(Math.cos(ph)) * corre };
  membro(g, [[ombro.x, ombro.y], [(ombro.x + mao.x) / 2 + 1.5, (ombro.y + mao.y) / 2 + 1.5], [mao.x, mao.y]], tunic, 2.8);
  g.save(); g.translate(mao.x, mao.y); g.rotate(ang);
  if (p.carga > 0.6) { g.shadowColor = '#FFF1BE'; g.shadowBlur = 12; }
  drawWeapon(g, tipoArma, arma.len, hab.espada ? 6 : 0, !!hab.espada);
  g.restore();
  g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.arc(mao.x, mao.y, 2.1, 0, TAU); g.fill(); g.stroke();
  g.restore();
  g.globalAlpha = 1;

  // arco do golpe
  if (a) arco(g, p, a, arma);
  // oração: luz que desce
  if (p.orando > 0) { g.save(); g.globalAlpha = Math.min(0.5, p.orando * 0.7); const gr2 = g.createLinearGradient(0, p.y - 150, 0, p.y); gr2.addColorStop(0, 'rgba(255,233,168,0)'); gr2.addColorStop(1, 'rgba(255,233,168,.75)'); g.fillStyle = gr2; g.fillRect(p.x - 13, p.y - 150, 26, 150); g.restore(); }
  if (p.carga > 0.15) { g.save(); g.globalAlpha = Math.min(1, p.carga); g.strokeStyle = p.carga >= 0.6 ? '#FFF1BE' : 'rgba(255,241,190,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y - 20, 30 - Math.min(0.6, p.carga) * 22, 0, TAU); g.stroke(); g.restore(); }
}

function lampada(g, x, y, Tm, brilho, oleo) {
  const tre = 1 + Math.sin(Tm * 17) * 0.08 + Math.sin(Tm * 7.3) * 0.06, r = (9 + brilho * 15) * tre * (0.45 + 0.55 * oleo);
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,224,150,${0.55 * Math.min(1, brilho)})`); gr.addColorStop(1, 'rgba(255,224,150,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.fillStyle = '#8A6A3A'; g.strokeStyle = INK; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 3.2, y + 3.4); g.lineTo(x + 3.2, y + 3.4); g.lineTo(x + 2.4, y - 2.6); g.lineTo(x - 2.4, y - 2.6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = oleo > 0.05 ? '#FFE7A6' : '#5C5646'; g.beginPath(); g.ellipse(x, y + 0.4, 1.7, 2.3 * tre, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(x, y - 3.4, 2.2, Math.PI, TAU); g.strokeStyle = '#B79A5E'; g.stroke();
}

function arco(g, p, a, arma) {
  const k = Math.min(1, a.t / a.dur), alfa = 1 - Math.pow(k, 2.2), R = arma.alc * 0.92;
  g.save(); g.translate(p.x, p.y - 22);
  let a0, a1;
  if (a.dir === 'lado') { g.scale(a.face, a.n % 2 ? -1 : 1); a0 = -1.25; a1 = 1.15; }
  else if (a.dir === 'cima') { g.rotate(-Math.PI / 2); a0 = -1.2; a1 = 1.2; g.translate(10, 0); }
  else { g.rotate(Math.PI / 2); a0 = -1.2; a1 = 1.2; g.translate(6, 0); }
  const fim = lerp(a0, a1, Math.min(1, k * 1.5)), ini = lerp(a0, a1, Math.max(0, k * 1.5 - 0.55));
  g.globalAlpha = alfa;
  g.beginPath(); g.arc(0, 0, R, ini, fim); g.arc(-R * 0.26, 0, R * 0.86, fim, ini, true); g.closePath();
  const gr = g.createRadialGradient(0, 0, R * 0.5, 0, 0, R); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,246,214,.75)'); gr.addColorStop(1, 'rgba(255,255,255,.98)');
  g.fillStyle = gr; g.fill();
  g.restore();
}

export function sombra(hex, d) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255;
  const f = v => Math.round(d < 0 ? v * (1 + d) : v + (255 - v) * d);
  return `rgb(${f(r)},${f(gg)},${f(b)})`;
}
export { damp, aprox };
export function feedbackDano() { vibrar(160, 0.8); }
