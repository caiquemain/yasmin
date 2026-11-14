import { createClient } from '@/lib/supabase/server';
import { Greeting } from '@/components/home/Greeting';
import { Resumo } from '@/components/home/Resumo';
import { ListaHoje } from '@/components/home/ListaHoje';
import { Bloqueadas } from '@/components/home/Bloqueadas';
import { GradeObras } from '@/components/home/GradeObras';
import { EmptyStateObras } from '@/components/home/EmptyStateObras';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ esc?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { esc } = await searchParams;

  const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user!.id).single();
  const today = new Date().toLocaleDateString('sv-SE');

  let qHoje = supabase.from('demandas').select('id,tipo,titulo,status,prioridade,hora_inicio,revisao,categorias(nome,cor),escritorios(nome)').eq('data', today).neq('status', 'concluida').order('hora_inicio', { nullsFirst: false });
  if (esc) qHoje = qHoje.eq('escritorio_id', esc);

  let qBloq = supabase.from('demandas').select('id,titulo,created_at,obras(nome)').eq('status', 'aguardando_terceiros').order('created_at');
  if (esc) qBloq = qBloq.eq('escritorio_id', esc);

  let qObras = supabase.from('obras').select('id,nome,status_obra,art_status,clientes!inner(escritorio_id,escritorios(nome)),obra_checklist(concluido)').neq('status_obra', 'entregue').order('updated_at', { ascending: false }).limit(6);
  if (esc) qObras = qObras.eq('clientes.escritorio_id', esc);

  const [{ data: hoje }, { data: bloqueadas }, { data: obras }] = await Promise.all([qHoje, qBloq, qObras]);

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <Greeting nome={profile?.nome ?? 'Yasmin'} />
      <Resumo obras={obras?.length ?? 0} bloqueadas={bloqueadas?.length ?? 0} tarefas={hoje?.length ?? 0} />
      <ListaHoje items={hoje ?? []} />
      <Bloqueadas items={bloqueadas ?? []} />
      
      {(!obras || obras.length === 0) && !esc ? (
        <section>
          <h2 className="label-mono border-b border-line dark:border-dark-line pb-2 mb-0 !tracking-[0.14em]">Obras em andamento</h2>
          <EmptyStateObras />
        </section>
      ) : (
        <GradeObras obras={obras ?? []} />
      )}
    </div>
  );
}
