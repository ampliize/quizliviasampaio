-- Mini CRM do quiz A-Livia-ndo.
-- Rode este arquivo uma vez no SQL Editor do projeto Supabase da Lívia.
-- Ninguém acessa as tabelas pelo navegador: só o servidor do site (service role) grava e lê.

create table if not exists public.quiz_sessoes (
  id               uuid primary key,
  criado_em        timestamptz not null default now(),
  ultima_atividade timestamptz not null default now(),
  -- etapa mais longe que a pessoa chegou (ver ordem em quiz_etapa_ordem)
  etapa            text not null default 'capa',
  etapa_ordem      int  not null default 0,
  -- pergunta em que ela estava da última vez (ex.: 12 de 29)
  pergunta         int,
  total_perguntas  int,
  nome             text,
  email            text,
  whatsapp         text,
  consentimento    boolean not null default false,
  momento          text,
  perfil           text,
  complementar     text,
  placar           jsonb,
  qualificadoras   jsonb,
  cuidado          boolean not null default false,
  concluido_em     timestamptz,
  baixou_pdf       boolean not null default false,
  clicou_comunidade boolean not null default false,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_content      text,
  mc_id            text,
  dispositivo      text
);

create table if not exists public.quiz_eventos (
  id        bigint generated always as identity primary key,
  sessao_id uuid not null references public.quiz_sessoes(id) on delete cascade,
  criado_em timestamptz not null default now(),
  evento    text not null,
  etapa     text,
  pergunta  int
);

create index if not exists quiz_sessoes_criado_idx on public.quiz_sessoes (criado_em desc);
create index if not exists quiz_eventos_sessao_idx on public.quiz_eventos (sessao_id, criado_em);

alter table public.quiz_sessoes enable row level security;
alter table public.quiz_eventos enable row level security;
-- sem policies: anon e authenticated não leem nem gravam nada.

create or replace function public.quiz_etapa_ordem(p_etapa text)
returns int language sql immutable as $$
  select coalesce(array_position(
    array['capa','momento','A','B','C','D','E','qualificadoras','cuidado','contato','resultado'],
    p_etapa) - 1, 0)
$$;

-- Registra um evento e atualiza a sessão. A etapa só avança (voltar no quiz não "desfaz" progresso).
create or replace function public.quiz_registrar(p_sessao uuid, p_evento text, p_dados jsonb default '{}'::jsonb)
returns void language plpgsql as $$
declare
  v_etapa text := nullif(p_dados->>'etapa', '');
  v_ordem int  := public.quiz_etapa_ordem(coalesce(v_etapa, 'capa'));
  v_rastreio jsonb := coalesce(p_dados->'rastreio', '{}'::jsonb);
begin
  insert into public.quiz_sessoes as s (id, etapa, etapa_ordem, utm_source, utm_medium, utm_campaign, utm_content, mc_id, dispositivo)
  values (
    p_sessao, coalesce(v_etapa, 'capa'), v_ordem,
    v_rastreio->>'utm_source', v_rastreio->>'utm_medium', v_rastreio->>'utm_campaign',
    v_rastreio->>'utm_content', v_rastreio->>'mc_id', p_dados->>'dispositivo'
  )
  on conflict (id) do update set
    ultima_atividade = now(),
    etapa       = case when excluded.etapa_ordem > s.etapa_ordem then excluded.etapa else s.etapa end,
    etapa_ordem = greatest(s.etapa_ordem, excluded.etapa_ordem),
    utm_source  = coalesce(s.utm_source, excluded.utm_source),
    utm_medium  = coalesce(s.utm_medium, excluded.utm_medium),
    utm_campaign = coalesce(s.utm_campaign, excluded.utm_campaign),
    utm_content = coalesce(s.utm_content, excluded.utm_content),
    mc_id       = coalesce(s.mc_id, excluded.mc_id);

  if p_dados ? 'pergunta' then
    update public.quiz_sessoes set
      pergunta = (p_dados->>'pergunta')::int,
      total_perguntas = (p_dados->>'total')::int
    where id = p_sessao;
  end if;

  if p_dados ? 'momento' then
    update public.quiz_sessoes set momento = p_dados->>'momento' where id = p_sessao;
  end if;

  if p_evento = 'resultado' then
    update public.quiz_sessoes set
      nome = p_dados->>'nome',
      email = nullif(p_dados->>'email', ''),
      whatsapp = nullif(p_dados->>'whatsapp', ''),
      consentimento = coalesce((p_dados->>'consentimento')::boolean, false),
      perfil = p_dados->>'perfil',
      complementar = p_dados->>'complementar',
      placar = p_dados->'placar',
      qualificadoras = p_dados->'qualificadoras',
      cuidado = coalesce((p_dados->>'cuidado')::boolean, false),
      concluido_em = coalesce(concluido_em, now()),
      etapa = 'resultado',
      etapa_ordem = public.quiz_etapa_ordem('resultado')
    where id = p_sessao;
  elsif p_evento = 'pdf' then
    update public.quiz_sessoes set baixou_pdf = true where id = p_sessao;
  elsif p_evento = 'comunidade' then
    update public.quiz_sessoes set clicou_comunidade = true where id = p_sessao;
  end if;

  insert into public.quiz_eventos (sessao_id, evento, etapa, pergunta)
  values (p_sessao, p_evento, v_etapa, (p_dados->>'pergunta')::int);
