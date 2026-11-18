// A vista do banco da praia, em primeira pessoa: o que o peregrino vê sentado, de frente para o mar.
// Pixel art de verdade: o céu em faixas com pontilhado (não um degradê liso), a ilha verde com falésia e palmeiras,
// os morros azulados ao longe, o mar em faixas do horizonte até a beira, a areia molhada e a seca, capim na frente.
// Tudo muda com a hora do jogo (madrugada, aurora, manhã, meio-dia, tarde, poente, crepúsculo, noite) e com a chuva.
// O que é parado é montado pixel a pixel numa imagem guardada (refeita só quando a hora muda); por cima, o que se mexe:
// nuvens, sol ou lua, o caminho de brilho na água, as cristas das ondas, a espuma que vem e volta, o barco, as gaivotas.

const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const rgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k));

// as cores de cada hora: céu (topo, meio, horizonte), mar (longe, meio, perto), areia (molhada, seca, sombra),
// terra da ilha (escuro, médio, claro, falésia), morros ao longe, nuvem (luz, corpo, sombra, base), cor do astro, brilho na água
const HORAS = [
  { h: 0, ceu: ['#05081A', '#0B1430', '#1A2448'], mar: ['#060C1E', '#0A1A34', '#123048'], areia: ['#2A2632', '#3E3844', '#1E1A24'], ilha: ['#06100E', '#0A1A16', '#10261E', '#2A2434'], morro: '#121A30', nuv: ['#3A4466', '#252C48', '#1A2038', '#141830'], astro: '#E8ECF8', brilho: '#AFC4F0' },
  { h: 4.6, ceu: ['#0A0E26', '#1A1E44', '#3A3058'], mar: ['#0A1228', '#14223E', '#1E3450'], areia: ['#3A3440', '#544A52', '#2A2430'], ilha: ['#0A1410', '#10201A', '#182E24', '#3A3040'], morro: '#1E2440', nuv: ['#6A5A80', '#3A3A60', '#2A2C4C', '#222440'], astro: '#E8ECF8', brilho: '#B0B8E0' },
  { h: 6, ceu: ['#3A4C8A', '#C8708A', '#FFB070'], mar: ['#3A3E6A', '#6A5E84', '#B08A8C'], areia: ['#9A7A70', '#D8A890', '#7A5A58'], ilha: ['#1E3424', '#2E4C30', '#486A3A', '#9A6070'], morro: '#7A6A98', nuv: ['#FFE0C0', '#F0A8A0', '#B87890', '#8A5A7A'], astro: '#FFE4A8', brilho: '#FFD8A0' },
  { h: 8.5, ceu: ['#3A80D0', '#7AB4E8', '#C8E4F4'], mar: ['#1A5C8A', '#2490A8', '#40C8C0'], areia: ['#C89A70', '#F4D2A0', '#A87A58'], ilha: ['#1E4A26', '#30702E', '#5A9A3A', '#C86A80'], morro: '#7A9CC0', nuv: ['#FFFFFF', '#EEF6FC', '#BFD8EE', '#9CC0E0'], astro: '#FFF8D8', brilho: '#FFFFFF' },
  { h: 12.5, ceu: ['#1E6AD0', '#4AA0EC', '#A8DCF8'], mar: ['#0E4E86', '#1890B0', '#3ED6C8'], areia: ['#D0A070', '#F8D8A8', '#B08060'], ilha: ['#1A4824', '#2C6E2C', '#58A03A', '#D27088'], morro: '#6A94C4', nuv: ['#FFFFFF', '#F2F8FE', '#C4DCF0', '#A0C2E2'], astro: '#FFFDE8', brilho: '#FFFFFF' },
  { h: 16, ceu: ['#2A68C0', '#6AA6E0', '#E8D8B0'], mar: ['#145484', '#2A88A0', '#58C0B0'], areia: ['#C89060', '#F0C890', '#A07050'], ilha: ['#1E4422', '#346A2A', '#6A9838', '#C86A78'], morro: '#7890B8', nuv: ['#FFF6E0', '#F0EAD8', '#C8C8D8', '#A8B0C8'], astro: '#FFF0C0', brilho: '#FFF4D0' },
  { h: 18, ceu: ['#3A3A78', '#D06A70', '#FFAA50'], mar: ['#2A2E5A', '#7A4E6A', '#D08060'], areia: ['#A06A58', '#E0A070', '#704848'], ilha: ['#141E1E', '#22302A', '#3A4A30', '#6A3A4A'], morro: '#5A4A78', nuv: ['#FFD8A0', '#F09878', '#A85A78', '#6A3A60'], astro: '#FFC870', brilho: '#FFC070' },
  { h: 19.6, ceu: ['#141A40', '#3A2C5A', '#904A6A'], mar: ['#0E1430', '#222A4A', '#3A3A58'], areia: ['#4A3A48', '#6A5058', '#2E2432'], ilha: ['#080E10', '#0E1816', '#16221C', '#2A2234'], morro: '#2A2448', nuv: ['#8A6A90', '#4A3E68', '#30284C', '#221C3A'], astro: '#F0E8E0', brilho: '#C8A8C8' },
  { h: 21, ceu: ['#05081A', '#0B1430', '#1A2448'], mar: ['#060C1E', '#0A1A34', '#123048'], areia: ['#2A2632', '#3E3844', '#1E1A24'], ilha: ['#06100E', '#0A1A16', '#10261E', '#2A2434'], morro: '#121A30', nuv: ['#3A4466', '#252C48', '#1A2038', '#141830'], astro: '#E8ECF8', brilho: '#AFC4F0' }
];
function paleta(hh, chuva) {
  let a = HORAS[HORAS.length - 1], b = HORAS[0], k = 0;
  for (let i = 0; i < HORAS.length - 1; i++) if (hh >= HORAS[i].h && hh < HORAS[i + 1].h) { a = HORAS[i]; b = HORAS[i + 1]; k = (hh - a.h) / (b.h - a.h); break; }
  if (hh >= HORAS[HORAS.length - 1].h) { a = HORAS[HORAS.length - 1]; b = HORAS[0]; k = 0; }
  const m = (x, y) => Array.isArray(x) ? x.map((c, i) => mix(c, y[i], k)) : mix(x, y, k), P = {};
  for (const key of Object.keys(a)) if (key !== 'h') P[key] = m(a[key], b[key]);
  if (chuva > 0.05) { const cz = c => mix(c, '#5A6270', chuva * 0.6); for (const key of ['ceu', 'mar', 'nuv']) P[key] = P[key].map(cz); P.morro = cz(P.morro); P.brilho = mix(P.brilho, '#8A94A4', chuva); }
  return P;
}
const fase = hh => ({ noite: hh < 5 || hh >= 19.8, aurora: hh >= 5 && hh < 7.2, poente: hh >= 17 && hh < 19.8 });

