// Os convites: quem tem laço com você (3 corações ou mais) às vezes te chama, do nada, para fazer algo junto:
// uma ceia, pescar no porto, colher figos, orar na sinagoga, ir ao mercado, uma fogueira com histórias.
// Quem chama fica com um ✉ em cima da cabeça; é só ir falar. Aceitar passa umas horas do dia e sempre rende algo.
import { sfx } from '../audio.js';
import { GENTE, ITENS } from '../content/gente.js';
import { VILA } from '../content/vila.js';
import { AZEITES } from '../content/azeites.js';
import { coracoesDe, somarCoracoes } from './vida.js';
import { DIA, dia, hora, ganhar } from './moradores.js';
import { agendaDe } from './sinagoga.js';

const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
export const LACO_CONVITE = 3;
const nomeDe = ob => (VILA[ob.id]?.nome || ob.nome || '').split(',')[0];
const nomeItem = (k, n) => n > 1 ? ITENS[k].plural : ITENS[k].nome.toLowerCase();

// cada convite: quando pode (hora), o chamado, a cena e o que rende
export const CONVITES = {
  ceia: { pode: h => h >= 17 && h < 21, chama: n => 'Ei! Hoje tem ceia lá em casa. Coisa simples, pão e lentilha. Vem?',
    cena: n => ['A casa de ' + n + ' é pequena e cheira a pão quente. A mesa é baixa; todo mundo se senta no chão, em esteiras.', n + ' parte o pão, dá graças e passa a primeira metade para você. "Na minha casa, o convidado come primeiro."', 'Conversa vai, conversa vem, a lamparina baixa. Ninguém tem pressa de levantar.'],
    rende: G => { const p = G.p; p.vida = p.vidaMax; p.oleo = G.oleoMax(); return [['pao', 2]]; }, extra: 'Fôlegos e lâmpada refeitos.' },
  pescar: { pode: h => h >= 5.5 && h < 18, chama: n => 'Vamos pescar? Zebedeu disse que hoje a água tá boa. Eu levo as iscas!',
    cena: n => ['Vocês descem até a margem. ' + n + ' amarra a isca rindo do seu nó: "Assim o peixe foge de vergonha."', 'Por um tempo, só o barulho da água e das gaivotas. Às vezes a linha mexe; às vezes é só o vento.', 'No fim da tarde, o cesto pesa. ' + n + ' divide meio a meio, e ainda te dá o maior.'],
    rende: G => [['peixe', 2 + Math.floor(rand(0, 3))], ...(Math.random() < 0.5 ? [['oleo_mar', 1]] : [])] },
  colher: { pode: h => h >= 6 && h < 17, chama: n => 'Me dá uma mão? As figueiras carregaram e sozinho(a) não dou conta.',
    cena: n => ['Vocês sobem nas figueiras, cada um num galho. ' + n + ' canta um salmo errado de propósito para te fazer rir.', 'O cesto enche. Um figo cai na sua cabeça; ' + n + ' jura que não foi ele(a).', '"Pela árvore se conhece o fruto" (Mt 12:33). Este aqui é dos bons.'],
    rende: G => { G.char.data.gold += 40; return [['figo', 3 + Math.floor(rand(0, 3))], ...(Math.random() < 0.35 ? [['oleo_canela', 1]] : [])]; }, extra: '+40 denários pelo trabalho.' },
  orar: { pode: h => h >= 5.5 && h < 21, chama: n => 'Ando com o coração pesado. Ora comigo na sinagoga? Dois são melhores que um (Ec 4:9).',
    cena: n => ['A sinagoga está quase vazia. Vocês se ajoelham lado a lado, sem pressa.', n + ' ora baixinho, depois em silêncio. Você sente a lâmpada esquentar na mão.', 'Ao sair, ' + n + ' respira fundo. "Obrigado(a). Eu precisava não estar sozinho(a) hoje."'],
    rende: G => { const p = G.p; p.oleo = G.oleoMax(); G.xp?.(40); return Math.random() < 0.5 ? [['oleo_balsamo', 1]] : [['oleo_hissopo', 1]]; }, extra: 'A lâmpada se enche. +40 de experiência.' },
  mercado: { pode: h => h >= 7 && h < 18, chama: n => 'Vou ao mercado, vem comigo? Quero te mostrar uma coisa na banca da Lídia.',
    cena: n => ['O mercado está cheio: gritos de preço, cabras, poeira dourada. ' + n + ' puxa você pela manga até a banca da púrpura.', 'Entre os rolos de pano, frascos de todas as cores. ' + n + ' cheira um por um, franzindo o nariz, até achar o certo.', '"Esse é para você. Não discuta." E paga antes que você consiga.'],
    rende: G => [[pick(Object.keys(AZEITES).filter(k => k !== 'oleo_nardo')), 1], ...(Math.random() < 0.25 ? [['oleo_nardo', 1]] : [])] },
  fogueira: { pode: h => h >= 19 || h < 1, chama: n => 'Hoje à noite vai ter fogueira na praça, com história dos antigos. Vem? Guardei lugar.',
    cena: n => ['A fogueira estala. Alguém conta de Davi e o gigante; alguém discorda dos detalhes; todo mundo ri.', n + ' te passa um pedaço de favo de mel. "Doce como as palavras d\'Ele" (Sl 119:103).', 'As brasas ficam vermelhas, as estrelas aparecem. Ninguém quer ser o primeiro a ir dormir.'],
    rende: G => { G.xp?.(60); return [['mel', 1], ...(Math.random() < 0.3 ? [['oleo_alegria', 1]] : [])]; }, extra: '+60 de experiência.' }
};

