// Orar na sinagoga é uma cena: o peregrino caminha devagar até diante da arca, ajoelha, a casa escurece e um feixe de luz
// desce da janela alta sobre ele. A oração vem em frases (adoração, perdão, gratidão, pedido), depois o silêncio, e a resposta.
// Fôlegos e lâmpada cheios; uma porção de maná por dia; de madrugada, conta como vigília.
import { sfx, music } from '../audio.js';
import { quadroPessoa } from './pixel/humano.js';
import { carimbar } from './pixel/raster.js';

const pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PEDIDOS = ['Dá-me forças para o que vem pela frente.', 'Guarda os que eu amo, perto e longe.', 'Ensina-me a esperar sem perder a fé.', 'Que a minha lâmpada não se apague no escuro.', 'Livra-me do que me puxa para trás.'];
const RESPOSTAS = ['"Invoca-me, e te responderei" (Jr 33:3).', '"Vinde a mim, todos os que estais cansados, e eu vos aliviarei" (Mt 11:28).', '"Os que esperam no Senhor renovam as suas forças" (Is 40:31).', '"Aquietai-vos, e sabei que eu sou Deus" (Sl 46:10).', '"E a paz de Deus, que excede todo o entendimento, guardará o vosso coração" (Fp 4:7).'];
const ANDA = 1.6, AJOELHA = 2.3, ESCURO = 2.8, FRASE = 2.6, N = 4, SILENCIO = ESCURO + N * FRASE, RESPOSTA = SILENCIO + 1.8, FIM = RESPOSTA + 3.4;

export const rotuloOracao = ob => ob.tipo === 'lugarOracao' ? 'Ajoelhar e orar' : undefined;
export function comecarOracao(G, ob) {
  if (G.cenaOracao) return;
  const frases = ['Pai nosso, que estás nos céus, santificado seja o teu nome.', 'Perdoa as minhas dívidas, assim como eu perdoo a quem me deve.', 'Obrigado pelo pão de hoje, e por cada passo do caminho até aqui.', pick(PEDIDOS)];
  G.cenaOracao = { t: 0, x: ob.x, y: ob.y, frases, resposta: pick(RESPOSTAS), ajoelha: false };
  G.cena = true; G.cenaMx = 0; G.p.atk = null; music('mundo', 'sinagoga');
}
export function passoOracao(G, dt) {
  const C = G.cenaOracao; if (!C) return; const p = G.p; C.t += dt;
  if (C.t < ANDA) { const d = C.x - p.x; G.cenaMx = Math.abs(d) > 4 ? Math.sign(d) * 0.35 : 0; if (Math.abs(d) <= 4) p.x = C.x; } // devagar, até diante da arca
  else { G.cenaMx = 0; p.x = C.x; p.vx = 0; p.face = 1; }
  C.ajoelha = C.t >= AJOELHA && C.t < FIM - 0.6;
  if (!C.som && C.t >= ESCURO) { C.som = 1; sfx('magic'); }
  if (!C.amem && C.t >= RESPOSTA) { C.amem = 1; sfx('sino'); }
  if (Math.random() < dt * 14 && C.t > ESCURO) G.parts.push({ x: C.x + (Math.random() - 0.5) * 60, y: C.y - Math.random() * 20, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 20, t: 2.5, max: 2.5, r: 1, cor: '#FFF1BE', g: 0 }); // a poeira no feixe de luz
  if (C.t >= FIM) acabar(G);
}
function acabar(G) {
  const C = G.cenaOracao, p = G.p, cm = G.cm; G.cenaOracao = null; G.cena = false; G.cenaMx = 0; G.cenaCls = false; document.body.classList.remove('em-cena');
  p.vida = p.vidaMax; p.oleo = G.oleoMax(); G.efeito('cura', p.x, p.y, 1, { gruda: p }); sfx('heal');
  const hoje = Math.floor((cm.relogio || 0) / 600); let extra = '';
  if (cm.oracaoDia !== hoje) { cm.oracaoDia = hoje; cm.mana = (cm.mana || 0) + 1; extra = ' · +1 maná'; }
  G.aoOrar?.(); // de madrugada, conta como vigília
  G.textoEm(p.x, p.y - 90, 'Amém. Fôlegos e lâmpada cheios' + extra, '#FFE9A8', 12); G.salvar(); G.musicaDaArea?.(); void C;
}

/* ---------------- desenho ---------------- */
export function pintarAjoelhado(g, G, X, Y, Tm) { carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'oracao-eu', 'ora'), X(G.p.x), Y(G.p.y), 24, 40, 1); }
// o escuro da casa, o feixe de luz da janela alta, as faixas de cinema e as frases da oração
export function pintarCenaOracao(g, G, vw, vh, X, Y, Tm) {
  const C = G.cenaOracao; if (!C) return;
  const fim = 1 - clamp((C.t - FIM + 0.8) / 0.8, 0, 1), esc = clamp((C.t - ESCURO + 0.6) / 1.2, 0, 1) * fim, px = X(C.x), py = Y(C.y);
  if (esc > 0) { g.globalAlpha = esc * 0.62; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, vh); // a casa escurece
    const gr = g.createLinearGradient(px, 0, px, py); gr.addColorStop(0, 'rgba(255,241,190,0)'); gr.addColorStop(0.35, 'rgba(255,241,190,.18)'); gr.addColorStop(1, 'rgba(255,233,168,.42)');
    g.globalAlpha = esc; g.fillStyle = gr; g.beginPath(); g.moveTo(px - 10, 0); g.lineTo(px + 6, 0); g.lineTo(px + 26, py + 2); g.lineTo(px - 24, py + 2); g.fill(); // o feixe da janela alta
    g.globalAlpha = esc * 0.3; g.fillStyle = '#FFE9A8'; g.beginPath(); g.ellipse(px, py, 30, 4, 0, 0, 6.29); g.fill(); g.globalAlpha = 1;
    carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'oracao-eu', 'ora'), px, py, 24, 40, 1); } // o peregrino por cima do escuro, na luz
  const k = clamp(C.t / 0.8, 0, 1) * fim, fx = Math.round(k * vh * 0.11); g.globalAlpha = 1; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fx, vw, fx);
  // as frases: uma de cada vez, aparecendo e sumindo devagar
  const linha = (txt, t0, dur, cor, tam) => { const u = C.t - t0; if (u < 0 || u > dur) return; const a = Math.min(1, u / 0.6, (dur - u) / 0.6) * fim; g.globalAlpha = a; g.textAlign = 'center'; g.font = tam + 'px "Jersey 15", monospace'; g.fillStyle = '#05060C'; g.fillText(txt, vw / 2 + 1, vh - fx / 2 + 6); g.fillStyle = cor; g.fillText(txt, vw / 2, vh - fx / 2 + 5); g.globalAlpha = 1; g.textAlign = 'left'; };
  C.frases.forEach((f, i) => linha(f, ESCURO + i * FRASE, FRASE, '#F2E9D0', 15));
  linha('…', SILENCIO, RESPOSTA - SILENCIO, '#B8AE96', 18);
  linha(C.resposta, RESPOSTA, FIM - RESPOSTA, '#FFE9A8', 15);
}
