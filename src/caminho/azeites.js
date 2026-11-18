// Usar os azeites e óleos perfumados (a bolsa), os efeitos que duram um tempo, e a mesa de essências do sítio.
import { sfx } from '../audio.js';
import { AZEITES } from '../content/azeites.js';
import { ITENS } from '../content/gente.js';
import { bolsa, ganhar } from './moradores.js';
import { somarCoracoes } from './vida.js';
import { st } from './sitio.js';
import { PLANTAS } from '../content/sitio.js';

const nomeItem = (k, n) => n > 1 ? ITENS[k].plural : ITENS[k].nome.toLowerCase();
export const ehAzeite = k => !!AZEITES[k];
// os efeitos que duram (em segundos de jogo): ficam em G.aroma = { dano, veloz, espanta, alegria }
const aroma = G => (G.aroma = G.aroma || {});
export const danoDobrado = G => (G.aroma?.dano || 0) > 0;
export const velDobrada = G => (G.aroma?.veloz || 0) > 0;
export const alegre = G => (G.aroma?.alegria || 0) > 0;

// usar da bolsa; devolve o texto do que aconteceu (ou null se não dá para usar aqui)
export function usarAzeite(G, k) {
  const A = AZEITES[k], b = bolsa(G), p = G.p; if (!A || !(b[k] > 0)) return null;
  const gasta = () => { b[k]--; sfx('heal'); G.fx.anel(p.x, p.y - 26, A.cor, 90); G.fx.sobe(p.x, p.y - 10, 16, A.cor); G.textoEm(p.x, p.y - 86, A.nome, A.cor, 12); G.salvar(); };
  switch (A.efeito) {
    case 'presente': return 'Esse é para dar: converse com alguém e escolha "Dar um presente".';
    case 'espanta': case 'dano': case 'veloz': case 'alegria': { const ef = { espanta: 'espanta', dano: 'dano', veloz: 'veloz', alegria: 'alegria' }[A.efeito]; aroma(G)[ef] = A.dur; gasta(); return A.desc; }
    case 'cura': p.vida = p.vidaMax; p.oleo = G.oleoMax(); G.efeito?.('cura', p.x, p.y, 1, { gruda: p }); gasta(); return 'Fôlegos e lâmpada cheios.';
    case 'pesca': G.cm.iscaMar = (G.cm.iscaMar || 0) + 5; gasta(); return 'As próximas 5 fisgadas: o peixe morde logo e a linha aguenta mais.';
    case 'fazenda': { if (!G.def?.sitio) return 'Use no seu sítio: lá a terra bebe.'; const S = st(G); let n = 0;
      for (const c of S.canteiros) if (c && c.estado === 'plantado' && !c.pronto) { c.cresceu = (c.cresceu || 0) + 1; const P = PLANTAS[c.planta]; if (c.cresceu >= (c.colheu && P.volta ? P.volta : P.dias)) c.pronto = true; n++; }
      for (const a of S.animais) a.feliz = Math.min(10, (a.feliz || 3) + 3);
      for (let i = 0; i < 30; i++) G.parts.push({ x: p.x + (Math.random() - 0.5) * 900, y: p.y - 90 - Math.random() * 60, vx: 0, vy: 90, t: 0.9, max: 0.9, r: 1.5, cor: A.cor, g: 200 });
      gasta(); return 'A lavoura bebeu: ' + n + ' canteiro(s) cresceram um dia, e os bichos ficaram contentes.'; }
  }
  return null;
}
// o nardo e os outros perfumes como presente: vale bem mais do que qualquer coisa da bolsa
export function presenteDeAzeite(G, id, k) { const A = AZEITES[k]; if (!A) return 0; return A.efeito === 'presente' ? 3 : 2; }

