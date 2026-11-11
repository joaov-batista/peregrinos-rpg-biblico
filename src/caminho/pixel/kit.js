// Peças reaproveitáveis dos chefes e vícios em pixel art: leitura do estado (respiração, aviso, queda),
// mantos, braços, asas, olhos e caudas. Os desenhos olham para a direita; a luz vem de cima e da frente.
import { rampa, cor, TINTA } from './raster.js';

export const R = rampa, C = cor;
export const OX = 60, OY = 104;

// o que o corpo está fazendo, em termos de animação
export function est(b, Tm) {
  const t6 = Math.floor(Tm * 6), mov = b.mov, tipo = mov?.def?.tipo, caido = b.quebrado > 0 || b.tonto > 0;
  const prep = !caido && (b.tele > 0 || (!!mov && mov.t < 0.32)), ataca = !caido && !!mov && !prep;
  return { t6, resp: [0, 0, 1, 1][t6 % 4], tipo, caido, prep, ataca, noAr: !b.voa && b.chao === false, anda: Math.abs(b.vx) > 8, passo: Math.floor(Tm * 5) % 2, corre: Math.abs(b.vx) > 190,
    bat: Math.floor(Tm * 8) % 2, pisca: Math.floor(Tm * 14) % 2, f2: b.hp < b.max * 0.6, flu: Math.round(Math.sin(Tm * 2.2) * 2), pouso: b.pousou > 0 ? 3 : 0, onda: a => Math.sin(Tm * a) };
}

// manto em trapézio (ombros → barra), com dobras, luz na frente e barra rasgada
export function manto(s, x0, y0, l0, x1, y1, l1, Cr, rasgo = 3) {
  s.poli([[x0 - l0, y0], [x0 + l0, y0], [x1 + l1, y1], [x1 - l1, y1]], Cr[2]);
  const n = Math.max(1, y1 - y0);
  for (let y = y0; y <= y1; y++) {
    const k = (y - y0) / n, cx = x0 + (x1 - x0) * k, l = l0 + (l1 - l0) * k;
    s.px(cx - l, y, Cr[0]); s.px(cx - l + 1, y, Cr[1]); s.px(cx - l + 2, y, Cr[1]); s.px(cx + l, y, Cr[3]); s.px(cx + l - 1, y, Cr[3]);
    for (let d = -2; d <= 2; d++) if (d && k > 0.25) s.px(cx + d * l * 0.36 + (d < 0 ? 1 : 0), y, d < 0 ? Cr[1] : (y % 3 ? Cr[2] : Cr[3]));
  }
  if (rasgo) for (let x = Math.round(x1 - l1); x <= x1 + l1; x++) { const h = ((x * 7 + 3) % 5 < 2 ? rasgo : (x * 3) % 4 === 0 ? rasgo - 1 : 0); if (h > 0) s.ret(x, y1 + 1, 1, h, Cr[x < x1 ? 1 : 2]); }
}

// braço em dois segmentos (ombro → cotovelo → mão); dobra > 0 joga o cotovelo para fora
export function braco(s, ax, ay, bx, by, g, Ca, Cb = Ca, dobra = 3, sd = 1) {
  const mx = (ax + bx) / 2 + sd * dobra, my = (ay + by) / 2 + Math.abs(dobra) * 0.6;
  s.membro(ax, ay, mx, my, g, Ca); s.membro(mx, my, bx, by, Math.max(2, g - 1), Cb);
  return { x: Math.round(bx), y: Math.round(by) };
}

export function olhos(s, x, y, d, c, alto = 1) { s.ret(x, y, 1, alto, c); s.ret(x + d, y, 1, alto, c); }

// asa: um braço ósseo e "dedos" que abrem em leque; membrana (ou penas) entre eles
export function asa(s, x, y, sd, comp, abre, Cr, dedos = 4, pena = false) {
  const px = x + sd * comp * 0.45, py = y - comp * (0.35 + abre * 0.35);
  for (let i = 0; i < dedos; i++) {
    const a = (0.15 + i / (dedos - 1) * (0.9 + abre * 0.5)) * Math.PI / 2 + (1 - abre) * 0.5, fx = px + sd * Math.cos(a) * comp * (0.9 - i * 0.08), fy = py + Math.sin(a) * comp * (0.75 + i * 0.07);
    if (i) { const a0 = (0.15 + (i - 1) / (dedos - 1) * (0.9 + abre * 0.5)) * Math.PI / 2 + (1 - abre) * 0.5, gx = px + sd * Math.cos(a0) * comp * (0.9 - (i - 1) * 0.08), gy = py + Math.sin(a0) * comp * (0.75 + (i - 1) * 0.07); s.poli([[px, py], [gx, gy], [(gx + fx) / 2 - sd * 2, (gy + fy) / 2 - (pena ? -2 : 3)], [fx, fy]], Cr[i % 2 ? 1 : 2]); }
    s.linha(px, py, fx, fy, 1, Cr[pena ? 3 : 0]);
  }
  s.membro(x, y, px, py, 3, Cr);
}

// cauda ou tentáculo ondulante, afinando até a ponta
export function cauda(s, x, y, comp, dir, Tm, g, Cr, amp = 4, vel = 3, sobe = 0) {
  let px = x, py = y;
  for (let i = 1; i <= comp; i++) { const k = i / comp, nx = x + dir * i * 2, ny = y + Math.sin(Tm * vel - i * 0.55) * amp * k + sobe * i; s.membro(px, py, nx, ny, Math.max(1, Math.round(g * (1 - k * 0.8))), Cr, i % 2 === 0); px = nx; py = ny; }
  return { x: px, y: py };
}

// chamas ou fiapos que sobem de uma linha (cabelo de fogo, fumaça, algas)
export function fiapos(s, x0, x1, y, alt, Tm, Cr, passo = 3) {
  for (let x = x0; x <= x1; x += passo) { const h = alt * (0.5 + 0.5 * Math.abs(Math.sin(x * 1.7 + Tm * 5))), dx = Math.round(Math.sin(Tm * 4 + x) * 1.5); s.linha(x, y, x + dx, y - h, 2, Cr[2]); s.px(x + dx, y - h - 1, Cr[4]); s.px(x, y - 1, Cr[3]); }
}

export { TINTA };
