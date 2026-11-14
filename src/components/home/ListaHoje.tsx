'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';

const prioClass: Record<string, string> = { alta: 'text-terra', media: 'text-ink-soft dark:text-dark-inkSoft', baixa: 'text-ink-faint dark:text-dark-inkSoft' };

export function ListaHoje({ items }: { items: any[] }) {
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string, parentId: string | null) => {
    if (parentId) {
      const confirmDelete = confirm("Esta tarefa faz parte de uma série recorrente. Deseja excluir TODAS as tarefas futuras desta série?");
      if (confirmDelete) {
        setLoading(id);
        await supabase.from('demandas').delete().eq('parent_id', parentId);
        window.location.reload();
      } else {
        setLoading(id);
        await supabase.from('demandas').delete().eq('id', id);
        window.location.reload();
      }
    } else {
      if (!confirm("Excluir esta tarefa?")) return;
      setLoading(id);
      await supabase.from('demandas').delete().eq('id', id);
      window.location.reload();
    }
  };

  return (
    <section className="mb-9">
      <h2 className="label-mono border-b border-line dark:border-dark-line pb-2 mb-3 !tracking-[0.14em]">Hoje</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft py-4">nada hoje.</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li key={t.id} className="grid grid-cols-[56px_1fr_auto_auto] gap-3 items-center py-3 border-b border-dotted border-line dark:border-dark-line last:border-0 group">
              <span className="font-mono text-[12px] text-petrol">{t.hora_inicio?.slice(0, 5) ?? '—'}</span>
              <span className="text-[14.5px] text-ink dark:text-dark-ink">{t.titulo}</span>
              <span className="label-mono truncate max-w-[160px] hidden md:block">
                {t.escritorios?.nome && <span className="text-petrol">{t.escritorios.nome} · </span>}
                {t.categorias?.nome ?? ''}{t.revisao ? ` · ${t.revisao}` : ''}
              </span>
              <div className="flex items-center gap-2 justify-end">
                <span className={`font-mono text-[10px] uppercase tracking-wider ${prioClass[t.prioridade]}`}>{t.prioridade === 'media' ? '—' : t.prioridade}</span>
                <button onClick={() => handleDelete(t.id, t.parent_id)} disabled={loading === t.id} className="text-ink-faint hover:text-terra opacity-0 group-hover:opacity-100 transition ml-2">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
