import semana from './semana-02.js';
const fundos=['costa','mar','noite','muralha','deserto'];
const textos=[
  ['Uma palavra chama Jonas para Nínive. Ele desce a Jope, paga uma passagem e embarca para Társis. O livro começa com uma direção recusada.', 'No cais, três bússolas convidam você a escutar, reconhecer a fuga e assumir uma responsabilidade. O Fugitivo é a alegoria dessa recusa.'],
  ['O vento se levanta, os marinheiros clamam e a carga é lançada ao mar. No porão, Jonas dorme. O capitão o chama a despertar.', 'Ajude a tripulação e observe as faixas das ondas. Os marinheiros tentarão preservar Jonas. O Pavor representa o medo; não é Deus nem um personagem do relato.'],
  ['O Senhor prepara um grande peixe. Três dias e três noites nas profundezas. Jonas não foi esquecido: de dentro do peixe, ele ora.', 'Clamor, lembrança, gratidão. Acenda os memoriais nessa ordem. O peixe é parte do resgate; o Eco do Abismo representa o desespero.'],
  ['A palavra vem pela segunda vez. Jonas vai a Nínive e anuncia: ainda quarenta dias! Dos maiores aos menores, a cidade responde.', 'Leve a mensagem às praças. O rei desce do trono. Abandonar a violência exige atitudes. Os habitantes são pessoas a ajudar, não inimigos para atacar.'],
  ['A cidade foi poupada, mas Jonas está irado. Uma planta cresce e lhe dá sombra. Um verme a fere. O vento quente sopra.', 'Você se importa com a planta… e não deveria Deus ter compaixão de Nínive? A última batalha é contra o ressentimento. O livro termina com uma pergunta para o nosso coração.']
];
export const CINEMAS_JONAS={
  'semana-02':{titulo:semana.titulo,cenas:[
    {cena:'costa',titulo:'SEMANA 2 · JONAS',sub:'Um chamado. Uma cidade. Uma misericórdia maior.',texto:semana.resumo},
    {cena:'mar',fig:[{p:semana.guia.look,x:.5,y:.82,s:1.6}],texto:'Esta é uma adaptação de Jonas 1 a 4. Os chefes personificam conflitos do coração. Leia, explore, converse e responda com suas escolhas.'}
  ]},
  'semana-02-fim':{titulo:'A pergunta que continua',cenas:[
    {cena:'muralha',titulo:'NÍNIVE FOI POUPADA',texto:'Deus viu que abandonaram o mau caminho. A misericórdia não é um prêmio reservado a quem pensa merecê-la.'},
    {cena:'deserto',fig:[{p:semana.guia.look,x:.35,y:.82,s:1.6},{p:'jogador',x:.65,y:.82,s:1.6,vira:-1}],texto:'Jonas se importou com a sombra de uma planta. Deus perguntou pelas pessoas e pelos animais da grande cidade. A resposta final de Jonas não é registrada.'},
    {cena:'luz',titulo:'E VOCÊ?',sub:'Jonas 4:11',texto:'O Selo da Misericórdia marca o fim das cinco fases. O estudo continua na vida: a quem você pode estender a compaixão que recebeu?'}
  ]}
};
for(const f of semana.fases){
  CINEMAS_JONAS['semana-02-fase-'+f.n]={titulo:'Fase '+f.n+' · '+f.nome,cenas:[
    {cena:fundos[f.n-1],titulo:'FASE '+f.n,sub:f.ref,texto:textos[f.n-1][0]},
    {cena:fundos[f.n-1],fig:[{p:'chefe:'+f.chefe,x:.68,y:.78,s:1.6},{p:'jogador',x:.3,y:.84,s:1.4}],texto:textos[f.n-1][1]}
  ]};
  CINEMAS_JONAS['chefe-'+f.chefe]={titulo:semana.chefes[f.chefe].nome,cenas:[
    {cena:fundos[f.n-1],fig:[{p:'chefe:'+f.chefe,x:.5,y:.8,s:2}],titulo:semana.chefes[f.chefe].nome,sub:semana.chefes[f.chefe].titulo,texto:semana.chefes[f.chefe].intro+' Observe as áreas marcadas, esquive e ataque nas pausas. Ao perder metade da vida, o chefe muda a sequência de golpes.'}
  ]};
}
