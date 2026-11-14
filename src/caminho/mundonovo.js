// O que veio depois do Refúgio: o porto (barqueiro, pescador e o mercador de além-mar), a cidade de Sardes (velas,
// a Palavra levada ao povo, os ataques no meio da rua) e o Vale da Mentira, onde se conquista a descida do Espírito.
// O jogo chama estas funções em pontos fixos (entrar, a cada quadro, ao falar, ao usar, ao vencer um vício).
import { sfx } from '../audio.js';
import { RELIQUIAS, ARMAS_ALT } from './dados.js';
import { rarDe, especiaisDe, ESPECIAIS } from './arsenal.js';
import { pesca } from './menu.js';
import { T, CW, CH, tileEm, VAZIO } from './nivel.js';
import { TODAS } from '../content/index.js';
import { SARDES_POVO, EPAFRAS, SARDES_RUA, SARDES_VELAS, SARDES_ABATES } from '../content/sardes.js';
import { marco } from '../telemetria.js';

const rand = (a, b) => a + Math.random() * (b - a);
export const PRECO_BARCO = 150;
// as relíquias que só o mercador de além-mar traz (não caem de chefes)
export const DO_PORTO = ['ancora_esperanca', 'vela_paulo', 'estrela_magos'];

const sar = G => (G.cm.sar = G.cm.sar || { velas: {}, palavra: {}, abates: 0, rolos: false, feita: false });
const nVelas = G => Object.keys(sar(G).velas).length, nPalavra = G => Object.keys(sar(G).palavra).length;
const progresso = G => { const s = sar(G); return s.feita ? 1 : (Math.min(1, nVelas(G) / SARDES_VELAS) * 0.5 + Math.min(1, nPalavra(G) / 5) * 0.3 + Math.min(1, s.abates / SARDES_ABATES) * 0.2); };
const preenche = (txt, G) => txt.replace('{velas}', SARDES_VELAS).replace('{abates}', SARDES_ABATES).replace('{v}', nVelas(G)).replace('{p}', nPalavra(G)).replace('{a}', Math.min(sar(G).abates, SARDES_ABATES));
// a luz da cidade acompanha o que já foi feito
function luzDaCidade(G) { if (G.area !== 'sardes' || sar(G).feita) return; G.tm = { ...G.tm, escuro: 0.86 - progresso(G) * 0.4 }; }

/* ---------------- ao entrar numa área ---------------- */
export function aoEntrar(G, id, o = {}) {
  if (id === 'refugio') {
    const k = o.portal ? andarDe(o.portal) : null; montarAndar(G, k ?? G.andarRolos ?? proximoAndar(G)); // voltando de uma página, o salão já está no andar dela // o mercador de além-mar só aparece de vez em quando, e cada visita traz outras coisas
    G.viajante = Math.random() < 0.4 ? sortearViajante(G) : null;
    G.objs = G.objs.filter(o => !o.vezOutra || G.viajante);
  }
  if (id === 'sardes') {
    marco('sardes'); sar(G); luzDaCidade(G); G.sarEst = 'paz'; G.sarT = sar(G).feita ? rand(90, 140) : 22;
    for (const o of G.objs) if (o.tipo === 'morador' && o.rua != null) o.nome = 'Morador de Sardes';
  }
  if (id === 'vale') marco('vale');
  if (id === 'vale' && G.souDono()) { // o Dragão das Mentiras guarda o fim do vale
    const c = G.objs.find(o => o.tipo === 'covil');
    if (c) { const e = G.nascer('dragao', c.x, c.y - 90, false, 7); e.elite = true; e.escDesenho = 2.1; e.dragaoFinal = true; for (const k of ['r', 'w', 'h']) e[k] *= 1.7; e.irado = 99; e.v = { ...e.v, leque: 5 }; }
  }
}

