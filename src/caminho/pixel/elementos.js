// Efeitos por elemento: cada chefe golpeia com a sua matéria. Fogo é fogo (chamas que sobem), raio é raio
// (zigue-zague com clarão), água é água (gêiser, onda, espuma), pedra cai e levanta poeira, moeda chove, sombra escorre.
// O aviso também tem a cara do elemento: brasas no chão antes da coluna de fogo, faíscas antes do raio,
// a sombra que cresce no chão antes da pedra. Tudo em retângulos de pixel, no mesmo tamanho do resto do jogo.
export const ELEMENTO_DO_CHEFE = {
  mamom: 'moedas', procrastinacao: 'areia', mentira: 'sombra', imoralidade: 'veneno', satanas: 'fogo',
  fuga: 'vento', pavor: 'raio', desespero: 'agua', violencia: 'pedra', ressentimento: 'fogo',
  encantadores: 'magia', jugo: 'pedra', babilonia: 'pedra', fera: 'sombra', soberba: 'luz',
  golias: 'pedra', behemote: 'pedra', leviata: 'agua'
};
const PAL = {
  fogo: ['#5A1410', '#C9281F', '#FF6A1F', '#FFB53A', '#FFF1A8'], raio: ['#1E2A5A', '#5A7AE8', '#9FC8FF', '#E8F4FF', '#FFFFFF'],
  agua: ['#0C2A3A', '#1F6F8B', '#3FA8C8', '#9FE6F0', '#F0FCFF'], pedra: ['#2A2420', '#5A4A3C', '#8A7660', '#B8A88E', '#E0D4BC'],
  moedas: ['#5A3A0C', '#A8741C', '#D9A63C', '#FFD23F', '#FFF6C8'], sombra: ['#05030A', '#1E1230', '#3E2A5E', '#7A5AA8', '#C9A6FF'],
  areia: ['#4A3820', '#8A6A3C', '#C9A06A', '#E8C88A', '#FFF0C8'], veneno: ['#1A2A10', '#3E6A2A', '#6FBF4A', '#B8F08A', '#F0FFD8'],
  vento: ['#2A3A44', '#5A7A8A', '#9FC0CC', '#D8EEF2', '#FFFFFF'], magia: ['#1E1040', '#5A2E9E', '#9A6AE8', '#D8B8FF', '#FFF0FF'],
  luz: ['#5A4A1C', '#C9A63C', '#F2D06A', '#FFF0B8', '#FFFFFF'], som: ['#0E3A44', '#3FA8C8', '#9FE6F0', '#DFFBFF', '#FFFFFF']
};
export const corDoElemento = el => PAL[el]?.[3];
const ruido = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const bola = (g, c, x, y, r) => { for (let yy = -r; yy <= r; yy++) { const m = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy))); px(g, c, x - m, y + yy, m * 2 + 1, 1); } };
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };

