// Dormir em casa é uma cena: o peregrino vai até a esteira, deita e se cobre; a noite passa de verdade (o relógio corre,
// a janela escurece e clareia, a vela queima), o galo canta, amanhece e ele se levanta. Fôlegos e lâmpada cheios.
import { sfx } from '../audio.js';
import { quadroPessoa } from './pixel/humano.js';

const DIA = 600, ANDA = 1.1, DEITA = 0.6, PASSA = 4.2, LEVANTA = 0.7;
const T1 = ANDA, T2 = T1 + DEITA, T3 = T2 + 0.3, T4 = T3 + PASSA, T5 = T4 + 1.4, FIM = T5 + LEVANTA;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), suave = k => k * k * (3 - 2 * k);

export function dormir(G, cama) {
  if (G.cenaSono) return;
  const r0 = G.cm.relogio || 0;
  G.cenaSono = { t: 0, cama, r0, alvo: (Math.floor(r0 / DIA) + 1) * DIA, zT: 0, deita: 0, n: 0 };
  G.cena = true; G.cenaMx = 0; G.p.atk = null;
}
// a cada quadro (depois do relógio andar)
export function passoSono(G, dt) {
  const S = G.cenaSono; if (!S) return;
  const p = G.p, cm = G.cm, pe = S.cama.x + 20; S.t += dt; p.atk = null;
  if (S.t < T1) { const d = pe - p.x; G.cenaMx = Math.abs(d) > 6 ? Math.sign(d) * 0.55 : 0; if (Math.abs(d) <= 6) { p.x = pe; p.face = -1; } } // até a esteira
  else { G.cenaMx = 0; p.x = pe; p.vx = 0; p.face = -1; }
  S.deita = S.t < T1 ? 0 : S.t < T2 ? suave((S.t - T1) / DEITA) : S.t < T5 ? 1 : 1 - suave(clamp((S.t - T5) / LEVANTA, 0, 1));
  if (S.t >= T3 && S.t < T4) { const k = suave((S.t - T3) / PASSA); cm.relogio = S.r0 + (S.alvo - S.r0) * k; // a noite passa
    if ((S.zT -= dt) <= 0) { S.zT = 0.75; G.textos.push({ x: S.cama.x - 18, y: S.cama.y - 44, txt: S.n++ % 2 ? 'z' : 'Z', cor: '#C9D2E0', tam: 11 + (S.n % 3) * 2, t: 1.4, vy: -26 }); } }
  if (S.t >= T4 && !S.galo) { S.galo = 1; cm.relogio = S.alvo; sfx('galo'); setTimeout(() => sfx('heal'), 700); }
  if (S.t >= FIM) acordar(G);
}
function acordar(G) {
  const S = G.cenaSono, p = G.p; G.cenaSono = null; G.cena = false; G.cenaMx = 0; G.cenaCls = false; document.body.classList.remove('em-cena');
  p.vida = p.vidaMax; p.oleo = G.oleoMax(); p.face = 1; G.efeito('cura', p.x, p.y, 1, { gruda: p });
  G.textoEm(p.x, p.y - 80, 'Fôlegos e lâmpada cheios', '#FFE9A8', 12);
  G.ui.toast('"As misericórdias do Senhor… renovam-se cada manhã" (Lm 3:22-23).', 5000); G.salvar();
}

/* ---------------- desenho ---------------- */
// o peregrino deitado na esteira: vai tombando para trás, a cabeça no travesseiro, e o cobertor por cima
export function pintarDeitado(g, G, X, Y, Tm) {
  const S = G.cenaSono, k = S.deita, cx = X(S.cama.x), cy = Y(S.cama.y), q = quadroPessoa(G.char.look || {}, k > 0.95 ? 0 : Tm, 'sono-eu').tela();
  g.save(); g.translate(cx + 2, cy - 12 - Math.round(k * 3)); g.rotate(-k * Math.PI / 2); g.drawImage(q, -24, -40); g.restore();
  if (k > 0.85) { g.globalAlpha = (k - 0.85) / 0.15; g.fillStyle = '#17121f'; g.fillRect(cx - 20, cy - 20, 50, 8); g.fillStyle = '#B8A07A'; g.fillRect(cx - 19, cy - 19, 48, 6); g.fillStyle = '#9A8462'; for (let i = -17; i < 28; i += 5) g.fillRect(cx + i, cy - 19, 2, 6); g.fillStyle = '#D8C8A4'; g.fillRect(cx - 19, cy - 19, 48, 1);
    const resp = S.t > T2 && S.t < T5 ? Math.round(Math.sin(S.t * 2.6)) : 0; g.fillStyle = '#B8A07A'; g.fillRect(cx - 12, cy - 20 - resp, 26, 1); g.globalAlpha = 1; } // o cobertor de lã sobe e desce com a respiração
}
// por cima de tudo: as faixas de cinema, o escuro da noite que passa, o relógio e o "amanheceu"
export function pintarSono(g, G, vw, vh, Tm) {
  const S = G.cenaSono; if (!S) return;
  const entra = clamp(S.t / 0.8, 0, 1) * (1 - clamp((S.t - (FIM - 0.5)) / 0.5, 0, 1)), fx = Math.round(entra * vh * 0.11), fb = Math.round(entra * vh * 0.03);
  const noite = S.t > T2 && S.t < T4 + 0.6 ? Math.sin(clamp((S.t - T2) / (T4 + 0.6 - T2), 0, 1) * Math.PI) : 0;
  if (noite > 0) { g.globalAlpha = noite * 0.55; g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, vh); g.globalAlpha = 1; } // o sono: a casa some no escuro
  if (S.t > T4 && S.t < T5 + 0.3) { const a = Math.sin(clamp((S.t - T4) / 1.7, 0, 1) * Math.PI); g.globalAlpha = a * 0.35; g.fillStyle = '#FFE2A8'; g.fillRect(0, 0, vw, vh); g.globalAlpha = 1; } // a luz da manhã entra
  g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fb, vw, fb);
  const hh = ((G.cm.relogio || 0) / DIA * 24 + 7) % 24, rel = String(Math.floor(hh)).padStart(2, '0') + ':' + String(Math.floor((hh % 1) * 60 / 10) * 10).padStart(2, '0');
  g.textAlign = 'center'; g.font = '16px "Jersey 15", monospace';
  if (S.t > T2 && S.t < T5) { g.globalAlpha = clamp((S.t - T2) / 0.5, 0, 1) * (1 - clamp((S.t - T4 - 0.8) / 0.6, 0, 1)); g.fillStyle = '#C9D2E0'; g.fillText(S.t < T4 ? 'a noite passa…  ' + rel : rel, vw / 2, fx / 2 + 5); g.globalAlpha = 1; }
  if (S.t > T4) { const a = clamp((S.t - T4) / 0.4, 0, 1) * (1 - clamp((S.t - FIM + 0.6) / 0.6, 0, 1)); g.globalAlpha = a; g.font = '28px "Jersey 15", monospace'; g.fillStyle = '#17121f'; g.fillText('Amanheceu · dia ' + (Math.floor(S.alvo / DIA) + 1), vw / 2 + 1, Math.round(vh * 0.32) + 1); g.fillStyle = '#FFE9A8'; g.fillText('Amanheceu · dia ' + (Math.floor(S.alvo / DIA) + 1), vw / 2, Math.round(vh * 0.32)); g.globalAlpha = 1; }
  g.textAlign = 'left';
}