/* ---------------- a cada quadro ---------------- */
export function passoNovo(G, dt) {
  if (G.area !== 'sardes' || !G.souDono() || G.p.morto) return;
  const s = sar(G), p = G.p;
  if (G.sarEst === 'paz') { if ((G.sarT -= dt) <= 0) { G.sarEst = 'alerta'; G.sarT = 2.6; const grito = ['Ladrões! Pega ladrão!', 'Gritos no fim da rua!', 'Socorro! Eles voltaram!', 'Um vulto no meio do povo!'][Math.floor(rand(0, 4))]; G.grito?.(grito); sfx('boss'); } return; }
  if (G.sarEst === 'alerta') { if ((G.sarT -= dt) <= 0) { G.sarEst = 'ataque'; atacar(G); } return; }
  // em ataque: quando o último cai, a rua volta a respirar
  if (!G.inimigos.some(e => e.sardes && e.hp > 0)) { G.sarEst = 'paz'; G.sarT = s.feita ? rand(120, 180) : rand(35, 60); G.ui.toast('A rua se acalma. Por enquanto.', 3500); G.ganharOleo(15); }
}
function atacar(G) {
  const p = G.p, N = G.N, s = sar(G), forca = s.feita ? 1.2 : 1.7, n = (s.feita ? 2 : 3) + Math.floor(rand(0, 3)) + (G.mp ? G.mp.naArea().length : 0);
  const tipos = ['ganancia', 'ganancia', 'ira', 'medo', 'duvida', 'orgulho', 'inveja'];
  // um demônio que andava no meio do povo, com rosto de gente
  const vizinho = G.objs.filter(o => o.tipo === 'morador' && !(o.escondido > G.T) && Math.abs(o.x - p.x) < 520 && Math.abs(o.y - p.y) < 200)[0];
  if (vizinho) { const e = G.nascer(Math.random() < 0.5 ? 'medo' : 'ira', vizinho.x, vizinho.y - 4, false, forca * 1.3); e.sardes = true; e.elite = true; vizinho.escondido = G.T + 40; G.efeito('sumico', vizinho.x, vizinho.y - 30); G.textoEm(vizinho.x, vizinho.y - 70, 'não era gente!', '#FF8A7A', 13); }
  for (let i = 0, feitos = 0; feitos < n && i < 40; i++) {
    const tipo = tipos[Math.floor(rand(0, tipos.length))], voa = tipo === 'medo' || tipo === 'duvida', x = p.x + (Math.random() < 0.5 ? -1 : 1) * rand(160, 360), y = voa ? p.y - rand(80, 140) : p.y - 2;
    const tx = Math.floor(x / T), ty = Math.floor((y - 10) / T); if (tileEm(N, tx, ty) !== VAZIO || tileEm(N, tx, ty - 1) !== VAZIO) continue;
    const e = G.nascer(tipo, x, y, false, forca); e.sardes = true; e.stun = 0.5; e.flash = 0.3; G.efeito('sumico', e.x, e.y - e.h / 2); feitos++;
  }
}

/* ---------------- vícios vencidos ---------------- */
export function aoMatar(G, e) {
  if (G.area === 'sardes' && !e.daLuta) { const s = sar(G); if (s.abates < SARDES_ABATES) { s.abates++; if (s.abates % 5 === 0 || s.abates === SARDES_ABATES) G.ui.toast('Sardes: ' + s.abates + ' de ' + SARDES_ABATES + ' vencidos.', 3000); luzDaCidade(G); } }
  if (e.dragaoFinal) setTimeout(() => G.running && liberarEspirito(G), 900);
}
async function liberarEspirito(G) {
  const cm = G.cm, primeira = !cm.espirito; cm.espirito = true; marco('espirito'); G.salvar(); sfx('level'); G.clarao = 0.3; G.fx.anel(G.p.x, G.p.y - 30, '#FFF4CF', 320);
  const c = G.objs.find(o => o.tipo === 'covil'); if (c && !G.objs.some(o => o.tipo === 'saida')) G.objs.push({ tipo: 'saida', x: c.x + 60, y: c.y, luz: 130 });
  if (!primeira) return G.ui.toast('O dragão se desfaz em fumaça de novo. Nunca existiu.', 4000);
  await G.ui.dialog({ nome: 'O Dragão das Mentiras', texto: 'O dragão estremece, e o fogo dele vira fumaça. Não havia escamas, nem asas, nem nada: só palavras que você tinha acreditado.\n\n"Ele é mentiroso e pai da mentira" (Jo 8:44).', acoes: [{ label: 'Continuar' }], voz: false, cls: 'fala-narra' });
  await G.ui.dialog({ nome: 'O Espírito da verdade', texto: 'Uma luz desce sobre o vale, mansa como uma pomba.\n\n"Quando vier o Espírito da verdade, ele vos guiará a toda a verdade" (Jo 16:13).\n\nVocê conquistou a DESCIDA DO ESPÍRITO. Segure a oração e aperte o golpe: ele desce do céu e fere tudo em volta, no alto e no chão.', acoes: [{ label: 'Amém' }], cls: 'fala-jesus achado-lendaria' });
}

