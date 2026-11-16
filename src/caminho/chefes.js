// Chefes do Caminho: lutas em fases, com golpes sempre avisados (dá para aprender e vencer sem levar dano).
// Cada chefe luta do seu jeito (estilos.js): golpes que só ele tem, um modo próprio de se mover e de escolher o
// próximo golpe, e um palco que muda durante a luta. Nenhum golpe se repete entre chefes.
// Três ideias próprias do jogo:
//   • Postura: defesas perfeitas com a lâmpada enchem a barra; cheia, o chefe fica QUEBRANTADO.
//   • Está Escrito: a cada virada de fase o chefe acusa, e a luta para numa pergunta do estudo.
//   • Cada chefe tem uma regra que ensina o texto (fugir da Imoralidade, a luz que desfaz a Mentira, a testa de Golias…).
import { rand, clamp, TAU } from '../util.js';
import { sfx } from '../audio.js';
import { BOSSES } from '../data/bestiary.js';
import { drawBoss } from '../game/boss-art.js';
import { mover } from './corpo.js';
import { ESTILOS, desfazer } from './estilos.js';

const F = (vida, golpes, extra = {}) => ({ vida, golpes, ...extra });
// golpes: nome → parâmetros; "fn" aponta para o golpe do estilo quando o nome é uma variação (mais forte) do mesmo golpe
export const CHEFES = {
  /* ---------- A Raiz de Amargura: o chefe secreto da investigação dos zelotes ---------- */
  amargura: { vida: 1700, pressa: 0.6, r: 40, arena: 'raizes', voa: 150, vel: 0, semVirar: false,
    golpes: { raizesAmargas: {}, rasgoDeEspinho: { espera: 1.2 }, chuvaDeFel: {}, lequeDeEspinhos: {}, marDeFel: {}, abracoDaRaiz: {} },
    fases: [F(1, ['raizesAmargas', 'chuvaDeFel', 'lequeDeEspinhos', 'rasgoDeEspinho']), F(0.62, ['rasgoDeEspinho', 'marDeFel', 'raizesAmargas', 'abracoDaRaiz', 'lequeDeEspinhos'], { grito: 'VOCÊ NUNCA VAI ESQUECER!', escuro: 0.25 }), F(0.3, ['rasgoDeEspinho', 'marDeFel', 'chuvaDeFel', 'abracoDaRaiz', 'raizesAmargas', 'lequeDeEspinhos'], { grito: 'EU SOU TUDO O QUE TE DEVEM!', escuro: 0.4 })],
    dica: 'Ela voa: bata quando ela crava no chão (raízes) e logo depois de cada rasgo em diagonal. Na chuva de fel, ande entre as cortinas. Quando o fel sobe, vá para o outro lado ou suba nas raízes. No abraço, pule uma das paredes.' },
  /* ---------- O Conselho Zelote: um, depois dois, depois os três. Uma vida só ---------- */
  conselho: { vida: 1500, pressa: 0.62, r: 26, arena: 'conselho', voa: 1, vel: 0,
    golpes: { punhalRasante: { espera: 0.9 }, punhalCadente: { espera: 0.9 }, vaiEVolta: { espera: 1 }, punhaisDaParede: { espera: 1 }, pelasCostas: { espera: 0.9 }, abaloDoForte: { espera: 1.8 }, lancaCadente: { espera: 1.5 }, estocadaZelote: { espera: 1.5 }, lancasDaParede: { espera: 1.6 }, giroDaLanca: { espera: 1.6 } },
    fases: [F(1, ['punhalRasante', 'punhalCadente', 'vaiEVolta', 'punhaisDaParede', 'pelasCostas']), F(0.66, ['lancaCadente', 'estocadaZelote', 'lancasDaParede', 'giroDaLanca', 'abaloDoForte'], { grito: 'ELEAZAR! JAIR! DESÇAM!' }), F(0.33, ['lancaCadente', 'estocadaZelote', 'giroDaLanca', 'abaloDoForte', 'lancasDaParede'], { grito: 'O CONSELHO INTEIRO!' })],
    dica: 'Eles só podem ser feridos quando estão na sala. Rasante: pule. Mergulho: saia de baixo e bata quando ele cai. Na parede: desvie e alcance-o no alto. As foices voltam por outra altura. Com dois ou três, não persiga: escolha um e espere a brecha. MENAÉM, o assassino, some e aparece nas suas costas: ande para a frente. ELEAZAR, o forte, racha o teto quando cai: olhe os círculos. JAIR, o vidente, chama fogo onde você está e solta brasas que perseguem: não pare, e leve as brasas até elas apagarem.' },
  zeloteFoice: { parte: true, vida: 1e7, pressa: 0.62, r: 26, arena: 'conselho', voa: 1, vel: 0,
    golpes: { foiceRasteira: { espera: 2.2 }, foiceAlta: { espera: 2.2 }, ceifar: { espera: 2 }, foiceCadente: { espera: 2 }, fogoDoZelo: { espera: 2.2 }, brasasVivas: { espera: 2.4 } }, fases: [F(1, ['fogoDoZelo', 'foiceRasteira', 'brasasVivas', 'foiceAlta', 'ceifar', 'foiceCadente'])], dica: '' },
  zelotePunhal: { parte: true, vida: 1e7, pressa: 0.62, r: 26, arena: 'conselho', voa: 1, vel: 0,
    golpes: { rasgo: { espera: 2.6 }, boteZelote: { espera: 2.6 }, chuvaDePunhais: { espera: 2.8 }, finta: { espera: 2.8 }, sombraNasCostas: { espera: 2.6 } }, fases: [F(1, ['rasgo', 'sombraNasCostas', 'boteZelote', 'chuvaDePunhais', 'finta'])], dica: '' },
  /* ---------- A história do peregrino: as sombras das páginas vivas ---------- */
  escassez: { vida: 480, r: 40, arena: 'casebre', vel: 50,
    golpes: { rachaduras: {}, poeira: {}, fome: {}, mirrar: {} },
    fases: [F(1, ['rachaduras', 'poeira', 'mirrar']), F(0.6, ['fome', 'rachaduras', 'poeira', 'mirrar'], { grito: 'É O ÚLTIMO PÃO!' }), F(0.28, ['fome', 'poeira', 'rachaduras', 'mirrar'], { grito: 'NÃO HÁ MAIS NADA!' })],
    dica: 'A seca bebe o seu azeite: apanhe a botija que aparece nos cantos (ela não falta). Saia de cima das rachaduras, pule o poeira (ele cresce a cada parede) e, se a mão puxar, use o passo para sair da boca.' },
  desprezo: { vida: 560, r: 42, arena: 'estrada', vel: 60,
    golpes: { calaTe: {}, empurrao: {}, dedos: {}, atropelo: {} },
    fases: [F(1, ['calaTe', 'dedos', 'empurrao']), F(0.6, ['atropelo', 'calaTe', 'empurrao', 'dedos'], { grito: 'QUEM É VOCÊ PARA GRITAR?' }), F(0.28, ['atropelo', 'calaTe', 'dedos', 'empurrao'], { grito: 'CALEM ESSE HOMEM!' })],
    dica: 'A voz rasteira se pula; a voz alta passa por cima de quem fica no chão. No atropelo, corra para o vão livre. "Ele clamava ainda mais" (Mc 10:48): cada golpe enche a luz no fim da estrada. Cheia, a multidão se abre e fica sem defesa.' },
  carcere: { vida: 640, r: 44, arena: 'cela', vel: 120,
    golpes: { correntes: {}, escoltas: {}, portao: {}, ronda: {} },
    fases: [F(1, ['correntes', 'escoltas', 'ronda']), F(0.6, ['portao', 'correntes', 'escoltas', 'ronda'], { grito: 'DUAS CADEIAS E QUATRO ESCOLTAS!', escuro: 0.35 }), F(0.28, ['portao', 'ronda', 'correntes', 'escoltas'], { grito: 'NINGUÉM SAI DAQUI!', escuro: 0.5 })],
    dica: 'Golpes sozinhos não abrem esta prisão: numa brecha, fique parado e ORE até as velas do fundo se acenderem (At 12:5). As cadeias caem e ele fica quebrantado. Pule as correntes, não pare quando as lanças sobem, corra para o vão iluminado do portão e atravesse a ronda com o passo.' },
  /* ---------- Corinto (Atos 18) ---------- */
  mamom: { vida: 430, r: 40, arena: 'cofre', vel: 70,
    golpes: { cofre: {}, moedao: {}, preco: {}, ganancia: {}, avalanche: {} },
    fases: [F(1, ['cofre', 'moedao', 'preco', 'ganancia']), F(0.6, ['cofre', 'moedao', 'preco', 'ganancia'], { grito: 'TUDO TEM PREÇO!' }), F(0.3, ['avalanche', 'moedao', 'preco', 'ganancia', 'cofre'], { grito: 'SIRVA A MIM!' })],
    dica: 'Ele vai atrás das moedas malditas que caem e se recupera com elas: apanhe-as antes (pesam) ou bata nele enquanto se abaixa.' },
  procrastinacao: { vida: 760, pressa: 0.6, r: 38, arena: 'relogio', vel: 28, regras: { aura: { raio: 240, lentidao: 0.5 }, regenera: { apos: 1.4, taxa: 0.075, sempre: 0.012 } },
    golpes: { relogio: { n: 2, giro: 0.95, dur: 3.6 }, relogio3: { fn: 'relogio', n: 3, giro: -1.2, dur: 4 }, relogio4: { fn: 'relogio', n: 4, giro: 1.35, dur: 4.4 }, soneca: { raio: 170 }, ampulheta: {}, adiar: {}, tiquetaque: {} },
    fases: [F(1, ['relogio', 'soneca', 'ampulheta', 'tiquetaque']), F(0.6, ['relogio3', 'adiar', 'soneca', 'ampulheta', 'tiquetaque'], { grito: 'SÓ MAIS CINCO MINUTINHOS…' }), F(0.25, ['relogio4', 'adiar', 'tiquetaque', 'ampulheta'], { grito: 'AMANHÃ! AMANHÃ!' })],
    dica: 'Ela se cura o tempo todo, e depressa se você parar de bater (o relógio anda para trás). Mas a barra que você já derrubou não volta: atravesse cada marca de uma vez. Ataque nas brechas do relógio.' },
  mentira: { vida: 500, r: 34, arena: 'espelhos', voa: 120, vel: 90,
    golpes: { copias: { n: 3 }, copias5: { fn: 'copias', n: 5 }, meiaVerdade: {}, inverter: {}, troca: {}, boato: {} },
    fases: [F(1, ['copias', 'meiaVerdade', 'boato', 'inverter']), F(0.6, ['copias5', 'troca', 'meiaVerdade', 'inverter', 'boato'], { grito: 'QUAL DE NÓS É O VERDADEIRO?' }), F(0.3, ['copias5', 'troca', 'inverter', 'boato', 'meiaVerdade'], { grito: 'NINGUÉM VAI ACREDITAR EM VOCÊ!', escuro: 0.5 })],
    dica: 'Ela fica sempre no lado oposto, como num espelho. Erga a lâmpada: sob a luz as cópias tremem. Se tudo ficar ao contrário, foi a palavra torta: espere passar.' },
  imoralidade: { vida: 520, r: 38, arena: 'fuga', vel: 55, regras: { fuga: true },
    golpes: { encanto: { dur: 2.4 }, laco: {}, perfume: {}, beijos: {}, cilada: {} },
    fases: [F(1, ['encanto', 'beijos', 'laco']), F(0.55, ['encanto', 'perfume', 'cilada', 'laco', 'beijos'], { grito: 'NINGUÉM ESTÁ OLHANDO…' }), F(0.25, ['encanto', 'cilada', 'perfume', 'laco', 'beijos'], { grito: 'CHEGUE MAIS PERTO!' })],
    dica: 'Não se vence o encanto de perto: corra para longe (o passo pronto ajuda). Quem foge a deixa exposta. As ciladas no chão só aparecem com a lâmpada. "Fugi da imoralidade" (1Co 6:18).' },
  satanas: { vida: 760, r: 44, arena: 'altar', voa: 150, vel: 110, acusacoes: true,
    golpes: { dardos: {}, acusacao: {}, abismo: {}, cadeias: {}, leao: {} },
    fases: [F(1, ['dardos', 'acusacao', 'leao']), F(0.75, ['abismo', 'dardos', 'cadeias', 'leao'], { grito: 'EU ACUSO VOCÊ DIA E NOITE!' }), F(0.5, ['acusacao', 'cadeias', 'abismo', 'leao', 'dardos'], { grito: 'CULPADO!' }), F(0.25, ['abismo', 'leao', 'dardos', 'cadeias', 'acusacao'], { grito: 'VOCÊ É MEU!', escuro: 0.35 })],
    dica: 'Os dardos inflamados chegam na sua altura: erga a lâmpada como escudo (Ef 6:16). Quando o chão vira abismo, suba nas plataformas. Responda às acusações com o que está escrito.' },
  /* ---------- Jonas ---------- */
  fuga: { vida: 380, r: 36, arena: 'conves', vel: 110,
    golpes: { bilhetes: {}, outroNavio: {}, ancora: {}, corda: {} },
    fases: [F(1, ['bilhetes', 'outroNavio', 'ancora']), F(0.5, ['corda', 'outroNavio', 'bilhetes', 'ancora'], { grito: 'FUGIR NÃO MUDA O CHAMADO!' })],
    dica: 'Ele foge de você e o convés inclina. Encurralado, pula por cima: espere-o descer. As passagens voltam para a mão dele.' },
  pavor: { vida: 420, r: 36, arena: 'tormenta', voa: 130, vel: 100,
    golpes: { relampago: {}, vagalhao: {}, rajada: {}, granizo: {} },
    fases: [F(1, ['relampago', 'granizo', 'rajada']), F(0.5, ['vagalhao', 'relampago', 'granizo', 'rajada'], { grito: 'O MEDO QUER DECIDIR POR VOCÊ!' })],
    dica: 'Ele pisca de um lugar a outro do céu. Quando o vagalhão vier, suba nas plataformas. O raio cai no meio e depois dos lados.' },
  desespero: { vida: 460, r: 36, arena: 'costelas', voa: 120, vel: 150, pressa: 0.75, escuro: 0.55,
    golpes: { eco: {}, algas: {}, trevas: {}, peso: {} },
    fases: [F(1, ['eco', 'algas', 'peso']), F(0.5, ['trevas', 'eco', 'peso', 'algas'], { grito: 'AQUI NINGUÉM PODE OUVIR VOCÊ…' })],
    dica: 'As paredes do ventre se fecham devagar: a luta fica mais apertada. Guarde azeite para as trevas. Orar no abismo é exatamente o que Jonas fez (Jn 2:2).' },
  violencia: { vida: 500, r: 40, arena: 'barricadas', vel: 60,
    golpes: { correntePuxa: {}, pedregulho: {}, pisoteio: {}, furia: {} },
    fases: [F(1, ['correntePuxa', 'pedregulho', 'pisoteio']), F(0.5, ['furia', 'correntePuxa', 'pisoteio', 'pedregulho'], { grito: 'NADA MUDA NESTA CIDADE!' })],
    dica: 'A corrente puxa quem ela acerta: pule ou erga a lâmpada. Na fúria, afaste-se até as correntes pararem de girar.' },
  ressentimento: { vida: 550, r: 40, arena: 'colina',
    golpes: { espinheiro: {}, verme: {}, sol: {}, ventoOriental: {} },
    fases: [F(1, ['espinheiro', 'verme', 'sol']), F(0.5, ['ventoOriental', 'sol', 'verme', 'espinheiro'], { grito: 'COMPAIXÃO PARA ELES? NUNCA!' })],
    dica: 'Quando o sol bater, corra para a sombra da aboboreira (Jn 4:6). Ele não anda: afunda e brota do outro lado.' },
  /* ---------- Daniel 4 ---------- */
  encantadores: { vida: 440, r: 36, arena: 'pedestais', voa: 125, vel: 90,
    golpes: { constelacao: {}, adivinhacao: {}, cometa: {}, caldeirao: {} },
    fases: [F(1, ['constelacao', 'caldeirao', 'adivinhacao']), F(0.5, ['cometa', 'adivinhacao', 'constelacao', 'caldeirao'], { grito: 'NÓS LEMOS AS ESTRELAS!' })],
    dica: 'Magos, encantadores e caldeus não souberam explicar o sonho (Dn 4:7). Dos três sinais no chão, só um é abrigo: a lâmpada mostra qual.' },
  jugo: { vida: 500, r: 42, arena: 'andaimes', vel: 58,
    golpes: { chicote: {}, amarras: {}, tijolos: {}, cangalha: {} },
    fases: [F(1, ['chicote', 'tijolos', 'cangalha']), F(0.5, ['amarras', 'chicote', 'tijolos', 'cangalha'], { grito: 'OS FRACOS SUSTENTAM O TRONO!' })],
    dica: '"Põe termo às tuas iniquidades, usando de misericórdia para com os pobres" (Dn 4:27). Ele luta à distância do chicote: chegue perto. Acorrentado, ataque — a corrente cede.' },
  babilonia: { vida: 620, r: 46, arena: 'zigurate', voa: 1,
    golpes: { decreto: {}, zigurate: {}, jardins: {}, vozDoCeu: {} },
    fases: [F(1, ['decreto', 'zigurate', 'jardins']), F(0.6, ['zigurate', 'jardins', 'decreto'], { grito: 'NÃO É ESTA A GRANDE BABILÔNIA QUE EU EDIFIQUEI?' }), F(0.25, ['vozDoCeu', 'decreto', 'vozDoCeu', 'zigurate'], { grito: 'AINDA ESTAVA A PALAVRA NA BOCA DO REI…' })],
    dica: 'A cada fase a torre sobe. Na última, quem fala é a voz do céu (Dn 4:31): só atravesse a sentença.' },
  fera: { vida: 540, r: 40, arena: 'troncos', vel: 130,
    golpes: { bote: {}, garras: {}, rugido: { raio: 190 }, orvalho: {} },
    fases: [F(1, ['bote', 'garras', 'rugido']), F(0.5, ['orvalho', 'bote', 'garras', 'rugido'], { grito: 'SETE TEMPOS… SETE TEMPOS…' })],
    dica: 'É o rei, sem razão de homem (Dn 4:33). Não lhe dê as costas: ele dá o bote na hora. Resista até que ele levante os olhos ao céu.' },
  soberba: { vida: 780, r: 44, arena: 'terracos', voa: 150, vel: 110, acusacoes: true,
    golpes: { coroa: {}, estatua: {}, edito: {}, queda: {} },
    fases: [F(1, ['coroa', 'estatua', 'queda']), F(0.75, ['edito', 'coroa', 'queda'], { grito: 'PELA FORÇA DO MEU PODER!' }), F(0.5, ['estatua', 'edito', 'coroa', 'queda'], { grito: 'PARA GLÓRIA DA MINHA MAJESTADE!' }), F(0.25, ['queda', 'edito', 'estatua', 'coroa'], { grito: 'QUEM ME DIRÁ: QUE FAZES?', escuro: 0.35 })],
    dica: '"Aos que andam na soberba ele pode humilhar" (Dn 4:37). Quando ele despenca do trono, fica ao alcance. Na faixa do edito, ache a brecha.' },
  /* ---------- chefes do mundo ---------- */
  golias: { vida: 1250, pressa: 0.7, r: 52, arena: 'vale', vel: 66, regras: { armadura: 0.1 },
    golpes: { lanca: { alcance: 230 }, lanca2: { fn: 'lanca', alcance: 240, repete: 1 }, escudeiro: {}, dardo: {}, desafio: {} },
    fases: [F(1, ['lanca', 'dardo', 'escudeiro']), F(0.6, ['desafio', 'lanca', 'escudeiro', 'dardo'], { grito: 'SOU EU ALGUM CÃO?' }), F(0.3, ['lanca2', 'dardo', 'escudeiro', 'lanca'], { grito: 'GOLIAS AVANÇA!' })],
    dica: 'A armadura absorve quase tudo. De tempos em tempos uma pedra lisa aparece num canto do vale: apanhe, MIRE e golpeie para arremessar. É uma chance só; na testa, o gigante cambaleia (1Sm 17:49). A defesa perfeita contra a lança também expõe a testa.' },
  behemote: { vida: 3600, dano: 2, pressa: 0.5, r: 104, arena: 'savana', vel: 46, regras: { casco: 0.3 },
    golpes: { investida: { vel: 640, repete: 1, tonto: 2.6 }, investida2: { fn: 'investida', vel: 700, repete: 2, tonto: 2.6 }, terremoto: {}, cauda: {}, rio: {} },
    fases: [F(1, ['investida', 'terremoto', 'cauda']), F(0.5, ['investida2', 'rio', 'terremoto', 'cauda'], { grito: 'O CHÃO TREME!' })],
    dica: 'Os ossos dele são como tubos de bronze (Jó 40:18). Faça-o bater na parede: tonto, o casco se abre. Quando ele beber o rio, saia da frente.' },
  leviata: { vida: 3300, dano: 2, pressa: 0.45, r: 82, regras: { armadura: 0.45 }, arena: 'alta', voa: 60, vel: 150,
    golpes: { emergir: {}, tochas: {}, fumaca: {}, redemoinho: {} },
    fases: [F(1, ['emergir', 'tochas', 'fumaca']), F(0.6, ['redemoinho', 'emergir', 'tochas', 'fumaca'], { grito: 'A MARÉ SE ERGUE!' }), F(0.3, ['emergir', 'redemoinho', 'tochas', 'emergir', 'fumaca'], { grito: 'O MAR FERVE!' })],
    dica: '"Poderás tirar com anzol o Leviatã?" (Jó 41:1). Ele só fica ao alcance logo depois de emergir: a couraça abre.' }
};

