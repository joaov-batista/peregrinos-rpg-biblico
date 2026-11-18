// A sinagoga do Refúgio e a vida que gira em torno dela: os cultos, o sino, as orações de cada morador
// (o que dói, o que pede, o que agradece), a vigília da madrugada, os soldados da ronda e as conversas da noite.
// As horas são as do relógio do Refúgio (um dia inteiro em 10 minutos de jogo).

// os três momentos de oração do dia; "vai" é quando a aldeia começa a ir, "fim" é quando o culto acaba
export const CULTOS = [
  { id: 'manha', nome: 'a oração da manhã', vai: 6.3, ini: 7, fim: 8.4 },
  { id: 'tarde', nome: 'a oração da tarde', vai: 14.4, ini: 15, fim: 16 },
  { id: 'noite', nome: 'o culto da noite', vai: 18.6, ini: 19.4, fim: 21 }
];
// quem levanta de madrugada para orar (os outros dormem à porta)
export const VIGILIA = ['ana', 'bartimeu', 'rode'];

// o que cada um diz a Deus, de joelhos. Ouvido de perto, em voz baixa.
export const ORACOES = {
  ana: [
    'Senhor, esperei tanto para ver o Menino. Agora ensina esta aldeia a esperar também.',
    'Obrigada pelo pão de hoje. E pelo de amanhã, que eu ainda não vi, mas sei que vem.',
    'Lembra do peregrino da lâmpada, Senhor. Ele anda por lugares escuros.',
    'Minhas pernas doem. Mas meus joelhos ainda dobram. Bendito seja.',
    '"Os que esperam no Senhor renovam as suas forças" (Is 40:31). Renova as minhas.'
  ],
  bartimeu: [
    'Filho de Davi, tem misericórdia de mim. Eu ainda grito, só que agora agradecendo.',
    'Tem um cego novo no portão. Abre os olhos dele como abriu os meus.',
    'Às vezes tenho medo de esquecer como foi. Não me deixa esquecer.',
    'Obrigado pela luz, Senhor. Toda manhã ela ainda me assusta de tão bonita.',
    'Perdoa o meu orgulho de ontem. Quem já foi mendigo não devia se achar.'
  ],
  rode: [
    'Senhor, Pedro bateu na porta e eu deixei ele lá fora de tanta alegria. Me ensina a abrir rápido.',
    'Cuida da dona Maria. Ela abre a casa para todo mundo e ninguém abre a dela.',
    'Tenho medo dos soldados. Mas tu mandaste um anjo à prisão. Eu lembro.',
    'Obrigada porque riram de mim e eu estava certa. Mas me ajuda a não guardar mágoa.'
  ],
  rute: [
    'Deus de Noemi, que agora é meu Deus: obrigada por me deixar ficar.',
    'Noemi está fraca hoje. Põe força nos ossos dela.',
    'Às vezes sinto falta de Moabe. Perdoa. E fica comigo mesmo assim.',
    'Abençoa Boaz, que deixa cair espigas de propósito. Que eu também deixe cair coisas boas para os outros.'
  ],
  eutico: [
    'Senhor, eu juro que hoje não durmo no culto. (…) Tá, vou tentar.',
    'Obrigado por eu ter acordado depois da queda. Paulo disse que foi milagre. Eu acredito.',
    'Minha mãe trabalha demais. Dá descanso para ela, que eu já descanso por nós dois.',
    'Me ajuda a prestar atenção. Na janela é tão fresquinho…'
  ],
  jairo: [
    'Senhor, tu disseste "Talitá cumi" e minha filha levantou. Esta casa é tua por isso.',
    'Guarda os que dormem nesta aldeia. E os que não conseguem dormir.',
    'Que as portas desta sinagoga nunca se fechem para quem chega cansado.'
  ],
  qualquer: [
    'Senhor, tem misericórdia.',
    'Obrigado por mais um dia.',
    'Cura o meu filho, Senhor.',
    'Perdoa as minhas dívidas, como eu perdoo… estou tentando, Senhor.',
    'Dá chuva no tempo certo.',
    'Guarda a nossa casa esta noite.'
  ]
};

