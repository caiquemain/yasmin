-- ============ trigger de novo usuário ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));

  insert into public.categorias (user_id, nome, cor, ordem) values
    (new.id, 'Obras/Projetos',    '#1A4A5C', 0),
    (new.id, 'Faculdade/Estudos', '#5A6B3F', 1),
    (new.id, 'Conteúdo',          '#9A7424', 2),
    (new.id, 'Pessoal',           '#6B6154', 3);

  insert into public.escritorios (user_id, nome, ordem)
    values (new.id, 'Meu escritório', 0);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ checklist padrão (7 etapas) ============
create or replace function public.gerar_checklist_padrao(p_obra_id uuid)
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if not exists (select 1 from public.obras where id = p_obra_id and user_id = v_user) then
    raise exception 'obra não encontrada';
  end if;
  if exists (select 1 from public.obra_checklist where obra_id = p_obra_id) then
    return;
  end if;
  insert into public.obra_checklist (user_id, obra_id, ordem, titulo) values
    (v_user, p_obra_id, 1, 'Recebimento e compatibilização da Arquitetura'),
    (v_user, p_obra_id, 2, 'Lançamento da estrutura e pré-dimensionamento'),
    (v_user, p_obra_id, 3, 'Análise de esforços e estabilidade global'),
    (v_user, p_obra_id, 4, 'Dimensionamento (Fundações, Pilares, Vigas, Lajes)'),
    (v_user, p_obra_id, 5, 'Geração de pranchas de forma e armação'),
    (v_user, p_obra_id, 6, 'Emissão de Memorial Descritivo / Memória de Cálculo'),
    (v_user, p_obra_id, 7, 'Emissão e pagamento de ART');
end $$;

-- ============ herda escritório da obra/cliente ============
create or replace function public.demanda_herda_escritorio()
returns trigger language plpgsql security definer as $$
declare v_esc uuid;
begin
  if new.escritorio_id is null then
    if new.obra_id is not null then
      select c.escritorio_id into v_esc
      from public.obras o
      join public.clientes c on c.id = o.cliente_id
      where o.id = new.obra_id;
    elsif new.cliente_id is not null then
      select escritorio_id into v_esc from public.clientes where id = new.cliente_id;
    end if;
    new.escritorio_id := v_esc;
  end if;
  return new;
end $$;

create trigger trg_demanda_escritorio
  before insert or update of obra_id, cliente_id, escritorio_id on public.demandas
  for each row execute function public.demanda_herda_escritorio();

-- ============ seed de exemplo ============
create or replace function public.seed_exemplo()
returns void language plpgsql security definer as $$
declare
  v_user    uuid := auth.uid();
  v_esc     uuid;
  v_cliente uuid;
  v_obra    uuid;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.obras where user_id = v_user) then return; end if;

  select id into v_esc from public.escritorios where user_id = v_user order by ordem limit 1;
  if v_esc is null then
    insert into public.escritorios (user_id, nome) values (v_user, 'Meu escritório') returning id into v_esc;
  end if;

  insert into public.clientes (user_id, escritorio_id, nome, tipo)
    values (v_user, v_esc, 'Cliente Exemplo', 'arquiteto') returning id into v_cliente;

  insert into public.obras (user_id, cliente_id, nome, area_m2, tipologias, status_obra, honorarios_total)
    values (v_user, v_cliente, 'Edifício Exemplo', 1200, '{concreto_armado}', 'calculo', 15000)
    returning id into v_obra;

  perform public.gerar_checklist_padrao(v_obra);

  insert into public.obra_parcelas (user_id, obra_id, descricao, valor, ordem) values
    (v_user, v_obra, 'Entrada', 5000, 0),
    (v_user, v_obra, 'Entrega de formas', 5000, 1),
    (v_user, v_obra, 'Entrega de armações', 5000, 2);
end $$;
