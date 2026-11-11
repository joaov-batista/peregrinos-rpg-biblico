// Efeitos de combate em pixel art, feitos com a biblioteca PixelFX (https://pixelfx.io, MIT — ver src/vendor/pixelfx).
// Cada efeito é desenhado pela biblioteca uma única vez, quadro a quadro, numa folha de sprites; durante o jogo
// só copiamos quadros prontos (custo quase zero, importante no celular). As paletas são as do Caminho.
import { createFrame, clearFrame, createFx, composite } from '../../vendor/pixelfx/core/index.js';
import * as swordSlash from '../../vendor/pixelfx/fx/melee/sword-slash.js';
import * as uppercut from '../../vendor/pixelfx/fx/melee/uppercut.js';
import * as thrust from '../../vendor/pixelfx/fx/melee/thrust.js';
import * as spinSlash from '../../vendor/pixelfx/fx/melee/spin-slash.js';
import * as hitSpark from '../../vendor/pixelfx/fx/impacts/hit-spark.js';
import * as critHit from '../../vendor/pixelfx/fx/impacts/crit-hit.js';
import * as parry from '../../vendor/pixelfx/fx/impacts/parry.js';
import * as groundSlam from '../../vendor/pixelfx/fx/impacts/ground-slam.js';
import * as heal from '../../vendor/pixelfx/fx/holy/heal.js';
import * as holyPillar from '../../vendor/pixelfx/fx/holy/holy-pillar.js';
import * as poof from '../../vendor/pixelfx/fx/spawn/poof.js';
import * as collect from '../../vendor/pixelfx/fx/pickups/collect-burst.js';
import { PX } from './raster.js';

const ACO = ['#1d2742', '#2f4a7a', '#4f7fb0', '#86b8d8', '#c3dcea', '#eef6fb', '#ffffff'];
const OURO = ['#4a2a12', '#8a4f1c', '#c9862b', '#f0b94a', '#ffe08a', '#fff3c4', '#ffffff'];
const BRASA = ['#4a1712', '#c9281f', '#f2561d', '#ff8a2a', '#ffe26b', '#fff3a6', '#ffffff'];
// nome → [módulo, opções, quadros por segundo]. "dur" corta o efeito (o golpe do jogo dura 0,22 s).
const RECEITAS = {
  corte: [swordSlash, { palette: ACO, radius: 30, sparks: OURO.slice(3) }, 30, 0.34],
  corteLuz: [swordSlash, { palette: OURO, radius: 32, sparks: OURO.slice(3) }, 30, 0.34],
  corteCurto: [swordSlash, { palette: ACO, radius: 22, sparks: OURO.slice(3) }, 30, 0.3],
  corteCima: [uppercut, { palette: ACO }, 30, 0.42],
  estocada: [thrust, { palette: ACO, reach: 44 }, 30, 0.34],
  giro: [spinSlash, { palette: OURO, radius: 44 }, 30, 0.5],
  faisca: [hitSpark, { palette: BRASA, height: 0 }, 30, 0.4],
  faiscaLuz: [hitSpark, { palette: OURO, height: 0 }, 30, 0.4],
  critico: [critHit, { palette: OURO, height: 0 }, 30, 0.6],
  vigilia: [parry, { palette: OURO, height: 0 }, 30, 0.6],
  baque: [groundSlam, {}, 24, 1.1],
  cura: [heal, { palette: ['#3a2a10', '#7a5a1c', '#c9962b', '#f0c24a', '#ffe08a', '#fff3c4', '#fffbe6', '#ffffff'] }, 24, 1.3],
  pilar: [holyPillar, {}, 24, 1.6],
  sumico: [poof, {}, 24, 0.6],
  coleta: [collect, {}, 24, 0.6]
};
const folhas = new Map();

function assar(nome) {
  const [mod, opts, fps, corte] = RECEITAS[nome], m = mod.meta, [w, h] = m.size, [ox, oy] = m.origin;
  const dur = Math.min(corte || m.duration, m.duration), n = Math.max(1, Math.ceil(dur * fps));
  const cv = document.createElement('canvas'); cv.width = w * n; cv.height = h;
  const g = cv.getContext('2d'), frame = createFrame(w, h, -ox, -oy), img = g.createImageData(w, h), fx = createFx(mod, { ...opts });
  for (let i = 0; i < n; i++) { fx.update(1 / fps); fx.draw(clearFrame(frame)); composite(frame, img.data, null); g.putImageData(img, i * w, 0); }
  const f = { cv, n, fps, w, h, ox, oy };
  folhas.set(nome, f); return f;
}
export const folha = nome => folhas.get(nome) || (RECEITAS[nome] ? assar(nome) : null);

// prepara as folhas aos poucos, sem travar a entrada no jogo
export function aquecerEfeitos() {
  const nomes = Object.keys(RECEITAS).filter(n => !folhas.has(n));
  const passo = () => { const n = nomes.shift(); if (!n) return; try { assar(n); } catch (e) { console.warn('[pixelfx]', n, e); } setTimeout(passo, 30); };
  setTimeout(passo, 200);
}

// efeitos vivos: { f, x, y (mundo), vira, t, ang }
export function soltar(lista, nome, x, y, vira = 1, o = {}) { const f = folha(nome); if (f && lista.length < 40) lista.push({ f, x, y, vira, t: 0, gruda: o.gruda || null, dx: o.dx || 0, dy: o.dy || 0, atras: !!o.atras, vel: o.vel || 1 }); }
export function atualizarEfeitos(lista, dt) { for (const e of lista) e.t += dt * e.vel; for (let i = lista.length - 1; i >= 0; i--) if (lista[i].t * lista[i].f.fps >= lista[i].f.n) lista.splice(i, 1); }
export function pintarEfeitos(g, lista, cx, cy, atras) {
  for (const e of lista) {
    if (e.atras !== atras) continue;
    const f = e.f, i = Math.min(f.n - 1, Math.floor(e.t * f.fps)), wx = e.gruda ? e.gruda.x + e.dx : e.x, wy = e.gruda ? e.gruda.y + e.dy : e.y, x = Math.round(wx / PX - cx), y = Math.round(wy / PX - cy);
    if (e.vira < 0) { g.save(); g.translate(x, y); g.scale(-1, 1); g.drawImage(f.cv, i * f.w, 0, f.w, f.h, -f.ox, -f.oy, f.w, f.h); g.restore(); }
    else g.drawImage(f.cv, i * f.w, 0, f.w, f.h, x - f.ox, y - f.oy, f.w, f.h);
  }
}
