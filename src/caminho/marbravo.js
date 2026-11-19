// O Leviatã no mar aberto: na tempestade, pescando de bote longe da margem, às vezes não é peixe que morde.
// "Podes tirar com anzol o leviatã?… Podes encher-lhe a pele de arpões?" (Jó 41:1,7). A serpente vira o bote e o
// peregrino fica nadando no mar bravo. A espada não fere: só os arpões que boiam nos destroços do bote.
// Pegue (nadando por cima), arremesse (golpe) na cabeça quando ela sobe; mergulhe (para baixo) para escapar do fogo e das ondas.
import { sfx, music } from '../audio.js';
import { ehTempestade, quarto } from './tempo.js';
import { quadroChefe } from './pixel/chefespx.js';

const rand = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)];
const agua = G => G.objs.find(o => o.tipo === 'aguaAberta');
const MAX_ARPOES = 3;

/* ---------------- começar ---------------- */
// chamado pela pesca quando algo morde: devolve true se é o Leviatã
export function leviataMorde(G, fundo) {
  if (G.levi || G.area !== 'refugio' || !G.p.noBote || fundo < 0.5 || !ehTempestade(G)) return false;
  const q = quarto(G); if (G.cm.leviQ === q) return false; // uma vez por tempestade
  if (!(G.cm.leviForcado || Math.random() < 0.35)) return false;
  G.cm.leviQ = q; G.cm.leviForcado = 0; comecar(G); return true;
}
function comecar(G) {
  const A = agua(G), p = G.p, hpMax = Math.round(14 * (G.dif?.hp >= 3.5 ? 1.4 : G.dif?.hp <= 1.4 ? 0.65 : 1));
  p.noBote = false; G.nado = true; G.pescaTrava = false; if (G.pesca) G.pesca.est = 'livre';
  G.levi = { t: 0, hp: hpMax, max: hpMax, fase: 0, est: 'surge', gt: 2.6, golpe: null, x: clamp(p.x + 260, A.x0 + 120, A.x1 - 120), sx: p.x, arpoes: [], meus: 1, tiros: [], ondas: [], respingos: [], destrocos: [], mergulho: 0, mergCd: 0, cab: null, morre: 0, dicaT: 0 };
  // o bote se parte: tábuas boiando, e num dos destroços, o primeiro arpão
  for (let i = 0; i < 5; i++) G.levi.destrocos.push({ x: p.x + rand(-90, 90), vx: rand(-60, 60), t: rand(0, 6), w: rand(10, 22) });
  sfx('rugido'); sfx('splash'); G.tremor(14); G.clarao = 0.5; music('chefe', 'leviata');
  G.textoEm(p.x, p.y - 120, 'O LEVIATÃ', '#9AE8E0', 22); G.textoEm(p.x, p.y - 96, '"Podes encher-lhe a pele de arpões?" (Jó 41:7)', '#C9D2E0', 11);
  G.ui.toast('O bote virou! Só os ARPÕES ferem o Leviatã: nade por cima dos destroços para pegar · golpe arremessa · para baixo mergulha (escapa do fogo e das ondas) · nadar até a margem é fugir.', 9000);
  for (let i = 0; i < 30; i++) G.parts.push({ x: p.x + rand(-40, 40), y: p.y - 6, vx: rand(-160, 160), vy: rand(-420, -120), t: 0.9, max: 0.9, r: 2, cor: '#DFF6FA', g: 900 });
}
function acabar(G, venceu) {
  const L = G.levi, p = G.p; G.levi = null; G.nado = false; p.mergulho = 0; music('mundo', 'refugio');
  if (!venceu) return;
  const cm = G.cm, n = cm.leviMar = (cm.leviMar || 0) + 1, ouro = n === 1 ? 1500 : 700;
  G.char.data.gold += ouro; sfx('level'); G.clarao = 0.6; G.xp?.(400);
  G.ui.toast('O Leviatã afundou de volta ao abismo. +' + ouro + ' denários. Zebedeu vem remando com outro bote: "Eu vi! Ninguém vai acreditar."', 8000);
  setTimeout(() => G.achado?.(n === 1 ? { epica: 55, lendaria: 45 } : { rara: 30, epica: 50, lendaria: 20 }, false, true), 1200);
  G.salvar();
}

