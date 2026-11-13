// ATAQUE MIRA: segure o golpe para carregar, aponte (mouse, analógico, setas ou arrastando o dedo no botão) e solte.
// Só acontece na direção mirada. Custa caro em azeite e tem espera, para não virar o golpe de sempre.
// Cada vocação tem três jeitos dele: com os pés no chão, no ar e agarrado à parede (deslizando). Não faz sentido a espada
// "bater no chão" no meio de um salto: no ar o golpe é outro, e na parede o peregrino usa o muro como apoio.
// Tudo aqui é feito com tiros, efeitos, riscos e golpes comuns, que já viajam pela rede: em grupo, todos veem e o dano vale.
import { sfx } from '../audio.js';
import { T, CW, CH } from './nivel.js';
import { solido, paredeAoLado } from './corpo.js';

export const MIRA_CUSTO = 40, MIRA_ESPERA = 5, MIRA_CARGA = 0.5;
const rand = (a, b) => a + Math.random() * (b - a);
export const MIRA_NOME = {
  guerreiro: { chao: 'Investida do valente', ar: 'Arco do céu', parede: 'Salto da muralha' },
  zelote: { chao: 'Três cortes', ar: 'Corte em X', parede: 'Ricochete' },
  profeta: { chao: 'Chuva de fogo', ar: 'Leque de brasas', parede: 'Muralha de fogo' },
  pastor: { chao: 'Rajada do ribeiro', ar: 'Granizo da funda', parede: 'Pedras que voltam' },
  levita: { chao: 'Brado de Jericó', ar: 'Trombeta ao redor', parede: 'Eco da muralha' },
  juiz: { chao: 'Açoite de Sangar', ar: 'Laço e queda', parede: 'Gancho do juiz' },
  valente: { chao: 'Queda da lança', ar: 'Lança cadente', parede: 'Lanças da muralha' }
};
const caixaDe = e => ({ x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h });
const toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const novoAtk = (dir = 'lado', hits) => ({ dir, hits: hits || new Set(), semOleo: true, carga: true });

