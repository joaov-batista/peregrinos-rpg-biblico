// A vida em torno da sinagoga do Refúgio, conforme a hora do relógio da aldeia:
// - três orações por dia (manhã, tarde, noite): o sino chama, os moradores vão até lá de verdade, ajoelham e oram;
//   de perto dá para ouvir cada um (dores, pedidos, agradecimentos) e Jairo abre e fecha o culto;
// - à meia-noite o sino toca doze vezes e a aldeia inteira ouve; de madrugada alguns levantam para orar;
// - dois soldados fazem a ronda de ponta a ponta, dia e noite (à noite, com tocha);
// - à tarde, um feirante de passagem no Mercado; de madrugada, orar no Refúgio rende maná (Sl 119:147);
// - nas páginas, à noite, algumas sombras saem mais fortes (e deixam mais).
import { sfx } from '../audio.js';
import { RX } from './dados.js';
import { CULTOS, VIGILIA, ORACOES, LITURGIA, JAIRO, GUARDAS, NOITE, FEIRA } from '../content/sinagoga.js';
import { ITENS } from '../content/gente.js';
import { hora, periodo, ganhar, bolsa } from './moradores.js';
import { somarCoracoes } from './vida.js';
import { falarHabacuque } from './corca.js';
import { ceia, suaCasa, horaDaCeia, vaiACeia } from './lar.js';
import { T, CW } from './nivel.js';
import { MORADORES } from './dados.js';

const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
// conta as noites: muda à meia-noite (o relógio começa às 7h)
export const noiteN = G => Math.floor(((G.cm.relogio || 0) / 600 * 24 + 7) / 24);
export const madrugada = G => hora(G) < 5;
export const sinagoga = G => G.area === 'sinagoga' ? (G.sinCentro = G.sinCentro || { x: 15 * T + 16, y: 16 * T, dentro: true }) : G.objs.find(o => o.tipo === 'cenario' && o.qual === 'sinagoga');
export function cultoAgora(G) { const h = hora(G); for (const c of CULTOS) if (h >= c.vai && h < c.fim) return { c, fase: h < c.ini ? 'vai' : 'culto' }; return null; }

// para onde a agenda manda cada morador agora: 'culto', 'vigilia', 'casa' (noite) ou nada (rotina do dia)
export function agendaDe(G, o) {
  if (o.patrulha) return 'ronda';
  if (cultoAgora(G)) return 'culto';
  if (horaDaCeia(G) && vaiACeia(G, o.id)) return 'ceia';
  const h = hora(G);
  if (h < 5) return VIGILIA.includes(o.id) ? 'vigilia' : 'casa';
  if (h >= 21 || h < 5.5) return 'casa';
  return null;
}
// o lugar de cada um dentro da sinagoga (em fila, de frente para Jairo)
export function lugarNaSinagoga(G, o) {
  const s = sinagoga(G); if (!s) return null;
  if (!s.dentro) return s.x; // de fora: vai até a porta e entra
  const fila = MORADORES, i = Math.max(0, fila.findIndex(q => q.id === o.id)), n = fila.length;
  return s.x + (i - (n - 1) / 2) * 34 + (i >= n / 2 ? 70 : -70); // dentro: em fila, dos dois lados da bimá
}
// a ronda: de uma ponta à outra do trecho
export function passoRonda(G, o, v, dt) {
  const [a, b] = o.patrulha; if (v.alvo == null || v.alvo === o.x) v.alvo = b;
  if (v.estado === 'acena') return false;
  const d = v.alvo - v.x; if (Math.abs(d) < 6) { v.estado = 'parado'; v.t = (v.t ?? 0) - dt; if (v.t <= -2.5) { v.alvo = v.alvo === a ? b : a; v.t = 0; } return true; }
  v.estado = 'indo'; v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (Math.abs(v.x - G.p.x) > 760 ? 300 : 44) * dt); return true;
}

