// A FASE DA CÉLULA — "Jesus me escolheu" (João 15:16), semana de 15 a 21/11.
// Feita para a célula de adolescentes: uma sala à parte do jogo (/celula), aberta por link, sem conta, para quantos vierem.
// Cinco páginas curtas (duas câmaras cada) e cinco chefes, um para cada ponto do estudo:
// escolheu · amou · formou · capacitou · enviou. Os chefes são as mentiras que o estudo desmonta; os golpes
// vêm de estilos que já existem (src/caminho/chefes.js, no fim) e a arte é própria (src/caminho/pixel/chefes-g.js).
// pergunta: a primeira resposta é a certa (o jogo embaralha). Quatro opções, com pegadinhas de propósito: é para pensar.
const q = (pergunta, certa, e1, e2, e3, porque) => ({ q: pergunta, a: [certa, e1, e2, e3], porque });
const chefe = (nome, titulo, cor, cor2, simbolo, ref, intro, derrota, r = 40) => ({ nome, titulo, cor, cor2, simbolo, ref, intro, derrota, r, lv: 1, hp: 500, atk: 8, def: 3, spd: 65, xp: 60, ouro: 45 });

const JESUS = { skin: '#C68B59', hair: '#3A2314', tunic: '#ECE3CF', cape: '#9A2A2A', style: 'longo', beard: true };
const PEDRO = { skin: '#A0673E', hair: '#3A2314', tunic: '#497A80', cape: 'none', style: 'cacheado', beard: true, body: 'forte' };
const JOAO = { skin: '#D9A273', hair: '#6B4423', tunic: '#7A5A8A', cape: 'none', style: 'longo', beard: false };
const LIDER = { skin: '#B97A4E', hair: '#1C120A', tunic: '#2F4A7A', cape: '#D7B25A', style: 'curto', beard: false };
const MARIA = { skin: '#D9A273', hair: '#2B1A10', tunic: '#3F6C8C', cape: '#E8E2CF', style: 'veu', beard: false };
const PAULO = { skin: '#C68B59', hair: '#2B1A10', tunic: '#7A2E3A', cape: '#C9A06A', style: 'curto', beard: true };
const CRIADA = { skin: '#B97A4E', hair: '#1C120A', tunic: '#8C7A63', cape: 'none', style: 'veu', beard: false };
const OLEIRO = { skin: '#C68B59', hair: '#D9D2C5', tunic: '#8C6A4A', cape: 'none', style: 'turbante', beard: true };

