// Azeites e óleos perfumados: cada cor e cada aroma serve para uma coisa. Feitos na mesa de essências do sítio
// (uma botija de azeite e o que der o aroma) ou comprados de Lídia, que além da púrpura vende perfumes.
export const AZEITES = {
  oleo_nardo: { nome: 'Óleo de nardo', plural: 'frascos de nardo', cor: '#D9A441', aroma: 'nardo puro, doce e caro', efeito: 'presente', receita: { azeite: 1, flor: 1, mel: 1 }, preco: 90,
    desc: 'O melhor presente que há: qualquer morador recebe com lágrimas nos olhos (+3 ♥). "Uma libra de nardo puro, de muito preço" (Jo 12:3).' },
  oleo_hissopo: { nome: 'Óleo de hissopo', plural: 'frascos de hissopo', cor: '#6FB35A', aroma: 'hissopo, erva amarga e limpa', efeito: 'espanta', dur: 90, receita: { azeite: 1, trigo: 2 }, preco: 45,
    desc: 'Passado na roupa, espanta os monstros pequenos por 90 s: eles fogem e não chegam perto. "Purifica-me com hissopo" (Sl 51:7).' },
  oleo_mirra: { nome: 'Óleo de mirra', plural: 'frascos de mirra', cor: '#9A2E3A', aroma: 'mirra, resina amarga de guerra', efeito: 'dano', dur: 30, receita: { azeite: 1, vinho: 1 }, preco: 80,
    desc: 'Na lâmina: golpes com o DOBRO de dano por 30 s.' },
  oleo_canela: { nome: 'Óleo de canela', plural: 'frascos de canela', cor: '#D2692E', aroma: 'canela e cálamo, quente', efeito: 'veloz', dur: 30, receita: { azeite: 1, figo: 2 }, preco: 60,
    desc: 'Nas pernas: o DOBRO de velocidade por 30 s. "Canela aromática… e cálamo" (Êx 30:23).' },
  oleo_terra: { nome: 'Azeite da terra', plural: 'botijas da terra', cor: '#C9B84A', aroma: 'terra molhada e folha de oliveira', efeito: 'fazenda', receita: { azeite: 1, leite: 1 }, preco: 55,
    desc: 'Usado no sítio: toda a lavoura cresce um dia e os bichos ficam contentes. "A terra produziu relva" (Gn 1:12).' },
  oleo_mar: { nome: 'Óleo do mar', plural: 'frascos do mar', cor: '#3E8EC0', aroma: 'sal, cedro e alga', efeito: 'pesca', receita: { azeite: 1, peixe: 1 }, preco: 50,
    desc: 'Na isca: nas próximas 5 fisgadas o peixe morde logo e a linha aguenta mais. "Lançai a rede à direita do barco" (Jo 21:6).' },
  oleo_balsamo: { nome: 'Bálsamo de Gileade', plural: 'frascos de bálsamo', cor: '#E08AA8', aroma: 'bálsamo, rosa e resina', efeito: 'cura', receita: { azeite: 1, mel: 2 }, preco: 70,
    desc: 'Cura todos os fôlegos e enche a lâmpada. "Não há bálsamo em Gileade?" (Jr 8:22).' },
  oleo_alegria: { nome: 'Óleo de alegria', plural: 'frascos de alegria', cor: '#F2E27A', aroma: 'flor de laranjeira e sol', efeito: 'alegria', dur: 120, receita: { azeite: 1, flor: 2, uva: 1 }, preco: 110,
    desc: 'Por 2 minutos, todo vício vencido deixa o dobro de denários e cada conversa vale um coração a mais. "Óleo de alegria em vez de pranto" (Is 61:3).' }
};
export const ITENS_AZEITE = Object.fromEntries(Object.entries(AZEITES).map(([k, a]) => [k, { nome: a.nome, plural: a.plural }]));