/* ---------------- rótulos e uso dos objetos novos ---------------- */
export function rotuloNovo(G, ob) {
  switch (ob.tipo) {
    case 'vela': return sar(G).velas[ob.id] ? null : 'Reacender (10 de azeite)';
    case 'barco': return ob.volta ? 'Voltar ao Refúgio' : 'Embarcar para Sardes';
    case 'selado': return 'Olhar';
    case 'cenario': return ob.qual === 'quadro' ? 'Ler o quadro' : ob.qual === 'andares' ? 'Escada dos andares' : undefined;
  }
  if (ob.tipo === 'portal' && ob.area === 'vale') return 'Entrar';
  return undefined;
}
export async function usarNovo(G, ob) {
  const p = G.p, cm = G.cm, c = G.char;
  if (ob.tipo === 'vela') {
    const s = sar(G); if (s.velas[ob.id]) return true;
    if (p.oleo < 10) { G.ui.toast('A vela pede 10 de azeite. Golpes certos e defesas enchem a lâmpada.', 3500); return true; }
    p.oleo -= 10; s.velas[ob.id] = 1; sfx('heal'); G.efeito('coleta', ob.x, ob.y - 40); G.fx.anel(ob.x, ob.y - 40, '#FFD98A', 90); luzDaCidade(G); G.salvar();
    G.ui.toast('Vela acesa: ' + nVelas(G) + ' de ' + SARDES_VELAS + '. "Vós sois a luz do mundo" (Mt 5:14).', 3500); return true;
  }
  if (ob.tipo === 'barco' || (ob.tipo === 'npc' && ob.id === 'barqueiro')) { await barco(G, ob); return true; }
  if (ob.tipo === 'cenario' && ob.qual === 'andares') { await escadaAndares(G, ob); return true; }
  if (ob.tipo === 'selado' && ob.slot != null) { await G.ui.dialog({ nome: 'Nicho vazio', texto: 'Um nicho de pedra ainda sem página. Toda semana chega um rolo novo, e ele vai morar aqui.', acoes: [{ label: 'Voltar' }], voz: false }); return true; }
  if (ob.tipo === 'selado') { await G.ui.dialog({ nome: 'Porta selada', texto: 'Um selo de cera vermelha, com uma marca que você não conhece.\n\nOutras jornadas virão por aqui. Ainda não é tempo.', acoes: [{ label: 'Voltar' }], voz: false }); return true; }
  if (ob.tipo === 'cenario' && ob.qual === 'quadro') { await G.ui.dialog({ nome: 'O quadro do cais', texto: quadroMissoes(G), acoes: [{ label: 'Fechar' }], voz: false }); return true; }
  if (ob.tipo === 'portal' && ob.area === 'vale') {
    await G.ui.dialog({ nome: 'O Vale da Mentira', texto: 'Do outro lado da porta, um vale de névoa roxa. Serpentes de duas cabeças, quimeras, grifos, basiliscos, dragões: criaturas que nunca existiram, e que mesmo assim mordem quem acredita nelas.\n\nAs criaturas daqui são fortes. No fundo do vale, dizem, a maior das mentiras guarda um dom.' + (cm.espirito ? '\n\n(Você já venceu o Dragão das Mentiras.)' : ''),
      acoes: [{ label: 'Entrar', fn: () => G.entrar('vale') }, { label: 'Agora não' }] });
    return true;
  }
  if (ob.tipo === 'saida' && G.area === 'vale') { G.entrar('refugio', { portal: 'vale' }); return true; }
  return false;
}
function quadroMissoes(G) {
  const s = sar(G); if (s.feita) return 'Papéis novos no quadro: "Culto ao pôr do sol, no templo." "Procura-se quem ensine as crianças a ler." "Devolvo o que roubei: procure Tíquico."\n\nSardes voltou a viver.';
  const ok = (a, b) => a >= b ? '✓' : '·';
  return 'Papéis presos com pregos, quase todos rasgados. Alguém escreveu por cima, com carvão:\n\n' +
    ok(nVelas(G), SARDES_VELAS) + ' Reacender as velas da cidade: ' + nVelas(G) + ' de ' + SARDES_VELAS + '\n' +
    ok(nPalavra(G), 5) + ' Levar a Palavra a quem ainda resiste: ' + nPalavra(G) + ' de 5' + (s.rolos ? '' : ' (fale com Epafras)') + '\n' +
    ok(s.abates, SARDES_ABATES) + ' Enfrentar os que atacam o povo: ' + Math.min(s.abates, SARDES_ABATES) + ' de ' + SARDES_ABATES + '\n\n"Sê vigilante" (Ap 3:2).';
}
async function barco(G, ob) {
  const c = G.char;
  if (G.area === 'sardes') return G.ui.dialog({ nome: 'Jonatã, o barqueiro', texto: 'De volta ao Refúgio? Para quem trabalha por esta cidade, a volta não se paga.', acoes: [{ label: 'Voltar ao Refúgio', fn: () => G.entrar('refugio', { junto: 'barco' }) }, { label: 'Ficar' }] });
  const pode = c.data.gold >= PRECO_BARCO;
  return G.ui.dialog({ nome: 'Jonatã, o barqueiro', look: ob.look, texto: 'Sardes fica do outro lado do mar. Uma cidade grande, que já foi rica. Hoje quase ninguém desembarca lá: dizem que a luz não chega, que roubam até a sombra da gente.\n\nA travessia custa ' + PRECO_BARCO + ' denários. Você tem ' + Math.floor(c.data.gold) + '.\n\nAviso: o que anda por lá é mais forte do que o que você conhece.',
    acoes: [pode ? { label: 'Pagar e embarcar', fn: () => { c.data.gold -= PRECO_BARCO; sfx('coin'); G.salvar(); G.ui.toast('Três dias de mar. Ondas, sal, e uma cidade escura aparecendo no horizonte…', 4500); setTimeout(() => G.running && G.entrar('sardes'), 900); } } : { label: 'Não tenho o bastante' }, { label: 'Agora não' }] });
}

