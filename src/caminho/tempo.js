// O tempo no Refúgio (e no sítio): cada quarto do dia tem o seu, sorteado pelo dia (todos veem o mesmo).
// Sol na maior parte; às vezes nublado, chuva, e de vez em quando tempestade: raios, trovão e o mar bravo.
// A chuva rega a lavoura do sítio. Na tempestade, no mar aberto, o Leviatã pode subir (ver marbravo.js).
import { sfx } from '../audio.js';
import { DIA } from './moradores.js';

const h = n => { let x = Math.imul(n ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
export const quarto = G => Math.floor((G.cm.relogio || 0) / (DIA / 4));
export function tempoAgora(G) {
  if (G.cm.tempoForcado) return G.cm.tempoForcado;
  const r = h(quarto(G) * 7 + 3);
  return r < 0.56 ? 'sol' : r < 0.76 ? 'nublado' : r < 0.9 ? 'chuva' : 'tempestade';
}
export const chovendo = G => ['chuva', 'tempestade'].includes(tempoAgora(G));
export const ehTempestade = G => tempoAgora(G) === 'tempestade';
const AO_AR_LIVRE = G => G.area === 'refugio' || !!G.def?.sitio;

// a cada quadro: a força da chuva sobe e desce aos poucos, e na tempestade caem raios
export function passoTempo(G, dt) {
  const alvo = !AO_AR_LIVRE(G) ? 0 : { sol: 0, nublado: 0.15, chuva: 0.6, tempestade: 1 }[tempoAgora(G)] + (G.levi ? 0.3 : 0);
  G.chuvaK = (G.chuvaK || 0) + (alvo - (G.chuvaK || 0)) * Math.min(1, dt * 0.6);
  if (G.raioT > 0) G.raioT -= dt;
  if (AO_AR_LIVRE(G) && ehTempestade(G)) {
    G.trovaoT = (G.trovaoT ?? 4) - dt;
    if (G.trovaoT <= 0) { G.trovaoT = (G.levi ? 3 : 7) + Math.random() * 8; G.raioT = 0.35; G.raioX = Math.random(); G.clarao = Math.max(G.clarao || 0, 0.22); setTimeout(() => sfx('trovao'), 200 + Math.random() * 700); }
  }
}
// desenho (em pixel de jogo): véu cinza, gotas inclinadas e o clarão do raio
export function pintarTempo(g, G, vw, vh, cx, Tm) {
  const k = G.chuvaK || 0; if (k < 0.02) return;
  g.fillStyle = '#1A2230'; g.globalAlpha = Math.min(0.45, k * 0.38); g.fillRect(0, 0, vw, vh); g.globalAlpha = 1;
  const n = Math.round(30 + k * 170 * (k > 0.3 ? 1 : 0.3)); g.fillStyle = '#B9CCE0';
  for (let i = 0; i < n; i++) { const r = h(i * 3 + 1), r2 = h(i * 5 + 2), vel = 300 + r * 160, x = ((r * vw * 1.4 - Tm * vel * 0.35 - cx * 0.6) % vw + vw) % vw, y = (r2 * vh + Tm * vel) % vh;
    g.globalAlpha = 0.25 + r2 * 0.35; for (let j = 0; j < 5; j++) g.fillRect(Math.round(x - j * 0.5), Math.round(y + j), 1, 1); }
  g.globalAlpha = 1;
  if (G.raioT > 0) { // o raio: um zigue-zague do céu ao chão, e a tela inteira clareia
    const a = G.raioT / 0.35; g.fillStyle = '#E8F0FF'; g.globalAlpha = a * 0.35; g.fillRect(0, 0, vw, vh); g.globalAlpha = a;
    let x = Math.round(G.raioX * vw), y = 0; g.fillStyle = '#FFFFFF'; while (y < vh * 0.62) { const nx = x + Math.round((h(y * 13 + Math.floor(G.raioX * 999)) - 0.5) * 14); for (let j = 0; j < 6; j++) g.fillRect(Math.round(x + (nx - x) * j / 6), y + j, 2, 1); x = nx; y += 6; }
    g.globalAlpha = 1; }
}