const golpeDe = (b, nome) => { const def = b.c.golpes[nome]; return ESTILOS[b.id]?.golpes[def?.fn || nome]; };

export function novoChefe(id, A, dif) {
  const c = CHEFES[id], d = BOSSES[id] || { nome: id };
  const hp = Math.round(c.vida * (c.parte ? 1 : dif.hp));
  return { kind: 'chefe', id, c, d, x: clamp(A.cx + 250, A.x0 + 80, A.x1 - 80), y: A.chao - (c.voa || 0), vx: 0, vy: 0, w: c.r * 1.5, h: c.r * 2.1, r: c.r, hp, max: hp, fase: 0, post: 0, postT: 0, quebrado: 0,
    mov: null, idx: 0, espera: 1.8, flash: 0, face: -1, voa: !!c.voa, exposto: 0, clones: [], furia: 0, semDano: 0, alpha: 1, raios: null, tonto: 0, ultimoGolpe: 0, t: 0, recentes: [], cen: {},
    art: { id, d, r: c.r, x: 0, y: 0, flash: 0, stun: 0, hp, max: hp, spd: c.vel || 60 } };
}

// A inteligência: o próximo golpe é escolhido pela situação (distância, você no ar, de costas…), nunca o mesmo duas vezes
// seguidas e evitando os dois últimos quando há opção. Assim não há padrão para decorar: há leitura de avisos.
function escolher(G, b, f) {
  const E = ESTILOS[b.id], lista = [...new Set(f.golpes)], fora = new Set(b.recentes.slice(-(lista.length > 3 ? 2 : 1)));
  const cand = lista.filter(n => !fora.has(n)), pesos = cand.map(n => Math.max(0, (E.pref?.[b.c.golpes[n]?.fn || n]?.(G, b) ?? 1)) + 0.05);
  let r = rand(0, pesos.reduce((a, c) => a + c, 0)), nome = cand[0];
  for (let i = 0; i < cand.length; i++) { r -= pesos[i]; if (r <= 0) { nome = cand[i]; break; } }
  b.recentes.push(nome); if (b.recentes.length > 4) b.recentes.shift();
  return nome;
}