/* ---------------- a cada quadro, no Refúgio ---------------- */
export function passoSinagoga(G, dt) {
  const s = sinagoga(G), h = hora(G), noite = noiteN(G), cm = G.cm, S = G.sin = G.sin || { sinos: [], vozT: 2, vez: {} };
  if (!s) return;
  if (s.balanco > 0) s.balanco = Math.max(0, s.balanco - dt * 0.7);
  // o sino: doze badaladas à meia-noite; três para chamar a cada oração
  if (h < 0.6 && cm.sinoNoite !== noite) { cm.sinoNoite = noite; tocar(G, 12, 'Meia-noite. O sino da sinagoga toca doze vezes.'); }
  const k = cultoAgora(G);
  if (k && cm.sinoCulto !== k.c.id + noite) { cm.sinoCulto = k.c.id + noite; tocar(G, 3, 'O sino chama para ' + k.c.nome + '.'); }
  for (const b of S.sinos) b.t -= dt;
  while (S.sinos.length && S.sinos[0].t <= 0) badalar(G, s, S.sinos.shift());
  // a liturgia: Jairo abre, pede, fecha
  const jairo = G.objs.find(o => o.id === 'jairo');
  if (k && k.fase === 'culto' && jairo) {
    const meio = (k.c.ini + k.c.fim) / 2, chave = k.c.id + noite;
    if (S.abriu !== chave) { S.abriu = chave; G.fala(jairo, pick(LITURGIA.abre)); }
    else if (h > meio && S.meio !== chave) { S.meio = chave; G.fala(jairo, pick(LITURGIA.meio)); }
    else if (h > k.c.fim - 0.25 && S.fechou !== chave) { S.fechou = chave; G.fala(jairo, pick(LITURGIA.fecha)); }
  }
  // as vozes: quem está de joelhos fala baixo com Deus; de perto, dá para ouvir
  const orando = G.objs.filter(o => o.vv?.estado === 'orando'), dentroFora = !s.dentro && G.objs.filter(o => o.vv?.estado === 'dentro');
  if (s.dentro && orando.length && (S.vozT -= dt) <= 0) {
    S.vozT = rand(2.6, 4.2); const o = pick(orando), lista = ORACOES[o.id] || ORACOES.qualquer, i = S.vez[o.id] = ((S.vez[o.id] ?? Math.floor(rand(0, lista.length))) + 1) % lista.length;
    G.textos.push({ x: o.vv.x, y: o.y - 62, txt: lista[i], cor: '#E8DEC4', tam: 11, t: 3.2, oracao: true });
  }
  if (dentroFora && dentroFora.length && Math.abs(G.p.x - s.x) < 240 && (S.vozT -= dt) <= 0) { // de fora, junto à porta: ouve-se abafado
    S.vozT = rand(4.5, 6.5); const o = pick(dentroFora), lista = ORACOES[o.id] || ORACOES.qualquer;
    G.textos.push({ x: s.x, y: s.y - 150, txt: '(lá dentro) ' + pick(lista), cor: '#B8AE96', tam: 10, t: 3, oracao: true });
  }
  if (s.dentro) { passoInterior(G, dt); return; }
  // a feira da tarde
  const tarde = h >= 12 && h < 18.4, feirante = G.objs.find(o => o.id === 'feirante');
  if (tarde && !feirante) G.objs.push({ tipo: 'npc', id: 'feirante', nome: FEIRA.nome, look: FEIRA.look, daFeira: true, x: ((1 + RX) * CW + 11) * T + 16, y: 16 * T });
  if (!tarde && feirante) G.objs = G.objs.filter(o => o !== feirante);
}
function tocar(G, n, aviso) { const S = G.sin; S.sinos = []; for (let i = 0; i < n; i++) S.sinos.push({ t: 0.4 + i * 1.5, i, n, aviso: i === 0 ? aviso : null }); }
function badalar(G, s, b) {
  const longe = !s.dentro && (Math.abs(G.p.x - s.x) > 900 || Math.abs(G.p.y - s.y) > 300); sfx(longe ? 'sinoLonge' : 'sino'); s.balanco = 1;
  if (!longe && !s.dentro) G.textos.push({ x: s.x + 220, y: s.y - 330, txt: b.n > 3 ? String(b.i + 1) : '♪', cor: '#FFE9A8', tam: 14, t: 1.4 });
  if (b.aviso) G.textoEm(G.p.x, G.p.y - 110, '♪ ' + b.aviso, '#FFE9A8', 12); // a aldeia inteira ouve
  if (b.i === 0) for (const o of G.objs) if (o.vv && o.tipo === 'morador') { o.vv.emote = b.n > 3 ? '!' : '♪'; o.vv.emoteT = 1.8; }
}

