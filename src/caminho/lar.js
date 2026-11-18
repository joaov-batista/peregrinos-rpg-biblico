// A vida em casa e à mesa: a ceia dos irmãos (toda noite, na casa de Marta e Maria, para quem já criou laço),
// a sua casa na Rua das casas, e o casamento (dez corações, um anel forjado por Tubalcaim, a festa na sinagoga).
// Só os moradores da Rua das casas e do Portão das vinhas são casáveis (personagens fictícios, para não mexer na história bíblica).
import { sfx } from '../audio.js';
import { GENTE, ITENS, CASAMENTO, CEIA } from '../content/gente.js';
import { coracoesDe, somarCoracoes } from './vida.js';
import { hora, dia, ganhar } from './moradores.js';
import { noiteN } from './sinagoga.js';
import { MORADORES } from './dados.js';

export const ANEL_PRECO = 500, LACO_CEIA = 4;
const pick = a => a[Math.floor(Math.random() * a.length)];
export const horaDaCeia = G => { const h = hora(G); return h >= 21.1 && h < 22.6; };
export const sexoDe = G => G.char.look?.sexo === 'f' ? 'f' : 'm';
export const podeCasar = (G, id) => GENTE[id]?.casavel && GENTE[id].casavel !== sexoDe(G) && !G.cm.conjuge;
// quem vai à ceia: os moradores com laço (e o cônjuge, sempre)
export const vaiACeia = (G, id) => id === G.cm.conjuge || coracoesDe(G, id) >= LACO_CEIA;

/* ---------------- a ceia ---------------- */
export async function ceia(G, ob) {
  const cm = G.cm, nome = 'Casa de Marta e Maria';
  if (!horaDaCeia(G)) return G.ui.dialog({ nome, texto: 'Marta abre a porta, com um pano no ombro.\n\n"' + CEIA.hora + ' Volte nessa hora: aqui a mesa é dos irmãos."', acoes: [{ label: 'Volto depois' }] });
  const irmaos = Object.keys(GENTE).filter(id => vaiACeia(G, id));
  if (irmaos.length < 2) return G.ui.dialog({ nome, texto: CEIA.falta, acoes: [{ label: 'Entendi' }] });
  if (cm.ceiou === noiteN(G)) return G.ui.dialog({ nome, texto: 'A ceia de hoje já acabou. A louça está secando. Volte amanhã à noite.', acoes: [{ label: 'Boa noite' }] });
  cm.ceiou = noiteN(G);
  const nomes = id => G.objs.find(o => o.id === id)?.nome?.split(',')[0] || id;
  const falas = irmaos.slice(0, 5).map(id => nomes(id) + ': "' + (CEIA.falas[id] || 'Que bom que você veio.') + '"').join('\n\n');
  await G.ui.dialog({ nome: 'A ceia dos irmãos', texto: CEIA.abre, acoes: [{ label: 'Sentar-se' }], cls: 'fala-narra', voz: false });
  await G.ui.dialog({ nome: 'À mesa', texto: falas, acoes: [{ label: 'Partir o pão' }], voz: false });
  const p = G.p; p.vida = p.vidaMax; p.oleo = G.oleoMax(); for (const id of irmaos) somarCoracoes(G, id, 1); sfx('heal'); G.salvar();
  await G.ui.dialog({ nome: 'A ceia dos irmãos', texto: CEIA.fecha + '\n\nFôlegos e azeite refeitos. ♥ +1 com ' + irmaos.map(nomes).join(', ') + '.', acoes: [{ label: 'Amém' }], cls: 'fala-narra', voz: false });
}

