import { createClient } from '@/lib/supabase/server';
import { HistoricoClient } from '@/components/historico/HistoricoClient';

export const dynamic = 'force-dynamic';

export default async function HistoricoPage() {
  const supabase = await createClient();

  const [{ data: concluidas }, { data: escritorios }, { data: categorias }] = await Promise.all([
    supabase
      .from('demandas')
      .select('id, parent_id, tipo, titulo, descricao, status, prioridade, data, hora_inicio, revisao, concluida_em, escritorio_id, categoria_id, obra_id, categorias(nome, cor), escritorios(nome), obras(nome)')
      .eq('status', 'concluida')
      .order('concluida_em', { ascending: false, nullsFirst: false })
      .order('data', { ascending: false })
      .limit(500),
    supabase
      .from('escritorios')
      .select('id, nome')
      .eq('arquivado', false)
      .order('ordem'),
    supabase
      .from('categorias')
      .select('id, nome, cor')
      .order('ordem'),
  ]);

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-petrol-deep dark:text-petrol mb-2">Histórico</h1>
        <p className="label-mono">Todas as tarefas e compromissos concluídos</p>
      </header>

      <HistoricoClient
        initialDemandas={concluidas ?? []}
        escritorios={escritorios ?? []}
        categorias={categorias ?? []}
      />
    </div>
  );
}
