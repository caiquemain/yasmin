create extension if not exists "pgcrypto";

-- ============ tipos ============
create type cliente_tipo        as enum ('arquiteto','construtora','cliente_final');
create type tipologia           as enum ('concreto_armado','estrutura_metalica','alvenaria_estrutural','fundacao','contencao','reforco_estrutural');
create type status_obra         as enum ('orcamento','concepcao','calculo','detalhamento','aguardando_arquitetura','entregue','execucao');
create type art_status          as enum ('nao_emitida','emitida','paga');
create type parcela_status      as enum ('pendente','pago');
create type demanda_tipo        as enum ('tarefa','compromisso');
create type demanda_status      as enum ('a_fazer','em_andamento','aguardando_terceiros','concluida');
create type demanda_prioridade  as enum ('baixa','media','alta');
create type demanda_recorrencia as enum ('none','daily','weekly','monthly');

-- ============ profiles ============
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  avatar_cor text default '#1A4A5C',
  created_at timestamptz default now()
);

-- ============ escritórios ============
create table public.escritorios (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  ordem      integer not null default 0,
  arquivado  boolean not null default false,
  created_at timestamptz default now()
);
create index on public.escritorios(user_id);

-- ============ clientes ============
create table public.clientes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  escritorio_id  uuid references public.escritorios(id) on delete set null,
  nome           text not null,
  tipo           cliente_tipo not null,
  contato        text,
  obs            text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index on public.clientes(user_id);
create index on public.clientes(escritorio_id);

-- ============ obras ============
create table public.obras (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  cliente_id          uuid not null references public.clientes(id) on delete cascade,
  nome                text not null,
  area_m2             numeric(10,2),
  link_nuvem          text,
  tipologias          tipologia[] not null default '{}',
  status_obra         status_obra not null default 'orcamento',
  premissa_fck        integer check (premissa_fck in (20,25,30,35,40)),
  premissa_caa        text check (premissa_caa in ('I','II','III','IV')),
  premissa_sigma_solo numeric(10,2),
  premissa_cobrimento integer,
  premissa_outras     text,
  art_numero          text,
  art_status          art_status default 'nao_emitida',
  honorarios_total    numeric(12,2),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index on public.obras(user_id);
create index on public.obras(cliente_id);

-- ============ parcelas ============
create table public.obra_parcelas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  obra_id       uuid not null references public.obras(id) on delete cascade,
  descricao     text not null,
  valor         numeric(12,2) not null,
  status        parcela_status not null default 'pendente',
  data_prevista date,
  data_pago     date,
  ordem         integer not null default 0
);
create index on public.obra_parcelas(obra_id);

-- ============ checklist ============
create table public.obra_checklist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  obra_id      uuid not null references public.obras(id) on delete cascade,
  ordem        integer not null,
  titulo       text not null,
  concluido    boolean not null default false,
  concluido_em timestamptz
);
create index on public.obra_checklist(obra_id);

-- ============ categorias ============
create table public.categorias (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome    text not null,
  cor     text not null default '#6B6154',
  ordem   integer not null default 0
);
create index on public.categorias(user_id);

-- ============ demandas ============
create table public.demandas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  escritorio_id  uuid references public.escritorios(id) on delete set null,
  tipo           demanda_tipo not null,
  titulo         text not null,
  descricao      text,
  categoria_id   uuid references public.categorias(id) on delete set null,
  prioridade     demanda_prioridade not null default 'media',
  status         demanda_status not null default 'a_fazer',
  cliente_id     uuid references public.clientes(id) on delete set null,
  obra_id        uuid references public.obras(id) on delete set null,
  revisao        text,
  data           date not null,
  hora_inicio    time,
  hora_fim       time,
  lembrete_ativo boolean default false,
  lembrete_em    timestamptz,
  recorrencia    demanda_recorrencia default 'none',
  parent_id      uuid references public.demandas(id) on delete set null,
  concluida_em   timestamptz,
  created_at     timestamptz default now()
);
create index on public.demandas(user_id, data);
create index on public.demandas(obra_id);
create index on public.demandas(escritorio_id);
create index on public.demandas(status);
