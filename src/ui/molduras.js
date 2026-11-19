// As molduras da interface, pintadas pixel a pixel (nove partes para border-image): madeira de oliveira entalhada,
// filete de latão por dentro e cantoneiras rebitadas; os encaixes (quadros dos itens) são rebaixos na madeira.
// Tudo à mão, ponto a ponto, para o menu parecer peça do mesmo mundo: a mesa do escriba, o baú do peregrino.
const TINTA = '#0D0806';
const MAD = { fundo: '#2E1F14', sombra: '#3E2918', base: '#5A3C24', luz: '#7E5636', brilho: '#A0744A', veio: '#4A3120' };
const LAT = { sombra: '#6A4A1A', base: '#B8913E', luz: '#E2C070', brilho: '#FFEBA8' };
const DENTRO = { a: '#1C1510', b: '#211912', c: '#17110C' };

function tela(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const P = (x, y, cor, l = 1, a = 1) => { g.fillStyle = cor; g.fillRect(x, y, l, a); }; pinta(P, g); return c.toDataURL(); }
const h = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };

// painel: 36x36, partes de 9
function moldura() {
  const S = 36, B = 9;
  return tela(S, S, P => {
    // o miolo: tábua escura com veio quebrado (repete sem emenda: o veio fecha em 18 px)
    for (let y = B; y < S - B; y++) for (let x = B; x < S - B; x++) P(x, y, DENTRO.a);
    for (let y = B + 2; y < S - B; y += 4) for (let x = B; x < S - B; x++) if (h(x >> 2, y, 3) > 0.45) P(x, y, (y >> 2) % 2 ? DENTRO.b : DENTRO.c);
    // a madeira da moldura (6 px), com luz em cima e à esquerda e sombra embaixo e à direita
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.min(x, y, S - 1 - x, S - 1 - y); if (d > 7) continue;
      let c = null;
      if (d === 0) c = TINTA;
      else if (d <= 6) { const topo = y === d || x === d, fundo = y === S - 1 - d || x === S - 1 - d; const horiz = Math.min(y, S - 1 - y) <= 6 && Math.min(x, S - 1 - x) > Math.min(y, S - 1 - y);
        c = d === 1 ? (x <= y && x < S - 1 - y ? MAD.luz : y < x && y < S - 1 - x ? MAD.brilho : MAD.sombra) : d === 6 ? MAD.sombra : MAD.base;
        if (d === 3 || d === 5) { const k = horiz ? x : y; if (h(Math.floor((k + d * 3) / 6), d, 7) > 0.35) c = MAD.veio; } // o veio: riscos longos ao longo da tábua, com falhas
        if (d === 4) { const k = horiz ? x : y; if (h(Math.floor((k + 2) / 9), 4, 11) > 0.8) c = MAD.luz; } // um brilho comprido de vez em quando
        if (d === 2 && (y === 2 || x === 2) && !(y > S - 4 || x > S - 4)) c = MAD.luz; }
      else if (d === 7) c = (y === 7 || x === 7) && y < S - 8 && x < S - 8 ? LAT.luz : (y === S - 8 || x === S - 8) ? LAT.sombra : LAT.base; // o filete de latão
      if (c) P(x, y, c);
    }
    for (let i = 8; i < S - 8; i++) { P(i, 8, TINTA); P(8, i, TINTA); P(i, S - 9, '#120C08'); P(S - 9, i, '#120C08'); } // o rebaixo do miolo
    // as cantoneiras de latão, cada uma com seu rebite
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [S - 1, 0, -1, 1], [0, S - 1, 1, -1], [S - 1, S - 1, -1, -1]]) {
      const Q = (a, b, cor) => P(cx + a * sx, cy + b * sy, cor);
      for (let a = 1; a <= 7; a++) for (let b = 1; b <= 7; b++) { if (a > 3 && b > 3) continue; Q(a, b, (a === 1 || b === 1) ? (sx > 0 && sy > 0 ? LAT.brilho : LAT.luz) : (a === 3 && b > 3) || (b === 3 && a > 3) ? LAT.sombra : LAT.base); }
      for (let a = 0; a <= 8; a++) { if (a < 8) { Q(a, 0, TINTA); Q(0, a, TINTA); } if (a >= 4) { Q(a, 4, TINTA); Q(4, a, TINTA); } } Q(8, 1, TINTA); Q(8, 2, TINTA); Q(8, 3, TINTA); Q(1, 8, TINTA); Q(2, 8, TINTA); Q(3, 8, TINTA);
      Q(2, 2, LAT.brilho); Q(3, 3, LAT.sombra); Q(2, 3, LAT.base); Q(3, 2, LAT.base); // o rebite
    }
  });
}

