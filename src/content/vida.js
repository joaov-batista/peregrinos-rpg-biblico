// A vida no Refúgio: o calendário das festas (pelo mês de verdade), a mesa da festa e as amizades com os moradores.
// É tudo ficção do Refúgio; as festas e as histórias dos moradores vêm da Escritura e trazem a referência.
export const FESTAS = [
  { id: 'amendoeira', meses: [1, 2], nome: 'A amendoeira em flor', ref: 'Jeremias 1:11-12', enfeite: 'amendoeira', sobre: 'A primeira árvore a florir, ainda no frio. "Que vês tu, Jeremias? Vejo uma vara de amendoeira. Viste bem; porque eu velo sobre a minha palavra, para cumpri-la."',
    dias: ['As amendoeiras do Refúgio floriram antes de todo o resto. Em hebraico, amendoeira e "vigiar" soam quase iguais. Sente-se: há amêndoas torradas.', 'Os moradores penduraram ramos em flor nas portas. Dizem que é para lembrar que Alguém vela, mesmo no inverno.', 'Terceiro dia entre as flores. Ana trouxe um ramo para você: "para quem aprendeu a vigiar".'] },
  { id: 'pascoa', meses: [3, 4], nome: 'A Páscoa', ref: 'Êxodo 12:14; 1 Coríntios 5:7', enfeite: 'mesa', sobre: 'A noite em que o Senhor tirou o seu povo do Egito. Pão sem fermento, ervas amargas e um cordeiro. "Cristo, nosso cordeiro pascal, foi imolado."',
    dias: ['A aldeia inteira varreu o fermento de casa. Na mesa há pão sem fermento e ervas amargas: "para que te lembres do dia em que saíste do Egito".', 'Hoje as crianças fazem as perguntas: "Por que esta noite é diferente de todas as outras?" E os velhos respondem, um por um.', 'Terceira noite. Alguém deixou um lugar vazio à mesa e um cálice cheio. Ninguém soube dizer para quem. Você tem um palpite.'] },
  { id: 'pentecostes', meses: [5, 6], nome: 'A Festa das Semanas', ref: 'Levítico 23:15-16; Atos 2:1', enfeite: 'feixe', sobre: 'Cinquenta dias depois da Páscoa, os primeiros frutos da colheita do trigo. Foi nesse dia que o Espírito desceu sobre os que estavam reunidos.',
    dias: ['Feixes de trigo em todas as portas. Rute anda radiante: é a festa de quem um dia respigou atrás dos segadores.', 'Os moradores trouxeram os primeiros pães da colheita. "Não aparecerás de mãos vazias" (Dt 16:16).', 'Terceiro dia. Um vento forte passou pela praça ao entardecer, e ninguém teve medo. Todos pararam de falar ao mesmo tempo.'] },
  { id: 'vindima', meses: [7, 8], nome: 'A vindima e o azeite novo', ref: 'Joel 2:24', enfeite: 'cestos', sobre: 'O tempo de colher as uvas e de pisar o lagar. "As eiras se encherão de trigo, e os lagares transbordarão de vinho e de azeite."',
    dias: ['Cestos de uva pela aldeia inteira e os pés de todo mundo roxos. O lagar não para.', 'Chegaram as primeiras azeitonas. Tubalcaim consertou a trave da prensa e Lídia mediu o azeite novo, botija por botija.', 'Terceiro dia. Sobrou azeite depois de encher todas as lamparinas. O Velho mandou guardar um pouco: "para a lâmpada de quem ainda vai chegar".'] },
  { id: 'tabernaculos', meses: [9, 10], nome: 'A Festa dos Tabernáculos', ref: 'Levítico 23:42-43', enfeite: 'cabana', sobre: 'Sete dias morando em cabanas de ramos, para lembrar que o povo viveu em tendas no deserto, e que Deus morou com eles.',
    dias: ['O Refúgio saiu de casa: há cabanas de ramos em todas as praças. Peregrino nenhum estranha dormir em tenda.', 'À noite, dá para ver as estrelas por entre os ramos do teto. É de propósito.', 'Terceira noite nas cabanas. Alguém leu em voz alta: "O Verbo se fez carne e armou a sua tenda entre nós" (Jo 1:14).'] },
  { id: 'chuvas', meses: [11], nome: 'As primeiras chuvas', ref: 'Deuteronômio 11:14; Salmo 126:5', enfeite: 'cestos', sobre: 'Depois do verão seco, a chuva temporã amolece a terra e começa a semeadura. "Os que semeiam em lágrimas, com júbilo ceifarão."',
    dias: ['Choveu de madrugada. A aldeia acordou com cheiro de terra molhada e saiu para semear.', 'Os cestos de semente passam de mão em mão. Quem semeia não vê nada por muito tempo. Semeia assim mesmo.', 'Terceiro dia de semeadura. Bartimeu jogou um punhado de grãos e riu: "Eu também fiquei muito tempo no escuro antes de brotar."'] },
  { id: 'luzes', meses: [12], nome: 'A Festa das Luzes', ref: 'João 10:22; Lucas 2:10-11', enfeite: 'estrela', sobre: 'A Festa da Dedicação, no inverno, quando o templo foi purificado e as lâmpadas acesas de novo. E a noite em que os pastores ouviram: "Hoje vos nasceu o Salvador."',
    dias: ['Uma lâmpada a mais em cada janela, toda noite. A aldeia que estava se apagando nunca esteve tão acesa.', 'Os pastores do olival desceram para a praça. Dizem que numa noite assim ouviram cantar no céu.', 'Terceira noite. Penduraram uma estrela no alto do poço. As crianças perguntam para onde ela aponta.'] }
];

