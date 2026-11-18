// Sardes, a cidade que tem nome de viva e está morta (Ap 3:1). A luz quase não chega; ladrões e demônios andam no meio
// do povo. Epafras, um ancião que ainda vigia, pede ajuda: reacender as velas, levar a Palavra e enfrentar o que ataca.
// "Sê vigilante e confirma o restante, que estava para morrer" (Ap 3:2).

export const SARDES_VELAS = 10, SARDES_ABATES = 20;

// o povo que recebe a Palavra: antes (fala de quem vive no escuro) e depois (o versículo que o peregrino entrega)
export const SARDES_POVO = {
  onesimo: { nome: 'Onésimo', look: { skin: '#8A5A3A', hair: '#1C120A', tunic: '#4A4036', cape: 'none', style: 'curto', beard: false },
    antes: 'Eu fugi do meu senhor e vim parar aqui, onde ninguém pergunta o nome de ninguém. Aqui dá para sumir.\n\nSó que… sumir cansa.',
    palavra: '"Se alguém está em Cristo, nova criatura é: as coisas velhas já passaram; eis que tudo se fez novo" (2Co 5:17).',
    depois: 'Nova criatura… Paulo disse uma coisa parecida a um homem chamado Filemom. Talvez eu volte e peça perdão. Talvez.' },
  cloe: { nome: 'Cloé', look: { skin: '#C68B59', hair: '#3A2314', tunic: '#6B4A5A', cape: '#4A3A4A', style: 'veu' },
    antes: 'Minha casa vive cheia de briga. Cada um puxa para um lado, e a vela da sala nem acendemos mais: para quê, se ninguém se olha?',
    palavra: '"Rogo-vos, irmãos, que digais todos uma mesma coisa, e que não haja entre vós divisões" (1Co 1:10).',
    depois: 'Vou acender a vela da sala hoje à noite. Nem que seja só eu sentada ali, esperando os outros.' },
  febe: { nome: 'Febe', look: { skin: '#A0673E', hair: '#2B1A10', tunic: '#5A6A7A', cape: '#C9B88A', style: 'trancas' },
    antes: 'Eu servia na igreja daqui, sabia? Quando as luzes foram se apagando, uma a uma, eu parei de ir. Achei que ninguém notaria.',
    palavra: '"Não deixemos de congregar-nos, como é costume de alguns; antes, admoestemo-nos uns aos outros" (Hb 10:25).',
    depois: 'Alguém notou. Você notou. Amanhã eu abro a porta da casa de oração e varro o chão. É por onde se começa.' },
  tiquico: { nome: 'Tíquico', look: { skin: '#D9A273', hair: '#6B4423', tunic: '#3F4A3A', cape: 'none', style: 'cacheado', beard: true },
    antes: 'Fui roubado três vezes este mês. Agora durmo com a faca debaixo do travesseiro e não abro a porta para ninguém.\n\nNem para você.',
    palavra: '"Em paz me deito e logo pego no sono, porque só tu, Senhor, me fazes habitar em segurança" (Sl 4:8).',
    depois: 'Em paz me deito… Faz tempo que eu não durmo. Vou tentar hoje. A faca fica na cozinha.' },
  ninfa: { nome: 'Ninfa', look: { skin: '#E3B48C', hair: '#D9D2C5', tunic: '#6B5A8C', cape: '#3A3456', style: 'veu' },
    antes: 'Sou velha, filho. Já vi Sardes cheia de luz, de cânticos à noite. Agora só vejo vultos. Meus olhos ou a cidade, não sei o que escureceu primeiro.',
    palavra: '"Levanta-te, resplandece, porque vem a tua luz, e a glória do Senhor vai nascendo sobre ti" (Is 60:1).',
    depois: 'Vem a tua luz… Eu ainda vou ver. Diga a Epafras que a velha Ninfa canta de novo amanhã.' }
};

