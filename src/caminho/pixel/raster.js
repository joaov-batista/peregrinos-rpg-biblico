// Rasterizador de pixel art: tudo é desenhado pixel a pixel num buffer pequeno (sem suavização), com rampas de cor
// de poucos tons, contorno automático e carimbos escritos à mão em texto. É a base de todos os sprites do Caminho.
// Escala do jogo: 1 pixel de arte = 2 unidades do mundo (ver pixel/tela.js).
export const PX = 2;

// ---- cor ----
// números no formato do ImageData em little-endian: 0xAABBGGRR
export const cor = hex => { const n = parseInt(hex.slice(1), 16); return (0xff000000 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16 & 255) >>> 0; };
const paraHsl = hex => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0; const d = mx - mn;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
};
const deHsl = (h, s, l) => {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return (0xff000000 | Math.round((b + m) * 255) << 16 | Math.round((g + m) * 255) << 8 | Math.round((r + m) * 255)) >>> 0;
};
const rampas = new Map();
// Rampa de 5 tons a partir de uma cor: as sombras esfriam (vão para o azul-violeta) e as luzes esquentam,
// como se pinta pixel art à mão. Índices: 0 sombra funda · 1 sombra · 2 base · 3 luz · 4 brilho.
export function rampa(hex) {
  let r = rampas.get(hex);
  if (!r) {
    const [h, s, l] = paraHsl(hex), frio = h > 60 && h < 300 ? 14 : -16;
    r = [deHsl(h + frio * 1.6, s * 1.15 + 0.05, l * 0.42), deHsl(h + frio, s * 1.08 + 0.02, l * 0.68), deHsl(h, s, l), deHsl(h - frio * 0.5, s * 0.92, l + (1 - l) * 0.3), deHsl(h - frio, s * 0.7, l + (1 - l) * 0.62)];
    rampas.set(hex, r);
  }
  return r;
}
export const TINTA = cor('#17121f'), BRANCO = cor('#ffffff');

// ---- sprite ----
export class Sprite {
  constructor(w, h) { this.w = w; this.h = h; this.b = new Uint32Array(w * h); this.cv = null; }
  limpa() { this.b.fill(0); return this; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.b[y * this.w + x] = c; }
  le(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.b[y * this.w + x] : 0; }
  ret(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  // linha grossa (pincel quadrado de g pixels)
  linha(x0, y0, x1, y1, g, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, o = Math.floor((g - 1) / 2); let e = dx - dy;
    for (let k = 0; k < 400; k++) {
      if (g === 1) this.px(x0, y0, c); else this.ret(x0 - o, y0 - o, g, g, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; }
    }
  }
  // membro: linha com volume — sombra do lado de trás/baixo, base e um fio de luz
  membro(x0, y0, x1, y1, g, R, luz = true) {
    this.linha(x0, y0 + 1, x1, y1 + 1, g, R[1]); this.linha(x0, y0, x1, y1, g, R[2]);
    if (luz && g >= 2) this.linha(x0 + (g > 2 ? 1 : 0), y0 - (g > 2 ? 0 : 0), x1 + (g > 2 ? 1 : 0), y1, 1, R[3]);
  }
  // elipse sombreada por uma luz que vem de cima e da frente (dx, dy)
  bola(cx, cy, rx, ry, R, lx = 0.5, ly = -0.7) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue;
      const k = nx * lx + ny * ly + (1 - d) * 0.35;
      this.px(x, y, R[k > 0.62 ? 4 : k > 0.25 ? 3 : k > -0.2 ? 2 : k > -0.55 ? 1 : 0]);
    }
  }
  // polígono cheio (varredura)
  poli(pts, c) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.round(y0); y <= Math.round(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) this.px(x, y, c);
    }
  }
  // carimbo: linhas de texto, cada letra é uma cor do mapa; espelha com vira = -1
  carimbo(linhas, x, y, mapa, vira = 1, inclina = 0) {
    for (let j = 0; j < linhas.length; j++) { const ln = linhas[j], dx = Math.round(inclina * (linhas.length - 1 - j)); for (let i = 0; i < ln.length; i++) { const c = mapa[ln[i]]; if (c) this.px(x + (vira > 0 ? i : ln.length - 1 - i) + dx * vira, y + j, c); } }
  }
  // contorno de 1 pixel em volta da silhueta
  contorno(c = TINTA) {
    const { w, h, b } = this, novo = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!b[y * w + x] && ((x > 0 && b[y * w + x - 1]) || (x < w - 1 && b[y * w + x + 1]) || (y > 0 && b[(y - 1) * w + x]) || (y < h - 1 && b[(y + 1) * w + x]))) novo.push(y * w + x);
    for (const i of novo) b[i] = c;
    return this;
  }
  // todos os pixels pintados viram uma cor (clarão de dano, rastro)
  tinge(c, f = 1) { const b = this.b; for (let i = 0; i < b.length; i++) if (b[i] && (f >= 1 || ((i * 7919) % 100) / 100 < f)) b[i] = c; return this; }
  // dissolve: some com parte dos pixels (morte)
  dissolve(f, sem = 1) { const b = this.b, w = this.w; for (let i = 0; i < b.length; i++) if (b[i]) { const x = i % w, y = (i / w) | 0, r = Math.abs(Math.sin(x * 12.9898 * sem + y * 78.233) * 43758.5453) % 1; if (r < f) b[i] = 0; } return this; }
  tela() {
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.width = this.w; this.cv.height = this.h; this.cx = this.cv.getContext('2d'); this.im = this.cx.createImageData(this.w, this.h); this.u32 = new Uint32Array(this.im.data.buffer); }
    this.u32.set(this.b); this.cx.putImageData(this.im, 0, 0); return this.cv;
  }
}

// desenha um sprite no contexto de baixa resolução (ancorado em ax, ay; vira = -1 espelha)
export function carimbar(g, spr, x, y, ax, ay, vira = 1, alfa = 1) {
  const cv = spr.tela ? spr.tela() : spr;
  x = Math.round(x); y = Math.round(y);
  if (alfa !== 1) g.globalAlpha = alfa;
  if (vira < 0) { g.save(); g.translate(x, y); g.scale(-1, 1); g.drawImage(cv, -ax, -ay); g.restore(); }
  else g.drawImage(cv, x - ax, y - ay);
  if (alfa !== 1) g.globalAlpha = 1;
}