// amizade: um coração por dia de conversa (até 10). Aos 3 e aos 7, o morador abre uma coisa que não conta a qualquer um.
export const AMIGOS = {
  velho: { nome: 'Velho Peregrino', eventos: [
    ['Você reparou que eu nunca disse o meu nome? Não é segredo. É que o caminho gasta o nome da gente, e o que sobra é o que a gente faz: peregrino.\n\n"Confessaram que eram estrangeiros e peregrinos na terra" (Hb 11:13). Tome: era a minha sacola de viagem.', { gold: 80 }],
    ['Vou te contar por que eu parei de andar. Não foi cansaço. Alguém precisava ficar para acender a lâmpada de quem chega.\n\nUm dia você também vai parar em algum lugar. Que seja para isso.', { mana: 1 }]] },
  rode: { nome: 'Rode', eventos: [
    ['Você sempre para para falar comigo. Quase ninguém para: sou só a criada.\n\nMas quem abriu a porta naquela noite fui eu (At 12:13). Bom… quase abri. Tome, guardei para você.', { gold: 60 }],
    ['Posso te pedir uma coisa? Quando você orar, não ore como quem não espera resposta. Eles oravam por Pedro e chamaram de louca quem veio dizer que ele estava na porta.\n\nEu prefiro ser a louca.', { mana: 1 }]] },
  bartimeu: { nome: 'Bartimeu', eventos: [
    ['Sabe o que eu fiz com a capa? Joguei fora (Mc 10:50). Era tudo o que eu tinha: cama, casa e sacola de esmola. E eu joguei antes de enxergar.\n\nAcho que foi aí que eu comecei a ver.', { gold: 60 }],
    ['Todo mundo lembra que eu fui curado. Pouca gente lembra do fim: "e seguia Jesus pelo caminho" (Mc 10:52).\n\nEnxergar foi o começo. O resto é caminho. Você sabe disso melhor do que eu.', { mana: 1 }]] },
  ana: { nome: 'Ana, a profetisa', eventos: [
    ['Fui casada sete anos. Depois, viúva até os oitenta e quatro (Lc 2:36-37). As pessoas contam os anos de espera como anos perdidos.\n\nEu conto diferente: foram os anos em que eu aprendi a reconhecer.', { gold: 60 }],
    ['Quando o menino entrou no templo, eu "falava a respeito dele a todos os que esperavam a redenção" (Lc 2:38).\n\nEsse é o único trabalho que me restou, e é o melhor que eu já tive. Você está na lista, peregrino.', { mana: 1 }]] },
  pedro: { nome: 'Simão, o pescador', eventos: [
    ['Você pesca mal. Não se ofenda: eu também pescava mal na noite em que ele mandou lançar a rede do outro lado (Jo 21:6).\n\nÀs vezes o problema não é a rede. É o lado.', { gold: 60 }],
    ['Eu disse que morreria por ele. Naquela mesma noite, perto de uma fogueira, jurei que não o conhecia (Lc 22:60).\n\nEle me olhou. Não foi um olhar de raiva, e isso foi o pior e o melhor. Se um dia você falhar com ele, lembre-se de mim.', { mana: 1 }]] },
  lidia: { nome: 'Lídia', eventos: [
    ['Eu insisti: "Entrai em minha casa e ficai" (At 16:15). Dizem que eu os constrangi a aceitar. É verdade.\n\nHospitalidade é isso, peregrino: não aceitar "não" de quem está cansado.', { gold: 60 }],
    ['Vendi púrpura para gente muito rica. Nunca vi nenhum deles tão rico quanto os presos que cantavam à meia-noite numa cela de Filipos (At 16:25).\n\nDesde então eu meço riqueza de outro jeito.', { mana: 1 }]] },
  rute: { nome: 'Rute', eventos: [
    ['Eu era estrangeira e respigava o que os segadores deixavam cair (Rt 2:3). Ninguém me devia nada.\n\nUm dia percebi que estavam deixando cair de propósito. A bondade também tem dono.', { gold: 60 }],
    ['"O teu povo será o meu povo, e o teu Deus será o meu Deus" (Rt 1:16). Eu disse isso a uma sogra amargurada, numa estrada, sem saber onde ia dormir.\n\nNão foi coragem. Foi amor. Às vezes dá no mesmo.', { mana: 1 }]] }
};
export const AMIGO_QUALQUER = [['Já conheço você pelo passo. Tome: figos do olival, para o caminho.', { gold: 30 }], ['Você virou gente da casa, peregrino. No Refúgio isso vale mais do que denários… mas tome uns denários também.', { gold: 70 }]];