// onde o peregrino está quando solta: no chão, no ar, ou colado numa parede (devolve também o lado da parede)
export function contextoMira(G) {
  const p = G.p;
  if (p.chao) return { onde: 'chao', lado: 0 };
  const lado = p.desliza || (paredeAoLado(G.N, p, 1) ? 1 : paredeAoLado(G.N, p, -1) ? -1 : 0);
  return lado ? { onde: 'parede', lado } : { onde: 'ar', lado: 0 };
}

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
  const p = G.p, cls = G.char.cls, base = G.danoBase() * (G.hab.espada ? 1.3 : 1), { onde, lado } = contextoMira(G);
  let ux = Math.cos(ang), uy = Math.sin(ang);
  // na parede, mirar para dentro do muro não tem sentido: o golpe sai para o lado de fora, como num pulo de parede
  if (onde === 'parede' && Math.sign(ux) === lado) { ux = -ux; ang = Math.atan2(uy, ux); }
  const ox = p.x, oy = p.y - 26, fora = -lado;
  p.oleo -= MIRA_CUSTO; p.miraCd = MIRA_ESPERA; if (Math.abs(ux) > 0.15) p.face = Math.sign(ux); p.desliza = 0;
  const tiro = o => G.tiros.push({ semOleo: true, x: ox + ux * 18, y: oy + uy * 18, vx: 0, vy: 0, r: 7, amigo: true, vida: 1, cor: '#FFF1BE', tipo: 'pedra', ...o });
  const depois = (ms, fn) => setTimeout(() => { if (G.running && !G.p.morto && G.p === p) fn(); }, ms);
  G.textoEm(p.x, p.y - 70, MIRA_NOME[cls]?.[onde] || 'Ataque mira', '#FFE9A8', 13); G.clarao = 0.1; G.tremor(6); sfx('magic');
  if (onde === 'parede') { G.fx.po(p.x + lado * 10, p.y - 30, 12, '#C9D2C4'); G.efeito('baque', p.x + lado * 12, p.y - 10); } // o muro estala com o impulso

  switch (cls) {
    case 'zelote': {
      if (onde === 'chao') { // três cortes num traço só: atravessa quase num piscar
        G.investidaMira = { t: 0, dur: 0.16, ux, uy, vel: 1900, dano: base * 2, larg: 64, atk: novoAtk(), cortes: [], ecos: 2, cor: '#C79BFF', inv: 0.4 };
        for (let i = 0; i < 3; i++) G.efeito('corteAdaga', ox + ux * (60 + i * 90), oy + uy * (60 + i * 90) + 26, i % 2 ? -p.face : p.face, { vel: 1.2 - i * 0.2 });
        G.risco(ox, oy, ox + ux * 320, oy + uy * 320, '#C79BFF', 5);
      } else if (onde === 'ar') { // dois traços cruzados no ar, em X, e o salto volta (dá para emendar)
        const a2 = ang + (uy > 0.3 ? -0.9 : 0.9) * (ux >= 0 ? 1 : -1);
        G.investidaMira = { t: 0, dur: 0.12, ux, uy, vel: 1800, dano: base * 2.2, larg: 60, atk: novoAtk(), cortes: [], cor: '#C79BFF', inv: 0.4, depois: { ux: Math.cos(a2), uy: Math.sin(a2), dur: 0.1 }, noFim: () => { p.vy = -380; p.dashAr = true; p.pulos = Math.max(p.pulos, 1); } };
        G.risco(ox, oy, ox + ux * 220, oy + uy * 220, '#C79BFF', 5); G.efeito('corteAdaga', ox + ux * 90, oy + uy * 90 + 26, p.face, { vel: 1.3 });
      } else { // da parede: quica de muro em muro, cortando o que estiver no caminho
        G.investidaMira = { t: 0, dur: 0.5, ux, uy, vel: 1500, dano: base * 1.8, larg: 58, atk: novoAtk(), cortes: [], ricocheta: 3, cor: '#C79BFF', inv: 0.6 };
        G.risco(ox, oy, ox + ux * 260, oy + uy * 260, '#C79BFF', 4);
      }
      break; }

    case 'profeta': {
      if (onde === 'chao') { // sete meteoros caem do céu sobre o ponto mirado
        const tx = ox + ux * 300, ty = oy + uy * 300, ld = Math.abs(ux) > 0.2 ? Math.sign(ux) : p.face;
        G.risco(ox, oy, tx, ty, '#FF8A2A', 3); G.efeito('pilar', tx, ty + 26);
        for (let i = 0; i < 7; i++) depois(i * 110, () => { const ax = tx + rand(-110, 110), sx = ax - ld * 240, sy = ty - 430, d = Math.hypot(ax - sx, ty + 40 - sy);
          G.tiros.push({ semOleo: true, x: sx, y: sy, vx: (ax - sx) / d * 820, vy: (ty + 40 - sy) / d * 820, r: 13, amigo: true, vida: 1.6, cor: '#FF8A2A', tipo: 'fogo', dano: base * 2.2, estoura: { raio: 74, dano: base * 1.6, fx: 'explosaoFogo' }, altoAte: ty - 60 }); sfx('shoot'); });
      } else if (onde === 'ar') { // pairando, abre um leque de cinco brasas na direção mirada, duas vezes
        G.flutua = 0.7; G.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p }); G.fx.anel(ox, oy, '#FF8A2A', 90);
        for (let l = 0; l < 2; l++) depois(l * 140, () => { for (let i = -2; i <= 2; i++) { const b = ang + i * 0.22; tiro({ x: p.x, y: p.y - 26, vx: Math.cos(b) * 620, vy: Math.sin(b) * 620, r: 11, vida: 1.2, tipo: 'fogo', cor: '#FF8A2A', dano: base * 1.6, estoura: { raio: 54, dano: base * 1.1, fx: 'explosaoFogo' } }); } sfx('shoot'); });
      } else { // da parede: uma muralha de fogo, cinco brasas empilhadas que varrem a sala
        G.efeito('pilar', p.x, p.y); G.fx.anel(ox, oy, '#FF8A2A', 120);
        for (let i = 0; i < 5; i++) depois(i * 40, () => tiro({ x: p.x + fora * 14, y: p.y - 8 - i * 30, vx: fora * 520, vy: 0, r: 14, vida: 1.6, tipo: 'fogo', cor: '#FF8A2A', dano: base * 1.8, fura: true }));
        p.vx = fora * 260; p.vy = -260;
      }
      break; }

    case 'pastor': {
      if (onde === 'chao') { // doze pedras do ribeiro em quatro levas, todas na mesma linha
        G.risco(ox, oy, ox + ux * 360, oy + uy * 360, '#FFF1BE', 3); G.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p });
        for (let l = 0; l < 4; l++) depois(l * 80, () => { for (let i = -1; i <= 1; i++) { const b = ang + i * 0.07 + rand(-0.02, 0.02); tiro({ x: p.x + Math.cos(b) * 18, y: p.y - 26 + Math.sin(b) * 18, vx: Math.cos(b) * 960, vy: Math.sin(b) * 960, dano: base * 0.9, r: 6, vida: 0.9, g: 120, tipo: 'pedra', brilho: true, fura: true }); } sfx('shoot'); });
      } else if (onde === 'ar') { // no ar, a funda gira e solta um granizo aberto; o coice joga o pastor para trás e para cima
        G.efeito('giroRoxo', p.x, p.y - 4, p.face, { gruda: p });
        for (let i = 0; i < 10; i++) { const b = ang + rand(-0.4, 0.4), v = rand(700, 900); tiro({ vx: Math.cos(b) * v, vy: Math.sin(b) * v, dano: base * 1.1, r: 6, vida: 0.8, g: 300, tipo: 'pedra', brilho: true }); }
        p.vx = -ux * 420; p.vy = Math.min(p.vy, -uy * 380 - 200); sfx('shoot');
      } else { // da parede: pedras que batem nas paredes e voltam
        G.risco(ox, oy, ox + ux * 200, oy + uy * 200, '#FFF1BE', 3);
        for (let i = 0; i < 6; i++) depois(i * 60, () => { const b = ang + rand(-0.12, 0.12); tiro({ x: p.x, y: p.y - 26, vx: Math.cos(b) * 900, vy: Math.sin(b) * 900, dano: base * 1.1, r: 6, r0: 6, vida: 1.6, tipo: 'pedra', brilho: true, quica: 3, cor: '#FFF1BE' }); sfx('shoot'); });
      }
      break; }

    case 'levita': {
      if (onde === 'chao') { // um brado só, enorme, que bate nas paredes e volta — e o chão treme junto
        G.efeito('giroSom', p.x, p.y - 6, p.face, { gruda: p }); G.fx.anel(ox, oy, '#BFF0F8', 150); G.risco(ox, oy, ox + ux * 200, oy + uy * 200, '#BFF0F8', 6);
        tiro({ vx: ux * 640, vy: uy * 640, r: 18, r0: 18, vida: 2.6, max: 9, tipo: 'som', fura: true, quica: 5, dano: base * 2.4, cor: '#BFF0F8' });
        for (const s of [-1, 1]) G.zonas.push({ tipo: 'col', x: p.x + s * 70, w: 60, aviso: 0.05, dur: 0.25, cor: '#BFF0F8', amigo: base * 0.8, y0: p.y - 60, y1: p.y + 10 });
        p.vx -= ux * 220;
      } else if (onde === 'ar') { // a trombeta toca para todos os lados: oito ondas em volta, e ele paira um instante
        G.flutua = 0.5; G.efeito('giroSom', p.x, p.y - 6, p.face, { gruda: p }); G.fx.anel(ox, oy, '#BFF0F8', 200);
        for (let i = 0; i < 8; i++) { const b = ang + i * Math.PI / 4; tiro({ x: p.x, y: p.y - 26, vx: Math.cos(b) * 520, vy: Math.sin(b) * 520, r: 12, r0: 12, vida: 0.9, max: 6, tipo: 'som', fura: true, dano: base * 1.4, cor: '#BFF0F8' }); }
      } else { // do muro: o eco sai maior, mais rápido, e quica muito mais
        G.efeito('giroSom', p.x, p.y - 6, p.face, { gruda: p }); G.fx.anel(p.x + lado * 10, oy, '#BFF0F8', 220); G.tremor(10);
        tiro({ vx: ux * 820, vy: uy * 820, r: 24, r0: 24, vida: 3.2, max: 12, tipo: 'som', fura: true, quica: 8, dano: base * 2.6, cor: '#BFF0F8' });
        p.vx = fora * 300; p.vy = -300;
      }
      break; }

    case 'juiz': chicoteMira(G, p, base, ux, uy, onde, lado); break;

    case 'valente': {
      if (onde === 'chao') { // some no céu e cai onde mirou, com lanças e fogo
        const sala = Math.floor(p.x / (CW * T)) * CW * T, tx = Math.max(sala + 2 * T, Math.min(sala + (CW - 2) * T, p.x + (Math.abs(ux) > 0.2 ? ux : p.face * 0.9) * 360));
        G.quedaMira = { fase: 0, t: 0, tx, dano: base * 7, y0: p.y }; p.vy = -1500; p.inv = Math.max(p.inv, 2.2); G.risco(p.x, p.y - 20, p.x + ux * 60, p.y - 420, '#E8C873', 4); G.efeito('baque', p.x, p.y);
      } else if (onde === 'ar') { // do alto, arremessa uma lança enorme na direção mirada: onde ela cravar, sobe fogo
        G.flutua = 0.45; G.risco(ox, oy, ox + ux * 300, oy + uy * 300, '#E8C873', 4);
        tiro({ vx: ux * 1250, vy: uy * 1250, r: 12, vida: 1.2, tipo: 'lanca', cor: '#E8C873', dano: base * 4, estoura: { raio: 90, dano: base * 2.4, fx: 'explosaoFogo' } });
        p.vx = -ux * 200; sfx('shoot');
      } else { // do muro: salta para fora e solta três lanças em leque
        p.vx = fora * 560; p.vy = -520; p.dashAr = true;
        for (let i = -1; i <= 1; i++) depois(60 + (i + 1) * 50, () => { const b = ang + i * 0.18; tiro({ x: p.x, y: p.y - 26, vx: Math.cos(b) * 1000, vy: Math.sin(b) * 1000, r: 9, vida: 1, tipo: 'lanca', cor: '#E8C873', dano: base * 2.2, estoura: { raio: 50, dano: base * 1.2, fx: 'explosaoFogo' } }); sfx('shoot'); });
      }
      break; }

    default: { // guerreiro (espada)
      if (onde === 'chao') { // a investida pesada, de espada à frente, que termina batendo no chão
        G.investidaMira = { t: -0.14, dur: 0.24, ux, uy, vel: 1150, dano: base * 6, larg: 72, atk: novoAtk(), cortes: [], cor: '#FFF1BE', inv: 0.55, pesado: true };
        G.efeito('estocadaLonga', p.x, p.y, p.face, { gruda: p }); G.risco(ox, oy, ox + ux * 280, oy + uy * 280, '#FFF1BE', 6);
      } else if (onde === 'ar') { // no ar não há chão para bater: a espada corta um arco largo e quem for pego sobe junto
        G.investidaMira = { t: -0.06, dur: 0.18, ux, uy, vel: 1250, dano: base * 4.5, larg: 80, atk: novoAtk('cima'), cortes: [], cor: '#FFF1BE', inv: 0.5, arco: true, noFim: () => { p.vy = -260; p.dashAr = true; } };
        G.efeito('giro', p.x, p.y - 10, p.face, { gruda: p }); G.risco(ox, oy, ox + ux * 220, oy + uy * 220, '#FFF1BE', 6);
      } else { // da parede: o muro é o apoio — o salto sai como uma lança, girando, e abre um corte que voa adiante
        G.investidaMira = { t: 0, dur: 0.26, ux, uy, vel: 1400, dano: base * 4, larg: 76, atk: novoAtk(), cortes: [], cor: '#FFF1BE', inv: 0.55, onda: true };
        G.efeito('giro', p.x, p.y - 10, p.face, { gruda: p }); G.risco(ox, oy, ox + ux * 340, oy + uy * 340, '#FFF1BE', 6);
      }
    }
  }
}

