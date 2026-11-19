// A noite de meteoros no Refúgio: a aldeia sai de casa e fica olhando para cima; cada um diz o que vê. Quem tem
// amizade com você (4 corações ou mais) aceita sentar no chão da praça e assistir junto: uma cena curta, com o céu
// riscado, as falas que aparecem e somem e uns poucos corações subindo entre os dois.
// E a madrugada: quem tem casa entra para dormir, os da vigília vão à sinagoga, a ronda passa com a tocha e alguns
// sobem no terraço para ver a noite.
import { sfx, music } from '../audio.js';
import { noiteDeMeteoros, chovendo } from './tempo.js';
import { hora } from './moradores.js';
import { coracoesDe, somarCoracoes } from './vida.js';
import { VILA } from '../content/vila.js';
import { quadroPessoa } from './pixel/humano.js';
import { carimbar } from './pixel/raster.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const nomeDe = ob => (VILA[ob.id]?.nome || ob.nome || 'Alguém').split(',')[0];
const noite = G => Math.floor(((G.cm.relogio || 0) + 180) / 600);
export const olhaCeu = G => G.area === 'refugio' && noiteDeMeteoros(G) && G.ceuEscuro && (hora(G) >= 20 || hora(G) < 3);
export const JUNTO_MIN = 4;
// quem sobe no terraço de madrugada (Êutico gosta de alturas desde a janela de Trôade; Eliabe vigia como pastor)
export const TELHADO = ['eutico', 'eliabe', 'asafe'];
export const madrugada = G => { const h = hora(G); return h >= 23 || h < 5; };
export const noTelhado = (G, o) => TELHADO.includes(o.id) && !chovendo(G) && (hora(G) >= 21 || hora(G) < 4);

// o que cada um diz olhando para o céu
const DE = {
  rode: ['Olha! Mais um! Eu ia fazer um pedido, mas lembrei que é melhor agradecer.', 'Quando Pedro bateu à porta, de noite, eu fiquei tão contente que esqueci de abrir (At 12:14). Hoje não esqueço de olhar.'],
  sela: ['Vou deixar o forno esperando. Pão a gente faz todo dia; isto aqui, não.', '"Ele conta o número das estrelas e chama cada uma pelo nome" (Sl 147:4). Até as que caem.'],
  miria: ['Parece fio de ouro puxado no tear. Quem tece um céu desses?', 'Quero lembrar dessas cores amanhã, no pano.'],
  rute: ['Onde você for, eu vou, disse a minha xará (Rt 1:16). Hoje a gente vai é para cima, com os olhos.', 'Na terra de Moabe eu nunca vi tantas.'],
  eutico: ['Lá do terraço se vê melhor! …Mas eu prometi que não durmo na beirada.', 'Na janela de Trôade eu caí de sono (At 20:9). Hoje estou bem acordado.'],
  bartimeu: ['Eu era cego, e agora vejo (Jo 9:25). E olha o que tem para ver!', 'Conta pra mim cada uma que cair. Não: eu mesmo conto!'],
  ana: ['Oitenta e quatro anos e o céu ainda me espanta (Lc 2:37).', 'Os céus contam a glória de Deus (Sl 19:1). Hoje estão falando alto.'],
  eliabe: ['Pastor conhece a noite. Mas uma noite assim, só de vez em quando.', 'Foi numa noite como esta que os anjos apareceram aos pastores no campo (Lc 2:8).'],
  asafe: ['Se eu tocar a lira agora, cada risco no céu é uma nota.', '"Os céus proclamam a sua justiça" (Sl 50:6). Fui eu que cantei isso primeiro.']
};
const GERAL = ['Olha lá! Mais um!', 'Faz tempo que eu não fico assim, só olhando.', '"Levantai ao alto os vossos olhos e vede quem criou estas coisas" (Is 40:26).', 'Parece que o céu está chovendo luz.', 'Abraão contou estrelas uma noite (Gn 15:5). Eu perdi a conta na terceira.'];
export function falaDoCeu(G, ob) { const l = DE[ob.id] || GERAL; return pick(Math.random() < 0.75 ? l : GERAL); }

