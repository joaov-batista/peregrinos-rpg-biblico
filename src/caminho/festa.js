// A mesa da festa, viva: os moradores chamam (por qualquer motivo, ou quando você passa perto da mesa) e sentar-se é uma cena:
// a gente chega, cada um no seu lugar na esteira, o dono da festa conta o motivo, alguém dá graças, um brinde, risadas.
// No fim, a história do dia da festa (vida.js) e o presente de sempre.
import { sfx, music } from '../audio.js';
import { GENTE } from '../content/gente.js';
import { festaDeHoje, jaSentouNaFesta, mesa } from './vida.js';
import { quadroPessoa } from './pixel/humano.js';
import { carimbar } from './pixel/raster.js';

const pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MOTIVOS = ['nasceu o neto da vizinha, e a avó não para de chorar de alegria', 'a colheita foi boa este ano, graças a Deus', 'meu filho voltou de viagem, são e salvo', 'a cabra deu cria, dois cabritinhos!', 'faz um ano que eu cheguei ao Refúgio', 'fiz pão demais, e pão bom não se come sozinho', 'só porque Deus é bom, e isso já basta', 'o poço encheu de novo depois da seca', 'minha filha ficou noiva!', 'a gente sarou da febre, a casa inteira'];
const CHAMA = [m => 'Ei, peregrino! Vem pra mesa! Hoje tem festa: ' + m + '.', m => 'Você aí! Senta com a gente, ' + m + '!', m => 'Não passa direto, não! Tem lugar na esteira. É que ' + m + '.', m => 'Vem comer com a gente! ' + m[0].toUpperCase() + m.slice(1) + '.'];
const CONVERSA = ['E o peixe que o Zebedeu jura que era deste tamanho?', 'Ninguém faz lentilha como a minha avó. Ninguém.', 'Passa o sal, por favor? Não, o sal. Isso é azeite.', 'Lembra quando a cabra entrou na sinagoga?', 'Come mais um pedaço, você tá magro de tanto caminhar.', 'Contaram que lá em Sardes as lâmpadas estão voltando a acender.'];
const nomeDe = o => (o.nome || '').split(',')[0];
const S0 = 0.7, CHEGA = 2.3, SENTA = 2.6, FALA1 = 3.0, GRACAS = 5.6, PAPO = 8.2, BRINDE = 10.8, RISO = 12.0, FIM = 13.4;

/* ---------------- os convites ---------------- */
// a cada quadro, no Refúgio: quem passa perto (ou quem está junto da mesa) às vezes chama
export function passoFesta(G, dt) {
  if (G.cenaFesta) return passoCena(G, dt);
  if (G.area !== 'refugio' || G.ui.blocking || G.p.morto || G.luta || G.cena || jaSentouNaFesta(G) || (G.cm.visto?.tut != null && G.cm.visto.tut < 11)) return;
  const h = ((G.cm.relogio || 0) / 600 * 24 + 7) % 24; if (h < 9 || h >= 22) return; // festa é de dia e de noitinha
  const F = G.festaConv = G.festaConv || { cd: 8, id: null, t: 0 }, p = G.p;
  if (F.id) { const o = G.objs.find(q => q.id === F.id && q.tipo === 'morador'); F.t -= dt; if (!o || F.t <= 0) { F.id = null; F.cd = 40; } else if (o.vv) { o.vv.emote = '♪'; o.vv.emoteT = Math.max(o.vv.emoteT || 0, 0.3); } return; }
  if ((F.cd -= dt) > 0) return;
  const mesaOb = G.objs.find(o => o.tipo === 'festa'), pertoMesa = mesaOb && Math.abs(mesaOb.x - p.x) < 260;
  const quem = G.objs.filter(o => o.tipo === 'morador' && GENTE[o.id] && o.vv && Math.abs(o.vv.x - p.x) < (pertoMesa ? 320 : 150) && o.vv.estado !== 'dentro' && o.vv.estado !== 'casa');
  F.cd = 6; if (!quem.length || Math.random() < (pertoMesa ? 0.2 : 0.55)) return;
  const o = pick(quem), m = pick(MOTIVOS); F.id = o.id; F.motivo = m; F.t = 40; sfx('sinoLonge');
  G.fala({ x: o.vv.x, y: o.y, h: 56 }, pick(CHAMA)(m)); o.vv.face = Math.sign(p.x - o.vv.x) || 1; o.vv.estado = 'acena'; o.vv.t = 1.6;
}
// falar com quem chamou (vem antes da conversa de sempre)
export async function falarFesta(G, ob) {
  const F = G.festaConv; if (!F?.id || F.id !== ob.id || G.area !== 'refugio') return false;
  const f = festaDeHoje(), n = nomeDe(ob); F.id = null; F.cd = 60;
  const r = await G.ui.dialog({ nome: ob.nome + ' ♪', look: ob.look, texto: '"Hoje é ' + f.nome.toLowerCase().replace(/^a |^o /, m => m) + ', e ainda por cima ' + F.motivo + '! A mesa está posta no Bairro. Vem?"', acoes: [{ label: 'Bora pra festa!' }, { label: 'Agora não dá' }] });
  if (r !== 'Bora pra festa!') { G.textoEm(ob.vv?.x ?? ob.x, ob.y - 70, 'a mesa fica posta', '#C9D2E0', 11); return true; }
  const m = G.objs.find(o => o.tipo === 'festa'); if (m) comecarFesta(G, m, ob, F.motivo);
  return true;
}