// O instinto de todo chefe (vale para todos, menos o Conselho, que some entre os golpes):
//  • quem fica em cima da cabeça, quica nela ou gruda no corpo é AGARRADO: um "!" curto (dá para escapar com o passo ou
//    saindo de perto), depois o chefe segura o peregrino no alto e o ARREMESSA longe, tirando um fôlego que não se defende;
//  • entre um golpe e outro, de vez em quando, uma INVESTIDA curta na sua direção (o corpo do chefe fere).
function instinto(G, b, dt) {
  const p = G.p, A = G.N.arena, ag = b.agarra;
  if (b.agarraCd > 0) b.agarraCd -= dt; if (b.investeCd > 0) b.investeCd -= dt;
  if (ag) {
    ag.t += dt; b.vx = 0; b.art.step = 1;
    if (ag.e === 0) { b.tele = 1;
      if (ag.t > 0.26 * G.dif.aviso / 0.8) {
        const perto = !p.morto && !(p.dashT > 0) && Math.abs(p.x - b.x - (b.hb?.dx || 0)) < (b.hb?.w ?? b.w) * 0.6 + 50 && p.y < b.y + 20 && p.y > (b.hb ? b.y + b.hb.y0 : b.y - b.h) - 150;
        if (!perto) { b.agarra = null; b.espera = Math.min(b.espera, 0.12); G.textoEm?.(b.x, b.y - b.h - 18, 'escapou', '#C9D2E8', 11); return false; } // escapou: o chefe emenda logo
        ag.e = 1; ag.t = 0; ag.dir = Math.sign(p.x - b.x) || (Math.random() < 0.5 ? -1 : 1); sfx('block'); G.tremor(7); G.hitstop = 0.08; G.textoEm?.(b.x, b.y - b.h - 34, 'AGARROU!', '#FF6A5A', 17);
      }
      return true;
    }
    p.x = clamp(b.x + ag.dir * 6, A.x0 + 20, A.x1 - 20); p.y = (b.hb ? b.y + b.hb.y0 : b.y - b.h) - 4; p.vx = p.vy = 0; p.chao = false; p.stunT = Math.max(p.stunT || 0, 0.12); ataca(b);
    if (ag.t > 0.42) { b.agarra = null; b.espera = 0.3; p.inv = 0; G.ferirHeroi?.(1, b, { semDefesa: true }); p.stunT = 0.45; p.travaX = 0.7; p.vx = ag.dir * 1000; p.vy = -560; p.chao = false; p.pogo = false; sfx('swing'); G.tremor(11); G.fx.po(b.x, b.y - b.h, 14, '#FF8A7A'); }
    return true;
  }
  if (b.investe) { const v = b.investe; v.t += dt; b.vx = 0;
    if (v.t < 0.24 * G.dif.aviso / 0.8) { b.tele = 1; b.face = v.d; return true; }
    b.x = clamp(b.x + v.d * 600 * G.dif.vel * dt, A.x0 + b.w / 2, A.x1 - b.w / 2); ataca(b); if (Math.random() < dt * 30) G.fx.po(b.x - v.d * b.w * 0.4, b.y - 6, 2, b.d.cor || '#fff');
    if (v.t > 0.24 * G.dif.aviso / 0.8 + 0.34) b.investe = null; return true; }
  if (G.p !== G.eu || p.morto) return false;
  const bw = b.hb?.w ?? b.w, bh = b.hb?.h ?? b.h, topo = b.hb ? b.y + b.hb.y0 : b.y - b.h, bx = b.x + (b.hb?.dx || 0); // o tamanho real do desenho
  const emCima = !p.chao && Math.abs(p.x - bx) < bw * 0.6 + 34 && p.y < topo + bh * 0.45 && p.y > topo - 280;
  b.cimaT = emCima ? (b.cimaT || 0) + dt : Math.max(0, (b.cimaT || 0) - dt * 2);
  const colado = p.chao && Math.abs(p.x - bx) < bw * 0.5 + 56 && Math.abs(p.y - b.y) < 90;
  b.coladoT = colado ? (b.coladoT || 0) + dt : Math.max(0, (b.coladoT || 0) - dt);
  if ((b.cimaT > 0.5 || (b.pogoN || 0) >= 2 || b.coladoT > 1.5) && !(b.agarraCd > 0)) {
    if (b.mov) { b.mov = null; desfazer(G, b); }
    b.agarra = { t: 0, e: 0 }; b.agarraCd = 3; b.cimaT = b.coladoT = b.pogoN = 0; G.textoEm?.(b.x, b.y - b.h - 20, '!', '#FF6A5A', 24); sfx('wrong'); return true;
  }
  if (!b.mov && b.espera > 0.4 && !(b.investeCd > 0) && Math.abs(p.x - b.x) > 150 && Math.random() < dt * (0.7 + b.fase * 0.4)) { b.investe = { t: 0, d: Math.sign(p.x - b.x) || 1 }; b.investeCd = 2.6; sfx('dodge'); return true; }
  return false;
}
// O peso de cada chefe, medido pelo tamanho real do desenho, pela armadura e pela lentidão:
//   resiste = quanto de cada golpe ele sente (corpo grande, armadura e passo lento sentem menos);
//   pesado  = bate forte: cada acerto tira dois fôlegos.
export function tanque(b, area) {
  const def = Math.min(10, (b.d?.def ?? 4) === 99 ? 10 : b.d?.def ?? 4), vel = b.c.vel ?? (b.d?.spd ? b.d.spd / 2 : 80), regra = b.c.regras || {};
  const tam = clamp(Math.sqrt(area) / 85, 0.8, 3.2), arma = 1 + def * 0.035 + (regra.armadura != null || regra.casco != null ? 0.12 : 0), lento = vel < 60 ? 1.18 : vel < 90 ? 1.08 : 1;
  b.resiste = clamp(1 / (Math.pow(tam, 0.4) * arma * lento), 0.5, 1);
  b.pesado = !b.c.parte && (tam >= 1.3 || regra.armadura != null || regra.casco != null || (tam >= 1.1 && (def >= 6 || vel < 60)));
}
const ataca = b => { b.art.step = 2; b.art.artAttack = (b.art.artAttack || 0) + 1; };

