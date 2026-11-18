// O que a gente do Refúgio gosta, pede, dá e conversa entre si. (As falas de visita ficam em vila.js.)
// Itens da bolsa: figo (frutos das árvores), peixe (pesca), pão e mel (vasos), flor (canteiros do olival e da praça).
export const ITENS = {
  figo: { nome: 'Figo', plural: 'figos' }, peixe: { nome: 'Peixe', plural: 'peixes' }, pao: { nome: 'Pão', plural: 'pães' },
  flor: { nome: 'Flor do campo', plural: 'flores' }, mel: { nome: 'Mel', plural: 'potes de mel' }
};

// gostos: ama (+muito), gosta, não gosta; os outros itens são aceitos com um "obrigado" simples
export const GENTE = {
  rode: {
    ama: 'flor', gosta: ['figo', 'mel'], naoGosta: 'peixe',
    cumprimenta: ['Ah, é você! Entra, entra!', 'Bom dia, peregrino!', 'Você de novo! Que bom.'],
    reage: { ama: 'Uma flor? Para mim? Vou pôr na janela, para quem bater ver de longe.', gosta: 'Hum! Obrigada. Vou dividir com a dona da casa.', naoGosta: 'Ai… peixe tem cheiro de porto. Mas obrigada pela lembrança, viu?', neutro: 'Que gentil. Obrigada.' },
    pedido: { item: 'flor', n: 2, texto: 'Amanhã tem oração na casa de Maria, a mãe de João Marcos. Você me arranja duas flores do campo para a mesa? Crescem no olival.', obrigado: 'Ficou linda a mesa. Quando baterem na porta, vão ver flores. E eu vou abrir na hora, prometo.', ouro: 60 },
    presentes: [{ nivel: 2, item: 'pao', n: 2, fala: 'Sobrou pão da ceia. Leve, a estrada é longa.' }, { nivel: 4, reliquia: 'sal_terra', fala: 'Isto era da minha senhora. Ela disse que o sal é para dar sabor, não para guardar. Fica com você.' }, { nivel: 5, ouro: 250, fala: 'Juntei para você. Não discuta: quem abre a porta também pode abrir a bolsa.' }]
  },
  bartimeu: {
    ama: 'pao', gosta: ['mel', 'peixe'], naoGosta: 'flor',
    cumprimenta: ['Reconheço esses passos!', 'Peregrino! Senta um pouco.', 'Ah, a lâmpada de novo. Eu vejo bem a luz, sabia?'],
    reage: { ama: 'Pão quente! Na beira da estrada de Jericó eu só pedia isso. Hoje como devagar, agradecendo.', gosta: 'Isso eu aceito com gosto. Obrigado, irmão.', naoGosta: 'Uma flor? Eu prefiro olhar as pessoas. Mas deixa aí, alguém vai gostar.', neutro: 'Obrigado. Deus lhe pague.' },
    pedido: { item: 'pao', n: 2, texto: 'Tem um mendigo novo no portão. Igual eu era. Você me traz dois pães? Quero levar para ele com as minhas mãos.', obrigado: 'Ele chorou quando eu disse que já fui cego. Agora somos dois que gritam "Filho de Davi" pela estrada.', ouro: 50 },
    presentes: [{ nivel: 2, item: 'mel', n: 1, fala: 'Me deram mel na estrada. Mel é para quem caminha. Toma.' }, { nivel: 4, reliquia: 'semente_mostarda', fala: 'Guardei esta semente desde Jericó. É pequena, mas eu vi coisa maior que montanha se mover.' }, { nivel: 5, ouro: 200, fala: 'Para você. Já pedi muito na vida. Agora é a minha vez de dar.' }]
  },
  rute: {
    ama: 'figo', gosta: ['pao', 'flor'], naoGosta: 'mel',
    cumprimenta: ['Bom dia! O campo está bonito hoje.', 'Peregrino! Que bom ver você.', 'Olá! Ainda tem espiga caída por aí, se precisar.'],
    reage: { ama: 'Figos! Lembram a casa de Noemi. Ela comia com tanto gosto… obrigada.', gosta: 'Obrigada! Vou guardar para a ceia.', naoGosta: 'Mel me dá enjoo, desde pequena. Mas obrigada pelo carinho.', neutro: 'Obrigada, de coração.' },
    pedido: { item: 'figo', n: 3, texto: 'Noemi está fraca. Três figos maduros ajudariam. As figueiras do mercado dão bem; o pé de Zaqueu também.', obrigado: 'Ela sorriu! Disse: "Chamem-me de novo Noemi, não de Mara". Você não sabe o que isso significa para nós.', ouro: 70 },
    presentes: [{ nivel: 2, item: 'pao', n: 3, fala: 'Fiz pão com a cevada que respiguei. Leve três.' }, { nivel: 4, reliquia: 'mana_deserto', fala: 'Um jarro que era de Boaz. "Não falte o pão nesta casa", ele dizia. Agora não falta na sua estrada.' }, { nivel: 5, ouro: 220, fala: '"O teu povo é o meu povo" (Rt 1:16). Isto é seu, porque você é dos nossos.' }]
  },
  eutico: {
    ama: 'peixe', gosta: ['mel', 'figo'], naoGosta: 'flor',
    cumprimenta: ['Ei! Tô acordado, tô acordado!', 'E aí, peregrino!', 'Opa! Vamos apostar corrida?'],
    reage: { ama: 'PEIXE! Assado na brasa, com sal… você é o melhor peregrino do mundo.', gosta: 'Valeu! Isso enche a barriga.', naoGosta: 'Flor? Hã… minha mãe vai gostar. Valeu?', neutro: 'Valeu, peregrino!' },
    pedido: { item: 'peixe', n: 1, texto: 'Quero aprender a pescar, mas Zebedeu diz que eu durmo no barco. Me traz um peixe? Assim eu provo que dá para pescar acordado. Ou quase.', obrigado: 'Mostrei para todo mundo! Zebedeu riu e disse que amanhã eu vou no barco. Acordado. Prometo.', ouro: 40 },
    presentes: [{ nivel: 2, item: 'figo', n: 2, fala: 'Peguei esses figos lá do alto. Não caí. Desta vez.' }, { nivel: 4, reliquia: 'aljava_jonatas', fala: 'Achei isto numa janela alta. Eu tava dormindo lá, claro. Fica com você, você mira melhor.' }, { nivel: 5, ouro: 150, fala: 'Juntei de recado em recado. É seu! Paulo diz que eu tenho uma segunda chance. Você também, sempre.' }]
  },
  ana: {
    ama: 'mel', gosta: ['flor', 'pao'], naoGosta: 'peixe',
    cumprimenta: ['A paz, meu filho.', 'Que o Senhor guarde a sua saída e a sua entrada.', 'Vem, senta. Velha gosta de visita.'],
    reage: { ama: 'Mel… "Quão doces são as tuas palavras ao meu paladar, mais que o mel à minha boca" (Sl 119:103). Obrigada.', gosta: 'Que bonito. Obrigada, filho.', naoGosta: 'Peixe a esta hora? Não tenho mais dente para espinha, filho. Mas Deus lhe pague.', neutro: 'Deus lhe pague.' },
    pedido: { item: 'mel', n: 1, texto: 'Estou em jejum há tanto tempo… mas no sábado quero partir o jejum com algo doce. Um pouco de mel, se achar. Às vezes vem nos vasos.', obrigado: 'Doce como a promessa. Eu esperei oitenta e quatro anos para ver o Menino. Esperar mel foi fácil.', ouro: 80 },
    presentes: [{ nivel: 2, item: 'flor', n: 2, fala: 'Colhi no caminho do templo. Leve.' }, { nivel: 4, reliquia: 'cantico_novo', fala: 'Cantei este cântico quando segurei o Menino. Agora é seu.' }, { nivel: 5, ouro: 300, fala: 'Velha não precisa de moeda. Peregrino precisa. Vai.' }]
  }
};

