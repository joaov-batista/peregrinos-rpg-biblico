// O palco de cada chefe muda durante a luta: o ouro de Mamom se amontoa, o relógio da Procrastinação anda para trás,
// o convés de Jonas inclina, o ventre se fecha, a torre de Babilônia sobe, a árvore de Daniel 4 é cortada…
// Só desenha: lê b.cen (o estado do palco, que o golpe e o estilo do chefe atualizam). "frente" = por cima de tudo.
import { TAU } from '../../util.js';
import { PX, Sprite, cor } from './raster.js';
import { CHEFES_E } from './chefes-e.js';
// os zelotes sentados nos tronos: o mesmo desenho da luta, numa pose sentada (um quadro só para eles)
const SENTADO = new Sprite(120, 112), FIGURA = { menaem: { id: 'zelotePunhal', cen: {} }, eleazar: { id: 'conselho', cen: { quem: 'eleazar' } }, jair: { id: 'zeloteFoice', cen: {} } };
function sentado(g, quem, x, y, face, Tm) { const f = FIGURA[quem]; Object.assign(f, { mov: null, quebrado: 0, tonto: 0, tele: 0, sentado: true, alpha: 1 }); SENTADO.limpa(); CHEFES_E[f.id](SENTADO, f, Tm); SENTADO.contorno(cor('#4A4460')); g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(face, 1); g.drawImage(SENTADO.tela(), -60, -104); g.restore(); }

const px = (g, x, y, w = 1, h = 1) => g.fillRect(Math.round(x), Math.round(y), w, h);
function linha(g, x0, y0, x1, y1, passo = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / passo)); for (let i = 0; i <= n; i++) px(g, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); }
function corrente(g, x0, y0, x1, y1, Tm) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3)); for (let i = 0; i <= n; i++) { g.fillStyle = (i + Math.floor(Tm * 8)) % 2 ? '#B8B0A0' : '#5A544A'; px(g, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 2, 2); } }

