# Painel de acessos e segurança

O painel mostra, em tempo real: quem está online e jogando, visitantes por dia, contas registradas, quem joga sem
conta (anônimo), até onde cada pessoa chegou na jornada, tempo de jogo, aparelhos, de onde vieram (Instagram,
WhatsApp…) e as opiniões que os jogadores mandam de dentro do jogo.

Endereço: **`/painel`** no mesmo site do jogo (ex.: `https://seu-jogo.vercel.app/painel`).
Para ver como fica antes de ligar tudo: **`/painel?demo`** (dados inventados).

## Ligar o painel (uma vez só, uns 5 minutos)

O painel usa o mesmo Supabase das contas do jogo. Sem o Supabase configurado, o jogo funciona offline e não há o que
mostrar no painel.

1. **Supabase configurado no Vercel.** Em Vercel › Project › Settings › Environment Variables devem existir
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Supabase › Project Settings › API). Depois de criar, faça um novo
   deploy.
2. **Rodar o SQL do painel.** No Supabase, abra *SQL Editor › New query*, cole o conteúdo de
   [`supabase/painel.sql`](../supabase/painel.sql) e clique em *Run*. (O `schema.sql` precisa ter sido rodado antes.)
3. **Dizer quem é administrador.** Ainda no SQL Editor, rode, trocando pelo SEU e-mail (o mesmo da conta do jogo):

   ```sql
   insert into public.admins (email) values ('seu-email@exemplo.com') on conflict do nothing;
   ```

4. **Criar a sua conta**, se ainda não tiver: abra o jogo e, na tela de entrada, use a aba *Criar conta* com esse e-mail.
5. Abra `/painel`, entre com o e-mail e a senha. Pronto.

Para dar acesso a mais alguém, repita o passo 3 com o e-mail da pessoa. Para tirar:
`delete from public.admins where email = 'email@exemplo.com';`

## O que é coletado (e o que não é)

- Um **código aleatório por aparelho** (não é nome, nem e-mail, nem IP).
- Tipo de aparelho, sistema e navegador; tamanho da tela; site de onde a pessoa veio.
- No jogo: nome e classe do personagem, nível, área em que está, fases e chefes vencidos, tempo de jogo.
- **Marcos** da jornada, uma vez cada: criou personagem, terminou o tutorial, pegou o mapa, cada fase, cada chefe,
  Getsêmani, Vale da Mentira, descida do Espírito, Sardes, luz de Sardes, deu opinião.
- Quem tem conta aparece com o e-mail da conta; quem joga sem conta aparece como **anônimo**.
- Nada de senhas, mensagens do chat ou conteúdo pessoal.

O jogador pode desligar o envio em **☰ › Ajustes › 📊 Enviar dados de uso**. Ninguém consegue ler esses dados pela
internet: a tabela só aceita gravar, e a leitura passa por uma função que confere se você está na lista de admins.
Há um limite de envios por aparelho (contra enxurradas).

## Opiniões

Em **☰ › Ajustes › 💬 Dar minha opinião** (e num convite que aparece uma vez, ao terminar a primeira página), o
jogador dá de 1 a 5 estrelas e escreve o que achou. Aparece no painel em "O que estão achando".

## Segurança da versão publicada

- O estado do jogo não fica mais exposto no console do navegador (antes dava para trapacear por ali).
- Botão direito, seleção de texto, arrastar imagens e os atalhos de ferramentas de desenvolvedor / ver código-fonte
  ficam desativados no jogo publicado. O console mostra um aviso contra golpes do tipo "cole isto aqui".
- O código publicado vai minificado, sem mapas de código-fonte e sem `console.log`.
- Cabeçalhos de segurança no Vercel (`vercel.json`): política de conteúdo (bloqueia scripts injetados), proibição de
  embutir o jogo em sites de terceiros, HTTPS obrigatório e outros.

Importante: nada que roda no navegador é 100% inviolável; quem insiste sempre consegue ler o que o navegador recebe.
O que protege de verdade são as regras do servidor (Supabase): cada pessoa só altera os próprios personagens, os
pontos passam por checagem e os dados do painel só saem para administradores.
