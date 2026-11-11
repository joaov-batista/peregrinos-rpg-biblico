// SEMANA 3 — Daniel 4: o rei que virou fera. Narrado pelo próprio Nabucodonosor, em primeira pessoa.
// Semana feita para o Caminho (src/caminho): as áreas são geradas pelo motor novo, por isso não há "mapa" de letras.
// Os chefes são alegorias do coração do rei (falsa sabedoria, opressão, vanglória, a perda da razão e a soberba);
// os golpes de cada um ficam em src/caminho/chefes.js.
const rei = { skin: '#C68B59', hair: '#2B1A10', tunic: '#7A2E3A', cape: '#D7B25A', style: 'turbante', beard: true };
const daniel = { skin: '#D9A273', hair: '#3A2314', tunic: '#3F6C8C', cape: '#E8E2CF', style: 'curto', beard: true };
const arauto = { skin: '#B97A4E', hair: '#302B26', tunic: '#C9B36A', cape: 'none', style: 'curto', beard: false };
const mago = { skin: '#D9A273', hair: '#D9D2C5', tunic: '#3E3656', cape: '#6C5BA8', style: 'turbante', beard: true };
const pobre = { skin: '#B97A4E', hair: '#302B26', tunic: '#8C7A63', cape: 'none', style: 'veu', beard: false };
const pastor = { skin: '#C68B59', hair: '#3A2314', tunic: '#7C8A5A', cape: '#877451', style: 'curto', beard: true };
const q = (pergunta, certa, errada, outra, porque) => ({ q: pergunta, a: [certa, errada, outra], porque });
const estacao = (id, nome, simbolo, pergunta, certa, errada, outra, porque) => ({ id, nome, simbolo, estacao: true, ...q(pergunta, certa, errada, outra, porque) });
const chefe = (nome, titulo, cor, ref, intro, derrota, r = 40) => ({ nome, titulo, cor, cor2: '#1B1830', simbolo: '♛', ref, intro, derrota, r, lv: 1, hp: 500, atk: 8, def: 3, spd: 65, xp: 60, ouro: 45 });