/* ---------------- falas novas ---------------- */
export async function falarNovo(G, ob) {
  const cm = G.cm, p = G.p, c = G.char;
  if (ob.id === 'zebedeu') { await pesca(G); return true; }
  if (ob.id === 'viajante') { await viajante(G, ob); return true; }
  if (ob.id === 'barqueiro') { await barco(G, ob); return true; }
  if (ob.id === 'nata') {
    const n = cm.falas.nata = (cm.falas.nata || 0) + 1;
    await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: n === 1
      ? 'Eu disse a um rei, na cara dele: "Tu és este homem" (2Sm 12:7). A verdade dói uma vez; a mentira dói todo dia.\n\nEste é o Salão das Subfases: caminhos que não estão nas páginas do Livro, mas que um peregrino precisa atravessar. A primeira porta dá no Vale da Mentira.'
      : cm.espirito ? 'Você voltou do vale com outra luz nos olhos. O Espírito da verdade não fica guardado num baú: ele vai com você. Use-o: segure a oração e aperte o golpe.'
      : 'No vale, nada do que você vir existe: serpentes de duas cabeças, quimeras, dragões. Mas a mentira só tem o poder que a gente dá a ela.\n\nNo fundo, o maior de todos guarda um dom. Dizem que quem o vence recebe o Espírito da verdade (Jo 16:13).\n\nAs outras duas portas ainda estão seladas.', acoes: [{ label: 'Continuar' }] });
    return true;
  }
  if (ob.id === 'epafras') { await epafras(G, ob); return true; }
  if (ob.palavra) { await palavra(G, ob); return true; }
  if (ob.tipo === 'morador' && ob.rua != null) { const l = SARDES_RUA[ob.rua % SARDES_RUA.length]; await G.ui.dialog({ nome: 'Morador de Sardes', look: ob.look, texto: sar(G).feita ? l[1] : l[0], acoes: [{ label: 'Continuar' }] }); return true; }
  return false;
}
async function epafras(G, ob) {
  const s = sar(G), c = G.char, d = (texto, acoes = [{ label: 'Continuar' }]) => G.ui.dialog({ nome: EPAFRAS.nome, look: ob.look, texto, acoes });
  if (s.feita) return d(EPAFRAS.depois);
  if (!s.rolos) { await d(EPAFRAS.chegada); await d(EPAFRAS.pedido, [{ label: 'Eu ajudo' }]); s.rolos = true; G.salvar(); sfx('key'); G.efeito('coleta', G.p.x, G.p.y - 30); return d(preenche(EPAFRAS.missoes, G)); }
  const pronto = nVelas(G) >= SARDES_VELAS && nPalavra(G) >= 5 && s.abates >= SARDES_ABATES;
  if (!pronto) return d(preenche(EPAFRAS.andamento, G));
  await d(EPAFRAS.final);
  s.feita = true; marco('sardes_luz'); c.data.gold += 600; G.xp(400); G.pontos(2500); G.def.tema = 'sardes2'; G.tm = { ...G.tm, escuro: 0.3, ceu: ['#14203A', '#4A4A6A', '#E0A878'] }; G.clarao = 0.4; sfx('level'); G.salvar();
  if (!G.cm.reliquias.includes('veste_branca')) await G.ganhar('veste_branca');
  G.ui.toast('+600 denários. Sardes voltou a ter luz.', 5000);
}
async function palavra(G, ob) {
  const s = sar(G), P = SARDES_POVO[ob.palavra];
  if (s.palavra[ob.palavra]) return G.ui.dialog({ nome: P.nome, look: ob.look, texto: P.depois, acoes: [{ label: 'Continuar' }] });
  if (!s.rolos) return G.ui.dialog({ nome: P.nome, look: ob.look, texto: P.antes + '\n\n(Epafras, no cais, tem algo que esta pessoa precisa ouvir.)', acoes: [{ label: 'Continuar' }] });
  await G.ui.dialog({ nome: P.nome, look: ob.look, texto: P.antes, acoes: [{ label: 'Abrir o rolo' }] });
  await G.ui.dialog({ nome: 'A Palavra', texto: P.palavra, acoes: [{ label: 'Entregar' }], cls: 'fala-narra', voz: false });
  s.palavra[ob.palavra] = 1; sfx('right'); G.efeito('coleta', ob.x, ob.y - 40); luzDaCidade(G); G.salvar();
  await G.ui.dialog({ nome: P.nome, look: ob.look, texto: P.depois, acoes: [{ label: 'Continuar' }] });
  G.ui.toast('A Palavra foi levada: ' + nPalavra(G) + ' de 5.', 3000);
}

