// O título épico da célula, pintado pixel a pixel com a PixelFX (src/vendor/pixelfx): o céu azul que vira brasa
// (as cores do estudo da semana), raios de luz que descem, as letras que caem uma a uma em ouro com contorno de tinta,
// faíscas quando cada letra pousa, um brilho que corre pelas palavras e a coluna de luz santa no fim.
// A fonte grande da PixelFX não tem acentos: aqui cada letra acentuada é a letra base com o acento pintado por cima.
import { createFrame, clearFrame, Painter, composite, hex, FONTS, Particles, P, createFx, mix, scale } from '../vendor/pixelfx/core/index.js';
import * as pilar from '../vendor/pixelfx/fx/holy/holy-pillar.js';

const W = 320, H = 180;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const CEU = ['#0A1250', '#13209A', '#1A33D0', '#3A3ACF', '#6A3AA8', '#9A3A78', '#C8442E', '#E8602A'].map(hex);
const OURO = ['#7A4A12', '#B8781C', '#E0A63C', '#FFD45A', '#FFF0A8', '#FFFFFF'].map(hex);
const TINTA = hex('#0B0A18'), LUZ = hex('#FFE9A8'), BRANCO = hex('#FFFFFF');
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3), bounce = t => { t = Math.min(1, Math.max(0, t)); return t < 0.7 ? ease(t / 0.7) * 1.08 : 1.08 - Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.08; };

// texto → lista de pixels de fonte (x, y), com os acentos (á â ã é ê í ó ô õ ú ç) desenhados à mão
function rasterizar(str, fonte = 'big') {
  const F = FONTS[fonte], px = [], letras = []; let x = 0;
  for (const ch of String(str)) {
    const nfd = ch.normalize('NFD'), base = nfd[0].toUpperCase(), marca = nfd.slice(1), g = F.glyphs[base];
    if (!g) { x += F.space + F.gap; continue; }
    const meus = [];
    g.rows.forEach((row, y) => row.forEach((on, gx) => { if (on) meus.push([x + gx, y]); }));
    const meio = x + Math.floor(g.w / 2);
    if (marca.includes('̃')) meus.push([meio - 2, -2], [meio - 1, -3], [meio, -2], [meio + 1, -3]); // til
    if (marca.includes('́')) meus.push([meio, -2], [meio + 1, -3]); // agudo
    if (marca.includes('̂')) meus.push([meio - 1, -2], [meio, -3], [meio + 1, -2]); // circunflexo
    if (marca.includes('̧')) meus.push([meio, F.h], [meio - 1, F.h + 1]); // cedilha
    letras.push({ px: meus, x0: x, w: g.w });
    px.push(...meus); x += g.w + F.gap;
  }
  return { letras, w: Math.max(0, x - F.gap), h: F.h };
}

/**
 * Monta o título num canvas. o: { linhas: ['JESUS ME', 'ESCOLHEU'], sub: 'JOÃO 15:16', topo: 'CÉLULA',
 * escala (tamanho das letras), pilar (true: a coluna de luz no fim), lento (0.07 s entre letras) }.
 * Devolve { parar(), pronto (Promise que resolve quando a última letra pousa) }.
 */
