// A HISTÓRIA DO PEREGRINO — primeiro arco: "A lâmpada que falta".
// O que é ficção: o Refúgio, o peregrino, os pedidos dos moradores e as SOMBRAS que cobrem as páginas (os vícios e os chefes).
// O que é Escritura: a cena que aparece quando a sombra cai. Ela vem sempre separada, com o título "Está escrito" e a referência,
// e conta só o que o texto conta. Cada capítulo é: um pedido no Refúgio → uma página viva (caminho com vícios e um chefe)
// → a cena bíblica → a volta, e alguma coisa muda na aldeia. O arco prepara o encontro do Getsêmani (o azeite, a vigília, a voz).
export const ARCO = { id: 'lampada', titulo: 'A lâmpada que falta' };

export const CAPITULOS = [
  { id: 'sarepta', n: 1, titulo: 'O azeite que não acaba', ref: '1 Reis 17:8-16', quem: 'velho', quemNome: 'o Velho Peregrino', chefe: 'escassez', tema: 'sarepta', inimigos: ['desanimo', 'preguica', 'ganancia'], forca: 1,
    lugar: 'Sarepta, no tempo da seca', sala: 0, lamparinas: [16, 24],
    pedido: [
      'Você reparou nas lamparinas da praça? Apagadas, todas. Não é descuido: o azeite do Refúgio está acabando.\n\nA viúva da casa ao lado guardava a botija que nunca secou. Guardava. Faz três noites que a botija amanheceu vazia.',
      'Não é a botija que secou, peregrino. É a página.\n\nQuando ninguém lê uma história, a sombra cobre a história, e o que ela guardava para nós vai se apagando aqui. A página da viúva de Sarepta está coberta.',
      'Você tem uma lâmpada e sabe usá-la. Entre na página. O que está escrito lá aconteceu de verdade e você não muda uma letra.\n\nMas a sombra que cobre a página, essa não está no texto. Essa você pode enfrentar.'],
    cena: [
      'Não chovia havia muito tempo. O profeta Elias chegou à porta da cidade de Sarepta, e uma viúva apanhava lenha.\n\nEle pediu água. E, quando ela ia buscar, pediu também um bocado de pão.',
      '"Tão certo como vive o Senhor, teu Deus, não tenho pão cozido; tenho só um punhado de farinha na panela e um pouco de azeite na botija. Apanhei dois gravetos e vou prepará-lo para mim e para meu filho, para que o comamos e morramos."',
      'Elias respondeu: "Não temas. Vai e faze como disseste; mas primeiro faze dele para mim um bolo pequeno, e traze-mo; depois farás para ti e para teu filho."\n\n"Porque assim diz o Senhor, Deus de Israel: A farinha da panela não se acabará, e o azeite da botija não faltará, até o dia em que o Senhor fizer chover sobre a terra."',
      'Ela foi e fez conforme a palavra de Elias.\n\nE comeram ele, ela e a sua casa, muitos dias. Da panela a farinha não se acabou, e da botija o azeite não faltou, conforme a palavra do Senhor.'],
    volta: [
      'Eu senti daqui. A botija da viúva está pesada de novo.\n\nEla deu primeiro, sem ter. É assim que esse azeite funciona: não é o muito que não acaba, é o pouco entregue.',
      'Acendi as lamparinas da praça com ele. Repare: a aldeia tem outra cor.\n\nMas uma lâmpada acesa mostra as que continuam apagadas. Procure Bartimeu, na Praça das armas. Ele anda inquieto, e não é de hoje.'],
    mudanca: 'As lamparinas da Praça do poço estão acesas.', premio: { gold: 120, xp: 160, mana: 1 } },

  { id: 'jerico', n: 2, titulo: 'O grito à beira do caminho', ref: 'Marcos 10:46-52', quem: 'bartimeu', quemNome: 'Bartimeu', chefe: 'desprezo', tema: 'jerico', inimigos: ['orgulho', 'inveja', 'distracao'], forca: 1.15,
    lugar: 'A estrada de Jericó', sala: 2, lamparinas: [3, 16, 25],
    pedido: [
      'Você é o da lâmpada, não é? Eu enxergo, hoje. Mas tem noite em que acordo e não lembro como foi.\n\nLembro do pó da estrada. Lembro da capa. E depois… um branco. Como se alguém tivesse arrancado a página.',
      'Eu sei que gritei. Sei que mandaram eu calar a boca. Mas a VOZ que me chamou… essa eu não consigo mais ouvir na memória.\n\nSe a minha página está coberta, o que vai ser de mim? Quem esquece como foi achado se perde de novo.',
      'Vá à estrada de Jericó por mim. Não mude nada: só tire de cima o que está cobrindo.\n\nE, se ouvir a voz dele… me conte como é.'],
    cena: [
      'Jesus saía de Jericó com os discípulos e uma grande multidão. Bartimeu, o cego, filho de Timeu, estava sentado à beira do caminho, mendigando.\n\nOuvindo que era Jesus, o Nazareno, começou a clamar: "Jesus, Filho de Davi, tem misericórdia de mim!"',
      'Muitos o repreendiam para que se calasse.\n\nMas ele clamava ainda mais: "Filho de Davi, tem misericórdia de mim!"',
      'Jesus parou e disse: "Chamai-o."\n\nChamaram o cego, dizendo: "Tem bom ânimo; levanta-te, ele te chama." Lançando de si a capa, levantou-se de um salto e foi ter com Jesus.',
      '"Que queres que eu te faça?"\n\n"Mestre, que eu torne a ver."\n\n"Vai, a tua fé te salvou." E logo tornou a ver, e seguia Jesus pelo caminho.',
      'Você estava no meio da multidão. Viu a capa no chão. Ouviu a voz: baixa, sem pressa, de alguém que para por um só.\n\nMas havia gente demais na frente. O rosto dele, você não viu.'],
    volta: [
      '"Que queres que eu te faça?"… Foi isso. FOI ISSO que ele perguntou. Como é que eu pude esquecer?\n\nEle parou, peregrino. Uma multidão inteira andando, e ele parou por um cego que gritava.',
      'Você não viu o rosto? Eu também não, no começo: a primeira coisa que eu vi na vida foi o rosto dele, e era gente demais em volta.\n\nMas a voz você reconhece. Guarde a voz. Um dia você vai precisar reconhecer.',
      'Tome estas lamparinas, são para a praça. E fale com Rode, a criada, lá no poço. Ela não dorme há dias: fica de ouvido na porta.'],
    mudanca: 'A Praça das armas ganhou lamparinas, e Bartimeu voltou a contar a sua história.', premio: { gold: 160, xp: 220, mana: 1 } },

  { id: 'prisao', n: 3, titulo: 'A noite da vigília', ref: 'Atos 12:5-17', quem: 'rode', quemNome: 'Rode', chefe: 'carcere', tema: 'masmorra', inimigos: ['medo', 'ira', 'duvida'], forca: 1.3,
    lugar: 'Jerusalém, a prisão de Herodes', sala: 3, lamparinas: [2, 9, 23],
    pedido: [
      'Psiu! Fale baixo. Estou ouvindo a porta.\n\nNaquela noite a casa inteira orava por Pedro, que ia morrer de manhã. E bateram. Eu sei que bateram… mas de uns dias para cá, quando eu conto a história, a batida não vem. Fica um silêncio no lugar.',
      'O Velho diz que é a página coberta. Eu digo que é pior: se a porta não bate na história, a gente para de vigiar. E quem para de vigiar, dorme.\n\nEu não quero dormir, peregrino. Não nessa noite.',
      'Vá até a prisão. Não solte ninguém: quem solta não é você. Só tire a sombra de cima.\n\nE volte para me dizer se bateram.'],
    cena: [
      'Pedro era guardado na prisão; mas a igreja fazia contínua oração por ele a Deus.\n\nNa noite antes de Herodes o apresentar, Pedro dormia entre dois soldados, preso com duas cadeias, e sentinelas guardavam a porta.',
      'Eis que sobreveio um anjo do Senhor, e uma luz resplandeceu na prisão. Tocando no lado de Pedro, despertou-o: "Levanta-te depressa."\n\nE as cadeias caíram-lhe das mãos.',
      'Passaram a primeira e a segunda guarda e chegaram ao portão de ferro que dá para a cidade, o qual se lhes abriu por si mesmo.\n\nSaíram, percorreram uma rua, e logo o anjo se apartou dele.',
      'Pedro foi à casa de Maria, mãe de João Marcos, onde muitos estavam reunidos e oravam. Bateu à porta, e uma criada chamada Rode saiu a escutar.\n\nReconhecendo a voz de Pedro, de alegria não abriu a porta, mas correu para dentro, anunciando que Pedro estava lá fora.',
      '"Estás louca", disseram. Mas Pedro continuava batendo; e, quando abriram, viram-no e ficaram atônitos.\n\nUma casa inteira acordada, de lâmpada acesa, orando numa noite escura. E a resposta batendo na porta.'],
    volta: [
      'Bateram?… BATERAM! Eu sabia! Eu sempre soube!\n\nE eu deixei ele lá fora de novo, não deixei? Na história eu sempre deixo. Mas a porta bate, peregrino. A porta bate.',
      'Sabe o que eu aprendi naquela noite? Vigiar não é ficar com medo de olhos abertos. É ficar junto, de lâmpada acesa, esperando Alguém.\n\nHoje à tardinha a gente volta a se reunir na praça. Venha.',
      'Ah: Ana, a profetisa, perguntou por você. Ela fica no olival. Disse que é sobre uma coisa que ela esperou a vida inteira.'],
    mudanca: 'O Bairro tem lamparinas, e os moradores voltaram a se reunir na praça ao entardecer.', premio: { gold: 200, xp: 300, mana: 1 } }
];

// o fecho do arco: Ana aponta, sem contar
export const EPILOGO = { quem: 'ana', quemNome: 'Ana, a profetisa',
  falas: [
    'Então é você que anda acendendo as lâmpadas.\n\nEu fiquei oitenta e quatro anos esperando, sabia? No templo, de noite e de dia, com jejuns e orações (Lc 2:37). As pessoas tinham pena de mim.',
    'E um dia entrou um casal pobre com um menino no colo. Ninguém olhou duas vezes. Eu olhei uma, e soube.\n\nQuem espera de lâmpada acesa reconhece quando chega.',
    'Você viu o azeite que não acaba. Ouviu a voz que para por um só. Vigiou a noite com a casa de Maria.\n\nSabe de onde vem o azeite, peregrino? De azeitona esmagada. Não há outro jeito de fazer.',
    'Há um lugar onde isso se entende. Eu não vou dizer onde: quem é levado pela mão não aprende o caminho.\n\nSó digo que este olival não termina onde parece terminar. E que a sua lâmpada sabe mais do que você.'],
  depois: 'Você já esteve lá. Eu vejo no seu rosto.\n\nEntão você sabe de onde vem o azeite. Agora acenda os outros.' };
