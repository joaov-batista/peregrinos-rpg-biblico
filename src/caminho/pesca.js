// Pesca no Mar da Galileia, com Simão. Um botão só (segurar / soltar), três tempos:
// 1) LANÇAR: a barra de força vai e volta; o toque decide a distância do lance.
// 2) FUNDO: o anzol afunda sozinho; segurar o recolhe. É assim que se escolhe o peixe: os grandes e os raros andam no fundo.
// 3) BRIGA: segurar puxa o peixe para o barco, mas estica a linha. Quando ele dispara (fica claro e treme), solte, ou a linha arrebenta.
import { h } from '../util.js';
import { sfx } from '../audio.js';
import { DONS } from './dados.js';

const W = 384, H = 216, MAR = 66, FUNDO = 198, BX = 62;
// faixa: 0 raso, 1 meio, 2 fundo · forca: quanto puxa a linha · v: denários
const PEIXES = {
  sardinha: { nome: 'Sardinha', w: 11, h: 5, vel: 46, faixa: [0, 0], forca: 0.7, v: [8, 14], cor: ['#8FB8C8', '#DCEFF4'], peso: 30 },
  tilapia: { nome: 'Tilápia do mar da Galileia', w: 15, h: 8, vel: 34, faixa: [0, 1], forca: 1, v: [20, 32], cor: ['#7E9A6E', '#D8E2B8'], peso: 24 },
  bagre: { nome: 'Bagre', w: 20, h: 7, vel: 26, faixa: [1, 2], forca: 1.35, v: [38, 56], cor: ['#5E5870', '#B8B0C8'], peso: 14 },
  dourado: { nome: 'Peixe grande', w: 28, h: 12, vel: 22, faixa: [2, 2], forca: 1.9, v: [95, 135], cor: ['#C98A2E', '#FFE08A'], peso: 6 },
  sandalia: { nome: 'Sandália velha', w: 10, h: 5, vel: 9, faixa: [0, 2], forca: 0.4, v: [0, 0], cor: ['#6B4A2E', '#8A6A44'], peso: 9, lixo: true },
  moeda: { nome: 'Peixe com uma moeda na boca', w: 15, h: 8, vel: 44, faixa: [1, 2], forca: 1.3, v: [120, 120], cor: ['#7E9A6E', '#FFD23F'], peso: 3, brilho: '#FFD23F' },
  dom: { nome: 'Peixe de luz', w: 16, h: 8, vel: 52, faixa: [2, 2], forca: 1.7, v: [0, 0], cor: ['#6FB8E8', '#E8F8FF'], peso: 1.6, brilho: '#BFF0F8' },
  lingua: { nome: 'Peixe de fogo', w: 16, h: 8, vel: 60, faixa: [2, 2], forca: 2.1, v: [0, 0], cor: ['#E2463C', '#FFD86A'], peso: 0.3, brilho: '#FF9A3C' }
};
const ALBUM = ['sardinha', 'tilapia', 'bagre', 'dourado', 'moeda', 'sandalia'];
const FAIXAS = [[MAR + 14, MAR + 48], [MAR + 50, MAR + 88], [MAR + 92, FUNDO - 10]];
const rand = (a, b) => a + Math.random() * (b - a);

