// Falas dos personagens das fases, reescritas para o Caminho: curtas, na voz de cada um e presas ao texto bíblico.
// Chave: semana → número da fase → nome do personagem. Quem não está aqui usa as falas do próprio arquivo da semana.
export const FALAS = {
  'semana-01': {
    1: { Paulo: ['Vim de Atenas sozinho. Lá me ouviram como quem ouve uma novidade; aqui, talvez nem isso (At 17:21; 18:1).', 'Corinto mede tudo em dinheiro. O evangelho não tem preço, e é justamente isso que incomoda.', 'As sombras desta cidade guardam páginas. Leia o que elas escondem antes de enfrentar quem as guarda.'] },
    2: { Priscila: ['Cláudio mandou todos os judeus saírem de Roma. Perdemos a casa, não o ofício (At 18:2).', 'Tenda se faz ponto por ponto. Quem deixa para amanhã o ponto de hoje acorda com a lona rasgada.'],
      'Áquila': ['Paulo trabalha conosco durante a semana e, aos sábados, discute na sinagoga (At 18:3-4).', 'Ele não vive do que os ouvintes dão. As mãos dele pagam o pão dele.'] },
    3: { Paulo: ['Sábado após sábado eu lhes mostro, pelas Escrituras, que o Cristo é Jesus (At 18:5).', 'Quando a verdade é recusada, a mentira não fica parada: ocupa o lugar.', 'Se me expulsarem, sacudo as vestes e vou aos gentios. A consciência eu levo limpa (At 18:6).'],
      Silas: ['Chegamos da Macedônia. Com a ajuda dos irmãos de lá, Paulo pôde se dedicar inteiramente à palavra (At 18:5).', 'Já estive preso com ele em Filipos. Cantamos à meia-noite, e as portas se abriram (At 16:25-26).'],
      'Timóteo': ['Sou o mais novo aqui. Paulo me disse que ninguém despreze a minha mocidade (1Tm 4:12).', 'Trouxe boas notícias de Tessalônica: a fé deles continua de pé (1Ts 3:6).'] },
    4: { 'Tício Justo': ['Minha casa é parede-meia com a sinagoga. Quando fecharam aquela porta, abri a minha (At 18:7).', 'Não nasci judeu; sou dos que temem a Deus. Aqui ninguém pergunta de onde você veio.'],
      Crispo: ['Eu presidia a sinagoga ao lado. Cri no Senhor, eu e toda a minha casa (At 18:8).', 'Perdi o cargo e achei o que procurei a vida inteira naqueles rolos.'],
      Anjo: ['De noite, numa visão, o Senhor falou a Paulo: "Não temas; fala e não te cales" (At 18:9).', '"Eu sou contigo, e ninguém porá a mão em ti para te fazer mal, pois tenho muito povo nesta cidade" (At 18:10).'] },
    5: { 'Gálio': ['Sou o procônsul da Acaia. Se fosse injustiça ou crime grave, eu os ouviria com paciência (At 18:14).', 'Mas são questões de palavras, de nomes e da lei de vocês. Disso não quero ser juiz (At 18:15).'],
      'Sóstenes': ['Chefio a sinagoga agora. Viemos acusar Paulo, e quem apanhou diante do tribunal fui eu (At 18:17).', 'Gálio nem olhou. Fico pensando em quem, afinal, estava sendo julgado ali.'],
      Priscila: ['Um ano e seis meses nesta cidade. Quando ele partir, vamos junto, até Éfeso (At 18:11,18-19).', 'O acusador grita alto, mas a sentença não é dele.'] }
  },
  'semana-02': {
    1: { Jonas: ['A palavra veio clara: "Levanta-te, vai à grande cidade de Nínive" (Jn 1:2). Eu me levantei. Para o outro lado.', 'Não fujo por medo deles. Fujo porque sei como Deus é, e não quero ver o que ele vai fazer (Jn 4:2).', 'Paguei a passagem para Társis. É o mais longe que um navio alcança.'],
      'Marinheiro de Jope': ['Társis fica no fim do mar. Quem embarca para lá costuma estar deixando alguma coisa para trás.', 'O homem pagou sem pechinchar e desceu direto ao porão. Nem olhou o céu.'] },
    2: { 'Capitão': ['Que é isso, dorminhoco? Levanta-te e clama ao teu Deus! Talvez ele se lembre de nós (Jn 1:6).', 'Já lançamos a carga ao mar. Navio leve também afunda, quando a tempestade tem endereço.'],
      Jonas: ['Sou hebreu, e temo o Senhor, o Deus do céu, que fez o mar e a terra seca (Jn 1:9).', 'Lançai-me ao mar, e ele se aquietará. Sei que é por minha causa (Jn 1:12).'] },
    3: { 'Jonas em oração': ['Na minha angústia clamei ao Senhor, e ele me respondeu; do ventre do abismo gritei (Jn 2:2).', 'As águas me cercaram até a alma; as algas se enrolaram na minha cabeça (Jn 2:5).', 'Quando a vida desfalecia em mim, lembrei-me do Senhor. Do Senhor vem a salvação (Jn 2:7,9).'],
      'Voz do estudo': ['O peixe não é o castigo: é o resgate. O castigo seria o fundo do mar.', 'Jonas ora com palavras dos Salmos. Quem guardou a Escritura tem o que dizer no escuro.'] },
    4: { 'Mensageiro Jonas': ['Um dia de caminhada cidade adentro, e uma frase só: "Ainda quarenta dias, e Nínive será subvertida" (Jn 3:4).', 'Não acrescentei esperança nenhuma. Eles se arrependeram assim mesmo.'],
      'Moradora de Nínive': ['Do maior ao menor, vestimos pano de saco. Até o rei desceu do trono e sentou na cinza (Jn 3:5-6).', '"Quem sabe se Deus se voltará?" Não tínhamos promessa. Só esse "quem sabe" (Jn 3:9).'] },
    5: { 'Jonas à sombra': ['Era isso que eu dizia ainda na minha terra: tu és Deus compassivo, tardio em irar-se e grande em benignidade (Jn 4:2).', 'Fiquei contente com a planta. Um verme a secou numa madrugada, e eu quis morrer (Jn 4:6-8).'],
      'Moradora de Nínive': ['Mais de cento e vinte mil pessoas que não sabem discernir entre a mão direita e a esquerda (Jn 4:11).', 'O livro termina numa pergunta. Quem responde é quem lê.'] }
  }
};