/* ---------------- o mercador de além-mar ---------------- */
function sortearViajante(G) {
  const cm = G.cm, rel = DO_PORTO.filter(id => !cm.reliquias.includes(id)).sort(() => Math.random() - 0.5).slice(0, 2);
  cm.armas = cm.armas || {}; const tipo = G.tipoArma, epicas = Object.entries(ARMAS_ALT[tipo] || {}).filter(([id, a]) => a.rar === 'epica' && !cm.armas[G.char.cls + ':' + id]);
  const arma = epicas.length ? epicas[Math.floor(rand(0, epicas.length))][0] : null;
  return { rel, arma };
}
export async function viajante(G, ob) {
  const c = G.char, cm = G.cm, V = G.viajante || { rel: [], arma: null };
  const ofertas = [...V.rel.filter(id => !cm.reliquias.includes(id)).map(id => ({ id, R: RELIQUIAS[id], preco: RELIQUIAS[id].porto }))];
  const A = V.arma && !cm.armas?.[c.cls + ':' + V.arma] ? ARMAS_ALT[G.tipoArma][V.arma] : null;
  if (!ofertas.length && !A) return G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'Vendi tudo o que trouxe. O mar é largo e meu barco é pequeno: volto quando o vento quiser.', acoes: [{ label: 'Boa viagem' }] });
  const acoes = ofertas.map(o => ({ label: rarDe(o.R).marca + ' ' + o.R.nome + ' — ' + o.preco, fn: () => { if (c.data.gold < o.preco) return G.ui.toast('Faltam denários.'); c.data.gold -= o.preco; sfx('coin'); G.ganhar(o.id); G.salvar(); } }));
  if (A) { const preco = Math.round(A.preco * 0.8); acoes.push({ label: rarDe(A).marca + ' ' + A.nome + ' — ' + preco, fn: () => { if (c.data.gold < preco) return G.ui.toast('Faltam denários.'); c.data.gold -= preco; cm.armas = cm.armas || {}; cm.armas[c.cls + ':' + V.arma] = 1; cm.armaAlt = cm.armaAlt || {}; cm.armaAlt[c.cls] = V.arma; G.equiparArma(); sfx('coin'); G.salvar(); G.ui.toast('Agora é sua: ' + A.nome + '. Já está na sua mão.', 4000); } }); }
  acoes.push({ label: 'Só olhar' });
  const lista = ofertas.map(o => '◆ ' + o.R.nome + ' (' + rarDe(o.R).nome + ') — ' + o.R.desc).join('\n') + (A ? '\n◆ ' + A.nome + ' (' + rarDe(A).nome + ', ' + especiaisDe(A).map(k => ESPECIAIS[k].nome).join(' + ') + ') — ' + A.desc : '');
  return G.ui.dialog({ nome: ob.nome, look: ob.look, texto: 'Coisas de além-mar, que nenhum mercador daqui tem. Amanhã eu posso não estar.\n\n' + lista + '\n\nVocê tem ' + Math.floor(c.data.gold) + ' denários.', acoes });
}