/* ---------------- conversar ---------------- */
export async function falarSinagoga(G, ob) {
  if (ob.tipo === 'casa' && ob.id === 'peregrino') { if (G.def?.sitio) { sfx('gate'); G.entrar('casa:' + G.area.slice(6)); return true; } await suaCasa(G, ob); return true; } // no sítio, a porta abre: entra-se em casa
  if (ob.tipo === 'casa' && ob.id === 'marta' && horaDaCeia(G)) { await ceia(G, ob); return true; }
  if (ob.id === 'jairo') return jairo(G, ob);
  if (ob.daSin) { const l = ORACOES[ob.id] || ORACOES.qualquer; await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: (ob.vv?.estado === 'orando' ? '(De joelhos, sem abrir os olhos, ele faz sinal para você ficar.)\n\n' : '') + ' + pick(l) + ', acoes: [{ label: 'Ficar em silêncio' }] }); return true; }
  if (ob.id === 'habacuque') { await falarHabacuque(G, ob); return true; }
  if (ob.id === 'feirante') return feira(G, ob);
  if (ob.patrulha) {
    const cor = ob.id === 'guarda1', primeira = cor && !G.cm.cornelio;
    if (primeira) G.cm.cornelio = 1;
    const txt = primeira ? GUARDAS.cornelio : pick(periodo(G) === 'noite' ? GUARDAS.noite : GUARDAS.dia);
    if (ob.vv) { ob.vv.estado = 'acena'; ob.vv.t = 2.5; ob.vv.face = Math.sign(G.p.x - ob.vv.x) || 1; setTimeout(() => { if (ob.vv?.estado === 'acena') ob.vv.estado = 'parado'; }, 2500); }
    await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: txt, acoes: [{ label: 'Boa ronda' }] }); return true;
  }
  return false;
}
export const falaDaNoite = (G, id) => (periodo(G) === 'noite' && !cultoAgora(G) && NOITE[id]) || null;

async function jairo(G, ob) {
  const k = cultoAgora(G), cm = G.cm, chave = k && k.c.id + noiteN(G);
  if (k && k.fase === 'culto') {
    if (cm.sinJuntou === chave) return G.ui.dialog({ nome: ob.nome, look: ob.look, texto: JAIRO.jaJuntou, acoes: [{ label: 'Amém' }] }), true;
    await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: JAIRO.culto, acoes: [{ label: 'Ajoelhar-se com eles', fn: () => juntar(G, ob, chave) }, { label: 'Agora não' }] }); return true;
  }
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: madrugada(G) ? JAIRO.madrugada : pick(JAIRO.fora), acoes: [{ label: 'Até mais' }] }); return true;
}
async function juntar(G, ob, chave) {
  G.cm.sinJuntou = chave; const p = G.p; p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); G.efeito('cura', p.x, p.y, 1, { gruda: p });
  const juntos = G.objs.filter(o => o.vv?.estado === 'orando' && o.id); for (const o of juntos) somarCoracoes(G, o.id, 1);
  G.salvar();
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: JAIRO.juntou + '\n\nFôlegos e azeite refeitos.' + (juntos.length ? '\n♥ +1 com ' + juntos.map(o => o.nome.split(',')[0]).join(', ') + '.' : ''), acoes: [{ label: 'Amém' }] });
}
async function feira(G, ob) {
  const b = bolsa(G), c = G.char, oferta = Object.keys(FEIRA.precos)[noiteN(G) % 5], preco = k => k === oferta ? Math.ceil(FEIRA.precos[k] / 2) : FEIRA.precos[k];
  const lista = () => Object.keys(FEIRA.precos).map(k => ({ label: ITENS[k].nome + ' — ' + preco(k) + (k === oferta ? ' (oferta)' : '') + ' · você tem ' + (b[k] || 0), fn: async () => {
    if (c.data.gold < preco(k)) { G.ui.toast('Faltam denários.', 2500); return; }
    c.data.gold -= preco(k); ganhar(G, k, 1, G.p.x, G.p.y - 80); sfx('coin'); G.salvar(); await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'Mais alguma coisa?', acoes: [...lista(), { label: 'Só isso' }] });
  } }));
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: FEIRA.oi + '\n\nDenários: ' + Math.floor(c.data.gold), acoes: [...lista(), { label: 'Só olhando' }] }); return true;
}