// encaixe de item: 18x18, partes de 6 (um rebaixo talhado: sombra em cima e à esquerda, a borda de baixo pega luz)
function quadro() {
  const S = 18;
  return tela(S, S, P => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.min(x, y, S - 1 - x, S - 1 - y);
      let c = d === 0 ? TINTA : d === 1 ? ((y === S - 2 || x === S - 2) ? MAD.luz : MAD.sombra) : d === 2 ? ((y === 2 || x === 2) ? '#0F0A07' : '#2A1C12') : (h(x, y >> 1, 4) > 0.8 ? '#1E1610' : '#181109');
      if (d === 1 && (x === 1 || y === 1) && !(x === S - 2 || y === S - 2)) c = MAD.base;
      P(x, y, c);
    }
    P(1, 1, MAD.sombra); P(S - 2, S - 2, MAD.brilho);
  });
}

// pergaminho: 36x36, partes de 12 — couro curtido claro, fibras, manchas e a borda escurecida e irregular
function papel() {
  const S = 36;
  return tela(S, S, P => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.min(x, y, S - 1 - x, S - 1 - y), r = h(x, y, 21), irreg = h(Math.floor((x + y) / 3), Math.min(x, y) < 12 ? 1 : 2, 5) * 1.6;
      let c = '#E4D1A4';
      if (d === 0) c = TINTA; else if (d < 1.6 + irreg * 0.6) c = '#5A3A1E'; else if (d < 3 + irreg) c = '#9A7444'; else if (d < 5 + irreg) c = '#C9AA74';
      else { c = '#E4D1A4'; if (r > 0.95) c = '#D6C094'; else if (r < 0.03) c = '#EEDFBC'; } // o miolo quase liso: a fibra rara, sem quadriculado que se repete
      P(x, y, c);
    }
  });
}
// couro costurado: 24x24, partes de 8 — o alforje: couro curtido escuro com granulado e a costura clara
function couro() {
  const S = 24;
  return tela(S, S, P => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.min(x, y, S - 1 - x, S - 1 - y), r = h(x, y, 31);
      let c = r > 0.8 ? '#4E321E' : r < 0.18 ? '#6E4A2E' : '#5C3D24';
      if (d === 0) c = TINTA; else if (d === 1) c = (x === 1 || y === 1) && x < S - 2 && y < S - 2 ? '#7E5636' : '#3A2414';
      else if (d === 3 && ((x + y) % 3 !== 0)) c = '#D8BE8A'; // a costura
      else if (d === 4 && ((x + y) % 3 === 1)) c = '#3A2414'; // a sombra do ponto
      P(x, y, c);
    }
  });
}
// encaixe com aro de latão (as peças da armadura): 18x18, partes de 6
function medalha() {
  const S = 18;
  return tela(S, S, P => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.min(x, y, S - 1 - x, S - 1 - y), canto = Math.min(x, S - 1 - x) + Math.min(y, S - 1 - y);
      if (canto < 3) continue;
      let c = d === 0 || canto === 3 ? TINTA : d === 1 ? ((y <= 2 || x <= 2) && !(x >= S - 3 || y >= S - 3) ? LAT.brilho : LAT.sombra) : d === 2 ? LAT.base : d === 3 ? '#0F0A07' : (h(x, y >> 1, 4) > 0.8 ? '#2A1C12' : '#22170F');
      P(x, y, c);
    }
  });
}
// fita (o título das seções): 40x16, partes de 10 nas pontas — vermelho de tinta de cochonilha, dobra e ponta em V
function fita() {
  const W = 40, H = 16;
  return tela(W, H, P => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ponta = Math.min(x, W - 1 - x), corte = Math.abs(y - 7.5) < (6 - ponta) * 1.2 && ponta < 6; // o V das pontas
      if (y < 1 || y > 14 || corte) continue;
      let c = y === 1 || y === 14 ? TINTA : y === 2 ? '#C8504A' : y === 13 ? '#4A1414' : y > 10 ? '#6E2020' : '#8E2B2B';
      if ((ponta === 6 || ponta === 7) && y > 1 && y < 14) c = '#4A1414'; // a dobra
      if (ponta < 6 && !corte && (Math.abs(y - 7.5) >= (6 - ponta) * 1.2 - 1)) c = TINTA;
      P(x, y, c);
    }
  });
}

export function instalarMolduras() {
  try { const r = document.documentElement.style; r.setProperty('--px-moldura', `url(${moldura()})`); r.setProperty('--px-quadro', `url(${quadro()})`);
    r.setProperty('--px-papel', `url(${papel()})`); r.setProperty('--px-couro', `url(${couro()})`); r.setProperty('--px-medalha', `url(${medalha()})`); r.setProperty('--px-fita', `url(${fita()})`); } catch { /* sem canvas: fica a moldura simples do CSS */ }
}
