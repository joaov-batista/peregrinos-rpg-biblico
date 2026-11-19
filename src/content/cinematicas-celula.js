// Cutscenes curtas da fase da célula ("Jesus me escolheu"). Duas cenas por página, uma por chefe: rápidas de propósito,
// para caber no tempo da célula. Mesmo formato de cinematicas.js (sem mp3: a voz do aparelho lê a legenda).
import sem from './celula-escolheu.js';
const L = sem.fases.map(f => f.npcs.N.look), LIDER = sem.guia.look;
const JESUS = { skin: '#C68B59', hair: '#3A2314', tunic: '#ECE3CF', cape: '#9A2A2A', style: 'longo', beard: true };
const fundos = ['floresta', 'casa', 'oficina', 'tribunal', 'luz'];
const textos = [
  'Um time sendo escolhido. Todo mundo já foi chamado… menos você. Uma voz sussurra: ninguém vai te escolher. Mas antes da criação do mundo alguém já tinha dito o seu nome.',
  'Tem gente que só ama "se": se você for bonito, se for rico, se for o melhor. O amor de Jesus não tem "se". É ágape.',
  'Na oficina do oleiro, o vaso estragado não vai para o lixo: vira um vaso novo. Em Cristo você é nova criação, e as correntes do passado não te prendem mais.',
  'A fogueira do pátio. Pedro disse três vezes: não o conheço. O galo cantou. Cinquenta dias depois, o mesmo Pedro falou a milhares. O que mudou?',
  'Ele te escolheu, te amou, te formou, te capacitou. Agora te envia: até os confins da terra. Só falta calar a última mentira.'
];
const viradas = [
  'Leia os dois rolos da videira e responda certo. Os vícios guardam cada rolo. No fim do caminho, a Rejeição espera.',
  'Leia os rolos e cuidado com as moedas: elas pesam. O Interesseiro vive delas.',
  'Leia os rolos da oficina. A Condenação arrasta correntes: chegue perto, que a corrente cede.',
  'Leia os rolos no pátio. A Covardia foge pelo céu e manda a tempestade. Fique firme.',
  'Leia os últimos rolos. O Fracasso acusa: responda com o que está escrito.'
];
export const CINEMAS_CELULA = {
  'celula-escolheu': { titulo: sem.titulo, cenas: [
    { cena: 'cosmos', fx: 'estrelas', titulo: 'JESUS ME ESCOLHEU', sub: 'João 15:16 · Célula · ' + sem.semana, texto: 'Antes de você dar qualquer passo, antes da criação do mundo, alguém já tinha escolhido você.' },
    { cena: 'luz', fig: [{ p: JESUS, x: 0.38, y: 0.84, s: 1.6 }, { p: 'jogador', x: 0.62, y: 0.84, s: 1.5, vira: -1 }], texto: '"Vocês não me escolheram, mas eu os escolhi para irem e darem fruto." Cinco páginas. Cinco mentiras para calar. Bora?' }
  ] },
  'celula-escolheu-fim': { titulo: 'Deus não errou', cenas: [
    { cena: 'luz', fx: 'clarão', titulo: 'DECLARE', fig: [{ p: 'jogador', x: 0.5, y: 0.84, s: 1.7 }], texto: 'Deus não errou ao me escolher! Ele está comigo ajudando-me em cada passo que dou.' },
    { cena: 'colinas', fig: [{ p: LIDER, x: 0.36, y: 0.84, s: 1.5 }, { p: 'jogador', x: 0.64, y: 0.84, s: 1.5, vira: -1 }], texto: 'Escolhido, amado, formado, capacitado e enviado. Este é o ano da Grande Colheita. Agora larga o celular: a célula continua!' }
  ] }
};
for (const f of sem.fases) {
  const ch = sem.chefes[f.chefe], fundo = fundos[f.n - 1];
  CINEMAS_CELULA['celula-escolheu-fase-' + f.n] = { titulo: 'Página ' + f.n + ' · ' + f.nome, cenas: [
    { cena: fundo, titulo: 'JESUS ' + f.nome.replace(/^Ele /, '').toUpperCase(), sub: f.ref, texto: textos[f.n - 1] },
    { cena: fundo, fig: [{ p: L[f.n - 1], x: 0.34, y: 0.84, s: 1.5 }, { p: 'jogador', x: 0.66, y: 0.84, s: 1.5, vira: -1 }], texto: viradas[f.n - 1] }
  ] };
  CINEMAS_CELULA['chefe-' + f.chefe] = { titulo: ch.nome, cenas: [
    { cena: f.n === 5 ? 'satanas' : f.n === 4 ? 'pavor' : f.n === 2 ? 'mamom' : 'sombras', fx: f.n === 4 ? 'raio' : 'brasas', voz: 'vilao', fig: [{ p: 'chefe:' + f.chefe, x: 0.5, y: 0.8, s: 2, entra: 'baixo' }], titulo: ch.nome.toUpperCase(), sub: ch.titulo + ' · ' + ch.ref, texto: ch.intro }
  ] };
}
