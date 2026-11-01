# Jogo offline, sincronização e nitidez

Abra o jogo com internet e aguarde **Offline pronto**. O primeiro download inclui o jogo, os ícones e cerca de 14 MB de narrações. Depois, use **Instalar app** (ou Adicionar à Tela de Início no iPhone). O mesmo cache permite reabrir pelo navegador sem internet.

Para levar o progresso à nuvem, entre na conta e carregue seus personagens ao menos uma vez com internet. Eles ficam disponíveis neste aparelho quando a rede cair, inclusive se a sessão precisar ser renovada. Personagens criados sem conta continuam exclusivamente locais, como informa a tela de entrada; não são associados automaticamente a outra conta.

O progresso é salvo primeiro no aparelho, nas ações importantes, a cada 30 segundos e quando o jogo vai para segundo plano. A sincronização retoma ao reconectar, ao reabrir e periodicamente enquanto o jogo está visível. Um aplicativo fechado ou suspenso depende de ser aberto novamente. Ranking mundial, multiplayer e ações de clã precisam de internet. Criar ou apagar personagens de uma conta também requer conexão.

Se outro aparelho modificou o mesmo personagem, as duas versões são preservadas. Na seleção, **Exportar cópia**, **Manter deste aparelho** e **Usar progresso da nuvem** permitem resolver o conflito. A escolha usa um personagem completo: inventário, moedas e recompensas não são somados. Um backup das duas versões fica no armazenamento local antes da escolha. O servidor continua impedindo regressão de nível/pontos. Personagens apagados na nuvem não são recriados automaticamente.

Não limpe os dados do navegador antes de sincronizar. O indicador informa falhas de armazenamento e permite exportar o personagem em memória mesmo sem espaço para salvar. Navegadores com Web Locks impedem abrir a mesma partida em duas abas; a revisão local também detecta gravações feitas a partir de cópias antigas.

Atualizações são baixadas por inteiro antes de oferecer **Salvar e atualizar**. A versão em execução continua disponível enquanto a nova está sendo preparada. O worker atende narrações com requisições HTTP Range sem internet e não armazena respostas do Supabase. A ativação preserva duas gerações anteriores dos arquivos para abas antigas.

## Desempenho e celular

- Colisões usam uma grade espacial, evitando comparar cada inimigo com todos os demais. A IA e o dano continuam ativos fora da tela.
- Entidades fora da câmera deixam de ser desenhadas; missões são examinadas uma vez por atualização dos inimigos; o HUD atualiza até 20 vezes por segundo.
- **Menu → Ajustes → Imagem nítida no celular** vem ligado. Usa a densidade da tela, até 4× e 8 milhões de pixels, e desenha o cenário em resolução compatível. O PC mantém seu limite anterior de 2×.
- Os pedaços do cenário usam cache LRU de até 64 MiB por mapa; girar a tela troca a resolução sem acumular escalas. Desligar Imagem nítida retorna ao modo de menor consumo.

## Validação local

`npm test` cobre combate, carona, papagaio, limites de resolução, colisões e sincronização: falhas de rede, resposta perdida, salvamento durante envio, conflitos, troca de conta, armazenamento cheio e jornadas longas que excedem 20 mil pontos. O envio respeita o limite por atualização já existente no servidor, em etapas com confirmação de revisão.

`npm run build` gera o manifest de precache automaticamente, sem dependência nova ou migração de banco.

Com Chromium e Playwright disponíveis:

- `node tests/offline-browser.cjs`: compila em diretório temporário, inicia servidor local e simula o Supabase. Verifica download inicial, reabertura offline, áudio parcial, sincronização automática, conflito e atualização offline. Não usa contas reais.
- Com `npm run dev` em execução: `node tests/browser-smoke.cjs`, `node tests/horse-browser.cjs`, `node tests/parrot-browser.cjs`.
- `node tests/mobile-browser.cjs`: compara a revisão anterior com a atual em tela móvel 3×, testa rotação, cache e opção econômica. Os tempos são de Chromium emulado, não uma medição de FPS em aparelho físico.

Não houve publicação nem alteração do Supabase de produção nesta tarefa.