// a ação no diálogo: assistir junto
export function opcaoJuntos(G, ob) {
  if (!olhaCeu(G) || G.cm.meteoroJunto === noite(G)) return null;
  if (coracoesDe(G, ob.id) < JUNTO_MIN) return null;
  return { label: 'Sentar e assistir juntos', fn: () => assistirJuntos(G, ob) };
}
const FALAS = n => [
  [2.5, 'Vocês se sentam no chão da praça, ainda morno do dia.'],
  [7, n + ': "Você viu aquele? Comprido, de um lado ao outro!"'],
  [12.5, 'Por um tempo, ninguém fala. Só o céu riscando.'],
  [18, n + ': "Que bom que você parou para olhar comigo."'],
  [24, '"Quando contemplo os teus céus, obra dos teus dedos… que é o homem, para que dele te lembres?" (Sl 8:3-4)'],
  [30, n + ' encosta a cabeça no seu ombro por um instante e ri baixinho.'],
  [36, 'A noite segue. E fica guardada.']
];
const SOLO = [[1.5, 'As nuvens se afastam. O céu inteiro fica limpo.'], [5.5, 'Um risco de luz. Depois outro. Depois dez.'], [10.5, '"Os céus proclamam a glória de Deus" (Sl 19:1).'], [15.5, 'Você fica ali um tempo, só olhando.']];
// quando a chuva começa: o peregrino senta e olha, sozinho (qualquer tecla levanta)
export function assistirSozinho(G) {
  if (G.cenaMeteoros || G.ui.blocking || G.luta || G.p.morto || !G.p.chao) return;
  const p = G.p; G.cenaMeteoros = { t: 0, ob: null, x: p.x, y: p.y, fala: 0, cor: [], fim: 20, solo: true }; p.vx = 0; music('mundo', 'praia'); sfx('sino');
  setTimeout(() => { const C = G.cenaMeteoros; if (!C) return; const sai = () => { if (G.cenaMeteoros === C && C.t > 2.5) levantar(G); }; C.ouvir = sai; addEventListener('keydown', sai); addEventListener('pointerdown', sai); }, 800);
}
export function assistirJuntos(G, ob) {
  if (G.cenaMeteoros) return; const p = G.p, v = ob.vv;
  G.cm.meteoroJunto = noite(G);
  const C = G.cenaMeteoros = { t: 0, ob, x: p.x, y: p.y, fala: 0, cor: [], fim: 40, n: nomeDe(ob) };
  if (v) { v.estado = 'sentadoCeu'; v.x = p.x + 26; v.face = -1; } p.face = 1; p.vx = 0;
  music('mundo', 'praia'); sfx('sino');
  setTimeout(() => { const sai = () => { if (G.cenaMeteoros === C && C.t > 4) levantar(G); }; C.ouvir = sai; addEventListener('keydown', sai); addEventListener('pointerdown', sai); }, 800);
}
function levantar(G) {
  const C = G.cenaMeteoros; if (!C) return; const p = G.p;
  if (C.ouvir) { removeEventListener('keydown', C.ouvir); removeEventListener('pointerdown', C.ouvir); }
  G.cenaMeteoros = null; if (C.ob?.vv) { C.ob.vv.estado = 'ceu'; C.ob.vv.t = 2; }
  G.musicaDaArea?.();
  if (C.solo) return;
  if (C.t > 10) { somarCoracoes(G, C.ob.id, 1); p.vida = p.vidaMax; p.oleo = G.oleoMax(); sfx('heal'); }
  if (!G.cm.meteoroJuntoVisto && C.t > 10) { G.cm.meteoroJuntoVisto = 1; G.ovo?.('meteoros_juntos', 'Uma noite de meteoros, sentados lado a lado. "Que é o homem, para que dele te lembres?" (Sl 8:4)'); }
  G.salvar();
}
export function passoMeteoros(G, dt) {
  const C = G.cenaMeteoros; if (!C) return;
  const p = G.p; C.t += dt; p.x = C.x; p.vx = 0; p.atk = null; p.face = 1; G.perto = null;
  if (C.ob?.vv) { C.ob.vv.x = C.x + 26; C.ob.vv.estado = 'sentadoCeu'; }
  const F = C.solo ? SOLO : FALAS(C.n); while (C.fala < F.length && C.t >= F[C.fala][0]) { const [, txt] = F[C.fala++]; G.textos.push({ x: C.x + 13, y: C.y - 150, txt, cor: '#F2ECFF', tam: 13, t: 5 }); }
  for (const t0 of [9, 19.5, 31]) if (!C.solo && C.t - dt < t0 && C.t >= t0) C.cor.push({ t: 0, x: C.x + 13 + (Math.random() - 0.5) * 8 }); // uns poucos corações
  for (const c of C.cor) c.t += dt; C.cor = C.cor.filter(c => c.t < 3.2);
  if (C.t > C.fim) levantar(G);
}
// os dois sentados (o peregrino; quem foi convidado é desenhado pelo próprio morador, sentado)
export function pintarSentadosCeu(g, G, X, Y, Tm) {
  const p = G.p; carimbar(g, quadroPessoa(G.char.look || {}, Tm, 'met-eu', 'ceu'), X(p.x), Y(p.y), 24, 40, 1);
}
const CORACAO = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
// por cima: as faixas de cinema, o céu mais escuro em volta e os corações subindo
export function pintarCenaMeteoros(g, G, vw, vh, X, Y) {
  const C = G.cenaMeteoros; if (!C) return; const k = Math.min(1, C.t / 1.2) * Math.min(1, (C.fim - C.t) / 1.2 + 0.001), fx = Math.round(k * vh * 0.12), fb = Math.round(k * vh * 0.035);
  g.fillStyle = '#05060C'; g.fillRect(0, 0, vw, fx); g.fillRect(0, vh - fb, vw, fb); // a faixa de cima é larga (o céu é a cena); a de baixo, fina, para não cobrir os dois
  for (const c of C.cor) { const a = Math.min(1, c.t * 3) * Math.min(1, (3.2 - c.t) * 1.5), x = X(c.x) + Math.round(Math.sin(c.t * 3) * 3), y = Y(C.y) - 46 - Math.round(c.t * 14);
    g.globalAlpha = a; CORACAO.forEach((ln, r) => [...ln].forEach((ch, i) => { if (ch !== 'X') return; g.fillStyle = r === 0 && i < 3 ? '#FFB8C8' : '#E2466A'; g.fillRect(x - 3 + i, y + r, 1, 1); })); g.globalAlpha = 1; }
}