// o que Jairo diz para começar e terminar cada culto (em voz alta, para todos)
export const LITURGIA = {
  abre: ['"Ouve, Israel: o Senhor nosso Deus é o único Senhor" (Dt 6:4).', '"Vinde, adoremos e prostremo-nos; ajoelhemos diante do Senhor que nos criou" (Sl 95:6).', '"Alegrei-me quando me disseram: vamos à casa do Senhor" (Sl 122:1).'],
  meio: ['Quem tiver um pedido, diga. Deus ouve até o que a gente não tem coragem de dizer.', 'Lembremos dos que estão no caminho, longe de casa.', 'Agradeçamos. Mesmo pelo pouco.'],
  fecha: ['"O Senhor te abençoe e te guarde" (Nm 6:24). Vão em paz.', '"Ao Senhor pertence a terra e tudo o que nela há" (Sl 24:1). Vão em paz.', 'Até a próxima oração. A porta fica aberta.']
};

// Jairo, conforme a hora
export const JAIRO = {
  culto: 'Chegou na hora certa. Ajoelhe-se com a gente, se quiser.',
  fora: [
    'Esta casa é de oração. De manhã, à tarde e à noite a aldeia se reúne aqui. O sino chama.',
    'À meia-noite o sino toca doze vezes. É para lembrar: mesmo no escuro, alguém está acordado orando.',
    'Eu era chefe da sinagoga de Cafarnaum quando minha filha morreu. Ele disse: "Não temas, crê somente" (Mc 5:36).'
  ],
  madrugada: 'De madrugada a casa fica aberta. Quem não consegue dormir vem para cá. Há sempre alguém de joelhos.',
  juntou: 'Amém. Quem ora junto carrega junto. Volte sempre.',
  jaJuntou: 'Você já orou com a gente nesta oração. Fique, a casa é sua.'
};

// os soldados da ronda: andam a aldeia de ponta a ponta, dia e noite
export const GUARDAS = {
  nomes: ['Cornélio, o centurião', 'Um soldado da ronda'],
  dia: ['Paz, peregrino. A ronda está feita.', 'Mantenha a lâmpada acesa. A gente cuida do portão.', '"Vigiai e orai" (Mt 26:41). A primeira parte é comigo.'],
  noite: ['Noite tranquila. Vá descansar, a vigia é nossa.', 'Ouviu o sino? Meia-noite. Ainda faltam horas até a troca.', 'Tem gente orando na sinagoga. Dá paz passar por lá na ronda.'],
  cornelio: 'Eu era centurião da coorte italiana. Orava e dava esmolas, e um anjo me disse: "As tuas orações subiram como memória diante de Deus" (At 10:4). Desde então, faço a ronda e oro.'
};

// o que cada um diz à noite, à porta de casa (sonolento)
export const NOITE = {
  ana: 'Velha dorme pouco. Daqui a pouco vou para a sinagoga. Você vem?',
  bartimeu: 'De noite eu escuto melhor. Ouvi seus passos lá da esquina.',
  rode: 'Não consigo dormir. Fico pensando em quem bate na porta de madrugada.',
  rute: 'Noemi já dormiu. Fico aqui fora um pouco, olhando as estrelas de outra terra.',
  eutico: 'Zzz… hã? Tô acordado! … Boa noite, peregrino.'
};

// a feira da tarde: um vendedor de passagem no Mercado, só à tarde
export const FEIRA = {
  nome: 'Tobias, feirante de passagem',
  look: { skin: '#B07A4E', hair: '#2B1A10', tunic: '#8E6A2E', cape: '#3F6A5A', style: 'turbante', beard: true },
  oi: 'Só passo à tarde! Coisa boa e fresca. Para levar de presente ou para a estrada.',
  precos: { figo: 8, pao: 6, peixe: 14, flor: 10, mel: 34 }
};