/* ---------------- os golpes ---------------- */
// cada golpe: aviso (o que piscar e onde), depois o perigo. A fase sobe com a vida: na última, raios no mar.
function novoGolpe(G) {
  const L = G.levi, p = G.p, A = agua(G), f = L.fase;
  const lista = ['salto', 'cauda', 'fogo', 'cauda', 'salto', ...(f >= 1 ? ['redemoinho', 'fogo'] : []), ...(f >= 2 ? ['raios', 'salto'] : [])];
  const tipo = pick(lista.filter(t => t !== L.ultimo || Math.random() < 0.2)); L.ultimo = tipo;
  const rapido = 1 - f * 0.12;
  if (tipo === 'salto') { const d = Math.random() < 0.5 ? -1 : 1, x0 = clamp(p.x - d * 320, A.x0 + 40, A.x1 - 40), x1 = clamp(p.x + d * 320, A.x0 + 40, A.x1 - 40); L.golpe = { tipo, t: 0, aviso: 1.1 * rapido, dur: 1.5 * rapido, x0, x1, alt: 240 }; }
  if (tipo === 'cauda') L.golpe = { tipo, t: 0, aviso: 0.95 * rapido, dur: 0.6, x: p.x + p.vx * 0.3, n: f >= 1 ? 2 : 1 };
  if (tipo === 'fogo') { const lado = p.x - A.x0 > A.x1 - p.x ? -1 : 1, hx = lado < 0 ? A.x0 + 90 : A.x1 - 90; L.golpe = { tipo, t: 0, aviso: 1.1 * rapido, dur: 2.2, hx, d: -lado }; }
  if (tipo === 'redemoinho') L.golpe = { tipo, t: 0, aviso: 0.9, dur: 3.4, x: clamp(p.x + rand(-140, 140), A.x0 + 150, A.x1 - 150) };
  if (tipo === 'raios') L.golpe = { tipo, t: 0, aviso: 0.9, dur: 0.5, xs: [p.x, p.x + rand(-260, -120), p.x + rand(120, 260)].map(x => clamp(x, A.x0 + 20, A.x1 - 20)), n: 3 };
  sfx(tipo === 'fogo' ? 'rugido' : 'magic');
}
// a cabeça fica de fora: é a hora dos arpões
const cabecaFora = (L, x, y, dur) => { L.cab = { x, y, t: 0, dur }; };

