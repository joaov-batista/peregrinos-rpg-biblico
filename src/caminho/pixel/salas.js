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
  },
  // A casa do peregrino por dentro: paredes de adobe rebocado (com as manchas e o reboco caído mostrando o tijolo),
  // o teto de vigas de madeira com palha por cima, prateleiras com potes e cântaros, réstias de cebola e ervas penduradas,
  // um tapete de lã no chão de terra batida, a porta de madeira à esquerda. Os móveis e as janelas são objetos, por cima.
  casa(s) {
    const A = ['#3A2A22', '#5A4232', '#7A5C44', '#94745A', '#AE8E70', '#C4A688'].map(cor), M = rampa('#6B4A2E'), T = cor('#17121f');
    s.ret(0, 0, W, H, A[2]);
    for (let y = 0; y < CHAO; y++) for (let x = 0; x < W; x += 1) { const n = ((x * 7 + y * 13) % 23) / 23, mancha = Math.sin(x * 0.03) * Math.sin(y * 0.05) > 0.55; if (n > 0.86 || mancha && n > 0.5) s.px(x, y, mancha ? A[1] : A[3]); }
    s.ret(0, 40, W, 3, A[1]); for (let y = 44; y < CHAO; y += 70) s.ret(0, y, W, 1, A[1]); // faixas de umidade
    for (const [x0, y0, w, h] of [[60, 120, 34, 22], [300, 150, 26, 18], [420, 90, 22, 16]]) { s.ret(x0, y0, w, h, A[1]); for (let y = y0; y < y0 + h; y += 5) for (let x = x0 + ((y - y0) / 5 % 2) * 4; x < x0 + w - 2; x += 8) { s.ret(x, y, 7, 4, cor('#8A4A32')); s.ret(x, y, 7, 1, cor('#A86A4A')); } } // o reboco caído, o tijolo à mostra
    // o teto: vigas grossas atravessadas e a palha entre elas
    s.ret(0, 0, W, 30, cor('#5A4426')); for (let x = 0; x < W; x += 3) s.ret(x, 0, 1, 30, (x / 3) % 3 ? cor('#7A6234') : cor('#4A3820'));
    for (let x = 10; x < W; x += 64) { s.ret(x, 0, 14, 34, T); s.ret(x + 1, 0, 12, 33, M[2]); s.ret(x + 1, 0, 3, 33, M[3]); s.ret(x + 10, 0, 3, 33, M[1]); s.ret(x - 2, 30, 18, 4, M[1]); }
    s.ret(0, 30, W, 4, T); s.ret(0, 30, W, 3, M[2]); s.ret(0, 30, W, 1, M[4]); // a viga mestra
    // prateleiras com potes e cântaros, e as réstias penduradas
    for (const [x0, y0, w] of [[150, 128, 70], [336, 112, 64]]) { s.ret(x0, y0, w, 4, T); s.ret(x0 + 1, y0 + 1, w - 2, 2, M[3]);
      for (let k = 0; k < Math.floor(w / 16); k++) { const px = x0 + 6 + k * 16, cP = ['#B8683A', '#8A7A5A', '#C9A06A', '#6A7A8A'][k % 4]; s.ret(px - 1, y0 - 14, 12, 14, T); s.ret(px, y0 - 13, 10, 13, cor(cP)); s.ret(px + 2, y0 - 16, 6, 3, T); s.ret(px + 3, y0 - 15, 4, 2, cor(cP)); s.ret(px + 1, y0 - 12, 2, 8, cor('#FFFFFF33')); } }
    for (const [x, n, c] of [[236, 6, '#C9A060'], [252, 5, '#7A9A4A'], [318, 7, '#B86A5A']]) { s.ret(x, 34, 1, 14, cor('#8A7A5A')); for (let k = 0; k < n; k++) { s.ret(x - 3, 48 + k * 7, 7, 6, T); s.ret(x - 2, 49 + k * 7, 5, 4, cor(c)); } }
    // a porta de madeira (por onde se sai), com a tranca e a luz que passa por baixo
    s.ret(28, CHAO - 74, 52, 74, T); s.ret(30, CHAO - 72, 48, 72, M[1]); for (let x = 32; x < 76; x += 8) s.ret(x, CHAO - 72, 1, 72, M[0]); s.ret(30, CHAO - 50, 48, 3, M[3]); s.ret(30, CHAO - 22, 48, 3, M[3]); s.ret(70, CHAO - 40, 4, 6, cor('#C9A060'));
    s.ret(24, CHAO - 78, 60, 5, M[2]); s.ret(24, CHAO - 78, 60, 1, M[4]);
    // o chão de terra batida e o tapete de lã
    s.ret(0, CHAO, W, H - CHAO, cor('#4A3628')); s.ret(0, CHAO, W, 1, cor('#6A5038')); for (let i = 0; i < 60; i++) s.px((i * 97) % W, CHAO + 2 + (i * 7) % (H - CHAO - 3), cor('#5A4432'));
    s.ret(170, CHAO - 2, 150, 4, T); s.ret(172, CHAO - 2, 146, 3, cor('#8E2E3A')); for (let x = 176; x < 316; x += 10) { s.ret(x, CHAO - 2, 4, 3, cor('#C9A63C')); s.ret(x + 5, CHAO - 1, 3, 1, cor('#2F4A7A')); }
  },
  // A sinagoga por dentro: salão alto de pedra violeta, arcos sobre pilares grossos, o vitral triplo sobre a arca e
  // vitrais nos vãos dos lados (azul, magenta, ouro, com o chumbo escuro), tochas nos pilares, a lâmpada eterna,
  // o piso de lajes com as manchas de luz dos vitrais. Os feixes de luz e a poeira são pintados por cima, a cada quadro.
  sinagoga(s) {
    const P = ['#120E1A', '#1E1828', '#2A2236', '#3A3048', '#4A3E5C', '#5E5070', '#7A6A8A', '#9A8AA8'].map(cor), O = rampa('#C9A63C'), A = rampa('#2F4A7A'), M = rampa('#6B4A2E'), F = rampa('#FFB53A'), CH = cor('#1A1422'), TINTA = cor('#0E0A14');
    const VID = ['#3A5AC8', '#C83A8A', '#E8B84A', '#6A3AA8', '#8AB8E8', '#2E8A7A'].map(cor);
    // parede de tijolos, mais escura no alto
    s.ret(0, 0, W, H, P[2]);
    for (let y = 0; y < CHAO; y += 6) { const tom = y < 60 ? P[1] : y < 140 ? P[2] : P[3]; s.ret(0, y, W, 6, tom); s.ret(0, y + 5, W, 1, P[1]); for (let x = ((y / 6) % 2) * 9; x < W; x += 18) s.ret(x, y, 1, 5, P[1]); }
    for (let i = 0; i < 140; i++) s.px((i * 97) % W, 20 + (i * 53) % (CHAO - 30), i % 3 ? P[1] : P[4]);
    // um vitral em arco ogival: moldura de pedra, vidro em losangos coloridos, chumbo
    const vitral = (x, y, w, h, sem) => {
      for (let k = 0; k < h; k++) { const yy = y + k, topo = k < w ? Math.round(Math.sqrt(Math.max(0, w * w / 4 - (w / 2 - Math.min(k, w / 2)) ** 2)) * (k < w / 2 ? 1 : 1)) : w / 2; const lg = k < w / 2 ? Math.round(w / 2 * Math.sin(Math.PI / 2 * k / (w / 2)) ** 0.7) : w / 2;
        s.ret(x + w / 2 - lg - 3, yy, lg * 2 + 6, 1, P[5]); s.ret(x + w / 2 - lg - 2, yy, lg * 2 + 4, 1, TINTA);
        for (let q = -lg; q < lg; q++) { const gx = x + w / 2 + q, d = ((gx - x) + (yy - y)) % 8, e = ((gx - x) - (yy - y) + 800) % 8; s.px(gx, yy, d === 0 || e === 0 ? CH : VID[(Math.floor((gx - x) / 6) + Math.floor((yy - y) / 9) + sem) % VID.length]); } }
      s.ret(x + w / 2 - 1, y + 4, 2, h - 4, CH); s.ret(x + 2, y + h - 3, w - 4, 3, P[6]); s.ret(x - 2, y + h, w + 4, 4, P[5]); };
    // arcos sobre os pilares
    const pilares = [26, 124, 356, 454];
    for (let a = 0; a < pilares.length - 1; a++) { const x0 = pilares[a], x1 = pilares[a + 1], cxA = (x0 + x1) / 2, R = (x1 - x0) / 2;
      for (let t = 0; t <= 60; t++) { const an = Math.PI * t / 60, px = cxA - Math.cos(an) * R, py = 70 - Math.sin(an) * 52; s.ret(px - 3, py - 3, 6, 7, t % 6 ? P[4] : P[5]); s.ret(px - 3, py - 4, 6, 1, P[6]); } }
    vitral(56, 64, 40, 116, 0); vitral(384, 64, 40, 116, 2); // os vitrais dos lados
    vitral(186, 40, 30, 126, 1); vitral(222, 26, 36, 140, 3); vitral(264, 40, 30, 126, 4); // o vitral triplo do fundo
    s.ret(178, 166, 124, 6, P[6]); s.ret(178, 172, 124, 2, P[4]);
    // pilares grossos com capitel e base
    for (const px of pilares) { s.ret(px - 13, 20, 26, CHAO - 20, TINTA); s.ret(px - 12, 20, 24, CHAO - 20, P[4]); s.ret(px - 12, 20, 6, CHAO - 20, P[6]); s.ret(px + 6, 20, 6, CHAO - 20, P[3]);
      for (let y = 30; y < CHAO - 20; y += 22) s.ret(px - 12, y, 24, 1, P[3]); s.ret(px - 16, 64, 32, 8, P[6]); s.ret(px - 16, 72, 32, 2, P[3]); s.ret(px - 16, CHAO - 14, 32, 14, P[5]); s.ret(px - 16, CHAO - 14, 32, 2, P[7]);
      s.ret(px - 2, 140, 4, 12, cor('#2A2A3A')); s.ret(px - 4, 136, 8, 4, cor('#3A3A4A')); s.ret(px - 3, 129, 6, 7, F[2]); s.ret(px - 2, 126, 4, 5, F[3]); s.px(px, 124, F[4]); }
    // a arca, sob o vitral, com a cortina azul e dourada; a lâmpada eterna acesa diante dela
    s.ret(212, 186, 56, 70, TINTA); s.ret(214, 188, 52, 68, M[2]); s.ret(214, 188, 52, 3, M[4]); for (let k = 0; k <= 26; k++) { const lg = Math.round(Math.sqrt(Math.max(0, 676 - (26 - k) ** 2))); s.ret(240 - lg, 176 + k - 14, lg * 2, 1, k < 2 ? TINTA : M[2]); }
    s.ret(220, 196, 40, 56, A[2]); for (let x = 0; x < 40; x += 4) s.ret(220 + x, 196, 1, 56, A[1]); s.ret(220, 196, 40, 3, O[3]); s.ret(220, 248, 40, 3, O[3]); s.ret(234, 208, 12, 16, O[3]); s.ret(239, 208, 2, 16, O[1]);
    s.ret(239, 150, 2, 22, O[1]); s.ret(235, 172, 10, 5, O[3]); s.ret(237, 177, 6, 3, F[3]); s.px(240, 176, F[4]);
    // a porta de saída, à esquerda: arco de pedra, folhas abertas e a luz da rua
    { const dx = 56, dw = 18, dh = 60; for (let a = 0; a <= dw + 3; a++) { const lg = Math.round(Math.sqrt((dw + 3) ** 2 - (dw + 3 - a) ** 2)); s.ret(dx - lg, CHAO - dh - dw - 3 + a, lg * 2, 1, TINTA); }
      s.ret(dx - dw - 3, CHAO - dh, dw * 2 + 6, dh, TINTA); for (let a = 0; a <= dw; a++) { const lg = Math.round(Math.sqrt(dw * dw - (dw - a) ** 2)); s.ret(dx - lg, CHAO - dh - dw + a, lg * 2, 1, cor('#3E5A86')); }
      s.ret(dx - dw, CHAO - dh, dw * 2, dh, cor('#3E5A86')); for (let y = 0; y < 20; y += 3) s.ret(dx - dw + 2, CHAO - 30 + y, dw * 2 - 4, 1, cor('#5A7AA8'));
      s.ret(dx - dw, CHAO - dh, 6, dh, M[2]); s.ret(dx + dw - 6, CHAO - dh, 6, dh, M[2]); }
    // a bimá: estrado de madeira no meio, com grade e o atril
    s.ret(190, CHAO - 14, 100, 14, TINTA); s.ret(192, CHAO - 13, 96, 13, M[2]); s.ret(192, CHAO - 13, 96, 2, M[4]); for (let x = 194; x < 288; x += 8) s.ret(x, CHAO - 26, 2, 13, M[3]); s.ret(192, CHAO - 27, 96, 2, M[4]);
    s.ret(258, CHAO - 40, 16, 4, M[3]); s.ret(264, CHAO - 36, 4, 10, M[2]); s.ret(259, CHAO - 43, 14, 3, cor('#E8D9B0'));
    // piso de lajes
    s.ret(0, CHAO, W, H - CHAO, P[3]); s.ret(0, CHAO, W, 1, P[6]); for (let x = 0; x < W; x += 24) s.ret(x, CHAO + 1, 1, H - CHAO, P[2]);
  }
};

