-- PEREGRINOS — painel de acessos (telemetria de uso e opiniões dos jogadores)
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run (depois do schema.sql).
-- Depois, no fim deste arquivo, coloque o SEU e-mail na lista de administradores (só quem está lá vê o painel).
--
-- O que é guardado: um identificador aleatório do aparelho (não é nome nem e-mail), o tipo de aparelho, a área do jogo
-- em que a pessoa está, nível, classe, tempo de jogo e os marcos alcançados (fases, chefes, Getsêmani, Sardes...).
-- Quem tem conta aparece ligado ao e-mail da conta; quem joga sem conta aparece como anônimo.
-- O próprio jogo deixa desligar o envio em ☰ › Ajustes.

-- ------------------------------------------------------------
-- 1. Eventos de uso
-- ------------------------------------------------------------
create table if not exists public.telemetria (
  id         bigint generated always as identity primary key,
  visitante  text not null check (char_length(visitante) between 8 and 64),
  user_id    uuid references auth.users(id) on delete set null default auth.uid(),
  tipo       text not null check (tipo in ('visita', 'inicio', 'pulso', 'marco', 'saida')),
  dados      jsonb not null default '{}' check (pg_column_size(dados) < 4000),
  criado     timestamptz not null default now()
);
create index if not exists telemetria_criado on public.telemetria (criado desc);
create index if not exists telemetria_visitante on public.telemetria (visitante, criado desc);
create index if not exists telemetria_tipo on public.telemetria (tipo, criado desc);

alter table public.telemetria enable row level security;
drop policy if exists "registrar uso" on public.telemetria;
-- qualquer aparelho pode registrar o próprio uso; ninguém lê esta tabela direto (só pelas funções do painel)
create policy "registrar uso" on public.telemetria for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- contra enxurrada: no máximo 40 eventos por aparelho por minuto
create or replace function public.limite_telemetria() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.telemetria where visitante = new.visitante and criado > now() - interval '1 minute') >= 40 then
    raise exception 'muitos eventos';
  end if;
  return new;
end $$;
drop trigger if exists limite_telemetria on public.telemetria;
create trigger limite_telemetria before insert on public.telemetria for each row execute function public.limite_telemetria();

-- ------------------------------------------------------------
-- 2. Opiniões (o que as pessoas estão achando)
-- ------------------------------------------------------------
create table if not exists public.opinioes (
  id         bigint generated always as identity primary key,
  visitante  text not null check (char_length(visitante) between 8 and 64),
  user_id    uuid references auth.users(id) on delete set null default auth.uid(),
  nota       int not null check (nota between 1 and 5),
  texto      text not null default '' check (char_length(texto) <= 1200),
  contexto   jsonb not null default '{}' check (pg_column_size(contexto) < 2000),
  criado     timestamptz not null default now()
);
create index if not exists opinioes_criado on public.opinioes (criado desc);
alter table public.opinioes enable row level security;
drop policy if exists "dar opinião" on public.opinioes;
create policy "dar opinião" on public.opinioes for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create or replace function public.limite_opinioes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.opinioes where visitante = new.visitante and criado > now() - interval '10 minutes') >= 3 then
    raise exception 'calma: já recebemos a sua opinião';
  end if;
  return new;
end $$;
drop trigger if exists limite_opinioes on public.opinioes;
create trigger limite_opinioes before insert on public.opinioes for each row execute function public.limite_opinioes();

-- ------------------------------------------------------------
-- 3. Quem pode ver o painel
-- ------------------------------------------------------------
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security; -- sem políticas: ninguém lê nem escreve por fora

create or replace function public.sou_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
grant execute on function public.sou_admin() to authenticated;