// o ancião que vigia: o que ele diz a cada etapa
export const EPAFRAS = {
  nome: 'Epafras, o que vigia',
  look: { skin: '#C68B59', hair: '#D9D2C5', tunic: '#3A3F4C', cape: '#6B5A3A', style: 'turbante', beard: true },
  chegada: 'Um barco? Faz meses que ninguém desce nesse cais por vontade própria.\n\nBem-vindo a Sardes. Ou ao que sobrou dela. "Tens nome de que vives, e estás morto" (Ap 3:1): foi o que disseram de nós, e era verdade.',
  pedido: 'As velas da cidade se apagaram uma a uma. Com o escuro vieram os ladrões, depois as brigas, e depois… outras coisas. Coisas que andam no meio do povo com rosto de gente.\n\nEu ainda vigio. Mas sozinho não confirmo o que resta (Ap 3:2). Você me ajuda?',
  missoes: 'Três coisas:\n\n• Reacenda as {velas} velas apagadas da cidade (cada uma pede um pouco de azeite).\n• Leve a Palavra a cinco pessoas que ainda resistem. Leve estes rolos.\n• Enfrente os que atacam o povo: vença {abates} deles.\n\nQuando a cidade estiver em paz, a gente conversa sobre a luz.',
  andamento: 'Velas: {v} de {velas}. Palavra: {p} de 5. Vencidos: {a} de {abates}.\n\nContinue. Cada vela acesa empurra a sombra um pouco mais para fora.',
  final: 'Olhe. Olhe para a rua!\n\nAs velas acesas, o povo nas portas, um cântico lá no templo… "Mas tens em Sardes algumas pessoas que não contaminaram as suas vestes; e comigo andarão de branco" (Ap 3:4).\n\nVocê confirmou o que estava para morrer. Leve isto: era da igreja daqui, quando ela ainda brilhava.',
  depois: 'Sardes respira. Ainda há sombras, sempre haverá; mas agora o povo sabe acender a vela quando o escuro volta. Volte quando quiser, peregrino.'
};
// os outros moradores (de passagem): uma frase cada, que muda quando a luz volta
export const SARDES_RUA = [
  ['Não ande sozinho depois do sino. Ninguém anda.', 'Ouviu o sino? Agora ele chama para o culto, não para trancar a porta.'],
  ['Viu meu irmão? Saiu ontem e não voltou.', 'Meu irmão voltou! Estava escondido no templo velho, com medo.'],
  ['Três moedas pelo pão. Quatro, se for à noite: à noite tudo é mais caro.', 'Pão a duas moedas. A luz baixou o preço de tudo, até do medo.'],
  ['Dizem que o vizinho do fim da rua não é gente. Eu é que não vou olhar.', 'O vizinho do fim da rua era só um homem triste. Eu levei uma sopa para ele.']
];

// Pedro (Simão, o pescador) é quem manda o peregrino a Sardes: levar a Palavra é pescar gente (Lc 5:10)
export const PEDRO_SARDES = {
  chamado: ['Você já pescou, peregrino? Eu pescava peixe. Um dia ele me disse: "Desde agora serás pescador de homens" (Lc 5:10). Larguei as redes ali mesmo.',
    'Chegou notícia do outro lado do mar: Sardes. Uma igreja que tem nome de viva e está morta (Ap 3:1). As velas apagaram, o povo se tranca, ninguém mais congrega.',
    '"Ide por todo o mundo e pregai o evangelho a toda criatura" (Mc 16:15). Não é para conquistar a cidade: é para acender de novo o que ainda não morreu. Vai?'],
  aceita: 'Fale com Jonatã, o barqueiro, no Porto. Leve azeite para as velas e a Palavra para quem resiste. Lá tem um ancião, Epafras, que ainda vigia.',
  andamento: 'E Sardes? Lembre: a gente lança a rede, quem enche é ele.',
  depois: 'Ouvi dizer que em Sardes cantam de novo à noite. "Grande é a seara" (Lc 10:2)… e eu já ouço falar de outra cidade que precisa de luz. Quando você estiver pronto, conversamos.'
};
// a sinagoga de Sardes: Natanael é o último que ainda abre a porta; a menorá apagada acende com azeite
export const SINAGOGA_SARDES = {
  natanael: 'Natanael, o último',
  natLook: { skin: '#C68B59', hair: '#D9D2C5', tunic: '#3A3F4C', cape: '#4A4A6A', style: 'turbante', beard: true },
  antes: 'Abro a porta todo sábado. Ninguém vem. Varro o chão, leio o rolo em voz alta para os bancos vazios e volto para casa.\n\nA menorá está apagada há tanto tempo que esqueci o cheiro do azeite queimando.',
  menora: 'A menorá de sete braços, coberta de pó. Precisa de 21 de azeite para acender as sete lâmpadas.',
  acesa: 'As sete lâmpadas acendem. Natanael fica de pé, as mãos tremendo. "Até que enfim… até que enfim."\n\n(A cidade conta isto como duas velas reacesas.)',
  depois: 'Agora vem gente. Pouca, mas vem. Ninfa canta, Febe varre, Tíquico chega cedo. É assim que uma sinagoga volta a respirar.'
};
// o mercado novo: quem recebeu a Palavra abre uma banca depois que a cidade acende
export const MERCADO_NOVO = {
  fechado: 'Bancas com tábuas pregadas por cima. Alguém escreveu na madeira: "Fechado até o medo passar."',
  cloe: { banca: 'Velas e azeite', fala: 'A vela da sala agora fica acesa todo dia. Vendo do mesmo azeite: para a sua lâmpada e para quem precisar.', itens: { azeite: 22, mel: 30 } },
  tiquico: { banca: 'O que foi roubado volta', fala: 'Os ladrões começaram a devolver as coisas. O que ninguém reclama eu vendo barato. Cada dia aparece uma coisa.' },
  onesimo: { banca: 'Compro do campo', fala: 'Sardes tem fome de coisa fresca. Compro o que você colhe no seu sítio, e pago melhor que o cesto.' },
  febe: { banca: 'Flores e pão', fala: 'Faço pão para os que vêm ao culto. E flores para a mesa da ceia.', itens: { pao: 8, flor: 9 } },
  ninfa: { banca: 'O cântico', fala: 'Velha não vende nada. Velha canta. Senta um pouco e ouve.' }
};