// os moradores da Rua das casas e do Portão das vinhas: com eles dá para criar laço até o casamento (casavel: 'f' ou 'm')
Object.assign(GENTE, {
  miria: { casavel: 'f', ama: 'flor', gosta: ['mel', 'figo'], naoGosta: 'peixe',
    cumprimenta: ['Olá! Cuidado com o fio, está esticado na rua.', 'Peregrino! Veio ver o tear?', 'Bom te ver.'],
    reage: { ama: 'Flores… vou tingir um fio com a cor delas. Obrigada.', gosta: 'Que delícia. Obrigada!', naoGosta: 'Peixe no meio da lã? Ai… mas obrigada.', neutro: 'Obrigada!' },
    pedido: { item: 'flor', n: 3, texto: 'Estou tecendo um manto para a filha de Jairo, que vai casar. Preciso de três flores do campo para tingir a barra.', obrigado: 'Ficou da cor do pôr do sol. Ela chorou quando viu.', ouro: 70 },
    presentes: [{ nivel: 2, item: 'mel', n: 1, fala: 'Me deram mel pelo manto. Divido com você.' }, { nivel: 4, ouro: 120, fala: 'Vendi um tapete. Fica com uma parte: você me trouxe as flores.' }, { nivel: 5, item: 'flor', n: 3, fala: 'Colhi estas pensando em você.' }] },
  sela: { casavel: 'f', ama: 'figo', gosta: ['mel', 'flor'], naoGosta: 'peixe',
    cumprimenta: ['Chegou na hora do pão quente!', 'Ei, peregrino! Tem farinha no meu nariz?', 'Bom dia, bom dia!'],
    reage: { ama: 'Figos! Vou fazer pão de figo. O primeiro é seu.', gosta: 'Hum, que bom. Obrigada!', naoGosta: 'Peixe… na padaria não. Mas obrigada.', neutro: 'Obrigada, de coração.' },
    pedido: { item: 'figo', n: 3, texto: 'Quero fazer pão de figo para a ceia dos irmãos. Me traz três figos?', obrigado: 'O pão de figo acabou em um instante. Disseram que nunca comeram igual.', ouro: 60 },
    presentes: [{ nivel: 2, item: 'pao', n: 3, fala: 'Três pães quentes. Leve para a estrada.' }, { nivel: 4, ouro: 100, fala: 'Vendi bem hoje. Isto é seu.' }, { nivel: 5, item: 'pao', n: 5, fala: 'Fiz uma fornada só para você.' }] },
  asafe: { casavel: 'm', ama: 'mel', gosta: ['figo', 'pao'], naoGosta: 'flor',
    cumprimenta: ['Ouça este acorde… bonito, não?', 'Peregrina! Ou peregrino… sente-se, vou tocar.', 'Paz!'],
    reage: { ama: 'Mel! A voz agradece. "Quão doces são as tuas palavras" (Sl 119:103).', gosta: 'Obrigado, de verdade.', naoGosta: 'Flores fazem eu espirrar no meio do salmo… mas obrigado.', neutro: 'Obrigado!' },
    pedido: { item: 'mel', n: 1, texto: 'Vou cantar no culto da noite e minha voz está rouca. Um pouco de mel salvaria o salmo.', obrigado: 'Cantei o Salmo 23 inteiro sem falhar. Jairo sorriu.', ouro: 70 },
    presentes: [{ nivel: 2, item: 'figo', n: 2, fala: 'Me deram figos depois do culto. Leve.' }, { nivel: 4, ouro: 120, fala: 'Uma oferta pelos salmos. Fica com você.' }, { nivel: 5, item: 'mel', n: 2, fala: 'Mel, para a sua voz também.' }] },
  eliabe: { casavel: 'm', ama: 'pao', gosta: ['peixe', 'figo'], naoGosta: 'mel',
    cumprimenta: ['As ovelhas conhecem a minha voz. Você também já conhece.', 'Paz, peregrino.', 'Fique à vontade na eira.'],
    reage: { ama: 'Pão! No pasto, pão é festa. Obrigado.', gosta: 'Isso enche o alforje. Obrigado.', naoGosta: 'Mel atrai abelha para o rebanho… mas obrigado.', neutro: 'Obrigado.' },
    pedido: { item: 'pao', n: 2, texto: 'Vou passar três noites no pasto com uma ovelha que se perdeu e voltou machucada. Dois pães me sustentam.', obrigado: 'Ela sarou. Deixei as noventa e nove e fui atrás dela. Valeu cada noite.', ouro: 60 },
    presentes: [{ nivel: 2, item: 'peixe', n: 1, fala: 'Troquei lã por peixe no porto. É seu.' }, { nivel: 4, ouro: 110, fala: 'Vendi a lã da tosquia. Uma parte é sua.' }, { nivel: 5, item: 'figo', n: 4, fala: 'Figos do pé que fica no pasto. Os melhores.' }] }
});

