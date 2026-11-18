// O que Sardes ganhou: Pedro dá a missão (levar a Palavra é pescar gente), a sinagoga de Sardes com a menorá a reacender,
// e o mercado novo, aberto depois que a cidade acende, com uma banca para cada um que recebeu a Palavra.
import { sfx } from '../audio.js';
import { PEDRO_SARDES, SINAGOGA_SARDES, MERCADO_NOVO, SARDES_POVO } from '../content/sardes.js';
import { ITENS } from '../content/gente.js';
import { PRECO } from '../content/sitio.js';
import { RELIQUIAS } from './dados.js';
import { rarDe } from './arsenal.js';
import { dia, ganhar, bolsa } from './moradores.js';
import { ORACOES } from '../content/sinagoga.js';
import { T } from './nivel.js';

const sar = G => (G.cm.sar = G.cm.sar || { velas: {}, palavra: {}, abates: 0 });
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------------- Pedro ---------------- */
export async function falarPedro(G, ob) {
  if (ob.id !== 'pedro' || G.area !== 'refugio') return false;
  const cm = G.cm, d = (t, acoes) => G.ui.dialog({ nome: ob.nome, look: ob.look, texto: t, acoes });
  if (!cm.sardesMissao && !cm.sar?.feita) {
    for (let i = 0; i < PEDRO_SARDES.chamado.length - 1; i++) await d(PEDRO_SARDES.chamado[i], [{ label: 'Continuar' }]);
    await d(PEDRO_SARDES.chamado[2], [{ label: 'Eu vou', fn: () => { cm.sardesMissao = 1; G.salvar(); setTimeout(() => G.ui.dialog({ nome: ob.nome, look: ob.look, texto: PEDRO_SARDES.aceita, acoes: [{ label: 'Amém' }] }), 60); } }, { label: 'Ainda não' }]);
    return true;
  }
  if (cm.sar?.feita && !cm.pedroDepois) { cm.pedroDepois = 1; G.salvar(); await d(PEDRO_SARDES.depois, [{ label: 'Quando quiser' }]); return true; }
  return false; // o resto da conversa de Pedro segue como sempre
}
// sem o chamado de Pedro, o barqueiro não leva ninguém a Sardes
export const semChamado = G => !G.cm.sardesMissao && !G.cm.sar;

/* ---------------- ao entrar em Sardes e na sinagoga de lá ---------------- */
export function sardesAoEntrar(G, id) {
  const s = sar(G);
  if (id === 'sardes') G.objs = G.objs.filter(o => o.mercadoNovo ? (s.feita && (o.mercadoNovo === 'ninfa' || s.palavra[o.mercadoNovo])) : !(o.fechado && s.feita));
  if (id === 'sinagoga:sardes') {
    if (s.menora) { const m = G.objs.find(o => o.tipo === 'menora'); if (m) m.acesa = true; }
    if (s.feita) Object.keys(SARDES_POVO).filter(k => s.palavra[k]).forEach((k, i) => G.objs.push({ tipo: 'morador', id: 'sin_' + k, nome: SARDES_POVO[k].nome, look: SARDES_POVO[k].look, x: (5 + i * 3 + (i >= 2 ? 6 : 0)) * T + 16, y: 16 * T, vv: { x: (5 + i * 3 + (i >= 2 ? 6 : 0)) * T + 16, estado: 'orando', face: 1, t: 0 }, sardesOra: k }));
  }
}
// as vozes de quem ora na sinagoga de Sardes
export function passoSinagogaSardes(G, dt) {
  const orando = G.objs.filter(o => o.sardesOra); if (!orando.length) return;
  if ((G.sinSar = (G.sinSar ?? 2) - dt) > 0) return; G.sinSar = 3.4 + Math.random() * 1.5;
  const o = pick(orando), P = SARDES_POVO[o.sardesOra];
  G.textos.push({ x: o.vv.x, y: o.y - 62, txt: pick([P.depois.split('.')[0] + '.', ...ORACOES.qualquer]), cor: '#E8DEC4', tam: 11, t: 3.2 });
}