/* ---------------- a cena ---------------- */
export function comecarFesta(G, mesaOb, anfitriao, motivo) {
  if (G.cenaFesta) return;
  const gente = G.objs.filter(o => o.tipo === 'morador' && GENTE[o.id] && o.vv && o.vv.estado !== 'dentro'), dono = anfitriao || gente.sort((a, b) => Math.abs(a.vv.x - mesaOb.x) - Math.abs(b.vv.x - mesaOb.x))[0];
  const outros = gente.filter(o => o !== dono).sort((a, b) => Math.abs(a.vv.x - mesaOb.x) - Math.abs(b.vv.x - mesaOb.x)).slice(0, 4), convivas = [dono, ...outros].filter(Boolean);
  const lugares = [-96, 96, -56, 56, 96 + 36].map(d => mesaOb.x + d); // o jogador fica no meio, à esquerda do dono
  const C = G.cenaFesta = { t: 0, mesa: mesaOb, motivo: motivo || pick(MOTIVOS), convivas: convivas.map((o, i) => ({ o, x0: o.vv.x, lugar: lugares[i], ini: mesaOb.x + (i % 2 ? 1 : -1) * (220 + i * 40) })), eu: mesaOb.x - 22, falou: {}, ups: [] };
  for (const c of C.convivas) { c.o.vv.festa = true; c.o.vv.papo = null; }
  G.cena = true; G.cenaMx = 0; G.fade = 1; G.p.atk = null; music('mundo', 'casa');
}
function passoCena(G, dt) {
  const C = G.cenaFesta, p = G.p, f = festaDeHoje(); C.t += dt; const t = C.t;
  p.x = C.eu; p.vx = 0; p.face = 1; p.atk = null; C.sentado = t >= SENTA; G.vista.cam.x += ((C.mesa.x - G.vista.W / G.vista.Z / 2) - G.vista.cam.x) * Math.min(1, dt * 6);
  for (const c of C.convivas) { const v = c.o.vv, k = clamp((t - S0) / (CHEGA - S0), 0, 1); v.x = c.ini + (c.lugar - c.ini) * k; v.face = Math.sign(C.mesa.x - c.lugar) || 1; v.estado = t < S0 ? 'parado' : k < 1 ? 'indo' : 'sentado'; v.emoteT = 0; }
  const [dono, sabio, terceiro] = [C.convivas[0], C.convivas.find(c => ['eliabe', 'velho', 'jairo'].includes(c.o.id)) || C.convivas[1] || C.convivas[0], C.convivas[2] || C.convivas[0]];
  const diz = (k, c, txt) => { if (C.falou[k] || !c) return; C.falou[k] = 1; G.fala({ x: c.lugar, y: c.o.y, h: 46 }, txt); };
  if (t >= FALA1) diz('a', dono, 'Sentem-se! Hoje é dia de festa: ' + C.motivo + '!');
  if (t >= GRACAS) { diz('b', sabio, 'Bendito és Tu, Senhor, que tiras o pão da terra.'); if (!C.falou.amem && t >= GRACAS + 1.4) { C.falou.amem = 1; G.textoEm(C.mesa.x, C.mesa.y - 120, '— Amém!', '#FFE9A8', 13); } }
  if (t >= PAPO) diz('c', terceiro, pick(CONVERSA));
  if (t >= BRINDE && !C.falou.d) { diz('d', dono, 'Lechaim! À vida!'); sfx('coin'); for (let i = 0; i < 26; i++) G.parts.push({ x: C.mesa.x + (Math.random() - 0.5) * 220, y: C.mesa.y - 40 - Math.random() * 30, vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 120, t: 1.1, max: 1.1, r: 1.6, cor: i % 3 ? '#FFE08A' : '#FFFFFF', g: 120 }); }
  if (t >= RISO && !C.falou.e) { C.falou.e = 1; sfx('level'); for (const c of C.convivas) { c.o.vv.emote = Math.random() < 0.5 ? '♥' : '♪'; c.o.vv.emoteT = 1.6; } }
  if (t >= FIM) acabar(G);
}
async function acabar(G) {
  const C = G.cenaFesta; G.cenaFesta = null; G.cena = false; G.cenaMx = 0; G.cenaCls = false; document.body.classList.remove('em-cena');
  for (const c of C.convivas) { const v = c.o.vv; v.festa = false; v.estado = 'parado'; v.t = 1 + Math.random() * 2; }
  await mesa(G); G.musicaDaArea?.();
}

