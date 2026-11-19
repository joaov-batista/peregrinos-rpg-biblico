// Ícones em pixel art para os botões de toque e o menu (no lugar dos emojis).
import { Sprite, cor, rampa, TINTA } from './raster.js';
const O = cor('#FFE08A'), o = cor('#C9862B'), W = cor('#FFFBE6'), B = cor('#E8E2CF'), b = cor('#9FB0C0'), R = cor('#FF9A3C');
const DESENHOS = {
  pular: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWWWWWWW..', '.....WW.....', '.....WW.....', '.....WW.....', '.....BB.....', '............', '..BBBBBBBB..'],
  passo: ['............', '.W...W...W..', '..W...W...W.', '...W...W...W', '..W...W...W.', '.W...W...W..', '............'],
  lampada: ['.....R......', '....RO......', '....OW......', '.....O......', '..ooooooo...', '.oOOOOOOOoo.', 'oOOOOOOOOOoo', '.oOOOOOOoo.o', '..ooooooo...', '...oooo.....'],
  orar: ['.....WW.....', '.....WW.....', '....WBBW....', '....WBBW....', '...WWBBWW...', '...WBBBBW...', '...WBBBBW...', '....WBBW....', '....bBBb....', '...bb..bb...'],
  devagar: ['....WW......', '....WW......', '...WBBW.....', '..W.BB.W....', '....BB......', '....BB......', '...B..B.....', '..B....B....', '............', '.b..b..b..b.'],
  menu: ['WWWWWWWWWW', 'BBBBBBBBBB', '..........', 'WWWWWWWWWW', 'BBBBBBBBBB', '..........', 'WWWWWWWWWW', 'BBBBBBBBBB']
};
export function iconePx(nome, tam = 30) {
  const d = DESENHOS[nome]; if (!d) return document.createTextNode('');
  const s = new Sprite(d[0].length + 2, d.length + 2); s.carimbo(d, 1, 1, { W, B, b, O, o, R }); s.contorno(TINTA);
  const cv = s.tela(); cv.style.cssText = `width:${tam}px;height:${Math.round(tam * cv.height / cv.width)}px;image-rendering:pixelated;pointer-events:none`;
  return cv;
}