/* ---------------- a cada quadro ---------------- */
export function passoMarBravo(G, dt) {
  const L = G.levi; if (!L) return;
  const A = agua(G), p = G.p, c = G.ctl || {};
  if (!A || G.area !== 'refugio') { G.levi = null; G.nado = false; return; }
  const sup = A.y; L.t += dt;
  if (p.morto) { G.levi = null; G.nado = false; p.mergulho = 0; return; }
  // nadar: preso no mar, pulinhos curtos, sem pulo duplo; para baixo mergulha um pouco
  p.x = clamp(p.x, A.x0 - 60, A.x1 - 24); p.pulos = 0; if (p.vy < -470) p.vy = -470; p.atk = null; G.pescaTrava = false;
  if (p.x < A.x0 - 30) { G.textoEm(p.x, p.y - 80, 'você nadou de volta à margem', '#C9D2E0', 12); G.ui.toast('O Leviatã afunda de volta. A tempestade continua, e o mar é dele.', 5000); acabar(G, false); return; }
  if (L.mergCd > 0) L.mergCd -= dt;
  if (c.my > 0.5 && p.chao && L.mergCd <= 0 && !(p.mergulho > 0)) { p.mergulho = 0.9; L.mergCd = 1.6; sfx('splash'); for (let i = 0; i < 8; i++) G.parts.push({ x: p.x + rand(-10, 10), y: sup - 2, vx: rand(-60, 60), vy: rand(-160, -60), t: 0.4, max: 0.4, r: 1.5, cor: '#DFF6FA', g: 600 }); }
  if (p.mergulho > 0) { p.mergulho -= dt; p.inv = Math.max(p.inv, 0.06); p.vx *= 0.92; if (Math.random() < dt * 14) G.parts.push({ x: p.x + rand(-6, 6), y: p.y - 10, vx: 0, vy: -60, t: 0.5, max: 0.5, r: 1.5, cor: '#BFF0F8', g: -40 }); }
  const sub = p.mergulho > 0, noAr = !p.chao;
  const ferir = (n = 1) => { if (sub || p.inv > 0) return; G.ferirHeroi(n, { kind: 'levi', x: L.x }); };
  // os destroços boiam e trazem arpões; nadar por cima pega
  for (const d of L.destrocos) { d.t += dt; d.x = clamp(d.x + d.vx * dt, A.x0 + 10, A.x1 - 10); d.vx *= Math.pow(0.6, dt); if (Math.abs(d.vx) < 8) d.vx = rand(-24, 24); }
  L.arpT = (L.arpT ?? 0.5) - dt;
  if (L.arpT <= 0 && L.arpoes.length < 3) { L.arpT = rand(3.5, 6); L.arpoes.push({ x: clamp(p.x + pick([-1, 1]) * rand(140, 420), A.x0 + 30, A.x1 - 30), t: 0, vx: rand(-20, 20) }); }
  for (const a of L.arpoes) { a.t += dt; a.x = clamp(a.x + a.vx * dt, A.x0 + 20, A.x1 - 20); }
  L.arpoes = L.arpoes.filter(a => { if (Math.abs(a.x - p.x) < 26 && !noAr && L.meus < MAX_ARPOES) { L.meus++; sfx('key'); G.textoEm(p.x, p.y - 70, 'arpão (' + L.meus + ')', '#FFE9A8', 12); return false; } return true; });
  // arremessar: vai na cabeça se ela estiver de fora; senão, para a frente
  if (c.atk && L.meus > 0 && !sub) { L.meus--; const alvo = L.cab ? { x: L.cab.x, y: L.cab.y } : L.golpe?.tipo === 'salto' && L.corpo ? L.corpo[Math.floor(L.corpo.length / 2)] : { x: p.x + p.face * 400, y: sup - 140 };
    const dx = alvo.x - p.x, dy = alvo.y - (p.y - 30), d = Math.hypot(dx, dy) || 1, v = 980; p.face = Math.sign(dx) || p.face;
    L.tiros.push({ x: p.x, y: p.y - 30, vx: dx / d * v, vy: dy / d * v - 90, t: 0 }); sfx('shoot'); }
  else if (c.atk && !L.meus && !(L.dicaT > G.T)) { L.dicaT = G.T + 2; G.textoEm(p.x, p.y - 70, 'sem arpão: busque nos destroços', '#FF8A7A', 11); }
  for (const t of L.tiros) { t.t += dt; t.vy += 520 * dt; t.x += t.vx * dt; t.y += t.vy * dt;
    const pts = [...(L.cab ? [{ x: L.cab.x, y: L.cab.y, r: 46, k: 2 }] : []), ...(L.corpo || []).filter(q => q.y < sup - 6).map(q => ({ x: q.x, y: q.y, r: q.r + 8, k: 1 }))];
    const hit = pts.find(q => Math.hypot(t.x - q.x, t.y - q.y) < q.r);
    if (hit && !L.morre) { t.morto = true; L.hp -= hit.k; L.flash = 0.12; sfx(hit.k > 1 ? 'crit' : 'hit'); G.tremor(hit.k > 1 ? 7 : 4); G.hitstop = 0.06;
      G.textoEm(t.x, t.y - 20, hit.k > 1 ? 'NA CABEÇA!' : 'acertou', hit.k > 1 ? '#FFE9A8' : '#E6E0CF', hit.k > 1 ? 15 : 11); for (let i = 0; i < 10; i++) G.parts.push({ x: t.x, y: t.y, vx: rand(-200, 200), vy: rand(-200, 60), t: 0.5, max: 0.5, r: 2, cor: i % 2 ? '#9AE8E0' : '#C24058', g: 500 });
      if (hit.k > 1 && L.cab) L.cab.t = L.cab.dur - 0.25; // ferida, a cabeça mergulha logo
      const f = L.hp / L.max < 0.34 ? 2 : L.hp / L.max < 0.67 ? 1 : 0; if (f > L.fase) { L.fase = f; sfx('rugido'); G.tremor(10); G.textoEm(p.x, p.y - 120, f === 1 ? '"Da sua boca saem tochas" (Jó 41:19)' : '"Na terra não há coisa que se lhe compare" (Jó 41:33)', '#9AE8E0', 12); }
      if (L.hp <= 0) { L.morre = 3.2; L.golpe = null; L.cab = { x: L.x, y: sup - 170, t: 0, dur: 99 }; sfx('rugido'); G.clarao = 0.5; G.tremor(16); } }
    if (t.y > sup + 4) { t.morto = true; for (let i = 0; i < 4; i++) G.parts.push({ x: t.x, y: sup - 2, vx: rand(-60, 60), vy: rand(-140, -40), t: 0.35, max: 0.35, r: 1.5, cor: '#DFF6FA', g: 600 }); } }
  L.tiros = L.tiros.filter(t => !t.morto && t.t < 2);
  if (L.flash > 0) L.flash -= dt;
  // as ondas: correm pela superfície; pule (ou mergulhe) quando chegarem
  for (const o of L.ondas) { o.x += o.v * dt; o.t += dt; if (!o.feriu && Math.abs(o.x - p.x) < 22 && !noAr) { o.feriu = true; ferir(1); p.vx = Math.sign(o.v) * 380; } }
  L.ondas = L.ondas.filter(o => o.t < 2.4 && o.x > A.x0 && o.x < A.x1);
  // morrendo: sobe, ruge, afunda
  if (L.morre > 0) { L.morre -= dt; L.cab.y = sup - 170 + (3.2 - L.morre) * 70; if (Math.random() < dt * 20) G.parts.push({ x: L.cab.x + rand(-60, 60), y: sup - 4, vx: rand(-80, 80), vy: rand(-300, -80), t: 0.6, max: 0.6, r: 2, cor: '#DFF6FA', g: 700 });
    if (L.morre <= 0) { sfx('splash'); acabar(G, true); } return; }
  // a sombra embaixo d'água segue o peregrino de longe
  L.x += clamp(p.x + Math.sin(L.t * 0.7) * 220 - L.x, -160, 160) * dt;
  if (L.cab) { L.cab.t += dt; if (L.cab.t >= L.cab.dur) { L.cab = null; sfx('splash'); } }
  if (L.est === 'surge') { L.gt -= dt; if (L.gt <= 0) { L.est = 'luta'; L.gt = 0.6; cabecaFora(L, clamp(p.x + 300, A.x0 + 80, A.x1 - 80), sup - 120, 1.8); sfx('rugido'); } return; }
  // entre um golpe e outro, a cabeça às vezes sobe para respirar perto: janela de arpão
  if (!L.golpe) { L.gt -= dt; if (L.gt <= 0) { if (!L.cab && Math.random() < 0.45) { cabecaFora(L, clamp(p.x + pick([-1, 1]) * rand(180, 300), A.x0 + 80, A.x1 - 80), sup - 110, 1.5 - L.fase * 0.2); L.gt = 1.3; } else novoGolpe(G); } return; }
  const g = L.golpe; g.t += dt; const ativo = g.t >= g.aviso, k = (g.t - g.aviso) / g.dur;
  if (g.tipo === 'salto') { // a serpente salta em arco por cima da água, de um lado para o outro
    if (ativo) { const n = 16; L.corpo = []; for (let i = 0; i < n; i++) { const u = clamp(k * 1.5 - i / n * 0.5, 0, 1), x = g.x0 + (g.x1 - g.x0) * u, y = sup - Math.sin(u * Math.PI) * g.alt; L.corpo.push({ x, y, r: 20 - i * 0.7 }); }
      if (!g.splash0) { g.splash0 = 1; sfx('splash'); respingo(G, g.x0); }
      for (const q of L.corpo) if (q.y < sup - 4 && Math.hypot(q.x - p.x, q.y - (p.y - 24)) < q.r + 14) { ferir(1); break; }
      if (k > 0.7 && !g.splash1) { g.splash1 = 1; respingo(G, g.x1); L.ondas.push({ x: g.x1, v: Math.sign(g.x1 - g.x0) * -260, t: 0 }); }
    }
    if (k >= 1) { L.corpo = null; L.golpe = null; L.gt = 0.5; cabecaFora(L, g.x1, sup - 100, 1.4); } }
  if (g.tipo === 'cauda') { // a cauda sobe onde você está e bate: espirra uma onda para cada lado
    if (ativo && !g.bateu) { g.bateu = 1; sfx('onda'); G.tremor(9); respingo(G, g.x); if (Math.abs(p.x - g.x) < 70) ferir(1); L.ondas.push({ x: g.x, v: 300, t: 0 }, { x: g.x, v: -300, t: 0 }); }
    if (k >= 1) { if (--g.n > 0) { g.t = 0; g.bateu = 0; g.x = p.x + p.vx * 0.3; g.aviso *= 0.8; } else { L.golpe = null; L.gt = 0.7; } } }
  if (g.tipo === 'fogo') { // a cabeça sobe na ponta do mar e varre a superfície com fogo: mergulhe
    if (!L.cab) cabecaFora(L, g.hx, sup - 130, g.aviso + g.dur + 0.6);
    if (ativo) { g.frente = g.hx + g.d * (40 + Math.min(1, k * 1.4) * (A.x1 - A.x0)); const ini = Math.min(g.hx, g.frente), fim = Math.max(g.hx, g.frente); if (p.x > ini && p.x < fim && p.y > sup - 90) ferir(1);
      if (Math.random() < dt * 40) G.parts.push({ x: rand(ini, fim), y: sup - rand(4, 30), vx: g.d * rand(40, 140), vy: rand(-80, -20), t: 0.5, max: 0.5, r: 2.5, cor: pick(['#FF9A3C', '#FFE08A', '#E2463C']), g: -60 }); }
    if (k >= 1) { L.golpe = null; L.gt = 0.6; } }
  if (g.tipo === 'redemoinho') { // o mar gira: puxa para o meio, e o meio fere
    if (ativo) { const dx = g.x - p.x; if (!sub) p.x += Math.sign(dx) * Math.min(Math.abs(dx), 140 * dt); if (Math.abs(dx) < 34) ferir(1); }
    if (k >= 1) { L.golpe = null; L.gt = 0.4; cabecaFora(L, g.x, sup - 110, 1.6); } }
  if (g.tipo === 'raios') { // o céu ajuda o monstro: três raios no mar
    if (ativo && !g.caiu) { g.caiu = 1; G.raioT = 0.35; G.clarao = 0.35; sfx('trovao'); for (const x of g.xs) { respingo(G, x); if (Math.abs(p.x - x) < 40) ferir(1); } }
    if (k >= 1) { if (--g.n > 0) { g.t = 0; g.caiu = 0; g.xs = g.xs.map(() => clamp(p.x + rand(-240, 240), A.x0 + 20, A.x1 - 20)); } else { L.golpe = null; L.gt = 0.5; } } }
}
function respingo(G, x) { const A = agua(G); for (let i = 0; i < 22; i++) G.parts.push({ x: x + rand(-30, 30), y: A.y - 4, vx: rand(-180, 180), vy: rand(-520, -160), t: 0.8, max: 0.8, r: 2, cor: i % 3 ? '#DFF6FA' : '#5AB0C0', g: 1000 }); }

