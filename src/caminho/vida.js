// A vida no Refúgio: calendário das festas, a mesa da festa (três dias seguidos de visita contam uma pequena história),
// as amizades com os moradores e o Livro do Refúgio, que reúne tudo isso e deixa rever as páginas vivas já abertas.
// Nada daqui é exigido para a campanha nem para as páginas da semana. Fica em cm.vida.
import { sfx } from '../audio.js';
import { FESTAS, AMIGOS, AMIGO_QUALQUER } from '../content/vida.js';
import { CAPITULOS } from '../content/historia.js';
import { T, CW } from './nivel.js';

const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
export const festaDeHoje = (d = new Date()) => FESTAS.find(f => f.meses.includes(d.getMonth() + 1)) || FESTAS[0];
const vida = G => (G.cm.vida = G.cm.vida || { amigos: {}, dia: {}, festa: null });
const premio = (G, pr) => { if (pr.gold) G.char.data.gold += pr.gold; if (pr.mana) G.cm.mana = (G.cm.mana || 0) + pr.mana; return (pr.gold ? '+' + pr.gold + ' denários' : '') + (pr.mana ? ' +1 maná' : ''); };
const coracoes = n => '♥'.repeat(Math.min(10, n)) + '♡'.repeat(Math.max(0, 10 - n));

// enfeites da festa, a mesa e o Livro, postos no Refúgio a cada entrada
export function vidaNoRefugio(G) {
  if (G.area !== 'refugio') return;
  const f = festaDeHoje(), em = (sala, col, o) => G.objs.push({ daVida: true, x: (sala * CW + col) * T + 16, y: 16 * T, ...o });
  G.objs = G.objs.filter(o => !o.daVida);
  // a Praça do poço é a chegada: fica só com o essencial. O Livro mora no Mercado e a mesa da festa, no Bairro
  em(1, 11, { tipo: 'livroRefugio', luz: 90 }); em(3, 23, { tipo: 'festa', festa: f.id, luz: 110 });
  for (const [sala, col] of [[1, 19], [2, 16], [3, 9], [5, 13], [6, 13]]) em(sala, col, { tipo: 'enfeite', qual: f.enfeite });
  const v = vida(G); if (v.avisoFesta !== f.id) { v.avisoFesta = f.id; setTimeout(() => { if (G.running && G.area === 'refugio') G.ui.toast('No Refúgio é tempo de: ' + f.nome + '. Há uma mesa posta no Bairro.', 7000); }, 5000); }
}

// a mesa da festa: uma visita por dia; três dias contam a história da festa e o terceiro traz um presente melhor
async function mesa(G) {
  const f = festaDeHoje(), v = vida(G), d = hoje(); if (!v.festa || v.festa.id !== f.id) v.festa = { id: f.id, dias: 0, ult: null };
  if (v.festa.ult === d) return G.ui.dialog({ nome: f.nome, texto: 'Você já se sentou à mesa hoje. A festa continua amanhã.\n\n' + f.sobre + '\n\n(' + f.ref + ')', acoes: [{ label: 'Voltar' }], cls: 'fala-narra', voz: false });
  const n = Math.min(2, v.festa.dias); v.festa.dias++; v.festa.ult = d;
  const pr = n === 2 ? { gold: 60, mana: 1 } : { gold: 25 }, ganho = premio(G, pr); G.p.oleo = G.oleoMax(); G.p.vida = G.p.vidaMax; sfx('level'); G.efeito('coleta', G.p.x, G.p.y - 30); G.salvar();
  await G.ui.dialog({ nome: f.nome + ' · dia ' + Math.min(3, v.festa.dias) + ' de 3', texto: f.dias[n] + '\n\n' + f.sobre + ' (' + f.ref + ')\n\nFôlegos e jarro refeitos. ' + ganho + '.', acoes: [{ label: 'Amém' }], cls: 'fala-narra', voz: false });
}