/* ---------------- a casa por dentro ---------------- */
// o cônjuge fica em casa (perto da lareira, ou à mesa na hora da ceia)
export function casaAoEntrar(G) {
  const cj = G.cm.conjuge, M = cj && MORADORES.find(m => m.id === cj); G.objs = G.objs.filter(o => !o.daCasa);
  if (M) { const mesa = G.objs.find(o => o.tipo === 'mesaCasa'), lar = G.objs.find(o => o.tipo === 'lareira'), x = (horaDaCeia(G) ? mesa : lar)?.x + 40 || G.p.x + 100;
    G.objs.push({ tipo: 'npc', daCasa: true, conjuge: true, id: 'conj_' + cj, nome: M.nome.split(',')[0], look: M.look, x, y: 16 * 32 }); }
}
export function rotuloCasa(G, ob) {
  if (ob.tipo === 'cama') return 'Deitar na esteira';
  if (ob.tipo === 'mesaCasa') return G.cm.conjuge && horaDaCeia(G) && G.cm.ceiaCasa !== noiteN(G) ? 'Ceiar em casa' : 'A mesa';
  if (ob.tipo === 'lareira') return 'Esquentar-se à lareira';
  if (ob.tipo === 'janelaCasa') return null;
  return undefined;
}
export async function usarCasa(G, ob) {
  const p = G.p, cm = G.cm;
  if (ob.tipo === 'cama') { const h = hora(G), noite = h >= 19 || h < 5.5;
    const r = await G.ui.dialog({ nome: 'A esteira', texto: noite ? 'Já é noite. A casa está quieta; lá fora, só os grilos.' : 'Uma esteira de palha, um cobertor de lã de ovelha. Dá para cochilar um pouco.', voz: false, acoes: [...(noite ? [{ label: 'Dormir até de manhã' }] : []), { label: 'Cochilar' }, { label: 'Levantar' }] });
    if (r === 'Dormir até de manhã') { cm.relogio = (Math.floor((cm.relogio || 0) / 600) + 1) * 600; /* o dia começa às 7 */ G.fade = 1; p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal');
      await G.ui.dialog({ nome: 'De manhã', texto: 'Você acorda com o galo e a luz entrando pela janela. "As misericórdias do Senhor… renovam-se cada manhã" (Lm 3:22-23).\n\nFôlegos e lâmpada cheios.', acoes: [{ label: 'Levantar' }], cls: 'fala-narra', voz: false }); }
    else if (r === 'Cochilar') { p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); G.efeito('cura', p.x, p.y, 1, { gruda: p }); G.textoEm(p.x, p.y - 80, 'Descansou em casa', '#FFE9A8', 12); }
    G.salvar(); return true; }
  if (ob.tipo === 'mesaCasa') { const c = cm.conjuge, cj = c && G.objs.find(o => o.conjuge), nomeC = cj?.nome;
    if (c && horaDaCeia(G) && cm.ceiaCasa !== noiteN(G)) { cm.ceiaCasa = noiteN(G); somarCoracoes(G, c, 1); p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); G.salvar();
      await G.ui.dialog({ nome: 'Ceia em casa', look: cj?.look, texto: 'Pão, azeite e o que sobrou do dia. ' + nomeC + ' dá graças em voz baixa e conta como foi o dia.\n\n"' + pick(CASAMENTO.bomDia) + '"\n\nFôlegos e azeite refeitos.', acoes: [{ label: 'Amém' }] }); }
    else await G.ui.dialog({ nome: 'A mesa', texto: 'Uma mesa baixa de madeira, um cântaro, o pão coberto com um pano.' + (c ? '' : ' Um dia, quem sabe, alguém para partir o pão com você.') + (horaDaCeia(G) ? '' : '\n\n(A ceia é à noite.)'), acoes: [{ label: 'Ok' }], voz: false });
    return true; }
  if (ob.tipo === 'lareira') { p.vida = Math.min(p.vidaMax, p.vida + 1); sfx('heal'); G.textoEm(p.x, p.y - 80, 'o fogo esquenta as mãos', '#FFC870', 12); return true; }
  return false;
}

