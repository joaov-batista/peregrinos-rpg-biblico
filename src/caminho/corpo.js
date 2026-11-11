// Corpo contra o mapa de tiles. x = centro, y = pés. Cada eixo é resolvido separado.
import { T, VAZIO, SOLIDO, PONTE, ESPINHO, OCULTO, FALSA, PORTAO, tileEm } from './nivel.js';

export function solido(N, tx, ty) {
  const t = tileEm(N, tx, ty);
  if (t === SOLIDO) return true;
  if (t === VAZIO || t === PONTE || t === ESPINHO) return false;
  const i = ty * N.w + tx;
  if (t === OCULTO) return (N.revel?.[i] || 0) > 0;
  if (t === FALSA) return !N.desfeita?.has(i);
  if (t === PORTAO) return !N.portaAberta;
  return false;
}

export function mover(N, b, dt) {
  const hw = b.w / 2;
  b.parede = 0;
  // horizontal
  let nx = b.x + b.vx * dt;
  if (b.vx) {
    const lado = Math.sign(b.vx), borda = nx + lado * hw, tx = Math.floor(borda / T);
    const y0 = Math.floor((b.y - b.h + 1) / T), y1 = Math.floor((b.y - 1) / T);
    for (let ty = y0; ty <= y1; ty++) if (solido(N, tx, ty)) {
      nx = lado > 0 ? tx * T - hw - 0.01 : (tx + 1) * T + hw + 0.01; b.parede = lado; b.vx = 0; break;
    }
  }
  b.x = nx;
  // vertical
  const antes = b.y; let ny = b.y + b.vy * dt;
  const x0 = Math.floor((b.x - hw + 1) / T), x1 = Math.floor((b.x + hw - 1) / T);
  b.chao = false; b.naPonte = false;
  if (b.vy >= 0) {
    const ty = Math.floor(ny / T);
    for (let tx = x0; tx <= x1; tx++) {
      const s = solido(N, tx, ty), ponte = !s && tileEm(N, tx, ty) === PONTE && !(b.desce > 0) && antes <= ty * T + 0.5;
      if (s || ponte) { ny = ty * T; b.vy = 0; b.chao = true; if (!s) b.naPonte = true; else { b.naPonte = false; break; } }
    }
  } else {
    const ty = Math.floor((ny - b.h) / T);
    for (let tx = x0; tx <= x1; tx++) if (solido(N, tx, ty)) { ny = (ty + 1) * T + b.h + 0.01; b.vy = 0; b.teto = true; break; }
  }
  b.y = ny;
}

// há parede colada no lado indicado? (para deslizar e pular da parede)
export function paredeAoLado(N, b, lado) {
  const tx = Math.floor((b.x + lado * (b.w / 2 + 3)) / T);
  return solido(N, tx, Math.floor((b.y - b.h * 0.35) / T)) && solido(N, tx, Math.floor((b.y - b.h * 0.8) / T));
}

export function tocaEspinho(N, b) {
  const x0 = Math.floor((b.x - b.w / 2 + 4) / T), x1 = Math.floor((b.x + b.w / 2 - 4) / T);
  const y0 = Math.floor((b.y - b.h + 6) / T), y1 = Math.floor((b.y - 3) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileEm(N, tx, ty) === ESPINHO) return true;
  return false;
}

export const chaoAbaixo = (N, x, y) => { const tx = Math.floor(x / T), ty = Math.floor((y + 2) / T); return solido(N, tx, ty) || tileEm(N, tx, ty) === PONTE; };