const FUNDO = {
  mamom(g, b, A, Tm) { // pilhas de ouro nos cantos, crescendo
    const h = Math.round(6 + b.cen.ouro * 46), tr = b.cen.treme ? Math.round(Math.sin(Tm * 50)) : 0;
    for (const lado of [0, 1]) for (let i = 0; i < 70; i++) { const k = i / 70, alt = Math.round(h * (1 - k * k)), x = lado ? A.x1 - i : A.x0 + i; g.fillStyle = '#8A5A1C'; px(g, x + tr, A.chao - alt, 1, alt); g.fillStyle = (i + Math.floor(Tm * 3)) % 7 ? '#D9A63C' : '#FFF3C4'; px(g, x + tr, A.chao - alt, 1, 2); }
  },
  procrastinacao(g, b, A, Tm) { // o relógio gigante ao fundo
    const cx = (A.x0 + A.x1) >> 1, cy = A.y0 + 70, r = 54;
    g.fillStyle = '#1E2A33'; for (let yy = -r; yy <= r; yy++) { const l = Math.round(Math.sqrt(r * r - yy * yy)); px(g, cx - l, cy + yy, l * 2, 1); }
    g.fillStyle = '#A5CDCE'; for (let a = 0; a < 60; a++) { const an = a / 60 * TAU; px(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r, a % 5 ? 1 : 2, a % 5 ? 1 : 2); }
    const h = b.cen.horas || 0; g.fillStyle = b.cen.volta ? '#FFB05A' : '#E4F2F2'; linha(g, cx, cy, cx + Math.cos(h - Math.PI / 2) * 30, cy + Math.sin(h - Math.PI / 2) * 30); linha(g, cx, cy, cx + Math.cos(h * 12 - Math.PI / 2) * 46, cy + Math.sin(h * 12 - Math.PI / 2) * 46);
    if (b.cen.volta) { g.fillStyle = '#FFB05A'; for (let i = 0; i < 6; i++) { const an = -Tm * 3 + i; px(g, cx + Math.cos(an) * (r + 5), cy + Math.sin(an) * (r + 5), 2, 1); } }
  },
  mentira(g, b, A, Tm) { // espelhos falsos que se acendem
    const n = b.cen.espelhos || 2;
    for (let i = 0; i < n; i++) { const x = A.x0 + 20 + i * (A.x1 - A.x0 - 40) / Math.max(1, n - 1) - 12, y = A.chao - 90 - (i % 2) * 30; g.fillStyle = '#2A1F3A'; px(g, x - 1, y - 1, 26, 42); g.fillStyle = (Math.floor(Tm * 4) + i) % 6 ? '#4A3A6A' : '#C79BFF'; px(g, x, y, 24, 40); g.fillStyle = 'rgba(232,220,255,.35)'; px(g, x + 3, y + 3, 2, 30); g.fillStyle = '#1A1228'; px(g, x + 8, y + 12, 8, 16); px(g, x + 10, y + 8, 4, 4); }
    if (b.cen.laco) { g.fillStyle = Math.floor(Tm * 12) % 2 ? '#C79BFF' : '#FFFFFF'; linha(g, b.x, b.y - b.h * 0.5, b.cen.laco.x, b.cen.laco.y, 3); } // a linha da troca: dela até o lugar marcado
  },
  satanas(g, b, A, Tm) { // o céu racha em vermelho; fogo nas bordas
    g.fillStyle = '#7A1A14'; for (let i = 0; i < 4; i++) { let x = A.x0 + 60 + i * 230, y = A.y0; for (let k = 0; k < 18; k++) { px(g, x, y); x += ((i * 7 + k * 3) % 5) - 2; y += 4; } }
    const f = b.cen.fogo || 0; for (const lado of [0, 1]) for (let i = 0; i < 40; i++) { const x = lado ? A.x1 - i : A.x0 + i, h = Math.round((1 - i / 40) * 60 * f * (0.7 + 0.3 * Math.sin(Tm * 9 + i))); g.fillStyle = '#C9281F'; px(g, x, A.chao - h, 1, h); g.fillStyle = '#FF8A2A'; px(g, x, A.chao - h, 1, Math.min(h, 3)); }
  },
  fuga(g, b, A, Tm) { // o horizonte e a amurada inclinam com o convés
    const incl = b.cen.incl || 0, cx = (A.x0 + A.x1) >> 1;
    for (let x = A.x0; x < A.x1; x += 2) { const y = A.chao - 120 + (x - cx) * incl * 0.12 + Math.sin(x * 0.05 + Tm * 2) * 2; g.fillStyle = '#1C5A6E'; px(g, x, y, 2, 3); g.fillStyle = '#3A9AB0'; px(g, x, y, 2, 1); }
    if (b.cen.corda) { g.fillStyle = '#B49C65'; linha(g, cx, A.y0, b.cen.corda.x, b.cen.corda.y, 2); }
    if (b.cen.corrente) corrente(g, b.cen.corrente.x, b.cen.corrente.y, b.x, b.y - 20, Tm);
  },
  pavor(g, b, A, Tm) { // nuvens pesadas, relâmpago no fundo, nuvem que te segue
    g.fillStyle = '#141A26'; for (let i = 0; i < 9; i++) { const x = A.x0 + i * 110 + Math.sin(Tm * 0.4 + i) * 20, y = A.y0 + 10 + (i % 3) * 8; for (let k = 0; k < 5; k++) px(g, x + k * 10 - 20, y - Math.abs(k - 2) * 3, 16, 10); }
    if (b.cen.flash > 0) { g.fillStyle = '#F4E6AE'; let x = b.cen.raioX, y = A.y0; for (let k = 0; k < 40; k++) { px(g, x, y, 2, 4); x += ((k * 13) % 7) - 3; y += 6; if (y > A.chao) break; } }
    if (b.cen.nuvem != null) { g.fillStyle = '#2A3346'; px(g, b.cen.nuvem - 30, A.y0 + 30, 60, 10); px(g, b.cen.nuvem - 20, A.y0 + 24, 40, 6); }
  },
  desespero(g, b, A, Tm) { // as paredes de carne do ventre avançam
    const lim = (A.x1 - A.x0) * (b.cen.aperto || 0);
    for (const lado of [0, 1]) for (let y = A.y0; y < A.chao; y += 2) { const ond = Math.sin(y * 0.08 + Tm * 2) * 4, w = lim + 12 + ond, x = lado ? A.x1 - w : A.x0; g.fillStyle = '#4A1A2A'; px(g, x, y, w, 2); g.fillStyle = '#7A2A3A'; px(g, lado ? x : x + w - 2, y, 2, 2); }
  },
  violencia(g, b, A, Tm) { // as muralhas de Nínive rachando, com fogo nas janelas
    const r = b.cen.ruina || 0;
    for (let i = 0; i < 6; i++) { const x = A.x0 + 30 + i * 150, h = 110 - (i % 2) * 20 - (i < r * 3 ? 40 : 0); g.fillStyle = '#3A2A22'; px(g, x, A.chao - h, 70, h); g.fillStyle = '#5A4234'; for (let k = 0; k < h; k += 12) px(g, x, A.chao - h + k, 70, 1);
      if ((i + r) % 2) { g.fillStyle = Math.floor(Tm * 8 + i) % 2 ? '#FF8A2A' : '#C9281F'; px(g, x + 28, A.chao - h + 20, 12, 14); } }
    if (b.cen.corrente) corrente(g, b.x, b.y - b.h * 0.55, b.cen.corrente.x, b.cen.corrente.y, Tm);
    if (b.cen.gira) { g.fillStyle = '#B8B0A0'; for (let i = 0; i < 2; i++) { const an = Tm * 12 + i * Math.PI; corrente(g, b.x, b.y - 40, b.x + Math.cos(an) * 110, b.y - 40 + Math.sin(an) * 50, Tm); } }
  },
  ressentimento(g, b, A, Tm) { // a aboboreira e o sol; o verme cava
    const x = b.cen.planta, f = b.cen.folhas || 1, h = 110;
    g.fillStyle = '#5A3A1E'; px(g, x - 2, A.chao - h, 4, h);
    for (let i = 0; i < 40 * f; i++) { const a = i * 2.4, r = 20 + (i % 7) * 9 * f; g.fillStyle = i % 3 ? '#3F7A3A' : f < 0.5 ? '#9A8A3A' : '#5FA35A'; px(g, x + Math.cos(a) * r, A.chao - h + Math.sin(a) * r * 0.35, 4, 3); }
    const s = b.cen.brilho ? 1 : (b.cen.calor || 0.2); g.fillStyle = '#FFE08A'; for (let rr = 18; rr > 0; rr -= 3) { g.globalAlpha = 0.1 + s * 0.15; px(g, A.x1 - 80 - rr, A.y0 + 30 - rr, rr * 2, rr * 2); } g.globalAlpha = 1;
    if (b.cen.brilho) { g.fillStyle = 'rgba(255,200,120,.12)'; px(g, A.x0, A.y0, A.x1 - A.x0, A.chao - A.y0); }
    if (b.cen.verme != null) { g.fillStyle = '#8A6A3A'; const vx = b.cen.verme; for (let i = -6; i <= 6; i++) px(g, vx + i * 2, A.chao - 2 - Math.max(0, 3 - Math.abs(i) * 0.5) - (Math.floor(Tm * 10 + i) % 2), 2, 2); }
  },
  encantadores(g, b, A, Tm) { // a roda do zodíaco, os tripés e a constelação que vai queimar
    const cx = (A.x0 + A.x1) >> 1, cy = A.y0 + 60, r = 70, a0 = b.cen.roda || 0;
    g.fillStyle = '#7A88C8'; for (let a = 0; a < 80; a++) { const an = a / 80 * TAU; px(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.5); }
    for (let i = 0; i < 12; i++) { const an = a0 + i / 12 * TAU; g.fillStyle = i % 3 ? '#9FB0F0' : '#FFF3C4'; px(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.5, 2, 2); }
    for (const tx of b.cen.tripes || []) { g.fillStyle = '#2A2440'; linha(g, tx - 8, A.chao, tx, A.chao - 22); linha(g, tx + 8, A.chao, tx, A.chao - 22); g.fillStyle = '#6A5AA0'; px(g, tx - 6, A.chao - 24, 12, 3); g.fillStyle = 'rgba(160,140,220,.35)'; px(g, tx - 3, A.chao - 34 - (Math.floor(Tm * 6) % 4), 6, 8); }
    const e = b.cen.estrelas; if (e) { for (let i = 0; i < e.length; i++) { g.fillStyle = '#FFFFFF'; px(g, e[i].x - 2, e[i].y - 2, 4, 4); if (i < e.length - 1) { g.fillStyle = b.cen.acesa ? '#FFFFFF' : '#9FB0F0'; linha(g, e[i].x, e[i].y, e[i + 1].x, e[i + 1].y, b.cen.acesa ? 1 : 4); } } }
  },
  jugo(g, b, A, Tm) { // a muralha de tijolos cresce, fileira por fileira
    const n = Math.floor(b.cen.tijolos || 0); g.globalAlpha = 0.8; // a muralha sobe do chão, atrás da luta
    for (let r = 0; r < n; r++) for (let x = A.x0 + 40 + (r % 2) * 8; x < A.x1 - 40; x += 17) { g.fillStyle = '#5A3420'; px(g, x, A.chao - 7 - r * 7, 15, 6); g.fillStyle = '#8A5A32'; px(g, x, A.chao - 7 - r * 7, 15, 1); }
    g.globalAlpha = 1; if (b.amarrado) corrente(g, b.x, b.y - b.h * 0.5, b.px, b.py, Tm); // só quem foi pego tem a corrente
  },
  babilonia(g, b, A, Tm) { // a cidade e o zigurate sobem; a torre sob o trono
    const k = b.cen.cidade || 0.3;
    for (let i = 0; i < 9; i++) { const x = A.x0 + 10 + i * 100, h = Math.round((50 + (i * 37) % 70) * k); g.fillStyle = '#5A3A22'; px(g, x, A.chao - h, 60, h); g.fillStyle = '#C98A3A'; for (let s = 0; s < h; s += 14) px(g, x + s / 6, A.chao - h + s, 60 - s / 3, 2); }
    const topo = b.y + 10, cx = b.x; g.fillStyle = '#7A5A2A'; px(g, cx - 40, topo, 80, A.chao - topo); g.fillStyle = '#E0B45A'; for (let y = topo; y < A.chao; y += 10) px(g, cx - 40, y, 80, 1);
    if (b.cen.ceu > 0) { g.globalAlpha = b.cen.ceu * 0.35; g.fillStyle = '#FFF8E6'; const cxx = (A.x0 + A.x1) / 2; for (let i = 0; i < 7; i++) { const w = 6 + i * 2; px(g, cxx - 300 + i * 100, A.y0, w, A.chao - A.y0); } g.globalAlpha = 1; }
  },
  fera(g, b, A, Tm) { // o céu gira de dia para noite (sete tempos); o capim cresce
    const n = b.cen.noite || 0; g.globalAlpha = n * 0.5; g.fillStyle = '#0A1030'; px(g, A.x0, A.y0, A.x1 - A.x0, A.chao - A.y0); g.globalAlpha = 1;
    const a = (b.cen.tempo || 0) * TAU, cx = (A.x0 + A.x1) / 2; g.fillStyle = n > 0.5 ? '#E4F2F2' : '#FFD86A'; px(g, cx + Math.cos(a) * 340 - 6, A.y0 + 90 - Math.abs(Math.sin(a)) * 70, 12, 12);
    g.fillStyle = '#FFE9A8'; for (let i = 0; i < 7; i++) px(g, A.x0 + 20 + i * 8, A.y0 + 10, 4, 4); // sete marcas: os sete tempos
    const h = 4 + (b.cen.capim || 0) * 14; for (let x = A.x0; x < A.x1; x += 3) { const hh = h + ((x * 7) % 5), bal = Math.round(Math.sin(Tm * 2 + x * 0.1) * 2); g.fillStyle = (x * 3) % 5 ? '#4A6A2A' : '#7A9A3A'; px(g, x + bal, A.chao - hh, 1, hh); }
    if (b.cen.riscos) for (const r of b.cen.riscos) if (r.t > 0) { g.fillStyle = Math.floor(Tm * 14) % 2 ? '#FFFFFF' : '#B7C7A0'; linha(g, r.x - 72, r.y - r.s * 72, r.x + 72, r.y + r.s * 72, 5); }
  },
  soberba(g, b, A, Tm) { // a grande árvore de Daniel 4: galhos cortados a cada fase, por fim o toco com cinta de ferro e bronze
    const cx = (A.x0 + A.x1) / 2, galhos = b.cen.arvore ?? 3, base = A.chao, tronco = galhos > 0 ? 200 : 60;
    g.fillStyle = '#3A2A1A'; px(g, cx - 14, base - tronco, 28, tronco);
    for (let i = 0; i < galhos; i++) { const y = base - 110 - i * 30; for (const s of [-1, 1]) { g.fillStyle = '#3A2A1A'; linha(g, cx, y, cx + s * (90 - i * 15), y - 30); g.fillStyle = '#2F5A3A'; for (let k = 0; k < 30; k++) px(g, cx + s * (60 - i * 10) + Math.cos(k) * (30 - i * 4), y - 40 + Math.sin(k * 1.7) * 14, 5, 4); } }
    if (galhos <= 0) { g.fillStyle = '#6E7A84'; px(g, cx - 16, base - 44, 32, 5); g.fillStyle = '#B07A3A'; px(g, cx - 16, base - 34, 32, 5); }
  },
  golias(g, b, A, Tm) { // o ribeiro de onde vieram as cinco pedras lisas (1Sm 17:40)
    g.fillStyle = '#1C5A6E'; for (let x = A.x0 + 30; x < A.x0 + 180; x++) px(g, x, A.chao - 3 + Math.round(Math.sin(x * 0.2 + Tm * 3)), 1, 2);
    // as pedras já não esperam no ribeiro: aparecem pelo vale, uma de cada vez (jogo.js › vale)
  },
  behemote(g, b, A, Tm) { // as rachaduras no chão e o rio que sobe
    const n = Math.min(12, b.cen.rachas || 0); g.fillStyle = '#2A1F14';
    for (let i = 0; i < n; i++) { let x = A.x0 + 40 + ((i * 197) % (A.x1 - A.x0 - 80)), y = A.chao - 1; for (let k = 0; k < 10; k++) { px(g, x, y, 2, 1); x += ((i + k) % 3) - 1 + (k % 2 ? 3 : -2); y -= 1; } }
  },
  leviata(g, b, A, Tm) { // o vórtice
    if (b.cen.vortice != null) { const vx = b.cen.vortice; for (let i = 0; i < 40; i++) { const an = Tm * 6 + i * 0.5, r = (i % 10) * 7; g.fillStyle = i % 2 ? '#BFF0F8' : '#3A9AB0'; px(g, vx + Math.cos(an) * r, A.chao - 20 + Math.sin(an) * r * 0.3, 2, 1); } }
  }
};