/* ---------------- desenho ---------------- */
// o peregrino sentado na esteira, de frente para a mesa
export function pintarNaFesta(g, G, X, Y, Tm) {
  const x = X(G.p.x), y = Y(G.p.y), C = G.cenaFesta; carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'festa-eu', 'olha'), x, y, 24, 40, 1);
  if (C?.mesa) { g.save(); g.beginPath(); g.rect(x - 16, y - 15, 32, 15); g.clip(); pintarMesaFesta(g, G, C.mesa, X(C.mesa.x), Y(C.mesa.y), Tm); g.restore(); } // a toalha da mesa na frente: sentado atrás dela, como os outros
}
// faixas de cinema e o nome da festa
export function pintarCenaFesta(g, G, vw, vh) {
  const C = G.cenaFesta; if (!C) return; const k = clamp(C.t / 0.8, 0, 1) * (1 - clamp((C.t - FIM + 0.5) / 0.5, 0, 1)), fx = Math.round(k * vh * 0.1), fb = Math.round(k * vh * 0.05);
  g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fb, vw, fb);
  g.globalAlpha = k * clamp(C.t - 0.4, 0, 1); g.textAlign = 'center'; g.font = '16px "Jersey 15", monospace'; g.fillStyle = '#FFE9A8'; g.fillText('✦ ' + festaDeHoje().nome + ' ✦', vw / 2, fx / 2 + 5); g.textAlign = 'left'; g.globalAlpha = 1;
}
// a mesa da festa: tábua comprida com toalha branca e faixa da cor da festa, pães, uvas, figos, romãs, jarra e copos, lamparinas;
// esteiras na frente, dois postes com um varal de bandeirolas e lanternas por cima (acesas de noite)
export function pintarMesaFesta(g, G, o, x, y, Tm) {
  const hh = ((G.cm.relogio || 0) / 600 * 24 + 7) % 24, noite = hh >= 18.5 || hh < 5.5, R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
  if (noite) { g.globalAlpha = 0.16; g.fillStyle = '#FFC860'; g.beginPath(); g.ellipse(x, y - 20, 90, 34, 0, 0, 6.29); g.fill(); g.globalAlpha = 1; }
  // postes e o varal
  for (const s of [-1, 1]) { R(s * 74 - 2, -66, 4, 66, '#17121f'); R(s * 74 - 1, -65, 2, 65, '#6B4A2E'); R(s * 74 - 3, -68, 6, 3, '#17121f'); }
  for (let i = 0; i <= 36; i++) { const u = i / 36, xx = Math.round(-72 + u * 144), yy = Math.round(-64 + Math.sin(u * Math.PI) * 12 + Math.sin(Tm * 1.4 + u * 6) * 0.6); R(xx, yy, 4, 1, '#3A2A22');
    if (i % 3 === 1) R(xx, yy + 1, 3, 4, ['#C24058', '#E8C873', '#3E7AA8', '#5E9A4A'][(i / 3 | 0) % 4]);
    if (i % 9 === 4) { R(xx - 1, yy + 1, 5, 7, '#17121f'); R(xx, yy + 2, 3, 5, noite ? '#FFD86A' : '#C9A060'); if (noite) { g.globalAlpha = 0.25; R(xx - 5, yy - 2, 13, 13, '#FFC860'); g.globalAlpha = 1; } } }
  // esteiras no chão
  for (const [a, w] of [[-62, 30], [-16, 32], [32, 30]]) { R(a, -2, w, 2, '#17121f'); R(a + 1, -2, w - 2, 1, '#C9A86A'); for (let k = 2; k < w - 2; k += 4) R(a + k, -2, 1, 1, '#9A7A4A'); }
  // a mesa: pernas, tampo, toalha com franja e a faixa da festa
  R(-58, -14, 116, 4, '#17121f'); for (const a of [-54, -4, 50]) { R(a, -11, 4, 9, '#17121f'); R(a + 1, -11, 2, 9, '#5A3A22'); }
  R(-57, -13, 114, 2, '#F2EEE2'); R(-57, -11, 114, 4, '#E8E2D0'); for (let a = -56; a < 56; a += 3) R(a, -7, 1, 1 + ((a / 3) & 1), '#D8D0BC');
  R(-12, -13, 24, 6, o.festa === 'pascoa' ? '#8E2B45' : '#3E5FA8'); R(-12, -13, 24, 1, '#FFFFFF'); R(-11, -7, 1, 2, '#C9A060'); R(10, -7, 1, 2, '#C9A060');
  // a comida
  for (const a of [-50, -36]) { R(a, -18, 10, 5, '#17121f'); R(a + 1, -17, 8, 4, '#D9A63C'); R(a + 2, -17, 5, 1, '#F2C870'); R(a + 3, -15, 1, 1, '#A0662A'); R(a + 6, -15, 1, 1, '#A0662A'); } // pães trançados
  R(-24, -16, 14, 3, '#17121f'); R(-23, -15, 12, 2, '#C9C4B2'); for (const [dx, dy] of [[-21, -19], [-18, -20], [-15, -19], [-19, -17], [-16, -17], [-13, -17], [-17, -22]]) R(dx, dy, 3, 3, '#5A2A6A'); R(-17, -23, 2, 1, '#5E9A4A'); // uvas no prato
  R(-4, -24, 8, 11, '#17121f'); R(-3, -23, 6, 10, '#B8733E'); R(-2, -26, 4, 3, '#17121f'); R(-1, -25, 2, 2, '#B8733E'); R(-3, -21, 1, 6, '#D99A5E'); // a jarra
  for (const a of [8, 14]) { R(a, -18, 4, 5, '#17121f'); R(a + 1, -17, 2, 3, '#D9A63C'); } // os copos
  for (const [a, c] of [[22, '#C24058'], [27, '#C24058'], [24, '#A0303E']]) { R(a, -17, 5, 4, '#17121f'); R(a + 1, -16, 3, 3, c); } R(25, -18, 1, 1, '#5E9A4A'); // romãs
  R(34, -16, 12, 3, '#17121f'); R(35, -15, 10, 2, '#7A4E2E'); for (const a of [36, 39, 42]) R(a, -17, 2, 2, '#4A3A5A'); // figos na tigela
  for (const a of [-58, 54]) { const fl = Math.floor(Tm * 9 + a) % 3; R(a, -16, 6, 3, '#17121f'); R(a + 1, -15, 4, 2, '#B8733E'); R(a + 4, -19 - fl, 2, 3 + fl, '#FF9A3C'); R(a + 4, -18, 1, 2, '#FFE08A'); if (noite) { g.globalAlpha = 0.2; R(a - 6, -28, 18, 16, '#FFC860'); g.globalAlpha = 1; } } // as lamparinas
}
