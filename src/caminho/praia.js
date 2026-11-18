// A praia no fim do sítio: um banco virado para o mar. Sentar ali é um daqueles momentos que ficam.
// Ao sentar, a cena começa (faixas de cinema, o vento, a música lenta) e o banco pergunta o que fazer:
//  · Descansar: o fim de tarde, os pelicanos voltando, as falas que aparecem e somem; o peregrino fecha os olhos.
//  · Ver a vista: a tela vira o olhar do peregrino, em primeira pessoa: céu, nuvens, a ilha, o mar em faixas e a areia.
//  · Não fazer nada: só ficar ali, sentado, olhando.
//  · Levantar.
// Para sair de qualquer uma: qualquer tecla (ou um toque na tela).
import { sfx, music } from '../audio.js';
import { dia } from './moradores.js';
import { quadroPessoa } from './pixel/humano.js';
import { carimbar } from './pixel/raster.js';

const FALAS = [
  [3, 'O vento vem do mar, salgado e morno.'],
  [8.5, 'Lá longe, os pelicanos voltam para casa.'],
  [14, 'Por um momento, nada pesa. Você fecha os olhos.'],
  [20, '"Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei" (Mt 11:28).'],
  [26, 'O mar continua. Você também.']
];
const h = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function sentarNaPraia(G, ob) {
  if (G.cenaPraia) return;
  const p = G.p; p.x = ob.x; p.vx = 0; p.face = -1;
  const C = G.cenaPraia = { t: 0, mt: 0, modo: 'escolha', x: ob.x, y: ob.y, fala: 0, ventoT: 0, saiK: 0, pel: Array.from({ length: 6 }, (_, i) => ({ dx: i === 0 ? 0 : Math.ceil(i / 2) * 26, dy: i === 0 ? 0 : Math.ceil(i / 2) * 9, ph: i * 0.7 })) };
  music('mundo', 'praia'); sfx('vento');
  setTimeout(() => perguntar(G, C), 1300);
}
async function perguntar(G, C) {
  if (G.cenaPraia !== C) return;
  const r = await G.ui.dialog({ nome: 'O banco da praia', texto: 'O mar inteiro na sua frente. O que fazer?', voz: false, acoes: [{ label: 'Descansar' }, { label: 'Ver a vista' }, { label: 'Não fazer nada' }, { label: 'Levantar' }] });
  if (G.cenaPraia !== C) return;
  if (r === 'Levantar') return levantar(G);
  C.modo = r === 'Descansar' ? 'descansa' : r === 'Ver a vista' ? 'vista' : 'nada'; C.mt = 0; C.fala = 0;
  // qualquer tecla (ou toque) levanta; espera um instante para a tecla que escolheu a opção não contar
  const sai = () => { if (G.cenaPraia === C && C.mt > 0.7) levantar(G); };
  C.ouvir = sai; addEventListener('keydown', sai); addEventListener('pointerdown', sai);
}
function levantar(G) {
  const C = G.cenaPraia; if (!C) return; const p = G.p, cm = G.cm, hoje = dia(G);
  if (C.ouvir) { removeEventListener('keydown', C.ouvir); removeEventListener('pointerdown', C.ouvir); }
  G.cenaPraia = null; G.pescaTrava = false; music('mundo', 'casa');
  if (C.modo !== 'escolha' && C.mt > 5) { p.vida = p.vidaMax; p.oleo = G.oleoMax(); if (cm.praiaDia !== hoje) { cm.praiaDia = hoje; G.textoEm(p.x, p.y - 90, 'Descansou de verdade: fôlegos e lâmpada cheios', '#FFE9A8', 12); sfx('heal'); } }
  if (!cm.praiaVista && C.mt > 5) { cm.praiaVista = 1; G.ovo?.('praia', 'Um banco, o mar e os pelicanos. "Há tempo de descansar" (Ec 3).'); }
  G.salvar();
}
// a cada quadro, no sítio
export function passoPraia(G, dt) {
  const C = G.cenaPraia; if (!C) return;
  const p = G.p; C.t += dt; C.mt += dt;
  p.x = C.x; p.vx = 0; p.vy = Math.max(0, p.vy); p.atk = null; p.face = -1; G.pescaTrava = true;
  if ((C.ventoT -= dt) <= 0) { C.ventoT = 4 + Math.random() * 3; sfx('vento'); }
  if (C.modo === 'descansa') while (C.fala < FALAS.length && C.mt >= FALAS[C.fala][0]) { const [, txt] = FALAS[C.fala++]; G.textos.push({ x: C.x - 40, y: C.y - 190, txt, cor: '#FFF1D6', tam: 13, t: 5.2 }); }
}
// a luz da cena (o céu do jogo usa isto): no descanso é sempre fim de tarde; nas outras, a hora de verdade
export const luzDaCena = G => G.cenaPraia && G.cenaPraia.modo === 'descansa' ? { d: 0.6, poente: 1, h: 18, semSol: true } : null;