// O chicote do juiz: estala na direção mirada; o primeiro que ele pegar é laçado, puxado e arremessado.
// No chão, por cima da cabeça, para o outro lado; no ar, de cima para baixo contra o chão; na parede, para longe do muro.
// Um chefe não se arremessa: o laço puxa o juiz até ele, que chega batendo. Sem ninguém no caminho, o chicote vira gancho
// (no ar, na parede, ou mirando para cima) e puxa o juiz até o bloco.
function chicoteMira(G, p, base, ux, uy, onde, lado) {
  const ox = p.x, oy = p.y - 26, alc = 340; let alvo = null, fim = alc, gancho = null;
  for (let d = 20; d <= alc; d += 12) { const x = ox + ux * d, y = oy + uy * d;
    if (solido(G.N, Math.floor(x / T), Math.floor(y / T))) { fim = d; gancho = { x: ox + ux * (d - 14), y: oy + uy * (d - 14) }; break; }
    for (const e of G.inimigos) if (!alvo && e.hp > 0 && !e.morrendo && !e.sumiu && toca({ x: x - 18, y: y - 18, w: 36, h: 36 }, caixaDe(e))) alvo = e;
    if (alvo) { fim = d; break; } }
  G.risco(ox, oy, ox + ux * fim, oy + uy * fim, '#C98A4E', 4, true); G.efeito('estalo', ox + ux * fim, oy + uy * fim + 26, p.face); sfx('swing');
  if (!alvo) {
    if (gancho && (onde !== 'chao' || uy < -0.3) && fim > 40) {
      G.investidaMira = { t: 0, dur: Math.max(0.12, (fim - 24) / 1300), ux, uy, vel: 1300, dano: base * 1.6, larg: 50, atk: novoAtk(), cortes: [], cor: '#C98A4E', inv: 0.4, chicote: gancho, noFim: () => { p.vy = -420; p.dashAr = true; p.pulos = Math.max(p.pulos, 1); } };
      G.textoEm(gancho.x, gancho.y - 14, 'enganchou!', '#E8C873', 11);
    }
    return;
  }
  G.atingir(alvo, base * 1.2, ox, novoAtk());
  if (alvo.kind === 'chefe') { // não dá para jogar um chefe: o juiz é que voa até ele, e chega com três estalos
    const dx = alvo.x - p.x, dy = (alvo.y - alvo.h / 2) - (p.y - 26), d = Math.hypot(dx, dy) || 1;
    G.investidaMira = { t: 0, dur: Math.max(0.1, (d - alvo.w / 2 - 20) / 1400), ux: dx / d, uy: dy / d, vel: 1400, dano: base * 2, larg: 60, atk: novoAtk(), cortes: [], cor: '#C98A4E', inv: 0.5, chicote: { x: alvo.x, y: alvo.y - alvo.h / 2 },
      noFim: () => { for (let i = 0; i < 3; i++) setTimeout(() => { if (!G.running || alvo.hp <= 0) return; G.efeito('estalo', alvo.x - Math.sign(dx) * alvo.w * 0.3, alvo.y - alvo.h / 2 + 26, i % 2 ? 1 : -1); G.atingir(alvo, base * 1.6, p.x, novoAtk()); G.tremor(4); sfx('swing'); }, i * 120); p.vy = -300; } };
    return;
  }
  // um vício: laçado. Primeiro vem puxado até perto, depois faz o arco e é atirado.
  const destino = onde === 'chao' ? -p.face : onde === 'parede' ? -lado : (Math.sign(ux) || p.face);
  G.agarre = { e: alvo, t: 0, fase: 0, onde, destino, dano: base * 3.2, x0: alvo.x, y0: alvo.y, risco: 0 };
  alvo.stun = Math.max(alvo.stun, 2); G.textoEm(alvo.x, alvo.y - alvo.h - 10, 'LAÇADO!', '#E8C873', 13); G.tremor(3);
}

