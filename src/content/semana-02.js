// Jonas 1–4. Os inimigos são alegorias do coração; não personagens acrescentados ao relato bíblico.
const jonas = { skin: '#C68B59', hair: '#302B26', tunic: '#467C89', cape: '#D3AC70', style: 'curto', beard: true };
const marinheiro = { skin: '#B97A4E', hair: '#302B26', tunic: '#D4C3A0', cape: 'none', style: 'turbante', beard: true };
const cidada = { skin: '#D9A273', hair: '#302B26', tunic: '#956B8F', cape: 'none', style: 'veu', beard: false };
const q = (pergunta, certa, errada, outra, porque) => ({ q: pergunta, a: [certa, errada, outra], porque });
const estacao = (id, nome, tx, ty, simbolo, pergunta, certa, errada, outra, porque) => ({ id, nome, tx, ty, simbolo, estacao: true, ...q(pergunta, certa, errada, outra, porque) });

// Mapas distintos, com arena larga, portão sem desvios e caminhos de pelo menos dois tiles.
function mapa(tipo) {
  const W = 44, H = 34, a = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !x || !y || x === W - 1 || y === H - 1 ? '#' : '.'));
  const rect = (x, y, w, h, c) => { for (let j=y;j<y+h;j++) for(let i=x;i<x+w;i++) a[j][i]=c; };
  if (tipo === 1) { // Cais: duas docas, armazéns e uma ponte central.
    rect(1, 14, 6, 18, 'W'); rect(37, 14, 6, 18, 'W');
    for (const y of [16,24]) { rect(9,y,6,2,'T'); rect(29,y,6,2,'T'); }
    rect(20,14,4,18,',');
  } else if (tipo === 2) { // Convés com água dos dois lados, mastros e corredores laterais.
    rect(1,1,4,32,'W'); rect(39,1,4,32,'W');
    for (const y of [16,23,29]) rect(21,y,2,2,'T');
    rect(7,18,9,2,','); rect(28,25,9,2,',');
  } else if (tipo === 3) { // Câmara orgânica: costelas deixam passagens alternadas.
    for (const y of [15,21,27]) { rect(1,y,10,2,'#'); rect(33,y,10,2,'#'); }
    rect(15,18,3,5,'W'); rect(27,24,3,5,'W');
    rect(21,14,3,18,',');
  } else if (tipo === 4) { // Praças de Nínive, casas e vias cruzadas.
    for (const x of [7,29]) for (const y of [16,24]) rect(x,y,8,3,'#');
    rect(19,14,6,18,','); rect(1,21,42,2,',');
  } else { // Colina: sombra à esquerda, jardim seco à direita.
    rect(6,16,9,3,','); rect(29,24,8,3,',');
    for (const [x,y] of [[10,16],[32,16],[15,25],[28,29]]) a[y][x]='T';
    rect(20,17,3,5,'#');
  }
  rect(1,12,42,1,'#'); rect(20,12,4,1,'D');
  a[5][22]='B'; a[10][19]='H'; a[31][22]='P';
  a[29][19]='N'; a[20][24]='M';
  for (const [x,y] of [[8,29],[34,29],[8,20],[34,20]]) a[y][x]='C';
  for (const [x,y] of [[17,28],[27,28],[17,21],[26,17],[12,14],[32,14]]) a[y][x]='E';
  // Estações do estudo sempre acessíveis, mesmo antes de abrir o portão.
  for (const [x,y] of [[12,30],[31,22],[15,15]]) rect(x-1,y-1,3,3,'.');
  return a.map(r=>r.join(''));
}

