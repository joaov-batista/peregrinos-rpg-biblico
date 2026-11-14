// Ícones em pixel art para os botões de toque e o menu (no lugar dos emojis).
import { Sprite, cor, rampa, TINTA } from './raster.js';
const O = cor('#FFE08A'), o = cor('#C9862B'), W = cor('#FFFBE6'), B = cor('#E8E2CF'), b = cor('#9FB0C0'), R = cor('#FF9A3C');
const DESENHOS = {
  pular: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWWWWWWW..', '.....WW.....', '.....WW.....', '.....WW.....', '.....BB.....', '............', '..BBBBBBBB..'],
  passo: ['............', '.W...W...W..', '..W...W...W.', '...W...W...W', '..W...W...W.', '.W...W...W..', '............'],
  lampada: ['.....R......', '....RO......', '....OW......', '.....O......', '..ooooooo...', '.oOOOOOOOoo.', 'oOOOOOOOOOoo', '.oOOOOOOoo.o', '..ooooooo...', '...oooo.....'],
  orar: ['.....WW.....', '.....WW.....', '....WBBW....', '....WBBW....', '...WWBBWW...', '...WBBBBW...', '...WBBBBW...', '....WBBW....', '....bBBb....', '...bb..bb...'],
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
  ancora: ['....OOO....', '....O.O....', '....OOO....', '.....O.....', '..OOOOOOO..', '.....O.....', 'O....O....O', 'OO...O...OO', '.OO..O..OO.', '..OOOOOOO..'],
  estrela: ['.....O.....', '.....W.....', '....OWO....', 'OOOOWWWOOOO', '..OOWWWOO..', '...OOWOO...', '..OO...OO..', '.OO.....OO.'],
  barquinho: ['.....O.....', '.....OW....', '.....OWW...', '.....OWWW..', '.....O.....', 'oOOOOOOOOOo', '.oOOOOOOOo.', '..ooooooo..'],
  flor: ['...O...O...', '..OWO.OWO..', '...OOWOO...', '..OOWWWOO..', '...OOWOO...', '..OWO.OWO..', '...O.o.O...', '.....o.....', '....oo.....']
};
// item → [desenho, cor]
const DE = {
  arma: ['espada', '#B8D0E0'], denarios: ['moeda', '#D9A63C'], mana: ['pao', '#F0DDA8'], pedras: ['gema', '#B9B4A2'],
  firmeza: ['cinto', '#D9A63C'], calcados: ['sandalia', '#D9A63C'], couraca: ['couraca', '#D9A63C'], escudo: ['escudo', '#D9A63C'], asas: ['capacete', '#D9A63C'], espada: ['espada', '#FFE08A'],
  perola_preco: ['perola', '#E9E6DC'], talento_multiplicado: ['moeda', '#E8C24A'], tunica_sem_costura: ['tunica', '#C8C9BC'], bussola_chamado: ['bussola', '#79D9CD'], manto_marinheiro: ['manto', '#4A6A86'],
  lamparina_abismo: ['candeia', '#D99A3C'], sandalias_mensageiro: ['sandalia', '#C9A45C'], cinto_compaixao: ['cinto', '#B03A5A'], selo_misericordia: ['pomba', '#E9E6DC'], anel_beltessazar: ['anel', '#D9A63C'],
  cepa_raizes: ['cepa', '#8A6A44'], tijolo_humilde: ['tijolo', '#B8744C'], orvalho_ceu: ['gota', '#8FE8FF'], olhos_ceu: ['olho', '#8FB6D6'], coroa_restituida: ['coroa', '#E8C24A'], pedra_lisa: ['gema', '#C9C4B2'],
  osso_bronze: ['osso', '#C08A4A'], escama_leviata: ['escama', '#2F8F9A'], purpura_lidia: ['manto', '#8A4FA0'], odre_novo: ['odre', '#9A6A44'], cinco_paes: ['pao', '#C9A86A'],
  chifre_azeite: ['chifre', '#E8C24A'], oleo_viuva: ['vaso', '#C98A4E'], manto_elias: ['manto', '#7A5A3A'], pena_aguia: ['pena', '#E9E6DC'], cabelo_sansao: ['tranca', '#6B4A2E'],
  brasa_altar: ['fogo', '#FF6A2A'], jarro_gideao: ['vaso', '#B8744C'], pedra_angular: ['tijolo', '#C9C4B2'], sal_terra: ['sal', '#E9E6DC'], semente_mostarda: ['semente', '#B8D06A'],
  vaso_alabastro: ['vaso', '#F0E6D8'], lenco_paulo: ['lenco', '#E9E6DC'], porcao_dobrada: ['espiral', '#FFC94A'], aljava_jonatas: ['flecha', '#C9A06A'], mana_deserto: ['odre', '#F0DDA8'],
  ancora_esperanca: ['ancora', '#9FB0C0'], vela_paulo: ['barquinho', '#E8E2CF'], estrela_magos: ['estrela', '#FFE08A'], veste_branca: ['tunica', '#F4F1E6'],
  vara_florida: ['flor', '#F2B8D0'], cantico_novo: ['onda', '#E8C24A'], pomba_jordao: ['pomba', '#FFF4CF'],
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

// ícone de uma arma (tipo da vocação), na cor da lâmina da variação
const ARMA_DESENHO = { espada: 'espada', adaga: 'adaga', lanca: 'lanca', cajado: 'cajado', trombeta: 'trombeta', funda: 'funda', chicote: 'chicote' };
export function iconeArma(tipo, lamina, tam = 30) {
  const chave = 'arma:' + tipo + ':' + (lamina || ''); let cv0 = prontos.get(chave);
  if (!cv0) { const g = ITENS[ARMA_DESENHO[tipo] || 'espada'], r = rampa(lamina || '#B8D0E0'), s = new Sprite(13, 12); s.carimbo(g, 1, 1 + ((10 - g.length) >> 1), { O: r[3], o: rampa('#8A623C')[2], W: r[4] }); s.contorno(TINTA); cv0 = s.tela(); prontos.set(chave, cv0); }
  const cv = document.createElement('canvas'); cv.width = cv0.width; cv.height = cv0.height; cv.getContext('2d').drawImage(cv0, 0, 0);
  cv.style.cssText = `width:${tam}px;height:${Math.round(tam * 12 / 13)}px;image-rendering:pixelated;pointer-events:none`; cv.className = 'ico-px';
  return cv;
}
