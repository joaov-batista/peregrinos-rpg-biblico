// O que veio depois do Refúgio: o porto (barqueiro, pescador e o mercador de além-mar), a cidade de Sardes (velas,
// a Palavra levada ao povo, os ataques no meio da rua) e o Vale da Mentira, onde se conquista a descida do Espírito.
// O jogo chama estas funções em pontos fixos (entrar, a cada quadro, ao falar, ao usar, ao vencer um vício).
import { sfx, music } from '../audio.js';
import { RELIQUIAS, ARMAS_ALT } from './dados.js';
import { rarDe, especiaisDe, ESPECIAIS, valorTroca } from './arsenal.js';
import { pesca } from './menu.js';
import { T, CW, CH, tileEm, VAZIO } from './nivel.js';
import { TODAS } from '../content/index.js';
import { SARDES_POVO, EPAFRAS, SARDES_RUA, SARDES_VELAS, SARDES_ABATES } from '../content/sardes.js';
import { marco } from '../telemetria.js';
import { falaHistoria, historiaNoRefugio } from './historia.js';
import { vidaNoRefugio, rotuloVida, usarVida, amizade } from './vida.js';
import { missaoNoRefugio, rotuloMissao, usarMissao, zeloteDepois, inv } from './missao.js';
import { falarMorador } from './moradores.js';
import { rotuloLugar, usarLugar } from './lugares.js';
import { sitioAoEntrar, rotuloSitio, usarSitio } from './sitio.js';

const rand = (a, b) => a + Math.random() * (b - a);
export const PRECO_BARCO = 150;
// as relíquias que só o mercador de além-mar traz (não caem de chefes)
export const DO_PORTO = ['ancora_esperanca', 'vela_paulo', 'estrela_magos'];

const sar = G => (G.cm.sar = G.cm.sar || { velas: {}, palavra: {}, abates: 0, rolos: false, feita: false });
const nVelas = G => Object.keys(sar(G).velas).length, nPalavra = G => Object.keys(sar(G).palavra).length;
const progresso = G => { const s = sar(G); return s.feita ? 1 : (Math.min(1, nVelas(G) / SARDES_VELAS) * 0.5 + Math.min(1, nPalavra(G) / 5) * 0.3 + Math.min(1, s.abates / SARDES_ABATES) * 0.2); };
const preenche = (txt, G) => txt.replace('{velas}', SARDES_VELAS).replace('{abates}', SARDES_ABATES).replace('{v}', nVelas(G)).replace('{p}', nPalavra(G)).replace('{a}', Math.min(sar(G).abates, SARDES_ABATES));
// a luz da cidade acompanha o que já foi feito
function luzDaCidade(G) { if (G.area !== 'sardes' || sar(G).feita) return; G.tm = { ...G.tm, escuro: 0.7 - progresso(G) * 0.36 }; }