// a cada quadro: a investida em linha reta (guerreiro, zelote, gancho), a queda do valente, o laço do juiz, o pairar e os arremessados
export function passoMira(G, dt) {
  const p = G.p, I = G.investidaMira, Q = G.quedaMira;
  if (p.morto) { G.investidaMira = G.quedaMira = G.agarre = null; G.flutua = 0; return; }
  const cheio = (x, y) => solido(G.N, Math.floor(x / T), Math.floor(y / T));
  if (G.flutua > 0) { G.flutua -= dt; p.vy = Math.min(p.vy, 30); } // o profeta, o levita e o valente pairam um instante enquanto soltam
  if (I) {
    I.t += dt; p.inv = Math.max(p.inv, 0.12); p.stunT = 0; p.atkCd = Math.max(p.atkCd, 0.1);
    if (I.t < 0) { p.vx = -I.ux * 60; p.vy = Math.min(p.vy, 0); } // o recuo antes do bote
    else {
      // anda pela linha em passos curtos (a física comum frearia o bote); para na primeira parede (ou quica nela)
      let falta = I.vel * dt; p.vx = 0; p.vy = 0; p.face = Math.sign(I.ux) || p.face;
      if (I.cortes.length && I.t > I.cortes[0]) { I.cortes.shift(); I.atk.hits.clear(); sfx('swing'); }
      if (I.chicote && Math.random() < dt * 30) G.risco(p.x, p.y - 26, I.chicote.x, I.chicote.y, '#C98A4E', 3, true);
      while (falta > 0) { const d = Math.min(10, falta), nx = p.x + I.ux * d; let ny = p.y + I.uy * d; falta -= d;
        const noPiso = I.uy > 0 && cheio(nx, ny + 1);
        if (noPiso && !I.ricocheta) ny = p.y; // mirando para o chão, o bote desliza rente a ele
        const bateX = cheio(nx + Math.sign(I.ux) * 10, ny - 6) || cheio(nx + Math.sign(I.ux) * 10, ny - 46), bateY = cheio(nx, ny - 54) || (noPiso && I.ricocheta > 0);
        if (bateX || bateY) {
          if (I.ricocheta > 0) { // o zelote quica: muda de direção e corta de novo
            I.ricocheta--; if (bateX) I.ux = -I.ux; if (bateY) I.uy = -I.uy; I.atk.hits.clear(); p.face = Math.sign(I.ux) || p.face;
            G.efeito('corteAdaga', p.x, p.y, p.face, { vel: 1.4 }); G.fx.po(p.x - Math.sign(I.ux) * 10, p.y - 26, 8, '#C9D2C4'); G.tremor(4); sfx('swing'); break;
          }
          I.t = I.dur; break;
        }
        p.x = nx; p.y = ny; G.golpear({ x: p.x - I.larg / 2, y: p.y - 26 - I.larg / 2, w: I.larg, h: I.larg }, I.dano, I.atk); }
      if (Math.random() < dt * 60) G.parts.push({ x: p.x, y: p.y - 26 + rand(-10, 10), vx: -I.ux * 80, vy: -I.uy * 80, t: 0.25, max: 0.25, r: 2, cor: I.cor, g: 0 });
      if (I.arco && Math.random() < dt * 20) G.efeito('corteLuz', p.x + I.ux * 30, p.y, p.face);
      if (I.t >= I.dur) {
        p.vx *= 0.25; p.vy = Math.min(p.vy * 0.2, 120);
        if (I.pesado && p.chao) { G.tremor(10); G.efeito('baque', p.x, p.y); G.golpear({ x: p.x - 70, y: p.y - 80, w: 140, h: 90 }, I.dano * 0.4, novoAtk()); }
        else if (I.pesado) { G.efeito('corteLuz', p.x + p.face * 30, p.y, p.face); G.golpear({ x: p.x - 60, y: p.y - 90, w: 120, h: 100 }, I.dano * 0.35, novoAtk()); } // se o bote saiu do chão, fecha com um corte, sem baque
        if (I.arco) { G.efeito('critico', p.x + p.face * 30, p.y - 30, p.face); G.golpear({ x: p.x - 80, y: p.y - 110, w: 160, h: 120 }, I.dano * 0.5, novoAtk('cima')); G.tremor(6); }
        if (I.onda) { G.tiros.push({ semOleo: true, x: p.x + p.face * 20, y: p.y - 28, vx: I.ux * 900, vy: I.uy * 900, r: 16, r0: 16, amigo: true, vida: 0.55, max: 22, cor: '#FFF1BE', tipo: 'som', fura: true, dano: I.dano * 0.6 }); G.efeito('corteLuz', p.x + p.face * 30, p.y, p.face); sfx('swing'); }
        if (I.ecos) { const feridos = [...I.atk.hits].filter(e => e && e.hp > 0 && !e.morrendo && e.kind); // os outros dois cortes chegam depois que ele já passou
          for (let k = 1; k <= I.ecos; k++) setTimeout(() => { if (!G.running) return; for (const e of feridos) if (e.hp > 0 && !e.morrendo && G.inimigos.includes(e)) { G.efeito('corteAdaga', e.x, e.y - e.h / 2 + 26, k % 2 ? 1 : -1, { vel: 1.3 }); G.atingir(e, I.dano, e.x - I.ux, novoAtk()); } if (feridos.length) { sfx('swing'); G.tremor(4); } }, k * 130); }
        G.investidaMira = null;
        if (I.depois) { // o segundo traço do X
          G.investidaMira = { ...I, t: 0, dur: I.depois.dur, ux: I.depois.ux, uy: I.depois.uy, depois: null, atk: novoAtk() };
          G.efeito('corteAdaga', p.x + I.depois.ux * 60, p.y + I.depois.uy * 60, -p.face, { vel: 1.4 }); G.risco(p.x, p.y - 26, p.x + I.depois.ux * 200, p.y - 26 + I.depois.uy * 200, '#C79BFF', 5); sfx('swing');
        } else I.noFim?.();
      }
    }
  }
  if (Q) {
    Q.t += dt; p.inv = Math.max(p.inv, 0.3); p.atkCd = Math.max(p.atkCd, 0.2); p.vx = 0;
    if (Q.fase === 0) { p.vy = -900; p.y -= 1500 * dt; if (Q.t > 0.3) { Q.fase = 1; Q.t = 0; const topo = Math.floor((Q.y0 - 2) / (CH * T)) * CH * T; p.x = Q.tx; p.y = topo + 2 * T; p.vy = 0; // reaparece no alto, sobre o alvo
        for (let i = 0; i < 9; i++) setTimeout(() => { if (G.running) G.tiros.push({ semOleo: true, x: Q.tx + rand(-210, 210), y: topo + T, vx: rand(-40, 40), vy: 1050, r: 8, amigo: true, vida: 1.1, cor: '#E8C873', tipo: 'lanca', dano: Q.dano * 0.18, estoura: { raio: 44, dano: Q.dano * 0.1, fx: 'explosaoFogo' } }); }, i * 55); } }
    else if (Q.fase === 1) { p.vy = 0; if (Q.t > 0.22) { Q.fase = 2; Q.t = 0; sfx('boss'); } }
    else { p.vy = 2300; if (p.y < Q.y0 - 40) p.desce = 0.12; if ((p.chao && p.y >= Q.y0 - 40) || Q.t > 0.9) { G.quedaMira = null; p.vy = 0; G.tremor(18); G.clarao = 0.16; sfx('hit'); G.efeito('baque', p.x, p.y); G.efeito('explosaoFogo', p.x, p.y); G.fx.anel(p.x, p.y - 10, '#FFB05A', 220);
        G.golpear({ x: p.x - 150, y: p.y - 150, w: 300, h: 170 }, Q.dano, novoAtk('cima'));
        for (const s of [-1, 1]) for (let k = 1; k <= 3; k++) G.zonas.push({ tipo: 'col', x: p.x + s * k * 62, w: 50, aviso: 0.05 + k * 0.09, dur: 0.3, cor: '#FF8A2A', amigo: Q.dano * 0.2, y0: p.y - 150, y1: p.y + 20 }); } }
  }
  passoAgarre(G, dt);
  passoArremessados(G, dt, cheio);
}