function chefe(nome, titulo, cor, hp, atk, golpes, fases, ref, intro, derrota) {
  return { nome, titulo, cor, cor2: '#123242', simbolo: '◆', lv: 1, hp, atk, def: 3, spd: 65, r: 36,
    xp: 45, ouro: 35, contato: .35, golpes, fases, ref, intro, derrota, regras: {} };
}
const fasesChefe = (primeiros, ultimos, grito) => [
  { golpes: primeiros, mover: { tipo: 'perseguir', vel: .45 } },
  { vida: .5, golpes: ultimos, mover: { tipo: 'rodear', vel: .65 }, grito }
];
export const CHEFES_JONAS = {
  fuga: chefe('O Fugitivo', 'A bússola sem norte', '#79D9CD', 380, 7,
    { deriva: { tipo:'investida', vel:310, dur:.5, espera:2, fala:'Sempre há outro navio…' }, cartas: { tipo:'leque', n:3, vel:175, aviso:.9, cor:'#79D9CD' }, rotas: { tipo:'anel', n:8, vel:145, aviso:1.2 } },
    fasesChefe(['deriva','cartas'],['deriva','rotas','cartas'],'Fugir não muda o chamado!'), 'Jonas 1:1-3', 'Pague a passagem. Esqueça Nínive.', 'Reconhecer a fuga é o primeiro passo para escutar o chamado.'),
  pavor: chefe('Pavor da Tormenta', 'O olho do medo', '#94D9F5', 420, 7,
    { ondas: { tipo:'pisao', ondas:2, vel:150, cor:'120,210,245' }, relampagos: { tipo:'marcados', vezes:3, intervalo:.8, aviso:1.2, raioArea:45 }, vento: { tipo:'leque', n:5, vel:185, aviso:1, cor:'#94D9F5' } },
    fasesChefe(['ondas','vento'],['relampagos','ondas','vento'],'Observe os avisos. Há um caminho seguro.'), 'Jonas 1:4-16', 'O medo quer decidir por você!', 'Os marinheiros temeram ao Senhor, ofereceram sacrifícios e fizeram votos (Jn 1:16).'),
  desespero: chefe('Eco do Abismo', 'A voz do desespero', '#B6A0E6', 460, 8,
    { ecos: { tipo:'anel', n:10, vel:140, aviso:1.1, cor:'#B6A0E6' }, correntes: { tipo:'pocas', n:3, raioArea:38, duracao:2.5, cor:'143,120,200' }, clamor: { tipo:'rajada', vezes:3, intervalo:.6, vel:180, cor:'#C6B8FA' } },
    fasesChefe(['ecos','clamor'],['correntes','clamor','ecos'],'A salvação vem do Senhor!'), 'Jonas 1:17–2:10', 'Aqui ninguém pode ouvir você…', 'Jonas orou. O grande peixe foi um meio de preservação, não o inimigo a vencer.'),
  violencia: chefe('Bastião da Violência', 'As correntes de Nínive', '#E9AD7F', 500, 8,
    { correntes: { tipo:'estocada', aviso:1.1, alcance:180, largura:36 }, estrondo: { tipo:'pisao', ondas:2, vel:170 }, pedras: { tipo:'marcados', vezes:3, intervalo:.8, raioArea:42, aviso:1.1 } },
    fasesChefe(['correntes','estrondo'],['pedras','correntes','estrondo'],'Que cada um abandone a violência!'), 'Jonas 3:1-10', 'Nada muda nesta cidade!', 'Deus viu as obras deles: abandonaram o mau caminho. Arrependimento aparece nas atitudes (Jn 3:10).'),
  ressentimento: chefe('Senhor da Sombra Seca', 'O coração que não perdoa', '#D6C77B', 550, 9,
    { espinhos: { tipo:'leque', n:5, vel:180, aviso:1, cor:'#D6C77B' }, calor: { tipo:'marcados', vezes:3, intervalo:1, raioArea:48, aviso:1.3 }, amargura: { tipo:'anel', n:10, vel:160, aviso:1.1, cor:'#C9A16C' } },
    fasesChefe(['espinhos','calor'],['amargura','calor','espinhos'],'Pessoas valem mais que o meu conforto!'), 'Jonas 4:1-11', 'Compaixão para eles? Nunca!', 'O livro termina com uma pergunta de Deus. O convite à compaixão também é para quem lê.')
};

