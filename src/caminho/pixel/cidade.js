// As camadas da cidade no fundo do Refúgio: duas faixas de casas, telhados e torres entre o céu (com as muralhas de sempre)
// e o chão onde se joga. Elas correm para os lados mais devagar que o chão (paralaxe), e cada bairro tem o seu fundo:
// a praça com cúpula, o mercado com toldos, a praça das armas com torre de vigia, o bairro apertado com varais e chaminés,
// o pátio com colunatas, a sinagoga entre casas, o olival em socalcos, o porto com mastros e farol.
// A camada de longe é mais pálida e lenta; a de perto, mais escura e mais rápida. À noite as janelas acendem.
import { Sprite, cor } from './raster.js';

const SALA = 480; // largura de um bairro em pixels de jogo
const CAMADAS = [{ f: 0.58, alt: 150, tom: 0 }, { f: 0.78, alt: 120, tom: 1 }]; // longe, perto
const TEMAS = { 'Praça do poço': 'praca', 'Mercado': 'mercado', 'Praça das armas': 'armas', 'Bairro': 'bairro', 'Pátio das provas': 'patio', 'Sinagoga': 'sinagoga', 'Olival': 'olival', 'Porto do Refúgio': 'porto' };
// cores: [corpo, sombra, contorno, telhado, janela apagada, janela acesa, folha]
const COR = [
  ['#56648A', '#4A5779', '#3A4566', '#62607E', '#3E4A6C', '#D8B06A', '#4A6A62'],
  ['#2C3754', '#232C46', '#141A2A', '#5A4450', '#1C2336', '#F2C46A', '#2A463E']
].map(l => l.map(cor));
const cache = new Map();
const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

function pecas(s, P, noite, r) {
  const ret = (x, y, w, h, c) => s.ret(Math.round(x), Math.round(y), Math.round(w), Math.round(h), c);
  const janelas = (x, y, w, h, n) => { for (let i = 0; i < n; i++) { const jx = x + 4 + i * ((w - 8) / Math.max(1, n)), acesa = noite && r() < 0.55; ret(jx, y + h * 0.3, 3, 4, acesa ? P[5] : P[4]); if (h > 30 && r() < 0.6) ret(jx, y + h * 0.62, 3, 4, noite && r() < 0.45 ? P[5] : P[4]); } };
  return {
    casa(x, base, w, h) { ret(x - 1, base - h - 1, w + 2, h + 1, P[2]); ret(x, base - h, w, h, P[0]); ret(x + w - 3, base - h, 3, h, P[1]); ret(x - 2, base - h - 3, w + 4, 3, P[3]); janelas(x, base - h, w, h, Math.max(1, Math.floor(w / 9))); },
    cupula(x, base, w, h) { this.casa(x, base, w, h); const R = w / 2 - 2; for (let k = 0; k <= R; k++) { const lg = Math.round(Math.sqrt(R * R - (R - k) ** 2)); ret(x + w / 2 - lg, base - h - 3 - R + k, lg * 2, 1, k < 2 ? P[2] : P[3]); } ret(x + w / 2 - 1, base - h - R - 8, 2, 5, P[2]); },
    torre(x, base, w, h) { ret(x - 1, base - h - 1, w + 2, h + 1, P[2]); ret(x, base - h, w, h, P[0]); ret(x + w - 2, base - h, 2, h, P[1]); for (let i = 0; i < w; i += 4) ret(x + i - 1, base - h - 4, 3, 4, P[0]); ret(x + w / 2 - 2, base - h + 8, 4, 6, noite ? P[5] : P[4]); },
    toldo(x, base, w) { ret(x, base - 16, 2, 16, P[2]); ret(x + w - 2, base - 16, 2, 16, P[2]); for (let i = 0; i < w; i += 6) ret(x + i, base - 20, 6, 4, i % 12 ? P[3] : P[1]); ret(x, base - 21, w, 1, P[2]); },
    arvore(x, base, h) { ret(x - 1, base - h * 0.5, 2, h * 0.5, P[2]); const R = h * 0.35; for (let k = -R; k <= R; k++) { const lg = Math.round(Math.sqrt(R * R - k * k) * 1.3); ret(x - lg, base - h * 0.62 + k, lg * 2, 1, P[6]); } },
    palmeira(x, base, h) { ret(x - 1, base - h, 2, h, P[2]); for (const d of [-1, 1]) for (let i = 0; i < 9; i++) ret(x + d * i, base - h + Math.abs(i - 3) * 0.7, 2, 1, P[6]); },
    coluna(x, base, h) { ret(x, base - h, 4, h, P[0]); ret(x + 3, base - h, 1, h, P[1]); ret(x - 1, base - h - 2, 6, 2, P[3]); },
    muro(x, base, w, h) { ret(x, base - h, w, h, P[1]); for (let i = 0; i < w; i += 6) ret(x + i, base - h - 3, 4, 3, P[1]); },
    mastro(x, base, h) { ret(x, base - h, 1, h, P[2]); ret(x - 8, base - h + 6, 17, 1, P[2]); ret(x - 6, base - h + 7, 1, h * 0.5, P[3]); },
    farol(x, base, h) { ret(x - 4, base - h, 8, h, P[0]); ret(x + 2, base - h, 2, h, P[1]); ret(x - 6, base - h - 3, 12, 3, P[2]); ret(x - 3, base - h - 9, 6, 6, noite ? P[5] : P[4]); ret(x - 4, base - h - 11, 8, 2, P[3]); },
    varal(x, base, w) { ret(x, base - 30, w, 1, P[2]); for (let i = 4; i < w - 2; i += 7) ret(x + i, base - 29, 3, 5, i % 14 ? P[3] : P[4]); }
  };
}