// ---- as páginas vivas da história ----
Object.assign(FUNDO, {
  amargura(g, b, A, Tm) { // a câmara forrada de raízes: o espinheiro cresce pelas paredes e pelo teto conforme ela apanha; as raízes sobem às casas
    const L = A.x1 - A.x0, k = b.cen.espinhos || 0, f = b.cen.fase || 0;
    for (let i = 0; i < 9; i++) { const x = A.x0 + 10 + i * (L - 20) / 8, bal = Math.sin(Tm * 0.8 + i) * 2; g.fillStyle = '#0B100A'; for (let y = A.y0; y < A.y0 + 40 + (i % 3) * 22 + k * 30; y += 2) px(g, x + Math.sin(y * 0.09 + i) * 4 + bal * (y - A.y0) / 80, y, 2 + (i % 2), 2); g.fillStyle = f ? '#B8E060' : '#6A8A30'; px(g, x + Math.sin((A.y0 + 30) * 0.09 + i) * 4, A.y0 + 30 + ((Math.floor(Tm * 6) + i * 7) % 26), 1, 2); }
    const n = Math.round(4 + k * 26); g.fillStyle = '#16200F'; for (let i = 0; i < n; i++) { const lado = i % 2, t = (i >> 1) / 14, x = lado ? A.x1 - 4 - t * 60 : A.x0 + 4 + t * 60, y = A.chao - 6 - ((i * 37) % 130); px(g, x, y, 10, 2); px(g, x + (lado ? 8 : 0), y - 3, 2, 3); px(g, x + (lado ? 0 : 8), y + 2, 2, 3); g.fillStyle = i % 5 ? '#16200F' : '#3A5A2A'; }
    if (f >= 2) { g.fillStyle = 'rgba(184,224,96,.07)'; px(g, A.x0, A.y0, L, A.chao - A.y0); }
    const cx = A.x0 + L / 2; g.fillStyle = '#0B100A'; for (let i = -3; i <= 3; i++) for (let y = 0; y < 26; y += 2) px(g, cx + i * 16 + Math.sin(y * 0.2 + i) * 3, A.chao - y, 3, 2); // o toco de onde ela saiu
  },
  conselho(g, b, A, Tm) { // três tronos de pedra sobre um estrado; quem não está na sala fica sentado no seu. Os braseiros acendem a cada fase
    const L = A.x1 - A.x0, cx = A.x0 + L * 0.5, base = A.chao - 40, assento = base - 22, f = b.cen.fase || 0, z = b.zel || {};
    g.fillStyle = '#1C0E0C'; px(g, cx - 104, base, 208, 6); g.fillStyle = '#2E1A16'; px(g, cx - 104, base, 208, 1); px(g, cx - 96, base + 6, 192, 4); px(g, cx - 88, base + 10, 176, 30); g.fillStyle = '#241210'; for (let k = 0; k < 4; k++) px(g, cx - 88, base + 16 + k * 6, 176, 1); // o estrado e os degraus
    const marca = { menaem: '#8E2B45', eleazar: '#C9963C', jair: '#E8E2D0' };
    for (const [quem, i] of [['menaem', -1], ['eleazar', 0], ['jair', 1]]) {
      const x = cx + i * 64, alto = i === 0 ? 92 : 80, topo = assento - alto;
      g.fillStyle = '#120908'; px(g, x - 19, topo, 38, alto + 22); g.fillStyle = '#2E1A16'; px(g, x - 18, topo + 1, 36, alto + 20); g.fillStyle = '#3E2620'; px(g, x - 18, topo + 1, 3, alto + 20); px(g, x - 14, topo - 6, 28, 6); g.fillStyle = '#120908'; px(g, x - 3, topo - 12, 6, 7); // o espaldar
      g.fillStyle = marca[quem]; px(g, x - 1, topo + 5, 2, 2); px(g, x - 3, topo + 7, 6, 2); px(g, x - 4, topo + 9, 8, 2); px(g, x - 3, topo + 11, 6, 2); px(g, x - 1, topo + 13, 2, 2); // a marca de cada um (um losango)
      if (!z[quem]) sentado(g, quem, x, assento + 2, i < 0 ? 1 : i > 0 ? -1 : (b.px < x ? -1 : 1), Tm);
      g.fillStyle = '#120908'; px(g, x - 22, assento - 14, 8, 18); px(g, x + 14, assento - 14, 8, 18); g.fillStyle = '#3E2620'; px(g, x - 21, assento - 13, 6, 3); px(g, x + 15, assento - 13, 6, 3); // os braços do trono, por cima
      g.fillStyle = '#241210'; px(g, x - 20, assento + 2, 40, 4);
    }
    for (const [k, lado] of [[0, -1], [1, 1], [2, -1], [3, 1]]) { const x = cx + lado * (124 + (k > 1 ? 34 : 0)), y = A.chao - 2, aceso = k < 2 + f; g.fillStyle = '#120908'; px(g, x - 1, y - 30, 3, 30); px(g, x - 6, y - 34, 13, 5); g.fillStyle = '#3E2620'; px(g, x - 5, y - 33, 11, 3); if (aceso) { g.fillStyle = '#FF7A3C'; const h = 4 + (Math.floor(Tm * 9 + k) % 3); px(g, x - 3, y - 34 - h, 7, h); g.fillStyle = '#FFD23F'; px(g, x - 1, y - 33 - h + 2, 3, h - 2); } }
    for (const dx of [-140, 140]) { g.fillStyle = '#120908'; px(g, cx + dx - 7, A.y0 + 6, 14, 54); g.fillStyle = '#6A1A16'; px(g, cx + dx - 6, A.y0 + 6, 12, 50); g.fillStyle = '#C9D2E0'; px(g, cx + dx - 1, A.y0 + 12, 2, 28); px(g, cx + dx, A.y0 + 10, 1, 2); g.fillStyle = '#C9963C'; px(g, cx + dx - 5, A.y0 + 22, 10, 2); } // os estandartes com a espada
    // as rachaduras que avisam e as brechas que ficam na parede por onde eles saíram
    for (const r of b.cen.rachas || []) { const k = Math.min(1, r.t / 0.3), d = -r.lado, n = Math.round(4 + k * 8); g.fillStyle = Math.floor(Tm * 14) % 2 ? '#FF7A3C' : '#FFD08A';
      for (let i = 0; i < n; i++) { const yy = r.y - Math.round(r.alto * 0.5) + Math.round(Math.sin(i * 2.3) * r.alto * 0.45 * k), xx = r.x + d * Math.round(((i * 5) % 7) * k); px(g, xx, yy, 1 + (i % 2), 1); }
      g.fillStyle = '#0A0605'; for (let i = 0; i < n; i++) px(g, r.x + d * ((i * 3) % 5), r.y - Math.round(r.alto * (i / n)), 2, 2); }
    for (const q of b.cen.brechas || []) { const d = -q.lado, h = q.alto, y0 = q.y - h, a = q.t > 7 ? 1 - (q.t - 7) / 2 : 1; g.globalAlpha = a;
      for (let yy = 0; yy < h; yy++) { const w = Math.round(9 + Math.sin(yy * 0.9) * 2 + Math.sin(yy * 0.31) * 3 - Math.abs(yy - h / 2) * 0.18); g.fillStyle = '#050303'; px(g, d > 0 ? q.x : q.x - w, y0 + yy, w, 1); g.fillStyle = '#5A3A2E'; px(g, d > 0 ? q.x + w : q.x - w - 1, y0 + yy, 1, 1); }
      g.fillStyle = '#3E2620'; for (let i = 0; i < 7; i++) px(g, q.x + d * (3 + ((i * 7) % 13)), q.y - 2 - (i % 3), 3, 2 + (i % 2)); // o entulho no pé da parede
      if (q.t < 0.4) { g.globalAlpha = (1 - q.t / 0.4) * 0.7; g.fillStyle = '#FFD08A'; px(g, d > 0 ? q.x : q.x - 6, y0 + 2, 6, h - 4); }
      g.globalAlpha = 1; }
  },
  escassez(g, b, A, Tm) { // o sol da seca, a árvore morta, a prateleira da viúva, o chão que racha; e a botija que não falta
    const L = A.x1 - A.x0, k = b.cen.seca || 0, cx = A.x0 + L * 0.5, cy = A.y0 + 34, r = 22 + Math.round(k * 8);
    for (let yy = -r; yy <= r; yy++) { const l = Math.round(Math.sqrt(r * r - yy * yy)); g.fillStyle = k > 0.7 ? '#C24A2A' : k > 0.4 ? '#D98A3C' : '#E8C878'; px(g, cx - l, cy + yy, l * 2, 1); }
    g.fillStyle = 'rgba(255,220,150,.35)'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + Tm * 0.1; linha(g, cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3), cx + Math.cos(a) * (r + 9 + k * 8), cy + Math.sin(a) * (r + 9 + k * 8), 2); }
    g.fillStyle = '#2A1C12'; const tx = A.x0 + 26; px(g, tx, A.chao - 46, 3, 46); linha(g, tx + 1, A.chao - 34, tx - 12, A.chao - 50); linha(g, tx + 1, A.chao - 40, tx + 13, A.chao - 58); linha(g, tx - 12, A.chao - 50, tx - 16, A.chao - 60); linha(g, tx + 13, A.chao - 58, tx + 20, A.chao - 62); linha(g, tx + 1, A.chao - 46, tx + 2, A.chao - 58);
    const sx = A.x1 - 44; g.fillStyle = '#3A2A1E'; px(g, sx - 14, A.chao - 40, 30, 2); px(g, sx - 12, A.chao - 38, 1, 6); px(g, sx + 13, A.chao - 38, 1, 6);
    g.fillStyle = '#5A4636'; px(g, sx - 10, A.chao - 47, 10, 7); g.fillStyle = '#7A6248'; px(g, sx - 11, A.chao - 48, 12, 1); // a panela
    g.fillStyle = '#8E5A32'; px(g, sx + 4, A.chao - 49, 7, 9); px(g, sx + 6, A.chao - 52, 3, 3); g.fillStyle = '#B8733E'; px(g, sx + 4, A.chao - 49, 2, 9); // a botija
    g.fillStyle = '#1A120C'; for (let i = 0; i < 3 + Math.round(k * 11); i++) { let x = A.x0 + 14 + ((i * 53) % (L - 28)), y = A.chao; for (let j = 0; j < 4 + (i % 3) * 2; j++) { px(g, x, y); x += ((i * 7 + j * 5) % 3) - 1; y -= 1; } px(g, A.x0 + 14 + ((i * 53) % (L - 28)) - 2, A.chao, 5, 1); }
    const bo = b.cen.botija; if (bo && b.botPega !== bo.id) { const x = Math.round(A.x0 + bo.k * L), y = A.chao - 1 - (Math.floor(Tm * 3) % 2); g.fillStyle = 'rgba(255,217,138,.25)'; px(g, x - 7, y - 16, 15, 17); g.fillStyle = '#17121f'; px(g, x - 4, y - 11, 9, 11); px(g, x - 2, y - 14, 5, 3); g.fillStyle = '#B8733E'; px(g, x - 3, y - 10, 7, 9); g.fillStyle = '#E0A060'; px(g, x - 3, y - 10, 2, 8); g.fillStyle = '#8E5A32'; px(g, x - 1, y - 13, 3, 3); g.fillStyle = '#FFE9A8'; px(g, x - 1, y - 15, 3, 1); for (let i = 0; i < 3; i++) px(g, x - 5 + ((Math.floor(Tm * 6) + i * 4) % 11), y - 18 - i * 2, 1, 1); }
  },
  desprezo(g, b, A, Tm) { // a estrada de Jericó: a multidão de costas engrossa; a capa largada; a luz no fim da estrada é o clamor
    const L = A.x1 - A.x0, k = b.cen.gente || 0, cl = b.cen.clamor || 0, cx = A.x0 + L * 0.5;
    const lw = 3 + Math.round(cl * 22); g.fillStyle = 'rgba(255,241,190,' + (0.12 + cl * 0.5) + ')'; px(g, cx - lw, A.y0, lw * 2, A.chao - A.y0 - 26); g.fillStyle = 'rgba(255,255,255,' + (0.1 + cl * 0.6) + ')'; px(g, cx - Math.max(1, lw >> 2), A.y0, Math.max(2, lw >> 1), A.chao - A.y0 - 26);
    if (cl > 0.05) { g.fillStyle = '#FFE9A8'; for (let i = 0; i < 10; i++) if (i / 10 < cl) px(g, cx - 20 + i * 4, A.chao - 22, 3, 2); g.fillStyle = '#5A4A6A'; for (let i = 0; i < 10; i++) if (i / 10 >= cl) px(g, cx - 20 + i * 4, A.chao - 22, 3, 2); } // o clamor, em dez marcas
    const n = 8 + Math.round(k * 18); for (let i = 0; i < n; i++) { const x = A.x0 + 6 + ((i * 37) % (L - 12)), fila = i % 3, y = A.chao - 22 - fila * 5 + Math.round(Math.sin(Tm * 2 + i) * (b.cen.vozes > 0 ? 1.5 : 0.5)); if (Math.abs(x - cx) < lw + 4) continue; g.fillStyle = ['#2A2438', '#221C2E', '#1A1624'][fila]; px(g, x - 3, y, 7, 26); px(g, x - 2, y - 4, 5, 5); }
    g.fillStyle = '#5E4A3A'; px(g, A.x0 + 24, A.chao - 3, 14, 3); g.fillStyle = '#7A6248'; px(g, A.x0 + 26, A.chao - 4, 8, 1); px(g, A.x0 + 36, A.chao - 2, 4, 1); // a capa lançada fora (Mc 10:50)
  },
  carcere(g, b, A, Tm) { // a cela: grades ao fundo, a janela com a lua, tochas que se apagam; ao longe, as velas de quem ora
    const L = A.x1 - A.x0, k = b.cen.grades || 0, v = b.vigLocal || 0;
    g.fillStyle = '#15161E'; for (let x = A.x0 + 8; x < A.x1; x += 14) px(g, x, A.y0, 2, A.chao - A.y0); g.fillStyle = '#23252E'; for (let x = A.x0 + 8; x < A.x1; x += 14) px(g, x, A.y0, 1, A.chao - A.y0); for (const y of [A.y0 + 26, A.chao - 40]) { g.fillStyle = '#1C1E28'; px(g, A.x0, y, L, 3); }
    const wx = A.x0 + 40, wy = A.y0 + 44; g.fillStyle = '#0A0B12'; px(g, wx - 12, wy - 14, 24, 28); g.fillStyle = '#2E3A5A'; px(g, wx - 10, wy - 12, 20, 24); g.fillStyle = '#E8E4D0'; for (let yy = -5; yy <= 5; yy++) { const l = Math.round(Math.sqrt(25 - yy * yy)); px(g, wx + 2 - l, wy - 3 + yy, l * 2, 1); } g.fillStyle = '#0A0B12'; for (let i = -1; i <= 1; i++) px(g, wx + i * 6, wy - 12, 2, 24); px(g, wx - 10, wy, 20, 2);
    g.fillStyle = 'rgba(200,210,240,.07)'; for (let i = 0; i < 40; i++) px(g, wx - 8 + i, wy + 12 + i, 18, 1); // o luar entra de viés
    for (let i = 0; i < 4; i++) { const x = A.x0 + L * (0.3 + i * 0.18), y = A.y0 + 62, acesa = i >= Math.floor(k * 4.2); g.fillStyle = '#3A2A1E'; px(g, x, y, 2, 9); px(g, x - 2, y, 6, 2); if (acesa) { g.fillStyle = '#FF8A2A'; px(g, x - 1, y - 5 - (Math.floor(Tm * 9 + i) % 2), 4, 5); g.fillStyle = '#FFE08A'; px(g, x, y - 4, 2, 3); } else { g.fillStyle = '#4A4E5A'; px(g, x, y - 3 - (Math.floor(Tm * 3 + i) % 3), 1, 2); } }
    for (let i = 0; i < 3; i++) corrente(g, A.x0 + L * (0.22 + i * 0.3), A.y0, A.x0 + L * (0.22 + i * 0.3) + Math.sin(Tm * 1.4 + i) * 4, A.y0 + 30 + i * 8, Tm);
    // a casa de Maria, ao longe: cinco velas, uma por pedaço de vigília
    const hx = A.x1 - 46, hy = A.y0 + 40; g.fillStyle = '#1A1420'; px(g, hx - 16, hy - 10, 32, 22); g.fillStyle = '#2A2030'; px(g, hx - 18, hy - 12, 36, 3); g.fillStyle = v > 0.02 ? '#5A3E22' : '#0A0B12'; px(g, hx - 13, hy - 6, 26, 14);
    for (let i = 0; i < 5; i++) { const acesa = v * 5 > i + 0.2, x = hx - 10 + i * 5; g.fillStyle = '#C9C4B2'; px(g, x, hy + 2, 2, 5); if (acesa) { g.fillStyle = '#FFD23F'; px(g, x, hy - 1 - (Math.floor(Tm * 8 + i) % 2), 2, 3); g.fillStyle = '#FFFFFF'; px(g, x, hy, 1, 1); } }
    if (v > 0.02) { g.fillStyle = 'rgba(255,233,168,' + (0.08 + v * 0.3) + ')'; px(g, hx - 22, hy - 18, 44, 36); }
  }
});