/* ---------------- o que é parado: montado pixel a pixel ---------------- */
let fundo = null, chaveFundo = '';
function montarFundo(vw, vh, P, F) {
  // duas camadas: o céu (atrás de tudo) e a terra e o mar (na frente do sol, da lua e das nuvens)
  const cvC = document.createElement('canvas'), cvT = document.createElement('canvas'); cvC.width = cvT.width = vw; cvC.height = cvT.height = vh;
  const imgC = cvC.getContext('2d').createImageData(vw, vh), imgT = cvT.getContext('2d').createImageData(vw, vh); let d = imgC.data;
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= vw || y >= vh) return; const i = (y * vw + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
  const faixas = (y0, y1, cores, x0 = 0, x1 = vw) => { const C = cores.map(rgb), n = C.length - 1; for (let y = y0; y < y1; y++) { const f = (y - y0) / Math.max(1, y1 - y0) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i; for (let x = x0; x < x1; x++) set(x, y, BAYER[(y & 3) * 4 + (x & 3)] < t ? C[i + 1] : C[i]); } };
  const hz = Math.round(vh * 0.5), praia = Math.round(vh * 0.8);
  // o céu: cinco faixas (topo, entre, meio, entre, horizonte)
  faixas(0, hz, [P.ceu[0], mix(P.ceu[0], P.ceu[1], 0.5), P.ceu[1], mix(P.ceu[1], P.ceu[2], 0.6), P.ceu[2]]);
  d = imgT.data; // daqui para baixo, a terra e o mar
  // os morros azulados ao longe, à direita, quase da cor do céu
  const cM = rgb(P.morro), cM2 = rgb(mix(P.morro, P.ceu[2], 0.35));
  for (let x = Math.round(vw * 0.52); x < vw; x++) { const u = (x - vw * 0.52) / (vw * 0.48), alt = Math.round(10 + Math.sin(u * 3.1) * 7 + Math.sin(u * 9 + 1) * 3 + u * 6); for (let y = hz - alt; y < hz; y++) set(x, y, y < hz - alt + 2 ? cM2 : cM); }
  // a ilha à esquerda: morro de mata com a falésia rosada embaixo, contorno pontilhado de copas
  const iw = Math.round(vw * 0.36), I = P.ilha.map(rgb);
  for (let x = 0; x < iw + 14; x++) { const u = x / iw, topo = Math.round(hz - 14 - Math.max(0, Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, u) * 1.05 - 0.05, 2))) * 54) - (h(x >> 2) > 0.6 ? 2 : 0) + (u > 1 ? (u - 1) * 80 : 0));
    const falesia = hz - 12 + Math.round(Math.max(0, u - 0.7) * 22) + Math.round(Math.sin(x * 0.11) * 2 + (h(x >> 3) > 0.6 ? -2 : 0)); // a borda da falésia, irregular
    for (let y = topo; y < falesia; y++) { const n = h(x * 13 + y * 7), sombra = (x + (y - topo) * 0.6) / (iw * 1.2); set(x, y, y < topo + 2 ? I[2] : n < 0.18 ? I[0] : sombra > 0.75 ? I[0] : n > 0.7 && sombra < 0.4 ? I[2] : I[1]); }
    for (let y = Math.max(topo, falesia); y < hz; y++) { const rach = h((x >> 2) * 7) > 0.78 && y > falesia + 1 && (y + x) % 3 !== 0, estrato = (y - falesia + Math.round(Math.sin(x * 0.08) * 2)) % 4 === 0, sombraR = estrato || x > iw * 0.92; set(x, y, rach ? rgb(mix(P.ilha[3], '#000000', 0.45)) : y === Math.max(topo, falesia) ? rgb(mix(P.ilha[3], '#FFFFFF', 0.2)) : sombraR ? rgb(mix(P.ilha[3], '#000000', 0.22)) : I[3]); } } // a falésia de pedra rosada, com rachaduras e sombra
  // pedras soltas na água junto da ilha, com espuma
  for (let k = 0; k < 4; k++) { const px = Math.round(iw * (0.86 + k * 0.07)), r = 3 - (k % 2); for (let y = -r; y <= 0; y++) for (let x = -r - 1; x <= r + 1; x++) if (x * x * 0.6 + y * y <= r * r) set(px + x, hz + 1 + y, y === -r ? rgb(mix(P.ilha[3], '#FFFFFF', 0.15)) : rgb(mix(P.ilha[3], '#000000', 0.3))); }
  // copas redondas por cima da mata da ilha e duas palmeiras na ponta
  for (let k = 0; k < 9; k++) { const cx = Math.round(14 + k * (iw - 30) / 8 + h(k) * 8), u = cx / iw, cy = Math.round(hz - 8 - Math.sqrt(Math.max(0, 1 - Math.pow(u * 1.05 - 0.05, 2))) * 58) + 2, r = 5 + Math.round(h(k * 3) * 4);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r && cy + y < hz - 8) set(cx + x, cy + y, y < -r * 0.3 && x < r * 0.3 ? I[2] : y > r * 0.4 ? I[0] : I[1]); }
  for (const [px, alt, inc] of [[iw - 10, 30, 5], [iw + 2, 24, 7], [iw - 22, 22, -3]]) { const base = hz - 12; // palmeiras: tronco curvo em anéis e um leque de folhas largas caindo
    for (let k = 0; k < alt; k++) { const tx = px + Math.round(Math.sin(k / alt * 1.4) * inc), cT = k % 3 === 0 ? I[0] : rgb(mix(P.ilha[0], P.areia[2], 0.4)); set(tx, base - k, cT); set(tx + 1, base - k, cT); }
    const tx = px + Math.round(Math.sin(1.4) * inc) + 1, ty = base - alt;
    for (const [ang, comp] of [[-2.7, 12], [-2.2, 11], [-1.6, 8], [-1.0, 11], [-0.45, 12], [0.1, 9], [-3.1, 9]]) for (let k = 0; k <= comp; k++) { const u = k / comp, x = Math.round(tx + Math.cos(ang) * k), y = Math.round(ty + Math.sin(ang) * k * 0.55 + u * u * 6), lg = Math.round((1 - Math.abs(u - 0.4)) * 2);
      for (let q = -lg; q <= lg; q++) set(x, y + q, q < 0 ? I[2] : q > 0 ? I[0] : I[1]); }
    set(tx, ty + 1, rgb(mix(P.areia[2], '#3A2A1A', 0.5))); set(tx + 1, ty + 2, rgb(mix(P.areia[2], '#3A2A1A', 0.5))); } // os cocos

  // o mar: faixas do horizonte até a beira
  faixas(hz, praia, [P.mar[0], P.mar[0], P.mar[1], mix(P.mar[1], P.mar[2], 0.5), P.mar[2]]);
  for (let x = 0; x < vw; x++) set(x, hz, rgb(mix(P.mar[0], P.ceu[2], 0.5))); // a linha do horizonte
  // a areia: molhada (mais escura e lisa) e seca, em listras de vento, com sombras pontilhadas e conchinhas
  const A = P.areia.map(rgb); faixas(praia, praia + 10, [P.areia[0], mix(P.areia[0], P.areia[1], 0.5)]);
  for (let y = praia + 10; y < vh; y++) for (let x = 0; x < vw; x++) { const ond = Math.round(Math.sin(x * 0.045 + y * 0.6) * 2), faixa = Math.floor((y + ond) / 5) % 3; set(x, y, faixa === 0 && BAYER[(y & 3) * 4 + (x & 3)] < 0.5 ? A[2] : A[1]); }
  for (let i = 0; i < 40; i++) { const x = Math.round(h(i * 11) * vw), y = Math.round(praia + 14 + h(i * 5) * (vh - praia - 16)); set(x, y, rgb(mix(P.areia[1], '#FFFFFF', 0.4))); set(x + 1, y, rgb(mix(P.areia[1], '#E8A0A0', 0.3))); }
  cvC.getContext('2d').putImageData(imgC, 0, 0); cvT.getContext('2d').putImageData(imgT, 0, 0);
  return { ceu: cvC, terra: cvT, hz, praia };
}