/* ---------------- desenho ---------------- */
// o peregrino sentado no banco: olhando o mar e, descansando, de olhos fechados (a cabeça pende devagar)
export function pintarSentado(g, G, X, Y, Tm) {
  const C = G.cenaPraia, p = G.p, pose = C.modo === 'descansa' && C.mt > 13 ? 'dorme' : 'olha';
  carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'praia-eu', pose), X(p.x), Y(p.y) - 5, 24, 40, -1);
}
// por cima de tudo
export function pintarPraia(g, G, X, Y, vw, vh, Tm) {
  const C = G.cenaPraia; if (!C) return;
  if (C.modo === 'vista') { pintarVista(g, G, vw, vh, Tm, Math.min(1, C.mt / 1.2)); return; }
  const t = C.t, k = Math.min(1, t / 2.5);
  if (C.modo === 'descansa') { // a luz dourada do fim de tarde, o sol baixo e o rastro dele na água
    const gr = g.createLinearGradient(0, 0, 0, vh); gr.addColorStop(0, 'rgba(255,150,80,0.28)'); gr.addColorStop(0.55, 'rgba(255,190,120,0.18)'); gr.addColorStop(1, 'rgba(60,30,60,0.12)');
    const kk = Math.min(1, C.mt / 2); g.globalAlpha = kk; g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
    const sx = Math.round(vw * 0.2), sy = Math.round(vh * 0.5 + C.mt * 0.6);
    for (let r = 26; r > 0; r -= 3) { g.globalAlpha = kk * 0.1; g.fillStyle = '#FFD08A'; g.beginPath(); g.arc(sx, sy, r + 8, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = kk; g.fillStyle = '#FFE2A8'; g.beginPath(); g.arc(sx, sy, 13, 0, Math.PI * 2); g.fill(); g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(sx - 3, sy - 3, 6, 0, Math.PI * 2); g.fill();
    // os pelicanos em V, da direita para a esquerda
    const px0 = vw + 60 - (C.mt - 4) * 26, py0 = vh * 0.24 + Math.sin(C.mt * 0.4) * 6;
    if (C.mt > 4) for (const b of C.pel) { const x = Math.round(px0 + b.dx), y = Math.round(py0 + b.dy + Math.sin(Tm * 1.3 + b.ph) * 2), bate = Math.sin(Tm * 3.2 + b.ph) > 0.35; pelicano(g, x, y, bate, kk); }
  }
  // o vento: riscos claros que passam
  for (let i = 0; i < 22; i++) { const r = (i * 0.618) % 1, x = Math.round(((r * vw * 1.6 - Tm * (110 + r * 80)) % (vw + 40) + vw + 40) % (vw + 40)) - 20, y = Math.round(vh * (0.3 + r * 0.6) + Math.sin(Tm * 2 + i) * 3);
    g.globalAlpha = k * (i % 3 ? 0.22 : 0.4); g.fillStyle = i % 4 ? '#FFF6E6' : '#E8D7A8'; g.fillRect(x, y, i % 3 ? 8 : 2, 1); }
  // as faixas de cinema
  const fx = Math.round(k * vh * 0.12), fb = Math.round(k * vh * 0.035); g.globalAlpha = 1; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fb, vw, fb);
  g.globalAlpha = 1;
}
function pelicano(g, x, y, bate, a) {
  g.globalAlpha = a; g.fillStyle = '#4A3A44'; g.fillRect(x - 4, y - 1, 10, 4); g.fillStyle = '#F2EEE6'; g.fillRect(x - 3, y, 8, 2); g.fillRect(x - 6, y - 1, 3, 2); g.fillStyle = '#F4D0A0'; g.fillRect(x - 6, y - 2, 2, 1);
  g.fillStyle = '#E8A040'; g.fillRect(x - 12, y, 6, 1); g.fillStyle = '#D88A3A'; g.fillRect(x - 11, y + 1, 4, 1); g.fillStyle = '#17121f'; g.fillRect(x - 5, y - 1, 1, 1);
  g.fillStyle = '#F2EEE6'; if (bate) { g.fillRect(x - 1, y - 5, 3, 5); g.fillRect(x + 2, y - 8, 3, 4); g.fillStyle = '#3A3440'; g.fillRect(x + 3, y - 10, 2, 2); } else { g.fillRect(x - 2, y - 1, 3, 1); g.fillRect(x + 1, y - 2, 8, 2); g.fillStyle = '#3A3440'; g.fillRect(x + 9, y - 2, 3, 1); g.fillRect(x + 11, y - 1, 2, 1); }
  g.globalAlpha = 1;
}

/* ---------------- a vista, em primeira pessoa ---------------- */
// o que o peregrino vê do banco: o céu de verdade (manhã azul, poente laranja, noite de estrelas), nuvens grandes e
// pontilhadas que andam devagar, a ilha verde à esquerda com a pedra rosada na base, o mar em faixas (escuro no
// horizonte, turquesa perto), as ondas que chegam e voltam deixando espuma, a areia em listras e uma boia que balança.
const mix = (a, b, k) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - k) + parseInt(b.substr(1 + i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
function luzDaHora(G) { const hh = ((G.cm.relogio || 0) / 600 * 24 + 7) % 24; return { d: Math.max(0, Math.min(1, (hh - 5) / 2, (19.5 - hh) / 2.5)), poente: Math.max(0, 1 - Math.abs(hh - 18) / 1.6), hh }; }
function nuvem(g, x, y, w, a, claro, sombra, seed) { // um cúmulo: muitas bolas juntas, base reta, sombra azulada embaixo, borda pontilhada
  const n = 14, base = y + w * 0.16;
  for (let b = 0; b < n; b++) { const u = b / (n - 1), cx = x + u * w, alto = Math.sin(u * Math.PI) * (0.55 + h(seed * 7 + b) * 0.35), r = w * (0.09 + alto * 0.14), cy = base - r * 0.6 - alto * w * 0.12;
    for (let yy = -r; yy <= r; yy++) { const py = Math.round(cy + yy); if (py > base) continue; for (let xx = -r; xx <= r; xx++) { const dd = (xx * xx + yy * yy) / (r * r); if (dd > 1) continue; const px = Math.round(cx + xx);
      if (dd > 0.8 && (px + py) % 2) continue; g.globalAlpha = a; g.fillStyle = py > base - r * 0.55 ? sombra : claro; g.fillRect(px, py, 1, 1); } } }
  // fiapos pontilhados ao redor (a nuvem se desfazendo no céu)
  for (let i = 0; i < 40; i++) { const px = Math.round(x - w * 0.1 + h(seed * 31 + i) * w * 1.2), py = Math.round(base - h(seed * 17 + i) * w * 0.3 + 4); if ((px + py) % 2) continue; g.globalAlpha = a * 0.6; g.fillStyle = sombra; g.fillRect(px, py, 2, 1); }
  g.globalAlpha = 1;
}
function pintarVista(g, G, vw, vh, Tm, k) {
  const L = luzDaHora(G), d = L.d, po = L.poente, hz = Math.round(vh * 0.52), areia = Math.round(vh * 0.8);
  const c1 = mix(mix('#0A1230', '#1FA8EC', d), '#4A3A7A', po * 0.6), c2 = mix(mix('#1A2A50', '#8ED8F2', d), '#F2A070', po * 0.8);
  g.globalAlpha = 1;
  // o céu
  for (let y = 0; y < hz; y++) { const t = y / hz; g.fillStyle = mix(c1, c2, Math.pow(t, 1.4)); g.fillRect(0, y, vw, 1); }
  if (d < 0.4) for (let i = 0; i < 120; i++) { g.globalAlpha = (0.4 - d) * 2.2 * (0.4 + h(i) * 0.6) * (0.7 + 0.3 * Math.sin(Tm * 2 + i)); g.fillStyle = '#E8EEFF'; g.fillRect(Math.round(h(i * 3) * vw), Math.round(h(i * 7) * hz * 0.9), 1, 1); }
  g.globalAlpha = 1;
  // o sol (ou a lua), baixo quando é poente
  { const sx = Math.round(vw * (d > 0.05 ? 0.66 : 0.3)), sy = Math.round(po > 0.2 ? hz - 18 + (1 - po) * 10 : vh * 0.16), cS = d > 0.05 ? (po > 0.3 ? '#FFD08A' : '#FFF8E0') : '#E8ECF4';
    g.globalAlpha = 0.18; g.fillStyle = cS; g.beginPath(); g.arc(sx, sy, 22, 0, 6.29); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(sx, sy, 10, 0, 6.29); g.fill(); }
  // as nuvens grandes, devagar
  const claro = mix(mix('#3A4A70', '#FFFFFF', d), '#FFE0C8', po * 0.6), sombra = mix(mix('#2A3458', '#BCE6F4', d), '#E09A8A', po * 0.6);
  for (let i = 0; i < 4; i++) { const w = 110 + h(i + 2) * 150, x = ((h(i) * vw * 1.5 + Tm * (2 + i * 0.6)) % (vw + w * 1.4)) - w * 0.7, y = 40 + h(i + 9) * (hz - 120); nuvem(g, Math.round(x), Math.round(y), w, 1, claro, sombra, i + 1); }
  // a ilha à esquerda: morro verde com textura, pedra rosada na base
  { const iw = Math.round(vw * 0.36), cV = [mix('#0A2A1A', '#2E7A2E', d), mix('#0E3420', '#4A9A3A', d), mix('#12402A', '#7CC44A', d)];
    for (let x = 0; x < iw; x++) { const u = x / iw, top = Math.round(hz - 6 - Math.pow(1 - u, 1.6) * 62 - Math.sin(u * 18) * 2); for (let y = top; y < hz; y++) { const n = h(x * 13 + y * 7); g.fillStyle = cV[n < 0.25 ? 0 : n < 0.7 ? 1 : 2]; g.fillRect(x, y, 1, 1); } }
    for (let x = 0; x < iw + 6; x++) { g.fillStyle = h(x * 3) > 0.5 ? mix('#5A2A3A', '#E26A8A', d) : mix('#4A2A30', '#C84A6A', d); g.fillRect(x, hz - 3 - (h(x) > 0.7 ? 1 : 0), 1, 3); } }
  // o mar em faixas: escuro no horizonte, turquesa perto
  const m1 = mix(mix('#081830', '#1580A8', d), '#5A4A7A', po * 0.4), m2 = mix(mix('#0C2A44', '#22A8B8', d), '#C07A6A', po * 0.3), m3 = mix(mix('#123A52', '#3ED6C8', d), '#E0A08A', po * 0.25);
  for (let y = hz; y < areia; y++) { const t = (y - hz) / (areia - hz); g.fillStyle = t < 0.35 ? mix(m1, m2, t / 0.35) : mix(m2, m3, (t - 0.35) / 0.65); g.fillRect(0, y, vw, 1); }
  g.fillStyle = mix(m1, '#FFFFFF', 0.25); g.fillRect(0, hz, vw, 1);
  // o brilho na água: riscos que tremem, mais compridos perto
  for (let i = 0; i < 160; i++) { const t = h(i + 5), y = Math.round(hz + 2 + t * t * (areia - hz - 18)), w = 2 + Math.round(t * 10), x = Math.round(((h(i) * vw + Tm * (4 + t * 10) * (i % 2 ? 1 : -1)) % vw + vw) % vw);
    g.globalAlpha = 0.25 + 0.35 * t * (0.6 + 0.4 * Math.sin(Tm * 3 + i)); g.fillStyle = i % 5 ? mix(m2, '#FFFFFF', 0.35) : '#FFFFFF'; g.fillRect(x, y, w, 1); }
  g.globalAlpha = 1;
  // a boia que balança, lá no meio
  { const bx = Math.round(vw * 0.85), by = Math.round(hz + (areia - hz) * 0.38 + Math.sin(Tm * 1.5) * 2); g.fillStyle = '#17121f'; g.fillRect(bx - 5, by - 6, 11, 10); g.fillStyle = mix('#1A4A3A', '#3AA878', d); g.fillRect(bx - 4, by - 5, 9, 8); g.fillStyle = mix('#3A6A5A', '#A8F0D0', d); g.fillRect(bx - 3, by - 4, 2, 2); g.fillRect(bx + 1, by - 1, 2, 2); g.fillRect(bx - 1, by - 2, 2, 2); g.globalAlpha = 0.4; g.fillStyle = '#FFFFFF'; g.fillRect(bx - 7, by + 4, 15, 1); g.globalAlpha = 1; }
  // as ondas que chegam: uma linha de espuma desce até a areia, se espalha e volta
  for (let i = 0; i < 3; i++) { const P = 4.2, u = ((Tm + i * P / 3) % P) / P, y = Math.round(areia - 26 + u * 30), a = Math.min(1, u * 3) * (1 - Math.max(0, (u - 0.75) / 0.25));
    for (let x = 0; x < vw; x++) { const oy = Math.round(Math.sin(x * 0.05 + i * 2 + Tm * 0.8) * 2 + Math.sin(x * 0.13 - Tm) * 1); if (h(x + i * 999) > 0.15 + u * 0.4) { g.globalAlpha = a * (0.55 + 0.45 * h(x * 3 + i)); g.fillStyle = '#F4FCFF'; g.fillRect(x, y + oy, 1, 1 + (h(x) > 0.6 ? 1 : 0)); } } }
  g.globalAlpha = 1;
  // a areia: molhada na beira, depois listras quentes
  const s1 = mix(mix('#3A3040', '#E8B48A', d), '#E89A70', po * 0.3), s2 = mix(mix('#4A3A48', '#F8D2A6', d), '#F4B48A', po * 0.3), s3 = mix(mix('#2A2430', '#D8A07A', d), '#C8806A', po * 0.3);
  const vai = Math.round(Math.sin(Tm * 0.75) * 3);
  for (let y = areia + vai; y < vh; y++) { const t = (y - areia) / (vh - areia); g.fillStyle = t < 0.08 ? s3 : (Math.floor((y - areia) / 5) % 2 ? s1 : s2); g.fillRect(0, y, vw, 1); }
  for (let i = 0; i < 70; i++) { const x = Math.round(h(i * 11) * vw), y = Math.round(areia + 6 + h(i * 5) * (vh - areia - 8)); g.fillStyle = h(i) > 0.5 ? s3 : mix(s2, '#FFFFFF', 0.3); g.fillRect(x, y, 3 + Math.round(h(i * 2) * 8), 1); }
  // gaivotas passando de vez em quando
  for (let i = 0; i < 2; i++) { const P = 14 + i * 5, u = ((Tm + i * 6) % P) / P, x = Math.round(vw + 20 - u * (vw + 60)), y = Math.round(hz * (0.3 + i * 0.2) + Math.sin(Tm * 1.2 + i) * 4), bate = Math.sin(Tm * 6 + i) > 0;
    g.fillStyle = mix('#3A3A48', '#5A5A6A', d); g.fillRect(x - 3, y + (bate ? -1 : 0), 3, 1); g.fillRect(x, y, 1, 1); g.fillRect(x + 1, y + (bate ? -1 : 0), 3, 1); }
  // a entrada da vista (um piscar) e o lembrete discreto
  if (k < 1) { g.globalAlpha = 1 - k; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, vh); }
  g.globalAlpha = 0.45 + 0.15 * Math.sin(Tm * 2); g.fillStyle = '#FFFFFF'; for (let i = 0; i < 3; i++) g.fillRect(vw - 14 + i * 4, vh - 8, 2, 2); g.globalAlpha = 1;
}
