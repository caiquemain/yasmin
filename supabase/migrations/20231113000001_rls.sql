alter table public.profiles       enable row level security;
alter table public.escritorios    enable row level security;
alter table public.clientes       enable row level security;
alter table public.obras          enable row level security;
alter table public.obra_parcelas  enable row level security;
alter table public.obra_checklist enable row level security;
alter table public.categorias     enable row level security;
alter table public.demandas       enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own escritorios"    on public.escritorios    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own clientes"       on public.clientes       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own obras"          on public.obras          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own parcelas"       on public.obra_parcelas  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own checklist"      on public.obra_checklist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own categorias"     on public.categorias     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own demandas"       on public.demandas       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