function desenhaPeixe(g, id, x, y, dir, T, claro) {
  const P = PEIXES[id], w = P.w, hh = P.h; x = Math.round(x); y = Math.round(y);
  if (P.lixo) { g.fillStyle = '#17121f'; g.fillRect(x - 6, y - 3, 12, 6); g.fillStyle = P.cor[0]; g.fillRect(x - 5, y - 2, 10, 4); g.fillStyle = P.cor[1]; g.fillRect(x - 3, y - 4, 2, 3); g.fillRect(x + 1, y - 4, 2, 3); return; }
  const bate = Math.floor(T * 8 + x * 0.1) % 2;
  for (let i = 0; i < w; i++) {
    const k = i / (w - 1), alt = Math.max(1, Math.round(Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.08)), 0.75) * hh)), px = x + dir * (w / 2 - i);
    g.fillStyle = claro ? '#FFFFFF' : P.cor[0]; g.fillRect(px, y - (alt >> 1), 1, alt);
    g.fillStyle = claro ? '#FFFFFF' : P.cor[1]; g.fillRect(px, y - (alt >> 1) + Math.ceil(alt * 0.55), 1, Math.max(1, Math.floor(alt * 0.45)));
  }
  g.fillStyle = claro ? '#FFFFFF' : P.cor[0]; const rx = x - dir * (w / 2); // cauda
  for (let j = 0; j < 4; j++) g.fillRect(rx - dir * j, y - 1 - j + (bate ? 0 : 1), 1, 2 + j * 2 - (bate ? 0 : 1));
  g.fillStyle = '#05060B'; g.fillRect(x + dir * (w / 2 - 3), y - 1, 1, 1);
  if (P.brilho && Math.floor(T * 6) % 2) { g.fillStyle = P.brilho; g.fillRect(x + dir * (w / 2), y, 2, 2); g.fillRect(x - 2, y - (hh >> 1) - 2, 1, 1); g.fillRect(x + 3, y + (hh >> 1) + 1, 1, 1); }
}