// ---- ícones do inventário: poucos desenhos (11×10), cada item com a sua cor ----
const ITENS = {
  espada: ['.........WW', '........WOO', '.......WOO.', '......WOO..', '.....WOO...', '.o..WOO....', '..oWOO.....', '..ooo......', '.o..o......', 'o....o.....'],
  escudo: ['.OOOOOOOOO.', 'OWWOOOOOOoO', 'OWOOOOOOOoO', 'OWOOOOOOOoO', 'OOOOOOOOOoO', '.OOOOOOOoO.', '.OOOOOOOoO.', '..OOOOOoO..', '...OOOoO...', '....OoO....'],
  capacete: ['...OOOOO...', '..OWWOOOO..', '.OWOOOOOOO.', '.OWOOOOOOo.', '.OOOOOOOOo.', '.OO.ooo.Oo.', '.OO.....Oo.', '.Oo.....oo.'],
  couraca: ['.OO.....OO.', 'OOOO...OOOO', 'OWOOOOOOOoO', '.OWOOOOOoO.', '.OWOOOOOoO.', '.OOOOOOOoO.', '.OOOOOOOoO.', '..OOOOOoO..', '..ooooooo..'],
  cinto: ['OOOOOOOOOOO', 'OWWOoWoOOOo', 'OOOOoWoOOOo', 'ooooooooooo', '....OO.....', '....Oo.....', '....Oo.....'],
  sandalia: ['..o...o....', '..oO..oO...', '..oO..oO...', '.OOOOOOOOO.', 'OWOOOOOOOOo', 'OOOOOOOOOOo', '.ooooooooo.'],
  moeda: ['...OOOOO...', '..OWWOOOo..', '.OWOOOOOOo.', '.OWOOoOOOo.', '.OOOooOOOo.', '.OOOOoOOOo.', '.OOOOOOOOo.', '..OOOOOOo..', '...ooooo...'],
  gema: ['....OOO....', '..OOWWOOO..', '.OWWOOOOOo.', '.OWOOOOOOo.', '.OOOOOOOoo.', '..OOOOOoo..', '...ooooo...'],
  manto: ['...OO.OO...', '..OOOOOOO..', '.OWOOOOOOo.', '.OWOOOOOOo.', '.OWOOOOOOo.', 'OOWOOOOOOoo', 'OOOOOOOOOoo', 'OOOOOOOOOoo', 'o.oo.oo.oo.'],
  candeia: ['.....W.....', '....WO.....', '....OW.....', '.....O.....', '..ooooooo..', '.oOOOOOOOoo', 'oOWOOOOOOOo', '.oOOOOOOoo.', '..ooooooo..'],
  anel: ['....WW.....', '...WOOW....', '....OO.....', '..OOOOOO...', '.OO....OO..', '.O......Oo.', '.O......Oo.', '.OO....Ooo.', '..OOOOOoo..', '...oooo....'],
  coroa: ['.O...O...O.', '.OO.OOO.OO.', '.OOOOOOOOO.', '.OWOOWOOWO.', '.OOOOOOOOO.', '.ooooooooo.'],
  gota: ['.....O.....', '....OO.....', '....OWO....', '...OWOOO...', '..OWOOOOo..', '..OOOOOOo..', '..OOOOOoo..', '...OOooo...', '....ooo....'],
  olho: ['..OOOOOOO..', '.OWWWWWWWO.', 'OWWWoooWWWO', 'OWWoooooWWO', 'OWWWoooWWWO', '.OWWWWWWWO.', '..OOOOOOO..'],
  osso: ['OO.......OO', 'OOO.....OOO', '.OOO...OOO.', '..OWOOOOO..', '...OWOOO...', '..OOOOOWO..', '.OOO...OOO.', 'OOO.....OOO', 'OO.......OO'],
  escama: ['....OOO....', '...OWOOO...', '..OWOOOOO..', '.OWOOOOOOo.', '.OOOOOOOOo.', '.OOOOOOOoo.', '..OOOOOoo..', '...OOOoo...', '....ooo....'],
  pao: ['..OOOOOOO..', '.OWWOOOOOO.', 'OWOOoOOoOOo', 'OOOOoOOoOOo', 'OOOOOOOOOOo', '.ooooooooo.'],
  odre: ['....OOO....', '....ooo....', '...OOOOO...', '..OWOOOOO..', '.OWOOOOOOo.', '.OWOOOOOOo.', '.OOOOOOOoo.', '..OOOOOoo..', '...ooooo...'],
  bussola: ['...OOOOO...', '..O.....O..', '.O...W...O.', '.O..WW...O.', '.O...OO..O.', '.O...oo..O.', '.O...o...O.', '..O.....O..', '...OOOOO...'],
  pomba: ['.......OO..', '..OO..OOOW.', '.OOOO.OOOO.', 'OOOOOOOOO..', '.OWOOOOO...', '..OOOOOO...', '...OOOO....', '....OO.....'],
  tijolo: ['OOOOO.OOOOO', 'OWOOo.OWOOo', 'ooooo.ooooo', '...........', 'OO.OOOOO.OO', 'Oo.OWOOo.Oo', 'oo.ooooo.oo'],
  cepa: ['.....W.....', '....WOW....', '.....O.....', '..OOOOOOO..', '.OWOOoOOOo.', '.OWOoOoOOo.', '.OOOOoOOOo.', '.OOOOOOOOo.', '.ooooooooo.'],
  tunica: ['.OOO...OOO.', 'OOOOO.OOOOO', 'OWOOOOOOOoO', '.OWOOOOOoO.', '..OOOOOOo..', '..OWOOOOo..', '..OWOOOOo..', '..OOOOOOo..', '..ooooooo..'],
  perola: ['...OOOOO...', '..OWWOOOO..', '.OWWOOOOOo.', '.OWOOOOOOo.', '.OOOOOOOoo.', '..OOOOOoo..', '...ooooo...'],
  fogo: ['.....O.....', '....OO.....', '....OOO.O..', '..O.OWOOO..', '..OOOWWOO..', '.OOOWWWOOO.', '.OOWWWWWOO.', '.OOOWWWOOo.', '..OOOOOOo..', '...ooooo...'],
  raio: ['......OOO..', '.....OWO...', '....OWO....', '...OWOOOO..', '..OOOOWO...', '.....OWO...', '....OWO....', '...OWO.....', '...OO......', '...o.......'],
  onda: ['...OO......', '..OWWO...OO', '.OW..OO.OWW', 'OO....OOO..', '...OO......', '..OWWO...OO', '.OW..OO.OWW', 'OO....OOO..'],
  vento: ['..OOOO.....', '.O....O....', '......O.OO.', 'OOOOOOO...O', '..........O', 'OOOOOOOOOO.', '.......O...', '..O....O...', '...OOOO....'],
  adaga: ['..........W', '.........WO', '........WO.', '.......WO..', '..o..WOO...', '...oWO.....', '...oo......', '..o..o.....', '.o.........'],
  lanca: ['.........WW', '........WOO', '.......oOO.', '......o.O..', '.....o.....', '....o......', '...o.......', '..o........', '.o.........', 'o..........'],
  cajado: ['......OOO..', '.....O.WO..', '.....O.OO..', '......oO...', '......o....', '.....o.....', '....o......', '...o.......', '..o........', '.o.........'],
  trombeta: ['.........OO', '........OWO', '.......OOOO', 'oo...OOOOO.', 'OOooOOOO...', 'oOOOOO.....', '..oo.......'],
  funda: ['o.........o', '.o.......o.', '..o.....o..', '...o...o...', '....OWO....', '...OOOOo...', '....ooo....'],
  chicote: ['oo.........', 'Ooo........', '.oO..OOO...', '..oOOO..O..', '.......O...', '......O..O.', '.......OOO.'],
  chifre: ['.........OO', '.......OOWO', '.....OOOOo.', '...OOOOo...', '..OWOo.....', '.OOo.......', 'OOo........', 'Oo.........'],
  pena: ['........OO.', '.......OWO.', '......OWOO.', '.....OWOo..', '....OWOo...', '...OWOo....', '..OOOo.....', '.oOo.......', 'o..........'],
  tranca: ['...OO......', '..OWWO.....', '...OOOO....', '....OWOO...', '...OOOO....', '..OOWO.....', '...OOOO....', '....OOO....', '.....o.....'],
  sal: ['...OOOOO...', '..OoOoOoO..', '..OOOOOOO..', '.OWWOOOOOo.', '.OWOOOOOOo.', '.OOOOOOOOo.', '..ooooooo..'],
  semente: ['.....W.....', '....WOW....', '.....O.....', '....OOO....', '...OWOOO...', '...OOOOo...', '....ooo....'],
  vaso: ['...OOOOO...', '....OOO....', '...OWOOO...', '..OWOOOOO..', '..OWOOOOo..', '..OOOOOOo..', '...OOOOo...', '....ooo....'],
  lenco: ['OOOOOOOOOOO', 'OWWOOOOOOoO', 'OWOOOOOOOoO', 'OOOOOOOOOoO', 'OOOOOOOOOoO', '.OOOOOOOOo.', '..o.o.o.o..'],
  espiral: ['...OOOOO...', '..O.....O..', '.O..OOO..O.', '.O.O...O.O.', '.O.O.W.O.O.', '.O..OO..O..', '..O.....O..', '...OOOO....'],
  flecha: ['........WWO', '.......WOO.', '..o...WO...', '...oOWO....', '....OO.....', '...oOo.....', '..o..o.....', '.o.........'],
  peixe: ['...........', '.....OO....', '..OOOWOO.Oo', '.OWOOOOOOoO', 'OOOoOOOOOo.', '.OOOOOOOoO.', '..oOOOOo.Oo', '...........'],
  ancora: ['....OOO....', '....O.O....', '....OOO....', '.....O.....', '..OOOOOOO..', '.....O.....', 'O....O....O', 'OO...O...OO', '.OO..O..OO.', '..OOOOOOO..'],
  estrela: ['.....O.....', '.....W.....', '....OWO....', 'OOOOWWWOOOO', '..OOWWWOO..', '...OOWOO...', '..OO...OO..', '.OO.....OO.'],
  barquinho: ['.....O.....', '.....OW....', '.....OWW...', '.....OWWW..', '.....O.....', 'oOOOOOOOOOo', '.oOOOOOOOo.', '..ooooooo..'],
  cao: ['.........oo', '........OOO', '.......OOWo', 'o......OOO.', 'oOOOOOOOO..', '.OWWOOOOO..', '.OOOOOOOO..', '.O.O..O.O..', '.O.O..O.O..', '.o.o..o.o..'],
  leao: ['......ooo..', '.....oOOOo.', '....oOOWOOo', 'o...oOOOOo.', 'oOOOOOOOoo.', '.OWWOOOOO..', '.OOOOOOOO..', '.O.O..O.O..', '.O.O..O.O..', '.o.o..o.o..'],
  papagaio: ['....OOO....', '...OWWOO...', '...OOOOOo..', '..oOOOOO...', '..OOOOOO...', '..OOWOOO...', '...OOOO....', '....OOo....', '....OOo....', '...o..o....'],
  flor: ['...O...O...', '..OWO.OWO..', '...OOWOO...', '..OOWWWOO..', '...OOWOO...', '..OWO.OWO..', '...O.o.O...', '.....o.....', '....oo.....']
};
// item → [desenho, cor]
const DE = {
  arma: ['espada', '#B8D0E0'], denarios: ['moeda', '#D9A63C'], mana: ['pao', '#F0DDA8'], pedras: ['gema', '#B9B4A2'],
  pes_corca: ['sandalia', '#9FE0B0'], firmeza: ['cinto', '#D9A63C'],  calcados: ['sandalia', '#D9A63C'], couraca: ['couraca', '#D9A63C'], escudo: ['escudo', '#D9A63C'], asas: ['capacete', '#D9A63C'], espada: ['espada', '#FFE08A'],
  perola_preco: ['perola', '#E9E6DC'], talento_multiplicado: ['moeda', '#E8C24A'], tunica_sem_costura: ['tunica', '#C8C9BC'], bussola_chamado: ['bussola', '#79D9CD'], manto_marinheiro: ['manto', '#4A6A86'],
  lamparina_abismo: ['candeia', '#D99A3C'], sandalias_mensageiro: ['sandalia', '#C9A45C'], cinto_compaixao: ['cinto', '#B03A5A'], selo_misericordia: ['pomba', '#E9E6DC'], anel_beltessazar: ['anel', '#D9A63C'],
  cepa_raizes: ['cepa', '#8A6A44'], tijolo_humilde: ['tijolo', '#B8744C'], orvalho_ceu: ['gota', '#8FE8FF'], olhos_ceu: ['olho', '#8FB6D6'], coroa_restituida: ['coroa', '#E8C24A'], pedra_lisa: ['gema', '#C9C4B2'],
  osso_bronze: ['osso', '#C08A4A'], escama_leviata: ['escama', '#2F8F9A'], purpura_lidia: ['manto', '#8A4FA0'], odre_novo: ['odre', '#9A6A44'], cinco_paes: ['pao', '#C9A86A'],
  chifre_azeite: ['chifre', '#E8C24A'], oleo_viuva: ['vaso', '#C98A4E'], manto_elias: ['manto', '#7A5A3A'], pena_aguia: ['pena', '#E9E6DC'], cabelo_sansao: ['tranca', '#6B4A2E'],
  brasa_altar: ['fogo', '#FF6A2A'], jarro_gideao: ['vaso', '#B8744C'], pedra_angular: ['tijolo', '#C9C4B2'], sal_terra: ['sal', '#E9E6DC'], semente_mostarda: ['semente', '#B8D06A'],
  vaso_alabastro: ['vaso', '#F0E6D8'], lenco_paulo: ['lenco', '#E9E6DC'], porcao_dobrada: ['espiral', '#FFC94A'], aljava_jonatas: ['flecha', '#C9A06A'], mana_deserto: ['odre', '#F0DDA8'],
  oleo_nardo: ['vaso', '#D9A441'], oleo_hissopo: ['vaso', '#6FB35A'], oleo_mirra: ['vaso', '#9A2E3A'], oleo_canela: ['vaso', '#D2692E'], oleo_terra: ['vaso', '#C9B84A'], oleo_mar: ['vaso', '#3E8EC0'], oleo_balsamo: ['vaso', '#E08AA8'], oleo_alegria: ['vaso', '#F2E27A'],
  trigo: ['semente', '#E8C24A'], uva: ['perola', '#7A3A9A'], azeitona: ['gota', '#5A6A2A'], leite: ['vaso', '#F0EEE6'], ovo: ['perola', '#F2E6CC'], la: ['tunica', '#EDE8DC'], azeite: ['odre', '#C9B83A'], vinho: ['odre', '#7A1E3A'],
  lampada_vigia: ['candeia', '#FFE08A'], figo: ['gota', '#8E3B5E'], peixe: ['peixe', '#9FC8D8'], flor: ['flor', '#E86A8A'], mel: ['odre', '#E8B030'], pao: ['pao', '#D9A86A'],
    ancora_esperanca: ['ancora', '#9FB0C0'], vela_paulo: ['barquinho', '#E8E2CF'], estrela_magos: ['estrela', '#FFE08A'], veste_branca: ['tunica', '#F4F1E6'],
  vara_florida: ['flor', '#F2B8D0'], cantico_novo: ['onda', '#E8C24A'], pomba_jordao: ['pomba', '#FFF4CF'],
  pet_cachorro: ['cao', '#A8743E'], pet_leao: ['leao', '#D9A040'], pet_papagaio: ['papagaio', '#3FA85A'],
  tornado: ['fogo', '#FF8A2A'], raios: ['raio', '#FFE26B'], enchente: ['onda', '#5ED1E8'], vento: ['vento', '#BFF0F8'], espirito: ['pomba', '#FFE9A8']
};
const prontos = new Map();
export function iconeItem(id, tam = 30) {
  const d = DE[id]; if (!d) return document.createTextNode('◆');
  let cv0 = prontos.get(id);
  if (!cv0) { const g = ITENS[d[0]], r = rampa(d[1]), s = new Sprite(13, 12); s.carimbo(g, 1, 1 + ((10 - g.length) >> 1), { O: r[3], o: r[1], W: r[4] }); s.contorno(TINTA); cv0 = s.tela(); prontos.set(id, cv0); }
  const cv = document.createElement('canvas'); cv.width = cv0.width; cv.height = cv0.height; cv.getContext('2d').drawImage(cv0, 0, 0);
  cv.style.cssText = `width:${tam}px;height:${Math.round(tam * 12 / 13)}px;image-rendering:pixelated;pointer-events:none`; cv.className = 'ico-px';
  return cv;
}

