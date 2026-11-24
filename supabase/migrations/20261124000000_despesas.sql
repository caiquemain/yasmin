-- ============ despesas / pagamentos realizados ============
create table if not exists public.despesas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  escritorio_id   uuid references public.escritorios(id) on delete set null,
  obra_id         uuid references public.obras(id) on delete set null,
  descricao       text not null,
  fornecedor      text,
  categoria       text not null default 'Software / Assinatura',
  valor           numeric(12,2) not null,
  status          parcela_status not null default 'pendente',
  data_vencimento date not null,
  data_pago       date,
  recorrencia     demanda_recorrencia not null default 'none',
  parent_id       uuid,
  observacoes     text,
  created_at      timestamptz default now()
);

create index if not exists despesas_user_id_idx on public.despesas(user_id);
create index if not exists despesas_data_vencimento_idx on public.despesas(data_vencimento);
create index if not exists despesas_status_idx on public.despesas(status);

alter table public.despesas enable row level security;

drop policy if exists "own despesas" on public.despesas;
create policy "own despesas" on public.despesas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