export default {
  id: 'celula-escolheu',
  titulo: 'Jesus me escolheu',
  estudo: 'João 15:16',
  evento: true,
  soCaminho: true,
  semana: '15/11 a 21/11',
  resumo: 'Você não escolheu Jesus primeiro: ele te escolheu. E escolheu para ir e dar fruto, fruto que permaneça. Cinco páginas: ele me escolheu, me amou, me formou, me capacitou e me enviou.',
  versiculo: { texto: 'Vocês não me escolheram, mas eu os escolhi para irem e darem fruto, fruto que permaneça, a fim de que o Pai lhes conceda o que pedirem em meu nome.', ref: 'João 15:16' },
  declare: 'Deus não errou ao me escolher! Ele está comigo ajudando-me em cada passo que dou.',
  guia: { nome: 'Líder de célula', look: LIDER },
  chefes: {
    rejeicao: chefe('A Rejeição', 'A voz do "ninguém te escolheu"', '#8E9AB8', '#1E2236', '✕', 'João 15:16',
      'Ninguém escolheu você. Ninguém nunca vai escolher. Você é sempre o último do time.',
      '"Vocês não me escolheram, mas eu os escolhi" (Jo 15:16). Antes de você dar qualquer passo, ele já tinha escolhido você (Ef 1:4).', 40),
    interesseiro: chefe('O Interesseiro', 'O amor que cobra', '#E0B04A', '#3A2440', '💰', 'Romanos 5:8',
      'Eu só te amo SE você for bonito. SE for rico. SE for o melhor. Me paga, que eu te amo!',
      '"Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores" (Rm 5:8). Ágape: amor sem condição. Ele não é interesseiro.', 40),
    condenacao: chefe('A Condenação', 'As correntes do passado', '#9A5A4A', '#20141A', '⛓', 'Romanos 8:1',
      'Eu sei o que você fez. Você nunca vai mudar. Essa corrente é sua para sempre.',
      '"Agora já não há condenação para os que estão em Cristo Jesus" (Rm 8:1). "Se alguém está em Cristo, é nova criação" (2Co 5:17).', 42),
    covardia: chefe('A Covardia', 'O frio do pátio', '#7FA6C9', '#141C2A', '🐓', 'Lucas 22:60',
      'Homem, não sei do que você está falando! Esconde isso. Ninguém precisa saber que você é dele.',
      'Pedro negou três vezes e chorou. Cinquenta dias depois, cheio do Espírito, falou a milhares (At 2:14). Jesus não escolhe os capacitados: capacita os escolhidos.', 38),
    fracasso: chefe('O Fracasso', 'O acusador da insuficiência', '#C94A4A', '#1A0A12', '☠', 'Atos 1:8',
      'Deus errou com você. Você não é capaz. Fica quieto, fica em casa, ninguém vai te ouvir.',
      '"Receberão poder quando o Espírito Santo descer sobre vocês, e serão minhas testemunhas" (At 1:8). Deus não errou ao me escolher!', 46)
  },
  // a batalha de versículos do último chefe: as mentiras desta semana e o que está escrito
  acusacoes: [
    { lie: 'Ninguém escolheu você.', v: 'Vocês não me escolheram, mas eu os escolhi para irem e darem fruto.', ref: 'João 15:16' },
    { lie: 'Deus só te ama quando você acerta.', v: 'Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.', ref: 'Romanos 5:8' },
    { lie: 'Você continua sendo quem era antes.', v: 'Se alguém está em Cristo, é nova criação. As coisas antigas já passaram.', ref: '2 Coríntios 5:17' },
    { lie: 'Você está condenado pelo que fez.', v: 'Agora já não há condenação para os que estão em Cristo Jesus.', ref: 'Romanos 8:1' },
    { lie: 'Você não vai saber o que dizer.', v: 'Não se preocupem quanto ao que dizer; o Espírito do Pai falará por intermédio de vocês.', ref: 'Mateus 10:19-20' },
    { lie: 'Você não tem força para isso.', v: 'Receberão poder quando o Espírito Santo descer sobre vocês, e serão minhas testemunhas.', ref: 'Atos 1:8' },
    { lie: 'Algo ainda pode separar você do amor de Deus.', v: 'Nem a morte nem a vida… nada poderá nos separar do amor de Deus que está em Cristo Jesus.', ref: 'Romanos 8:38-39' }
  ],
  fases: [
    {
      n: 1, nome: 'Ele me escolheu', ref: 'João 15:16', tema: 'arvore', nivel: 1, chefe: 'rejeicao', rolos: 2, ondas: 2, tesouro: false, segredos: [],
      objetivo: 'Fale com quem explica a Palavra, vençam a votação dos dois rolos e calem a voz da Rejeição.',
      licao: 'Às vezes a gente acha que Jesus só nos escolheu porque nós escolhemos ele primeiro. A Bíblia ensina o contrário: antes de darmos qualquer passo em direção a Cristo, ele já tinha nos escolhido.',
      versiculo: { texto: 'Vocês não me escolheram, mas eu os escolhi para irem e darem fruto, fruto que permaneça, a fim de que o Pai lhes conceda o que pedirem em meu nome.', ref: 'João 15:16' },
      estudo: [
        'ENTENDA: "Deus nos escolheu nele antes da criação do mundo, para sermos santos e irrepreensíveis em sua presença. Em amor nos predestinou para sermos adotados como filhos por meio de Jesus Cristo" (Ef 1:4-5).',
        'LEMBRE: Deus nunca erra. Quando Jesus escolheu você, ele acertou. Não porque você é bom ou perfeito, mas porque ele garante a vitória.'
      ],
      reflexao: 'Em que momento você se sentiu "o último a ser escolhido"? O que muda saber que Jesus escolheu você primeiro?',
      inimigos: ['desanimo', 'duvida', 'distracao'],
      npcs: {
        N: { nome: 'João, o discípulo', look: JOAO, falas: ['Eu estava lá na última ceia quando ele disse: "Vocês não me escolheram, mas eu os escolhi" (Jo 15:16). Repare: escolheu PARA alguma coisa. Para ir e dar fruto.', 'E não qualquer fruto: "fruto que permaneça". Fruto que não apodrece na semana seguinte.'] },
        M: { nome: 'Líder de célula', look: LIDER, falas: ['Efésios 1:4 diz QUANDO Deus nos escolheu: antes da criação do mundo. Antes de você nascer, antes de você errar, antes de você acertar.', 'Então a escolha não depende do seu desempenho. Ela já estava feita.'] },
        O: { nome: 'Maria, da célula', look: MARIA, falas: ['O inimigo tenta desanimar a gente com pensamentos de fracasso e de "não sou suficiente".', 'É verdade: sozinhos a gente não consegue nada. Mas a gente não está sozinho: precisamos de Cristo todo dia, e ele está aqui.'] }
      },
      quiz: [
        q('Em João 15:16, Jesus diz que nos escolheu para irmos e darmos fruto. Que tipo de fruto?', 'Fruto que permaneça', 'Fruto abundante e doce', 'Fruto no tempo certo', 'Muito fruto para o Pai', '"…para irem e darem fruto, fruto que permaneça" (Jo 15:16).'),
        q('Segundo Efésios 1:4, QUANDO Deus nos escolheu?', 'Antes da criação do mundo', 'No dia do nosso batismo', 'Quando aceitamos Jesus', 'Na cruz, quando Jesus morreu', '"Deus nos escolheu nele antes da criação do mundo" (Ef 1:4).'),
        q('Efésios 1:4 diz que fomos escolhidos para sermos…', 'Santos e irrepreensíveis em sua presença', 'Fortes e corajosos na batalha', 'Ricos e prósperos na terra', 'Sábios e entendidos nas Escrituras', '"…para sermos santos e irrepreensíveis em sua presença" (Ef 1:4).'),
        q('Em amor, Deus nos predestinou para sermos o quê (Ef 1:5)?', 'Adotados como filhos', 'Servos do Rei', 'Profetas das nações', 'Anjos no céu', '"Em amor nos predestinou para sermos adotados como filhos por meio de Jesus Cristo" (Ef 1:5).'),
        q('O estudo diz que Jesus acertou ao nos escolher. Por quê?', 'Porque ele garante a vitória, não porque somos perfeitos', 'Porque somos mais esforçados que os outros', 'Porque nascemos em família cristã', 'Porque prometemos nunca mais errar', '"Não porque você é bom ou perfeito, mas porque ele nos garante a vitória."'),
        q('Complete João 15:16: "…a fim de que o Pai lhes conceda…"', '…o que pedirem em meu nome', '…a vida eterna no céu', '…sabedoria e entendimento', '…paz em todo tempo', '"…a fim de que o Pai lhes conceda o que pedirem em meu nome" (Jo 15:16).'),
        q('Que tipo de pensamento Satanás usa para nos desanimar, segundo o estudo?', 'Fracasso e insuficiência', 'Orgulho e vaidade', 'Preguiça e sono', 'Raiva e vingança', '"Satanás tenta nos desanimar colocando pensamentos de fracasso e insuficiência."'),
        q('Quem é o autor do Evangelho de João 15?', 'João, o discípulo amado', 'João Batista', 'João Marcos', 'Lucas, o médico', 'O quarto Evangelho é atribuído ao apóstolo João, "o discípulo a quem Jesus amava".')
      ]
    },
    {
      n: 2, nome: 'Ele me amou', ref: 'Romanos 5:8', tema: 'casa', nivel: 2, chefe: 'interesseiro', rolos: 2, ondas: 2, tesouro: false, segredos: [],
      objetivo: 'Ouça quem explica o ágape, vençam a votação dos rolos e desmascarem o Interesseiro.',
      licao: 'O amor de Cristo é um mistério para nós. A palavra grega para o amor de Deus é "ágape": amor incondicional. Jesus não nos ama por causa de algo que fizemos. Ele não é interesseiro.',
      versiculo: { texto: 'Mas Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.', ref: 'Romanos 5:8' },
      estudo: [
        'PENSE: se alguém te ama "porque você é bonito", "porque é inteligente" ou "porque tem dinheiro", esse amor está preso a coisas passageiras. No dia em que elas sumirem, vem a insegurança.',
        'ENTENDA: Jesus te ama porque esta é a natureza dele. Nada nesta vida pode fazer o Senhor parar de nos amar, nem a morte, nem o pecado (Rm 8:38-39).'
      ],
      reflexao: 'Você já tentou "merecer" o amor de alguém? Como é saber que o amor de Jesus não depende disso?',
      inimigos: ['vaidade', 'inveja', 'ganancia'],
      npcs: {
        N: { nome: 'Pedro', look: PEDRO, falas: ['Eu errei feio com ele. Neguei três vezes. Depois, na praia, ele me perguntou três vezes: "Você me ama?" (Jo 21).', 'Uma pergunta para cada negação. Ele não desistiu de mim. O amor dele não tem "se".'] },
        M: { nome: 'Paulo', look: PAULO, falas: ['Eu escrevi aos romanos: Cristo morreu por nós quando AINDA éramos pecadores (Rm 5:8). Não depois que melhoramos.', 'E escrevi também: nem morte, nem vida, nem anjos, nem coisas presentes ou futuras podem nos separar do amor de Deus (Rm 8:38-39).'] },
        O: { nome: 'Líder de célula', look: LIDER, falas: ['Ágape é uma palavra grega: o amor incondicional de Deus. Tem outras palavras gregas para amor, mas é ágape que descreve o amor de Deus.', '"Eu te amo porque te amo. É a minha natureza." É assim que Jesus responde quando você pergunta "por que você me ama?".'] }
      },
      quiz: [
        q('A palavra "ágape" vem de qual língua?', 'Grego', 'Hebraico', 'Latim', 'Aramaico', 'O estudo diz: "a palavra grega que se refere ao amor de Deus é ágape".'),
        q('Romanos 5:8: Cristo morreu por nós quando…', '…ainda éramos pecadores', '…já tínhamos nos arrependido', '…começamos a buscá-lo', '…fomos batizados', '"Cristo morreu em nosso favor quando ainda éramos pecadores" (Rm 5:8).'),
        q('Qual passagem diz que nada pode nos separar do amor de Deus?', 'Romanos 8:38-39', 'Romanos 5:8', 'João 3:16', '1 Coríntios 13:4', 'Rm 8:38-39: nem morte, nem vida… nada nos separa do amor de Deus em Cristo.'),
        q('No exemplo do estudo, por que "te amo porque você é linda" é uma resposta perigosa?', 'Porque a beleza passa e a identidade fica presa a ela', 'Porque é mentira', 'Porque elogiar é vaidade', 'Porque o marido deveria falar da inteligência', 'Beleza, força, inteligência e posses são passageiras: o amor preso a elas gera insegurança.'),
        q('Segundo o estudo, qual é a melhor resposta para "por que você me ama?"', '"Eu te amo porque te amo: é a minha natureza"', '"Porque você é a pessoa mais bonita"', '"Porque você faz tudo por mim"', '"Porque você é muito inteligente"', 'O amor que não depende do que o outro faz se parece com o amor de Jesus.'),
        q('Romanos 8:38-39 cita duas coisas que NÃO nos separam do amor de Deus. O estudo destaca quais?', 'A morte e o pecado', 'A dúvida e o medo', 'A pobreza e a doença', 'O tempo e a distância', '"Não há nada nesta vida que possa fazer o Senhor parar de nos amar, nem mesmo a morte ou o pecado."'),
        q('Quantas vezes Jesus perguntou a Pedro "você me ama?" na praia (Jo 21)?', 'Três', 'Uma', 'Duas', 'Sete', 'Jo 21:15-17: três perguntas, uma para cada negação.'),
        q('O que o estudo diz que Jesus NÃO é?', 'Interesseiro', 'Exigente', 'Justo', 'Santo', '"Jesus não nos ama por causa de algo que fizemos. Ele não é interesseiro."')
      ]
    },
    {
      n: 3, nome: 'Ele me formou', ref: '2 Coríntios 5:17', tema: 'oficina', nivel: 3, chefe: 'condenacao', rolos: 2, ondas: 2, tesouro: false, segredos: [],
      objetivo: 'Ouça o oleiro, vençam a votação dos rolos e quebrem as correntes da Condenação.',
      licao: 'Quando Jesus nos escolhe, ele nos dá uma nova identidade. A pessoa que você era antes de Cristo já não existe: ele faz novas todas as coisas.',
      versiculo: { texto: 'Portanto, se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!', ref: '2 Coríntios 5:17' },
      estudo: [
        'ENTENDA: "Portanto, agora já não há condenação para os que estão em Cristo Jesus" (Rm 8:1). Os pecados foram absorvidos pelo sangue de Jesus. O inimigo tenta trazer de volta a condenação: não aceite.',
        'PRATIQUE: a formação é contínua; só no céu estaremos em condição perfeita. Até lá, Deus envia líderes para nos discipular: pais, pastores, professores, chefes do trabalho, líderes de geração e de célula.'
      ],
      reflexao: 'Qual "rótulo antigo" o inimigo tenta colar em você? O que a Palavra diz sobre quem você é agora?',
      inimigos: ['desanimo', 'ira', 'orgulho'],
      npcs: {
        N: { nome: 'O oleiro', look: OLEIRO, falas: ['O vaso se estragou na minha mão? Eu não jogo fora: faço outro, do jeito que me parece bom (Jr 18:4).', 'A formação não acontece num dia. O barro fica na roda muito tempo. Só no céu o vaso fica perfeito.'] },
        M: { nome: 'Paulo', look: PAULO, falas: ['Eu era perseguidor da igreja. Se alguém tinha motivo para viver condenado, era eu.', 'Por isso eu escrevi: agora já não há condenação para os que estão em Cristo Jesus (Rm 8:1). E: se alguém está em Cristo, é nova criação (2Co 5:17).'] },
        O: { nome: 'Líder de célula', look: LIDER, falas: ['Deus coloca pessoas para formar o caráter de Cristo em nós. O estudo cita seis: pais, pastores, professores, chefes do trabalho, líderes de geração e líderes de célula.', 'Cada um tem um papel especial. Ouvir quem te discipula faz parte de ser formado.'] }
      },
      quiz: [
        q('Complete 2 Coríntios 5:17: "As coisas antigas já passaram; …"', '…eis que surgiram coisas novas!', '…e não voltarão jamais.', '…a graça de Deus é suficiente.', '…o Senhor é a nossa força.', '"…as coisas antigas já passaram; eis que surgiram coisas novas!" (2Co 5:17).'),
        q('Romanos 8:1: "Agora já não há condenação para…"', '…os que estão em Cristo Jesus', '…os que nunca pecaram', '…os que vão à igreja', '…os que guardam a Lei', '"Portanto, agora já não há condenação para os que estão em Cristo Jesus" (Rm 8:1).'),
        q('Segundo o estudo, o que absorveu os nossos pecados?', 'O sangue de Jesus', 'As nossas boas obras', 'O nosso arrependimento', 'O batismo nas águas', '"Os nossos pecados foram absorvidos pelo Sangue de Jesus de modo que já não têm efeito sobre nós."'),
        q('Quando estaremos, de verdade, em condição perfeita?', 'Quando chegarmos no céu', 'No dia da conversão', 'Depois de um ano de discipulado', 'Quando pararmos de pecar', '"Só estaremos, verdadeiramente, em condição perfeita quando chegarmos no céu."'),
        q('Qual destes NÃO está na lista de líderes que Deus envia para nos discipular?', 'Influenciadores digitais', 'Professores', 'Chefes do trabalho', 'Líderes de geração', 'O estudo cita: pais, pastores, professores, chefes do trabalho, líderes de geração e líderes de célula.'),
        q('Depois que Cristo nos escolhe, em que ele começa a trabalhar?', 'No nosso caráter, para refletirmos Jesus', 'Na nossa aparência', 'Na nossa conta bancária', 'Na nossa fama', '"Uma vez que Cristo te escolhe, ele começa a trabalhar em seu caráter para que você possa refletir Jesus aonde estiver."'),
        q('Em Jeremias 18, o que o oleiro faz com o vaso que se estragou?', 'Faz outro vaso com o mesmo barro', 'Joga o barro fora', 'Vende o vaso estragado', 'Quebra o vaso em pedaços', '"…tornou a fazer dele outro vaso, conforme o que pareceu bem aos olhos do oleiro" (Jr 18:4).'),
        q('Onde as acusações do inimigo contra nós foram canceladas, segundo o estudo?', 'Na Cruz', 'No túmulo vazio', 'No Pentecostes', 'No monte das Oliveiras', '"Todas essas coisas foram canceladas na Cruz."')
      ]
    },
    {
      n: 4, nome: 'Ele me capacitou', ref: 'Lucas 22 · Atos 2', tema: 'tribunal', nivel: 4, chefe: 'covardia', rolos: 2, ondas: 2, tesouro: false, segredos: [],
      objetivo: 'Ouça Pedro no pátio, vençam a votação dos rolos e vençam a Covardia.',
      licao: '"Jesus não escolhe os capacitados, mas capacita os escolhidos." Nenhum dos doze discípulos era um prodígio. Eram homens comuns, e foram capacitados para levar o Evangelho a todo o primeiro século. Acima do talento, Deus busca disponibilidade.',
      versiculo: { texto: 'Então Pedro levantou-se com os Onze e, em alta voz, dirigiu-se à multidão: "Homens da Judeia e todos os que vivem em Jerusalém, deixem-me explicar-lhes isto!"', ref: 'Atos 2:14' },
      estudo: [
        'LEMBRE: na noite da crucificação, perto da fogueira do pátio, Pedro negou Jesus três vezes. "Falava ele ainda, quando o galo cantou… Saindo dali, chorou amargamente" (Lc 22:60-62).',
        'VEJA: cinquenta dias depois, batizado no Espírito Santo, o mesmo Pedro falou a milhares, e três mil vidas foram salvas. O Senhor nos capacita para tirar de nós a covardia e a limitação.'
      ],
      reflexao: 'Em que lugar você tem vergonha de dizer que é de Jesus? O que o Espírito Santo pode fazer em você ali?',
      inimigos: ['medo', 'preguica', 'duvida'],
      npcs: {
        N: { nome: 'Pedro', look: PEDRO, falas: ['Foi aqui, perto deste fogo. Eu disse: "Homem, não sei do que você está falando!" O galo cantou. O Senhor se voltou e olhou para mim (Lc 22:61).', 'Cinquenta dias depois, no Pentecostes, eu me levantei com os Onze e falei a milhares. Não fui eu: foi o Espírito.'] },
        M: { nome: 'A criada do pátio', look: CRIADA, falas: ['Eu reconheci aquele homem perto do fogo. "Este também estava com ele!" E ele jurou que não.', 'Engraçado: dias depois eu o vi pregando na rua, sem medo nenhum. Parecia outra pessoa.'] },
        O: { nome: 'Líder de célula', look: LIDER, falas: ['Nenhum dos doze era gênio. Eram pescadores, um cobrador de impostos… gente comum. E carregaram o cristianismo pelo primeiro século inteiro.', 'Deus não procura primeiro o talento: procura disponibilidade. Se você estiver disponível, ele capacita.'] }
      },
      quiz: [
        q('Quantos dias depois da negação Pedro pregou à multidão, segundo o estudo?', 'Cinquenta', 'Três', 'Quarenta', 'Sete', '"…vemos o que aconteceu cinquenta dias depois" (o Pentecostes).'),
        q('Em Lucas 22:60, o que Pedro diz ao negar Jesus?', '"Homem, não sei do que você está falando!"', '"Eu nunca vi esse homem na vida!"', '"Não sou galileu!"', '"Deixem-me em paz!"', '"Pedro respondeu: Homem, não sei do que você está falando!" (Lc 22:60).'),
        q('O que aconteceu ENQUANTO Pedro ainda falava a terceira negação?', 'O galo cantou', 'Jesus foi crucificado', 'A terra tremeu', 'Os soldados o prenderam', '"Falava ele ainda, quando o galo cantou" (Lc 22:60).'),
        q('Atos 2:14 diz que Pedro se levantou com quem?', 'Com os Onze', 'Com os Doze', 'Com os setenta', 'Com Maria e as mulheres', '"Então Pedro levantou-se com os Onze" (At 2:14). Judas já não estava.'),
        q('Quantas vidas foram salvas no dia da pregação de Pedro?', 'Três mil', 'Cinco mil', 'Quinhentas', 'Cento e vinte', 'O estudo: "Neste dia, três mil vidas foram salvas" (At 2:41).'),
        q('Segundo o estudo, o que mudou em Pedro?', 'Ele foi batizado no Espírito Santo', 'Ele estudou retórica com os fariseus', 'Ele deixou de ter medo sozinho', 'Ele foi perdoado pelos soldados', '"O que mudou? Pedro fora batizado no Espírito Santo."'),
        q('"Acima do talento, Deus busca…"', 'Disponibilidade', 'Inteligência', 'Experiência', 'Perfeição', '"Veja que, acima do talento, Deus busca a disponibilidade!"'),
        q('Depois de negar Jesus, o que Pedro fez (Lc 22:62)?', 'Saiu e chorou amargamente', 'Fugiu para a Galileia', 'Voltou a pescar no mesmo dia', 'Escondeu-se no templo', '"Saindo dali, chorou amargamente" (Lc 22:62).')
      ]
    },
    {
      n: 5, nome: 'Ele me enviou', ref: 'Mateus 28 · Atos 1:8', tema: 'aurora', nivel: 5, chefe: 'fracasso', rolos: 2, ondas: 2, tesouro: false, segredos: [],
      objetivo: 'Ouça a Grande Comissão, vençam a votação dos rolos e respondam ao Fracasso com o que está escrito.',
      licao: 'Além de nos escolher, amar, formar e capacitar, Jesus nos envia para levar a outros a mensagem do seu amor. Há muitas pessoas morrendo sem conhecer o amor de Cristo: o seu testemunho pode mudar o destino de alguém.',
      versiculo: { texto: 'Mas receberão poder quando o Espírito Santo descer sobre vocês, e serão minhas testemunhas em Jerusalém, em toda a Judeia e Samaria, e até os confins da terra.', ref: 'Atos 1:8' },
      estudo: [
        'OUÇA: "Foi-me dada toda a autoridade no céu e na terra. Portanto, vão e façam discípulos de todas as nações, batizando-os em nome do Pai e do Filho e do Espírito Santo… E eu estarei sempre com vocês, até o fim dos tempos."',
        'NÃO TEMA: "Não se preocupem quanto ao que dizer, ou como dizer. Naquela hora lhes será dado o que dizer, pois não serão vocês que estarão falando, mas o Espírito do Pai de vocês" (Mt 10:19-20).'
      ],
      reflexao: 'Pense em uma pessoa que ainda não conhece o amor de Jesus. Qual é o primeiro passo para falar com ela esta semana?',
      inimigos: ['medo', 'desanimo', 'orgulho', 'distracao'],
      npcs: {
        N: { nome: 'Líder de célula', look: LIDER, falas: ['Jesus disse: "Vão e façam discípulos de todas as nações". Isso inclui a sua escola, o seu time, a sua família.', 'E se você ainda não entregou a vida a Jesus, hoje pode ser o dia. Fala comigo depois do jogo!'] },
        M: { nome: 'João, o discípulo', look: JOAO, falas: ['Antes de subir ao céu, ele nos deu a ordem em círculos: Jerusalém, depois toda a Judeia e Samaria, depois os confins da terra (At 1:8).', 'Começa perto de casa. Mas não para em casa.'] },
        O: { nome: 'Pedro', look: PEDRO, falas: ['Eu tinha medo de abrir a boca. Ele prometeu: "naquela hora lhes será dado o que dizer". E foi.', 'Ele também prometeu que estaria com a gente sempre, até o fim dos tempos. Você não vai sozinho.'] }
      },
      quiz: [
        q('Na ordem de Atos 1:8, qual lugar vem logo DEPOIS de Jerusalém?', 'Toda a Judeia e Samaria', 'Os confins da terra', 'A Galileia', 'Roma', '"…em Jerusalém, em toda a Judeia e Samaria, e até os confins da terra" (At 1:8).'),
        q('Em Mateus 28, o que Jesus diz que lhe foi dada?', 'Toda a autoridade no céu e na terra', 'Toda a sabedoria dos profetas', 'A chave do reino de Israel', 'Uma coroa de glória', '"Foi-me dada toda a autoridade no céu e na terra" (Mt 28:18).'),
        q('Em nome de quem Jesus manda batizar os discípulos?', 'Do Pai, do Filho e do Espírito Santo', 'Somente de Jesus', 'De Deus e dos apóstolos', 'Do Pai e do Filho', '"…batizando-os em nome do Pai e do Filho e do Espírito Santo" (Mt 28:19).'),
        q('Em Mateus 10:19-20, quem fala por intermédio de nós quando testemunhamos?', 'O Espírito do Pai', 'Os anjos', 'Os nossos líderes', 'A nossa consciência', '"…não serão vocês que estarão falando, mas o Espírito do Pai de vocês falará por intermédio de vocês."'),
        q('Atos 1:8: recebemos poder QUANDO…', '…o Espírito Santo descer sobre nós', '…formos ordenados pastores', '…lermos a Bíblia inteira', '…pararmos de ter medo', '"Mas receberão poder quando o Espírito Santo descer sobre vocês" (At 1:8).'),
        q('Até quando Jesus promete estar conosco (Mt 28:20)?', 'Até o fim dos tempos', 'Até a nossa morte', 'Até o Pentecostes', 'Enquanto formos fiéis', '"E eu estarei sempre com vocês, até o fim dos tempos" (Mt 28:20).'),
        q('Segundo o estudo, por que muitas pessoas não podem ir ao Céu?', 'Porque somente através de Jesus temos acesso à vida eterna, e elas não o conhecem', 'Porque Deus não as escolheu', 'Porque não frequentam a igreja', 'Porque pecaram demais', '"…somente através de Jesus temos acesso à vida eterna. O seu testemunho pode mudar todo o destino de alguém."'),
        q('Qual é a declaração ("DECLARE") desta semana?', 'Deus não errou ao me escolher! Ele está comigo ajudando-me em cada passo que dou', 'Eu escolhi Jesus e não me arrependo', 'Tudo posso naquele que me fortalece', 'O Senhor é o meu pastor e nada me faltará', 'Declare: "Deus não errou ao me escolher! Ele está comigo ajudando-me em cada passo que dou".')
      ]
    }
  ]
};
