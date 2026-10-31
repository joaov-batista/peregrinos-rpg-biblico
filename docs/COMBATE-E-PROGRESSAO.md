# Combate e progressão

A campanha agora exige mais experiência por nível (85 × nível^1,62), com crescimento menor de ataque e defesa. Os vícios têm mais vida e ataque e causam dano ao contato. Alvos de missões de combate ativas acompanham parte do nível do jogador, com limite de +80%; recompensas não aumentam com esse ajuste. Equipamentos continuam úteis: a defesa conserva um piso de 25% de dano recebido e golpes individuais não removem mais de 2,5% da vida máxima de um chefe. Consumíveis têm intervalo de três segundos.

## Missões

O menu **Missões** mostra sete etapas: Preguiça → Desânimo → Guarda dos Muros → Medo → Golias → Beemote → Leviatã. Cada etapa mostra seu nível recomendado, uma dica e o NPC responsável. Entregar a missão anterior libera a próxima; missões já iniciadas em saves antigos continuam válidas. Missões difíceis paralelas também têm pré-requisitos. Nível recomendado é orientação, não uma garantia de vitória.

## Chefes e respostas

- **Mamom:** anéis de moedas e rajadas direcionadas mais fortes. Morrer por um golpe dele, inclusive projéteis, perde todos os denários carregados.
- **Procrastinação e Preguiça:** círculo de sono com 1,2s de aviso, seguido de cinco ajudantes. Saia da área ou esquive no impacto. O primeiro dano posterior acorda o personagem. Invocações não rendem XP, moedas nem progresso de abates.
- **Mentira:** até seis cópias, leques mais densos, trocas de posição e impactos marcados. Acerte as cópias para limpar a arena.
- **Imoralidade:** encanto evitável no impacto; esquivar quebra a atração. Ser puxado até ela causa dano elevado. Há um leque novo para pressionar a distância.
- **Satanás:** rajadas prolongadas, invocações, ondas de choque e três estágios de combate, além das acusações bíblicas.
- **Golias:** três estocadas desde o início, rochedos com aviso de queda e urro “AU!” com empurrão. Mesmo exposto, recebe apenas parte do dano; a funda preserva sua vantagem.
- **Beemote:** carcaça absorve 94% do dano antes da defesa. Oito impactos pesados/defesas perfeitas abrem uma janela de seis segundos. A prisão de pedras dura seis segundos e tem uma abertura. O terremoto imobiliza quem não esquiva e emenda uma investida de chifre; ainda é possível defender quando imobilizado. Reaparece em 75s.
- **Leviatã:** imune a armas e habilidades comuns. Só jatos devolvidos pela defesa perfeita e lanças temporárias causam dano. Nada durante os ataques e faz desvios laterais com intervalo de recuperação. Reaparece em 60s.

## Expedição marítima

Com **O monstro do mar** ou **Quem pode com o Leviatã?** ativa, aproxime-se da água. Provisões de três lanças surgem na margem a cada 25s e ficam disponíveis por 18s. **E/interagir** coleta; as lanças duram 45s e **K/especial** arremessa, temporariamente substituindo a habilidade da classe. O indicador acima do personagem mostra quantidade e tempo restante.

**E/interagir** também permite embarcar na margem. Use o movimento e a esquiva normais. Um golpe não evitado do Leviatã vira o barco; o nado fica em 25% da velocidade normal e um novo golpe dele na água é fatal sem defesa/esquiva. Volte à margem para embarcar novamente após o intervalo de recuperação. O barco e as lanças são recursos temporários, não itens permanentes do inventário.

## Segredos

Cada uma das cinco fases tem uma inscrição discreta junto a um baú. Investigue com a interação normal. Encontrar três inscrições diferentes conclui **Ecos esquecidos** e revela o **Selo da Vigília**; encontrar cinco conclui **As cinco luzes** e revela as **Sandálias do Caminho Oculto**. A recompensa é automática e cada inscrição conta uma única vez por personagem.

## Validação

- `npm test`: sete testes de regras, limites de dano, carcaça, sono, prisão, progressão e respawn.
- `npm run build`: compilação de produção.
- Com Vite iniciado e Playwright disponível: `node tests/browser-smoke.cjs`. Usa Chromium em `/usr/bin/chromium` (Playwright pode vir do runtime via NODE_PATH). Testa criação, movimento, ataque, menus, salvamento, mecânicas novas, as cinco inscrições e a execução/renderização de todos os ataques. Cria um contexto descartável sem usar saves pessoais.

Os eventos de rede de dano, carcaça, clones, prisão e estados novos foram adaptados. A validação local inclui aplicação de golpes remotos, mas não substitui uma partida real com múltiplos clientes Supabase. A dificuldade de uma campanha completa ainda precisa de testes de jogo com diferentes classes e equipamentos.

## Cavalo para dois jogadores

No mundo online, um cavalo comporta **um condutor e um passageiro**. Aproxime-se de alguém montado em um cavalo, interaja para abrir o cartão do jogador e escolha **Pedir carona**. O dono confirma em **Levar passageiro**. Burrinhos continuam individuais.

O dono conduz; o passageiro acompanha o cavalo e aparece sentado atrás. **R**, o botão de montaria ou **Interagir** permitem ao passageiro descer. Para combater, ele precisa descer. Desmontar, cair da montaria, morrer, guardar/trocar o cavalo, mudar de área ou perder a conexão encerra a carona. Pedidos e reservas expiram; o segundo assento não aceita dois passageiros simultaneamente. A carona não é salva entre sessões.

`npm test` inclui os testes do protocolo de carona. `node tests/horse-browser.cjs`, com Vite e Playwright disponíveis, abre dois clientes locais e testa os botões, movimento, desembarque, reembarque e queda. Esse teste usa transporte simulado entre navegadores; não depende de credenciais Supabase.
