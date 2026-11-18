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
import { pintarVista as vistaNova } from './vista.js';

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
  carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'praia-eu', pose), X(p.x), Y(p.y) - 5, 24, 40, -1); /* olhando para o mar, à esquerda */
}
// por cima de tudo
export function pintarPraia(g, G, X, Y, vw, vh, Tm) {
  const C = G.cenaPraia; if (!C) return;
  if (C.modo === 'vista') { vistaNova(g, G, vw, vh, Tm, Math.min(1, C.mt / 1.2)); return; }
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