const FRENTE = {
  conselho(g, b, A, Tm) { // as lanças que rompem o piso onde Eleazar caiu: brotam, ficam um instante e afundam
    for (const l of b.cen.lancas || []) { if (l.t < 0) { if (Math.floor(Tm * 16) % 2) { g.fillStyle = '#C9B48A'; for (let i = -6; i <= 6; i += 3) px(g, l.x + i, A.chao - 1, 2, 1); } continue; }
      const k = l.t < 0.08 ? l.t / 0.08 : l.t > 0.55 ? Math.max(0, 1 - (l.t - 0.55) / 0.2) : 1, h = Math.round(28 * k);
      for (const [dx, hh] of [[-6, 0.7], [0, 1], [6, 0.8]]) { const H = Math.round(h * hh), x = l.x + dx; if (H < 2) continue;
        g.fillStyle = '#17121f'; px(g, x - 1, A.chao - H, 3, H); g.fillStyle = '#8A5A36'; px(g, x, A.chao - H + 5, 1, H - 5);
        g.fillStyle = '#17121f'; px(g, x - 2, A.chao - H - 1, 5, 5); g.fillStyle = '#EEF6FB'; px(g, x, A.chao - H - 1, 1, 5); px(g, x - 1, A.chao - H + 1, 3, 2); g.fillStyle = '#FFFFFF'; px(g, x, A.chao - H - 1, 1, 1); }
      if (l.t < 0.15) { g.fillStyle = '#C9B48A'; g.globalAlpha = 1 - l.t / 0.15; px(g, l.x - 10, A.chao - 3, 20, 3); g.globalAlpha = 1; } }
  },
  imoralidade(g, b, A, Tm) { // névoa rosada que sobe do chão
    const k = b.cen.nevoa || 0.25, h = 30 + k * 90;
    for (let y = 0; y < h; y += 2) { g.globalAlpha = (1 - y / h) * 0.28 * (0.6 + k); g.fillStyle = '#FF8FB8'; for (let x = A.x0; x < A.x1; x += 4) if ((x + y + Math.floor(Tm * 6)) % 3) px(g, x + Math.sin(Tm + y * 0.1) * 6, A.chao - y, 4, 2); } g.globalAlpha = 1;
  },
  behemote(g, b, A, Tm) { // o rio transborda pela savana
    const r = b.cen.rio || 0; if (r <= 0) return; const h = Math.round(r * 14);
    for (let x = A.x0; x < A.x1; x++) { const o = Math.round(Math.sin(x * 0.08 + Tm * 2) * 1.5); g.globalAlpha = 0.65; g.fillStyle = '#1C5A6E'; px(g, x, A.chao - h + o, 1, h); g.globalAlpha = 1; g.fillStyle = (x + Math.floor(Tm * 6)) % 9 < 2 ? '#BFF0F8' : '#3A9AB0'; px(g, x, A.chao - h + o); }
  },
  leviata(g, b, A, Tm) { // o mar sobe pelo convés; a fumaça escurece o alto
    const h = Math.round((b.cen.mar || 0) * 22);
    for (let x = A.x0; x < A.x1; x++) { const o = Math.round(Math.sin(x * 0.07 + Tm * 2.4) * 2); g.globalAlpha = 0.55; g.fillStyle = '#123847'; px(g, x, A.chao - h + o, 1, h); g.globalAlpha = 1; if ((x + Math.floor(Tm * 5)) % 11 < 2) { g.fillStyle = '#BFF0F8'; px(g, x, A.chao - h + o); } }
    if (b.cen.fumo > 0) { g.globalAlpha = b.cen.fumo * 0.35; g.fillStyle = '#1A1F26'; for (let i = 0; i < 12; i++) px(g, A.x0 + i * 80 + Math.sin(Tm + i) * 20, A.y0 + (i % 3) * 14, 90, 28); g.globalAlpha = 1; }
  },
  pavor(g, b, A, Tm) { // a chuva inclinada da tempestade
    g.fillStyle = 'rgba(190,220,240,.45)'; for (let i = 0; i < 80; i++) { const x = A.x0 + ((i * 97 + Tm * 400) % (A.x1 - A.x0)), y = A.y0 + ((i * 53 + Tm * 900) % (A.chao - A.y0)); px(g, x, y, 1, 6); }
  }
};

