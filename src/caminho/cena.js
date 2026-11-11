// Cenário do Caminho: céu em camadas, silhuetas em paralaxe, blocos de tinta com borda iluminada,
// e a escuridão que só a lâmpada (e as luzes do lugar) afasta.
import { hash, TAU, clamp } from '../util.js';
import { T, CW, CH, SOLIDO, PONTE, ESPINHO, OCULTO, FALSA, PORTAO, tileEm } from './nivel.js';
import { TEMAS } from './dados.js';

export function tema(id) { return TEMAS[id] || TEMAS.refugio; }

export function pintarFundo(g, G) {
  const { W, H, cam } = G.vista, tm = G.tm, Tm = G.T;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, tm.ceu[0]); gr.addColorStop(0.62, tm.ceu[1]); gr.addColorStop(1, tm.ceu[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // astro e estrelas
  const ax = W * 0.72 - cam.x * 0.02, ay = H * 0.24 - cam.y * 0.02;
  const halo = g.createRadialGradient(ax, ay, 0, ax, ay, H * 0.55); halo.addColorStop(0, corA(tm.acento, 0.28)); halo.addColorStop(1, corA(tm.acento, 0));
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  g.fillStyle = corA(tm.borda, 0.85); g.beginPath(); g.arc(ax, ay, 16, 0, TAU); g.fill();
  for (let i = 0; i < 46; i++) { const x = (hash(i, 3) * 1400 - cam.x * 0.03) % W, y = hash(i, 9) * H * 0.6, a = 0.25 + 0.3 * Math.sin(Tm * (0.6 + hash(i, 1)) + i); g.fillStyle = `rgba(255,255,255,${Math.max(0, a) * 0.5})`; g.fillRect((x + W) % W, y, 1.6, 1.6); }
  camada(g, G, 0.12, tm.longe, 0.58, 1.5, 11);
  camada(g, G, 0.3, tm.meio, 0.74, 1, 23);
  // véu de névoa
  const nv = g.createLinearGradient(0, H * 0.45, 0, H); nv.addColorStop(0, corA(tm.ceu[1], 0)); nv.addColorStop(1, corA(tm.ceu[2], 0.22));
  g.fillStyle = nv; g.fillRect(0, H * 0.45, W, H * 0.55);
}

// uma faixa de silhuetas repetidas (o desenho depende do tema)
function camada(g, G, par, cor, base, esc, sem) {
  const { W, H, cam } = G.vista, deco = G.tm.deco, passo = 190 * esc, off = cam.x * par, y0 = H * base - cam.y * par * 0.4;
  g.fillStyle = cor;
  g.fillRect(0, y0, W, H - y0);
  for (let i = Math.floor(off / passo) - 1; i < (off + W) / passo + 1; i++) {
    const x = i * passo - off, r = hash(i, sem), r2 = hash(i, sem + 5), h = (70 + r * 150) * esc;
    g.beginPath();
    switch (deco) {
      case 'colunas': { const w = 22 * esc; g.rect(x, y0 - h, w, h); g.rect(x - 6 * esc, y0 - h - 8 * esc, w + 12 * esc, 9 * esc); if (r2 > 0.5) g.rect(x - 8 * esc, y0 - h - 22 * esc, passo + 16 * esc, 15 * esc); break; }
      case 'arcos': { const w = passo * 0.72; g.moveTo(x, y0); g.lineTo(x, y0 - h * 0.7); g.arc(x + w / 2, y0 - h * 0.7, w / 2, Math.PI, 0); g.lineTo(x + w, y0); g.lineTo(x + w - 14 * esc, y0); g.lineTo(x + w - 14 * esc, y0 - h * 0.7); g.arc(x + w / 2, y0 - h * 0.7, w / 2 - 14 * esc, 0, Math.PI, true); g.lineTo(x + 14 * esc, y0); break; }
      case 'tendas': g.moveTo(x - 20 * esc, y0); g.lineTo(x + passo * 0.4, y0 - h * 0.75); g.lineTo(x + passo * 0.85, y0); g.rect(x + passo * 0.39, y0 - h * 0.95, 3 * esc, h * 0.3); break;
      case 'mastros': g.rect(x, y0 - h * 1.15, 5 * esc, h * 1.15); g.moveTo(x + 5 * esc, y0 - h * 1.05); g.quadraticCurveTo(x + 70 * esc * (0.6 + r2), y0 - h * 0.7, x + 5 * esc, y0 - h * 0.35); g.rect(x - 34 * esc, y0 - h * 1.05, 76 * esc, 3 * esc); break;
      case 'costelas': g.moveTo(x, y0); g.quadraticCurveTo(x + passo * 0.1, y0 - h * 1.7, x + passo * 0.6, y0 - h * 1.9); g.quadraticCurveTo(x + passo * 0.25, y0 - h * 1.5, x + 18 * esc, y0); break;
      case 'muralha': { g.rect(x, y0 - h * 0.8, passo + 1, h * 0.8); for (let k = 0; k < 4; k++) g.rect(x + k * passo / 4, y0 - h * 0.8 - 10 * esc, passo / 8, 11 * esc); if (r2 > 0.6) g.rect(x + 30 * esc, y0 - h * 1.5, 46 * esc, h * 0.8); break; }
      case 'arvores': { g.rect(x + 20 * esc, y0 - h, 9 * esc, h); g.ellipse(x + 24 * esc, y0 - h, 46 * esc * (0.7 + r2 * 0.5), 38 * esc, 0, 0, TAU); g.ellipse(x + 2 * esc, y0 - h * 0.8, 26 * esc, 22 * esc, 0, 0, TAU); break; }
      case 'dunas': g.moveTo(x - passo * 0.5, y0); g.quadraticCurveTo(x + passo * 0.4, y0 - h * 0.55, x + passo * 1.4, y0); if (r2 > 0.7) { g.rect(x + 40 * esc, y0 - h * 0.9, 5 * esc, h * 0.7); g.ellipse(x + 42 * esc, y0 - h * 0.9, 20 * esc, 9 * esc, 0, 0, TAU); } break;
      default: { const w = passo * 0.8; g.rect(x, y0 - h * 0.6, w, h * 0.6); g.moveTo(x - 8 * esc, y0 - h * 0.6); g.lineTo(x + w / 2, y0 - h * 0.6 - 30 * esc * r2 - 8); g.lineTo(x + w + 8 * esc, y0 - h * 0.6); }
    }
    g.fill();
    // janelas acesas ao longe
    if ((deco === 'casas' || deco === 'muralha') && r2 > 0.35) { g.fillStyle = corA(G.tm.acento, 0.5); g.fillRect(x + passo * 0.3, y0 - h * 0.4, 5 * esc, 7 * esc); g.fillStyle = cor; }
  }
}

// blocos visíveis: corpo de tinta, borda superior clara e textura discreta
export function pintarBlocos(g, G) {
  const N = G.N, { cam, W, H, Z } = G.vista, tm = G.tm;
  const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(N.w - 1, Math.ceil((cam.x + W / Z) / T)), y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(N.h - 1, Math.ceil((cam.y + H / Z) / T));
  const cheio = (tx, ty) => { const t = tileEm(N, tx, ty); return t === SOLIDO || (t === FALSA && !N.desfeita.has(ty * N.w + tx)); };
  // corpo: junta as fileiras horizontais
  g.fillStyle = tm.bloco;
  for (let ty = y0; ty <= y1; ty++) {
    let ini = -1;
    for (let tx = x0; tx <= x1 + 1; tx++) {
      const s = tx <= x1 && cheio(tx, ty);
      if (s && ini < 0) ini = tx; else if (!s && ini >= 0) { g.fillRect(ini * T - 0.5, ty * T - 0.5, (tx - ini) * T + 1, T + 1); ini = -1; }
    }
  }
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tileEm(N, tx, ty), i = ty * N.w + tx, x = tx * T, y = ty * T;
    if (cheio(tx, ty)) {
      const r = hash(tx, ty, 2);
      if (!cheio(tx, ty - 1)) { // topo: piso iluminado
        g.fillStyle = tm.borda; g.fillRect(x, y, T, 3);
        g.fillStyle = corA(tm.borda, 0.22); g.fillRect(x, y + 3, T, 5);
        if (r > 0.6) { g.fillStyle = corA(tm.borda, 0.5); g.fillRect(x + r * 20, y - 3 - r * 3, 2, 4 + r * 3); }
      }
      if (!cheio(tx, ty + 1)) { g.fillStyle = corA(tm.borda, 0.16); g.fillRect(x, y + T - 3, T, 3); if (r > 0.72) { g.fillStyle = tm.bloco; g.beginPath(); g.moveTo(x + 8, y + T); g.lineTo(x + 13, y + T + 9 + r * 8); g.lineTo(x + 18, y + T); g.fill(); } }
      if (!cheio(tx - 1, ty)) { g.fillStyle = corA(tm.borda, 0.2); g.fillRect(x, y, 2, T); }
      if (!cheio(tx + 1, ty)) { g.fillStyle = corA(tm.borda, 0.2); g.fillRect(x + T - 2, y, 2, T); }
      if (r < 0.16) { g.fillStyle = corA(tm.borda, 0.07); g.fillRect(x + 6, y + 10, 18, 2); g.fillRect(x + 12, y + 20, 14, 2); }
      if (t === FALSA && G.p.lamp) { g.fillStyle = corA(tm.acento, 0.12 + 0.08 * Math.sin(G.T * 9 + tx)); g.fillRect(x, y, T, T); }
    } else if (t === PONTE) {
      g.fillStyle = '#080F19'; g.fillRect(x, y, T, 8); g.fillStyle = tm.borda; g.fillRect(x, y, T, 2.5); g.fillStyle = corA(tm.borda, 0.35); g.fillRect(x + 4, y + 8, 2, 5); g.fillRect(x + T - 6, y + 8, 2, 5);
    } else if (t === ESPINHO) {
      g.fillStyle = '#C9CDC0'; g.strokeStyle = '#080F19'; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 8, y + T); g.lineTo(x + k * 8 + 4, y + 10 + hash(tx, k) * 6); g.lineTo(x + k * 8 + 8, y + T); g.closePath(); g.fill(); g.stroke(); }
    } else if (t === OCULTO) {
      const v = N.revel[i] || 0;
      if (v > 0) { g.globalAlpha = Math.min(1, v); g.fillStyle = corA(tm.acento, 0.85); g.fillRect(x, y, T, 7); g.fillStyle = '#fff'; g.fillRect(x, y, T, 1.5); g.globalAlpha = 1; }
      else if (hash(tx, ty, Math.floor(G.T * 1.5)) > 0.92) { g.fillStyle = corA(tm.acento, 0.5); g.fillRect(x + hash(tx, ty, 7) * 28, y + 2, 2, 2); } // um brilho que denuncia
    } else if (t === PORTAO && !N.portaAberta) {
      g.fillStyle = '#0A0F18'; g.fillRect(x + 4, y, T - 8, T); g.fillStyle = corA(tm.acento, 0.7); g.fillRect(x + 6, y, 2, T); g.fillRect(x + T - 8, y, 2, T); g.fillRect(x + 4, y + 14, T - 8, 2);
    }
  }
}

