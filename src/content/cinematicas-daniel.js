// Cutscenes da semana 3 (Daniel 4) e o prólogo do Caminho. Mesmo formato de cinematicas.js; narração em public/narracao.
import semana from './semana-03.js';
const REI = semana.fases[0].npcs.N.look, DANIEL = semana.guia.look, REI_HUMILDE = semana.fases[4].npcs.N.look;
const fundos = ['trono', 'floresta', 'muralha', 'campos', 'colinas'];
const textos = [
  ['Babilônia. O rei mais poderoso da terra dorme tranquilo em seu palácio… até que um sonho o acorda, e ele não consegue mais descansar.', 'Magos, encantadores, caldeus e adivinhos são chamados. O rei conta o sonho, e nenhum deles sabe explicar. Leia os três rolos do palácio. Só então a porta dos Encantadores se abre.'],
  ['Uma árvore no meio da terra. Sua altura toca o céu; todos comem do seu fruto. Então um vigilante desce, e a ordem é dada: derrubem. Mas deixem a cepa, com as raízes.', 'Daniel fica atônito. A árvore é o rei. E ainda há uma saída: justiça, e misericórdia para com os pobres. O Jugo de Ferro guarda este canteiro.'],
  ['Doze meses se passaram. Nada aconteceu. No terraço do palácio, o rei olha a cidade e diz: não é esta a grande Babilônia que eu edifiquei?', 'A palavra ainda estava em sua boca quando uma voz caiu do céu. Suba ao terraço. A cidade inteira repete o que o rei disse: eu, meu, minha.'],
  ['Na mesma hora a sentença se cumpre. Expulso de entre os homens, o rei come erva como os bois. O orvalho molha o seu corpo. Sete tempos passam sobre ele.', 'Você vai encontrá-lo no campo. Ele não é um demônio: é um homem que perdeu a razão. Resista, sem odiar. A cepa ficou na terra.'],
  ['Ao fim daqueles dias, o rei faz o gesto mais simples do mundo. Levanta os olhos ao céu. E o entendimento volta.', 'Ele bendiz o Altíssimo antes de receber o trono de volta. Mas a soberba que o derrubou ainda ronda, e não precisa de coroa. Arranque a raiz.']
];
export const CINEMAS_DANIEL = {
  'caminho-prologo': { titulo: 'O Livro fechado', cenas: [
    { cena: 'noite', titulo: 'PEREGRINOS', sub: 'O Caminho', texto: 'Houve um tempo em que toda casa tinha um Livro aberto, e toda aldeia, uma lâmpada acesa.' },
    { cena: 'sombras', texto: 'Ninguém o queimou. Ninguém o proibiu. Ele apenas foi ficando fechado. E cada página esquecida, a sombra cobriu.' },
    { cena: 'sombras', fx: 'brasas', fig: [{ p: 'chefe:mentira', x: 0.3, y: 0.8, s: 1.5 }, { p: 'chefe:mamom', x: 0.68, y: 0.8, s: 1.6 }], texto: '[tense] O que a sombra cobre ganha corpo. A ganância tomou um nome. A mentira ganhou rostos. O medo aprendeu a andar.' },
    { cena: 'cidade', fig: [{ p: 'jogador', x: 0.5, y: 0.84, s: 1.6 }], texto: 'Restou uma aldeia acesa, que chamam Refúgio. E restou você: um peregrino, uma lâmpada, e azeite para pouco.' },
    { cena: 'luz', titulo: 'SALMO 119:105', texto: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho. Leia. Entenda. E a luz volta, página por página.' }
  ] },
  'semana-03': { titulo: semana.titulo, cenas: [
    { cena: 'trono', titulo: 'DANIEL 4', sub: 'O rei que virou fera', fig: [{ p: REI, x: 0.5, y: 0.82, s: 1.7 }], texto: 'Esta é a carta de um rei. Nabucodonosor, senhor da Babilônia, escreve a todos os povos para contar como caiu, e quem o levantou.' },
    { cena: 'noite', fig: [{ p: DANIEL, x: 0.36, y: 0.84, s: 1.5 }, { p: 'jogador', x: 0.64, y: 0.84, s: 1.5, vira: -1 }], texto: 'Um sonho, um aviso, doze meses de paciência, sete tempos de humilhação. Os chefes desta semana são as sombras do coração do rei. Leia, responda, e caminhe com ele até o fim.' }
  ] },
  'semana-03-fim': { titulo: 'O Rei do céu', cenas: [
    { cena: 'colinas', titulo: 'A COROA VOLTOU', fig: [{ p: REI_HUMILDE, x: 0.5, y: 0.82, s: 1.7 }], texto: 'O reino lhe foi devolvido, e a grandeza, acrescentada. Mas o homem que voltou ao trono não era o mesmo que subiu ao terraço.' },
    { cena: 'luz', titulo: 'DANIEL 4:37', texto: 'Agora, pois, eu, Nabucodonosor, louvo, exalto e glorifico ao Rei do céu. Todas as suas obras são verdadeiras, e os seus caminhos, justos. E ele pode humilhar aos que andam na soberba.' },
    { cena: 'luz', titulo: 'E VOCÊ?', fig: [{ p: 'jogador', x: 0.5, y: 0.84, s: 1.6 }], texto: 'A Coroa Restituída é sua. Levantar os olhos é um gesto simples. De quem é a glória daquilo que você construiu?' }
  ] }
};
for (const f of semana.fases) {
  const ch = semana.chefes[f.chefe];
  CINEMAS_DANIEL['semana-03-fase-' + f.n] = { titulo: 'Página ' + f.n + ' · ' + f.nome, cenas: [
    { cena: fundos[f.n - 1], titulo: 'PÁGINA ' + f.n, sub: f.nome + ' · ' + f.ref, texto: textos[f.n - 1][0] },
    { cena: fundos[f.n - 1], fig: [{ p: f.n === 4 ? DANIEL : f.n === 5 ? REI_HUMILDE : REI, x: 0.34, y: 0.84, s: 1.5 }, { p: 'jogador', x: 0.66, y: 0.84, s: 1.5, vira: -1 }], texto: textos[f.n - 1][1] }
  ] };
  CINEMAS_DANIEL['chefe-' + f.chefe] = { titulo: ch.nome, cenas: [
    { cena: fundos[f.n - 1], fx: 'brasas', fig: [{ p: 'chefe:' + f.chefe, x: 0.5, y: 0.8, s: 2, entra: 'baixo' }], titulo: ch.nome.toUpperCase(), sub: ch.titulo, voz: f.chefe === 'fera' ? 'narrador' : 'vilao', texto: ch.intro.replace(/\*/g, '') }
  ] };
}