export function fundoSala(deco) {
  let c = cache.get(deco);
  if (!c && PINTA[deco]) { const s = new Sprite(W, H); PINTA[deco](s); c = s.tela(); cache.set(deco, c); }
  return c || null;
}

// os feixes de luz dos vitrais e a poeira que flutua neles (só na sinagoga por dentro): de dia, dourados; à noite, o luar azulado
export function pintarLuzSinagoga(g, G, cx, cy, dia) {
  const cel = G.N.celulas.find(c => c.deco === 'sinagoga'); if (!cel) return;
  const x0 = cel.cx * W - cx, y0 = cel.cy * H - cy, cor1 = dia ? '255,214,140' : '150,180,255', T = G.T;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [wx, wy, ww, wh, forca] of [[56, 64, 40, 116, 0.75], [384, 64, 40, 116, 0.75], [186, 40, 108, 126, 1]]) {
    const ax = x0 + wx, ay = y0 + wy + wh * 0.4, bx = ax + ww, dx = 120, chao = y0 + CHAO, gr = g.createLinearGradient(ax, ay, ax + dx, chao);
    gr.addColorStop(0, 'rgba(' + cor1 + ',' + (0.42 * forca) + ')'); gr.addColorStop(0.6, 'rgba(' + cor1 + ',' + (0.16 * forca) + ')'); gr.addColorStop(1, 'rgba(' + cor1 + ',0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, ay - 20); g.lineTo(bx + dx + 40, chao); g.lineTo(ax + dx - 30, chao); g.closePath(); g.fill();
    g.fillStyle = 'rgba(' + cor1 + ',' + (0.3 * forca) + ')'; g.fillRect(Math.round(ax + dx - 28), chao - 3, ww + 70, 4);
    for (let i = 0; i < 9; i++) { const t = (T * 0.05 + i / 9) % 1, px = ax + 10 + t * (dx + 10) + Math.sin(T + i * 3) * 6, py = ay + t * (chao - ay) - 10 + Math.cos(T * 0.7 + i) * 4; g.fillStyle = 'rgba(' + cor1 + ',0.55)'; g.fillRect(Math.round(px), Math.round(py), 1, 1); }
  }
  g.restore();
}