/* ---------------- desenho (em pixel de jogo; X e Y convertem do mundo) ---------------- */
const ESC = ['#0E2E36', '#1A4A52', '#2A6A6E', '#4A9A90', '#8AD0BC'], VENTRE = ['#8A7A5A', '#C9B88A', '#E8DCB0'], BARB = ['#6A1A2A', '#A02E44', '#C24058'];
// o Leviatã com o sprite do chefe (o mesmo da arena), girado: o pescoço sai da água, ou o corpo inteiro no salto
const LEV = { id: 'leviata', hp: 1, max: 1, vx: 0, chao: true, voa: 1, cen: {} }, ESCALA = 1.7;
function serpente(g, L, x, y, ang, Tm, o = {}) {
  LEV.hp = L.hp; LEV.max = L.max; LEV.flash = L.flash > 0 ? 1 : 0; LEV.tele = o.prep ? 1 : 0; LEV.mov = o.ataca ? { t: 1 } : null; LEV.quebrado = o.caido ? 1 : 0; LEV.morrendo = 0; LEV.alpha = 1;
  const q = quadroChefe(LEV, Tm); if (!q) return;
  const inv = Math.cos(ang) < 0; // indo para a esquerda: espelha para a barriga ficar embaixo
  g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang); g.scale(ESCALA, inv ? -ESCALA : ESCALA); g.drawImage(q.s.tela(), -60, -74); g.restore();
}
export function pintarMarBravo(g, G, X, Y, Tm) {
  const L = G.levi, A = agua(G), p = G.p; if (!L || !A) return;
  const sup = Y(A.y) - 3, vw = g.canvas.width;
  // a sombra do monstro embaixo d'água
  g.fillStyle = '#041016'; g.globalAlpha = 0.55; const sx = X(L.x); for (let i = 0; i < 70; i++) { const yy = sup + 6 + Math.round(Math.sin(i * 0.2 + Tm * 2) * 2); g.fillRect(sx - 70 + i * 2, yy, 2, Math.round(5 - Math.abs(i - 35) / 10)); } g.globalAlpha = 1;
  // avisos
  const gp = L.golpe;
  if (gp && gp.t < gp.aviso) { const pis = Math.floor(Tm * 12) % 2; g.fillStyle = pis ? '#FFE9A8' : '#FF8A7A';
    if (gp.tipo === 'salto') for (const x of [gp.x0, gp.x1]) { for (let i = 0; i < 6; i++) g.fillRect(X(x) - 12 + i * 4 + (Math.floor(Tm * 20) % 4), sup - 2 - (i % 2), 2, 2); }
    if (gp.tipo === 'cauda') { const x = X(gp.x); for (let yy = 0; yy < 60; yy += 4) if ((yy / 4 + Math.floor(Tm * 14)) % 2) { g.fillRect(x - 35, sup - yy, 1, 2); g.fillRect(x + 35, sup - yy, 1, 2); } const sob = Math.round(gp.t / gp.aviso * 30); g.fillStyle = '#071418'; g.fillRect(x - 3, sup - sob - 1, 7, sob + 1); g.fillStyle = BARB[2]; g.fillRect(x - 9, sup - sob - 6, 19, 5); g.fillStyle = ESC[2]; g.fillRect(x - 2, sup - sob, 5, sob); }
    if (gp.tipo === 'redemoinho') { const x = X(gp.x); for (let a = 0; a < 30; a++) if ((a + Math.floor(Tm * 16)) % 3) g.fillRect(x + Math.round(Math.cos(a * 0.21 + Tm * 4) * (10 + a)), sup - 1 + Math.round(Math.sin(a * 0.21 + Tm * 4) * 2), 1, 1); }
    if (gp.tipo === 'raios') for (const x0 of gp.xs) { const x = X(x0); for (let yy = 0; yy < sup; yy += 6) if ((yy / 6 + Math.floor(Tm * 16)) % 2) g.fillRect(x, yy, 1, 3); } }
  if (gp?.tipo === 'redemoinho' && gp.t >= gp.aviso) { const x = X(gp.x); for (let r = 4; r < 46; r += 5) for (let a = 0; a < 20; a++) { g.fillStyle = (a + r) % 3 ? '#2E7A8A' : '#DFF6FA'; g.fillRect(x + Math.round(Math.cos(a * 0.314 + Tm * (6 - r / 10)) * r), sup + Math.round(Math.sin(a * 0.314 + Tm * 6) * r * 0.12), 2, 1); } }
  // o que está acima da água (o resto fica escondido pelo mar)
  g.save(); g.beginPath(); g.rect(0, 0, vw, sup + 1); g.clip();
  if (L.corpo) { const h = L.corpo[0], m = L.corpo[7], ang = Math.atan2(Y(h.y) - Y(m.y), X(h.x) - X(m.x)); serpente(g, L, X(m.x), Y(m.y), ang, Tm, { ataca: true }); }
  if (L.cab) { const k = L.morre > 0 ? 1 : Math.min(1, L.cab.t / 0.35, (L.cab.dur - L.cab.t) / 0.35), y = Y(A.y) + Math.round((1 - k) * 80) + Math.round((L.cab.y - A.y) / 2 * k), face = Math.sign(p.x - L.cab.x) || 1, fogo = gp?.tipo === 'fogo';
    // o pescoço sobe da água inclinado para você; a cabeça fica onde o arpão acerta
    const ang = face > 0 ? -1.15 : Math.PI + 1.15, bal = Math.sin(Tm * 2.2) * 0.06, hx = X(L.cab.x), hy = y;
    serpente(g, L, hx - Math.cos(ang) * 44 * ESCALA, hy + 44 * ESCALA * Math.sin(1.15) * 0.92, ang + bal, Tm, { prep: fogo && gp.t < gp.aviso, ataca: fogo && gp.t >= gp.aviso || L.morre > 0, caido: L.morre > 0 });
    if (!L.morre && k > 0.9) { g.fillStyle = '#FFE9A8'; if (Math.floor(Tm * 6) % 2) { g.fillRect(X(L.cab.x) - 1, y - 36, 3, 5); g.fillRect(X(L.cab.x) - 1, y - 29, 3, 2); } } } // o "!" de alvo: a cabeça está exposta
  if (gp?.tipo === 'fogo' && gp.t >= gp.aviso && gp.frente != null) { const a = X(Math.min(gp.hx, gp.frente)), b = X(Math.max(gp.hx, gp.frente)); for (let x = a; x < b; x += 2) { const hh = 6 + Math.round(Math.sin(x * 0.3 + Tm * 20) * 3 + Math.sin(x * 0.11 - Tm * 9) * 3); g.fillStyle = '#E2463C'; g.fillRect(x, sup - hh - 2, 2, hh + 2); g.fillStyle = '#FF9A3C'; g.fillRect(x, sup - hh + 1, 2, hh - 1); g.fillStyle = '#FFE08A'; g.fillRect(x, sup - 3, 2, 2); } }
  g.restore();
  // a cauda que bate
  if (gp?.tipo === 'cauda' && gp.t >= gp.aviso && gp.t < gp.aviso + 0.25) { const x = X(gp.x); g.fillStyle = '#DFF6FA'; for (let i = 0; i < 14; i++) g.fillRect(x - 20 + i * 3, sup - 4 - (i % 3) * 3, 2, 3); }
  // as ondas que correm
  for (const o of L.ondas) { const x = X(o.x); for (let i = -6; i <= 6; i++) { const hh = Math.round((6 - Math.abs(i)) * 1.3); g.fillStyle = '#2E7A8A'; g.fillRect(x + i * 2, sup - hh, 2, hh); g.fillStyle = '#DFF6FA'; g.fillRect(x + i * 2, sup - hh - 1, 2, 1); } }
  // destroços do bote e arpões boiando
  for (const d of L.destrocos) { const x = X(d.x), y = sup - 1 + Math.round(Math.sin(d.t * 2) * 1); g.fillStyle = '#17121f'; g.fillRect(x - (d.w >> 1) - 1, y - 1, d.w + 2, 4); g.fillStyle = '#7A4E2E'; g.fillRect(x - (d.w >> 1), y, d.w, 2); }
  for (const a of L.arpoes) { const x = X(a.x), y = sup - 2 + Math.round(Math.sin(a.t * 2.4) * 1.5); g.fillStyle = '#17121f'; g.fillRect(x - 9, y - 1, 18, 4); g.fillStyle = '#8A5A36'; g.fillRect(x - 8, y, 16, 2); g.fillStyle = '#6B4A2E'; g.fillRect(x - 7, y - 3, 13, 1); g.fillStyle = '#C9D2E0'; g.fillRect(x + 6, y - 4, 3, 3); g.fillRect(x + 9, y - 3, 1, 1);
    if (Math.floor(Tm * 4 + a.x) % 3 === 0) { g.fillStyle = '#FFE9A8'; g.fillRect(x + 7, y - 7, 1, 1); } }
  // arpões voando
  for (const t of L.tiros) { const x = X(t.x), y = Y(t.y), a = Math.atan2(t.vy, t.vx); g.fillStyle = '#6B4A2E'; for (let i = 0; i < 10; i++) g.fillRect(Math.round(x - Math.cos(a) * i), Math.round(y - Math.sin(a) * i), 1, 1); g.fillStyle = '#E8F0FF'; g.fillRect(Math.round(x + Math.cos(a) * 1) - 1, Math.round(y + Math.sin(a) * 1) - 1, 3, 3); }
  // a barra do monstro e os arpões na mão
  const bx = Math.round(vw / 2) - 80, by = 14; g.fillStyle = '#071418'; g.fillRect(bx - 2, by - 2, 164, 9); g.fillStyle = '#2A1A24'; g.fillRect(bx, by, 160, 5); g.fillStyle = L.flash > 0 ? '#FFFFFF' : '#2A9A90'; g.fillRect(bx, by, Math.round(160 * Math.max(0, L.hp) / L.max), 5); g.fillStyle = '#8AD0BC'; g.fillRect(bx, by, Math.round(160 * Math.max(0, L.hp) / L.max), 1);
  for (let i = 0; i < MAX_ARPOES; i++) { const x = bx + 172 + i * 10; g.fillStyle = '#17121f'; g.fillRect(x - 1, by - 3, 4, 12); g.fillStyle = i < L.meus ? '#C9D2E0' : '#3A3448'; g.fillRect(x, by - 2, 2, 3); g.fillStyle = i < L.meus ? '#8A5A36' : '#2A2438'; g.fillRect(x, by + 1, 2, 7); }
}
export const nomeLevi = 'O Leviatã';