// o laço: puxa o vício até a mão do juiz, gira por cima (ou à frente e para baixo, no ar) e solta com força
function passoAgarre(G, dt) {
  const A = G.agarre, p = G.p; if (!A) return;
  const e = A.e; if (!e || e.hp <= 0 || e.morrendo || e.sumiu || !G.inimigos.includes(e)) { G.agarre = null; return; }
  A.t += dt; e.stun = Math.max(e.stun, 0.5); e.vx = 0; e.vy = 0; p.atkCd = Math.max(p.atkCd, 0.15); p.vx *= 0.6; if (!p.chao) p.vy = Math.min(p.vy, 40);
  const mao = { x: p.x + p.face * 18, y: p.y - 30 }, dono = G.souDono();
  if ((A.risco -= dt) <= 0) { A.risco = 0.05; G.risco(mao.x, mao.y, e.x, e.y - e.h / 2, '#C98A4E', 3, true); }
  if (A.fase === 0) { // puxando
    const k = Math.min(1, A.t / 0.2), alvoX = mao.x + p.face * (e.w / 2 + 6), alvoY = p.y + (A.onde === 'ar' ? -8 : 0);
    if (dono) { e.x = A.x0 + (alvoX - A.x0) * k; e.y = A.y0 + (alvoY - A.y0) * k - Math.sin(k * Math.PI) * 30; }
    if (k >= 1) { A.fase = 1; A.t = 0; sfx('swing'); }
  } else { // o arco
    const k = Math.min(1, A.t / 0.22), r = 56;
    if (dono) {
      if (A.onde === 'ar') { const a = k * Math.PI * 0.75; e.x = p.x + A.destino * Math.sin(a) * r; e.y = p.y - 26 - Math.cos(a) * r + e.h / 2; } // gira à frente, de cima para baixo
      else { const a = Math.PI * k; e.x = p.x - A.destino * Math.cos(a) * r; e.y = p.y - 20 - Math.sin(a) * (r + 30) + e.h / 2; } // por cima da cabeça, para o outro lado
    }
    if (Math.random() < dt * 40) G.parts.push({ x: e.x, y: e.y - e.h / 2, vx: 0, vy: 0, t: 0.3, max: 0.3, r: 3, cor: '#E8C873', g: 0 });
    if (k >= 1) { // solta
      const vx = A.onde === 'ar' ? A.destino * 260 : A.destino * 760, vy = A.onde === 'ar' ? 1100 : -240;
      (G.arremessados = G.arremessados || []).push({ e, vx, vy, t: 0, dano: A.dano, hits: new Set([e]) });
      G.textoEm(e.x, e.y - e.h - 8, 'LÁ VAI!', '#FFE9A8', 13); G.tremor(5); sfx('swing'); G.efeito('estalo', e.x, e.y - e.h / 2 + 26, A.destino);
      G.agarre = null;
    }
  }
}
// o vício arremessado vira um projétil: derruba quem estiver no caminho e se esborracha no muro ou no chão
function passoArremessados(G, dt, cheio) {
  const L = G.arremessados; if (!L || !L.length) return;
  const dono = G.souDono();
  for (const a of L) {
    const e = a.e; a.t += dt;
    if (!e || e.hp <= 0 || e.morrendo || e.sumiu) { a.fim = true; continue; }
    e.stun = Math.max(e.stun, 0.4); a.vy += 1500 * dt;
    let bateu = false;
    if (dono) { const nx = e.x + a.vx * dt, ny = e.y + a.vy * dt;
      if (cheio(nx + Math.sign(a.vx) * e.w / 2, ny - e.h / 2)) bateu = true; else e.x = nx;
      if (a.vy > 0 && cheio(e.x, ny + 1)) bateu = true; else if (!bateu) e.y = ny;
      e.vx = 0; e.vy = 0;
    } else if (a.t > 0.5) bateu = true;
    if (Math.random() < dt * 40) G.parts.push({ x: e.x, y: e.y - e.h / 2, vx: -a.vx * 0.1, vy: -a.vy * 0.1, t: 0.3, max: 0.3, r: 3, cor: '#E8C873', g: 0 });
    for (const o of G.inimigos) if (!a.hits.has(o) && o.hp > 0 && !o.morrendo && toca(caixaDe(e), caixaDe(o))) { a.hits.add(o); G.atingir(o, a.dano * 0.7, e.x, novoAtk()); G.efeito('critico', o.x, o.y - o.h / 2, Math.sign(a.vx) || 1); G.tremor(4); }
    if (bateu || a.t > 1.2) { a.fim = true; G.tremor(9); G.efeito('baque', e.x, e.y); G.fx.po(e.x, e.y - e.h / 2, 14, '#C9D2C4'); sfx('hit');
      G.atingir(e, a.dano, e.x - (Math.sign(a.vx) || 1), novoAtk()); e.stun = Math.max(e.stun, 1.1);
      G.golpear({ x: e.x - 60, y: e.y - 70, w: 120, h: 80 }, a.dano * 0.35, novoAtk('lado', new Set([e]))); }
  }
  G.arremessados = L.filter(a => !a.fim);
}

