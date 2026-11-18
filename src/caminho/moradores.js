// Gente com vida: os moradores do Refúgio andam com destino, param, conversam entre si, acenam quando você chega,
// se assustam com golpe perto, vão para casa à noite. Por cima das amizades de vida.js (corações de 0 a 10), cada um tem
// gostos de presente, um pedido e presentes para dar quando a amizade cresce (aos 5, 9 e 10 corações; os de 3 e 7 são
// os eventos de vida.js). O dia tem três partes (manhã, tarde, noite) e dura 10 minutos de jogo.
import { sfx } from '../audio.js';
import { GENTE, ITENS, PAPOS } from '../content/gente.js';
import { VILA } from '../content/vila.js';
import { coracoesDe, somarCoracoes } from './vida.js';

const DIA = 600, rand = (a, b) => a + Math.random() * (b - a);
// ---- o relógio ----
export const hora = G => ((G.cm.relogio || 0) / DIA * 24 + 7) % 24; // começa às 7 da manhã
export const dia = G => Math.floor((G.cm.relogio || 0) / DIA);
export const periodo = G => { const h = hora(G); return h < 12 ? 'manha' : h < 19 ? 'tarde' : 'noite'; };
// ---- a bolsa ----
export const bolsa = G => (G.cm.bolsa = G.cm.bolsa || {});
export function ganhar(G, item, n = 1, x, y) {
  const b = bolsa(G); b[item] = (b[item] || 0) + n;
  if (x != null) G.textoEm(x, y, '+' + n + ' ' + (n > 1 ? ITENS[item].plural : ITENS[item].nome.toLowerCase()), '#F2D9A0', 11);
}
// ---- os laços (os corações são os de vida.js; aqui só o dia do presente, os presentes recebidos e o pedido) ----
const laco = (G, id) => { const a = G.cm.laco = G.cm.laco || {}; return (a[id] = a[id] || { deu: -1, presentes: [], pedido: 0 }); };
const coracoes = (G, id) => coracoesDe(G, id);
const somar = (G, id, n) => somarCoracoes(G, id, n);
const marcaCoracoes = n => '♥'.repeat(Math.min(10, n)) + '♡'.repeat(Math.max(0, 10 - n));