const cv = G => (G.cm.conv = G.cm.conv || { dia: -1, n: 0, prox: 0 });
// a cada quadro, no Refúgio: de vez em quando alguém com laço te chama
export function passoConvites(G, dt) {
  const C = cv(G), p = G.p, hoje = dia(G), rel = G.cm.relogio || 0;
  if (C.dia !== hoje) { C.dia = hoje; C.n = 0; }
  const pend = G.cm.convite;
  if (pend && (rel > pend.ate || pend.dia !== hoje && rel > pend.ate)) { G.cm.convite = null; }
  if (G.cm.convite) { const o = G.objs.find(q => q.id === G.cm.convite.id && q.tipo === 'morador'); if (o?.vv) { o.vv.emote = '✉'; o.vv.emoteT = Math.max(o.vv.emoteT || 0, 0.3); } return; }
  if (G.ui.blocking || p.morto || G.luta || G.levi || (G.cm.visto?.tut != null && G.cm.visto.tut < 11)) return;
  if (!C.prox) C.prox = rel + rand(60, 120);
  if (rel < C.prox || C.n >= 2) return; C.prox = rel + rand(90, 170);
  const h = hora(G), tipos = Object.keys(CONVITES).filter(k => CONVITES[k].pode(h)); if (!tipos.length) return;
  const amigos = G.objs.filter(o => o.tipo === 'morador' && GENTE[o.id] && coracoesDe(G, o.id) >= LACO_CONVITE && !['culto', 'vigilia', 'casa'].includes(agendaDe(G, o)));
  if (!amigos.length || Math.random() < 0.3) return;
  const ob = pick(amigos), tipo = pick(tipos);
  G.cm.convite = { id: ob.id, tipo, dia: hoje, ate: rel + DIA / 4 }; C.n++;
  sfx('sinoLonge'); const n = nomeDe(ob);
  G.ui.toast('✉ ' + n + ' está te chamando: "' + CONVITES[tipo].chama(n) + '"\n(Vá falar com ' + n + ' antes que passe a hora.)', 7000);
  if (ob.vv && Math.abs(ob.vv.x - p.x) < 700) G.fala({ x: ob.vv.x, y: ob.y, h: 56 }, 'Ei, peregrino!');
}
// falar com quem chamou
export async function falarConvite(G, ob) {
  const pend = G.cm.convite; if (!pend || pend.id !== ob.id) return false;
  const C = CONVITES[pend.tipo], n = nomeDe(ob);
  const aceitou = (await G.ui.dialog({ nome: ob.nome + ' ✉', look: ob.look, texto: '"' + C.chama(n) + '"', acoes: [{ label: 'Aceitar o convite' }, { label: 'Hoje não dá' }] })) === 'Aceitar o convite';
  G.cm.convite = null;
  if (!aceitou) { G.textoEm(ob.vv?.x ?? ob.x, ob.y - 70, 'fica pra próxima', '#C9D2E0', 11); G.salvar(); return true; }
  for (const t of C.cena(n)) await G.ui.dialog({ nome: { ceia: 'Ceia', pescar: 'Pescaria', colher: 'Colheita', orar: 'Oração', mercado: 'No mercado', fogueira: 'Fogueira' }[pend.tipo] + ' com ' + n, texto: t, acoes: [{ label: 'Continuar' }], cls: 'fala-narra', voz: false });
  G.cm.relogio = (G.cm.relogio || 0) + DIA / 12; // umas duas horas juntos
  const itens = C.rende(G); for (const [k, q] of itens) ganhar(G, k, q);
  somarCoracoes(G, ob.id, 1 + (coracoesDe(G, ob.id) < 10 && Math.random() < 0.4 ? 1 : 0)); sfx('level');
  G.efeito?.('coleta', G.p.x, G.p.y - 30); G.salvar();
  await G.ui.dialog({ nome: n + ' agradece', look: ob.look, texto: '"Foi bom demais. Obrigado(a) por vir."\n\n♥ laço mais forte com ' + n + '\n' + itens.map(([k, q]) => '+' + q + ' ' + nomeItem(k, q)).join('\n') + (C.extra ? '\n' + C.extra : ''), acoes: [{ label: 'Até a próxima' }] });
  return true;
}