// a seta dourada em Sardes: a vela apagada mais perto, ou quem ainda espera a Palavra, ou Epafras
export function objetivoSardes(G) {
  const s = sar(G), p = G.p; if (s.feita) return null;
  const perto = l => l.sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 2 - Math.abs(b.x - p.x) - Math.abs(b.y - p.y) * 2)[0];
  if (!s.rolos) { const e = G.objs.find(o => o.id === 'epafras'); return e ? { x: e.x, y: e.y + 40, rot: 'fale com Epafras', portal: e } : null; }
  const pronto = nVelas(G) >= SARDES_VELAS && nPalavra(G) >= 5 && s.abates >= SARDES_ABATES;
  if (pronto) { const e = G.objs.find(o => o.id === 'epafras'); return e ? { x: e.x, y: e.y + 40, rot: 'volte a Epafras', portal: e } : null; }
  const v = perto(G.objs.filter(o => o.tipo === 'vela' && !s.velas[o.id])), w = perto(G.objs.filter(o => o.palavra && !s.palavra[o.palavra]));
  const alvo = perto([v, w].filter(Boolean)); if (!alvo) return null;
  return { x: alvo.x, y: alvo.y + 40, rot: alvo.tipo === 'vela' ? 'reacenda a vela' : 'leve a Palavra a ' + alvo.nome, portal: alvo };
}