// ícone de uma arma (tipo da vocação), na cor da lâmina da variação. As armas são as do tempo: o gládio romano,
// o pugio, a lança de ponta em folha, o cajado de pastor, o shofar (o chifre de carneiro), a funda de Davi e o chicote.
// Cada uma é desenhada por partes ao longo da diagonal (punho embaixo à esquerda, ponta em cima à direita), com
// luz do lado de cima, sombra do lado de baixo, sulco na lâmina e o punho de madeira com voltas de couro.
const S2 = Math.SQRT1_2;
function armaPx(tipo, lamina) {
  const s = new Sprite(18, 18), L = rampa(lamina || '#B8D0E0'), M = rampa('#8A5A34'), Ou = rampa('#C9A44A'), C = rampa('#6A4428'), Ch = rampa('#D8C49A'), P = rampa('#8E8A80');
  const eixo = (x, y, x0 = 3, y0 = 14) => [((x - x0) - (y - y0)) * S2, ((x - x0) + (y - y0)) * S2]; // u ao longo da arma, v para o lado (v < 0: lado da luz)
  const tons = (R, v, hw, sulco) => { if (sulco) return v < -hw + 0.8 ? R[4] : v > hw - 0.8 ? R[1] : Math.abs(v) < 0.4 ? R[2] : v < 0 ? R[3] : R[3]; const k = v / Math.max(0.6, hw); return k < -0.3 ? R[3] : k > 0.4 ? R[1] : R[2]; }; // lâmina: fio aceso em cima, fio escuro embaixo, sulco no meio
  const cada = fn => { for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) { const c = fn(x + 0.5, y + 0.5); if (c) s.px(x, y, c); } };
  const lamina_ = (u1, u2, hw0, ponta, folha) => (u, v) => { if (u < u1 || u > u2) return null; const t = (u - u1) / (u2 - u1), hw = folha ? hw0 * (0.75 + Math.sin(t * Math.PI) * 0.45) * (t > 0.8 ? (1 - t) / 0.2 : 1) : hw0 * (u > u2 - ponta ? (u2 - u) / ponta : 1); return Math.abs(v) <= hw + 0.15 ? tons(L, v, hw, true) : null; };
  const empunhadura = (u1, u2, hw = 0.8) => (u, v) => u >= u1 && u <= u2 && Math.abs(v) <= hw ? (Math.floor((u - u1) * 1.5) % 2 ? tons(C, v, hw) : tons(M, v, hw)) : null; // madeira com voltas de couro
  const guarda = (u0, hw, esp = 0.9) => (u, v) => Math.abs(u - u0) <= esp / 2 && Math.abs(v) <= hw ? (v < -hw * 0.3 ? Ou[4] : v < hw * 0.4 ? Ou[3] : Ou[1]) : null;
  const pomo = (u0, r) => (u, v) => (u - u0) ** 2 + v * v <= r * r ? ((u - u0) - v < -0.3 ? Ou[4] : (u - u0) + v > 0.6 ? Ou[1] : Ou[3]) : null;
  const juntar = (...ps) => (x, y) => { const [u, v] = eixo(x, y); for (const f of ps) { const c = f(u, v); if (c) return c; } return null; };
  if (tipo === 'adaga') cada(juntar(pomo(2.4, 1.6), guarda(5.8, 2.9, 1.4), empunhadura(3.4, 5.1, 1), lamina_(6.4, 14.6, 1.8, 0, true))); // o pugio: lâmina em folha, guarda e pomo largos
  else if (tipo === 'lanca') { cada(juntar((u, v) => u >= 12.6 && u <= 13.6 && Math.abs(v) <= 1 ? Ou[(u > 13.1) ? 3 : 2] : null, lamina_(13.6, 19.6, 1.9, 0, true), empunhadura(-3, 12.6, 0.85))); }
  else if (tipo === 'cajado') { // o cajado do pastor: a vara e a curva no alto
    const [cx, cy] = [13.4, 4.4]; cada((x, y) => { const [u, v] = eixo(x, y); if (u >= -3 && u <= 13 && Math.abs(v) <= 0.75) return tons(M, v, 0.75); const d = Math.hypot(x - cx, y - cy); if (d >= 1.6 && d <= 2.9 && (y < cy + 0.8 || x < cx - 0.5)) return d < 2.25 ? M[3] : M[1]; return null; }); }
  else if (tipo === 'trombeta') { // o shofar: o chifre de carneiro, curvo, com os anéis do chifre e o bocal escuro
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([2.5 + t * 12.5, 13.5 - t * 9 - Math.sin(t * Math.PI) * 3.2, 0.7 + t * t * 2.3]); }
    cada((x, y) => { let best = 1e9, bi = 0; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(x - pts[i][0], y - pts[i][1]) - pts[i][2]; if (d < best) { best = d; bi = i; } } if (best > 0.1) return null; const anel = bi % 5 === 0 && bi > 2 && bi < 38, borda = best > -0.7; if (bi > 37) return Ch[1]; return anel ? Ch[1] : borda ? (y < pts[bi][1] ? Ch[4] : Ch[2]) : Ch[3]; }); s.px(2, 13, C[0]); s.px(3, 13, C[1]); }
  else if (tipo === 'funda') { // a funda de Davi: duas cordas de couro, a bolsa e a pedra lisa do ribeiro
    const corda = (x0, y0, x1, y1, cai) => { for (let i = 0; i <= 30; i++) { const t = i / 30; s.px(Math.round(x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * cai), Math.round(y0 + (y1 - y0) * t), i % 3 ? C[3] : C[2]); } };
    corda(4, 2, 7, 11, -1.5); corda(8, 1, 10, 11, 1.2); s.px(3, 1, C[2]); s.px(4, 1, C[3]); s.px(5, 2, C[2]); s.px(3, 3, C[2]); // a laçada do dedo
    for (let y = 10; y <= 15; y++) for (let x = 5; x <= 13; x++) { const d = ((x - 9) / 4.2) ** 2 + ((y - 12.6) / 2.6) ** 2; if (d <= 1) s.px(x, y, d > 0.6 ? C[1] : y < 12 ? C[4] : C[3]); }
    for (let y = 10; y <= 13; y++) for (let x = 8; x <= 11; x++) { const d = ((x - 9.5) / 1.8) ** 2 + ((y - 11.4) / 1.5) ** 2; if (d <= 1) s.px(x, y, d < 0.3 && y < 11.5 ? P[4] : x < 9.5 ? P[3] : P[2]); } }
  else if (tipo === 'chicote') { // o cabo de couro trançado e a correia enrolada em laço
    cada(juntar(pomo(1.2, 1.3), empunhadura(1.9, 7.4, 0.95)));
    for (let i = 0; i <= 90; i++) { const t = i / 90, a = -0.8 + t * Math.PI * 2.1, r = 4.4 - t * 1.6, x = 11.2 + Math.cos(a) * r, y = 6.2 + Math.sin(a) * r * 0.85; s.px(Math.round(x), Math.round(y), t > 0.92 ? C[4] : (i >> 2) % 2 ? C[2] : C[3]); }
    for (let i = 0; i < 4; i++) s.px(8 + i, 10 - i, C[2]); } // a correia sai do cabo
  else cada(juntar(pomo(1.3, 1.75), guarda(5.1, 3.4, 1.5), empunhadura(2.4, 4.4, 1.05), lamina_(5.8, 17.2, 2.0, 3.2, false))); // o gládio: lâmina curta e larga, com sulco, a guarda e o pomo redondo
  s.contorno(TINTA); return s.tela();
}
export function iconeArma(tipo, lamina, tam = 30) {
  const chave = 'arma:' + tipo + ':' + (lamina || ''); let cv0 = prontos.get(chave);
  if (!cv0) { cv0 = armaPx(ARMAS_TIPOS.includes(tipo) ? tipo : 'espada', lamina); prontos.set(chave, cv0); }
  const cv = document.createElement('canvas'); cv.width = cv0.width; cv.height = cv0.height; cv.getContext('2d').drawImage(cv0, 0, 0);
  cv.style.cssText = `width:${tam}px;height:${tam}px;image-rendering:pixelated;pointer-events:none`; cv.className = 'ico-px';
  return cv;
}
const ARMAS_TIPOS = ['espada', 'adaga', 'lanca', 'cajado', 'trombeta', 'funda', 'chicote'];