/* ---------------- nuvens (cúmulos de base reta), coloridas pela hora ---------------- */
let nuvCache = null, chaveNuv = '';
function nuvens(vw, P) {
  const W = vw * 2, H = 110, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const [luz, corpo, sombra, base] = P.nuv; let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let q = 0; q < 7; q++) { const w = 60 + rng() * 120, x0 = (q + rng() * 0.5) * (W / 7), B = Math.round(30 + rng() * 70), bumps = [];
    const nb = 3 + Math.floor(rng() * 3); for (let b = 0; b < nb; b++) { const u = (b + 0.5) / nb, r = w * (0.13 + Math.sin(u * Math.PI) * 0.14) * (0.85 + rng() * 0.3); bumps.push({ cx: x0 + u * w, cy: B - r * 0.3, r }); }
    const ns = 1 + Math.floor(rng() * 3); for (let b = 0; b < ns; b++) { const u = 0.3 + rng() * 0.4, r = w * (0.11 + rng() * 0.08); bumps.push({ cx: x0 + u * w, cy: B - r * 0.3 - w * (0.13 + rng() * 0.08), r }); }
    bumps.sort((a, b) => b.cy - a.cy);
    for (let y = Math.floor(Math.min(...bumps.map(b => b.cy - b.r))); y <= B; y++) for (let x = Math.floor(x0 - 4); x <= x0 + w + 4; x++) {
      let dono = -1; for (let b = bumps.length - 1; b >= 0; b--) { const o = bumps[b]; if ((x - o.cx) ** 2 + (y - o.cy) ** 2 <= o.r * o.r) { dono = b; break; } } if (dono < 0) continue;
      const o = bumps[dono], dx = (x - o.cx) / o.r, dy = (y - o.cy) / o.r; let sobre = false; if (Math.hypot(dx, dy) > 0.93 && dy > -0.1) for (let b = 0; b < dono; b++) { const u = bumps[b]; if ((x - u.cx) ** 2 + (y - u.cy) ** 2 <= u.r * u.r) { sobre = true; break; } }
      g.fillStyle = y >= B - 1 ? base : sobre ? sombra : (dx + 0.22) ** 2 + (dy + 0.3) ** 2 > 0.85 ? sombra : (dx + 0.3) ** 2 + (dy + 0.42) ** 2 < 0.25 ? luz : corpo; g.fillRect(((x % W) + W) % W, y, 1, 1); }
    g.fillStyle = base; for (let x = x0 - w * 0.1; x < x0 + w * 1.1; x += 1) if (rng() < 0.8) g.fillRect(((Math.round(x) % W) + W) % W, B + 1, 1, 1); }
  for (let f = 0; f < 6; f++) { const fw = 20 + rng() * 60, fx = rng() * W, fy = 4 + Math.round(rng() * 22); g.fillStyle = corpo; g.fillRect(fx, fy, fw, 1); g.fillStyle = luz; g.fillRect(fx + 4, fy - 1, fw * 0.5, 1); }
  return cv;
}