export function atualizarChefe(G, b, dt) {
  const c = b.c, A = G.N.arena, E = ESTILOS[b.id];
  b.cen = b.cen || {}; b.recentes = b.recentes || [];
  b.t += dt; b.flash = Math.max(0, b.flash - dt); b.semDano = Math.max(0, b.semDano - dt); b.exposto = Math.max(0, b.exposto - dt); b.furia = Math.max(0, b.furia - dt);
  b.tele = 0; b.art.step = 0; b.perigo = false; if (b.pousou > 0) b.pousou -= dt; if (b.postImune > 0) b.postImune -= dt; if (b.guardaCd > 0) b.guardaCd -= dt;
  for (const cl of b.clones) cl.t -= dt;
  b.clones = b.clones.filter(cl => cl.t > 0);
  if (b.morrendo) { b.morrendo -= dt; b.vx = 0; desfazer(G, b); if (Math.random() < dt * 22) G.fx.po(b.x + rand(-b.w, b.w) / 2, b.y - rand(0, b.h), 3, b.d.cor || '#fff'); if (b.morrendo <= 0) G.chefeCaiu(b); return; }
  E?.palco?.(G, b, dt); // o cenário muda durante a luta
  // postura
  b.postT -= dt; if (b.postT <= 0 && b.post > 0 && b.quebrado <= 0) b.post = Math.max(0, b.post - 9 * dt);
  const parado = b.quebrado > 0 || b.tonto > 0;
  if (parado) {
    if (b.mov) { b.mov = null; desfazer(G, b); }
    b.quebrado -= dt; b.tonto -= dt; b.vx = 0; b.alpha = 1;
    if (b.voa) b.y = Math.min(A.chao, b.y + 520 * dt);
    if (b.quebrado <= 0 && b.tonto <= 0) { b.post = 0; b.espera = 0.2; b.postImune = 8; b.furia = Math.max(b.furia, 4); } // levanta logo, irado, e por um tempo a postura não quebra de novo
  } else {
    // virada de fase: grito, escuridão e a acusação
    let nf = 0; c.fases.forEach((f, i) => { if (b.hp / b.max <= f.vida) nf = i; });
    if (nf > b.fase) {
      b.fase = nf; const f = c.fases[nf]; b.mov = null; desfazer(G, b); b.idx = 0; b.espera = 1.4; b.recentes = [];
      G.limparPerigos(); if (f.grito) G.grito(f.grito); G.tremor(10); sfx('boss'); G.clarao = 0.15;
      G.estaEscrito(b);
      return;
    }
    const f = c.fases[b.fase];
    if (!c.parte && b.id !== 'conselho' && !(b.alpha < 0.5) && instinto(G, b, dt)) return;
    if (!b.mov || b.mov.nome !== 'trevas') G.escuroAlvo = f.escuro ?? c.escuro ?? 0;
    if (!b.mov) {
      b.espera -= dt;
      E.mover(G, b, dt); // entre os golpes, cada um se move do seu jeito
      if (b.espera <= 0) { const nome = escolher(G, b, f); b.mov = { nome, def: c.golpes[nome], t: 0, e: 0 }; b.idx++; }
    } else {
      const m = b.mov, fn = golpeDe(b, m.nome), fim = !fn || fn(G, b, m, dt) || m.t > 12; m.t += dt;
      if (fim) { b.mov = null; desfazer(G, b); b.espera = (m.def.espera ?? 1.05) * G.dif.ritmo * (c.pressa || 1) * (b.fase ? 0.85 : 1) * (b.furia > 0 ? 0.7 : 1) * 0.78; if (!c.voa1 && b.id !== 'conselho' && !c.parte && Math.random() < 0.34 + b.fase * 0.15) b.espera = 0.15; } // às vezes emenda um golpe no outro
    }
    // regras passivas
    // quem não é vencido de vez se refaz: a cura é o tempo todo e forte, mas só dentro da barra atual (a que já caiu não volta)
    if (c.regras?.regenera) { const r = c.regras.regenera, teto = b.max * c.fases[b.fase].vida; b.semGolpe = (b.semGolpe || 0) + dt; const folga = b.semGolpe > r.apos; if (b.hp < teto) { b.hp = Math.min(teto, b.hp + b.max * (folga ? r.taxa : r.sempre || 0) * dt); if (Math.random() < dt * (folga ? 9 : 3)) G.fx.sobe(b.x + rand(-20, 20), b.y - 30, 1, '#A5CDCE'); if (folga && !G.viuCura) { G.viuCura = true; G.fala(b, 'Cada “depois eu faço” me alimenta… eu me refaço!'); } } }
  }
  // física
  if (b.voa) { b.x = clamp(b.x + b.vx * dt, A.x0 + b.w / 2, A.x1 - b.w / 2); }
  else { b.vy = Math.min(1100, b.vy + 2050 * dt); mover(G.N, b, dt); b.x = clamp(b.x, A.x0 + b.w / 2, A.x1 - b.w / 2); if (b.x <= A.x0 + b.w / 2 + 1) b.parede = -1; else if (b.x >= A.x1 - b.w / 2 - 1) b.parede = 1; }
}