async function livro(G) {
  const v = vida(G), f = festaDeHoje(), h = G.cm.hist || { cap: 0 }, feitos = CAPITULOS.filter((c, i) => i < h.cap);
  const calendario = () => { const m = new Date().getMonth() + 1, prox = FESTAS.find(x => x.meses[0] > m) || FESTAS[0]; return G.ui.dialog({ nome: 'O calendário do Refúgio', texto: 'AGORA: ' + f.nome + ' (' + f.ref + ')\n' + f.sobre + '\n\nÀ mesa da festa: ' + (v.festa?.id === f.id ? Math.min(3, v.festa.dias) : 0) + ' de 3 dias.\n\nDEPOIS: ' + prox.nome + '.\n\nO ano do Refúgio: ' + FESTAS.map(x => x.nome).join(' · ') + '.', acoes: [{ label: 'Fechar' }], cls: 'fala-narra', voz: false }); };
  const amizades = () => { const linhas = Object.entries(v.amigos).sort((a, b) => b[1] - a[1]).map(([id, n]) => coracoes(n) + '  ' + (AMIGOS[id]?.nome || G.objs.find(o => o.id === id)?.nome || id)); return G.ui.dialog({ nome: 'Gente do Refúgio', texto: linhas.length ? linhas.join('\n') + '\n\nUm coração por dia de conversa. Aos três e aos sete, cada um tem algo a contar.' : 'Você ainda não parou para conversar com ninguém. Um coração por dia de conversa; aos três e aos sete, cada morador tem algo a contar.', acoes: [{ label: 'Fechar' }], cls: 'fala-narra', voz: false }); };
  const paginas = () => G.ui.dialog({ nome: 'Páginas vivas', texto: feitos.length ? 'As páginas que você já abriu. Dá para voltar a qualquer uma e enfrentar de novo a sombra que a cobria.' : 'Nenhuma página aberta ainda. Quem tem um ! sobre a cabeça tem uma história para lhe pedir.', voz: false, cls: 'fala-narra',
    acoes: [...feitos.map(c => ({ label: c.n + '. ' + c.titulo + ' (' + c.ref + ')', fn: () => G.entrar('hist:' + c.id) })), { label: 'Fechar' }] });
  await G.ui.dialog({ nome: 'O Livro do Refúgio', texto: 'Um livro grande, aberto sobre uma estante de pedra. Os moradores escrevem nele o que acontece na aldeia.', voz: false,
    acoes: [{ label: 'Páginas vivas', fn: paginas }, { label: 'Calendário', fn: calendario }, { label: 'Gente do Refúgio', fn: amizades }, { label: 'Fechar' }] });
}

export function rotuloVida(ob) { return ob.tipo === 'livroRefugio' ? 'Abrir o Livro do Refúgio' : ob.tipo === 'festa' ? 'Sentar-se à mesa da festa' : undefined; }
export async function usarVida(G, ob) { if (ob.tipo === 'livroRefugio') { await livro(G); return true; } if (ob.tipo === 'festa') { await mesa(G); return true; } return false; }

// conversar com um morador: o primeiro papo do dia vale um coração; nos marcos, ele conta algo e a conversa é só isso
export async function amizade(G, ob) {
  if (G.area !== 'refugio' || !ob.id || (ob.tipo !== 'npc' && ob.tipo !== 'morador') || ob.bicho || ob.daHistoria || ob.id === 'mensageiro') return false;
  const v = vida(G), d = hoje(); if (v.dia[ob.id] === d) return false;
  v.dia[ob.id] = d; const n = v.amigos[ob.id] = Math.min(10, (v.amigos[ob.id] || 0) + 1); G.salvar();
  const marco = n === 3 ? 0 : n === 7 ? 1 : -1;
  if (marco < 0) { G.textoEm(ob.x, ob.y - 84, '♥ ' + n, '#FF8FB8', 12); return false; }
  const [texto, pr] = (AMIGOS[ob.id]?.eventos || AMIGO_QUALQUER)[marco];
  sfx('level'); G.efeito('coleta', ob.x, ob.y - 40);
  await G.ui.dialog({ nome: ob.nome + '  ' + coracoes(n), look: ob.look, texto, acoes: [{ label: 'Obrigado' }] });
  G.ui.toast('Amizade com ' + (AMIGOS[ob.id]?.nome || ob.nome) + ': ' + n + ' de 10. ' + premio(G, pr) + '.', 5000); G.salvar();
  return true;
}