// coluna (vertical): aviso (k de 0 a 1) ou golpe ativo
function coluna(g, el, x, y, w, h, ativa, k, Tm) {
  const P = PAL[el], f = Math.floor(Tm * 16), base = y + h;
  if (!ativa) { // o aviso: no chão, o que vai acontecer
    const a = 0.35 + k * 0.6;
    if (el === 'fogo' || el === 'ressentimento') { for (let i = 0; i < w; i += 2) { const q = ruido(i, f); if (q < 0.3 + k * 0.5) px(g, P[q < 0.2 ? 3 : 2], x + i, base - 2 - Math.round(q * 3 * k), 1, 2); } for (let i = 0; i < 3 + k * 6; i++) px(g, P[3], x + ruido(i, 9) * w, base - ((Tm * 30 + i * 13) % (12 + k * 30)), 1, 1); }
    else if (el === 'raio') { for (let i = 0; i < 4 + k * 8; i++) { const sx = x + ruido(i, f) * w; px(g, ruido(f, i) < 0.5 ? P[4] : P[2], sx, y + ruido(i, f + 1) * 12, 1, 2); } g.globalAlpha = a * 0.6; px(g, P[2], x, base - 1, w, 1); g.globalAlpha = 1; for (let i = 0; i < w; i += 3) if (ruido(i, f) < k) px(g, P[3], x + i, base - 2, 1, 1); }
    else if (el === 'pedra' || el === 'moedas') { const lg = Math.round(w * (0.4 + k * 0.6)); g.globalAlpha = 0.25 + k * 0.4; px(g, '#000', x + (w - lg) / 2, base - 2, lg, 2); g.globalAlpha = 1; for (let i = 0; i < 3; i++) px(g, P[2], x + ruido(i, 3) * w, y + ((Tm * 70 + i * 40) % Math.max(10, h * k)), el === 'moedas' ? 2 : 1, 2); }
    else if (el === 'agua') { for (let i = 0; i < 3 + k * 6; i++) { const bx = x + ruido(i, 5) * w, by = base - ((Tm * 24 + i * 7) % (6 + k * 12)); px(g, P[3], bx, by, 1, 1); } px(g, P[2], x, base - 1, w, 1); }
    else { g.globalAlpha = 0.2 + k * 0.5; for (let i = 0; i < w; i += 2) px(g, P[2 + (i + f) % 2], x + i, base - 1 - Math.round(ruido(i, f) * 4 * k), 1, 2); g.globalAlpha = 1; for (let i = 0; i < 4; i++) px(g, P[3], x + ruido(i, f) * w, base - 6 - ruido(f, i) * 20 * k, 1, 1); }
    return;
  }
  // o golpe
  if (el === 'fogo') { // chamas que sobem: línguas de fogo de alturas diferentes, mais claras no miolo
    for (let i = 0; i < w; i++) { const meio = 1 - Math.abs(i - w / 2) / (w / 2), alt = h * (0.55 + 0.45 * meio) * (0.85 + 0.15 * Math.sin(Tm * 18 + i * 1.7)); for (let yy = 0; yy < alt; yy += 2) { const q = yy / alt; px(g, P[q > 0.85 ? 1 : q > 0.6 ? 2 : meio > 0.6 && q < 0.4 ? 4 : 3], x + i, base - yy - 2, 1, 2); } }
    for (let i = 0; i < 8; i++) px(g, P[4], x + ruido(i, f) * w, base - h - ((Tm * 60 + i * 9) % 20), 1, 1);
  } else if (el === 'raio') { // o raio: um zigue-zague do alto ao chão, com galhos, e o clarão no chão
    g.globalAlpha = 0.18; px(g, P[2], x - 4, y, w + 8, h); g.globalAlpha = 1;
    let cx = x + w / 2; const segs = Math.max(6, Math.round(h / 8));
    for (let s = 0; s < segs; s++) { const y0 = y + s * h / segs, nx = x + w / 2 + (ruido(s, f) - 0.5) * w * 0.8; const passos = Math.max(1, Math.round(h / segs)); for (let t = 0; t <= passos; t++) { const xx = cx + (nx - cx) * t / passos, yy = y0 + t; px(g, P[1], xx - 2, yy, 5, 1); px(g, P[3], xx - 1, yy, 3, 1); px(g, P[4], xx, yy, 1, 1); } if (ruido(f, s) < 0.3) for (let t = 0; t < 6; t++) px(g, P[3], nx + t * (ruido(s, 7) < 0.5 ? 1 : -1), y0 + t * 0.8, 1, 1); cx = nx; }
    px(g, P[4], x - 2, base - 2, w + 4, 2); for (let i = 0; i < 6; i++) px(g, P[3], x + ruido(i, f) * w, base - 3 - ruido(f, i) * 6, 1, 1);
  } else if (el === 'agua') { // gêiser: coluna d'água com borda clara, espuma no alto e gotas
    for (let i = 0; i < w; i++) { const on = Math.sin(Tm * 14 + i * 0.6) * 2; for (let yy = 0; yy < h; yy += 2) px(g, P[i < 2 || i > w - 3 ? 3 : (yy + f + i) % 6 < 2 ? 2 : 1], x + i + (yy % 4 ? 0 : on * 0.3), base - yy - 2, 1, 2); }
    for (let i = 0; i < w + 6; i += 2) px(g, P[4], x - 3 + i, base - h - 2 + Math.round(Math.sin(Tm * 10 + i) * 2), 2, 2);
    for (let i = 0; i < 8; i++) { const q = (Tm * 2 + i / 8) % 1; px(g, P[3], x + w / 2 + (ruido(i, 1) - 0.5) * w * 2 * q, base - h - 4 + q * q * 30, 1, 2); }
  } else if (el === 'pedra') { // pedras caindo e poeira no chão
    for (let i = 0; i < 7; i++) { const q = (Tm * 2.4 + i / 7) % 1, s = 7 + Math.round(ruido(i, 4) * 6), rx = x + ruido(i, 2) * Math.max(1, w - s), ry = y + q * h; px(g, '#0B0E16', rx - 1, ry - 1, s + 2, s + 2); px(g, P[2], rx, ry, s, s); px(g, P[3], rx, ry, s - 1, 1); px(g, P[1], rx + s - 1, ry + 1, 1, s - 1); }
    g.globalAlpha = 0.6; for (let i = 0; i < 10; i++) px(g, P[3], x - 4 + ruido(i, f) * (w + 8), base - 2 - ruido(f, i) * 8, 2, 2); g.globalAlpha = 1;
  } else if (el === 'moedas') { // chuva de moedas que giram e brilham
    for (let i = 0; i < 14; i++) { const q = (Tm * 2.8 + i / 14) % 1, cx2 = x + 4 + ruido(i, 3) * (w - 8), cy2 = y + q * h, lg = [6, 4, 2, 4][(f + i) % 4]; px(g, '#2A1A06', cx2 - lg / 2 - 1, cy2 - 1, lg + 2, 8); px(g, P[3], cx2 - lg / 2, cy2, lg, 6); px(g, P[4], cx2 - lg / 2, cy2, 1, 2); if (lg > 2) px(g, P[2], cx2 - lg / 2 + 1, cy2 + 2, lg - 2, 1); }
    for (let i = 0; i < 6; i++) px(g, P[2], x + ruido(i, 8) * w, base - 2 - (i % 3), 3, 2);
  } else if (el === 'areia') { /* ampulheta: um fio de areia que cai do alto e um monte que cresce no chão */
    const meio = x + w / 2; for (let yy = 0; yy < h; yy += 2) { const lg = 3 + Math.round(ruido(yy, f) * 3); px(g, P[(yy + f) % 4 < 2 ? 2 : 3], meio - lg / 2, y + yy, lg, 2); }
    for (let i = 0; i < 24; i++) px(g, P[3], meio + (ruido(i, 3) - 0.5) * w * 0.5, y + ((Tm * 140 + i * 17) % h), 1, 2);
    for (let i = 0; i < w; i++) { const alt = Math.round(h * 0.18 * Math.max(0, 1 - Math.abs(i - w / 2) / (w / 2))); for (let yy = 0; yy < alt; yy += 2) px(g, P[yy > alt - 3 ? 3 : 2], x + i, base - yy - 2, 1, 2); }
  } else if (el === 'sombra' || el === 'magia' || el === 'veneno') { // escorre do alto: fios escuros, olhos (sombra), runas (magia), gotas (veneno), grãos (areia)
    for (let i = 0; i < w; i += 2) { const comp = h * (0.6 + 0.4 * ruido(i, Math.floor(Tm * 4))); for (let yy = 0; yy < comp; yy += 2) px(g, P[yy / comp > 0.7 ? 1 : 2 + ((i + yy + f) % 3 === 0 ? 1 : 0)], x + i + Math.round(Math.sin(Tm * 6 + yy * 0.2 + i) * 1), y + yy, 2, 2); }
    if (el === 'sombra') { px(g, P[4], x + w / 2 - 4, y + h * 0.3, 2, 2); px(g, P[4], x + w / 2 + 2, y + h * 0.3, 2, 2); }
    if (el === 'magia') for (let i = 0; i < 4; i++) { const ry = y + ((Tm * 40 + i * 20) % h); px(g, P[4], x + w / 2 - 2, ry, 4, 1); px(g, P[4], x + w / 2, ry - 2, 1, 4); }
    px(g, P[3], x - 2, base - 2, w + 4, 2);
  } else if (el === 'vento' || el === 'som') { // redemoinho: linhas curvas que giram subindo
    for (let yy = 0; yy < h; yy += 3) { const r = w / 2 * (0.4 + 0.6 * yy / h), a = Tm * 10 - yy * 0.2; px(g, P[3], x + w / 2 + Math.cos(a) * r, base - yy, 3, 1); px(g, P[2], x + w / 2 + Math.cos(a + 3.1) * r, base - yy, 2, 1); }
  } else { // luz: feixe forte com miolo branco
    for (let i = 0; i < w; i++) { const m = 1 - Math.abs(i - w / 2) / (w / 2); g.globalAlpha = 0.15 + 0.75 * m * m; px(g, m > 0.7 ? P[4] : m > 0.4 ? P[3] : P[2], x + i, y, 1, h); } g.globalAlpha = 1;
    px(g, P[4], x - 3, base - 2, w + 6, 2); for (let i = 0; i < 5; i++) { const ry = y + ((Tm * 90 + i * h / 5) % h); px(g, P[4], x + w / 2 - 6, ry, 12, 1); }
    for (let i = 0; i < 6; i++) px(g, P[4], x + ruido(i, f) * w, y + ruido(f, i) * h, 1, 1);
  }
}
// faixa (horizontal): muralha de fogo, onda, rajada de vento, chão que treme
function faixa(g, el, x, y, w, h, ativa, k, Tm) {
  const P = PAL[el], f = Math.floor(Tm * 16);
  if (!ativa) { g.globalAlpha = 0.25 + k * 0.5; for (let i = 0; i < w; i += 3) px(g, P[2 + ((i + f) % 2)], x + i, y + h - 2 - Math.round(ruido(i, f) * 3 * k), 2, 2); g.globalAlpha = 1; return; }
  if (el === 'agua') { for (let i = 0; i < w; i++) { const top = Math.round(h * 0.25 + Math.sin(Tm * 9 - i * 0.12) * h * 0.2); for (let yy = top; yy < h; yy += 2) px(g, P[yy < top + 2 ? 4 : yy < top + 5 ? 3 : 1 + ((i + yy) % 5 === 0 ? 1 : 0)], x + i, y + yy, 1, 2); } return; }
  if (el === 'vento' || el === 'som') { for (let r = 0; r < h; r += 4) for (let i = 0; i < w; i += 14) { const xx = x + ((i + Tm * 220 + r * 9) % w); px(g, P[3], xx, y + r, 8, 1); px(g, P[4], xx + 8, y + r - 1, 2, 1); } return; }
  if (el === 'fogo') { for (let i = 0; i < w; i++) { const alt = h * (0.5 + 0.5 * Math.abs(Math.sin(Tm * 12 + i * 0.35))); for (let yy = 0; yy < alt; yy += 2) { const q = yy / alt; px(g, P[q > 0.75 ? 1 : q > 0.45 ? 2 : 3], x + i, y + h - yy - 2, 1, 2); } } return; }
  if (el === 'raio') { /* arcos elétricos que atravessam a faixa, com brilho em volta */
    g.globalAlpha = 0.16; px(g, P[2], x, y, w, h); g.globalAlpha = 1;
    for (let a = 0; a < 3; a++) { let yy = y + h * (0.25 + a * 0.25); for (let i = 0; i < w; i += 3) { const ny = y + h * (0.25 + a * 0.25) + (ruido(i + a * 50, f) - 0.5) * h * 0.4; const d = ny - yy; for (let t = 0; t < 3; t++) { const qy = yy + d * t / 3; px(g, P[1], x + i + t, qy - 1, 1, 3); px(g, P[a === 1 ? 4 : 3], x + i + t, qy, 1, 1); } yy = ny; } }
    px(g, P[4], x, y + h - 2, w, 2); return; }
  if (el === 'pedra') { /* o chão racha e pontas de rocha saem dele */
    for (let i = 0; i < w; i += 12) { const alt = h * (0.45 + 0.55 * ruido(i, 31)), lg = 10 + Math.round(ruido(i, 9) * 4); for (let yy = 0; yy < alt; yy++) { const meia = Math.max(1, Math.round(lg / 2 * (1 - yy / alt))), cx = x + i + 6; px(g, '#0B0E16', cx - meia - 1, y + h - yy - 1, meia * 2 + 2, 1); px(g, P[yy > alt * 0.7 ? 3 : 2], cx - meia, y + h - yy - 1, meia * 2, 1); px(g, P[1], cx + meia - 2, y + h - yy - 1, 2, 1); } }
    g.globalAlpha = 0.55; for (let i = 0; i < 14; i++) px(g, P[3], x + ruido(i, f) * w, y + h - 3 - ruido(f, i) * h * 0.5, 2, 2); g.globalAlpha = 1; return; }
  if (el === 'moedas') { /* um monte de moedas que sobe e escorre */
    for (let i = 0; i < w; i += 5) { const alt = h * (0.35 + 0.6 * Math.sin(Math.PI * i / w)) * (0.9 + 0.1 * ruido(i, 2)); for (let yy = 0; yy < alt; yy += 3) { const q = ruido(i, yy); px(g, '#2A1A06', x + i, y + h - yy - 3, 6, 3); px(g, P[q < 0.3 ? 2 : 3], x + i + 1, y + h - yy - 3, 4, 2); if (q > 0.9) px(g, P[4], x + i + 1, y + h - yy - 3, 1, 1); } }
    for (let i = 0; i < 6; i++) { const q = (Tm * 1.5 + i / 6) % 1; px(g, P[4], x + ruido(i, 4) * w, y + h * (0.3 - q * 0.3), 1, 1); } return; }
  if (el === 'luz') { for (let yy = 0; yy < h; yy++) { const m = 1 - Math.abs(yy - h / 2) / (h / 2); g.globalAlpha = 0.15 + 0.75 * m * m; px(g, m > 0.7 ? P[4] : m > 0.4 ? P[3] : P[2], x, y + yy, w, 1); } g.globalAlpha = 1; for (let i = 0; i < 8; i++) px(g, P[4], x + ((Tm * 200 + i * w / 8) % w), y + h / 2 - 4, 1, 8); return; }
  /* sombra, magia, veneno, areia: tentáculos (ou fumaça, ou grãos) que sobem do chão e ondulam */
  for (let i = 0; i < w; i += 6) { const alt = h * (0.5 + 0.5 * ruido(i, 17)), fase = i * 0.7 + Tm * 5; for (let yy = 0; yy < alt; yy += 2) { const q = yy / alt, lg = Math.max(1, Math.round(4 * (1 - q))), dx = Math.sin(fase + yy * 0.12) * 3 * q; px(g, P[0], x + i + dx - 1, y + h - yy - 2, lg + 2, 2); px(g, P[q > 0.8 ? 3 : 2], x + i + dx, y + h - yy - 2, lg, 2); } }
  if (el === 'veneno') for (let i = 0; i < 8; i++) { const q = (Tm * 1.2 + i / 8) % 1; px(g, P[3], x + ruido(i, 6) * w, y + h - q * h, 2, 2); }
  if (el === 'areia') for (let i = 0; i < 30; i++) px(g, P[3], x + ((ruido(i, 1) * w + Tm * 160) % w), y + ruido(i, 2) * h, 2, 1);
  if (el === 'sombra') for (let i = 0; i < 3; i++) { const ex = x + ruido(i, 12) * (w - 8), ey = y + h * 0.5 + ruido(i, 13) * h * 0.3; if ((f + i * 5) % 30 > 3) { px(g, P[4], ex, ey, 2, 1); px(g, P[4], ex + 4, ey, 2, 1); } }
  px(g, P[1], x, y + h - 2, w, 2);
}
export function zonaElemento(g, el, z, x, y, w, h, ativa, k, Tm) {
  if (!PAL[el]) return false;
  if (z.tipo === 'col') { coluna(g, el, x, y, w, h, ativa, k, Tm); return true; }
  if (z.tipo === 'faixa') { faixa(g, el, x, y, w, h, ativa, k, Tm); return true; }
  return false;
}
// os dardos do chefe na matéria dele
export function tiroElemento(g, el, t, x, y, r, Tm) {
  const P = PAL[el]; if (!P || el === 'fogo' || el === 'ressentimento') return false; const f = Math.floor(Tm * 18), vel = Math.hypot(t.vx, t.vy) || 1, ux = t.vx / vel, uy = t.vy / vel;
  for (let k = 5; k >= 1; k--) { g.globalAlpha = 0.5 - k * 0.08; px(g, P[2], x - ux * k * 2.5 - r / 2, y - uy * k * 2.5 - r / 2, r, r); } g.globalAlpha = 1;
  if (el === 'raio') { /* uma fagulha: núcleo branco e quatro raios curtos que tremem */ bola(g, P[1], x, y, r + 1); bola(g, P[3], x, y, r - 1); bola(g, P[4], x, y, Math.max(1, r - 3)); for (let i = 0; i < 4; i++) { const a = i * 1.57 + ruido(i, f) * 0.8; for (let t = r; t < r + 5; t++) px(g, P[3], x + Math.cos(a) * t + (t % 2), y + Math.sin(a) * t, 1, 1); } return true; }
  if (el === 'agua') { /* gota: redonda atrás, pontuda na frente */ bola(g, P[1], x, y, r + 1); bola(g, P[2], x, y, r); for (let t = 0; t < r; t++) px(g, P[2], x + ux * (r + t) - (r - t) / 3, y + uy * (r + t) - (r - t) / 3, Math.max(1, (r - t) / 1.5), Math.max(1, (r - t) / 1.5)); px(g, P[4], x - r / 2, y - r / 2, 2, 2); return true; }
  if (el === 'pedra') { px(g, '#0B0E16', x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2); px(g, P[2], x - r, y - r, r * 2, r * 2); px(g, P[3], x - r, y - r, r * 2 - 1, 1); px(g, P[1], x + r - 1, y - r + 1, 1, r * 2 - 1); px(g, P[1], x - r + 2, y, 2, 1); return true; }
  if (el === 'moedas') { const lg = [r, r * 0.7, 1, r * 0.7][f % 4]; for (let yy = -r; yy <= r; yy++) { const m = Math.round(lg * Math.sqrt(Math.max(0, 1 - (yy / r) ** 2))); px(g, '#2A1A06', x - m - 1, y + yy, m * 2 + 3, 1); px(g, P[3], x - m, y + yy, m * 2 + 1, 1); } px(g, P[4], x - lg / 2, y - r / 2, 1, 2); return true; }
  /* sombra, magia, veneno, areia, vento, luz: esfera com borda escura e brilho */
  bola(g, P[0], x, y, r + 1); bola(g, P[2], x, y, r); bola(g, P[3], x - 1, y - 1, Math.max(1, r - 2)); px(g, P[4], x - r / 2, y - r / 2, 2, 2);
  return true;
}
// os golpes amigos que viram zona (o brado do levita, o fogo da lança, a descida do Espírito) também têm matéria
const COR_AMIGA = { '#FF8A2A': 'fogo', '#FFB05A': 'fogo', '#BFF0F8': 'som', '#EAFBFF': 'raio' };
export const elementoAmigo = z => z.el || COR_AMIGA[z.cor] || null;
