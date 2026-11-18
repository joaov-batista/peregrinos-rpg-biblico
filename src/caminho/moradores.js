// Gente com vida: os moradores do Refúgio andam com destino, param, conversam entre si, acenam quando você chega,
// se assustam com golpe perto, à noite ficam à porta de casa. Por cima das amizades de vida.js (corações de 0 a 10), cada um tem
// gostos de presente, um pedido e presentes para dar quando a amizade cresce (aos 5, 9 e 10 corações; os de 3 e 7 são
// os eventos de vida.js). O dia tem três partes (manhã, tarde, noite) e dura 10 minutos de jogo.
import { sfx } from '../audio.js';
import { GENTE, ITENS, PAPOS } from '../content/gente.js';
import { VILA } from '../content/vila.js';
import { coracoesDe, somarCoracoes } from './vida.js';
import { acoesDoCoracao } from './lar.js';
import { passoSitio, falarConjugeSitio, acoesEliabe, sitioId } from './sitio.js';
import { passoSinagogaSardes } from './sardesnovo.js';
import { passoPescaViva } from './pescaviva.js';
import { RX } from './dados.js';
import { AZEITES } from '../content/azeites.js';
import { passoConvites } from './convites.js';
import { passoAzeites } from './azeites.js';
import { passoTempo } from './tempo.js';
import { passoMarBravo } from './marbravo.js';
import { agendaDe, lugarNaSinagoga, passoRonda, passoSinagoga, falarSinagoga, falaDaNoite } from './sinagoga.js';

export const DIA = 600; const rand = (a, b) => a + Math.random() * (b - a);
// ---- o relógio ----
export const hora = G => ((G.cm.relogio || 0) / DIA * 24 + 7) % 24; // começa às 7 da manhã
export const dia = G => Math.floor((G.cm.relogio || 0) / DIA);
export const periodo = G => { const h = hora(G); return h >= 5.5 && h < 12 ? 'manha' : h >= 12 && h < 19 ? 'tarde' : 'noite'; }; /* de madrugada é noite, não manhã */
// quanto de dia há agora (0 = noite, 1 = dia cheio) e quanto de poente: o céu do Refúgio segue o relógio
export const luzDoDia = G => { if (G.cenaPraia) return { d: 0.6, poente: 1, h: 18, semSol: true }; const h = hora(G); return { d: Math.max(0, Math.min(1, (h - 5) / 2, (19.5 - h) / 2.5)), poente: Math.max(0, 1 - Math.abs(h - 18) / 1.6), h }; };
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
  passoAzeites(G, dt); passoTempo(G, dt);
  // a pé, pela beira do mapa: do fim da trilha (oeste do Refúgio) para o sítio, e de volta (sem portal)
  if (!G.p.morto && !G.ui.blocking && !(G.bordaT > G.T)) { const tutOk = !(G.cm.visto?.tut != null && G.cm.visto.tut < 11);
    if (G.area === 'refugio' && tutOk && G.p.x < (RX * 30 + 1.7) * 32) { G.bordaT = G.T + 2; G.entrar(sitioId(G), { borda: 'direita' }); return; } /* depois do treino, a trilha fica para trás: a oeste da Praça é a estrada do sítio */
    if (G.def?.sitio && G.p.x > (G.N.w - 1.7) * 32) { G.bordaT = G.T + 2; G.entrar('refugio', { borda: 'esquerda' }); return; } }
  if (G.area === 'sinagoga') { passoSinagoga(G, dt); return; }
  if (G.area === 'sinagoga:sardes') { passoSinagogaSardes(G, dt); return; }
  if (G.def?.sitio) { passoSitio(G, dt); return; }
  if (G.area !== 'refugio') return;
  passoPescaViva(G, dt); // a pesca na margem e no bote
  passoMarBravo(G, dt); // na tempestade, o Leviatã
  passoSinagoga(G, dt);
  passoConvites(G, dt);
  const p = G.p, gente = G.objs.filter(o => o.tipo === 'morador');
  for (const o of gente) {
    const v = o.vv || (o.vv = { x: o.x, alvo: o.x, t: rand(0, 3), estado: 'parado', face: 1, emote: null, emoteT: 0, papo: null });
    const casa = G.objs.find(c => c.tipo === 'casa' && c.cel === o.cel && Math.abs(c.x - o.x) < 640);
    const raio = (o.vai || 3) * 32, ag = agendaDe(G, o), longe = Math.abs(v.x - p.x) > 760; /* fora da vista, andam depressa: ninguém perde o culto por morar longe */
    if (v.emoteT > 0) v.emoteT -= dt;
    if (ag === 'ronda') { if (v.estado === 'acena') { v.t -= dt; if (v.t <= 0) v.estado = 'parado'; } else passoRonda(G, o, v, dt); continue; }
    // hora de orar: vai até a sinagoga, ajoelha no seu lugar e fica até o culto acabar (ou a madrugada passar)
    if (ag === 'culto' || ag === 'vigilia') { const lugar = lugarNaSinagoga(G, o); if (lugar != null) {
      v.papo = null; const d = lugar - v.x;
      if (Math.abs(d) > 5) { v.estado = 'indo'; v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (longe ? 600 : 70) * dt); }
      else if (v.estado !== 'dentro') { v.estado = 'dentro'; } /* entrou na sinagoga: de fora não se vê mais; lá dentro, está de joelhos */
      continue; } }
    // a ceia dos irmãos: quem tem laço vai à casa de Marta e Maria e espera à porta, conversando
    if (ag === 'ceia') { const m = G.objs.find(c => c.tipo === 'casa' && c.id === 'marta'); if (m) { const i = gente.filter(q => agendaDe(G, q) === 'ceia').indexOf(o), alvo = m.x + (i % 2 ? 1 : -1) * (40 + Math.floor(i / 2) * 30), d = alvo - v.x;
      v.papo = null; if (Math.abs(d) > 5) { v.estado = 'indo'; v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (longe ? 600 : 60) * dt); } else { v.estado = 'ceia'; v.face = Math.sign(m.x - v.x) || 1; if (Math.random() < dt * 0.08) { v.emote = '♪'; v.emoteT = 1.4; } } continue; } }
    if (v.estado === 'ceia') v.estado = 'parado';
    if (v.estado === 'orando' || v.estado === 'dentro') { v.estado = 'parado'; v.t = rand(0.5, 2); v.emote = '☀'; v.emoteT = 1.5; }
    // longe de casa (voltando do culto): volta direto
    if (v.estado !== 'indo' && Math.abs(v.x - o.x) > raio * 2 + 40 && ag !== 'casa') { v.alvo = o.x + rand(-raio, raio) * 0.5; v.estado = 'indo'; }
    // à noite, quem tem casa vai para a porta e cochila ali; de manhã, sai
    if (ag === 'casa' && casa) { if (v.estado !== 'casa') { v.alvo = casa.x; v.estado = 'indo'; } if (Math.abs(v.x - casa.x) < 6 && v.estado !== 'casa') { v.estado = 'casa'; v.emote = '…'; v.emoteT = 2.5; } else if (v.estado === 'indo') { const d = casa.x - v.x; v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (longe ? 600 : 40) * dt); continue; } } /* fica à porta: quem tem pedido ou história nunca some da rua */
    else if (v.estado === 'casa') { v.estado = 'parado'; v.emote = '☀'; v.emoteT = 2; }
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
    if (v.estado === 'indo') { const d = v.alvo - v.x; if (Math.abs(d) < 4) { v.estado = 'parado'; v.t = rand(2.5, 6); if (Math.random() < 0.25) { v.emote = ['♪', '…', '☀'][Math.floor(rand(0, 3))]; v.emoteT = 1.6; } } else { v.face = Math.sign(d); v.x += v.face * Math.min(Math.abs(d), (longe && Math.abs(d) > 200 ? 600 : periodo(G) === 'manha' ? 46 : 36) * dt); } }
  }
}