export function desenharChefe(g, b, Tm, G) {
  const a = b.art, s = b.r / 40;
  Object.assign(a, { x: b.x, y: b.y - 37 * s, flash: b.flash, stun: b.quebrado > 0 || b.tonto > 0 ? 1 : 0, hp: b.hp, max: b.max, alpha: b.alpha, act: b.mov ? b.mov.nome : null, exposto: b.exposto > 0 ? 1 : 0, lancaA: b.face > 0 ? 0 : Math.PI });
  // raios do relógio
  if (b.raios) { const r = b.raios, cx = b.x, cy = b.y - b.h * 0.55; g.save(); g.lineCap = 'round'; for (let i = 0; i < r.n; i++) { const an = r.a + i * TAU / r.n; g.beginPath(); g.moveTo(cx + Math.cos(an) * 30, cy + Math.sin(an) * 30); g.lineTo(cx + Math.cos(an) * r.len, cy + Math.sin(an) * r.len); if (r.aviso > 0) { g.strokeStyle = 'rgba(165,205,206,.35)'; g.lineWidth = 2; g.setLineDash([8, 8]); } else { g.strokeStyle = 'rgba(210,240,240,.95)'; g.lineWidth = 9; g.shadowColor = '#A5CDCE'; g.shadowBlur = 16; } g.stroke(); } g.restore(); }
  if (b.encanta) { g.save(); g.strokeStyle = 'rgba(255,143,184,.5)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const rr = 340 - ((Tm * 150 + i * 110) % 330); g.beginPath(); g.arc(b.x, b.y - b.h / 2, rr, 0, TAU); g.stroke(); } g.restore(); }
  const luz = G.p.lamp ? G.raioLuz() : 0;
  for (const cl of b.clones) { const ca = cl.art; Object.assign(ca, a, { x: cl.x, y: cl.y - 37 * s }); const naLuz = luz && Math.hypot(cl.x - G.p.x, cl.y - G.p.y) < luz; ca.alpha = cl.alpha * (naLuz ? 0.22 + 0.12 * Math.sin(Tm * 40) : 1) * Math.min(1, cl.t * 2); drawBoss(g, ca, Tm); }
  g.save(); if (b.face > 0 && !b.c.semVirar) { g.translate(b.x, 0); g.scale(-1, 1); g.translate(-b.x, 0); }
  drawBoss(g, a, Tm); g.restore();
  if (b.exposto > 0) { g.save(); g.strokeStyle = '#FFE9A8'; g.lineWidth = 2.5; g.globalAlpha = 0.6 + 0.4 * Math.sin(Tm * 14); g.beginPath(); g.arc(b.x, b.y - b.h * 0.86, 15, 0, TAU); g.stroke(); g.restore(); }
  if (b.quebrado > 0 || b.tonto > 0) for (let i = 0; i < 3; i++) { const an = Tm * 4 + i * TAU / 3; g.fillStyle = '#FFE9A8'; g.beginPath(); g.arc(b.x + Math.cos(an) * 24, b.y - b.h - 8 + Math.sin(an) * 6, 3, 0, TAU); g.fill(); }
}

// dano que o chefe realmente recebe de um golpe
export function danoNoChefe(b, dano, origem) {
  const r = b.c.regras || {};
  let m = 1;
  if (b.quebrado > 0) m = 1;
  else if (r.armadura != null) m = b.exposto > 0 ? 3 : dano > 150 ? 1 : r.armadura; // arpão e golpes muito fortes atravessam a couraça
  else if (r.casco != null) m = b.tonto > 0 ? 1.5 : r.casco;
  else if (b.exposto > 0) m = 1.8;
  return dano * m * (origem === 'funda' && b.exposto > 0 ? 1.5 : 1);
}
