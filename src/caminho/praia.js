// A praia no fim do sítio: um banco virado para o mar. Sentar ali é um daqueles momentos que ficam:
// a música lenta, o vento, os pelicanos voltando para casa no fim da tarde, e o peregrino fecha os olhos para descansar.
// É uma cena no próprio mundo (não um quadro à parte): faixas de cinema, o sol baixo e as falas que aparecem e somem.
import { sfx, music } from '../audio.js';
import { dia } from './moradores.js';
import { quadroPessoa } from './pixel/humano.js';
import { carimbar } from './pixel/raster.js';

const DUR = 30;
const FALAS = [
  [3, 'O vento vem do mar, salgado e morno.'],
  [8.5, 'Lá longe, os pelicanos voltam para casa.'],
  [14, 'Por um momento, nada pesa. Você fecha os olhos.'],
  [20, '"Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei" (Mt 11:28).'],
  [26, 'O mar continua. Você também.']
];

export function sentarNaPraia(G, ob) {
  if (G.cenaPraia) return;
  const p = G.p; p.x = ob.x; p.vx = 0; p.face = -1;
  G.cenaPraia = { t: 0, x: ob.x, y: ob.y, fala: 0, ventoT: 0, pel: Array.from({ length: 6 }, (_, i) => ({ dx: i === 0 ? 0 : Math.ceil(i / 2) * 26, dy: i === 0 ? 0 : Math.ceil(i / 2) * 9 * (i % 2 ? 1 : 1), ph: i * 0.7 })) };
  music('mundo', 'praia'); sfx('vento');
}
// a cada quadro, no sítio
export function passoPraia(G, dt) {
  const C = G.cenaPraia; if (!C) return;
  const p = G.p, c = G.ctl || {}; C.t += dt;
  p.x = C.x; p.vx = 0; p.vy = Math.max(0, p.vy); p.atk = null; p.face = -1; G.pescaTrava = true;
  if ((C.ventoT -= dt) <= 0) { C.ventoT = 4 + Math.random() * 3; sfx('vento'); }
  while (C.fala < FALAS.length && C.t >= FALAS[C.fala][0]) { const [, txt] = FALAS[C.fala++]; G.textos.push({ x: C.x - 40, y: C.y - 190, txt, cor: '#FFF1D6', tam: 13, t: 5.2 }); }
  const sai = C.t > 4 && (c.interagir || c.pulo || c.atk);
  if (C.t >= DUR || sai) {
    G.cenaPraia = null; G.pescaTrava = false; music('mundo', 'casa');
    const cm = G.cm, hoje = dia(G); p.vida = p.vidaMax; p.oleo = G.oleoMax();
    if (cm.praiaDia !== hoje) { cm.praiaDia = hoje; G.textoEm(p.x, p.y - 90, 'Descansou de verdade: fôlegos e lâmpada cheios', '#FFE9A8', 12); sfx('heal'); }
    if (!cm.praiaVista) { cm.praiaVista = 1; G.ovo?.('praia', 'Um banco, o mar e os pelicanos. "Há tempo de descansar" (Ec 3).'); }
    G.salvar();
  }
}

