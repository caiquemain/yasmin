'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Trash2, Pencil } from 'lucide-react';
import { openDemandaEditor } from '@/hooks/useEditarDemanda';
import { enqueueAction, hasPendingCreateFor, removeCreateFromQueue } from '@/lib/offline/syncManager';

const prioClass: Record<string, string> = { alta: 'text-terra', media: 'text-ink-soft dark:text-dark-inkSoft', baixa: 'text-ink-faint dark:text-dark-inkSoft' };

export function ListaHoje({ items: initialItems }: { items: any[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleConcluir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLoading(id);

    // Se a tarefa foi criada offline (não está no servidor), remove da fila direto
    if (hasPendingCreateFor(id)) {
      removeCreateFromQueue(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setLoading(null);
      showToast('Tarefa removida (nunca foi sincronizada)');
      return;
    }

    // Atualização otimista na tela
    setItems(prev => prev.filter(i => i.id !== id));

    if (!navigator.onLine) {
      enqueueAction({ type: 'complete_demanda', payload: { demandaId: id } });
      setLoading(null);
      showToast('Concluída offline. Será sincronizada ao reconectar.');
      return;
    }

    const { error } = await supabase
      .from('demandas')
      .update({ status: 'concluida', concluida_em: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      // Reverte em caso de erro
      setItems(initialItems);
      showToast('Erro ao concluir. Tente novamente.');
    }
    setLoading(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, parentId: string | null) => {
    e.stopPropagation();

    const msg = parentId
      ? 'Esta tarefa faz parte de uma série. Excluir TODAS as futuras?'
      : 'Excluir esta tarefa?';
    if (!confirm(msg)) return;

    const deleteAll = parentId ? confirm('Confirmar exclusão de TODA a série?') : true;
    setLoading(id);

    // Se foi criada offline, remove da fila (nunca chegou ao servidor)
    if (hasPendingCreateFor(id)) {
      removeCreateFromQueue(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setLoading(null);
      showToast('Tarefa removida (nunca foi sincronizada)');
      return;
    }

    // Otimista: remove da tela
    setItems(prev => prev.filter(i => i.id !== id));

    if (!navigator.onLine) {
      enqueueAction({
        type: 'delete_demanda',
        payload: { demandaId: id, parentId: deleteAll ? parentId : null }
      });
      setLoading(null);
      showToast('Excluída offline. Será sincronizada ao reconectar.');
      return;
    }

    const query = deleteAll && parentId
      ? supabase.from('demandas').delete().eq('parent_id', parentId)
      : supabase.from('demandas').delete().eq('id', id);
    const { error } = await query;

    if (error) {
      setItems(initialItems);
      showToast('Erro ao excluir. Tente novamente.');
    }
    setLoading(null);
  };

  return (
    <section className="mb-9 relative">
      <h2 className="label-mono border-b border-line dark:border-dark-line pb-2 mb-3 !tracking-[0.14em]">Hoje</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft py-4">nada hoje.</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[32px_56px_1fr_auto_auto] gap-3 items-center py-3 border-b border-dotted border-line dark:border-dark-line last:border-0 group hover:bg-surface/50 dark:hover:bg-dark-surface/50 transition cursor-pointer"
              onClick={() => openDemandaEditor(t.id)}
            >
              <button
                onClick={(e) => handleConcluir(e, t.id)}
                disabled={loading === t.id}
                className="w-5 h-5 border border-line-strong dark:border-dark-line flex items-center justify-center hover:border-petrol hover:bg-petrol/10 transition disabled:opacity-50"
                title="Marcar como concluída"
              >
                <Check size={12} className="text-petrol opacity-0 hover:opacity-100 transition" strokeWidth={3} />
              </button>

              <span className="font-mono text-[12px] text-petrol">{t.hora_inicio?.slice(0, 5) ?? '—'}</span>
              <span className="text-[14.5px] text-ink dark:text-dark-ink">{t.titulo}</span>
              <span className="label-mono truncate max-w-[160px] hidden md:block">
                {t.escritorios?.nome && <span className="text-petrol">{t.escritorios.nome} · </span>}
                {t.categorias?.nome ?? ''}{t.revisao ? ` · ${t.revisao}` : ''}
              </span>
              <div className="flex items-center gap-2 justify-end">
                <span className={`font-mono text-[10px] uppercase tracking-wider ${prioClass[t.prioridade]}`}>{t.prioridade === 'media' ? '—' : t.prioridade}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); openDemandaEditor(t.id); }}
                  className="text-ink-faint hover:text-petrol opacity-0 group-hover:opacity-100 transition ml-1"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, t.id, t.parent_id)}
                  disabled={loading === t.id}
                  className="text-ink-faint hover:text-terra opacity-0 group-hover:opacity-100 transition"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Toast flutuante de feedback */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-amber text-bg px-4 py-2 text-xs font-mono uppercase tracking-wider shadow-lg animate-in slide-in-from-bottom fade-in">
          {toast}
        </div>
      )}
    </section>
  );
}
