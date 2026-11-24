'use client';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, isValid, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, RotateCcw, Search, Trash2, Pencil } from 'lucide-react';
import { openDemandaEditor } from '@/hooks/useEditarDemanda';

type PeriodoFiltro = 'todos' | '7d' | 'mes' | '90d';

export function HistoricoClient({
  initialDemandas,
  escritorios,
  categorias,
}: {
  initialDemandas: any[];
  escritorios: any[];
  categorias: any[];
}) {
  const supabase = createClient();
  const [demandas, setDemandas] = useState(initialDemandas);
  const [busca, setBusca] = useState('');
  const [filtroEscritorio, setFiltroEscritorio] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoFiltro>('todos');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getDataReferencia = (d: any): Date | null => {
    if (d.concluida_em) {
      const parsed = parseISO(d.concluida_em);
      if (isValid(parsed)) return parsed;
    }
    if (d.data) {
      const parsed = parseISO(`${d.data}T12:00:00`);
      if (isValid(parsed)) return parsed;
    }
    return null;
  };

  const demandasFiltradas = useMemo(() => {
    const agora = new Date();
    const termo = busca.trim().toLowerCase();

    return demandas.filter((d) => {
      if (filtroEscritorio !== 'todos' && d.escritorio_id !== filtroEscritorio) return false;
      if (filtroCategoria !== 'todos' && d.categoria_id !== filtroCategoria) return false;

      if (termo) {
        const texto = `${d.titulo ?? ''} ${d.descricao ?? ''} ${d.obras?.nome ?? ''} ${d.categorias?.nome ?? ''}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }

      if (filtroPeriodo !== 'todos') {
        const ref = getDataReferencia(d);
        if (!ref) return false;
        if (filtroPeriodo === '7d' && ref < subDays(agora, 7)) return false;
        if (filtroPeriodo === 'mes' && ref < startOfMonth(agora)) return false;
        if (filtroPeriodo === '90d' && ref < subDays(agora, 90)) return false;
      }

      return true;
    });
  }, [demandas, busca, filtroEscritorio, filtroCategoria, filtroPeriodo]);

  const agrupadasPorMes = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    demandasFiltradas.forEach((d) => {
      const ref = getDataReferencia(d);
      const chave = ref ? format(ref, "MMMM 'de' yyyy", { locale: ptBR }) : 'Sem data';
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(d);
    });
    return Object.entries(grupos);
  }, [demandasFiltradas]);

  const handleReabrir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLoadingId(id);
    const anterior = demandas;
    setDemandas((prev) => prev.filter((d) => d.id !== id));

    const { error } = await supabase
      .from('demandas')
      .update({ status: 'a_fazer', concluida_em: null })
      .eq('id', id);

    if (error) {
      setDemandas(anterior);
      showToast('Erro ao reabrir tarefa.');
    } else {
      showToast('Tarefa reaberta e movida de volta para pendentes.');
    }
    setLoadingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Excluir permanentemente esta tarefa do histórico?')) return;
    setLoadingId(id);
    const anterior = demandas;
    setDemandas((prev) => prev.filter((d) => d.id !== id));

    const { error } = await supabase.from('demandas').delete().eq('id', id);
    if (error) {
      setDemandas(anterior);
      showToast('Erro ao excluir tarefa.');
    } else {
      showToast('Tarefa excluída.');
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-8 relative">
      {/* Resumo + Busca + Filtros */}
      <div className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-inkSoft" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no histórico (ex: BIM Estruture, obra, categoria...)"
              className="w-full pl-9 pr-3 py-2 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line text-sm text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft focus:outline-none focus:border-petrol"
            />
          </div>
          <span className="label-mono text-petrol-deep dark:text-petrol whitespace-nowrap">
            {demandasFiltradas.length} {demandasFiltradas.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 p-1 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line">
            {([
              { id: 'todos', label: 'Tudo' },
              { id: '7d', label: '7 dias' },
              { id: 'mes', label: 'Este mês' },
              { id: '90d', label: '90 dias' },
            ] as { id: PeriodoFiltro; label: string }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setFiltroPeriodo(p.id)}
                className={`px-2.5 py-1 text-xs transition ${
                  filtroPeriodo === p.id
                    ? 'bg-petrol text-bg'
                    : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {categorias.length > 0 && (
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="font-mono text-2xs uppercase tracking-[0.08em] bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line px-2.5 py-1.5 text-ink dark:text-dark-ink focus:outline-none focus:border-petrol"
            >
              <option value="todos">Todas categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          )}

          {escritorios.length > 1 && (
            <select
              value={filtroEscritorio}
              onChange={(e) => setFiltroEscritorio(e.target.value)}
              className="font-mono text-2xs uppercase tracking-[0.08em] bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line px-2.5 py-1.5 text-ink dark:text-dark-ink focus:outline-none focus:border-petrol"
            >
              <option value="todos">Todos escritórios</option>
              {escritorios.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Lista agrupada por mês */}
      {agrupadasPorMes.length === 0 ? (
        <div className="p-10 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface text-center">
          <p className="label-mono text-ink-faint dark:text-dark-inkSoft">
            Nenhuma tarefa concluída encontrada para este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {agrupadasPorMes.map(([mes, items]) => (
            <section key={mes} className="space-y-3">
              <div className="flex items-end justify-between border-b border-line dark:border-dark-line pb-2">
                <h2 className="font-serif text-2xl capitalize text-petrol-deep dark:text-petrol">{mes}</h2>
                <span className="label-mono">{items.length}</span>
              </div>

              <ul className="space-y-2">
                {items.map((d) => {
                  const dataAgendada = d.data
                    ? format(parseISO(`${d.data}T12:00:00`), 'dd/MM/yyyy')
                    : null;
                  const dataConclusao = d.concluida_em && isValid(parseISO(d.concluida_em))
                    ? format(parseISO(d.concluida_em), "dd/MM/yyyy 'às' HH:mm")
                    : null;

                  return (
                    <li
                      key={d.id}
                      onClick={() => openDemandaEditor(d.id)}
                      className="flex items-start md:items-center justify-between gap-4 p-4 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line hover:border-petrol transition cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={(e) => handleReabrir(e, d.id)}
                          disabled={loadingId === d.id}
                          title="Reabrir tarefa"
                          className="mt-0.5 w-5 h-5 bg-petrol border border-petrol flex items-center justify-center flex-shrink-0 hover:bg-petrol-deep transition disabled:opacity-50"
                        >
                          <Check size={12} className="text-bg" strokeWidth={3} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-[15px] leading-tight text-ink dark:text-dark-ink line-through opacity-75">
                            {d.titulo}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {d.categorias && (
                              <span className="label-mono" style={{ color: d.categorias.cor }}>
                                {d.categorias.nome}
                              </span>
                            )}
                            {d.obras && (
                              <span className="label-mono text-ink-soft dark:text-dark-inkSoft">
                                {d.obras.nome}
                              </span>
                            )}
                            {d.escritorios && (
                              <span className="label-mono text-petrol">
                                {d.escritorios.nome}
                              </span>
                            )}
                            {dataAgendada && (
                              <span className="label-mono text-ink-faint dark:text-dark-inkSoft">
                                Data: {dataAgendada}
                              </span>
                            )}
                            {dataConclusao && (
                              <span className="label-mono text-olive">
                                Concluída em {dataConclusao}
                              </span>
                            )}
                          </div>
                          {d.descricao && (
                            <p className="text-sm text-ink-soft dark:text-dark-inkSoft mt-1.5 line-clamp-2">
                              {d.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleReabrir(e, d.id)}
                          disabled={loadingId === d.id}
                          title="Reabrir tarefa"
                          className="p-1.5 text-ink-faint hover:text-petrol transition"
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDemandaEditor(d.id); }}
                          title="Editar"
                          className="p-1.5 text-ink-faint hover:text-petrol transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, d.id)}
                          disabled={loadingId === d.id}
                          title="Excluir"
                          className="p-1.5 text-ink-faint hover:text-terra transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-petrol-deep text-bg px-4 py-2 text-xs font-mono uppercase tracking-wider shadow-lg animate-in slide-in-from-bottom fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
