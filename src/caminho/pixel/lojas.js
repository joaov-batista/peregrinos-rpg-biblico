// As lojas e oficinas do Refúgio como pequenas construções: contorno escuro, madeira com veio, telha, sombra no lado direito,
// mercadoria à mostra. Coordenadas em pixel de jogo: x no meio do lugar, y no chão. Cada uma ocupa mais ou menos o mesmo
// espaço de antes, para não esbarrar em quem trabalha ali.
const TI = '#17121f';
const MAD = ['#3A2416', '#5A3A22', '#7A4E2E', '#9A6A3E', '#B8864A'], PED = ['#4A4450', '#6A6470', '#8A8490', '#AAA4AE'];

export function pintarLoja(g, q, o, x, y, Tm) {
  const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + a), Math.round(y + b), Math.round(w), Math.round(h)); };
  const tabuas = (a, b, w, h, P = MAD) => { R(a - 1, b - 1, w + 2, h + 2, TI); R(a, b, w, h, P[2]); for (let i = 0; i < w; i += 5) { R(a + i, b, 1, h, P[1]); if ((i / 5) % 3 === 1) R(a + i + 2, b + h * 0.3, 1, 2, P[1]); } R(a, b, w, 1, P[3]); };
  const poste = (a, b, h) => { R(a - 1, b - 1, 5, h + 1, TI); R(a, b, 3, h, MAD[2]); R(a, b, 1, h, MAD[3]); };
  const toldo = (a, b, w, c1, c2) => { R(a - 1, b - 1, w + 2, 9, TI); for (let i = 0; i < w; i += 6) R(a + i, b, 6, 7, (i / 6) % 2 ? c2 : c1); for (let i = 0; i < w; i += 6) { R(a + i + 1, b + 7, 4, 2, (i / 6) % 2 ? c2 : c1); R(a + i + 2, b + 9, 2, 1, (i / 6) % 2 ? c2 : c1); } R(a, b, w, 1, '#FFFFFF33'); };
  const telha = (a, b, w, h) => { R(a - 2, b - 1, w + 4, h + 2, TI); for (let r = 0; r < h; r += 3) for (let i = (r / 3) % 2 ? 3 : 0; i < w; i += 6) { R(a + i, b + r, 6, 3, '#9A3E2A'); R(a + i, b + r, 6, 1, '#C0563A'); } };
  const f = Math.floor(Tm * 6);
  switch (q) {
    case 'banca': { // a banca da púrpura: toldo listrado, prateleira de rolos de pano, o pote de tinta
      poste(-38, -52, 52); poste(35, -52, 52); toldo(-42, -58, 84, '#7A2E6A', '#E8DCC8');
      tabuas(-36, -22, 72, 22); R(-36, -24, 72, 3, MAD[4]);
      for (const [a, c] of [[-32, '#7A2E6A'], [-22, '#B8322A'], [-12, '#2F5FB0'], [-2, '#C9A63C'], [8, '#3F7A4A'], [18, '#8E2B45']]) { R(a - 1, -33, 10, 9, TI); R(a, -32, 8, 7, c); R(a + 1, -31, 2, 5, '#FFFFFF44'); }
      R(-30, -50, 2, 16, '#8E2B45'); R(-26, -50, 2, 12, '#7A2E6A'); R(-22, -50, 2, 14, '#C9A63C'); // panos pendurados
      R(24, -8, 12, 10, TI); R(25, -7, 10, 8, '#6A5A4A'); R(26, -9, 8, 3, '#7A2E6A'); // o pote de tinta
      return true; }
    case 'forja': { // a forja: casinha de pedra com chaminé, a fornalha acesa, bigorna e foles
      R(-6, -56, 58, 56, TI); R(-5, -55, 56, 55, PED[1]); for (let r = -50; r < 0; r += 7) for (let c = (r / 7) % 2 ? 0 : 6; c < 54; c += 12) R(-5 + c, r, 11, 1, PED[0]); R(46, -55, 5, 55, PED[0]);
      telha(-9, -64, 64, 9); R(38, -80, 10, 18, TI); R(39, -79, 8, 17, PED[2]); // a chaminé
      g.fillStyle = '#9AA0AE'; g.globalAlpha = 0.4; for (let i = 0; i < 6; i++) { const t = (Tm * 0.6 + i / 6) % 1; g.fillRect(Math.round(x + 41 + Math.sin(t * 6 + i) * 3 + t * 8), Math.round(y - 84 - t * 28), 3 + Math.round(t * 3), 2); } g.globalAlpha = 1;
      R(6, -34, 24, 30, TI); R(7, -33, 22, 29, '#2A1A12'); const fogo = f % 3; R(9, -14 - fogo, 18, 10 + fogo, '#E2463C'); R(11, -12 - fogo, 14, 8 + fogo, '#FF9A3C'); R(14, -10, 8, 5, '#FFE08A'); g.globalAlpha = 0.2; R(0, -40, 40, 40, '#FF9A3C'); g.globalAlpha = 1;
      R(-22, -14, 16, 5, TI); R(-21, -13, 14, 3, PED[2]); R(-18, -10, 6, 10, TI); R(-17, -9, 4, 9, PED[1]); R(-24, -2, 18, 2, PED[0]); // a bigorna
      R(-28, -24, 2, 10, MAD[2]); R(-30, -26, 6, 3, PED[2]); R(32, -20, 14, 8, MAD[2]); R(32, -20, 14, 2, MAD[4]); R(44, -18, 4, 2, MAD[1]); // martelo e foles
      return true; }
    case 'armas': { // o armeiro da Jael: cobertura de telha, armeiro com espadas e lanças, escudos e o estandarte
      poste(14, -48, 48); poste(64, -48, 48); telha(10, -54, 60, 7); tabuas(16, -14, 48, 14);
      R(18, -42, 44, 2, MAD[3]); for (let i = 0; i < 4; i++) { const a = 22 + i * 11; R(a, -40, 2, 26, '#C9D2E0'); R(a - 2, -20, 6, 2, '#C9A63C'); R(a, -18, 2, 4, MAD[1]); } // espadas
      R(60, -70, 1, 56, MAD[2]); R(58, -72, 5, 3, '#C9D2E0'); // a lança alta
      for (const [a, c] of [[0, '#8E2B2B'], [-14, '#2F4A7A']]) { R(a - 7, -30, 14, 18, TI); R(a - 6, -29, 12, 16, c); R(a - 6, -29, 12, 2, '#C9A63C'); R(a - 1, -27, 2, 12, '#C9A63C'); } // escudos
      R(70, -60, 2, 60, MAD[1]); R(72, -58, 12, 14, '#8E2B2B'); R(76, -46, 3, 4, '#8E2B2B'); R(75, -54, 5, 5, '#C9A63C'); // o estandarte
      return true; }
    case 'tear': { // a costureira: o tear com fios de cores e o varal de túnicas
      poste(14, -46, 46); poste(46, -46, 46); R(14, -46, 35, 3, MAD[3]); R(14, -10, 35, 3, MAD[3]);
      for (let i = 0; i < 12; i++) R(18 + i * 2.4, -43, 1, 33, ['#C83A3A', '#E8DCC8', '#2F5FB0', '#C9A63C'][i % 4]); R(17, -24, 28, 10, '#8E4A6A'); R(17, -24, 28, 1, '#B86A8A'); // o pano saindo
      R(52, -40, 46, 1, MAD[1]); poste(50, -42, 42); poste(96, -42, 42);
      for (const [a, c] of [[56, '#3F7A4A'], [70, '#C9A63C'], [84, '#2F5FB0']]) { R(a - 1, -39, 12, 20, TI); R(a, -38, 10, 18, c); R(a - 3, -38, 3, 7, c); R(a + 10, -38, 3, 7, c); R(a + 4, -40, 2, 3, '#E8DCC8'); }
      return true; }
    case 'arca': { // a arca de Noé (um modelo grande, de madeira): casco curvo, a casa em cima, a rampa e os bichos espiando
      const W = 104, fundo = i => Math.round(Math.sin(i / W * Math.PI) * 10); for (let i = -1; i <= W + 1; i++) R(i - W / 2, -35, 1, 24 + fundo(Math.max(0, Math.min(W, i))) + 1, TI); for (let i = 0; i <= W; i++) { R(i - W / 2, -34, 1, 21 + fundo(i), i % 6 === 0 ? MAD[2] : MAD[3]); R(i - W / 2, -14 + fundo(i), 1, 1, MAD[1]); }
      for (let r = -30; r < -10; r += 5) R(-W / 2 + 2, r, W - 4, 1, MAD[1]); R(-W / 2, -36, W, 3, MAD[3]); R(-W / 2 - 4, -38, 8, 4, MAD[3]); R(W / 2 - 4, -38, 8, 4, MAD[3]);
      R(-34, -60, 68, 24, TI); R(-33, -59, 66, 23, MAD[3]); for (let i = -30; i < 32; i += 6) R(i, -59, 1, 23, MAD[2]); // a casa
      g.fillStyle = TI; g.beginPath(); g.moveTo(x - 40, y - 59); g.lineTo(x, y - 76); g.lineTo(x + 40, y - 59); g.fill(); g.fillStyle = MAD[1]; g.beginPath(); g.moveTo(x - 36, y - 60); g.lineTo(x, y - 73); g.lineTo(x + 36, y - 60); g.fill();
      for (const a of [-24, -8, 8]) { R(a, -54, 10, 8, TI); R(a + 1, -53, 8, 6, '#3A2A1A'); }
      R(9 + 3, -53, 3, 3, '#E8D8A0'); R(9 + 2, -58, 2, 6, '#E8C060'); R(9 + 3, -64, 2, 6, '#E8C060'); R(9 + 1, -66, 5, 3, '#E8C060'); R(9 + 5, -65, 1, 1, TI); // a girafa
      R(-23, -52, 8, 5, '#8A8A9A'); R(-24, -49, 3, 5, '#8A8A9A'); R(-20, -51, 1, 1, TI); // o elefante
      R(-7, -51, 7, 4, '#EDE8DC'); R(-2, -52, 3, 3, '#3A3030'); // a ovelha
      R(24, -66, 6, 3, '#F4F1E6'); R(23, -65, 2, 2, '#F4F1E6'); R(29, -67, 2, 1, '#F2C14E'); R(25, -69, 3, 2, '#3F8A3A'); // a pomba com o ramo
      for (let i = 0; i < 14; i++) R(W / 2 + i - 6, -14 + i, 3, 1, MAD[3]); // a rampa
      return true; }
    case 'redes': { // as redes de Zebedeu secando, cestos de peixe e barris
      poste(-26, -46, 46); poste(22, -46, 46); R(-26, -44, 52, 2, MAD[1]);
      g.fillStyle = '#C9B88A'; for (let i = 0; i < 11; i++) { const sag = Math.round(Math.sin(i / 10 * Math.PI) * 6); for (let k = 0; k < 7; k++) g.fillRect(x - 22 + i * 4.4, y - 42 + k * 4 + Math.round(sag * k / 7), 1, 3); } for (let k = 0; k < 7; k++) g.fillRect(x - 22, y - 38 + k * 4, 46, 1);
      R(-46, -14, 16, 14, TI); R(-45, -13, 14, 13, MAD[3]); for (let i = 0; i < 14; i += 3) R(-45 + i, -13, 1, 13, MAD[2]); R(-44, -16, 4, 4, '#9FC8D8'); R(-39, -17, 5, 4, '#7E9A6E'); // cesto de peixes
      R(30, -18, 14, 18, TI); R(31, -17, 12, 17, MAD[2]); R(31, -13, 12, 2, PED[1]); R(31, -6, 12, 2, PED[1]); // barril
      return true; }
  }
  return false;
}