/* ---------------- conversar, dar presente, pedido ---------------- */
export async function falarMorador(G, ob) {
  if (G.def?.sitio) return falarConjugeSitio(G, ob);
  if ((G.area === 'refugio' || G.area === 'sinagoga') && await falarSinagoga(G, ob)) return true;
  const id = ob.id, g = GENTE[id], V = VILA[id]; if (!g || G.area !== 'refugio') return false;
  const a = laco(G, id), d = dia(G), n = G.cm.falas[id] = (G.cm.falas[id] || 0) + 1, nome = (V?.nome || ob.nome) + '  ' + marcaCoracoes(coracoes(G, id));
  if (ob.vv) { ob.vv.estado = 'acena'; ob.vv.t = 3; ob.vv.face = Math.sign(G.p.x - ob.vv.x) || 1; }
  const conv = V?.conversa || g.cumprimenta, volta = V?.volta || 0, k = n <= conv.length ? n - 1 : volta + ((n - 1 - volta) % Math.max(1, conv.length - volta));
  const texto = (ob.vv?.estado === 'casa' && falaDaNoite(G, id)) || conv[Math.max(0, Math.min(conv.length - 1, k))]; /* à porta, de noite, a conversa é outra */
  const presente = g.presentes.find(pr => coracoes(G, id) >= ({ 2: 5, 4: 9, 5: 10 })[pr.nivel] && !a.presentes.includes(pr.nivel));
  const b = bolsa(G), P = g.pedido, acoes = [];
  if (Object.keys(ITENS).some(k => b[k] > 0) && a.deu !== d) acoes.push({ label: 'Dar um presente', fn: () => darPresente(G, ob) });
  if (a.pedido === 0 && coracoes(G, id) >= 2) acoes.push({ label: 'Precisa de alguma coisa?', fn: () => pedir(G, ob) });
  if (a.pedido === 1) acoes.push({ label: (b[P.item] || 0) >= P.n ? 'Trouxe o que você pediu' : 'Sobre o pedido…', fn: () => pedir(G, ob) });
  acoes.push(...acoesDoCoracao(G, ob)); acoes.push(...acoesEliabe(G, ob));
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
    const oleo = AZEITES[k], tipo = oleo ? 'ama' : k === g.ama ? 'ama' : g.gosta.includes(k) ? 'gosta' : k === g.naoGosta ? 'naoGosta' : 'neutro';
    somar(G, id, (oleo ? (oleo.efeito === 'presente' ? 3 : 2) : { ama: 2, gosta: 1, naoGosta: -1, neutro: 0 }[tipo]) + (G.aroma?.alegria > 0 && tipo !== 'naoGosta' ? 1 : 0)); sfx(tipo === 'naoGosta' ? 'wrong' : 'right');
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
