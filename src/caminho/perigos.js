// Cada fase tem o seu perigo e a sua sala marcante, ligados ao texto e ao chefe que ela guarda.
// O perigo cai de tempos em tempos perto do peregrino, sempre avisado (jogando juntos, só o dono sorteia e todos recebem).
// A sala marcante é desenhada à mão e entra no meio da fase; o resto da planta continua sorteado.
import { rand } from '../util.js';
import { sfx } from '../audio.js';

const cid = () => 'p' + Math.random().toString(36).slice(2, 9); // moeda maldita com a mesma identidade em todos os aparelhos
const aviso = (G, p, txt, cor) => G.textoEm(p.x, p.y - 84, txt, cor, 12);

// s = a sala onde o peregrino está: { x0, x1, y0, chao }
export const PERIGOS = {
  /* ---------- Corinto ---------- */
  mamom: { nome: 'chuva de ofertas', f(G, p, s) { // moedas caem do alto em colunas; apanhar pesa
    aviso(G, p, 'ofertas caem do alto…', '#FFD23F');
    for (let i = 0; i < 3; i++) G.zonas.push({ tipo: 'col', x: p.x + (i - 1) * 110 + rand(-20, 20), w: 44, aviso: 1 + i * 0.2, dur: 0.22, cor: '#FFD23F', y0: s.y0, y1: s.chao, tentacao: true, cid: cid() }); sfx('coin'); } },
  procrastinacao: { nome: 'o pêndulo', f(G, p, s) { // um pêndulo varre a sala na altura do peito, de um lado ao outro
    aviso(G, p, 'o pêndulo balança…', '#A5CDCE');
    const lado = Math.random() < 0.5 ? -1 : 1; G.tiros.push({ x: p.x - lado * 460, y: p.y - 34, vx: lado * 300, vy: 0, r: 14, vida: 3.2, cor: '#A5CDCE', tipo: 'bola', fura: true }); sfx('swing'); } },
  mentira: { nome: 'o reflexo', f(G, p, s) { // o seu reflexo corre rente ao chão, vindo do lado de onde você NÃO olha
    aviso(G, p, 'seu reflexo vem por trás!', '#C79BFF');
    const lado = -(p.face || 1); G.tiros.push({ x: p.x + lado * 420, y: s.chao - 13, vx: -lado * 380, vy: 0, r: 13, vida: 2.4, cor: '#C79BFF', tipo: 'choque', fura: true }); sfx('magic'); } },
  imoralidade: { nome: 'o atalho', f(G, p, s) { // um atalho doce puxa para uma armadilha: fuja com o passo
    const x = p.x + (Math.random() < 0.5 ? -1 : 1) * 170; aviso(G, p, 'por aqui é mais fácil… (fuja!)', '#FF8FB8');
    G.zonas.push({ tipo: 'poca', x: x - 46, y: s.chao - 14, w: 92, h: 14, aviso: 0.6, dur: 2.4, cor: '210,65,110' }); G.puxao = { x, f: 130 }; setTimeout(() => { if (G.puxao?.x === x) G.puxao = null; }, 2200); sfx('magic'); } },
  satanas: { nome: 'brasas', f(G, p, s) { // jatos de fogo brotam do chão, um depois do outro, na sua direção
    aviso(G, p, 'o chão arde!', '#FF5A3C');
    const d = Math.random() < 0.5 ? -1 : 1; for (let i = 0; i < 4; i++) G.zonas.push({ tipo: 'col', x: p.x - d * 160 + d * i * 80, w: 38, aviso: 0.8 + i * 0.22, dur: 0.25, cor: '#FF5A3C', y0: s.chao - 110, y1: s.chao }); sfx('shoot'); } },
  /* ---------- Jonas ---------- */
  fuga: { nome: 'o navio aderna', f(G, p, s) { // o navio aderna e as lanças cruzam o convés
    const lado = Math.random() < 0.5 ? -1 : 1; aviso(G, p, 'o navio aderna! lanças!', '#FF8A7A'); G.soprar(2.4, -lado * 135, 'o navio aderna!');
    for (let i = 0; i < 2; i++) G.tiros.push({ x: p.x - lado * (520 + i * 160), y: p.y - 30 - i * 44, vx: lado * 450, vy: 0, r: 7, vida: 3, cor: '#C9B48A', tipo: 'lanca', fura: true }); sfx('swing'); } },
  pavor: { nome: 'relâmpagos', f(G, p, s) { // a nuvem escurece sobre você e o raio cai em dois pontos
    aviso(G, p, 'trovão…', '#F4E6AE'); G.clarao = 0.08;
    for (const dx of [0, rand(-160, 160)]) G.zonas.push({ tipo: 'col', x: p.x + dx, w: 34, aviso: 1.1, dur: 0.2, cor: '#F4E6AE', y0: s.y0, y1: s.chao }); sfx('hit'); } },
  desespero: { nome: 'as águas', f(G, p, s) { // "as águas me cercaram até à alma" (Jn 2:5): uma onda rasa cobre a sala; pule
    aviso(G, p, 'as águas sobem!', '#78D2F5'); G.zonas.push({ tipo: 'faixa', x: s.x0, w: s.x1 - s.x0, y: s.chao - 30, h: 30, aviso: 1.3, dur: 0.35, cor: '120,210,245', baixo: true }); sfx('swing'); } },
  violencia: { nome: 'escombros', f(G, p, s) { // pedaços do muro de Nínive despencam do teto
    aviso(G, p, 'o muro desaba!', '#E9AD7F'); G.tremor(5);
    for (let i = 0; i < 4; i++) G.tiros.push({ x: p.x + rand(-180, 180), y: s.y0 + 4 - i * 40, vx: 0, vy: 60, g: 900, r: 11, vida: 3, cor: '#9A7A5A', tipo: 'bola' }); sfx('block'); } },
  ressentimento: { nome: 'vento oriental', f(G, p, s) { // o vento calmoso empurra e levanta poeira rasteira (Jn 4:8)
    G.soprar(2.6, -170, 'vento oriental, calmoso!'); for (let i = 0; i < 3; i++) G.tiros.push({ x: p.x + 520 + i * 120, y: s.chao - rand(14, 50), vx: -340, vy: 0, r: 6, vida: 3, cor: '#E9BB7A', tipo: 'bola' }); sfx('dodge'); } },
  /* ---------- Daniel 4 ---------- */
  encantadores: { nome: 'estrelas cadentes', f(G, p, s) { // estrelas riscam a sala em diagonal
    aviso(G, p, 'estrelas cadentes!', '#B9C7F5');
    for (const d of [-1, 1]) { const x = p.x - d * 330, y = s.y0; G.zonas.push({ tipo: 'circ', x: p.x + d * 40, y: s.chao - 20, r: 36, aviso: 0.9, dur: 0.01, cor: '#B9C7F5', isca: true }); G.tiros.push({ x, y, vx: d * 370 / 0.9, vy: (s.chao - y) / 0.9, r: 9, vida: 0.95, cor: '#DDE6FF', tipo: 'bola', fura: true }); } sfx('magic'); } },
  jugo: { nome: 'tijolos rolando', f(G, p, s) { // os tijolos das obras do rei descem rolando pelo chão
    const lado = Math.random() < 0.5 ? -1 : 1; aviso(G, p, 'tijolos!', '#C98E62');
    for (let i = 0; i < 3; i++) G.tiros.push({ x: p.x - lado * (440 + i * 90), y: s.chao - 10, vx: lado * 300, vy: 0, r: 9, vida: 3.5, cor: '#C98E62', tipo: 'choque', fura: true }); sfx('block'); } },
  babilonia: { nome: 'a torre cresce', f(G, p, s) { // tijolos caem em escada, de um lado da sala ao outro
    aviso(G, p, 'a torre desmorona!', '#E0B45A'); const d = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 5; i++) G.zonas.push({ tipo: 'col', x: p.x - d * 200 + d * i * 100, w: 70, aviso: 0.7 + i * 0.25, dur: 0.25, cor: '#E0B45A', y0: s.y0, y1: s.chao }); sfx('hit'); } },
  fera: { nome: 'o bote na relva', f(G, p, s) { // o capim mexe… e algo salta dele, rente ao chão
    const lado = Math.random() < 0.5 ? -1 : 1; aviso(G, p, 'o capim se mexe…', '#B7C7A0');
    G.zonas.push({ tipo: 'circ', x: p.x + lado * 240, y: s.chao - 16, r: 30, aviso: 0.8, dur: 0.01, cor: '#B7C7A0', isca: true });
    const area = G.area, x = p.x + lado * 240; setTimeout(() => { if (G.area === area && G.running) { G.tiros.push({ x, y: s.chao - 18, vx: -lado * 520, vy: -60, g: 120, r: 12, vida: 1.2, cor: '#B7C7A0', tipo: 'bola', fura: true }); sfx('dodge'); } }, 800); } }, // só salta depois do aviso
  soberba: { nome: 'coroas que caem', f(G, p, s) { // coroas de ouro são atiradas dos dois lados, em arco
    aviso(G, p, 'coroas!', '#F1C96A');
    for (const d of [-1, 1]) { const x = p.x + d * 300, tv = 1.1, g = 700; G.tiros.push({ x, y: s.chao - 60, vx: (p.x - x) / tv, vy: (0 - 0.5 * g * tv * tv) / tv, g, r: 9, vida: 2.5, cor: '#F1C96A', tipo: 'bola' }); } sfx('shoot'); } }
};