// a cada quadro: os tempos dos aromas, os monstros pequenos que fogem do hissopo, o rastro de cor
export function passoAzeites(G, dt) {
  const ar = G.aroma; if (!ar) return; const p = G.p;
  for (const k of Object.keys(ar)) { if (ar[k] > 0) { ar[k] -= dt; if (ar[k] <= 0) { ar[k] = 0; G.textoEm(p.x, p.y - 80, { dano: 'a mirra secou na lâmina', veloz: 'o passo voltou ao normal', espanta: 'o cheiro de hissopo passou', alegria: 'a alegria fica, o óleo acabou' }[k] || '', '#C9D2E0', 10); } } }
  G.danoTemp = ar.dano || 0; G.velTemp = ar.veloz || 0;
  if (ar.espanta > 0) for (const e of G.inimigos) if (e.kind === 'vicio' && e.hp > 0 && !e.elite && e.r <= 17 && !e.parte) { const dx = e.x - p.x; if (Math.abs(dx) < 200 && Math.abs(e.y - p.y) < 160) { e.vx = Math.sign(dx || 1) * 220; e.x += Math.sign(dx || 1) * 120 * dt; e.cd = Math.max(e.cd || 0, 0.6); e.tele = 0; if (e.estado === 'bote' || e.estado === 'ataque') e.estado = 'idle'; if (Math.random() < dt * 2) G.textoEm(e.x, e.y - e.h - 6, '!', '#6FB35A', 11); } }
  const cor = ar.dano > 0 ? AZEITES.oleo_mirra.cor : ar.veloz > 0 ? AZEITES.oleo_canela.cor : ar.espanta > 0 ? AZEITES.oleo_hissopo.cor : ar.alegria > 0 ? AZEITES.oleo_alegria.cor : null;
  if (cor && Math.random() < dt * 14) G.parts.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y - 10 - Math.random() * 36, vx: (Math.random() - 0.5) * 20, vy: -40, t: 0.6, max: 0.6, r: 1.5, cor, g: -20 });
}

// a mesa de essências do sítio: uma botija de azeite e o aroma
export async function mesaDeEssencias(G) {
  const b = bolsa(G), pode = k => Object.entries(AZEITES[k].receita).every(([i, n]) => (b[i] || 0) >= n), rec = k => Object.entries(AZEITES[k].receita).map(([i, n]) => n + ' ' + nomeItem(i, n)).join(' + ');
  const reabre = () => setTimeout(() => mesaDeEssencias(G), 60);
  await G.ui.dialog({ nome: 'A mesa de essências', texto: 'Frascos de barro, um pilão, ervas secando no varal. Uma botija de azeite e o aroma certo: cada cor serve para uma coisa.\n\n' + Object.entries(AZEITES).map(([k, A]) => '• ' + A.nome + ' (' + A.aroma + '): ' + rec(k)).join('\n'), voz: false,
    acoes: [...Object.keys(AZEITES).filter(pode).map(k => ({ label: 'Fazer ' + AZEITES[k].nome.toLowerCase(), fn: () => { for (const [i, n] of Object.entries(AZEITES[k].receita)) b[i] -= n; ganhar(G, k, 1, G.p.x, G.p.y - 80); sfx('level'); G.fx.anel(G.p.x, G.p.y - 30, AZEITES[k].cor, 70); G.salvar(); reabre(); } })), { label: 'Sair' }] });
}
// Lídia também vende perfumes (mais caros do que fazer). Devolve false para seguir para a loja de sempre.
export async function lojaDeLidia(G, ob) {
  const qual = await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: '"Púrpura para o caminho, ou perfume para a alma?"', acoes: [{ label: 'Ver a loja' }, { label: 'Óleos e perfumes' }, { label: 'Até mais' }] });
  if (qual === 'Ver a loja') return false;
  if (qual === 'Óleos e perfumes') await lojaPerfumes(G, ob);
  return true;
}
async function lojaPerfumes(G, ob) {
  const c = G.char, reabre = () => setTimeout(() => lojaPerfumes(G, ob), 60);
  await G.ui.dialog({ nome: ob.nome + ' · perfumes', look: ob.look, texto: '"Púrpura de Tiatira e perfume de todo canto. Cada cor tem um uso; quem tem sítio faz em casa, mais barato, com azeite da prensa."\n\nDenários: ' + Math.floor(c.data.gold),
    acoes: [...Object.entries(AZEITES).map(([k, A]) => ({ label: A.nome + ' — ' + A.preco + ' (tem ' + (bolsa(G)[k] || 0) + ')', fn: () => { if (c.data.gold < A.preco) return G.ui.toast('Faltam denários.', 2500); c.data.gold -= A.preco; ganhar(G, k, 1, G.p.x, G.p.y - 80); sfx('coin'); G.salvar(); reabre(); } })), { label: 'Só olhando' }] });
}
export { AZEITES };
