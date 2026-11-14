// Fundos próprios dos salões do subsolo do Refúgio. Cada sala é uma figura de 480 × 272 (30 × 17 blocos de 16):
// o interior vai de x 16 a 464 e de y 16 a 256 (o chão começa em y 256).
import { Sprite, rampa, cor } from './raster.js';

const W = 480, H = 272, CHAO = 256;
const cache = new Map();
const PEDRA = ['#141826', '#1B2133', '#232B42', '#2E3854', '#3B4766'].map(cor);

function parede(s, base = PEDRA) {
  s.ret(16, 16, W - 32, CHAO - 16, base[1]);
  for (let y = 16; y < CHAO; y += 12) { // fiadas de pedra, alternadas
    s.ret(16, y, W - 32, 1, base[0]);
    for (let x = 16 + ((y / 12) % 2) * 14; x < W - 16; x += 28) { s.ret(x, y + 1, 1, 11, base[0]); s.ret(x + 1, y + 1, 26, 1, base[2]); }
  }
  for (let i = 0; i < 90; i++) { const x = 18 + (i * 97) % (W - 36), y = 18 + (i * 61) % (CHAO - 36); s.px(x, y, i % 3 ? base[0] : base[3]); }
  s.ret(16, CHAO - 10, W - 32, 10, base[0]); s.ret(16, CHAO - 10, W - 32, 1, base[3]); // rodapé
}
function placa(s, larg, meio = W / 2) { // a tabuleta do nome, no alto (o texto vem por cima, no desenho do jogo)
  const M = rampa('#6B4A2E'), x = meio - larg / 2;
  s.ret(x - 2, 20, larg + 4, 20, cor('#17121f')); s.ret(x, 22, larg, 16, M[2]); s.ret(x, 22, larg, 1, M[4]); s.ret(x, 37, larg, 1, M[0]);
  s.ret(x + 3, 24, 2, 2, M[0]); s.ret(x + larg - 5, 24, 2, 2, M[0]); s.ret(x + 3, 34, 2, 2, M[0]); s.ret(x + larg - 5, 34, 2, 2, M[0]);
  s.ret(meio - 1, 16, 2, 4, M[1]);
}
function arco(s, x, y, w, h, R, fundo) { // nicho em arco
  s.ret(x, y + w / 2, w, h - w / 2, fundo); for (let k = 0; k <= w / 2; k++) { const lg = Math.round(Math.sqrt(Math.max(0, (w / 2) ** 2 - (w / 2 - k) ** 2))); s.ret(x + w / 2 - lg, y + k, lg * 2, 1, fundo); }
  for (let a = 0; a <= 24; a++) { const an = Math.PI * a / 24; s.ret(Math.round(x + w / 2 - Math.cos(an) * (w / 2 + 2)) - 1, Math.round(y + w / 2 - Math.sin(an) * (w / 2 + 2)) - 1, 3, 3, a % 4 ? R[3] : R[2]); }
  s.ret(x - 3, y + w / 2, 3, h - w / 2, R[3]); s.ret(x + w, y + w / 2, 3, h - w / 2, R[2]);
}
function tocha(s, x, y) { const F = rampa('#FF9A3C'); s.ret(x - 1, y, 3, 10, cor('#4A3524')); s.ret(x - 3, y - 2, 7, 3, cor('#2A2A3A')); s.ret(x - 2, y - 7, 5, 5, F[2]); s.ret(x - 1, y - 9, 3, 4, F[3]); s.px(x, y - 11, F[4]); s.ret(x - 1, y - 5, 2, 2, cor('#FFF6C8')); }

