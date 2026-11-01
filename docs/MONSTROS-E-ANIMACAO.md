# Sprites e movimentação dos monstros

A versão anterior (offline, sincronização e nitidez) foi enviada primeiro à `main`, no commit `9e5babd`, para acionar a publicação automática da Vercel.

Esta alteração acrescenta cores por criatura e detalhes como musgo na carcaça da Preguiça, placas na Inveja, moedas na Ganância, fragmentos na Dúvida, fissuras na Ira e penas na Vaidade. Mantém o estilo de tinta e máscaras, com poses mais claras para caminhada, preparo, golpe e reação.

A animação usa a distância percorrida para a passada, com pernas alternadas, inclinação gradual e frequência contínua das asas. Parada, atordoamento, teleporte e reentrada na câmera têm tratamento próprio. Chefes usam a mesma base de movimento; dano, alcance, dificuldade e temporizadores de combate foram preservados.

Nos clientes multiplayer, posições confirmadas são interpoladas entre pacotes, com atraso visual de uma atualização (150 ms), em vez de acelerar e frear em direção a cada pacote. Não há extrapolação através de paredes quando a conexão para. Poses remotas usam campos visuais separados da IA, inclusive na troca de anfitrião.

Traços que mudam a cada quadro não entram no cache de formas estáticas. Cada membro articulado constrói o caminho uma única vez para contorno e preenchimento; inserir um novo caminho não limpa todo o cache.

Validação: `npm test` (44 testes), `npm run build`, `node tests/monster-browser.cjs` e `node tests/browser-smoke.cjs` com o servidor de desenvolvimento rodando. A galeria verifica todos os 19 monstros/chefes em três estados e a movimentação de rede. As capturas ficam em `/tmp/peregrinos-monstros-{caminhada,preparo,golpe}.png`.