export default {
  id: 'semana-03',
  titulo: 'Daniel 4: o rei que virou fera',
  estudo: 'Daniel 4',
  soCaminho: true,
  sala: 'trono',
  resumo: 'O homem mais poderoso da terra sonha com uma árvore que toca o céu e é cortada. Daniel explica e aconselha; doze meses depois, no terraço do palácio, o rei se gaba — e perde a razão. Sete tempos no campo, como os bois, até levantar os olhos ao céu. O capítulo é o testemunho do próprio Nabucodonosor.',
  versiculo: { texto: 'Agora, pois, eu, Nabucodonosor, louvo, exalto e glorifico ao Rei do céu… e ele pode humilhar aos que andam na soberba.', ref: 'Daniel 4:37' },
  recompensaSemana: 'coroa_restituida',
  guia: { nome: 'Daniel, chamado Beltessazar', look: daniel },
  chefes: {
    encantadores: chefe('Os Encantadores', 'A sabedoria que não sabe', '#B9C7F5', 'Daniel 4:7', 'Conte-nos o sonho, ó rei… e diremos o que o rei quiser ouvir.', 'Magos, encantadores, caldeus e adivinhos não puderam interpretar. Há um Deus no céu que revela os mistérios (Dn 2:28).', 36),
    jugo: chefe('O Jugo de Ferro', 'O trono sobre os fracos', '#C98E62', 'Daniel 4:27', 'Mais tijolos! A glória do rei não se ergue sozinha.', '"Põe termo às tuas iniquidades, usando de misericórdia para com os pobres" (Dn 4:27). O conselho de Daniel era um caminho, não uma ameaça.', 42),
    babilonia: chefe('A Grande Babilônia', 'A cidade que diz "eu"', '#F1C96A', 'Daniel 4:30', 'Não é esta a grande Babilônia que EU edifiquei, com o MEU poder, para a MINHA glória?', '"Ainda estava a palavra na boca do rei, quando caiu uma voz do céu" (Dn 4:31). Toda glória emprestada tem dono.', 46),
    fera: chefe('A Fera do Campo', 'O rei sem razão de homem', '#B7C7A0', 'Daniel 4:33', '*Um vulto come erva no orvalho. Os cabelos cresceram como penas de águia; as unhas, como as das aves.*', 'A cepa ficou na terra, com as raízes. Quem o humilhou não o destruiu: esperava que ele levantasse os olhos.', 40),
    soberba: chefe('A Coroa Vazia', 'A soberba, raiz de tudo', '#F1C96A', 'Daniel 4:37', 'Você viu o rei cair e ainda me procura? Eu não preciso de trono: moro em qualquer coração.', '"Todas as suas obras são verdadeiras, e os seus caminhos, justos; e pode humilhar aos que andam na soberba" (Dn 4:37).', 44)
  },
  fases: [
    {
      n: 1, nome: 'O sonho que tira o sono', ref: 'Daniel 4:1-9', tema: 'palacio', nivel: 2, chefe: 'encantadores', recompensa: 'anel_beltessazar',
      objetivo: 'Leia os três rolos do palácio, ouça o rei e desmascare os Encantadores.',
      licao: 'O rei estava tranquilo e próspero em seu palácio. Um sonho bastou para mostrar que a segurança dele era de vidro. Todos os sábios foram chamados; nenhum soube responder.',
      versiculo: { texto: 'Pareceu-me bem fazer conhecidos os sinais e maravilhas que Deus, o Altíssimo, tem feito para comigo.', ref: 'Daniel 4:2' },
      estudo: [
        'LEIA Daniel 4:1-9. O capítulo é uma carta: Nabucodonosor escreve a todos os povos, nações e homens de todas as línguas. Ele começa pelo fim — louvando o Altíssimo — e só depois conta como chegou ali.',
        'OBSERVE 4:4: "Eu estava tranquilo em minha casa e próspero no meu palácio". É nesse cenário, sem guerra nem crise, que o sonho o espanta. Conforto não é o mesmo que paz.',
        'ENTENDA: o rei chama magos, encantadores, caldeus e adivinhos. Conta o sonho, e mesmo assim eles não o interpretam (4:7). Por fim entra Daniel, a quem o rei chama Beltessazar, "segundo o nome do meu deus" — o rei ainda fala como pagão.',
        'PRATIQUE: a quem você corre primeiro quando algo o assusta? Anote uma situação em que procurou todas as vozes antes de procurar a Deus.'
      ],
      reflexao: 'O que precisaria ser tirado de você para descobrir em que a sua tranquilidade se apoia?',
      inimigos: ['distracao', 'duvida', 'vaidade'],
      npcs: {
        N: { nome: 'Nabucodonosor', look: rei, falas: ['Eu estava tranquilo em minha casa. Então tive um sonho que me espantou; os pensamentos na minha cama me perturbaram.', 'Chamei todos os sábios da Babilônia. Contei o sonho. Nenhum deles me deu a interpretação.'] },
        M: { nome: 'Arauto do palácio', look: arauto, falas: ['O decreto saiu: que venham todos os sábios! Magos, encantadores, caldeus e adivinhos.', 'Dizem que em Beltessazar há o espírito dos deuses santos. O rei mandou chamá-lo por último.'] }
      },
      estacoes: [
        estacao('carta', 'A carta do rei', 'pergaminho', 'A quem Nabucodonosor dirige o capítulo 4?', 'A todos os povos, nações e línguas', 'Somente aos sábios da corte', 'Apenas a Daniel', 'Dn 4:1: é um testemunho público, escrito pelo próprio rei.'),
        estacao('sossego', 'O sossego do palácio', 'luz', 'Como o rei descreve a própria vida antes do sonho?', 'Tranquilo em casa e próspero no palácio', 'Cercado de inimigos', 'Doente e sem recursos', 'Dn 4:4. O abalo chega em tempo de calmaria.'),
        estacao('sabios', 'Os sábios calados', 'sino', 'O que os sábios da Babilônia conseguiram fazer com o sonho?', 'Nada: não souberam interpretá-lo', 'Explicaram tudo com clareza', 'Proibiram o rei de contá-lo', 'Dn 4:7: o rei contou o sonho, mas eles não lhe fizeram saber a interpretação.')
      ],
      quiz: [
        q('Quem escreve o relato de Daniel 4?', 'O próprio rei Nabucodonosor', 'O rei Dario', 'O profeta Jeremias', 'O capítulo é narrado em primeira pessoa pelo rei (Dn 4:1,4,34).'),
        q('Como o rei chama Deus logo no começo da carta?', 'O Altíssimo', 'Bel', 'O deus do rio', 'Dn 4:2: "os sinais e maravilhas que Deus, o Altíssimo, tem feito para comigo".'),
        q('Onde o rei estava quando teve o sonho?', 'Tranquilo em seu palácio', 'No campo de batalha', 'Preso numa cova', 'Dn 4:4: tranquilo em casa e próspero no palácio.'),
        q('O que o sonho causou no rei?', 'Espanto e perturbação', 'Alegria e orgulho', 'Sono profundo', 'Dn 4:5: o sonho o espantou, e as visões o perturbaram.'),
        q('Quem foi chamado primeiro para interpretar?', 'Os sábios da Babilônia', 'Os pobres da cidade', 'Os reis vizinhos', 'Dn 4:6-7: magos, encantadores, caldeus e adivinhos.'),
        q('Que nome babilônico Daniel recebeu?', 'Beltessazar', 'Belsazar', 'Abede-Nego', 'Dn 4:8. Não confunda com Belsazar, o rei do capítulo 5.'),
        q('Segundo o rei, de onde vinha o nome Beltessazar?', 'Do nome do deus dele', 'Do nome de um rio', 'Do pai de Daniel', 'Dn 4:8: "segundo o nome do meu deus". O rei ainda pensa como pagão.'),
        q('O que o rei dizia haver em Daniel?', 'O espírito dos deuses santos', 'Uma coroa escondida', 'Medo dos magos', 'Dn 4:8-9. É a linguagem do rei para algo que ele reconhecia mas não entendia.'),
        q('Verdadeiro ou falso: o rei escondeu o sonho dos sábios.', 'Falso: ele contou, e mesmo assim não interpretaram', 'Verdadeiro: ele não contou nada', 'Verdadeiro: Daniel o proibiu', 'Diferente do capítulo 2, aqui o rei conta o sonho (Dn 4:7).'),
        q('O que a calmaria do rei ensina?', 'Que conforto não garante um coração seguro', 'Que riqueza traz sempre paz', 'Que sonhos não significam nada', 'O texto contrasta a prosperidade (4:4) com o espanto (4:5).')
      ]
    },
    {
      n: 2, nome: 'A árvore e o vigilante', ref: 'Daniel 4:10-27', tema: 'arvore', nivel: 4, chefe: 'jugo', recompensa: 'cepa_raizes',
      objetivo: 'Percorra o sonho: a árvore, o vigilante e a cepa. Ouça o conselho de Daniel e quebre o Jugo.',
      licao: 'Uma árvore imensa, que alimentava a todos, é cortada por ordem do céu. A cepa fica, presa com ferro e bronze. Daniel fica atônito: a árvore é o rei. E oferece uma saída — justiça e misericórdia para com os pobres.',
      versiculo: { texto: 'Põe termo, pela justiça, em teus pecados e em tuas iniquidades, usando de misericórdia para com os pobres.', ref: 'Daniel 4:27' },
      estudo: [
        'LEIA Daniel 4:10-18. A árvore está no meio da terra; sua altura chega ao céu, é vista até os confins. Dá alimento para todos, sombra aos animais, abrigo às aves. O poder do rei era real, e fazia bem a muitos.',
        'OBSERVE 4:13-17: um vigilante, um santo, desce do céu. A ordem é derrubar — mas deixar a cepa com as raízes, atada com cadeias de ferro e de bronze, molhada pelo orvalho. O coração de homem será trocado por coração de animal, por sete tempos.',
        'ENTENDA o motivo declarado em 4:17: "para que os viventes conheçam que o Altíssimo tem domínio sobre o reino dos homens, e o dá a quem quer". A sentença tem um propósito: ensinar.',
        'LEIA 4:19-27. Daniel fica atônito e deseja que o sonho fosse para os inimigos do rei. Depois fala com coragem: "és tu, ó rei". E aconselha: justiça e misericórdia para com os pobres. Talvez a tranquilidade se prolongue.',
        'PRATIQUE: a cepa que fica é uma promessa de retorno (4:26). Onde Deus já lhe deu um aviso junto com um caminho de volta?'
      ],
      reflexao: 'Quem vive debaixo da sua "sombra" — e o que essas pessoas recebem de você?',
      inimigos: ['orgulho', 'ganancia', 'desanimo'],
      npcs: {
        N: { nome: 'Daniel', look: daniel, falas: ['Senhor meu, quem dera o sonho fosse para os que te odeiam. A árvore que viste… és tu, ó rei.', 'Aceita o meu conselho: põe fim aos teus pecados praticando a justiça, e às tuas iniquidades usando de misericórdia para com os pobres.'] },
        M: { nome: 'Trabalhadora dos tijolos', look: pobre, falas: ['A árvore dá sombra, dizem. Aqui embaixo, quem carrega os tijolos só sente o peso.', 'Se o rei ouvisse o hebreu… misericórdia é uma palavra que nunca chegou a este canteiro.'] }
      },
      estacoes: [
        estacao('arvore', 'A árvore no meio da terra', 'luz', 'O que a árvore do sonho oferecia?', 'Alimento, sombra e abrigo para todos', 'Apenas madeira para o palácio', 'Frutos venenosos', 'Dn 4:12: havia nela sustento para todos; os animais achavam sombra, e as aves, abrigo.'),
        estacao('vigilante', 'O vigilante desce', 'sino', 'O que deveria ficar na terra depois do corte?', 'A cepa com as raízes', 'Nada: tudo seria queimado', 'Somente os frutos', 'Dn 4:15: a cepa fica, atada com ferro e bronze. Dn 4:26: o reino voltaria ao rei.'),
        estacao('conselho', 'O conselho de Daniel', 'pergaminho', 'Qual saída Daniel apontou ao rei?', 'Justiça e misericórdia para com os pobres', 'Construir uma estátua maior', 'Fugir da Babilônia', 'Dn 4:27. O profeta não se alegra com a sentença: mostra um caminho.')
      ],
      quiz: [
        q('Onde estava a árvore do sonho?', 'No meio da terra', 'No topo de um monte', 'Dentro do palácio', 'Dn 4:10.'),
        q('Até onde chegava a altura da árvore?', 'Até o céu', 'Até o telhado do palácio', 'Até as nuvens da Assíria', 'Dn 4:11: a altura chegava ao céu e era vista até os confins da terra.'),
        q('Quem desceu do céu no sonho?', 'Um vigilante, um santo', 'Um exército de carros', 'O rei da Pérsia', 'Dn 4:13.'),
        q('Com o que a cepa ficaria atada?', 'Cadeias de ferro e de bronze', 'Cordas de linho', 'Correntes de ouro', 'Dn 4:15.'),
        q('O coração de homem seria trocado por…', 'Coração de animal', 'Coração de pedra', 'Coração de criança', 'Dn 4:16.'),
        q('Por quanto tempo duraria a sentença?', 'Sete tempos', 'Quarenta dias', 'Três dias e três noites', 'Dn 4:16. O texto diz "tempos", sem definir a unidade.'),
        q('Qual o propósito declarado da sentença?', 'Que se conheça que o Altíssimo domina sobre o reino dos homens', 'Destruir a Babilônia para sempre', 'Dar o trono a Daniel', 'Dn 4:17.'),
        q('Como Daniel reagiu ao ouvir o sonho?', 'Ficou atônito por algum tempo', 'Riu do rei', 'Fugiu do palácio', 'Dn 4:19: os seus pensamentos o perturbavam. Ele se importava com o rei.'),
        q('Quem era a árvore?', 'O próprio rei Nabucodonosor', 'O povo de Israel', 'O templo de Jerusalém', 'Dn 4:22: "és tu, ó rei, que cresceste e te fizeste forte".'),
        q('O que a cepa preservada significava?', 'Que o reino voltaria ao rei quando reconhecesse que o céu domina', 'Que o rei nunca mais reinaria', 'Que a árvore não tinha raízes', 'Dn 4:26.')
      ]
    },
    {
      n: 3, nome: 'O terraço da Babilônia', ref: 'Daniel 4:28-33', tema: 'terraco', nivel: 6, chefe: 'babilonia', recompensa: 'tijolo_humilde',
      objetivo: 'Suba ao terraço do palácio doze meses depois. Leia os rolos e enfrente a cidade que diz "eu".',
      licao: 'Passou um ano inteiro. Nada aconteceu — e o rei concluiu que nada aconteceria. No terraço, olhando a cidade, ele falou de si três vezes numa só frase. A voz do céu o interrompeu.',
      versiculo: { texto: 'Não é esta a grande Babilônia que eu edifiquei para a casa real, com o meu grandioso poder e para glória da minha majestade?', ref: 'Daniel 4:30' },
      estudo: [
        'LEIA Daniel 4:28-33. "Todas estas coisas sobrevieram ao rei." O narrador avisa o desfecho antes de contar: nada do que foi dito ficou sem cumprir.',
        'OBSERVE 4:29: "ao cabo de doze meses". Um ano de paciência depois do conselho de Daniel. O intervalo era oportunidade, não esquecimento.',
        'ENTENDA 4:30: eu edifiquei, com o meu poder, para glória da minha majestade. A cidade era de fato magnífica; o problema não era construir, e sim a quem atribuir.',
        'OBSERVE 4:31: "Ainda estava a palavra na boca do rei, quando caiu uma voz do céu". Na mesma hora a sentença se cumpre (4:33).',
        'PRATIQUE: conte quantas vezes você diz "eu" e "meu" ao falar de uma conquista. Reescreva a frase lembrando quem lhe deu força, tempo e pessoas.'
      ],
      reflexao: 'Quando a paciência de Deus dura, você a lê como chance de mudar ou como licença para continuar?',
      inimigos: ['orgulho', 'vaidade', 'ira'],
      npcs: {
        N: { nome: 'Nabucodonosor', look: rei, falas: ['Olhe em volta, peregrino. Muralhas, jardins, portões de esmalte azul. Não é esta a grande Babilônia que eu edifiquei?', 'Doze meses se passaram desde aquele sonho. O hebreu se assustou à toa.'] },
        M: { nome: 'Daniel', look: daniel, falas: ['Doze meses. O Altíssimo é paciente — e a paciência dele é um convite.', 'Preste atenção nas palavras do rei: eu, meu, minha. Quando a voz do céu falar, não ataque: apenas atravesse.'] }
      },
      estacoes: [
        estacao('meses', 'Doze meses', 'sino', 'Quanto tempo passou entre o conselho e a queda do rei?', 'Doze meses', 'Sete dias', 'Quarenta anos', 'Dn 4:29. Houve tempo para mudar.'),
        estacao('eu', 'A frase do terraço', 'pergaminho', 'A quem o rei atribuiu a grandeza da Babilônia?', 'A si mesmo: ao seu poder e à sua majestade', 'Ao Altíssimo', 'Aos trabalhadores da cidade', 'Dn 4:30.'),
        estacao('voz', 'A voz do céu', 'luz', 'Quando a voz do céu falou?', 'Enquanto a palavra ainda estava na boca do rei', 'Sete tempos depois', 'Na manhã seguinte', 'Dn 4:31.')
      ],
      quiz: [
        q('Onde o rei passeava quando se gabou?', 'No palácio real da Babilônia', 'No templo de Jerusalém', 'Num campo de batalha', 'Dn 4:29. Muitas traduções trazem "sobre o palácio": o terraço.'),
        q('Quanto tempo depois do sonho isso aconteceu?', 'Doze meses', 'No mesmo dia', 'Dez anos', 'Dn 4:29.'),
        q('Complete: "Não é esta a grande Babilônia que ___ edifiquei?"', 'eu', 'Deus', 'meu pai', 'Dn 4:30.'),
        q('Para glória de quem o rei disse ter construído?', 'Da sua própria majestade', 'Do Altíssimo', 'Do povo', 'Dn 4:30.'),
        q('O que a voz do céu anunciou?', 'Que o reino havia passado dele', 'Que a cidade seria ampliada', 'Que Daniel seria rei', 'Dn 4:31: "Já passou de ti o reino".'),
        q('Quando a sentença se cumpriu?', 'Na mesma hora', 'Sete anos depois', 'Nunca se cumpriu', 'Dn 4:33.'),
        q('O que o rei passou a comer?', 'Erva, como os bois', 'Somente pão seco', 'Peixes do Eufrates', 'Dn 4:33.'),
        q('O que molhava o corpo do rei?', 'O orvalho do céu', 'As águas do rio', 'O óleo do palácio', 'Dn 4:33.'),
        q('Como ficaram os cabelos e as unhas dele?', 'Como penas de águia e unhas de aves', 'Brancos como a neve', 'Dourados como a coroa', 'Dn 4:33.'),
        q('Qual foi o erro do rei no terraço?', 'Tomar para si a glória do que havia recebido', 'Construir uma cidade bonita', 'Subir sem os guardas', 'O texto não condena a cidade, e sim o "eu… meu… minha" (4:30).')
      ]
    },
    {
      n: 4, nome: 'Sete tempos no campo', ref: 'Daniel 4:32-33', tema: 'campo', nivel: 8, chefe: 'fera', recompensa: 'orvalho_ceu',
      objetivo: 'Atravesse o campo sob o orvalho, leia os rolos e resista à Fera até que ela levante os olhos.',
      licao: 'O homem que mandava em nações não manda mais em si. Come erva como os bois, dorme ao relento. Mas a cepa ficou na terra: a humilhação tinha um fim marcado, e uma esperança dentro dela.',
      versiculo: { texto: 'Até que conheças que o Altíssimo tem domínio sobre o reino dos homens e o dá a quem quer.', ref: 'Daniel 4:32' },
      estudo: [
        'LEIA Daniel 4:32-33 devagar. Expulso de entre os homens, morada com os animais do campo, erva como os bois, o corpo molhado de orvalho, cabelos como penas de águia, unhas como as das aves.',
        'OBSERVE a palavra "até": a sentença tem limite e objetivo. Não é um castigo para destruir, e sim um caminho para conhecer.',
        'ENTENDA: o texto descreve o que aconteceu ao rei, sem dar nome médico ao seu estado. O ponto do capítulo é teológico: quem se fez como deus acaba menos que homem; quem reconhece a Deus volta a ser gente.',
        'COMPARE com 4:15 e 4:26: a cepa e as raízes ficaram. Deus guardou o reino enquanto o rei não podia guardar nem a si mesmo.',
        'PRATIQUE: nesta área você não vence a Fera pela força. Ela não é um demônio: é o rei. Resistir sem odiar é a lição.'
      ],
      reflexao: 'Que perda já lhe mostrou que você não se sustenta sozinho?',
      inimigos: ['medo', 'desanimo', 'inveja'],
      npcs: {
        N: { nome: 'Pastor do campo', look: pastor, falas: ['Há um homem entre os bois. Não fala. Dizem que foi rei… eu digo que ainda é alguém.', 'Deixo água perto dele toda manhã. O orvalho faz o resto.'] },
        M: { nome: 'Daniel', look: daniel, falas: ['A cepa ficou na terra, com as raízes. O reino lhe será firme depois que ele reconhecer que o céu domina.', 'Não o trate como inimigo. Vigie, resista, e espere o dia em que ele levantará os olhos.'] }
      },
      estacoes: [
        estacao('expulso', 'Longe dos homens', 'sino', 'Com quem o rei passou a morar?', 'Com os animais do campo', 'Com os sábios da corte', 'Com os reis vizinhos', 'Dn 4:32.'),
        estacao('ate', 'A palavra "até"', 'pergaminho', 'A sentença duraria até quando?', 'Até ele conhecer que o Altíssimo domina', 'Até a morte dele', 'Até a Babilônia cair', 'Dn 4:32. O castigo tinha objetivo e limite.'),
        estacao('cepa', 'A cepa guardada', 'luz', 'O que a cepa com as raízes garantia?', 'Que o reino seria devolvido', 'Que a árvore jamais brotaria', 'Que outro rei tomaria o trono para sempre', 'Dn 4:26.')
      ],
      quiz: [
        q('De onde o rei foi expulso?', 'De entre os homens', 'Da Pérsia', 'Do templo', 'Dn 4:33.'),
        q('Como quem ele comia erva?', 'Como os bois', 'Como os leões', 'Como as aves', 'Dn 4:33.'),
        q('Quantos tempos passariam sobre ele?', 'Sete', 'Três', 'Setenta', 'Dn 4:32.'),
        q('O que cresceu como penas de águia?', 'Os cabelos', 'As unhas', 'A barba dos servos', 'Dn 4:33.'),
        q('O que cresceu como as das aves?', 'As unhas', 'Os cabelos', 'Os dentes', 'Dn 4:33.'),
        q('Quem dá o reino dos homens a quem quer?', 'O Altíssimo', 'O conselho dos sábios', 'O mais forte', 'Dn 4:32.'),
        q('A humilhação do rei era para…', 'Ele conhecer quem de fato governa', 'Divertir os inimigos', 'Acabar com a Babilônia', 'Dn 4:32: "até que conheças".'),
        q('O que ficou guardado enquanto o rei estava no campo?', 'O reino, como a cepa na terra', 'Nada', 'Somente a coroa', 'Dn 4:26.'),
        q('O texto dá um nome médico ao estado do rei?', 'Não: apenas descreve o que aconteceu', 'Sim, com detalhes', 'Sim, e ensina o remédio', 'Daniel 4 descreve; o foco é o que o rei precisava reconhecer.'),
        q('Como tratar quem caiu?', 'Sem ódio, lembrando que Deus guarda um caminho de volta', 'Com desprezo', 'Fingindo que nunca existiu', 'A cepa preservada (4:15,26) mostra a intenção de restaurar.')
      ]
    },
    {
      epilogo: 'A carta termina com louvor. O último versículo do rei na Bíblia não é uma ordem: é uma confissão.',
      n: 5, nome: 'Levantei os olhos ao céu', ref: 'Daniel 4:34-37', tema: 'aurora', nivel: 10, chefe: 'soberba', recompensa: 'olhos_ceu',
      objetivo: 'Acompanhe o retorno do rei, leia os rolos e arranque a raiz: a Coroa Vazia.',
      licao: 'Ao fim dos dias, o rei levanta os olhos — e o entendimento volta. Antes de receber o trono de volta, ele bendiz. O reino é restituído, e a grandeza é acrescentada. A soberba, porém, não morre com um rei: precisa ser vencida em cada coração.',
      versiculo: { texto: 'Ao fim daqueles dias, eu, Nabucodonosor, levantei os olhos ao céu, tornou-me a vir o entendimento, e eu bendisse o Altíssimo.', ref: 'Daniel 4:34' },
      estudo: [
        'LEIA Daniel 4:34-37. A ordem dos verbos importa: levantei os olhos → voltou o entendimento → bendisse o Altíssimo. O olhar vem antes da razão.',
        'OBSERVE o louvor de 4:34-35: o domínio dele é eterno; ninguém pode deter a sua mão nem lhe dizer: "Que fazes?". O rei descreve Deus com as palavras que antes usaria para si.',
        'ENTENDA 4:36: a razão volta, a majestade e o resplendor voltam, os conselheiros o procuram, e ele é restabelecido "e a mim se me ajuntou extraordinária grandeza". A humildade não o diminuiu.',
        'CONCLUA com 4:37: louvo, exalto e glorifico ao Rei do céu. Suas obras são verdadeiras, seus caminhos, justos, "e pode humilhar aos que andam na soberba". É a última frase de Nabucodonosor nas Escrituras.',
        'PRATIQUE: levantar os olhos é um gesto simples. Escolha um momento do dia para parar e reconhecer de quem você depende.'
      ],
      reflexao: 'O que mudaria nas suas conquistas se a primeira palavra sobre elas fosse gratidão?',
      inimigos: ['orgulho', 'vaidade', 'medo', 'ira'],
      npcs: {
        N: { nome: 'Nabucodonosor', look: { ...rei, tunic: '#8C7A63', cape: 'none', style: 'curto' }, falas: ['Levantei os olhos ao céu, e o entendimento me voltou. Bendisse o Altíssimo antes de saber se teria o reino de volta.', 'Todas as obras dele são verdadeiras, e os seus caminhos, justos. E ele pode humilhar aos que andam na soberba. Eu sei: andei nela.'] },
        M: { nome: 'Daniel', look: daniel, falas: ['A coroa voltou à cabeça dele. Mas a soberba que o derrubou ainda ronda — ela não precisa de trono.', 'Ela vai acusar, gabar-se e fingir. Responda com o que está escrito.'] }
      },
      estacoes: [
        estacao('olhos', 'Olhos ao céu', 'luz', 'O que aconteceu primeiro?', 'O rei levantou os olhos ao céu', 'O rei recebeu a coroa', 'Os conselheiros o procuraram', 'Dn 4:34: primeiro o olhar; depois o entendimento.'),
        estacao('louvor', 'Antes do trono', 'sino', 'O que o rei fez assim que o entendimento voltou?', 'Bendisse e louvou o Altíssimo', 'Mandou punir os sábios', 'Reconstruiu o palácio', 'Dn 4:34.'),
        estacao('humilhar', 'A última frase', 'pergaminho', 'Como o rei encerra a carta?', 'Deus pode humilhar aos que andam na soberba', 'A Babilônia é eterna', 'Ninguém é maior que o rei', 'Dn 4:37.')
      ],
      quiz: [
        q('Quando o entendimento voltou ao rei?', 'Quando levantou os olhos ao céu', 'Quando voltou ao palácio', 'Quando Daniel o tocou', 'Dn 4:34.'),
        q('A quem o rei bendisse?', 'Ao Altíssimo, que vive para sempre', 'Aos deuses da Babilônia', 'A si mesmo', 'Dn 4:34.'),
        q('Como é o domínio de Deus, segundo o rei?', 'Eterno, de geração em geração', 'Limitado à Judeia', 'Igual ao da Babilônia', 'Dn 4:34.'),
        q('O que ninguém pode dizer a Deus?', '"Que fazes?"', '"Obrigado"', '"Ajuda-me"', 'Dn 4:35: não há quem possa deter a sua mão, nem lhe dizer: Que fazes?'),
        q('O que foi devolvido ao rei?', 'A razão, a majestade e o reino', 'Somente a vida', 'Somente o palácio', 'Dn 4:36.'),
        q('Depois da restauração, a grandeza do rei…', 'Foi acrescentada', 'Ficou pela metade', 'Acabou', 'Dn 4:36: "se me ajuntou extraordinária grandeza".'),
        q('Como o rei chama Deus no último versículo?', 'Rei do céu', 'Deus de Daniel apenas', 'Senhor dos sonhos', 'Dn 4:37.'),
        q('Como são as obras e os caminhos de Deus?', 'Verdadeiras e justos', 'Ocultas e duros', 'Incertas e mutáveis', 'Dn 4:37.'),
        q('A quem Deus pode humilhar?', 'Aos que andam na soberba', 'Aos pobres', 'Aos que erram sem querer', 'Dn 4:37.'),
        q('Qual a ordem do retorno do rei?', 'Olhar → entendimento → louvor → restauração', 'Coroa → louvor → olhar', 'Castigo → vingança → trono', 'Dn 4:34-36.')
      ]
    }
  ]
};