/* ---------------- desenho ---------------- */
// o peregrino sentado no banco: olhando o mar e, depois, de olhos fechados (a cabeça pende devagar)
export function pintarSentado(g, G, X, Y, Tm) {
  const C = G.cenaPraia, p = G.p, olhos = C.t < 14 ? 'olha' : 'dorme';
  const s = quadroPessoa(G.char.look || {}, Tm, 'praia-eu', olhos);
  carimbar(g, s, X(p.x), Y(p.y) - 5, 24, 40, -1);
}
// por cima de tudo: o sol baixo sobre o mar, o brilho na água, os pelicanos, o vento e as faixas de cinema
export function pintarPraia(g, G, X, Y, vw, vh, Tm) {
  const C = G.cenaPraia; if (!C) return; const t = C.t, k = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 1.5);
  // a luz dourada do fim de tarde
  const gr = g.createLinearGradient(0, 0, 0, vh); gr.addColorStop(0, 'rgba(255,150,80,0.28)'); gr.addColorStop(0.55, 'rgba(255,190,120,0.18)'); gr.addColorStop(1, 'rgba(60,30,60,0.12)');
  g.globalAlpha = k; g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
  // o sol descendo no horizonte, à esquerda, e o rastro dele na água
  const sx = Math.round(vw * 0.2), sy = Math.round(vh * 0.5 + t * 0.9);
  for (let r = 26; r > 0; r -= 3) { g.globalAlpha = k * (r === 26 ? 0.12 : 0.1); g.fillStyle = '#FFD08A'; g.beginPath(); g.arc(sx, sy, r + 8, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = k; g.fillStyle = '#FFE2A8'; g.beginPath(); g.arc(sx, sy, 13, 0, Math.PI * 2); g.fill(); g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(sx - 3, sy - 3, 6, 0, Math.PI * 2); g.fill();
  /* (o sol do relógio fica escondido durante a cena: ver luzDoDia) */
  const hz = Math.round(vh * 0.58); g.fillStyle = '#FFE2A8'; for (let i = 0; i < 16; i++) { const yy = hz + 4 + i * 5, w = 4 + Math.round(Math.sin(Tm * 2 + i) * 3 + i * 1.6); g.globalAlpha = k * (0.55 - i * 0.03); g.fillRect(sx - w, yy, w * 2, 1); }
  // os pelicanos: um bando em V, devagar, da direita para a esquerda; as asas batem e planam
  const px0 = vw + 60 - (t - 4) * 26, py0 = vh * 0.24 + Math.sin(t * 0.4) * 6;
  if (t > 4) for (const b of C.pel) { const x = Math.round(px0 + b.dx), y = Math.round(py0 + b.dy + Math.sin(Tm * 1.3 + b.ph) * 2), bate = Math.sin(Tm * 3.2 + b.ph) > 0.35;
    g.globalAlpha = k; g.fillStyle = '#4A3A44'; g.fillRect(x - 4, y - 1, 10, 4); g.fillStyle = '#F2EEE6'; g.fillRect(x - 3, y, 8, 2); g.fillRect(x - 6, y - 1, 3, 2); g.fillStyle = '#F4D0A0'; g.fillRect(x - 6, y - 2, 2, 1); // corpo branco, o pescoço recolhido
    g.fillStyle = '#E8A040'; g.fillRect(x - 12, y, 6, 1); g.fillStyle = '#D88A3A'; g.fillRect(x - 11, y + 1, 4, 1); g.fillStyle = '#17121f'; g.fillRect(x - 5, y - 1, 1, 1); // o bicão com a bolsa
    g.fillStyle = '#F2EEE6'; if (bate) { g.fillRect(x - 1, y - 5, 3, 5); g.fillRect(x + 2, y - 8, 3, 4); g.fillStyle = '#3A3440'; g.fillRect(x + 3, y - 10, 2, 2); } else { g.fillRect(x - 2, y - 1, 3, 1); g.fillRect(x + 1, y - 2, 8, 2); g.fillStyle = '#3A3440'; g.fillRect(x + 9, y - 2, 3, 1); g.fillRect(x + 11, y - 1, 2, 1); } }
  // o vento: riscos claros que passam e grãos de areia
  for (let i = 0; i < 22; i++) { const r = (i * 0.618) % 1, x = Math.round(((r * vw * 1.6 - Tm * (110 + r * 80)) % (vw + 40) + vw + 40) % (vw + 40)) - 20, y = Math.round(vh * (0.3 + r * 0.6) + Math.sin(Tm * 2 + i) * 3);
    g.globalAlpha = k * (i % 3 ? 0.25 : 0.45); g.fillStyle = i % 4 ? '#FFF6E6' : '#E8D7A8'; g.fillRect(x, y, i % 3 ? 8 : 2, 1); }
  // as faixas de cinema
  const kf = Math.max(0, Math.min(1, t / 1.2, (DUR - t) / 1)), fx = Math.round(kf * vh * 0.12), fb = Math.round(kf * vh * 0.035); g.globalAlpha = 1; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fb, vw, fb);
   // (qualquer botão levanta)
  g.globalAlpha = 1;
}