// x e y em coordenadas do mundo; X e Y convertem para a tela de pixels
export function pintarPalco(g, G, b, X, Y, Tm, frente) {
  const pintor = (frente ? FRENTE : FUNDO)[b.id]; if (!pintor || !G.N.arena) return;
  const A0 = G.N.arena, A = { x0: X(A0.x0), x1: X(A0.x1), y0: Y(A0.y0), chao: Y(A0.chao) };
  // o chefe e o jogador também em pixels (as cordas e correntes ligam os dois)
  const zel = b.id !== 'conselho' ? null : G.figurantes?.length || b.morrendo ? { menaem: 1, eleazar: 1, jair: 1 } : { menaem: G.inimigos.some(q => q.hp > 0 && ((q.alpha ?? 1) > 0.1 || q.oculto) && (q.id === 'zelotePunhal' || (q.id === 'conselho' && q.cen?.quem === 'menaem'))), eleazar: G.inimigos.some(q => q.id === 'conselho' && q.cen?.quem === 'eleazar' && ((q.alpha ?? 1) > 0.1 || q.oculto)), jair: G.inimigos.some(q => q.id === 'zeloteFoice' && ((q.alpha ?? 1) > 0.1 || q.oculto)) }; // quem está fora do trono (na cena do respeito, todos de pé)
  const bb = { ...b, zel, x: X(b.x), y: Y(b.y), h: b.h / PX, w: b.w / PX, px: X(G.p.x), py: Y(G.p.y - 20), amarrado: G.amarra > 0, cen: {
    ...b.cen,
    laco: b.cen.laco ? { x: X(b.cen.laco.x), y: Y(b.cen.laco.y) } : 0,
    planta: b.cen.planta != null ? X(b.cen.planta) : null, verme: b.cen.verme != null ? X(b.cen.verme) : null, nuvem: b.cen.nuvem != null ? X(b.cen.nuvem) : null, raioX: b.cen.raioX != null ? X(b.cen.raioX) : null,
    vortice: b.cen.vortice != null ? X(b.cen.vortice) : null, tripes: b.cen.tripes?.map(X),
    corda: b.cen.corda ? { x: X(b.cen.corda.x), y: Y(b.cen.corda.y) } : null, corrente: b.cen.corrente ? { x: X(b.cen.corrente.x), y: Y(b.cen.corrente.y) } : null,
    brechas: b.id === 'conselho' ? (G.zelBrechas || []).map(q => ({ x: X(q.x), y: Y(q.y), lado: q.lado, alto: Math.round(q.alto / PX), t: q.t })) : null,
    rachas: b.id === 'conselho' ? (G.zelRachas || []).map(q => ({ x: X(q.x), y: Y(q.y), lado: q.lado, alto: Math.round(q.alto / PX), t: q.t })) : null,
    lancas: b.id === 'conselho' ? (G.zelLancas || []).map(q => ({ x: X(q.x), t: q.t })) : null,
    estrelas: b.cen.estrelas?.map(e => ({ x: X(e.x), y: Y(e.y) })), riscos: b.cen.riscos?.map(r => ({ x: X(r.x), y: Y(r.y), s: r.s, t: r.t }))
  } };
  g.save(); pintor(g, bb, A, Tm); g.restore(); g.globalAlpha = 1;
}