const PINTA = {
  // Salão dos Rolos: estantes no alto, um rodapé de madeira com um nicho em arco para cada página (onde fica o portal),
  // e, no meio, o vitral sobre a escada que sobe ao mercado
  biblioteca(s) {
    parede(s); placa(s, 150, 104);
    const M = rampa('#5A3E28'), P = rampa('#E8D9B0'), FITA = ['#B8423A', '#3F7A9A', '#C9A63C', '#5E8A4A'].map(c => rampa(c)[2]);
    for (const x0 of [24, 300]) { // estantes (só até a altura do rodapé)
      s.ret(x0, 50, 156, 128, M[0]); s.ret(x0 + 2, 52, 152, 124, M[1]);
      for (let r = 0; r < 4; r++) { const y = 56 + r * 30; s.ret(x0 + 2, y + 25, 152, 3, M[3]); s.ret(x0 + 2, y + 28, 152, 1, M[0]);
        for (let c = 0; c < 14; c++) { const x = x0 + 6 + c * 10.6, d = (r * 13 + c) % 7; if (d === 3) continue; s.bola(x + 4, y + 20, 4, 4, P, 0.4, -0.6); s.ret(x + 3, y + 19, 2, 2, P[0]); s.ret(x, y + 16, 9, 1, FITA[(r + c) % 4]); } }
      s.ret(x0, 50, 156, 3, M[4]); s.ret(x0, 50, 3, 128, M[3]); s.ret(x0 + 153, 50, 3, 128, M[2]);
    }
    // rodapé de madeira, com um nicho escuro em arco atrás de cada portal (colunas 4, 9, 21 e 26)
    s.ret(16, 182, W - 32, 74, M[1]); s.ret(16, 182, W - 32, 3, M[4]); s.ret(16, 186, W - 32, 1, M[0]);
    for (let x = 22; x < W - 22; x += 28) { s.ret(x, 192, 22, 56, M[2]); s.ret(x, 192, 22, 1, M[3]); s.ret(x, 247, 22, 1, M[0]); }
    for (const col of [4, 9, 21, 26]) { const cx = col * 16 + 8; arco(s, cx - 24, 196, 48, 60, PEDRA, cor('#0B0E18')); s.ret(cx - 18, 186, 36, 6, M[3]); s.ret(cx - 16, 187, 32, 1, rampa('#C9A63C')[3]); }
    const V = ['#3F7A9A', '#C9A63C', '#8E3B5E', '#5E8A4A'].map(c => rampa(c)); // vitral em arco, sobre a escada
    arco(s, 196, 40, 88, 120, PEDRA, cor('#0B0E18'));
    for (let y = 0; y < 110; y += 6) for (let x = 0; x < 80; x += 8) { const k = (x / 8 + y / 6) % 4, px = 200 + x, py = 46 + y; if (Math.hypot(px + 4 - 240, py - 84) < 40 || py > 84) s.ret(px, py, 7, 5, V[k][(x + y) % 3 + 1]); }
    s.ret(239, 46, 2, 114, cor('#17121f')); s.ret(200, 98, 80, 2, cor('#17121f'));
  },
  // Casa do Tesouro: a porta redonda do cofre, prateleiras com sacos de moedas, a balança pendurada
  tesouro(s) {
    parede(s, ['#1A1610', '#241E16', '#2F271C', '#3B3224', '#4A3F2E'].map(cor)); placa(s, 150);
    const O = rampa('#C9A63C'), F = rampa('#6E6A78'), M = rampa('#5A3E28'), S = rampa('#8A6A44');
    const cx = 380, cy = 150; // o cofre
    for (let y = -70; y <= 70; y++) for (let x = -70; x <= 70; x++) { const d = Math.hypot(x, y); if (d <= 70) s.px(cx + x, cy + y, d > 64 ? O[d > 67 ? 1 : 3] : d > 58 ? F[1] : F[(x + y) % 9 === 0 ? 1 : 2]); }
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; s.linha(cx + Math.cos(an) * 14, cy + Math.sin(an) * 14, cx + Math.cos(an) * 54, cy + Math.sin(an) * 54, 3, F[3]); }
    s.bola(cx, cy, 14, 14, O); s.ret(cx - 2, cy - 2, 4, 4, cor('#17121f'));
    for (let a = 0; a < 16; a++) { const an = a * Math.PI / 8; s.ret(Math.round(cx + Math.cos(an) * 61) - 1, Math.round(cy + Math.sin(an) * 61) - 1, 3, 3, O[4]); }
    for (let y = 0; y < 3; y++) { const yy = 70 + y * 52; s.ret(30, yy + 40, 150, 4, M[3]); s.ret(30, yy + 44, 150, 2, M[0]);
      for (let i = 0; i < 6; i++) { const x = 40 + i * 24; if ((i + y) % 3 === 0) { for (let k = 0; k < 4; k++) s.ret(x, yy + 36 - k * 3, 12, 3, O[k % 2 ? 2 : 3]); } else { s.bola(x + 7, yy + 32, 8, 8, S); s.ret(x + 4, yy + 22, 6, 4, S[1]); s.ret(x + 3, yy + 25, 8, 1, O[3]); } } }
    s.ret(239, 40, 2, 34, cor('#17121f')); s.ret(206, 72, 68, 3, O[2]); // a balança
    for (const x of [212, 268]) { s.linha(x, 74, x - 10, 98, 1, O[1]); s.linha(x, 74, x + 10, 98, 1, O[1]); s.ret(x - 12, 98, 24, 3, O[3]); }
    s.ret(258, 94, 8, 4, O[4]);
  },
  // Cripta dos Gigantes: três arcos altos até o chão, cada um com o portal de um gigante dentro e o sinal dele no alto
  // (o elmo de Golias, o chifre do Beemote, a escama do Leviatã); tochas e ossos entre os arcos
  cripta(s) {
    parede(s, ['#121014', '#1A171D', '#231F28', '#2E2934', '#3B3544'].map(cor)); placa(s, 170);
    const R = ['#121014', '#1A171D', '#2E2934', '#4A4458', '#5E5870'].map(cor), O = rampa('#B8B0A0'), B = rampa('#8A7A5A'), BR = rampa('#C98A4A'), E = rampa('#2F8F9A');
    for (const col of [6, 15, 24]) { const cx = col * 16 + 8; arco(s, cx - 40, 92, 80, 164, R, cor('#0A090C')); s.ret(cx - 44, 248, 88, 8, R[2]); s.ret(cx - 44, 248, 88, 1, R[4]); }
    // os sinais de cada gigante, gravados em pedra no alto do arco
    { const cx = 6 * 16 + 8; s.bola(cx, 74, 12, 9, B, 0.4, -0.7); s.ret(cx - 14, 80, 28, 3, B[1]); s.ret(cx - 1, 60, 2, 8, rampa('#B8322A')[3]); s.ret(cx - 6, 74, 12, 2, B[0]); }
    { const cx = 15 * 16 + 8; s.linha(cx - 10, 84, cx - 4, 64, 3, BR[3]); s.linha(cx + 10, 84, cx + 4, 64, 3, BR[3]); s.ret(cx - 12, 82, 24, 4, BR[1]); }
    { const cx = 24 * 16 + 8; for (let k = 0; k < 3; k++) s.bola(cx - 8 + k * 8, 72 + (k % 2) * 4, 6, 7, E, 0.4, -0.7); }
    for (const [x, y] of [[30, 248], [176, 246], [316, 248], [446, 246]]) { s.ret(x, y, 12, 3, O[2]); s.bola(x - 2, y + 1, 3, 3, O); s.bola(x + 14, y + 1, 3, 3, O); }
    for (const x of [40, 176, 320, 440]) tocha(s, x, 120);
  },
  // Salão das Subfases: um corredor de três portas grandes; a primeira, do Vale da Mentira, tem um dragão em mosaico que
  // se desfaz (é mentira); as outras duas estão seladas com cera, para as jornadas que ainda vêm
  subfases(s) {
    parede(s, ['#100C1A', '#171226', '#211A36', '#2C2448', '#3A305C'].map(cor)); placa(s, 170);
    const R = ['#100C1A', '#171226', '#2C2448', '#4A3E6E', '#6A5A90'].map(cor), D = rampa('#E2463C'), CERA = rampa('#B8322A'), O = rampa('#C9A63C');
    for (const col of [6, 15, 24]) { const cx = col * 16 + 8; arco(s, cx - 40, 92, 80, 164, R, cor('#07050C')); s.ret(cx - 44, 248, 88, 8, R[2]); s.ret(cx - 44, 248, 88, 1, R[4]); }
    // o dragão de mosaico sobre a primeira porta, com peças faltando
    { const cx = 6 * 16 + 8; for (let y = 0; y < 22; y += 3) for (let x = -26; x < 26; x += 3) { const d = Math.abs(x) / 26 + Math.abs(y - 11) / 14; if (d < 1 && (x * 7 + y * 3) % 5 !== 0) s.ret(cx + x, 58 + y, 2, 2, D[(x + y + 40) % 3 + 1]); } s.ret(cx + 14, 62, 2, 2, rampa('#FFD23F')[4]); }
    // selos de cera nas duas portas fechadas
    for (const col of [15, 24]) { const cx = col * 16 + 8; s.ret(cx - 34, 140, 68, 3, O[1]); s.ret(cx - 34, 200, 68, 3, O[1]); s.bola(cx, 172, 10, 10, CERA, 0.4, -0.7); s.ret(cx - 3, 170, 6, 4, CERA[0]); s.ret(cx - 1, 166, 2, 12, CERA[0]); }
    for (const x of [40, 176, 320, 440]) tocha(s, x, 120);
    // um tapete do chão até a primeira porta
    s.ret(16, 250, W - 32, 6, cor('#3A1E2A')); for (let x = 16; x < W - 16; x += 8) s.px(x, 252, cor('#8E2E3A'));
  },
  // Cisterna: arcos sobre a água, pingos e limo
  cisterna(s) {
    parede(s, ['#0E1418', '#141D22', '#1B272E', '#24343C', '#2F4450'].map(cor)); placa(s, 120, 104);
    const R = ['#0E1418', '#141D22', '#24343C', '#3A5260', '#4E6A7A'].map(cor), A = rampa('#2E6B80'), L = rampa('#3F6A4A');
    for (let i = 0; i < 4; i++) arco(s, 34 + i * 108, 60, 84, 170, R, cor('#081014'));
    for (let x = 16; x < W - 16; x++) { const y = 226 + Math.round(Math.sin(x * 0.09) * 1.2); s.ret(x, y, 1, CHAO - 10 - y, A[1]); s.px(x, y, A[3]); if (x % 7 === 0) s.px(x, y + 3, A[2]); }
    for (let i = 0; i < 40; i++) { const x = 20 + (i * 53) % (W - 40); s.ret(x, 60 + (i * 17) % 80, 1, 2 + (i % 4), L[2]); }
    for (const x of [80, 190, 300, 410]) { s.ret(x, 80, 1, 6, A[3]); s.ret(x, 150, 1, 2, A[3]); }
  }
};

export function fundoSala(deco) {
  let c = cache.get(deco);
  if (!c && PINTA[deco]) { const s = new Sprite(W, H); PINTA[deco](s); c = s.tela(); cache.set(deco, c); }
  return c || null;
}