export function pesca(G) {
  const c = G.char, cm = G.cm;
  return G.ui.modal((p, close) => {
    p.classList.add('cm-menu');
    const cv = h('canvas', { width: W, height: H, class: 'pesca-cv' }), g = cv.getContext('2d');
    const msg = h('p', { class: 'pesca-msg' }, 'Cada lance custa 5 denários de isca.');
    const botao = h('button', { class: 'btn gold pesca-bt' }, 'Lançar'), album = h('div', { class: 'pesca-album' });
    const peixes = [], bolhas = [], gotas = [];
    let est = 'pronto', t = 0, vivo = true, ultimo = performance.now(), seg = false, toque = false, padAntes = false;
    let forcaT = 0, hx = BX + 20, hy = MAR - 30, alvoX = 0, voo = 0, preso = null, dist = 1, tens = 0, surto = 0, aviso = 0, prox = 2, sequencia = 0, premio = null, tremor = 0;

    const nasce = (jaDentro) => {
      const tot = Object.values(PEIXES).reduce((s, P) => s + P.peso, 0); let r = Math.random() * tot, id = 'sardinha';
      for (const [k, P] of Object.entries(PEIXES)) { if ((r -= P.peso) <= 0) { id = k; break; } }
      if (id === 'lingua' && cm.dons?.lingua) id = 'dourado';
      const P = PEIXES[id], fx = FAIXAS[P.faixa[0] + Math.floor(Math.random() * (P.faixa[1] - P.faixa[0] + 1))], dir = Math.random() < 0.5 ? 1 : -1;
      peixes.push({ id, dir, x: jaDentro ? rand(120, W - 10) : dir > 0 ? 96 : W + 20, y: rand(fx[0], fx[1]), vel: P.vel * rand(0.8, 1.2), fase: Math.random() * 6 });
    };
    for (let i = 0; i < 7; i++) nasce(true);

    const pintaAlbum = () => { const ps = cm.pescados = cm.pescados || {};
      album.replaceChildren(...ALBUM.map(id => { const mini = h('canvas', { width: 34, height: 18 }), mg = mini.getContext('2d'); if (ps[id]) desenhaPeixe(mg, id, 17, 9, 1, 0); else { mg.fillStyle = '#2B3653'; mg.fillRect(8, 6, 18, 6); }
        return h('span', { class: 'pesca-item' + (ps[id] ? ' tem' : ''), title: ps[id] ? PEIXES[id].nome : '???' }, mini, h('b', {}, ps[id] ? '×' + ps[id] : '?')); }),
        h('span', { class: 'pesca-item tem' }, h('b', {}, 'Seguidos: ' + sequencia + (sequencia >= 2 ? '  (+' + Math.min(100, sequencia * 25) + '%)' : ''))));
    };
    const diz = (txt, tom) => { msg.textContent = txt; msg.className = 'pesca-msg' + (tom ? ' ' + tom : ''); };
    const volta = (txt, tom) => { est = 'pronto'; t = 0; preso = null; botao.textContent = 'Lançar'; diz(txt, tom); pintaAlbum(); G.salvar(); };
    const falhou = txt => { sequencia = 0; sfx('wrong'); volta(txt, 'ruim'); };

    const pegou = () => {
      const id = preso.id, P = PEIXES[id], ds = cm.dons = cm.dons || {}, ps = cm.pescados = cm.pescados || {};
      premio = { id, t: 0 }; for (let i = 0; i < 14; i++) gotas.push({ x: BX + 30, y: MAR, vx: rand(-40, 40), vy: rand(-90, -30), t: 0.7 });
      if (P.lixo) { ps[id] = (ps[id] || 0) + 1; sequencia = 0; sfx('click'); return volta('Uma sandália velha. Alguém deixou tudo e seguiu a pé (Mt 4:20).'); }
      sequencia++;
      if (id === 'lingua') { ds.lingua = 1; sfx('level'); return volta('Na boca do peixe, uma LÍNGUA DE FOGO (At 2:3). Com os quatro dons, ela acende o Fogo do Espírito.', 'bom'); }
      if (id === 'dom') { const falta = ['tornado', 'raios', 'enchente', 'vento', 'vento'].filter(k => (ds[k] || 0) < (DONS[k].partes || 1));
        if (falta.length) { const k = falta[Math.floor(Math.random() * falta.length)]; ds[k] = (ds[k] || 0) + 1; if (!cm.dom && G.temDom(k)) cm.dom = k; sfx('level'); return volta('O peixe de luz trouxe um DOM: ' + DONS[k].nome + (DONS[k].partes > 1 && ds[k] < DONS[k].partes ? ' (uma das duas metades)' : '') + '. Veja no inventário.', 'bom'); }
        c.data.gold += 150; sfx('coin'); return volta('O peixe de luz não tinha mais dom para dar: deixou 150 denários.', 'bom'); }
      const mult = 1 + Math.min(1, (sequencia - 1) * 0.25), v = Math.round(rand(P.v[0], P.v[1]) * mult); c.data.gold += v; ps[id] = (ps[id] || 0) + 1; sfx('coin');
      if (id === 'moeda') return volta('Um peixe com uma moeda na boca! "Abre-lhe a boca e acharás um estáter" (Mt 17:27). +' + v + ' denários.', 'bom');
      cm.peixes = (cm.peixes || 0) + 1; if (cm.peixes === 153) G.ovo('rede', 'Cento e cinquenta e três grandes peixes, e a rede não se rompeu (Jo 21:11).');
      volta(P.nome + ': +' + v + ' denários' + (mult > 1 ? ' (' + sequencia + ' seguidos)' : '') + '. Total: ' + cm.peixes + ' peixes.', 'bom');
    };

    const aperta = () => {
      if (est === 'pronto') { if (c.data.gold < 5) return diz('Faltam denários para a isca.', 'ruim'); c.data.gold -= 5; est = 'forca'; forcaT = 0; premio = null; botao.textContent = 'Soltar o lance'; diz('Toque de novo para lançar: barra cheia, lance longe.'); }
      else if (est === 'forca') { const f = 0.5 - 0.5 * Math.cos(forcaT * 3.4); alvoX = 136 + f * (W - 160); est = 'voo'; voo = 0; hx = BX + 34; hy = MAR - 44; sfx('swing'); botao.textContent = 'Recolher (segure)'; diz('O anzol afunda sozinho. Segure para recolher e parar na altura do peixe que você quer.'); }
    };
    const baixo = e => { e?.preventDefault?.(); if (!seg) { seg = true; aperta(); } }, cima = () => { seg = false; };
    botao.onpointerdown = baixo; cv.onpointerdown = baixo; botao.onpointerup = botao.onpointerleave = botao.onpointercancel = cima; cv.onpointerup = cv.onpointerleave = cv.onpointercancel = cima;
    botao.onclick = e => e.preventDefault();
    const tecla = e => { if (!cv.isConnected) return; if (['Space', 'Enter', 'KeyZ', 'KeyX', 'ArrowUp'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (e.type === 'keydown') { if (!e.repeat && !toque) { toque = true; baixo(); } } else { toque = false; cima(); } } };
    addEventListener('keydown', tecla, true); addEventListener('keyup', tecla, true);
    const fechar = () => { vivo = false; removeEventListener('keydown', tecla, true); removeEventListener('keyup', tecla, true); close(); };

    const passo = dt => {
      // controle: o botão de baixo (A / cruz) vale como o toque
      const pad = [...(navigator.getGamepads?.() || [])].some(q => q && q.buttons[0]?.pressed); if (pad !== padAntes) { padAntes = pad; if (pad) baixo(); else cima(); }
      t += dt; tremor = Math.max(0, tremor - dt * 6);
      while (peixes.length < 8) nasce(false);
      for (const f of peixes) { if (f === preso) continue; f.x += f.dir * f.vel * dt; f.y += Math.sin(t * 1.3 + f.fase) * 4 * dt; if (f.x < 90 || f.x > W + 26) f.sai = true; }
      for (let i = peixes.length - 1; i >= 0; i--) if (peixes[i].sai) peixes.splice(i, 1);
      if (Math.random() < dt * 2) bolhas.push({ x: rand(100, W), y: FUNDO - 4, t: rand(2, 4) });
      for (const b of bolhas) { b.y -= 16 * dt; b.t -= dt; } for (let i = bolhas.length - 1; i >= 0; i--) if (bolhas[i].t <= 0 || bolhas[i].y < MAR + 3) bolhas.splice(i, 1);
      for (const q of gotas) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 240 * dt; q.t -= dt; } for (let i = gotas.length - 1; i >= 0; i--) if (gotas[i].t <= 0) gotas.splice(i, 1);
      if (premio) premio.t += dt;
      if (est === 'forca') { forcaT += dt; if (forcaT > 6) { c.data.gold += 5; volta('Você guardou a linha.'); } }
      else if (est === 'voo') { voo += dt * 1.9; const k = Math.min(1, voo); hx = BX + 34 + (alvoX - BX - 34) * k; hy = MAR - 44 + (MAR + 44 - MAR) * 0 - Math.sin(k * Math.PI) * 46 + k * 44; if (k >= 1) { est = 'fundo'; hy = MAR + 2; t = 0; sfx('click'); for (let i = 0; i < 8; i++) gotas.push({ x: hx, y: MAR, vx: rand(-30, 30), vy: rand(-70, -20), t: 0.5 }); } }
      else if (est === 'fundo') {
        hy += (seg ? -46 : 26) * dt; hy = Math.min(FUNDO - 6, hy);
        if (hy < MAR - 2) return falhou('Você recolheu a linha vazia.');
        for (const f of peixes) { const P = PEIXES[f.id]; if (Math.abs(f.x + f.dir * P.w * 0.4 - hx) < 5 + P.w * 0.2 && Math.abs(f.y - hy) < 4 + P.h * 0.4) {
          preso = f; f.prof = hy - MAR - 6; est = 'briga'; dist = 1; tens = 0.15; surto = 0; aviso = 0; prox = rand(1.2, 2.2); t = 0; tremor = 1; sfx('hit'); botao.textContent = 'Puxar (segure)'; diz('FISGOU! Segure para puxar. Quando ele ficar claro e disparar, SOLTE.', 'bom'); break; } }
      }
      else if (est === 'briga') {
        const P = PEIXES[preso.id];
        if (surto > 0) { surto -= dt; if (surto <= 0) prox = rand(1.4, 2.8) / Math.sqrt(P.forca); }
        else if (aviso > 0) { aviso -= dt; if (aviso <= 0) { surto = rand(0.55, 1) * (0.8 + P.forca * 0.2); tremor = 1; sfx('swing'); } }
        else if ((prox -= dt) <= 0 && !P.lixo) aviso = 0.38;
        if (seg) { dist -= (surto > 0 ? 0.04 : 0.34 / P.forca) * dt; tens += (surto > 0 ? 1.45 * P.forca : 0.2 * P.forca) * dt; }
        else { dist += (surto > 0 ? 0.11 : 0.04) * P.forca * dt; tens -= 0.85 * dt; }
        tens = Math.max(0, tens);
        const fx = BX + 40 + (alvoX - BX - 40) * Math.min(1.3, dist), fy = MAR + 6 + preso.prof * Math.min(1, dist) + (surto > 0 ? Math.sin(t * 40) * 3 : Math.sin(t * 9) * 1.5);
        hx = fx; hy = fy; preso.x = fx - preso.dir * P.w * 0.4; preso.y = fy; preso.dir = surto > 0 ? 1 : -1;
        if (tens >= 1) { peixes.splice(peixes.indexOf(preso), 1); return falhou('A linha arrebentou! Solte quando o peixe disparar.'); }
        if (dist >= 1.35) { preso.dir = 1; return falhou('O peixe escapou: linha frouxa demais.'); }
        if (dist <= 0) { peixes.splice(peixes.indexOf(preso), 1); return pegou(); }
      }
    };

    const pinta = T => {
      const sx = tremor > 0 ? Math.round(Math.sin(T * 70) * 2 * tremor) : 0;
      g.setTransform(1, 0, 0, 1, sx, 0); g.imageSmoothingEnabled = false;
      // céu, lua, estrelas e os montes do outro lado do mar
      for (let i = 0; i < 6; i++) { g.fillStyle = ['#0B1024', '#101833', '#162243', '#1E2D55', '#2A3B66', '#3A4A72'][i]; g.fillRect(-4, i * 11, W + 8, 12); }
      g.fillStyle = '#F1E9D2'; for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 41) % 44; if ((i + Math.floor(T * 2)) % 9) g.fillRect(x, y, 1, 1); }
      g.fillStyle = '#FFF4CF'; g.fillRect(300, 12, 14, 14); g.fillRect(298, 14, 18, 10); g.fillRect(302, 10, 10, 18); g.fillStyle = '#E4D6A6'; g.fillRect(306, 14, 4, 4); g.fillRect(302, 20, 3, 3);
      g.fillStyle = '#1B2748'; for (let x = 0; x < W; x += 2) { const a = 8 + Math.round(Math.sin(x * 0.021) * 5 + Math.sin(x * 0.007 + 1) * 6); g.fillRect(x, MAR - a, 2, a); }
      g.fillStyle = '#FFD98A'; for (const x of [212, 220, 247, 338]) g.fillRect(x, MAR - 5, 1, 1);
      // água em faixas, mais escura no fundo, com a linha da superfície ondulando
      const AG = ['#1D5A70', '#184C63', '#143F56', '#11344A', '#0E2A3E', '#0B2133'];
      for (let i = 0; i < 6; i++) { g.fillStyle = AG[i]; g.fillRect(-4, MAR + i * 22, W + 8, 23); if (i < 5) { g.fillStyle = AG[i + 1]; for (let x = (i % 2) * 2; x < W; x += 4) g.fillRect(x, MAR + i * 22 + 20, 2, 1); } }
      for (let x = 0; x < W; x += 3) { const o = Math.round(Math.sin(x * 0.07 + T * 1.8) * 1.5 + Math.sin(x * 0.023 - T) * 1.5); g.fillStyle = '#0B1024'; g.fillRect(x, MAR - 3, 3, 3 + o); g.fillStyle = '#7FD0E0'; g.fillRect(x, MAR + o, 3, 1); }
      g.fillStyle = 'rgba(255,244,207,.18)'; for (let i = 0; i < 6; i++) g.fillRect(296 + Math.round(Math.sin(T * 2 + i) * 3) - i, MAR + 3 + i * 3, 20 + i * 2, 1);
      // leito: areia, pedras e algas
      g.fillStyle = '#2A2A3A'; g.fillRect(-4, FUNDO, W + 8, H - FUNDO); g.fillStyle = '#3A3A4E'; for (let x = 0; x < W; x += 5) g.fillRect(x, FUNDO + ((x * 7) % 3), 3, 1);
      g.fillStyle = '#1E1E2C'; for (const [x, w2, a] of [[120, 22, 8], [214, 30, 11], [330, 18, 7]]) { g.fillRect(x, FUNDO - a + 2, w2, a); g.fillRect(x + 3, FUNDO - a, w2 - 6, 2); }
      for (const x of [104, 150, 196, 262, 300, 356]) for (let j = 0; j < 12 + (x % 7); j++) { g.fillStyle = j % 3 ? '#2E6B4A' : '#3F8A5E'; g.fillRect(x + Math.round(Math.sin(T * 1.6 + j * 0.5 + x) * (j * 0.25)), FUNDO - j, 2, 1); }
      g.fillStyle = 'rgba(200,240,248,.5)'; for (const b of bolhas) g.fillRect(Math.round(b.x + Math.sin(b.y * 0.2) * 2), Math.round(b.y), 1 + (b.t > 3 ? 1 : 0), 1 + (b.t > 3 ? 1 : 0));
      // peixes
      for (const f of peixes) desenhaPeixe(g, f.id, f.x, f.y, f.dir, T, f === preso && (aviso > 0 ? Math.floor(T * 20) % 2 : surto > 0));
      // barco, Simão e a vara
      const by = MAR - 9 + Math.round(Math.sin(T * 1.8) * 1.5);
      g.fillStyle = '#17121f'; g.fillRect(BX - 34, by, 68, 12); g.fillRect(BX - 38, by - 3, 8, 6); g.fillRect(BX + 30, by - 3, 8, 6); g.fillRect(BX - 30, by + 12, 60, 2);
      g.fillStyle = '#7A5634'; g.fillRect(BX - 33, by + 1, 66, 5); g.fillStyle = '#5E4026'; g.fillRect(BX - 31, by + 6, 62, 5); g.fillStyle = '#9A7448'; g.fillRect(BX - 33, by + 1, 66, 1); g.fillRect(BX - 37, by - 2, 6, 2); g.fillRect(BX + 31, by - 2, 6, 2);
      g.fillStyle = '#17121f'; g.fillRect(BX - 22, by - 22, 2, 22); g.fillStyle = '#C9B88A'; g.fillRect(BX - 20, by - 21, 10, 13); g.fillStyle = '#A8966A'; g.fillRect(BX - 20, by - 12, 10, 2); // vela recolhida
      const puxa = est === 'briga' && seg ? 1 : 0;
      g.fillStyle = '#17121f'; g.fillRect(BX - 1 - puxa, by - 17, 9, 17); g.fillRect(BX - puxa, by - 23, 7, 7); g.fillStyle = '#497A80'; g.fillRect(BX - puxa, by - 16, 7, 12); g.fillStyle = '#3A6268'; g.fillRect(BX - puxa, by - 8, 7, 4); g.fillStyle = '#C68B59'; g.fillRect(BX + 1 - puxa, by - 22, 5, 5); g.fillStyle = '#3A2314'; g.fillRect(BX + 1 - puxa, by - 23, 5, 2); g.fillRect(BX + 1 - puxa, by - 19, 5, 2);
      const px = BX + 30 - puxa * 5, py = by - 40 + puxa * 4 + (est === 'forca' ? Math.round(Math.cos(forcaT * 3.4) * 4) : 0);
      g.strokeStyle = '#8A6A44'; g.lineWidth = 2; g.beginPath(); g.moveTo(BX + 6 - puxa, by - 12); g.lineTo(px, py); g.stroke();
      // linha: branca, e vermelha quando está para arrebentar
      const tenso = est === 'briga' ? tens : 0; let lx = px + 2, ly = py + 12;
      if (est === 'voo' || est === 'fundo' || est === 'briga') { lx = hx; ly = hy; }
      g.strokeStyle = tenso > 0.75 ? (Math.floor(T * 14) % 2 ? '#FF4A5A' : '#FFE9A8') : tenso > 0.45 ? '#FFC37A' : '#E9E6DC'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py);
      if (est === 'briga' || est === 'voo') g.lineTo(lx, ly); else g.quadraticCurveTo((px + lx) / 2, Math.max(py, ly) + (est === 'fundo' ? 6 : 0), lx, ly); g.stroke();
      if (est === 'fundo' || est === 'voo' || est === 'pronto' || est === 'forca') { g.fillStyle = '#E9E6DC'; g.fillRect(Math.round(lx) - 1, Math.round(ly), 1, 3); g.fillRect(Math.round(lx) - 1, Math.round(ly) + 3, 3, 1); g.fillRect(Math.round(lx) + 1, Math.round(ly) + 1, 1, 2); g.fillStyle = '#E2463C'; g.fillRect(Math.round(lx) - 1, Math.round(ly) - 2, 2, 2); }
      g.fillStyle = '#BFF0F8'; for (const q of gotas) g.fillRect(Math.round(q.x), Math.round(q.y), 1, 2);
      g.setTransform(1, 0, 0, 1, 0, 0);
      // barras
      const barra = (x, y, w2, k, cor, rot) => { g.fillStyle = '#05060B'; g.fillRect(x - 2, y - 2, w2 + 4, 9); g.fillStyle = '#1A2238'; g.fillRect(x, y, w2, 5); g.fillStyle = cor; g.fillRect(x, y, Math.round(w2 * Math.max(0, Math.min(1, k))), 5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, Math.round(w2 * Math.max(0, Math.min(1, k))), 1); g.fillStyle = '#F1E9D2'; g.font = '10px "Jersey 15", monospace'; g.textAlign = 'left'; g.fillText(rot, x, y - 4); };
      if (est === 'forca') barra(12, H - 12, 120, 0.5 - 0.5 * Math.cos(forcaT * 3.4), '#FFD23F', 'FORÇA DO LANCE');
      if (est === 'briga') { barra(12, H - 12, 110, tens, tens > 0.75 ? '#FF4A5A' : tens > 0.45 ? '#FFB84A' : '#9BE0B4', 'LINHA'); barra(136, H - 12, 110, 1 - dist, '#7FD0E0', 'PEIXE CHEGANDO');
        if (aviso > 0 || surto > 0) { g.fillStyle = '#05060B'; g.fillRect(W / 2 - 34, 8, 68, 15); g.fillStyle = surto > 0 ? '#FF4A5A' : '#FFD23F'; g.fillRect(W / 2 - 32, 10, 64, 11); g.fillStyle = '#05060B'; g.font = '11px "Jersey 20", monospace'; g.textAlign = 'center'; g.fillText(surto > 0 ? 'SOLTE!' : 'ATENÇÃO', W / 2, 19); } }
      if (est === 'fundo') { g.fillStyle = '#F1E9D2'; g.font = '10px "Jersey 15", monospace'; g.textAlign = 'right'; g.fillText(hy < FAIXAS[1][0] ? 'raso' : hy < FAIXAS[2][0] ? 'meia água' : 'fundo', W - 6, H - 6); }
      if (premio && premio.t < 2.4 && est === 'pronto') { const k = Math.min(1, premio.t * 4), yy = 30 - Math.round((1 - k) * 12); g.fillStyle = '#05060B'; g.fillRect(W / 2 - 40, yy - 2, 80, 30); g.fillStyle = '#E8C873'; g.fillRect(W / 2 - 38, yy, 76, 26); g.fillStyle = '#121829'; g.fillRect(W / 2 - 36, yy + 2, 72, 22); desenhaPeixe(g, premio.id, W / 2, yy + 13, 1, T); }
    };

    cv._pesca = { get est() { return est; }, get seg() { return seg; }, get surto() { return surto > 0 || aviso > 0; }, get hy() { return hy; }, get tens() { return tens; }, get dist() { return dist; }, peixes };
    const laco = agora => { if (!vivo || !cv.isConnected) return; const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora; try { passo(dt); pinta(agora / 1000); } catch (e) { console.error(e); } requestAnimationFrame(laco); };
    requestAnimationFrame(laco); pintaAlbum();
    p.append(h('div', { class: 'p-head' }, h('h3', {}, 'Simão, o pescador'), h('button', { class: 'x', onclick: fechar, 'aria-label': 'Fechar' }, '✕')),
      h('p', { class: 'muted' }, '"Sobre a tua palavra, lançarei as redes" (Lc 5:5). Os peixes grandes e os raros andam no fundo.'), cv, msg, h('div', { class: 'btn-row' }, botao), album);
  }, { wide: true });
}