/* ---------------- a sua casa ---------------- */
export async function suaCasa(G, ob) {
  const cm = G.cm, c = cm.conjuge, cj = c && G.objs.find(o => o.id === c), nomeC = cj?.nome?.split(',')[0];
  const acoes = [{ label: 'Descansar', fn: () => { const p = G.p; p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); G.efeito('cura', p.x, p.y, 1, { gruda: p }); G.textoEm(p.x, p.y - 80, 'Descansou em casa', '#FFE9A8', 12); } }];
  if (c && horaDaCeia(G) && cm.ceiaCasa !== noiteN(G)) acoes.unshift({ label: 'Ceiar com ' + nomeC, fn: async () => { cm.ceiaCasa = noiteN(G); somarCoracoes(G, c, 1); const p = G.p; p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); G.salvar();
    await G.ui.dialog({ nome: 'Ceia em casa', look: cj?.look, texto: 'Pão, azeite e o que sobrou do dia. ' + nomeC + ' dá graças em voz baixa e conta como foi o dia.\n\n"' + pick(CASAMENTO.bomDia) + '"\n\nFôlegos e azeite refeitos.', acoes: [{ label: 'Amém' }] }); } });
  acoes.push({ label: 'Sair' });
  await G.ui.dialog({ nome: 'Sua casa', texto: c ? 'A casa tem cheiro de pão e lã. ' + nomeC + ' mora aqui com você.' : 'Uma casa pequena, de pedra, com uma esteira e uma lamparina. É sua: o Refúgio guardou um lugar para você.', acoes, voz: false });
}

/* ---------------- namoro, pedido e casamento ---------------- */
// ações extras na conversa com um morador casável (ou com o cônjuge)
export function acoesDoCoracao(G, ob) {
  const cm = G.cm, id = ob.id, acoes = [];
  if (cm.conjuge === id && cm.conjugeDia !== dia(G)) acoes.push({ label: 'Bom dia, meu amor', fn: () => presenteDoCasal(G, ob) });
  if (podeCasar(G, id) && coracoesDe(G, id) >= 8) acoes.push({ label: 'Falar do coração…', fn: () => pedir(G, ob) });
  return acoes;
}
async function presenteDoCasal(G, ob) {
  const cm = G.cm; cm.conjugeDia = dia(G); const it = pick(Object.keys(ITENS)); ganhar(G, it, 1); somarCoracoes(G, ob.id, 0); sfx('right'); G.salvar();
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: '"' + pick(CASAMENTO.bomDia) + '"\n\n"' + CASAMENTO.presenteDia + '"\n\n+1 ' + ITENS[it].nome.toLowerCase(), acoes: [{ label: 'Obrigado, meu bem' }] });
}
async function pedir(G, ob) {
  const cm = G.cm, nome = ob.nome.split(',')[0];
  if (coracoesDe(G, ob.id) < 10 || !cm.anel) return G.ui.dialog({ nome: ob.nome, look: ob.look, texto: CASAMENTO.falta(nome) + (cm.anel ? '' : '\n\n(Tubalcaim, o ferreiro, forja anéis.)'), acoes: [{ label: 'Um dia' }] });
  await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'Você mostra o anel. ' + nome + ' fica um tempo sem dizer nada.\n\n"' + CASAMENTO.pedido[ob.id] + '"', acoes: [{ label: 'Ir à sinagoga' }] });
  cm.anel = 0; cm.conjuge = ob.id; cm.casouDia = dia(G); sfx('level'); G.salvar();
  for (const t of CASAMENTO.festa) await G.ui.dialog({ nome: 'O casamento', texto: t, acoes: [{ label: 'Continuar' }], cls: 'fala-narra', voz: false });
  G.ui.toast(nome + ' agora mora com você na Rua das casas.', 6000);
}

// a forja de Tubalcaim também faz anéis
export function anelNaForja(G, h, redesenha) {
  const cm = G.cm, c = G.char; if (cm.conjuge) return null;
  return h('button', { class: 'fase-row cm-rel' + (cm.anel ? ' on' : ''), disabled: !!cm.anel || c.data.gold < ANEL_PRECO, onclick: () => { c.data.gold -= ANEL_PRECO; cm.anel = 1; sfx('level'); G.salvar(); redesenha(); } },
    h('span', { class: 'cm-ico' }, cm.anel ? '✓' : '◯'), h('div', {}, h('b', {}, 'Anel de compromisso' + (cm.anel ? ' (com você)' : ' — ' + ANEL_PRECO + ' denários')), h('small', {}, 'Ouro batido à mão. Para pedir alguém em casamento: só vale com dez corações.')));
}
