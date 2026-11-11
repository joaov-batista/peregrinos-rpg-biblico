// Decisões de estudo de Corinto (Atos 18) para o Caminho: três por página, de aplicação, além dos três rolos.
// Ficam fora de semana-01.js porque o modo clássico trata "estacoes" como pontos fixos do mapa de letras.
const d = (id, nome, pergunta, certa, errada, outra, porque) => ({ id, nome, simbolo: 'luz', estacao: true, q: pergunta, a: [certa, errada, outra], porque });
export const DECISOES_CORINTO = {
  1: [
    d('preco', 'A banca dos ídolos', 'Na Ágora tudo tem preço. O que Mateus 6:24 diz que não se pode fazer?', 'Servir a Deus e às riquezas ao mesmo tempo', 'Ter qualquer dinheiro', 'Entrar num mercado', '"Ninguém pode servir a dois senhores." O problema é a quem se serve, não possuir algo.'),
    d('sozinho', 'O recém-chegado', 'Paulo chega a Corinto sem equipe. O que sustenta alguém num lugar novo e hostil?', 'A presença de Deus, que não depende de companhia', 'A fama que traz de Atenas', 'Evitar falar de fé', 'Em At 18:10 o Senhor dirá: "eu estou contigo". A promessa vale antes de haver igreja na cidade.'),
    d('tesouro', 'Onde está o coração', 'Segundo Mateus 6:21, o coração de alguém está…', 'Onde está o seu tesouro', 'Onde está a sua família', 'Onde ele nasceu', 'O que guardamos com mais zelo mostra o que amamos.')
  ],
  2: [
    d('oficio', 'A mesa de couro', 'Por que Paulo ficou com Áquila e Priscila? (At 18:3)', 'Eram do mesmo ofício: faziam tendas', 'Eram parentes dele', 'Tinham a maior casa da cidade', 'O trabalho comum abriu a porta para a amizade e para a missão.'),
    d('hoje', 'O trabalho de hoje', 'Colossenses 3:23 manda fazer tudo…', 'De todo o coração, como para o Senhor', 'Depressa, para sobrar tempo', 'Só quando alguém está vendo', 'O destinatário do trabalho muda a qualidade dele.'),
    d('adiar', 'A voz do "depois"', 'A Procrastinação promete descanso. O que Eclesiastes 11:4 observa?', 'Quem fica olhando o vento nunca semeia', 'Quem espera sempre alcança', 'O amanhã resolve sozinho', 'Esperar a condição perfeita é um jeito de nunca começar.')
  ],
  3: [
    d('sabado', 'Todo sábado', 'Com que frequência Paulo discorria na sinagoga? (At 18:4)', 'Todos os sábados', 'Uma única vez', 'Só nas festas', 'A constância, e não um discurso brilhante, marca o trabalho dele em Corinto.'),
    d('resistencia', 'Quando resistem', 'Diante da oposição (At 18:6), Paulo…', 'Sacudiu as vestes e foi aos gentios, sem desistir da mensagem', 'Mudou a mensagem para agradar', 'Calou-se e voltou a Atenas', 'Ele muda de público, não de evangelho.'),
    d('verdade', 'O teste da verdade', 'Como João 8:32 descreve o efeito da verdade?', 'Ela liberta', 'Ela envergonha', 'Ela confunde', '"Conhecereis a verdade, e a verdade vos libertará." A mentira prende; por isso se disfarça.')
  ],
  4: [
    d('porta', 'A casa ao lado', 'Onde ficava a casa de Tício Justo? (At 18:7)', 'Ao lado da sinagoga', 'Fora da cidade', 'Dentro do tribunal', 'Expulso da sinagoga, Paulo continua a um muro de distância.'),
    d('visao', 'A visão da noite', 'O que o Senhor disse a Paulo? (At 18:9-10)', 'Não temas; fala e não te cales, porque eu estou contigo', 'Foge desta cidade', 'Fica em silêncio por um tempo', 'A ordem vem com a promessa: "tenho muito povo nesta cidade".'),
    d('fugir', 'Fugir é vencer', 'O que 1 Coríntios 6:18 manda fazer com a imoralidade?', 'Fugir dela', 'Enfrentá-la de perto para provar força', 'Conviver com cuidado', 'Há lutas que se vencem saindo. O corpo é santuário do Espírito (6:19).')
  ],
  5: [
    d('galio', 'Diante de Gálio', 'O que Gálio fez com a acusação contra Paulo? (At 18:14-16)', 'Recusou-se a julgá-la e expulsou os acusadores', 'Condenou Paulo', 'Mandou prendê-lo por um ano', 'A proteção prometida em 18:10 chega por um caminho inesperado: um procônsul desinteressado.'),
    d('acusador', 'O nome do acusador', 'Como Apocalipse 12:10 chama Satanás?', 'O acusador de nossos irmãos', 'O dono da terra', 'O juiz dos vivos', 'Ele acusa "de dia e de noite". A resposta de 12:11 é o sangue do Cordeiro e a palavra do testemunho.'),
    d('defesa', 'Quem defende', 'Segundo Romanos 8:33-34, quem intercede por nós?', 'Cristo Jesus, à direita de Deus', 'Nossas boas obras', 'Ninguém', '"Quem intentará acusação contra os eleitos de Deus? É Deus quem os justifica."')
  ]
};