export function montarTitulo(cv, o = {}) {
  cv.width = W; cv.height = H; cv.classList.add('px-titulo');
  const g = cv.getContext('2d'), img = g.createImageData(W, H), f = createFrame(W, H), p = new Painter(f);
  const linhas = (o.linhas || ['JESUS ME', 'ESCOLHEU']).map(l => rasterizar(l));
  const sub = o.sub ? rasterizar(o.sub, 'mini') : null, topo = o.topo ? rasterizar(o.topo, 'mini') : null;
  const maxW = Math.max(...linhas.map(l => l.w)), k = o.escala || Math.max(2, Math.min(5, Math.floor((W - 24) / maxW)));
  const altura = linhas.length * (7 * k) + (linhas.length - 1) * (4 * k / 2 | 0), y0 = Math.round(H * 0.47 - altura / 2) + (o.desce || 0);
  const lento = o.lento ?? 0.07; let n = 0;
  const pecas = []; linhas.forEach((l, i) => { const x0 = Math.round(W / 2 - l.w * k / 2), y = y0 + i * (7 * k + (4 * k / 2 | 0)); for (const le of l.letras) pecas.push({ ...le, X: x0 + le.x0 * k, Y: y, t0: 0.35 + n++ * lento, pousou: false }); });
  const fim = pecas.length ? pecas[pecas.length - 1].t0 + 0.5 : 0.5;
  const ps = new Particles({ seed: 7, sparks: ['#FFFFFF', '#FFF0A8', '#FFD45A', '#E0A63C'] });
  const motes = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % H, v: 6 + (i % 7) * 2.5, f: 0.6 + (i % 5) * 0.2 }));
  let col = null, t = 0, last = performance.now(), raf = 0, vivo = true, resolve; const pronto = new Promise(r => { resolve = r; });
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzido) t = fim + 1;

  function ceu() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // diagonal do azul (alto, à esquerda) para a brasa (baixo, à direita), como a arte do estudo
      const v = (x / W) * 0.55 + (y / H) * 0.45 + Math.sin(x * 0.05 + t * 0.4) * 0.015, fv = Math.min(0.9999, Math.max(0, v)) * (CEU.length - 1);
      let i = Math.floor(fv); if (fv - i > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) i++;
      f.color[y * W + x] = CEU[Math.min(CEU.length - 1, i)];
    }
    // faixas diagonais (pinceladas) que passam devagar
    for (let k2 = 0; k2 < 5; k2++) { const off = ((t * 8 + k2 * 77) % (W + H)) - H; p.glowLine(off, 0, off + H * 0.7, H, 6, hex('#6A7AFF'), 0.06); }
    // os raios de luz que descem do alto
    const ab = ease(t / 1.4);
    for (let r = -3; r <= 3; r++) p.glowLine(W / 2, -20, W / 2 + r * 46 * ab + Math.sin(t * 0.7 + r) * 6, H + 10, 10 + Math.abs(r) * 2, LUZ, (0.09 - Math.abs(r) * 0.01) * ab);
    p.glow(W / 2, 0, 90, LUZ, 0.35 * ab);
    for (const m of motes) { const y = (m.y - t * m.v + H * 10) % H, x = m.x + Math.sin(t * m.f + m.y) * 3; p.add(x | 0, y | 0, LUZ, 0.35 + 0.35 * Math.sin(t * 3 + m.x)); }
  }

  function letras(dt) {
    const brilho = ((t - fim) * 0.9) % 2.4; // a faixa clara que varre o título depois de pronto
    for (const L of pecas) {
      const a = (t - L.t0) / 0.42; if (a <= 0) continue;
      const dy = Math.round((1 - bounce(a)) * -26), Y = L.Y + dy;
      if (!L.pousou && a >= 0.7) { L.pousou = true; for (let i = 0; i < 9; i++) { const an = Math.PI + (i / 8) * Math.PI; ps.spawn(P.SPARK, L.X + L.w * k / 2, Y + 7 * k, Math.cos(an) * (60 + i * 9), Math.sin(an) * (80 + i * 6), 0.45 + (i % 3) * 0.12, 0, 1); } ps.spawn(P.STAR, L.X + L.w * k / 2, Y - 4, 0, -20, 0.6, '#FFFFFF', 1); }
      // sombra e contorno de tinta
      for (const [gx, gy] of L.px) p.rect(L.X + (gx - L.x0) * k - 1, Y + gy * k - 1, k + 2, k + 2, TINTA);
      for (const [gx, gy] of L.px) p.rect(L.X + (gx - L.x0) * k + 2, Y + gy * k + 3, k, k, scale(TINTA, 1), 0.55);
      // o ouro: claro em cima, escuro embaixo, com a borda de cima acesa; a faixa de brilho passa por cima
      for (const [gx, gy] of L.px) {
        const X = L.X + (gx - L.x0) * k, YY = Y + gy * k;
        for (let j = 0; j < k; j++) { const v = 1 - (gy * k + j + 3 * 1) / (7 * k + 3); let c = OURO[Math.max(1, Math.min(4, Math.round(1 + v * 3.4)))];
          const banda = Math.abs(((X - YY * 0.5) / W) * 2.4 - brilho); if (t > fim && banda < 0.12) c = mix(c, BRANCO, 0.75 * (1 - banda / 0.12));
          p.rect(X, YY + j, k, 1, c); }
        if (gy === 0 || !L.px.some(q => q[0] === gx && q[1] === gy - 1)) p.rect(X, YY, k, 1, OURO[5]);
      }
      if (a < 1.3) p.glow(L.X + L.w * k / 2, Y + 3.5 * k, 14 * k / 3, LUZ, 0.4 * (1 - Math.min(1, a / 1.3)));
    }
  }

  function textoMini(r, cx, y, c, alfa) {
    if (!r) return; const x0 = Math.round(cx - r.w / 2);
    for (const L of r.letras) for (const [gx, gy] of L.px) { p.dot(x0 + gx + 1, y + gy + 1, TINTA, alfa); p.dot(x0 + gx, y + gy + 1, TINTA, alfa); } // sombra fina: a letra pequena continua legível
    for (const L of r.letras) for (const [gx, gy] of L.px) p.dot(x0 + gx, y + gy, c, alfa);
  }

  function quadro(now) {
    if (!vivo) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    clearFrame(f); ceu();
    if (o.pilar !== false && t > fim - 0.1 && !col) col = createFx(pilar, { x: W / 2, y: H - 6, light: 0.9 });
    if (col) { col.update(dt); col.draw(f, 'back'); }
    ps.update(dt); ps.draw(p, 'back');
    letras(dt);
    ps.draw(p, 'front'); if (col) col.draw(f, 'front');
    const aT = Math.min(1, Math.max(0, (t - 0.1) / 0.6)), aS = Math.min(1, Math.max(0, (t - fim + 0.2) / 0.6));
    textoMini(topo, W / 2, Math.max(6, y0 - 22), hex('#E8ECFF'), aT);
    textoMini(sub, W / 2, y0 + altura + 12 + (o.desce ? 0 : 0), OURO[4], aS);
    if (t > fim && Math.random() < dt * 9) ps.spawn(P.STAR, 30 + Math.random() * (W - 60), y0 - 6 + Math.random() * (altura + 12), 0, -6, 0.5, '#FFFFFF', 1);
    if (col?.done()) col = null;
    composite(f, img.data, null, 1); g.putImageData(img, 0, 0);
    if (t >= fim && resolve) { resolve(); resolve = null; }
    raf = requestAnimationFrame(quadro);
  }
  raf = requestAnimationFrame(quadro);
  return { parar() { vivo = false; cancelAnimationFrame(raf); }, pronto, pular() { t = Math.max(t, fim); } };
}