/* ---------------- orar de madrugada; sombras da noite ---------------- */
export function aoOrar(G) {
  if ((G.area !== 'refugio' && G.area !== 'sinagoga') || !madrugada(G) || G.cm.orouNoite === noiteN(G)) return;
  G.cm.orouNoite = noiteN(G); G.cm.mana = (G.cm.mana || 0) + 1; sfx('level'); G.cm.vigilias = (G.cm.vigilias || 0) + 1; if (G.cm.vigilias >= 7 && !G.cm.semCessar) setTimeout(() => G.revelarSegredoOra?.('semCessar'), 1800);
  G.textoEm(G.p.x, G.p.y - 96, '"Antecipo-me ao alvorecer e clamo" (Sl 119:147) · +1 maná', '#FFE9A8', 12); G.salvar();
}
// nas páginas, à noite, uma ou duas sombras saem mais fortes; de madrugada, deixam algo raro
export function sombraDaNoite(G, e) {
  if (G.def.paz || !G.def.fase || e.kind !== 'vicio' || e.elite || e.daLuta) return;
  if (periodo(G) !== 'noite' || G.inimigos.filter(q => q.noturno).length >= (madrugada(G) ? 2 : 1) || Math.random() > 0.3) return;
  e.elite = true; e.noturno = madrugada(G) ? 2 : 1; e.hp = e.max = Math.round(e.max * 1.6);
}
export function venceuNoturno(G, e) {
  if (!e.noturno) return;
  G.textoEm(e.x, e.y - e.h - 30, e.noturno > 1 ? 'Sombra da madrugada vencida!' : 'Sombra da noite vencida!', '#C9A6FF', 13);
  if (Math.random() < (e.noturno > 1 ? 0.6 : 0.3)) G.achado({ comum: 40, rara: 45, epica: 15 }, false, true);
}

/* ---------------- por dentro: quem chega, ora e vai embora ---------------- */
// quem deve estar lá dentro agora (pela agenda), entra pela porta e vai ao seu lugar; quem não deve mais, sai pela porta
function passoInterior(G, dt) {
  const porta = G.objs.find(o => o.tipo === 'portal' && o.porta), px = porta ? porta.x : 3 * T, S = G.sin;
  const querem = MORADORES.filter(m => { const a = agendaDe(G, m); return a === 'culto' || a === 'vigilia'; }), ja = G.objs.filter(o => o.tipo === 'morador' && o.daSin);
  for (const m of querem) if (!ja.some(o => o.id === m.id)) {
    const lugar = lugarNaSinagoga(G, m), sentado = !S.montou; /* quem já estava lá quando você entrou: já de joelhos */
    G.objs.push({ tipo: 'morador', daSin: true, id: m.id, nome: m.nome, look: m.look, x: lugar, y: 16 * T, vv: { x: sentado ? lugar : px, alvo: lugar, t: 0, estado: sentado ? 'orando' : 'indo', face: 1, emote: null, emoteT: 0 } });
  }
  S.montou = true;
  for (const o of G.objs.filter(q => q.daSin)) {
    const v = o.vv, fica = querem.some(m => m.id === o.id), alvo = fica ? lugarNaSinagoga(G, o) : px, d = alvo - v.x;
    if (v.emoteT > 0) v.emoteT -= dt;
    if (Math.abs(d) > 4) { v.estado = 'indo'; v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), 60 * dt); }
    else if (fica) { if (v.estado !== 'orando') { v.estado = 'orando'; v.face = Math.sign(15 * T + 16 - v.x) || 1; } }
    else o.foi = true;
  }
  if (G.objs.some(o => o.foi)) G.objs = G.objs.filter(o => !o.foi);
}