const fases = [
  {
    n:1, nome:'Jope: a direção do chamado', ref:'Jonas 1:1-3', tema:'jope', nivel:1, chefe:'fuga', recompensa:'bussola_chamado',
    objetivo:'Reconstrua a rota do chamado, reúna 3 chaves e enfrente o Fugitivo.',
    licao:'Jonas, filho de Amitai, recebe uma missão para Nínive, mas desce a Jope e embarca para Társis. Ter uma oportunidade e dinheiro para uma passagem não significa estar obedecendo.',
    versiculo:{texto:'Levanta-te, vai à grande cidade de Nínive.',ref:'Jonas 1:2'},
    estudo:[
      'LEIA Jonas 1:1-3. Nínive era uma importante cidade assíria. O texto começa com a maldade da cidade diante de Deus e com um chamado para Jonas anunciar sua mensagem.',
      'OBSERVE os verbos: levantar, ir e clamar; Jonas se levanta para fugir. Ele desce a Jope, encontra um navio e paga a passagem. O relato descreve uma recusa deliberada. O próprio Jonas explicará seu motivo em 4:2.',
      'ENTENDA: fugir da presença do Senhor expressa a tentativa de escapar da missão, não um lugar onde Deus não pudesse agir. A posição exata de Társis é discutida; a narrativa enfatiza a direção oposta à obediência.',
      'PRATIQUE: pense numa responsabilidade que você tem evitado. Qual pequeno passo concreto pode dar hoje? Neste mapa, os símbolos de bússola dramatizam essa decisão; não são objetos citados no livro.'
    ],
    reflexao:'Quem eu evito porque não quero que receba a mesma misericórdia que desejo para mim?',
    inimigos:['distracao','medo','orgulho'],
    npcs:{N:{nome:'Jonas',look:jonas,falas:['Sou Jonas, filho de Amitai. Recebi uma palavra para Nínive… mas comprei passagem para Társis.','Leia Jonas 4:2 antes de concluir que foi apenas medo: eu conhecia a misericórdia de Deus.']},M:{nome:'Marinheiro de Jope',look:marinheiro,falas:['O navio segue para Társis. Uma passagem comprada não decide qual é o caminho certo.','Visite as três bússolas luminosas. A porta exige as três decisões e as três chaves dos baús.']}},
    estacoes:[
      estacao('chamado','Escutar o chamado',12,30,'bussola','Para onde a palavra de Deus enviou Jonas?','Nínive','Társis','Jope','Jn 1:2: a missão era anunciar a mensagem à grande cidade de Nínive.'),
      estacao('rota','Examinar a rota',31,22,'bussola','A bússola aponta para o navio. Qual ação representa voltar à missão?','Reconhecer que escolhi fugir','Chamar a fuga de obediência','Culpar os marinheiros','Jn 1:3 mostra a escolha de Jonas; o estudo começa reconhecendo nossas decisões.'),
      estacao('passo','Assumir a responsabilidade',15,15,'pergaminho','Qual atitude aplica o chamado no cotidiano?','Dar um passo responsável, mesmo desconfortável','Esperar que todos façam por mim','Confundir facilidade com aprovação de Deus','Aplicação de Jn 1:1-3: a reflexão deve resultar numa atitude concreta, sem transformar o texto numa promessa de facilidade.')
    ],
    quiz:[
      q('De quem Jonas era filho? (Jn 1:1)','Amitai','Zebedeu','Jessé','O livro identifica Jonas como filho de Amitai.'),
      q('A qual cidade Jonas foi enviado?','Nínive','Corinto','Társis','Jn 1:2: Nínive é o destino do chamado.'),
      q('O que tinha subido à presença de Deus?','A maldade de Nínive','O ouro dos marinheiros','A fama de Jope','Jn 1:2 destaca o problema moral da cidade.'),
      q('Para onde Jonas decidiu fugir?','Társis','Nínive','Belém','Jn 1:3 contrapõe Társis ao destino recebido.'),
      q('Em qual porto Jonas encontrou o navio?','Jope','Roma','Cencreia','Jonas desceu a Jope, pagou a passagem e embarcou (1:3).'),
      q('O que Jonas fez antes de embarcar?','Pagou a passagem','Pregou ao rei','Construiu um templo','O narrador registra que ele pagou o preço da passagem (1:3).'),
      q('O chamado foi dirigido a quem?','Jonas','Somente ao capitão','Ao rei de Corinto','A palavra do Senhor veio a Jonas (1:1).'),
      q('O texto dá a posição exata de Társis num mapa atual?','Não; o destaque é a fuga','Sim, fornece coordenadas','Sim, diz que é Nínive','Não confunda reconstruções geográficas discutidas com o que o texto afirma.'),
      q('Onde Jonas explica seu motivo para fugir?','Jonas 4:2','Jonas 2:10','Atos 18:3','Ele diz que sabia que Deus era misericordioso e compassivo.'),
      q('Qual é a tensão inicial do livro?','O chamado de Deus e a recusa do profeta','Uma corrida por tesouros','A conquista militar de Jope','A fuga abre a história; a misericórdia a atravessa até o final.')
    ]
  },
  {
    n:2,nome:'A tempestade e os marinheiros',ref:'Jonas 1:4-16',tema:'conves',nivel:1,chefe:'pavor',recompensa:'manto_marinheiro',ambiente:'ondas',
    objetivo:'Ajude a tripulação entre as ondas, descubra 3 chaves e vença o Pavor.',
    licao:'Enquanto Jonas dorme, os marinheiros lutam pela vida. Eles tentam preservar o profeta e, ao final, reverenciam o Senhor. O relato desafia nosso desprezo por quem consideramos de fora.',
    versiculo:{texto:'Temeram, pois, estes homens ao Senhor com grande temor.',ref:'Jonas 1:16'},
    estudo:[
      'LEIA Jonas 1:4-16. O Senhor envia um grande vento, o navio ameaça quebrar e os marinheiros clamam, cada um ao seu deus. Eles lançam cargas ao mar; Jonas dorme no porão.',
      'OBSERVE: o capitão chama Jonas a orar; as sortes caem sobre ele; o profeta confessa temer o Deus que fez o mar e a terra. Suas palavras contrastam com sua fuga.',
      'ENTENDA: antes de lançar Jonas ao mar, os marinheiros remam para chegar à terra. Pedem que não lhes seja imputada culpa por sua morte. O episódio descreve uma situação singular; não ensina a ferir pessoas para resolver crises.',
      'PRATIQUE: coopere numa dificuldade sem procurar um bode expiatório. As cordas e os abrigos são mecânicas do jogo. O chefe é a personificação do pavor, não o Senhor nem a tempestade como inimigo divino.'
    ],reflexao:'Minha fé declarada combina com a maneira como trato as pessoas em perigo?',
    inimigos:['medo','duvida','distracao'],
    npcs:{N:{nome:'Capitão',look:marinheiro,falas:['Por que você dorme? Levante-se e clame ao seu Deus!','O piso marcado avisa onde a onda atingirá. Saia da faixa ou esquive no momento do impacto.']},M:{nome:'Jonas',look:jonas,falas:['Sou hebreu e temo ao Senhor, que fez o mar e a terra. Minha fuga colocou outros em perigo.','Os marinheiros tentaram remar até a terra antes de me lançar ao mar. Leia a história com cuidado.']}},
    estacoes:[
      estacao('carga','Aliviar o navio',12,30,'caixa','A carga ameaça o navio. O que a tripulação priorizou?','Preservar vidas, lançando cargas ao mar','Proteger mercadorias a qualquer custo','Abandonar os companheiros','Jn 1:5: a carga foi lançada para aliviar o navio. Cada estação concluída reduz o perigo ambiental.'),
      estacao('corda','Ajudar a tripulação',31,22,'ancora','Antes de lançar Jonas ao mar, os homens tentaram…','Remar de volta à terra','Atacar uma cidade','Fugir sozinhos num bote','Jn 1:13 mostra o esforço dos marinheiros para preservar a vida de Jonas.'),
      estacao('temor','Reconhecer o Senhor',15,15,'pergaminho','Após a calmaria, qual foi a resposta dos marinheiros?','Temeram ao Senhor e fizeram votos','Adoraram o navio','Culparam o capitão','Jn 1:16: a história termina com reverência, sacrifício e votos ao Senhor.')
    ],
    quiz:[
      q('Quem lançou um grande vento sobre o mar?','O Senhor','O capitão','O rei de Nínive','Jn 1:4 atribui o vento ao Senhor.'),
      q('O que os marinheiros lançaram ao mar primeiro?','As cargas','Jonas imediatamente','O capitão','Eles tentaram aliviar o navio (1:5).'),
      q('Onde Jonas estava dormindo?','No porão do navio','No palácio','Na praia','Jn 1:5 contrasta seu sono com a aflição da tripulação.'),
      q('O que o capitão pediu a Jonas?','Que se levantasse e clamasse a seu Deus','Que pagasse outra passagem','Que construísse um altar de ouro','Jn 1:6: o capitão chama Jonas a se levantar e clamar ao seu Deus.'),
      q('Sobre quem caíram as sortes?','Jonas','O capitão','O rei','Jn 1:7 narra o sorteio; isso não estabelece uma regra para tomar toda decisão.'),
      q('Como Jonas descreveu o Senhor?','Deus do céu, que fez o mar e a terra','Deus apenas de Jope','Um deus do navio','A confissão está em Jn 1:9.'),
      q('O que os homens tentaram antes de lançar Jonas?','Remar até a terra','Afundar outro navio','Comprar uma passagem','Jn 1:13 mostra que tentaram voltar à terra.'),
      q('O que aconteceu com o mar depois?','Cessou a sua fúria','Virou deserto','Continuou igual para sempre','Jn 1:15 descreve a calmaria.'),
      q('Como os marinheiros reagiram à calmaria?','Temeram ao Senhor','Coroaram Jonas rei','Voltaram a dormir','Eles ofereceram sacrifícios e fizeram votos (1:16).'),
      q('Este episódio autoriza ferir alguém para resolver uma crise?','Não; descreve um acontecimento específico','Sim, sempre','Somente se houver uma tempestade','Leia a narrativa como narrativa: os homens tentaram salvar Jonas e temeram ser culpados por sua morte.')
    ]
  },
  {
    n:3,nome:'No ventre: uma oração no abismo',ref:'Jonas 1:17–2:10',tema:'ventre',nivel:1,chefe:'desespero',recompensa:'lamparina_abismo',ambiente:'correntes',ordem:true,
    objetivo:'Acenda os memoriais na ordem da oração: clamor, lembrança, gratidão. Encontre 3 chaves.',
    licao:'O Senhor prepara um grande peixe para preservar Jonas. Das profundezas, ele ora, lembra-se do Senhor e declara que a salvação pertence a Deus.',
    versiculo:{texto:'Do Senhor vem a salvação.',ref:'Jonas 2:9'},
    estudo:[
      'LEIA Jonas 1:17–2:10. O texto diz “grande peixe”, sem identificar espécie. Jonas permanece três dias e três noites no seu ventre; então encontramos sua oração em forma poética.',
      'OBSERVE o movimento da oração: aflição e clamor (2:2), águas e profundezas (2:3-6), lembrança do Senhor (2:7), contraste com ídolos e ação de graças (2:8-9). A linguagem expressa perigo real e esperança de ser ouvido.',
      'ENTENDA: o peixe não é apresentado como um demônio. Deus o prepara e depois lhe dá uma ordem; ele vomita Jonas em terra seca (2:10). O resgate não significa que o coração de Jonas já aprendeu tudo, como o capítulo 4 mostrará.',
      'CONEXÃO: em Mateus 12:39-41, Jesus usa o sinal de Jonas e menciona o arrependimento de Nínive. Leia essa conexão sem substituir o sentido da oração no próprio livro. PRATIQUE uma oração com pedido, lembrança e gratidão.'
    ],reflexao:'Consigo reconhecer a graça que recebo sem negar essa graça aos outros?',
    inimigos:['desanimo','duvida','medo'],
    npcs:{N:{nome:'Jonas em oração',look:jonas,falas:['Na minha angústia clamei ao Senhor. Das profundezas, a minha oração chegou a ele.','Siga a ordem dos memoriais. O peixe é abrigo no resgate; o inimigo é o desespero.']},M:{nome:'Voz do estudo',look:marinheiro,falas:['Clamor → lembrança → gratidão. Os memoriais são uma atividade para acompanhar a oração.','Os círculos avisam onde a corrente surgirá. Saia antes do brilho se fechar.']}},
    estacoes:[
      estacao('clamor','1 · Clamor',12,30,'luz','Complete o primeiro movimento da oração: na angústia…','Clamei ao Senhor','Desisti de falar','Comprei outra passagem','Jn 2:2: Jonas clama na aflição e reconhece que foi ouvido.'),
      estacao('lembranca','2 · Lembrança',31,22,'luz','Quando sua alma desfalecia, Jonas…','Lembrou-se do Senhor','Esqueceu toda esperança','Ordenou ao peixe que saísse','Jn 2:7: a oração chegou ao Senhor, no seu santo templo.'),
      estacao('gratidao','3 · Gratidão',15,15,'luz','Como a oração se encerra?','Com gratidão: a salvação vem do Senhor','Com louvor ao grande peixe','Com uma promessa de nunca ter dificuldades','Jn 2:9 reúne ação de graças, votos e reconhecimento da salvação divina.')
    ],
    quiz:[
      q('O que o Senhor preparou para Jonas?','Um grande peixe','Um dragão','Um exército','Jn 1:17 não identifica a espécie do peixe.'),
      q('Quanto tempo Jonas permaneceu no ventre?','Três dias e três noites','Quarenta anos','Sete meses','O período é dado em Jn 1:17.'),
      q('A quem Jonas dirigiu sua oração?','Ao Senhor, seu Deus','Ao peixe','Ao capitão','Jn 2:1 identifica o destinatário da oração: o Senhor, Deus de Jonas.'),
      q('De onde ele clamou?','Da sua angústia','De um trono em Nínive','Do templo em Jerusalém','Jn 2:2 usa imagens das profundezas para expressar sua aflição.'),
      q('O que envolveu a cabeça de Jonas na descrição poética?','Algas','Uma coroa','Um turbante de ouro','A oração menciona algas na cabeça (2:5).'),
      q('De quem Jonas se lembrou quando desfalecia?','Do Senhor','De Gálio','De Faraó','Jn 2:7: ao desfalecer, Jonas se lembra do Senhor, e sua oração chega ao santo templo.'),
      q('Que atitude aparece em Jonas 2:9?','Ação de graças','Vingança contra marinheiros','Adoração ao peixe','Jonas promete sacrifício com voz de agradecimento.'),
      q('A quem pertence a salvação?','Ao Senhor','Ao profeta como dono dela','Ao navio','Esta é a declaração central de Jn 2:9.'),
      q('Quem ordenou ao peixe que devolvesse Jonas à terra?','O Senhor','O rei de Nínive','O capitão','Jn 2:10: o peixe vomitou Jonas em terra seca.'),
      q('Onde Jesus menciona o sinal de Jonas?','Mateus 12:39-41','Atos 18:1-3','Gênesis 1:1-3','Jesus relaciona o sinal a si e recorda que Nínive se arrependeu.')
    ]
  },
  {
    n:4,nome:'Nínive: quarenta dias para mudar',ref:'Jonas 3:1-10',tema:'ninive',nivel:1,chefe:'violencia',recompensa:'sandalias_mensageiro',
    objetivo:'Leve a mensagem a três praças, reúna 3 chaves e quebre o Bastião da Violência.',
    licao:'A palavra vem a Jonas pela segunda vez. Nínive crê, jejua e abandona o mau caminho. Deus vê as atitudes da cidade e não executa a destruição anunciada.',
    versiculo:{texto:'E Deus viu as obras deles, como se converteram do seu mau caminho.',ref:'Jonas 3:10'},
    estudo:[
      'LEIA Jonas 3:1-10. A segunda palavra de Deus repete o destino: Nínive. Desta vez Jonas vai. O anúncio é curto: ainda quarenta dias, e Nínive seria destruída.',
      'OBSERVE a resposta do povo, dos maiores aos menores, e depois do rei: ele deixa o trono, tira as vestes reais e se cobre de pano de saco. O decreto inclui jejum, clamor e abandono da violência.',
      'ENTENDA a pergunta de 3:9: “Quem sabe?” O arrependimento não é uma técnica para controlar Deus. Em 3:10, Deus vê que abandonaram o mau caminho e não traz a calamidade que anunciara.',
      'PRATIQUE: reparar um dano é mais profundo que parecer arrependido. Neste mapa, você não combate os habitantes de Nínive: ajuda a cidade e enfrenta uma alegoria da violência que precisa ser abandonada.'
    ],reflexao:'Que mudança observável acompanha o meu pedido de perdão?',
    inimigos:['ira','ganancia','orgulho'],
    npcs:{N:{nome:'Mensageiro Jonas',look:jonas,falas:['A palavra do Senhor veio a mim pela segunda vez. Agora fui a Nínive.','Ainda quarenta dias! A mensagem chama a cidade a encarar seu caminho.']},M:{nome:'Moradora de Nínive',look:cidada,falas:['O decreto fala de abandonar a violência das nossas mãos. Não basta vestir pano de saco.','Os moradores não são seus inimigos. Ajude as praças a transformar o arrependimento em ação.']}},
    estacoes:[
      estacao('praca','Praça dos pequenos',12,30,'sino','Uma família teme o anúncio. Como transmitir a mensagem?','Com clareza, sem humilhar quem escuta','Usando o medo para cobrar dinheiro','Escondendo a necessidade de mudança','Jn 3:4-5: a mensagem alcançou a cidade, e as pessoas creram em Deus.'),
      estacao('palacio','À porta do palácio',31,22,'coroa','Qual gesto do rei sinalizou sua resposta?','Deixar o trono e vestir pano de saco','Atacar o profeta','Ordenar uma festa de vitória','Jn 3:6: o rei tira o manto, cobre-se de pano de saco e senta-se sobre cinzas.'),
      estacao('reparacao','Quebrar o ciclo',15,15,'corrente','Qual ação corresponde ao decreto de Nínive?','Abandonar o mau caminho e a violência','Mudar só a aparência','Transferir toda culpa aos estrangeiros','Jn 3:8-10 destaca mudança de conduta; o Bastião personifica a violência, não o povo.')
    ],
    quiz:[
      q('Quantas vezes o livro diz que a palavra veio a Jonas até 3:1?','Duas','Uma','Dez','Jn 3:1 fala explicitamente da segunda vez.'),
      q('Qual foi o destino do novo chamado?','Nínive','Uma cidade diferente','Jope','O chamado permanece: ir a Nínive (3:2).'),
      q('Desta vez, Jonas…','Foi conforme a palavra do Senhor','Fugiu de novo para Társis','Recusou-se a sair do peixe','Jn 3:3 contrasta a segunda resposta com a fuga: Jonas se levanta e vai a Nínive.'),
      q('Qual prazo Jonas anunciou?','Quarenta dias','Três horas','Cem anos','A mensagem está em Jn 3:4.'),
      q('Em quem os ninivitas creram?','Em Deus','No grande peixe','Na força do navio','Jn 3:5 diz que creram em Deus.'),
      q('Quem participou da resposta da cidade?','Dos maiores aos menores','Só os soldados','Só Jonas','O texto enfatiza a amplitude da resposta (3:5).'),
      q('O que o rei fez ao ouvir a notícia?','Levantou-se do trono e cobriu-se de pano de saco','Prendeu Jonas','Ignorou a cidade','Jn 3:6 descreve o rei saindo do trono, tirando o manto e sentando-se sobre cinzas.'),
      q('O decreto exigia abandonar o quê?','O mau caminho e a violência','Todo trabalho honesto','A linguagem do povo','Jn 3:8 pede mudança concreta.'),
      q('“Quem sabe?” em Jonas 3:9 expressa…','Esperança humilde na misericórdia','Controle garantido sobre Deus','Indiferença ao anúncio','O povo clama sem tratar Deus como alguém que possa ser manipulado.'),
      q('O que Deus viu em Jonas 3:10?','Que se converteram do mau caminho','Somente as roupas','Uma nova frota de navios','O texto destaca suas obras e a mudança de caminho.')
    ]
  },
  {
    n:5,nome:'Além da sombra: o coração de Deus',ref:'Jonas 4:1-11',tema:'sombra',nivel:1,chefe:'ressentimento',recompensa:'cinto_compaixao',ambiente:'calor',ordem:true,
    objetivo:'Acompanhe planta, verme e vento; escolha a compaixão, reúna 3 chaves e enfrente o ressentimento.',
    licao:'Jonas se alegra com uma planta e se irrita com a misericórdia para uma cidade. Deus usa a sombra perdida para perguntar por que o profeta não se importa com pessoas e animais.',
    versiculo:{texto:'E não hei de eu ter compaixão da grande cidade de Nínive?',ref:'Jonas 4:11'},
    estudo:[
      'LEIA Jonas 4:1-11. A preservação de Nínive desagrada profundamente a Jonas. Ele explica sua fuga: sabia que Deus era misericordioso, compassivo, tardio em irar-se e grande em amor (4:2).',
      'OBSERVE: Deus pergunta se sua ira é razoável. Jonas espera fora da cidade. O Senhor prepara uma planta, depois um verme e um vento oriental quente. Jonas se alegra com a sombra, mas se revolta quando ela acaba.',
      'ENTENDA o contraste: Jonas se importa com uma planta que não cultivou. Deus se importa com Nínive, seus mais de 120 mil habitantes que não discernem entre a mão direita e a esquerda, e seus muitos animais. O texto não identifica explicitamente todos esses habitantes como crianças.',
      'CONCLUA: o livro termina com a pergunta de Deus, sem registrar a resposta final do profeta. A misericórdia alcança estrangeiros e confronta quem se julga mais merecedor. PRATIQUE: ore por alguém de quem você discorda e procure uma forma responsável de fazer-lhe o bem.'
    ],reflexao:'Importo-me mais com o meu conforto ou com a vida de quem penso que não merece misericórdia?',
    inimigos:['ira','inveja','orgulho'],
    npcs:{N:{nome:'Jonas à sombra',look:jonas,falas:['Eu sabia que és misericordioso e compassivo… Por isso tentei fugir.','A planta me trouxe alívio. Por que eu me importo tanto com ela e tão pouco com a cidade?']},M:{nome:'Moradora de Nínive',look:cidada,falas:['Há pessoas e animais nesta cidade. Nossa vida não é uma recompensa para o orgulho de ninguém.','Observe a planta, o verme e o vento. O livro deixa a pergunta final com você.']}},
    estacoes:[
      estacao('planta','1 · A sombra recebida',12,30,'planta','Como Jonas reagiu à planta?','Alegrou-se muito por causa dela','Ignorou a sombra','Plantou uma floresta','Jn 4:6: ele se alegrou com o alívio. A planta foi providenciada por Deus, não cultivada por Jonas.'),
      estacao('verme','2 · A sombra perdida',31,22,'verme','O que a perda da planta revela no contraste do capítulo?','A importância que Jonas dá ao próprio conforto','Que toda planta é má','Que Nínive deve ser atacada pelo jogador','Jn 4:7-10 prepara a comparação entre a planta e as vidas da cidade.'),
      estacao('compaixao','3 · A pergunta aberta',15,15,'coracao','Como responder ao convite final de Deus?','Aprender a ter compaixão de pessoas e animais','Desejar a destruição de quem é diferente','Achar que a misericórdia pertence só a mim','Jn 4:11 termina em pergunta. A escolha é uma aplicação para o jogador; a Bíblia não relata a resposta final de Jonas.')
    ],
    quiz:[
      q('Como Jonas reagiu quando Nínive foi poupada?','Ficou profundamente irado','Festejou com o rei','Voltou imediatamente a pregar feliz','Jn 4:1 descreve seu desagrado.'),
      q('Por que Jonas diz que fugiu?','Sabia que Deus era misericordioso','Não sabia onde ficava Jope','Queria vender peixes','Jn 4:2 explica a fuga do primeiro capítulo.'),
      q('Qual pergunta Deus faz sobre a ira de Jonas?','É razoável essa tua ira?','Quanto custou a passagem?','Quem construiu o navio?','A pergunta aparece em 4:4 e retorna em 4:9.'),
      q('Onde Jonas esperou para ver o que aconteceria?','Ao oriente da cidade','Dentro do palácio','Em Corinto','Ele construiu uma cabana fora da cidade (4:5).'),
      q('O que Deus preparou para fazer sombra?','Uma planta','Uma muralha de ouro','Um navio','Jn 4:6 destaca o alívio que a planta trouxe.'),
      q('O que feriu a planta?','Um verme','O capitão','Um soldado romano','Jn 4:7: Deus prepara um verme que fere a planta, e ela seca.'),
      q('Que vento aparece no dia seguinte?','Um vento oriental quente','Uma brisa gelada do norte','Nenhum vento','Jn 4:8 menciona o vento e o sol sobre a cabeça de Jonas.'),
      q('Jonas havia trabalhado para fazer a planta crescer?','Não','Sim, por quarenta anos','Sim, junto com o rei','Deus destaca que Jonas não a cultivou (4:10).'),
      q('Além das pessoas, quem é mencionado na pergunta final?','Muitos animais','Somente soldados','Os mercadores de Corinto','Jn 4:11 inclui os animais na preocupação divina.'),
      q('O livro registra a resposta final de Jonas?','Não; termina com a pergunta de Deus','Sim, diz que destruiu Nínive','Sim, diz que voltou ao navio','O final aberto convida o leitor a examinar seu próprio coração.')
    ]
  }
];
for (const f of fases) f.mapa = mapa(f.n);
export default {
  id:'semana-02', titulo:'Jonas: para além da minha misericórdia', estudo:'Jonas 1–4', sala:'jope',
  resumo:'Um chamado recusado, marinheiros em perigo, uma oração nas profundezas, uma cidade que muda e um profeta confrontado pela compaixão. Cinco fases cobrem os quatro capítulos de Jonas. Esta semana pode ser iniciada sem concluir Corinto.',
  versiculo:{texto:'Do Senhor vem a salvação.',ref:'Jonas 2:9'}, recompensaSemana:'selo_misericordia',
  guia:{nome:'Jonas, o profeta em aprendizado',look:jonas}, chefes:CHEFES_JONAS, fases
};