// Uma tela cheia por cima de tudo com o título (vitória de página, declaração final). Fecha no toque, tecla ou botão do controle.
export function telaEpica(o) {
  return new Promise(res => {
    const cv = document.createElement('canvas'), caixa = document.createElement('div');
    caixa.className = 'cel-epica'; caixa.append(cv);
    const dica = document.createElement('p'); dica.className = 'cel-epica-dica'; dica.textContent = o.dica || 'toque para continuar'; caixa.append(dica);
    if (o.texto) { const tx = document.createElement('p'); tx.className = 'cel-epica-texto'; tx.textContent = o.texto; caixa.insertBefore(tx, dica); }
    document.body.append(caixa);
    const T = montarTitulo(cv, o); let pode = false; setTimeout(() => { pode = true; caixa.classList.add('pode'); }, o.min ?? 1400);
    const fecha = () => { if (!pode) { T.pular(); return; } T.parar(); caixa.remove(); removeEventListener('keydown', tecla, true); clearInterval(pad); res(); };
    const tecla = e => { e.preventDefault(); e.stopPropagation(); fecha(); };
    caixa.addEventListener('pointerdown', fecha); addEventListener('keydown', tecla, true);
    const pad = setInterval(() => { for (const gp of navigator.getGamepads?.() || []) if (gp?.buttons.some(b => b.pressed)) fecha(); }, 120);
    if (o.auto) setTimeout(() => { pode = true; fecha(); }, o.auto);
  });
}