/* ---------------- ao entrar numa área ---------------- */
export function aoEntrar(G, id, o = {}) {
  G.noturnas = 0; G.sin = null;
  if (G.def?.sitio) sitioAoEntrar(G);
  if (id === 'refugio') {
    const k = o.portal ? andarDe(o.portal) : null; montarAndar(G, k ?? G.andarRolos ?? proximoAndar(G)); // voltando de uma página, o salão já está no andar dela // o mercador de além-mar só aparece de vez em quando, e cada visita traz outras coisas
    G.viajante = Math.random() < 0.4 ? sortearViajante(G) : null;
    G.objs = G.objs.filter(o => !o.vezOutra || G.viajante);
    historiaNoRefugio(G); vidaNoRefugio(G); missaoNoRefugio(G);
    { const i = G.objs.findIndex(q => q.qual === 'sinagoga'); if (i > 0) G.objs.unshift(G.objs.splice(i, 1)[0]); }
    { const cj = G.cm.conjuge && G.objs.find(q => q.tipo === 'morador' && q.id === G.cm.conjuge), casa = G.objs.find(q => q.tipo === 'casa' && q.id === 'peregrino'); if (cj && casa) { cj.x = casa.x + 40; cj.cel = casa.cel; cj.nome = cj.nome.split(',')[0] + ', ' + (G.char.look?.sexo === 'f' ? 'seu marido' : 'sua esposa'); } } /* casados: mora com você */ /* a sinagoga por trás: quem ora lá dentro aparece na frente */
    // quem já caiu muitas vezes recebe uma visita: um estrangeiro de branco junto ao poço, que aponta (sem contar) para onde está o Mestre
    if ((G.cm.mortes || 0) >= 5 && !G.cm.getsemani) { const poco = G.objs.find(o => o.tipo === 'poco'); if (poco) { G.objs.push({ tipo: 'npc', id: 'mensageiro', nome: 'Um estrangeiro de branco', x: poco.x + 58, y: poco.y, luz: 130, cel: poco.cel, look: MENSAGEIRO });
      if (!G.cm.visto.mensageiro) { G.cm.visto.mensageiro = 1; setTimeout(() => { if (G.area === 'refugio') G.ui.toast('Há um estrangeiro de branco junto ao poço. Ninguém o viu chegar.', 7000); }, 2500); } } }
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
  if (G.sarEst === 'alerta') { if ((G.sarT -= dt) <= 0) { G.sarEst = 'ataque'; G.sarLuta = 0; atacar(G); music('batalha'); } return; }
  // em ataque: quando o último cai, a rua volta a respirar
  // ninguém fica perdido no escuro: quem se afastou demais (ou caiu para fora da rua) reaparece perto, e um ataque nunca dura para sempre
  G.sarLuta = (G.sarLuta || 0) + dt;
  for (const e of G.inimigos) if (e.sardes && e.hp > 0) {
    const longe = Math.abs(e.x - p.x) > 620 || Math.abs(e.y - p.y) > 330 || e.y > G.N.h * T + 60; e.longeT = longe ? (e.longeT || 0) + dt : 0;
    if (e.longeT > 4 || G.sarLuta > 75) { if (G.sarLuta > 75) { e.hp = 0; e.sumiu = true; G.efeito('sumico', e.x, e.y - e.h / 2); continue; } const lado = Math.random() < 0.5 ? -1 : 1, x = p.x + lado * rand(200, 300); const tx = Math.floor(x / T), ty = Math.floor((p.y - 10) / T); if (tileEm(G.N, tx, ty) !== VAZIO) continue; G.efeito('sumico', e.x, e.y - e.h / 2); e.x = x; e.y = e.voa ? p.y - 110 : p.y - 2; e.vx = e.vy = 0; e.stun = 0.5; e.longeT = 0; G.efeito('sumico', e.x, e.y - e.h / 2); }
  }
  if (!G.inimigos.some(e => e.sardes && e.hp > 0)) { G.sarLuta = 0; G.sarEst = 'paz'; G.musicaDaArea(); G.sarT = s.feita ? rand(120, 180) : rand(35, 60); G.ui.toast('A rua se acalma. Por enquanto.', 3500); G.ganharOleo(15); }
}
function atacar(G) {
  const p = G.p, N = G.N, s = sar(G), forca = s.feita ? 1.2 : 1.7, n = (s.feita ? 2 : 3) + Math.floor(rand(0, 3)) + (G.mp ? G.mp.naArea().length : 0);
  const tipos = ['ganancia', 'ganancia', 'ira', 'medo', 'duvida', 'orgulho', 'inveja'];
  // um demônio que andava no meio do povo, com rosto de gente
  const vizinho = G.objs.filter(o => o.tipo === 'morador' && !(o.escondido > G.T) && Math.abs(o.x - p.x) < 520 && Math.abs(o.y - p.y) < 200)[0];
  if (vizinho) { const e = G.nascer(Math.random() < 0.5 ? 'medo' : 'ira', vizinho.x, vizinho.y - 4, false, forca * 1.3); e.sardes = true; e.irado = 99; e.elite = true; vizinho.escondido = G.T + 40; G.efeito('sumico', vizinho.x, vizinho.y - 30); G.textoEm(vizinho.x, vizinho.y - 70, 'não era gente!', '#FF8A7A', 13); }
  for (let i = 0, feitos = 0; feitos < n && i < 40; i++) {
    const tipo = tipos[Math.floor(rand(0, tipos.length))], voa = tipo === 'medo' || tipo === 'duvida', x = p.x + (Math.random() < 0.5 ? -1 : 1) * rand(160, 360), y = voa ? p.y - rand(80, 140) : p.y - 2;
    const tx = Math.floor(x / T), ty = Math.floor((y - 10) / T); if (tileEm(N, tx, ty) !== VAZIO || tileEm(N, tx, ty - 1) !== VAZIO) continue;
    if (x < 9 * T || x > G.N.w * T - 2 * T) continue; // nada nasce no mar nem fora da cidade
    const e = G.nascer(tipo, x, y, false, forca); e.sardes = true; e.irado = 99; e.stun = 0.5; e.flash = 0.3; G.efeito('sumico', e.x, e.y - e.h / 2); feitos++;
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
  { const rv = rotuloVida(ob) ?? rotuloMissao(ob) ?? rotuloLugar(ob); if (rv) return rv; }
  if (G.def?.sitio) { const rs = rotuloSitio(G, ob); if (rs !== undefined) return rs; }
  if (ob.escondido > G.T) return null; // o vizinho que "não era gente" sumiu da rua: não há com quem falar
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
  if (await usarVida(G, ob)) return true;
  if (await usarLugar(G, ob)) return true;
  if (G.def?.sitio && await usarSitio(G, ob)) return true;
  if (await usarMissao(G, ob)) return true;
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
  if (await amizade(G, ob)) return true; // o primeiro papo do dia vale um coração; nos marcos, o morador conta algo
  if (await falaHistoria(G, ob)) return true; // a campanha: pedidos, páginas vivas e a volta
  if (await falarMorador(G, ob)) return true; // presentes, pedidos e a conversa da vez
  if (ob.id?.startsWith?.('zelote')) { // amargurados, cada um aponta para o conselho do seu jeito
    const k = +ob.id.slice(-1) - 1, n = cm.falas[ob.id] = (cm.falas[ob.id] || 0) + 1, F = cm.zelo ? ZELOTES_DEPOIS : ZELOTES;
    if (cm.zelo) { await zeloteDepois(G, ob, inv(G).est >= 3 ? ZELOTES_FIM[k] : F[k][(n - 1) % F[k].length]); return true; } // venceu o conselho: eles vendem o que é deles e entregam a investigação
    await G.ui.dialog({ nome: ob.nome, look: ob.look, texto: F[k][(n - 1) % F[k].length], acoes: [{ label: cm.zelo ? 'Paz' : 'Onde fica o conselho?', fn: cm.zelo ? undefined : () => G.ui.toast('Conselho Zelote: a porta de ferro fica no fundo da Clareira das Provas.', 7000) }, { label: 'Seguir caminho' }] });
    return true;
  }
  if (ob.id === 'mensageiro') { // pistas leves, uma de cada vez, conforme o que o peregrino já achou; nunca conta o que há no fim
    const n = cm.falas.mensageiro = (cm.falas.mensageiro || 0) + 1, diz = (texto, label = 'Guardar essas palavras') => G.ui.dialog({ nome: ob.nome, look: ob.look, texto, acoes: [{ label }] });
    if (n === 1) {
      await diz('Não tenha medo.\n\nVocê caiu ' + cm.mortes + ' vezes, e se levantou todas elas. "Sete vezes cairá o justo, e se levantará" (Pv 24:16).\n\nMas me diga, peregrino: você luta, lê, vence sombras… e para quem, afinal, está caminhando?', 'Não sei responder');
      cm.mana = (cm.mana || 0) + 1; p.oleo = G.oleoMax(); sfx('level'); G.efeito('coleta', p.x, p.y - 30); G.textoEm(p.x, p.y - 80, '+1 maná · jarro cheio', '#FFE9A8', 13); G.salvar();
      await diz('Tome. Pão para o caminho, e azeite para a sua lâmpada. Você vai precisar dela acesa.\n\nEste Refúgio tem mais do que portais. Lá onde o OLIVAL termina, depois da última oliveira, a sombra cobre alguma coisa.\n\nE o que a sua lâmpada faz com o que a sombra cobre?', 'Erguer a lâmpada no fim do olival…');
    } else if (!cm.trilha) await diz('O olival fica para lá do pátio das provas. Vá até onde as oliveiras acabam.\n\nNão procure com os olhos. Procure com a luz: erga a lâmpada e espere um instante.');
    else if (!cm.achados?.getsemani) await diz(n % 2 ? 'Você achou a trilha. Bom.\n\nA floresta é escura, mas não é ela que quero que você veja. Lá no fundo há uma clareira, um querubim de guarda e uma porta que respira. Todos param na porta.\n\nHá algo especial naquele lugar, e não é a porta. Olhe de novo. Com luz.' : 'Na clareira, as oliveiras mais velhas ficam no canto, depois do querubim. Tão velhas que parecem de outro tempo.\n\nÉ só o que eu digo.');
    else await diz('Você já viu a passagem entre as oliveiras.\n\nEntão por que ainda está aqui falando comigo? Há Alguém esperando do outro lado. Sempre houve.\n\nVá. E não leve pressa.', 'Ir');
    return true;
  }
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
  s.feita = true; G.musicaDaArea(); marco('sardes_luz'); c.data.gold += 600; G.xp(400); G.pontos(2500); G.def.tema = 'sardes2'; G.tm = { ...G.tm, escuro: 0.3, ceu: ['#14203A', '#4A4A6A', '#E0A878'] }; G.clarao = 0.4; sfx('level'); G.salvar();
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

const ZELOTES = [
  ['O que foi? Nunca viu um homem esperando?\n\nEu esperei o Reino a vida inteira. Afiei a faca todo dia. E quando o Rei veio, entrou na cidade montado num jumento (Zc 9:9). Num jumento.', 'Meu pai morreu com Judas, o galileu, quando se levantaram contra o censo (At 5:37). "Dispersaram-se todos." Está escrito assim, numa linha. Uma linha para o meu pai.', 'Quer saber de luta de verdade? Os três do conselho. Menaém não erra uma faca desde menino. Ninguém aqui dura contra ele o tempo de um salmo.'],
  ['Não me olhe com pena. Eu tive zelo. Zelo como o de Fineias, que pegou a lança e resolveu (Nm 25:7-8).\n\nDepois me disseram que zelo sem entendimento não serve (Rm 10:2). Depois. Sempre dizem depois.', 'Um dos nossos largou tudo e foi atrás dele: Simão, o que chamavam Zelote (Lc 6:15). Sentou-se à mesa com um cobrador de impostos. Um COBRADOR. E ficou.\n\nEu nunca entendi. E nunca esqueci.', 'O conselho ainda se reúne, no Pátio das provas. Eleazar carrega a lança que foi do avô. Se você acha que sabe lutar, vá lá. Depois me conte quanto durou.'],
  ['"O meu reino não é deste mundo. Se fosse, os meus servos pelejariam" (Jo 18:36).\n\nEu estava pronto para pelejar, estrangeiro. Tinha quem pelejasse. Ele não quis.', 'Barrabás era dos nossos, preso por motim (Mc 15:7). Soltaram ele. No lugar dele puseram… você sabe quem.\n\nEu devia ter ficado contente. Faz anos que não consigo.', 'Jair luta de longe, com foice de ceifeiro. Diz que é para lembrar que um dia a seara vai ser ceifada. Ninguém do conselho ri. Vá ver, se tiver coragem: a porta de ferro, no pátio.'],
  ['Olhando o mar? Eu também. Roma veio por ali.\n\nSabe o que dói? Não foi perder. Foi ele dizer "amai os vossos inimigos" (Mt 5:44) olhando na nossa direção.', 'Pedro puxou a espada no jardim, e cortou a orelha de um (Jo 18:10). Por um instante achei: agora vai. Aí ele curou o homem (Lc 22:51).\n\nCurou o inimigo. Na frente de todo mundo.', 'Três tronos, três armas, uma lei: um de cada vez… até você provar que merece os três. É assim no conselho. Fica no Pátio das provas. Ninguém vai te impedir de entrar.']
];
const ZELOTES_DEPOIS = [
  ['Então é verdade. Menaém errou uma faca.\n\n…Ele entrou num jumento, e você entrou no conselho com uma lâmpada. Talvez eu estivesse esperando o tipo errado de força.'],
  ['Eleazar baixou a lança do avô para você. Eu vi.\n\nSimão, o Zelote, ficou à mesa com o cobrador de impostos. Pela primeira vez acho que entendo por quê.'],
  ['"Se o meu reino fosse deste mundo, os meus servos pelejariam." Você pelejou, e venceu, e não ficou com nada do que é nosso.\n\nComeço a achar que o Reino é maior do que a nossa raiva.'],
  ['Você venceu os três e ninguém morreu. No nosso tempo isso não existia.\n\n"Amai os vossos inimigos." Ainda dói. Mas hoje doeu diferente.']
];
const ZELOTES_FIM = [
  'Dormi a noite inteira. Faz anos que não acontecia.\n\nEu ainda afio a faca toda manhã. Mas hoje, afiando, percebi que não estava pensando em ninguém.',
  'Fui até a casa do cobrador de impostos. Não entrei. Mas fui até a porta.\n\nUm passo de cada vez, estrangeiro. Simão, o Zelote, também deve ter começado pela porta.',
  'Barrabás saiu livre e outro foi no lugar dele. A vida inteira eu achei isso uma injustiça.\n\nHoje me ocorreu que Barrabás sou eu.',
  '"Amai os vossos inimigos." Eu ainda não consigo, não vou mentir.\n\nMas parei de odiar quem consegue.'
];
const MENSAGEIRO = { skin: '#D9A273', hair: '#F4F1E6', tunic: '#F4F1FF', cape: '#E6E0F4', style: 'longo', beard: false };
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
  if (A) { const preco = Math.round(A.preco * 0.8); acoes.push({ label: rarDe(A).marca + ' ' + A.nome + ' — ' + preco, fn: () => { if (c.data.gold < preco) return G.ui.toast('Faltam denários.'); cm.armas = cm.armas || {}; cm.armaAlt = cm.armaAlt || {}; const volta = valorTroca(ARMAS_ALT[G.tipoArma][cm.armaAlt[c.cls]]); c.data.gold += volta - preco; cm.armas[c.cls + ':' + V.arma] = 2; cm.armaAlt[c.cls] = V.arma; G.equiparArma(); sfx('coin'); G.salvar(); G.ui.toast('Agora é sua: ' + A.nome + '. Já está na sua mão.' + (volta ? ' O mercador ficou com a antiga: +' + volta + ' denários (peregrino carrega uma arma só).' : ''), 5500); } }); }
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