/* ---------------- falar e usar ---------------- */
export function rotuloSardesNovo(ob) { return ob.tipo === 'menora' ? (ob.acesa ? null : 'Acender a menorá (21 de azeite)') : undefined; }
export async function usarSardesNovo(G, ob) {
  if (ob.tipo !== 'menora') return false;
  const s = sar(G); if (ob.acesa) return true;
  if (G.p.oleo < 21) { await G.ui.dialog({ nome: 'A menorá', texto: SINAGOGA_SARDES.menora + '\n\nVocê tem ' + Math.floor(G.p.oleo) + ' de azeite.', acoes: [{ label: 'Ok' }] }); return true; }
  G.p.oleo -= 21; ob.acesa = true; s.menora = 1; s.velas.menora1 = 1; s.velas.menora2 = 1; sfx('level'); G.clarao = 0.3; G.salvar();
  await G.ui.dialog({ nome: 'A menorá', texto: SINAGOGA_SARDES.acesa, acoes: [{ label: 'Amém' }], cls: 'fala-narra', voz: false }); return true;
}
export async function falarSardesNovo(G, ob) {
  const s = sar(G);
  if (ob.id === 'natanael') { await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: s.feita ? SINAGOGA_SARDES.depois : SINAGOGA_SARDES.antes, acoes: [{ label: 'Continuar' }] }); return true; }
  if (ob.sardesOra) { await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: '(Ora de olhos fechados. Quando abre, sorri.)\n\n"' + SARDES_POVO[ob.sardesOra].depois + '"', acoes: [{ label: 'Ficar em silêncio' }] }); return true; }
  if (!ob.mercadoNovo) return false;
  const id = ob.mercadoNovo, M = MERCADO_NOVO[id], c = G.char, b = bolsa(G), nome = SARDES_POVO[id].nome + ' · ' + M.banca;
  const reabre = () => setTimeout(() => falarSardesNovo(G, ob), 60);
  if (id === 'ninfa') { G.p.vida = G.p.vidaMax; sfx('heal'); await G.ui.dialog({ nome, look: ob.look, texto: M.fala + '\n\n♪ "Levanta-te, resplandece, porque vem a tua luz" (Is 60:1) ♪\n\nFôlegos refeitos.', acoes: [{ label: 'Obrigado, Ninfa' }] }); return true; }
  if (M.itens) { await G.ui.dialog({ nome, look: ob.look, texto: M.fala + '\n\nDenários: ' + Math.floor(c.data.gold), acoes: [...Object.entries(M.itens).map(([k, p]) => ({ label: ITENS[k].nome + ' — ' + p, fn: () => { if (c.data.gold < p) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= p; ganhar(G, k, 1, G.p.x, G.p.y - 80); sfx('coin'); G.salvar(); reabre(); } })), { label: 'Só olhando' }] }); return true; }
  if (id === 'onesimo') { const tem = Object.keys(b).filter(k => b[k] > 0 && PRECO[k]);
    await G.ui.dialog({ nome, look: ob.look, texto: M.fala + (tem.length ? '' : '\n\n(Você não tem nada do campo agora.)'), acoes: [...tem.map(k => { const v = Math.ceil(PRECO[k] * 1.3) * b[k]; return { label: 'Vender ' + b[k] + ' ' + ITENS[k].nome.toLowerCase() + ' — ' + v, fn: () => { c.data.gold += v; b[k] = 0; sfx('coin'); G.salvar(); reabre(); } }; }), { label: 'Até mais' }] }); return true; }
  if (id === 'tiquico') { const hoje = dia(G), ids = Object.keys(RELIQUIAS).filter(k => !G.cm.reliquias.includes(k) && ['comum', 'rara'].includes(RELIQUIAS[k].rar)), r = ids.length ? ids[hoje % ids.length] : null, preco = r ? (RELIQUIAS[r].rar === 'rara' ? 600 : 350) : 0, ja = s.tiquicoDia === hoje;
    await G.ui.dialog({ nome, look: ob.look, texto: M.fala + (r && !ja ? '\n\nHoje: ' + rarDe(RELIQUIAS[r]).marca + ' ' + RELIQUIAS[r].nome + ' — ' + RELIQUIAS[r].desc : '\n\nHoje não sobrou nada. Volte amanhã.'),
      acoes: [...(r && !ja ? [{ label: 'Levar por ' + preco, fn: async () => { if (c.data.gold < preco) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= preco; s.tiquicoDia = hoje; sfx('coin'); G.salvar(); await G.ganhar(r); } }] : []), { label: 'Até mais' }] }); return true; }
  return false;
}