/* ---------------- a cada quadro ---------------- */
export function passoVida(G, dt) {
  G.cm.relogio = (G.cm.relogio || 0) + dt;
  if (G.area !== 'refugio') return;
  const p = G.p, noite = periodo(G) === 'noite', gente = G.objs.filter(o => o.tipo === 'morador');
  for (const o of gente) {
    const v = o.vv || (o.vv = { x: o.x, alvo: o.x, t: rand(0, 3), estado: 'parado', face: 1, emote: null, emoteT: 0, papo: null });
    const casa = G.objs.find(c => c.tipo === 'casa' && c.cel === o.cel && Math.abs(c.x - o.x) < 640);
    const raio = (o.vai || 3) * 32;
    if (v.emoteT > 0) v.emoteT -= dt;
    // à noite, quem tem casa na rua vai para ela e some lá dentro; de manhã, sai
    if (noite && casa) { if (v.estado !== 'casa') { v.alvo = casa.x; v.estado = 'indo'; } if (Math.abs(v.x - casa.x) < 6) { v.estado = 'casa'; o.escondido = Infinity; } }
    else if (v.estado === 'casa') { v.estado = 'parado'; o.escondido = 0; v.x = casa ? casa.x : o.x; v.emote = '♪'; v.emoteT = 2; }
    if (v.estado === 'casa') continue;
    const dp = Math.abs(p.x - v.x), perto = dp < 90 && Math.abs(p.y - o.y) < 80;
    // golpe perto: susto
    if (perto && p.atk && v.estado !== 'susto') { v.estado = 'susto'; v.t = 0.8; v.emote = '!'; v.emoteT = 1; v.alvo = v.x + Math.sign(v.x - p.x) * 40; }
    // você chega: ele se vira e acena (uma vez por visita)
    else if (perto && !v.acenou && v.estado !== 'conversa') { v.acenou = true; v.estado = 'acena'; v.t = 1.4; v.face = Math.sign(p.x - v.x) || 1; v.emote = coracoes(G, o.id) >= 5 ? '♥' : '…'; v.emoteT = 1.4; const g = GENTE[o.id]; if (g) G.fala({ x: v.x, y: o.y, h: 56 }, g.cumprimenta[Math.floor(rand(0, g.cumprimenta.length))]); }
    if (dp > 400) v.acenou = false;
    // conversa de rua com quem estiver perto e parado
    if (v.estado === 'parado' && !v.papo && Math.random() < dt * 0.15) {
      const outro = gente.find(q => q !== o && q.vv && q.vv.estado === 'parado' && !q.vv.papo && Math.abs(q.vv.x - v.x) < 110 && q.cel === o.cel);
      if (outro) { const linhas = PAPOS[Math.floor(rand(0, PAPOS.length))]; v.papo = outro.vv.papo = { linhas, i: 0, t: 0, a: o, b: outro }; v.estado = outro.vv.estado = 'conversa'; v.face = Math.sign(outro.vv.x - v.x) || 1; outro.vv.face = -v.face; }
    }
    if (v.estado === 'conversa' && v.papo && v.papo.a === o) { const pp = v.papo; pp.t -= dt; if (pp.t <= 0) { if (pp.i >= pp.linhas.length) { for (const q of [pp.a, pp.b]) { q.vv.papo = null; q.vv.estado = 'parado'; q.vv.t = rand(2, 4); } } else { const quem = pp.i % 2 ? pp.b : pp.a; G.fala({ x: quem.vv.x, y: quem.y, h: 56 }, pp.linhas[pp.i]); pp.i++; pp.t = 2.6; } } }
    // andar com destino; parar um pouco; escolher outro ponto perto de casa
    v.t -= dt;
    if (v.estado === 'acena' || v.estado === 'susto') { if (v.t <= 0) v.estado = 'parado'; if (v.estado === 'susto') v.x += Math.sign(v.alvo - v.x) * Math.min(Math.abs(v.alvo - v.x), 90 * dt); continue; }
    if (v.estado === 'conversa') continue;
    if (v.estado === 'parado' && v.t <= 0 && !perto) { v.alvo = o.x + rand(-raio, raio); v.estado = 'indo'; }
    if (v.estado === 'indo') { const d = v.alvo - v.x; if (Math.abs(d) < 4) { v.estado = 'parado'; v.t = rand(2.5, 6); if (Math.random() < 0.25) { v.emote = ['♪', '…', '☀'][Math.floor(rand(0, 3))]; v.emoteT = 1.6; } } else { v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (periodo(G) === 'manha' ? 46 : 36) * dt); } }
  }
}