// um bairro, numa camada: desenhado uma vez (dia e noite) e guardado
function bairro(tema, camada, noite, semente) {
  const k = tema + camada + noite; if (cache.has(k)) return cache.get(k);
  const C = CAMADAS[camada], w = Math.round(SALA * C.f) + 2, h = C.alt, s = new Sprite(w, h), r = rng(semente * 97 + camada * 13 + 7), P = COR[camada], b = h, D = pecas(s, P, noite, r);
  const fileira = (fn, passo) => { let x = -4; while (x < w) { const lg = fn(x); x += lg + Math.round(passo * (0.5 + r())); } };
  const casas = (hMin, hMax, wMin = 18, wMax = 34) => fileira(x => { const lw = Math.round(wMin + r() * (wMax - wMin)); D.casa(x, b, lw, Math.round(hMin + r() * (hMax - hMin))); return lw; }, 3);
  if (camada === 0) { // longe: silhuetas altas, poucas
    if (tema === 'porto') { D.casa(10, b, 40, 30); D.farol(w - 40, b, 70); for (let i = 0; i < 5; i++) D.mastro(70 + i * 34, b, 60 + r() * 24); }
    else if (tema === 'olival') { for (let x = 0; x < w; x += 10) D.arvore(x + r() * 6, b - 10 - Math.sin(x / w * 3) * 8, 26 + r() * 10); s.ret(0, b - 10, w, 10, P[1]); }
    else { casas(50, 96, 22, 40); if (tema === 'praca' || tema === 'sinagoga') D.cupula(w * 0.55, b, 34, 74); if (tema === 'armas' || tema === 'mercado') D.torre(w * 0.3, b, 16, 128); if (tema === 'patio') D.torre(w * 0.7, b, 18, 112); }
  } else { // perto: casas baixas, mais escuras, com o que cada bairro tem de seu
    if (tema === 'porto') { D.muro(0, b, w, 10); for (let i = 0; i < 6; i++) D.mastro(20 + i * 60 + r() * 20, b - 8, 56 + r() * 20); D.casa(w - 60, b, 34, 24); }
    else if (tema === 'olival') { for (let x = 4; x < w; x += 22) D.arvore(x + r() * 8, b, 30 + r() * 12); D.muro(0, b, w, 6); }
    else if (tema === 'patio') { D.muro(0, b, w, 18); for (let x = 12; x < w; x += 22) D.coluna(x, b - 18, 26); casas(16, 28); }
    else { casas(34, 66); if (tema === 'mercado') for (let x = 10; x < w - 30; x += 70) D.toldo(x, b, 34); if (tema === 'bairro') for (let x = 20; x < w - 40; x += 90) D.varal(x, b, 40); if (tema === 'praca' || tema === 'sinagoga') for (let x = 30; x < w; x += 120) D.palmeira(x, b, 38); if (tema === 'armas') D.muro(0, b, w, 14); }
  }
  const tela = s.tela(); cache.set(k, tela); return tela;
}

// pinta as duas camadas, bairro a bairro, presas ao chão (y do piso) e correndo de lado mais devagar que ele
export function pintarCidade(g, G, vw, cx, chaoY, noite) {
  const salas = G.N.celulas.filter(c => c.cy === 0).sort((a, b) => a.cx - b.cx);
  for (let camada = 0; camada < 2; camada++) {
    const C = CAMADAS[camada];
    for (const cel of salas) {
      const tema = TEMAS[cel.nome] || 'praca', meio = vw / 2 + (cel.cx * SALA + SALA / 2 - cx - vw / 2) * C.f, cv = bairro(tema, camada, noite, cel.cx + 1);
      const x = Math.round(meio - cv.width / 2); if (x > vw || x + cv.width < 0) continue;
      g.drawImage(cv, x, Math.round(chaoY - cv.height + (camada === 0 ? -6 : 0)));
    }
    if (camada === 0) { const gr = g.createLinearGradient(0, chaoY - 46, 0, chaoY); gr.addColorStop(0, noite ? 'rgba(20,26,44,0)' : 'rgba(170,190,215,0)'); gr.addColorStop(1, noite ? 'rgba(20,26,44,0.55)' : 'rgba(170,190,215,0.45)'); g.fillStyle = gr; g.fillRect(0, chaoY - 46, vw, 46); } /* névoa entre as camadas */
    if (camada === 1) for (const cel of salas) { if (TEMAS[cel.nome] !== 'bairro') continue; // fumaça das chaminés do bairro
      const meio = vw / 2 + (cel.cx * SALA + SALA / 2 - cx - vw / 2) * C.f; g.fillStyle = noite ? '#3A4560' : '#8A93A8'; g.globalAlpha = 0.35;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const t = (G.T * 0.5 + j / 6 + i * 0.3) % 1; g.fillRect(Math.round(meio - 140 + i * 90 + Math.sin(t * 6 + i) * 3 + t * 6), Math.round(chaoY - 40 - t * 30), 2 + Math.round(t * 2), 2); }
      g.globalAlpha = 1; }
  }
}
