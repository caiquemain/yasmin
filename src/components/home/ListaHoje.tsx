'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, Trash2, Pencil, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { openDemandaEditor } from '@/hooks/useEditarDemanda';
import { enqueueAction, hasPendingCreateFor, removeCreateFromQueue } from '@/lib/offline/syncManager';

const prioClass: Record<string, string> = { alta: 'text-terra', media: 'text-ink-soft dark:text-dark-inkSoft', baixa: 'text-ink-faint dark:text-dark-inkSoft' };

export function ListaHoje({ items: initialItems, initialConcluidas = [] }: { items: any[]; initialConcluidas?: any[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [concluidas, setConcluidas] = useState(initialConcluidas);
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
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

    const itemAlvo = items.find(i => i.id === id);
    const agoraIso = new Date().toISOString();

    // Atualização otimista: move para concluídas hoje
    setItems(prev => prev.filter(i => i.id !== id));
    if (itemAlvo) {
      setConcluidas(prev => [{ ...itemAlvo, status: 'concluida', concluida_em: agoraIso }, ...prev]);
    }

    if (!navigator.onLine) {
      enqueueAction({ type: 'complete_demanda', payload: { demandaId: id } });
      setLoading(null);
      showToast('Concluída offline. Será sincronizada ao reconectar.');
      return;
    }

    const { error } = await supabase
      .from('demandas')
      .update({ status: 'concluida', concluida_em: agoraIso })
      .eq('id', id);

    if (error) {
      // Reverte em caso de erro
      setItems(initialItems);
      setConcluidas(initialConcluidas);
      showToast('Erro ao concluir. Tente novamente.');
    }
    setLoading(null);
  };

  const handleReabrir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLoading(id);

    const itemAlvo = concluidas.find(i => i.id === id);
    setConcluidas(prev => prev.filter(i => i.id !== id));
    if (itemAlvo) {
      setItems(prev => [...prev, { ...itemAlvo, status: 'a_fazer', concluida_em: null }]);
    }

    const { error } = await supabase
      .from('demandas')
      .update({ status: 'a_fazer', concluida_em: null })
      .eq('id', id);

    if (error) {
      setItems(initialItems);
      setConcluidas(initialConcluidas);
      showToast('Erro ao reabrir. Tente novamente.');
    } else {
      showToast('Tarefa reaberta.');
    }
    setLoading(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, parentId: string | null, isConcluida = false) => {
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
    if (isConcluida) {
      setConcluidas(prev => prev.filter(i => i.id !== id));
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
    }

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
      setConcluidas(initialConcluidas);
      showToast('Erro ao excluir. Tente novamente.');
    }
    setLoading(null);
  };

  return (
    <section className="mb-9 relative">
      <div className="flex items-end justify-between border-b border-line dark:border-dark-line pb-2 mb-3">
        <h2 className="label-mono !tracking-[0.14em]">Hoje</h2>
        <Link href="/historico" className="label-mono text-petrol hover:underline">
          Ver histórico →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft py-4">nada pendente hoje.</p>
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

      {/* Concluídas hoje (recolhível) */}
      {concluidas.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line dark:border-dark-line">
          <button
            onClick={() => setMostrarConcluidas(prev => !prev)}
            className="flex items-center gap-2 label-mono text-ink-soft dark:text-dark-inkSoft hover:text-petrol transition"
          >
            {mostrarConcluidas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Concluídas hoje ({concluidas.length})</span>
          </button>

          {mostrarConcluidas && (
            <ul className="mt-2">
              {concluidas.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-[32px_56px_1fr_auto_auto] gap-3 items-center py-2.5 border-b border-dotted border-line dark:border-dark-line last:border-0 group hover:bg-surface/50 dark:hover:bg-dark-surface/50 transition cursor-pointer opacity-70"
                  onClick={() => openDemandaEditor(t.id)}
                >
                  <button
                    onClick={(e) => handleReabrir(e, t.id)}
                    disabled={loading === t.id}
                    className="w-5 h-5 bg-petrol border border-petrol flex items-center justify-center hover:bg-petrol-deep transition disabled:opacity-50"
                    title="Reabrir tarefa"
                  >
                    <Check size={12} className="text-bg" strokeWidth={3} />
                  </button>

                  <span className="font-mono text-[12px] text-ink-faint dark:text-dark-inkSoft">{t.hora_inicio?.slice(0, 5) ?? '—'}</span>
                  <span className="text-[14px] text-ink dark:text-dark-ink line-through">{t.titulo}</span>
                  <span className="label-mono truncate max-w-[160px] hidden md:block">
                    {t.categorias?.nome ?? ''}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={(e) => handleReabrir(e, t.id)}
                      disabled={loading === t.id}
                      className="text-ink-faint hover:text-petrol opacity-0 group-hover:opacity-100 transition"
                      title="Reabrir"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, t.id, t.parent_id, true)}
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
        </div>
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