/* ---------------- conversar, dar presente, pedido ---------------- */
export async function falarMorador(G, ob) {
  const id = ob.id, g = GENTE[id], V = VILA[id]; if (!g || G.area !== 'refugio') return false;
  const a = laco(G, id), d = dia(G), n = G.cm.falas[id] = (G.cm.falas[id] || 0) + 1, nome = (V?.nome || ob.nome) + '  ' + marcaCoracoes(coracoes(G, id));
  if (ob.vv) { ob.vv.estado = 'acena'; ob.vv.t = 3; ob.vv.face = Math.sign(G.p.x - ob.vv.x) || 1; }
  const conv = V?.conversa || g.cumprimenta, volta = V?.volta || 0, k = n <= conv.length ? n - 1 : volta + ((n - 1 - volta) % Math.max(1, conv.length - volta));
  const texto = conv[Math.max(0, Math.min(conv.length - 1, k))];
  const presente = g.presentes.find(pr => coracoes(G, id) >= ({ 2: 5, 4: 9, 5: 10 })[pr.nivel] && !a.presentes.includes(pr.nivel));
  const b = bolsa(G), P = g.pedido, acoes = [];
  if (Object.keys(ITENS).some(k => b[k] > 0) && a.deu !== d) acoes.push({ label: 'Dar um presente', fn: () => darPresente(G, ob) });
  if (a.pedido === 0 && coracoes(G, id) >= 2) acoes.push({ label: 'Precisa de alguma coisa?', fn: () => pedir(G, ob) });
  if (a.pedido === 1) acoes.push({ label: (b[P.item] || 0) >= P.n ? 'Trouxe o que você pediu' : 'Sobre o pedido…', fn: () => pedir(G, ob) });
  acoes.push({ label: 'Até mais' });
  // quando ele(a) tem um presente para você, o encontro é só isso (o resto fica para a próxima conversa)
  if (presente) { a.presentes.push(presente.nivel); await receber(G, ob, presente); G.salvar(); return true; }
  await G.ui.dialog({ nome, look: ob.look, texto, acoes });
  G.salvar(); return true;
}
async function receber(G, ob, pr) {
  const nome = VILA[ob.id]?.nome || ob.nome; let extra = '';
  if (pr.item) { ganhar(G, pr.item, pr.n); extra = '+' + pr.n + ' ' + (pr.n > 1 ? ITENS[pr.item].plural : ITENS[pr.item].nome.toLowerCase()); }
  if (pr.ouro) { G.char.data.gold += pr.ouro; extra = '+' + pr.ouro + ' denários'; }
  sfx('level'); G.efeito('coleta', G.p.x, G.p.y - 30);
  await G.ui.dialog({ nome: nome + ' tem algo para você', look: ob.look, texto: pr.fala + (extra ? '\n\n' + extra : ''), acoes: [{ label: 'Obrigado!' }] });
  if (pr.reliquia) await G.ganhar(pr.reliquia);
}
async function darPresente(G, ob) {
  const id = ob.id, g = GENTE[id], b = bolsa(G), a = laco(G, id);
  const acoes = Object.keys(ITENS).filter(k => b[k] > 0).map(k => ({ label: ITENS[k].nome + ' (' + b[k] + ')', fn: async () => {
    b[k]--; a.deu = dia(G);
    const tipo = k === g.ama ? 'ama' : g.gosta.includes(k) ? 'gosta' : k === g.naoGosta ? 'naoGosta' : 'neutro';
    somar(G, id, { ama: 2, gosta: 1, naoGosta: -1, neutro: 0 }[tipo]); sfx(tipo === 'naoGosta' ? 'wrong' : 'right');
    if (ob.vv) { ob.vv.emote = tipo === 'naoGosta' ? '…' : '♥'; ob.vv.emoteT = 2.5; }
    await G.ui.dialog({ nome: (VILA[id]?.nome || ob.nome) + '  ' + marcaCoracoes(coracoes(G, id)), look: ob.look, texto: g.reage[tipo], acoes: [{ label: 'Continuar' }] });
    G.salvar();
  } }));
  acoes.push({ label: 'Deixa para depois' });
  await G.ui.dialog({ nome: 'O que você vai dar?', texto: 'Um presente por dia para cada pessoa.', acoes, voz: false });
}
async function pedir(G, ob) {
  const id = ob.id, P = GENTE[id].pedido, a = laco(G, id), b = bolsa(G), nome = VILA[id]?.nome || ob.nome;
  if (a.pedido === 0) { a.pedido = 1; G.salvar(); return G.ui.dialog({ nome, look: ob.look, texto: P.texto + '\n\n(' + P.n + ' ' + (P.n > 1 ? ITENS[P.item].plural : ITENS[P.item].nome.toLowerCase()) + ')', acoes: [{ label: 'Eu trago' }] }); }
  if ((b[P.item] || 0) < P.n) return G.ui.dialog({ nome, look: ob.look, texto: 'Ainda faltam ' + (P.n - (b[P.item] || 0)) + '. Sem pressa.', acoes: [{ label: 'Até mais' }] });
  b[P.item] -= P.n; a.pedido = 2; somar(G, id, 2); G.char.data.gold += P.ouro; sfx('level'); G.salvar();
  await G.ui.dialog({ nome: nome + '  ' + marcaCoracoes(coracoes(G, id)), look: ob.look, texto: P.obrigado + '\n\n+' + P.ouro + ' denários', acoes: [{ label: 'De nada' }] });
}
