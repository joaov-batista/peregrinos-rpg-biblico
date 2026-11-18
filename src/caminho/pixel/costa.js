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
  // 3) por cima do fundo: do lado do mar, inteiro; na ponta da terra, uma passagem suave (a terra some na névoa do mar)
  const F = 90; // largura da passagem
  if (M.lado > 0) { const a = Math.round(M.de); for (let x = Math.max(0, a); x < Math.min(vw, a + F); x += 2) { g.globalAlpha = Math.pow((x - a) / F, 1.4); g.drawImage(oc, x, 0, 2, chao + 4, x, 0, 2, chao + 4); } if (a + F < vw) { g.globalAlpha = 1; const x0 = Math.max(0, a + F); g.drawImage(oc, x0, 0, vw - x0, chao + 4, x0, 0, vw - x0, chao + 4); } }
  else { const b = Math.round(M.ate); for (let x = Math.min(vw, b) - 2; x >= Math.max(0, b - F); x -= 2) { g.globalAlpha = Math.pow((b - x) / F, 1.4); g.drawImage(oc, x, 0, 2, chao + 4, x, 0, 2, chao + 4); } if (b - F > 0) { g.globalAlpha = 1; const x1 = Math.min(vw, b - F); g.drawImage(oc, 0, 0, x1, chao + 4, 0, 0, x1, chao + 4); } }
  g.globalAlpha = 1;
}