/* ---------------- a cada quadro ---------------- */
export function pintarVista(g, G, vw, vh, Tm, entrada) {
  const hh = ((G.cm.relogio || 0) / 600 * 24 + 7) % 24, chuva = Math.min(1, G.chuvaK || 0), F = fase(hh), P = paleta(hh, chuva);
  const chave = vw + 'x' + vh + ':' + Math.round(hh * 6) + ':' + Math.round(chuva * 4);
  if (!fundo || chaveFundo !== chave) { fundo = montarFundo(vw, vh, P, F); chaveFundo = chave; }
  if (!nuvCache || chaveNuv !== chave) { nuvCache = nuvens(vw, P); chaveNuv = chave; }
  const { hz, praia } = fundo; g.globalAlpha = 1; g.drawImage(fundo.ceu, 0, 0);
  // as estrelas (de noite e na aurora, sumindo)
  const escuro = F.noite ? 1 : F.aurora ? Math.max(0, 1 - (hh - 5) / 1.4) : hh >= 19.2 ? (hh - 19.2) / 0.6 : 0;
  if (escuro > 0) for (let i = 0; i < 140; i++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(Tm * (0.6 + h(i) * 1.5) + i)); g.globalAlpha = escuro * tw * (1 - chuva); g.fillStyle = i % 9 ? '#F2F4FF' : '#FFD8B0'; const x = Math.round(h(i * 3) * vw), y = Math.round(h(i * 7) * (hz - 10)); g.fillRect(x, y, 1, 1); if (i % 31 === 0) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
  g.globalAlpha = 1;
  // o sol (sobe à esquerda na aurora, alto ao meio-dia, se põe à direita) ou a lua; anéis de luz em pixel
  const dia = hh >= 5.2 && hh < 19.6, k = dia ? (hh - 5.2) / 14.4 : ((hh + 24 - 19.6) % 24) / 9.6, ax = Math.round(vw * (0.12 + 0.76 * k)), ay = Math.round(hz - 6 - Math.sin(k * Math.PI) * (hz - 40)), cor = P.astro, raio = dia ? 12 : 9;
  if (chuva < 0.7) { for (let r = raio + 14; r > raio; r -= 4) { g.globalAlpha = (1 - chuva) * 0.12; g.fillStyle = cor; g.beginPath(); g.arc(ax, ay, r, 0, 6.29); g.fill(); }
    g.globalAlpha = 1 - chuva * 0.8; g.fillStyle = cor; for (let y = -raio; y <= raio; y++) { const w = Math.round(Math.sqrt(raio * raio - y * y)); g.fillRect(ax - w, ay + y, w * 2, 1); }
    if (!dia) { g.fillStyle = mix(cor, '#8890A8', 0.4); g.fillRect(ax - 3, ay - 3, 3, 2); g.fillRect(ax + 2, ay + 2, 2, 2); g.fillRect(ax - 5, ay + 3, 2, 1); } // as manchas da lua
    else { g.fillStyle = mix(cor, '#FFFFFF', 0.6); g.fillRect(ax - 4, ay - 5, 4, 2); } g.globalAlpha = 1; }
  // as nuvens, devagar, por cima do céu (atrás da ilha não: a ilha é do fundo, mas as nuvens ficam acima do horizonte)
  g.save(); g.beginPath(); g.rect(0, 0, vw, hz - 4); g.clip(); const off = Math.round((Tm * 2.2) % (vw * 2)); g.globalAlpha = 1 - chuva * 0.2; g.drawImage(nuvCache, -off, 0); g.drawImage(nuvCache, vw * 2 - off, 0); g.restore(); g.globalAlpha = 1;
  g.drawImage(fundo.terra, 0, 0); // a ilha, os morros, o mar e a areia: na frente do sol, da lua e das nuvens
  // o caminho de luz na água, debaixo do sol ou da lua: riscos que tremem, mais largos perto
  if (chuva < 0.8 && ay < hz + 2) { g.fillStyle = P.brilho; for (let y = hz + 1; y < praia - 2; y += 2) { const t = (y - hz) / (praia - hz), w = Math.round(2 + t * 18), j = Math.round(Math.sin(Tm * 3 + y * 0.9) * (1 + t * 3)); g.globalAlpha = (1 - chuva) * (0.75 - t * 0.35);
      if (h(y + Math.floor(Tm * 4)) > 0.25) g.fillRect(ax - w + j, y, Math.round(w * 0.7), 1); if (h(y * 3 + Math.floor(Tm * 5)) > 0.35) g.fillRect(ax + Math.round(w * 0.2) + j, y, Math.round(w * 0.6), 1); } g.globalAlpha = 1; }
  // as cristas das ondas: riscos claros, pequenos longe e maiores perto, que andam devagar
  for (let i = 0; i < 70; i++) { const t = h(i + 3), y = Math.round(hz + 3 + t * t * (praia - hz - 8)), w = 2 + Math.round(t * 9), x = Math.round(((h(i) * vw * 1.3 + Tm * (2 + t * 6) * (i % 2 ? 1 : -1)) % vw + vw) % vw);
    g.globalAlpha = 0.35 + t * 0.4; g.fillStyle = mix(P.mar[2], '#FFFFFF', 0.45 + t * 0.2); g.fillRect(x, y, w, 1); if (t > 0.6) { g.globalAlpha *= 0.6; g.fillStyle = mix(P.mar[0], '#000000', 0.2); g.fillRect(x + 1, y + 1, w - 1, 1); } }
  g.globalAlpha = 1;
  // um barco a vela passando ao longe, e um segundo, menor, mais longe
  for (const [vel, esc, yy, fase2] of [[2.2, 1, hz - 1, 0], [1.1, 0.6, hz - 1, 300]]) { const bx = Math.round(((Tm * vel + fase2) % (vw + 80)) - 40), cB = mix(P.mar[0], '#0A0C14', 0.5), cV = mix(P.ceu[2], '#FFFFFF', 0.5);
    const s = n => Math.max(1, Math.round(n * esc)); g.fillStyle = cB; g.fillRect(bx - s(6), yy, s(13), s(2)); g.fillRect(bx - s(4), yy + s(2), s(9), 1); g.fillRect(bx, yy - s(12), 1, s(12)); g.fillStyle = cV; for (let i = 0; i < s(10); i++) g.fillRect(bx + 1, yy - s(11) + i, Math.max(1, s(7) - Math.round(i * 0.6)), 1); }
  // a espuma que vem e volta na areia molhada, deixando a areia escura por onde passou
  const vai = Math.sin(Tm * 0.7) * 0.5 + 0.5, alc = Math.round(praia - 4 + vai * 12);
  g.fillStyle = mix(P.mar[2], P.areia[0], 0.5); g.globalAlpha = 0.7; g.fillRect(0, praia - 2, vw, Math.max(1, alc - praia + 4)); g.globalAlpha = 1;
  for (let x = 0; x < vw; x++) { const y = alc + Math.round(Math.sin(x * 0.07 + Tm * 0.9) * 2 + Math.sin(x * 0.19 - Tm) * 1); g.fillStyle = mix(P.mar[2], '#FFFFFF', 0.85); if (h(x * 5 + Math.floor(Tm * 2)) > 0.12) g.fillRect(x, y, 1, 1); if (h(x * 7) > 0.55) { g.globalAlpha = 0.55; g.fillRect(x, y - 1 - Math.round(h(x) * 2), 1, 1); g.globalAlpha = 1; } }
  // de noite, um brilho azul nas ondas da beira (o mar fosforescente)
  if (escuro > 0.3) for (let i = 0; i < 26; i++) { const x = Math.round(h(i * 17) * vw), y = alc - 2 - Math.round(h(i * 3) * 6); g.globalAlpha = escuro * (0.3 + 0.5 * Math.abs(Math.sin(Tm * 2 + i))); g.fillStyle = '#7AF0FF'; g.fillRect(x, y, 1, 1); } g.globalAlpha = 1;
  // gaivotas cruzando de dia
  if (!F.noite) for (let i = 0; i < 3; i++) { const P2 = 13 + i * 5, u = ((Tm + i * 5.7) % P2) / P2, x = Math.round(vw + 20 - u * (vw + 60)), y = Math.round(hz * (0.25 + i * 0.16) + Math.sin(Tm * 1.3 + i) * 5), bate = Math.sin(Tm * 6 + i * 2) > 0;
    g.fillStyle = F.poente ? '#2A1E2A' : '#3A4050'; g.fillRect(x - 1, y, 3, 1); if (bate) { g.fillRect(x - 3, y - 1, 2, 1); g.fillRect(x - 4, y - 2, 1, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x + 4, y - 2, 1, 1); } else { g.fillRect(x - 4, y, 3, 1); g.fillRect(x + 2, y, 3, 1); } }
  // o capim da praia nas pontas de baixo, balançando com o vento
  for (const [lado, n] of [[0, 14], [1, 10]]) for (let i = 0; i < n; i++) { const bx = lado ? vw - 4 - i * 4 - Math.round(h(i) * 3) : 4 + i * 4 + Math.round(h(i + 9) * 3), alto = 10 + Math.round(h(i * 5 + lado) * 14), bal = Math.sin(Tm * 1.8 + i * 0.7) * 3;
    g.fillStyle = mix(P.ilha[1], P.areia[2], 0.25); for (let k = 0; k < alto; k++) { const u = k / alto; g.fillRect(Math.round(bx + bal * u * u), vh - 1 - k, u < 0.6 ? 2 : 1, 1); } g.fillStyle = mix(P.ilha[2], P.areia[1], 0.2); g.fillRect(Math.round(bx + bal), vh - alto, 1, 3); }
  // a chuva caindo no mar
  if (chuva > 0.05) { g.fillStyle = '#C8D4E4'; for (let i = 0; i < 120 * chuva; i++) { const x = ((h(i) * vw * 1.3 - Tm * 90) % vw + vw) % vw, y = (h(i * 3) * vh + Tm * (260 + h(i) * 80)) % vh; g.globalAlpha = 0.35; g.fillRect(Math.round(x), Math.round(y), 1, 4); } g.globalAlpha = 1; }
  // a entrada (um piscar de olhos) e o lembrete de que qualquer tecla levanta
  if (entrada < 1) { g.globalAlpha = 1 - entrada; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, vh); }
  g.globalAlpha = 0.45 + 0.15 * Math.sin(Tm * 2); g.fillStyle = '#FFFFFF'; for (let i = 0; i < 3; i++) g.fillRect(vw - 14 + i * 4, vh - 8, 2, 2); g.globalAlpha = 1;
}