// A sala marcante de cada fase (8 colunas, do alto até o chão): # parede, = ponte, ^ espinho, % parede falsa,
// e vício no chão, f voador, v vaso. Cada fase tem a sua; nenhuma se repete.
export const MARCAS = {
  mamom: ['..v..v..', '.======.', '........', '...ee...'], // as bancas do mercado de Corinto
  procrastinacao: ['...==...', '........', '..====..', '........', '........', '.e....e.'], // a torre do relógio
  mentira: ['.%....%.', '.%.ee.%.'], // paredes que mentem: a lâmpada as desfaz
  imoralidade: ['........', '..====..', '........', '........', '.^^ee^^.'], // o caminho largo tem espinhos dos lados
  satanas: ['.=....=.', '........', '........', '#^^^^^^#'], // duas pedras sobre o fogo
  fuga: ['....#...', '.#..#.#.', '.#e.#.#.'], // caixotes no porão do navio
  pavor: ['.f....f.', '........', '..=..=..', '........', '........', '...^^...'], // os mastros na tempestade
  desespero: ['#......#', '#.====.#', '#......#', '........', '........', '..e..e..'], // as costelas do peixe
  violencia: ['........', '.#....#.', '.##ee##.'], // barricadas nas ruas
  ressentimento: ['....v...', '...###..', '..#####.', '.e######'], // a colina a leste da cidade
  encantadores: ['...ff...', '........', '#==..==#', '........', '........', '.e....e.'], // o observatório dos magos
  jugo: ['.v......', '.=====..', '........', '...=====', '........', '..e.....'], // os andaimes das obras
  babilonia: ['...##...', '..####..', '.######.'], // um zigurate
  fera: ['#......#', '#.e..e.#'], // o cercado do campo
  soberba: ['..====..', '........', '.v....v.', '.######.', '.#....#.'] // o terraço do palácio
};