-- ------------------------------------------------------------
-- 4. O painel: tudo numa chamada só, e só para administradores
-- ------------------------------------------------------------
create or replace function public.painel(dias int default 14) returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare r jsonb;
begin
  if not public.sou_admin() then raise exception 'sem acesso'; end if;
  dias := least(greatest(coalesce(dias, 14), 1), 90);
  with
  vis as (select visitante, min(criado) primeiro, max(criado) ultimo, max(user_id::text)::uuid conta from public.telemetria group by visitante),
  ult_pulso as (select distinct on (visitante) visitante, dados, criado from public.telemetria where tipo in ('pulso', 'inicio') order by visitante, criado desc),
  ult_visita as (select distinct on (visitante) visitante, dados from public.telemetria where tipo = 'visita' order by visitante, criado desc),
  tempo as (select visitante, max(coalesce((dados ->> 'seg')::int, 0)) seg from public.telemetria where tipo in ('pulso', 'saida') group by visitante),
  marcos as (select visitante, jsonb_agg(distinct dados ->> 'm') lista from public.telemetria where tipo = 'marco' group by visitante)
  select jsonb_build_object(
    'agora', now(),
    'online', (select count(distinct visitante) from public.telemetria where criado > now() - interval '2 minutes'),
    'jogando', (select count(distinct visitante) from public.telemetria where tipo = 'pulso' and criado > now() - interval '2 minutes' and (dados ->> 'jogando')::boolean),
    'hoje', (select count(distinct visitante) from public.telemetria where criado > date_trunc('day', now())),
    'semana', (select count(distinct visitante) from public.telemetria where criado > now() - interval '7 days'),
    'total', (select count(*) from vis),
    'jogaram', (select count(distinct visitante) from public.telemetria where tipo in ('inicio', 'pulso')),
    'anonimos', (select count(distinct visitante) from public.telemetria t where tipo in ('inicio', 'pulso') and not exists (select 1 from public.telemetria u where u.visitante = t.visitante and u.user_id is not null)),
    'contas', (select count(*) from auth.users),
    'contas_semana', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'personagens', (select count(*) from public.characters),
    'tempo_medio', (select coalesce(round(avg(seg)), 0) from tempo where seg > 0),
    'tempo_total', (select coalesce(sum(seg), 0) from tempo),
    'aparelhos', (select coalesce(jsonb_object_agg(k, n), '{}') from (select coalesce(dados ->> 'disp', '?') k, count(*) n from ult_visita group by 1) a),
    'origens', (select coalesce(jsonb_object_agg(k, n), '{}') from (select coalesce(nullif(dados ->> 'ref', ''), 'direto') k, count(*) n from ult_visita group by 1 order by 2 desc limit 8) a),
    'funil', (select coalesce(jsonb_object_agg(m, n), '{}') from (select dados ->> 'm' m, count(distinct visitante) n from public.telemetria where tipo = 'marco' group by 1) f),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', d::date, 'visitas', (select count(distinct visitante) from public.telemetria where criado >= d and criado < d + interval '1 day'), 'jogaram', (select count(distinct visitante) from public.telemetria where tipo in ('inicio', 'pulso') and criado >= d and criado < d + interval '1 day')) order by d), '[]')
                from generate_series(date_trunc('day', now()) - (dias - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') d),
    'jogadores', (select coalesce(jsonb_agg(j order by (j ->> 'ultimo') desc), '[]') from (
        select jsonb_build_object('visitante', left(v.visitante, 8), 'email', u.email, 'primeiro', v.primeiro, 'ultimo', v.ultimo,
          'online', v.ultimo > now() - interval '2 minutes', 'seg', coalesce(tm.seg, 0), 'jogo', coalesce(p.dados, '{}'), 'aparelho', coalesce(uv.dados, '{}'), 'marcos', coalesce(mc.lista, '[]')) j
        from vis v left join auth.users u on u.id = v.conta left join ult_pulso p on p.visitante = v.visitante left join ult_visita uv on uv.visitante = v.visitante
          left join tempo tm on tm.visitante = v.visitante left join marcos mc on mc.visitante = v.visitante
        order by v.ultimo desc limit 300) x),
    'contas_lista', (select coalesce(jsonb_agg(jsonb_build_object('email', u.email, 'criada', u.created_at, 'ultimo_login', u.last_sign_in_at,
        'personagens', (select coalesce(jsonb_agg(jsonb_build_object('nome', c.name, 'classe', c.class, 'nivel', c.level, 'pontos', c.score, 'atualizado', c.updated_at)), '[]') from public.characters c where c.user_id = u.id))
        order by u.created_at desc), '[]') from (select * from auth.users order by created_at desc limit 300) u),
    'opinioes', (select coalesce(jsonb_agg(jsonb_build_object('nota', o.nota, 'texto', o.texto, 'contexto', o.contexto, 'criado', o.criado, 'email', u.email, 'visitante', left(o.visitante, 8)) order by o.criado desc), '[]')
                 from (select * from public.opinioes order by criado desc limit 200) o left join auth.users u on u.id = o.user_id),
    'nota_media', (select round(avg(nota)::numeric, 2) from public.opinioes)
  ) into r;
  return r;
end $$;
revoke all on function public.painel(int) from public, anon;
grant execute on function public.painel(int) to authenticated;

-- limpeza: eventos de "pulso" com mais de 60 dias somem (os marcos e as visitas ficam). Rode quando quiser.
create or replace function public.limpar_telemetria() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.sou_admin() then raise exception 'sem acesso'; end if;
  delete from public.telemetria where tipo = 'pulso' and criado < now() - interval '60 days';
  get diagnostics n = row_count; return n;
end $$;
grant execute on function public.limpar_telemetria() to authenticated;

-- ------------------------------------------------------------
-- 5. Administradores: troque pelo SEU e-mail (o mesmo da conta que você usa para entrar no jogo) e rode.
-- ------------------------------------------------------------
-- insert into public.admins (email) values ('seu-email@exemplo.com') on conflict do nothing;
