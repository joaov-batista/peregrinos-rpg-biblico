// A campanha: a história do peregrino no Refúgio. Independente das páginas da semana: nada daqui é exigido para entrar
// numa dungeon semanal, e nenhuma dungeon é exigida para avançar aqui. O progresso fica em cm.hist (saves antigos começam do zero).
import { sfx } from '../audio.js';
import { CAPITULOS, EPILOGO, ARCO } from '../content/historia.js';
import { T, CW } from './nivel.js';

export const hist = G => (G.cm.hist = G.cm.hist || { cap: 0, est: 0 }); // est: 0 = pedido por ouvir · 1 = página aberta · 2 = sombra vencida, falta voltar
const capAtual = G => CAPITULOS[hist(G).cap] || null;
const narra = (G, nome, texto, label = 'Continuar') => G.ui.dialog({ nome, texto, acoes: [{ label }], cls: 'fala-narra', voz: false });

// quem tem algo a dizer ganha um sinal sobre a cabeça; as lamparinas e a reunião da praça aparecem conforme os capítulos vencidos
export function historiaNoRefugio(G) {
  if (G.area !== 'refugio') return;
  const h = hist(G), c = capAtual(G), alvo = !G.cm.mapa ? null : c ? c.quem : h.fim ? null : EPILOGO.quem;
  for (const o of G.objs) o.chama = !!alvo && o.id === alvo;
  G.objs = G.objs.filter(o => !o.daHistoria);
  CAPITULOS.forEach((cp, i) => { if (i < h.cap) for (const col of cp.lamparinas) G.objs.push({ tipo: 'lamparina', daHistoria: true, x: (cp.sala * CW + col) * T + 16, y: 16 * T, luz: 150 }); });
  if (h.cap >= 3) [[15, 0], [18, 1], [23, 2]].forEach(([col, k]) => G.objs.push({ tipo: 'npc', daHistoria: true, id: 'reuniao' + k, nome: ['Uma moradora', 'Um velho da aldeia', 'Uma criança'][k], x: col * T + 16, y: 16 * T,
    look: [{ skin: '#C68B59', hair: '#3A2314', tunic: '#7A5A8A', cape: 'none', style: 'veu' }, { skin: '#A0673E', hair: '#D9D2C5', tunic: '#5E6A4A', cape: 'none', style: 'curto', beard: true }, { skin: '#D9A273', hair: '#6B4423', tunic: '#C9A63C', cape: 'none', style: 'curto' }][k] }));
}
// a seta dourada da campanha (só quando não há outra coisa mais urgente a mostrar)
export function alvoDaHistoria(G) { const o = G.area === 'refugio' ? G.objs.find(x => x.chama) : null; return o ? { x: o.x, y: o.y + 40, rot: 'história: ' + (capAtual(G)?.quemNome || EPILOGO.quemNome), portal: o } : null; }

async function abrirPagina(G, c) {
  await G.ui.dialog({ nome: 'PÁGINA VIVA · ' + c.ref, texto: c.lugar + '.\n\nO que você vai ver nesta página aconteceu e está escrito: você não muda uma letra.\n\nO que você vai enfrentar nela não está no texto. É a sombra do esquecimento que cobriu a página: ' + G.nomeChefe(c.chefe) + '.',
    acoes: [{ label: 'Entrar na página', fn: () => G.entrar('hist:' + c.id) }, { label: 'Agora não' }], cls: 'fala-narra', voz: false });
}

// conversa com um morador: devolve true se a história tomou a conversa
export async function falaHistoria(G, ob) {
  const h = hist(G), c = capAtual(G);
  if (ob.id?.startsWith?.('reuniao')) { await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: ['"Onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles" (Mt 18:20). Fazia tempo que a praça não ouvia isso.', 'No meu tempo as lâmpadas ficavam acesas a noite inteira. Achei que não ia ver de novo.', 'A Rode disse que, se a gente ficar quietinho, dá para ouvir a porta bater!'][+ob.id.slice(-1)], acoes: [{ label: 'Ficar um pouco' }] }); return true; }
  if (!G.cm.mapa) return false;
  if (!c) { // o fecho do arco, com Ana
    if (ob.id !== EPILOGO.quem || h.fim) return false;
    if (G.cm.getsemani) await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: EPILOGO.depois, acoes: [{ label: 'Amém' }] });
    else for (const [i, t] of EPILOGO.falas.entries()) await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: t, acoes: [{ label: i === EPILOGO.falas.length - 1 ? 'Guardar essas palavras' : 'Continuar' }] });
    h.fim = true; G.pontos(800); sfx('level'); G.salvar(); historiaNoRefugio(G);
    G.ui.toast('Fim do primeiro arco: ' + ARCO.titulo + '. A história continua.', 7000); return true;
  }
  if (ob.id !== c.quem) return false;
  const diz = (t, label = 'Continuar') => G.ui.dialog({ nome: ob.nome, look: ob.look, texto: t, acoes: [{ label }] });
  if (h.est === 0) { for (const [i, t] of c.pedido.entries()) await diz(t, i === c.pedido.length - 1 ? 'Eu vou' : 'Continuar'); h.est = 1; G.salvar(); sfx('key'); G.ui.toast('História · capítulo ' + c.n + ': ' + c.titulo + ' (' + c.ref + ')', 6000); await abrirPagina(G, c); return true; }
  if (h.est === 1) { let conversa = false; await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'A página está aberta: ' + c.ref + '. Quando quiser.', acoes: [{ label: 'Ir à página', fn: () => abrirPagina(G, c) }, { label: 'Só conversar', fn: () => { conversa = true; } }] }); return !conversa; }
  // voltou depois de vencer a sombra: a conversa de volta, o prêmio e a aldeia que muda
  for (const [i, t] of c.volta.entries()) await diz(t, i === c.volta.length - 1 ? 'Amém' : 'Continuar');
  const pr = c.premio; G.char.data.gold += pr.gold; G.xp(pr.xp); G.pontos(600); G.cm.mana = (G.cm.mana || 0) + (pr.mana || 0);
  h.cap++; h.est = 0; sfx('level'); G.efeito('coleta', G.p.x, G.p.y - 30); G.clarao = 0.12; G.salvar(); historiaNoRefugio(G);
  G.ui.toast('✦ ' + c.mudanca + ' (+' + pr.gold + ' denários' + (pr.mana ? ', +1 maná' : '') + ')', 8000);
  return true;
}

// a sombra da página caiu: a cena bíblica, separada do resto, só com o que o texto conta
export async function vencerCapitulo(G) {
  const c = CAPITULOS.find(x => x.id === G.def.historia); if (!c) return;
  await narra(G, 'A sombra se desfaz', 'A página volta a ter cor. As letras reaparecem, uma a uma, e a cena que estava coberta acontece diante de você.', 'Ver o que está escrito');
  for (const [i, t] of c.cena.entries()) await narra(G, 'Está escrito · ' + c.ref, t, i === c.cena.length - 1 ? 'Fechar a página' : 'Virar a página');
  const h = hist(G); if (capAtual(G)?.id === c.id && h.est < 2) { h.est = 2; G.salvar(); G.ui.toast('Volte ao Refúgio e conte a ' + c.quemNome + ' o que você viu.', 7000); }
}
