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