end;
$$;

-- Tudo que o painel /crm mostra, num JSON só.
create or replace function public.quiz_painel(p_desde timestamptz default null, p_origem text default null)
returns jsonb language sql stable as $$
  with base as (
    select * from public.quiz_sessoes
    where (p_desde is null or criado_em >= p_desde)
      and (p_origem is null or coalesce(utm_source, '(direto)') = p_origem)
  ),
  etapas as (
    select e, ord - 1 as ordem
    from unnest(array['capa','momento','A','B','C','D','E','qualificadoras','cuidado','contato','resultado']) with ordinality as t(e, ord)
  )
  select jsonb_build_object(
    'funil', (
      select jsonb_agg(jsonb_build_object('etapa', e, 'ordem', ordem,
               'alcancaram', (select count(*) from base where etapa_ordem >= ordem)) order by ordem)
      from etapas
    ),
    'paradas', (
      -- quem não concluiu, agrupado pela etapa mais longe que chegou
      select coalesce(jsonb_agg(jsonb_build_object('etapa', etapa, 'pessoas', n) order by n desc), '[]'::jsonb)
      from (select etapa, count(*) n from base where concluido_em is null group by etapa) x
    ),
    'totais', jsonb_build_object(
      'sessoes', (select count(*) from base),
      'concluiram', (select count(*) from base where concluido_em is not null),
      'com_contato', (select count(*) from base where email is not null or whatsapp is not null),
      'baixaram_pdf', (select count(*) from base where baixou_pdf),
      'clicaram_comunidade', (select count(*) from base where clicou_comunidade)
    ),
    'publico', (
      -- distribuição das respostas de perfil (filhos, renda, prioridade...) de quem concluiu
      select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
      from (
        select k, jsonb_object_agg(val, n) v
        from (
          select q.key k, q.value #>> '{}' val, count(*) n
          from base, jsonb_each(coalesce(base.qualificadoras, '{}'::jsonb)) q
          group by 1, 2
        ) x
        group by k
      ) y
    ),
    'perfis', (
      select coalesce(jsonb_object_agg(perfil, n), '{}'::jsonb)
      from (select perfil, count(*) n from base where perfil is not null group by perfil) x
    ),
    'origens', (
      select coalesce(jsonb_agg(jsonb_build_object('origem', o, 'sessoes', n, 'concluiram', c) order by n desc), '[]'::jsonb)
      from (select coalesce(utm_source, '(direto)') o, count(*) n, count(concluido_em) c
            from public.quiz_sessoes where (p_desde is null or criado_em >= p_desde) group by 1) x
    ),
    'leads', (
      select coalesce(jsonb_agg(to_jsonb(l) order by l.ultima_atividade desc), '[]'::jsonb)
      from (
        select id, criado_em, ultima_atividade, etapa, pergunta, total_perguntas, nome, email, whatsapp,
               consentimento, momento, qualificadoras, perfil, complementar, cuidado, concluido_em, baixou_pdf,
               clicou_comunidade, utm_source, utm_medium, utm_campaign, utm_content, mc_id, dispositivo
        from base order by ultima_atividade desc limit 1000
      ) l
    )
  )
$$;

revoke all on function public.quiz_registrar(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.quiz_painel(timestamptz, text) from public, anon, authenticated;
grant execute on function public.quiz_registrar(uuid, text, jsonb) to service_role;
grant execute on function public.quiz_painel(timestamptz, text) to service_role;
