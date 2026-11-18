// A costa vista de lado: onde começa o mar, a terra do fundo (muralhas, colinas, árvores) acaba numa ponta de areia
// e dali em diante só há céu e mar até o horizonte, baixinho, quase na altura do chão. O mar de perto é o do jogo
// (aguaAberta); este é o de longe: faixas que clareiam para o horizonte, ondinhas que ficam menores ao longe,
// o rastro do sol (ou da lua) na água, um barco a vela passando e uma ilhota. Sem "parede de água" atrás de tudo.
const TL = 16; // um tile em pixel de jogo

let oc = null, og = null;
const mix = (a, b, k) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - k) + parseInt(b.substr(1 + i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// onde fica o mar aberto, em x de tela: { de, ate, lado } (lado 1: o mar abre para a direita; -1: para a esquerda)
function faixaDoMar(G, cx, vw) {
  // só conta a água que chega até a beira do mapa: aí o mar segue além, até o horizonte (o cais de Sardes, por exemplo, não)
  const W = G.N.w * 32; let r = null;
  for (const o of G.objs) {
    if (o.tipo !== 'aguaAberta' && o.tipo !== 'mar') continue;
    const cols = o.ate ? o.ate - o.col + 1 : 29 - o.col, a = o.x - 16, b = a + cols * 32;
    if (o.esq && a <= 64) { const c = { de: -1e5, ate: b / 2 - cx, lado: -1 }; if (!r || c.ate > r.ate) r = c; }
    else if (!o.esq && b >= W - 64) { const c = { de: a / 2 - cx, ate: 1e5, lado: 1 }; if (!r || c.de < r.de) r = c; }
  }
  return r && r.ate > -40 && r.de < vw + 140 ? r : null;
}

export function pintarCosta(g, G, C, vw, vh, cx, cy, dy, L, pintarCeu) {
  const M = faixaDoMar(G, cx, vw); if (!M) return;
  if (!oc || oc.width !== vw || oc.height !== vh) { oc = document.createElement('canvas'); oc.width = vw; oc.height = vh; og = oc.getContext('2d'); og.imageSmoothingEnabled = false; }
  og.clearRect(0, 0, vw, vh);
  // 1) o céu inteiro, de novo, sem a terra do fundo
  pintarCeu(og, G, C, vw, dy, cx, cy);
  if (L && L.d > 0) { og.globalAlpha = L.d * 0.16; og.fillStyle = L.poente > 0.3 ? '#F2A65A' : '#DCEBFF'; og.fillRect(0, dy, vw, C.H); og.globalAlpha = 1; } // o mesmo véu de luz do fundo (senão aparece uma emenda no céu)
  if (G.cm && (G.tempoNatal ?? false)) { og.globalAlpha = 0.2; og.fillStyle = '#EAF2FF'; og.fillRect(0, dy, vw, C.H); og.globalAlpha = 1; }
  // 2) o mar de longe: do horizonte (baixo, perto do chão) até a beira
  const chao = 16 * TL - cy, hz = chao - 34, d = L ? L.d : 0.7, po = L ? L.poente : 0, Tm = G.T;
  const corH = mix(mix('#1C2A44', '#9CC4D6', d), '#F0A878', po * 0.7), corP = mix(mix('#08182A', '#2A6A8A', d), '#7A4A5A', po * 0.35);
  // a névoa do horizonte
  for (let i = 0; i < 8; i++) { og.globalAlpha = (8 - i) / 8 * 0.35; og.fillStyle = corH; og.fillRect(0, hz - i - 1, vw, 1); }
  og.globalAlpha = 1;
  for (let y = hz; y < chao + 4; y++) { const t = (y - hz) / (chao - hz); og.fillStyle = mix(corH, corP, Math.pow(t, 0.7)); og.fillRect(0, y, vw, 1); }
  og.fillStyle = mix(corH, '#FFFFFF', 0.35); og.fillRect(0, hz, vw, 1); // a linha do horizonte
  // a ilhota ao longe e o barco a vela que passa devagar
  { const ix = Math.round(((h(3) * 900 - cx * 0.06) % (vw + 200) + vw + 200) % (vw + 200)) - 100, cI = mix(corH, '#2A3A44', 0.45);
    og.fillStyle = cI; for (let i = -22; i <= 22; i++) { const a = Math.round(Math.sqrt(Math.max(0, 1 - (i / 22) ** 2)) * 6); og.fillRect(ix + i, hz - a, 1, a); } og.fillRect(ix + 6, hz - 13, 1, 8); og.fillRect(ix + 3, hz - 14, 7, 1); og.fillRect(ix + 2, hz - 13, 2, 1); og.fillRect(ix + 9, hz - 13, 2, 1); }
  { const bx = Math.round(((Tm * 3 - cx * 0.08 + 400) % (vw + 120) + vw + 120) % (vw + 120)) - 60, by = hz + 5, cB = mix(corH, '#1A2430', 0.6), bal = Math.round(Math.sin(Tm * 1.3));
    og.fillStyle = cB; og.fillRect(bx - 5, by + bal, 11, 2); og.fillRect(bx - 4, by + 2 + bal, 9, 1); og.fillRect(bx, by - 9 + bal, 1, 9); og.fillStyle = mix(corH, '#FFFFFF', 0.55); for (let i = 0; i < 7; i++) og.fillRect(bx + 1, by - 8 + i + bal, Math.max(1, 6 - i), 1); }
  // as ondinhas: poucas e curtas perto do horizonte, mais e maiores perto da beira
  for (let i = 0; i < 90; i++) { const t = h(i + 7), y = Math.round(hz + 2 + t * t * (chao - hz - 2)), w = 1 + Math.round(t * 5), x = Math.round(((h(i) * vw * 1.4 + Tm * (2 + t * 8) * (i % 2 ? 1 : -1) - cx * (0.1 + t * 0.35)) % vw + vw) % vw);
    og.globalAlpha = 0.25 + t * 0.4; og.fillStyle = mix(corP, '#DFF6FA', 0.5 + (1 - t) * 0.2); og.fillRect(x, y, w, 1); }
  og.globalAlpha = 1;
  // o rastro do sol (de dia e no poente) ou da lua (de noite) na água
  if (L) { const dia = L.d > 0.05, k = (L.h - 6) / 13, sx = dia && !L.semSol ? Math.round(vw * (0.12 + 0.76 * k)) : L.semSol ? Math.round(vw * 0.2) : Math.round(vw * 0.72), cS = dia ? (po > 0.3 ? '#FFD08A' : '#FFF4D6') : '#DDE6F4';
    for (let y = hz + 1; y < chao + 2; y += 2) { const t = (y - hz) / (chao - hz), w = Math.round(2 + t * 14 + Math.sin(Tm * 2 + y) * 2); og.globalAlpha = (dia ? 0.55 : 0.3) * (1 - t * 0.5); og.fillStyle = cS; og.fillRect(sx - w + Math.round(Math.sin(Tm * 1.7 + y * 0.7) * 2), y, Math.round(w * 0.6), 1); og.fillRect(sx + Math.round(w * 0.2), y, Math.round(w * 0.5), 1); }
    og.globalAlpha = 1; }
  // gaivotas ao longe
  for (let i = 0; i < 3; i++) { const x = Math.round(((h(i + 40) * vw + Tm * (6 + i * 2) - cx * 0.15) % (vw + 40) + vw + 40) % (vw + 40)) - 20, y = Math.round(dy + 40 + h(i + 50) * 40 + Math.sin(Tm * 0.8 + i) * 4), bate = Math.sin(Tm * 4 + i * 2) > 0;
    og.fillStyle = mix(corH, '#20242C', 0.65); og.fillRect(x - 2, y + (bate ? -1 : 0), 2, 1); og.fillRect(x, y, 1, 1); og.fillRect(x + 1, y + (bate ? -1 : 0), 2, 1); }
  // 3) a terra termina num promontório desenhado: a rocha desce em degraus até o mar, com mato (ou o muro da cidade) por cima,
  //    espuma batendo na base; no ponto mais alto, onde a terra do fundo é cortada, um farol (na cidade) ou um bosque (no campo)
  const F = 170, cidade = (G.tm.skyline || G.tm.deco) === 'casas', pa = Math.round(M.lado > 0 ? M.de : M.ate), lado = M.lado, alto = 64;
  const rocha = [mix(mix('#1A1418', '#6A5246', d), corH, 0.12), mix(mix('#221A1E', '#8A6E5A', d), corH, 0.1), mix(mix('#2A2024', '#A88A70', d), corH, 0.08), mix(mix('#0E0A0E', '#3A2A26', d), corH, 0.06)]; // pedra quente, do mesmo tom das casas
  const verde = [mix(mix('#0C1A14', '#2E5A34', d), corH, 0.2), mix(mix('#102418', '#4A7A40', d), corH, 0.18)], muro = [mix(mix('#1A1418', '#7A6052', d), corH, 0.12), mix(mix('#221A1E', '#A08670', d), corH, 0.1)];
  const perfil = u => { const v = Math.max(0, Math.min(1, (u - 0.12) / 0.88)); return Math.round(hz - alto * Math.pow(1 - v, 1.5) + (v > 0.3 ? Math.round(Math.sin(v * 17) * 2) : 0) - (Math.floor(v * 7) % 2 && v < 0.8 ? 2 : 0)); };
  const colDe = i => pa + lado * i - (lado < 0 ? 1 : 0);
  // do lado do mar, além do promontório: céu e mar por inteiro
  if (lado > 0) { const x0 = Math.max(0, pa + F); if (x0 < vw) g.drawImage(oc, x0, 0, vw - x0, chao + 4, x0, 0, vw - x0, chao + 4); }
  else { const x1 = Math.min(vw, pa - F); if (x1 > 0) g.drawImage(oc, 0, 0, x1, chao + 4, 0, 0, x1, chao + 4); }
  for (let i = 0; i < F; i++) { const x = colDe(i); if (x < 0 || x >= vw) continue; const u = i / F, top = u < 0.06 ? 0 : perfil(Math.max(0.12, u));
    if (top > 0) g.drawImage(oc, x, 0, 1, top, x, 0, 1, top); // o céu volta acima do promontório
    g.drawImage(oc, x, hz, 1, chao + 4 - hz, x, hz, 1, chao + 4 - hz); // e o mar embaixo dele
    if (u < 0.06) continue;
    for (let y = top; y < hz + 2; y++) { const n = h(Math.floor(x / 4) * 3.1 + Math.floor((y + Math.floor(x / 9) * 2) / 3) * 7.7), face = y > top + 4; g.fillStyle = !face ? (cidade ? muro[(x + y) % 3 ? 1 : 0] : verde[n > 0.5 ? 1 : 0]) : ((y + Math.floor(x / 9) * 2) % 7 === 0 ? rocha[0] : n < 0.1 ? rocha[3] : rocha[n > 0.62 ? 2 : 1]); g.fillRect(x, y, 1, 1); }
    g.fillStyle = rocha[3]; g.fillRect(x, top - 1, 1, 1); if (cidade && i % 6 === 0 && u < 0.7) g.fillRect(x, top - 3, 2, 2); // as ameias do muro, até onde ele vai
    if (!cidade && h(x) > 0.82) { g.fillStyle = verde[0]; g.fillRect(x, top - 3, 1, 3); } }
  // a espuma batendo na base da rocha
  for (let i = Math.round(F * 0.3); i < F + 6; i += 2) { const x = colDe(i); if (x < 0 || x >= vw) continue; const k = Math.sin(Tm * 2 + i * 0.3); if (k > 0.2) { g.globalAlpha = 0.5 + k * 0.4; g.fillStyle = '#F4FCFF'; g.fillRect(x, hz + 1 - (k > 0.8 ? 1 : 0), 2, 1); } }
  g.globalAlpha = 1;
  // a peça do alto, que fecha o corte da terra do fundo
  const px = colDe(Math.round(F * 0.1)), base = perfil(0.13) + 2;
  if (cidade) { // o farol: torre de pedra, a galeria, a lanterna (acesa de noite, com o facho girando)
    const W = 12, H = 74, tx = px - (lado > 0 ? 4 : W - 4), ty = base - H, faixaV = mix(mix('#3A1A1A', '#B8423A', d), corH, 0.15), faixaB = mix(mix('#3A3A44', '#E8E2D0', d), corH, 0.15);
    for (let y = ty; y < base; y++) { const k = (y - ty) / H, ww = Math.round(W + k * 6), xx = tx + Math.round((W - ww) / 2); g.fillStyle = rocha[3]; g.fillRect(xx - 1, y, ww + 2, 1); g.fillStyle = Math.floor((y - ty) / 12) % 2 ? faixaV : faixaB; g.fillRect(xx, y, ww, 1); g.fillStyle = rocha[1]; g.fillRect(xx + ww - 3, y, 2, 1); }
    g.fillStyle = rocha[3]; g.fillRect(tx - 8, base - 4, W + 16, 4); g.fillStyle = muro[1]; g.fillRect(tx - 7, base - 3, W + 14, 2);
    g.fillStyle = rocha[3]; g.fillRect(tx - 4, ty - 2, W + 8, 3); g.fillRect(tx + 2, ty - 14, W - 4, 12); g.fillStyle = d < 0.4 ? '#FFE08A' : mix('#8A8A94', '#C9D2E0', d); g.fillRect(tx + 4, ty - 12, W - 8, 8); g.fillStyle = rocha[3]; g.beginPath(); g.moveTo(tx, ty - 14); g.lineTo(tx + W / 2, ty - 22); g.lineTo(tx + W, ty - 14); g.fill();
    if (d < 0.4) { const a = (Tm * 0.8) % (Math.PI * 2), cx0 = tx + W / 2, cy0 = ty - 8, alc = 160, dirx = Math.cos(a) * alc; g.globalAlpha = (0.4 - d) * 0.6 * Math.max(0, Math.cos(a * 0.5) * 0.5 + 0.5); g.fillStyle = '#FFF2C0'; g.beginPath(); g.moveTo(cx0, cy0 - 2); g.lineTo(cx0 + dirx, cy0 - 14); g.lineTo(cx0 + dirx, cy0 + 10); g.lineTo(cx0, cy0 + 2); g.fill(); g.globalAlpha = 1; }
    for (let k = 0; k < 2; k++) { g.fillStyle = rocha[3]; g.fillRect(tx + 5, ty + 20 + k * 26, 2, 4); } }
  else { // o bosque que termina na ponta: copas redondas, mais escuras na frente
    for (let k = 0; k < 7; k++) { const cx0 = px + lado * (k * 9 - 18) + Math.round(h(k) * 6), r = 12 + Math.round(h(k * 3) * 10), cy0 = base - 20 - Math.round(h(k * 5) * 40) + k * 3;
      g.fillStyle = verde[0]; g.fillRect(cx0, cy0, 3, base - cy0); for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); for (let xx = -w; xx <= w; xx++) { if ((xx * xx + yy * yy) > (r - 1) * (r - 1) && (xx + yy) % 2) continue; g.fillStyle = yy < -r * 0.3 ? verde[1] : verde[0]; g.fillRect(cx0 + xx, cy0 + yy, 1, 1); } } } }
}