// tiros especiais do ataque mira: o que quica nas paredes e o que estoura ao morrer. Devolve true se o tiro seguiu vivo por conta própria.
export function tiroEspecial(G, t, dt) {
  const N = G.N, cheio = (x, y) => solido(N, Math.floor(x / T), Math.floor(y / T));
  if (t.quica > 0 && cheio(t.x, t.y)) {
    const px = t.x - t.vx * dt, py = t.y - t.vy * dt, bx = cheio(t.x, py), by = cheio(px, t.y);
    if (bx || !by) t.vx *= -1; if (by || !bx) t.vy *= -1;
    t.x = px; t.y = py; t.quica--; t.hits = new Set(); t.r0 = Math.max(t.tipo === 'som' ? 10 : 5, (t.r0 || t.r) - 1); G.fx.anel(t.x, t.y, t.cor || '#BFF0F8', 60); sfx('block'); G.tremor(3);
    if (t.quica <= 0) t.fura = false;
    return true;
  }
  return false;
}
export function estourar(G, t) {
  const e = t.estoura; if (!e || t.estourou) return; t.estourou = true;
  G.efeito(e.fx, t.x, t.y + 10); G.tremor(5); sfx('hit');
  G.golpear({ x: t.x - e.raio, y: t.y - e.raio, w: e.raio * 2, h: e.raio * 2 }, e.dano, novoAtk());
}