// objetos de cena: lampiões pendurados (luz) — o resto é desenhado pelo jogo
export function pintarLampioes(g, G) {
  for (const l of G.N.luzes) {
    if (Math.abs(l.x - G.p.x) > 900) continue;
    const topo = Math.floor(l.y / T / CH) * CH * T + T, bal = Math.sin(G.T * 1.3 + l.x) * 3;
    g.strokeStyle = corA(G.tm.borda, 0.45); g.lineWidth = 1.2; g.beginPath(); g.moveTo(l.x, topo); g.lineTo(l.x + bal, l.y - 8); g.stroke();
    g.fillStyle = '#0A0F18'; g.fillRect(l.x + bal - 5, l.y - 9, 10, 13);
    g.fillStyle = corA(G.tm.acento, 0.9); g.fillRect(l.x + bal - 3, l.y - 6, 6, 7);
  }
}

// escuridão: um véu furado pelas luzes
export function pintarLuz(g, G) {
  const { W, H, cam, Z } = G.vista, e = clamp(G.escuro, 0, 0.94);
  if (e <= 0.02) return;
  const L = G.luzCv, lg = L.getContext('2d'), s = 0.5;
  if (L.width !== Math.ceil(W * s) || L.height !== Math.ceil(H * s)) { L.width = Math.ceil(W * s); L.height = Math.ceil(H * s); }
  lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, L.width, L.height);
  lg.fillStyle = `rgba(3,6,12,${e})`; lg.fillRect(0, 0, L.width, L.height);
  lg.globalCompositeOperation = 'destination-out';
  const furo = (wx, wy, r, f = 1) => {
    const x = (wx - cam.x) * Z * s, y = (wy - cam.y) * Z * s, rr = r * Z * s;
    if (x < -rr || y < -rr || x > L.width + rr || y > L.height + rr) return;
    const gr = lg.createRadialGradient(x, y, rr * 0.15, x, y, rr); gr.addColorStop(0, `rgba(0,0,0,${f})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = gr; lg.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  };
  furo(G.p.x, G.p.y - 22, G.raioLuz() * (1 + Math.sin(G.T * 13) * 0.012), 1);
  for (const l of G.N.luzes) furo(l.x, l.y, l.r, 0.75);
  for (const o of G.objs) if (o.luz) furo(o.x, o.y - 20, o.luz, 0.9);
  for (const t of G.tiros) furo(t.x, t.y, t.r * 5, 0.6);
  for (const b of G.inimigos) if (b.kind === 'chefe') furo(b.x, b.y - b.h / 2, b.r * 3.2, 0.55);
  g.drawImage(L, 0, 0, W, H);
}

export function corA(hex, a) {
  if (hex.startsWith('rgb')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
export { CW, CH };
