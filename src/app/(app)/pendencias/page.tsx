import { createClient } from '@/lib/supabase/server';
import { PendenciasClient } from '@/components/pendencias/PendenciasClient';

export const dynamic = 'force-dynamic';

export default async function PendenciasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Busca todas as demandas bloqueadas
  const { data: demandas } = await supabase
    .from('demandas')
    .select('*, escritorios(nome), obras(nome), categorias(nome, cor)')
    .eq('status', 'aguardando_terceiros')
    .order('created_at', { ascending: true });

  // Busca os escritórios para o filtro no topo
  const { data: escritorios } = await supabase
    .from('escritorios')
    .select('id, nome')
    .eq('arquivado', false)
    .order('ordem');

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-petrol-deep dark:text-petrol mb-2">Pendências</h1>
        <p className="label-mono">O que está travado esperando terceiros</p>
      </header>

      <PendenciasClient 
        demandas={demandas ?? []} 
        escritorios={escritorios ?? []} 
      />
    </div>
  );
}
