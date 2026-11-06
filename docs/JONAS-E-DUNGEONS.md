# Jonas e as dungeons

A semana 2, **Jonas: para além da minha misericórdia**, está disponível no Salão das Dungeons desde o nível 1. Não exige terminar Corinto. Dentro de cada semana, concluir uma fase libera a seguinte; progresso, melhores pontuações e recompensas ficam separados por semana.

## As cinco fases

| Fase | Texto | Atividade | Chefe simbólico |
|---|---|---|---|
| Jope: a direção do chamado | Jonas 1:1–3 | Escutar, examinar a rota e assumir uma responsabilidade | O Fugitivo: bússola, mapas e investidas |
| A tempestade e os marinheiros | Jonas 1:4–16 | Ajudar a tripulação enquanto desvia das ondas | Pavor da Tormenta: ciclone, relâmpagos e ondas |
| No ventre: uma oração no abismo | Jonas 1:17–2:10 | Acender os memoriais na ordem clamor → lembrança → gratidão | Eco do Abismo: espírito com costelas e correntes |
| Nínive: quarenta dias para mudar | Jonas 3:1–10 | Percorrer a cidade, ouvir a mensagem e refletir sobre a mudança de atitudes | Bastião da Violência: muralha viva e correntes |
| Além da sombra: o coração de Deus | Jonas 4:1–11 | Acompanhar planta → verme → compaixão, evitando o calor | Senhor da Sombra Seca: árvore seca e folhas em movimento |

Cada fase tem mapa próprio, dois interlocutores, três atividades, dez perguntas com explicações, texto de estudo e reflexão. O estudo acompanha os quatro capítulos, incluindo o motivo da fuga em 4:2, a reação dos marinheiros, a oração, o arrependimento de Nínive e a pergunta final de Deus. A conexão com Mateus 12:39–41 aparece na terceira fase.

Os chefes representam conflitos do coração na adaptação. O grande peixe é parte do resgate; os habitantes de Nínive são pessoas a ajudar. Os textos distinguem as atividades inventadas para o jogo dos acontecimentos narrados no livro, sem apresentar uma resposta de Jonas à pergunta final que o texto não registra.

## Como jogar

- Escolha a sala de Jonas no Salão das Dungeons e entre no primeiro portão.
- No portão, escolha **História**, **Jornada** ou **Desafio**. **Ler estudo completo** abre a leitura antes de entrar; todos os estudos também estão no menu **Bíblia**.
- Aproxime-se dos símbolos luminosos e pressione **E**, use a interação do controle ou o botão de interação na tela. O mapa completo e a seta indicam os objetivos.
- Responda às decisões e leia as explicações. Uma resposta incorreta permite tentar novamente, sem tirar vida. Acertar restaura um pouco de vida e Fé.
- Conclua as três decisões e encontre as três chaves nos baús para abrir a arena. Na oração e na colina, siga a ordem indicada.
- Ondas, correntes e calor avisam a área do impacto com **1,8 segundo de antecedência**. Saia da área ou esquive. O perigo pausa durante diálogos, diminui conforme o estudo avança e para de surgir após as três atividades.
- Cada chefe muda sua sequência de ataques ao chegar à metade da vida. Explore as pausas entre os golpes.

As fases oferecem cinco equipamentos temáticos; terminar a semana entrega o **Selo da Misericórdia** uma única vez. Repetir fases continua permitido. O encerramento da quinta fase de Corinto agora mostra **“Essa foi só uma das faces de Satanás. Ele voltará.”**, inclusive com as cenas desativadas.

## Dificuldade e grupo

A escala se aplica aos inimigos das duas semanas. Usa o nível do jogador entre 1 e 40, com ajustes de vida, ataque, defesa, postura e recompensas de combate. O estágio acrescenta 4% de vida e ataque por fase após a primeira. Equipamentos e habilidades continuam influenciando o resultado.

| Modo | Vida dos inimigos | Ataque dos inimigos | Recompensas de combate |
|---|---:|---:|---:|
| História | ×0,72 | ×0,65 | ×0,80 |
| Jornada | ×1,00 | ×1,00 | ×1,00 |
| Desafio | ×1,30 | ×1,25 | ×1,15 |

Os multiplicadores são aplicados depois da normalização pelo nível original do inimigo. A escala fica fixa ao entrar: subir de nível durante a fase não fortalece inimigos novos. A preferência de dificuldade é salva no personagem; pode ser alterada no portão antes da próxima partida. As recompensas fixas de conclusão de fase permanecem as mesmas.

Em grupo, o líder define nível e modo da partida; participantes de níveis diferentes recebem a mesma escala de inimigos. As decisões são compartilhadas e reaplicadas por snapshots para recuperar atualizações perdidas. Mensagens de decisões de outra partida são ignoradas. A sincronização utiliza o sistema de grupo já existente.

## Arte e arquivos

Os cinco sprites são renderizados e animados em Canvas por `src/game/jonas-art.js`, integrados ao renderizador de chefes. Veja a [prancha dos chefes](../art/jonas-chefes.png), gerada com os mesmos renderizadores usados no jogo. Há cinco paletas de cenário novas e cenas para a abertura, fases, chefes e encerramento.

As cenas novas usam legendas e, quando habilitada e disponível, a voz em português do navegador. Não incluem novas gravações MP3; cenas cujo texto mudou também seguem esse modo para evitar áudio antigo incompatível.

- `src/content/semana-02.js`: mapas, estudo, decisões, quiz e definições dos chefes.
- `src/content/cinematicas-jonas.js`: cenas da campanha.
- `src/game/jonas-dungeon.js`: interações, objetivos, perigos e decoração.
- `src/game/dungeon-scaling.js`: escala e acesso às fases.
- `src/game/grupo.js` e `src/game/mundoNet.js`: partida e estudo compartilhados.

## Validação

```bash
npm test
npm run build
npm run dev -- --host 0.0.0.0
# Em outro terminal, com Playwright e /usr/bin/chromium disponíveis:
node tests/jonas-browser.cjs
node tests/jonas-group-browser.cjs
node tests/browser-smoke.cjs
```

Os testes unitários verificam conteúdo, conectividade dos cinco mapas antes/depois da porta, acesso independente, escala do nível 1 ao 40 e preservação das definições compartilhadas. A integração percorre as cinco fases com quizzes, decisões, perigos, todos os golpes dos chefes, conclusão, epílogo, estudo, cenas e persistência após recarga. Também verifica a recompensa única e a separação das missões da semana nova.

O teste de grupo usa dois contextos de navegador, um desktop e um celular em paisagem, níveis 3 e 40, com transporte local entre os clientes. Confere leitura por toque, convite do líder, escala comum, objetivos, snapshots e abertura da porta. Não precisa de contas ou dados pessoais. A regressão geral cobre criação, movimento, combate, menus, salvamento e as mecânicas dos chefes anteriores.