/* ---------------- os andares do Salão dos Rolos ----------------
   Quatro nichos por andar. Toda semana nova entra no próximo nicho livre; quando o andar enche, nasce outro. Sempre sobra
   um nicho selado ("próxima semana"). A escada dos andares leva o peregrino: escolhe o andar e ele vai sozinho. */
export const POR_ANDAR = 4;
export const totalAndares = () => Math.ceil((TODAS.length + 1) / POR_ANDAR);
export function andarDe(semId) { const i = TODAS.findIndex(s => s.id === semId); return i < 0 ? null : Math.floor(i / POR_ANDAR); }
function proximoAndar(G) { const i = TODAS.findIndex(s => s.fases.some(f => !G.cm.feitas[s.id + ':' + f.n])); return Math.floor((i < 0 ? TODAS.length - 1 : i) / POR_ANDAR); }
export function montarAndar(G, n) {
  n = Math.max(0, Math.min(totalAndares() - 1, n)); G.andarRolos = n;
  for (const o of G.objs) if (o.slot != null) {
    const sem = TODAS[n * POR_ANDAR + o.slot];
    if (sem) { o.tipo = 'portal'; o.semana = sem.id; o.rotulo = undefined; o.luz = 80; } else { o.tipo = 'selado'; o.semana = null; o.rotulo = 'Próxima semana'; o.luz = 0; }
  }
  const cel = G.N?.celulas.find(c => c.deco === 'biblioteca'); if (cel) cel.nome = 'Salão dos Rolos · andar ' + (n + 1);
}
async function escadaAndares(G, ob) {
  const n = totalAndares(), atual = G.andarRolos ?? 0, feitas = s => s.fases.filter(f => G.cm.feitas[s.id + ':' + f.n]).length;
  const acoes = [];
  for (let k = 0; k < n; k++) {
    const sems = TODAS.slice(k * POR_ANDAR, k * POR_ANDAR + POR_ANDAR), nomes = sems.map(s => s.estudo || s.titulo).join(' · ') || 'nichos à espera';
    const pend = sems.some(s => feitas(s) < s.fases.length);
    acoes.push({ label: (k + 1) + 'º andar' + (k === atual ? ' (aqui)' : '') + (pend ? ' ✦' : '') + ' — ' + nomes, fn: () => k !== atual && irAoAndar(G, ob, k) });
  }
  acoes.push({ label: 'Ficar' });
  await G.ui.dialog({ nome: 'Escada dos andares', texto: 'Uma escada de caracol sobe pelo meio das estantes. Cada andar guarda quatro páginas do Livro; o sinal ✦ marca onde ainda há caminho por andar.\n\nEscolha o andar: a escada leva você.', acoes, voz: false });
}
async function irAoAndar(G, ob, k) {
  const p = G.p, esperar = ms => new Promise(r => setTimeout(r, ms));
  G.cena = true;
  try {
    for (let t = 0; t < 120 && Math.abs(ob.x - p.x) > 10; t++) { G.cenaMx = Math.sign(ob.x - p.x); await esperar(30); } // anda até a escada
    G.cenaMx = 0; p.vx = 0; sfx('step'); await esperar(200);
    G.fade = 1; sfx('gate'); await esperar(350); // sobe (ou desce) pela escada
    montarAndar(G, k); p.x = ob.x + 30; G.vista.cam.x = p.x - G.vista.W / G.vista.Z / 2; G.prenderCam();
    G.textoEm(p.x, p.y - 80, 'Andar ' + (k + 1), '#FFE9A8', 15); G.ui.toast('Salão dos Rolos · andar ' + (k + 1), 2500);
  } finally { G.cena = false; G.cenaMx = 0; }
}