// namoro, pedido e casamento (o anel é forjado por Tubalcaim)
export const CASAMENTO = {
  falta: (nome) => 'Você gosta de ' + nome + ', dá para ver. Mas casamento é laço de dez corações e um anel na mão.',
  pedido: { miria: 'Eu… sim. Sim! Vou tecer o véu eu mesma.', sela: 'Você está pedindo… com um anel? Ai, a farinha! Sim. Sim!', asafe: 'Eu tinha um salmo pronto para este dia e esqueci tudo. Sim.', eliabe: 'O pastor deixa tudo pela ovelha que ama. Sim, eu deixo.' },
  festa: ['Na sinagoga, Jairo ergue as mãos: "O Senhor te abençoe e te guarde" (Nm 6:24).', 'A aldeia inteira veio. Sela fez pão, Asafe tocou, Miriã teceu, Eliabe trouxe um cordeiro. Ana chorou de alegria na primeira fila.', '"Por isso deixará o homem o seu pai e a sua mãe, e se unirá à sua mulher, e serão os dois uma só carne" (Gn 2:24).'],
  bomDia: ['Bom dia, meu amor. Dormiu bem?', 'Separei pão para você levar.', 'Volte cedo. A casa fica grande sem você.', 'Orei por você hoje de manhã.'],
  presenteDia: 'Guardei isto para você.'
};
// a ceia dos irmãos: toda noite, na casa de Marta e Maria, para quem já criou laço (4 corações ou mais)
export const CEIA = {
  falta: 'A mesa é grande, mas a ceia é de irmãos. Volte quando tiver laço de verdade com pelo menos dois daqui. (4 corações ou mais)',
  hora: 'A ceia é depois do culto da noite, entre as nove e as dez e meia.',
  abre: '"E perseveravam… no partir do pão e nas orações" (At 2:42). Marta põe a mesa; Maria já está sentada, ouvindo.',
  falas: {
    rode: 'Hoje bateu alguém na porta de novo e eu abri na hora. Na hora!', bartimeu: 'Me passa o pão? Gosto de sentir o calor dele nas mãos.', rute: 'Noemi mandou dizer que está melhor. Comeu tudo hoje.', eutico: 'Prometo não dormir na mesa. (…) Pelo menos não antes da sobremesa.', ana: 'Vamos dar graças primeiro. Velha não come sem agradecer.',
    miria: 'Teci a toalha da mesa. Repararam no barrado?', sela: 'O pão é de figo. Comam enquanto está quente!', asafe: 'Depois da ceia eu toco um salmo. Só um. Talvez dois.', eliabe: 'As ovelhas dormiram cedo. Hoje eu fico até o fim.'
  },
  fecha: 'Partem o pão, dão graças, cantam um salmo. Quando você sai, a noite parece menos escura.'
};

// quando dois se encontram na rua: conversas curtas, ditas em balões
export const PAPOS = [
  ['Viu o céu hoje cedo?', 'Vi. Parecia pintado.'],
  ['O pão subiu bonito hoje.', 'Me guarda um pedaço?'],
  ['Dizem que chegou um navio de Társis.', 'Sempre dizem. Nunca chega.'],
  ['Você dormiu na janela de novo?', 'Só um pouquinho…'],
  ['Choveu lá pros lados do olival.', 'Bom para os figos.'],
  ['Ouviu o galo de madrugada?', 'Ouvi. Simão ficou quieto o dia todo.'],
  ['Aquele peregrino de novo.', 'Gosto dele. Carrega luz.'],
  ['Amanhã tem oração?', 'Na casa de Maria. Leva flor.']
];
