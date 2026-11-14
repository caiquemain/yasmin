'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTour } from '@/components/ui/PageTour';

export function PendenciasClient({ demandas, escritorios }: { demandas: any[], escritorios: any[] }) {
  const supabase = createClient();
  const [filtroEscritorio, setFiltroEscritorio] = useState('todos');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const demandasFiltradas = demandas.filter(d => filtroEscritorio === 'todos' ? true : d.escritorio_id === filtroEscritorio);
  const porObra: Record<string, any[]> = {};
  demandasFiltradas.forEach(d => {
    const chave = d.obras?.nome || 'Sem obra vinculada';
    if (!porObra[chave]) porObra[chave] = [];
    porObra[chave].push(d);
  });

  const desbloquear = async (id: string) => {
    setLoadingId(id);
    await supabase.from('demandas').update({ status: 'a_fazer' }).eq('id', id);
    window.location.reload();
  };

  const tourSteps = [
    { element: 'body', popover: { title: 'Pendências', description: 'Aqui ficam todas as tarefas que estão travadas esperando terceiros.' } },
    ...(escritorios.length > 1 ? [{ element: '[data-tour="pend-filtro"]', popover: { title: 'Filtro', description: 'Se você trabalha para vários escritórios, pode filtrar o que é de cada um aqui.', side: 'bottom' as const, align: 'start' as const } }] : []),
    { element: '[data-tour="pend-lista"]', popover: { title: 'Bloqueadas', description: 'O app mostra há quanto tempo a tarefa está parada. Quando o terceiro resolver, clique em Desbloquear.', side: 'top' as const, align: 'start' as const } }
  ];

  return (
    <div className="space-y-8">
      <PageTour storageKey="tour_pendencias_v1" steps={tourSteps} />

      {escritorios.length > 1 && (
        <div data-tour="pend-filtro" className="flex items-center gap-3">
          <span className="label-mono">Filtrar por escritório:</span>
          <select value={filtroEscritorio} onChange={e => setFiltroEscritorio(e.target.value)} className="font-mono text-2xs uppercase tracking-[0.1em] bg-transparent border border-line-strong dark:border-dark-line px-2 py-1 text-petrol-deep dark:text-petrol focus:outline-none focus:border-petrol">
            <option value="todos">Todos</option>
            {escritorios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
      )}

      <div data-tour="pend-lista">
        {demandasFiltradas.length === 0 ? (
          <div className="p-10 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface text-center">
            <p className="label-mono text-ink-faint dark:text-dark-inkSoft">Tudo em dia. Nenhuma pendência bloqueada!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(porObra).map(([obraNome, items]) => (
              <div key={obraNome} className="space-y-4">
                <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol border-b border-line dark:border-dark-line pb-2">{obraNome}</h2>
                <div className="space-y-3">
                  {items.map(item => {
                    const dias = formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true });
                    return (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface dark:bg-dark-surface border-l-4 border-amber">
                        <div>
                          <h3 className="text-[15px] font-medium leading-tight mb-1 text-ink dark:text-dark-ink">{item.titulo}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {item.categorias && <span className="label-mono" style={{ color: item.categorias.cor }}>{item.categorias.nome}</span>}
                            {item.escritorios && <span className="label-mono text-ink-soft dark:text-dark-inkSoft">{item.escritorios.nome}</span>}
                            <span className="label-mono text-terra font-bold">Bloqueado {dias}</span>
                          </div>
                          {item.descricao && <p className="text-sm text-ink-soft dark:text-dark-inkSoft mt-2 line-clamp-2">{item.descricao}</p>}
                        </div>
                        <button onClick={() => desbloquear(item.id)} disabled={loadingId === item.id} className="flex-shrink-0 px-4 py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition disabled:opacity-50 text-ink dark:text-dark-ink">
                          {loadingId === item.id ? 'Desbloqueando...' : 'Desbloquear'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
