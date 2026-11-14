'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  isSameMonth, isSameDay, eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

type ViewMode = 'mensal' | 'semanal' | 'diaria';

export function AgendaClient() {
  const supabase = createClient();
  const [view, setView] = useState<ViewMode>('mensal');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [demandas, setDemandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para buscar as demandas no banco baseada na data atual
  const fetchDemandas = async () => {
    setLoading(true);
    
    let start, end;
    if (view === 'mensal') {
      start = startOfWeek(startOfMonth(currentDate));
      end = endOfWeek(endOfMonth(currentDate));
    } else if (view === 'semanal') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else {
      start = currentDate;
      end = currentDate;
    }

    const { data } = await supabase
      .from('demandas')
      .select('*, parent_id, categorias(nome, cor), obras(nome)')
      .gte('data', format(start, 'yyyy-MM-dd'))
      .lte('data', format(end, 'yyyy-MM-dd'))
      .neq('status', 'concluida')
      .order('hora_inicio', { nullsFirst: true });

    setDemandas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDemandas();
  }, [currentDate, view]);

  const handleDelete = async (id: string, parentId: string | null) => {
    if (parentId) {
      if (confirm('Esta tarefa faz parte de uma série recorrente. Deseja excluir TODAS as tarefas futuras desta série?')) {
        await supabase.from('demandas').delete().eq('parent_id', parentId);
        fetchDemandas();
      } else {
        await supabase.from('demandas').delete().eq('id', id);
        fetchDemandas();
      }
    } else {
      if (!confirm('Excluir esta tarefa?')) return;
      await supabase.from('demandas').delete().eq('id', id);
      fetchDemandas();
    }
  };

  const next = () => {
    if (view === 'mensal') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'semanal') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const prev = () => {
    if (view === 'mensal') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'semanal') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    if (view === 'mensal') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'semanal') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const renderMensal = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface">
        <div className="grid grid-cols-7 border-b border-line-strong dark:border-dark-line bg-bg/50 dark:bg-dark-bg/50">
          {weekDays.map(d => <div key={d} className="py-2 text-center label-mono text-petrol-deep dark:text-petrol">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayDemandas = demandas.filter(d => d.data === format(day, 'yyyy-MM-dd'));

            return (
              <div 
                key={day.toString()} 
                onClick={() => { setCurrentDate(day); setView('diaria'); }}
                className={`min-h-[100px] p-2 border-b border-r border-line dark:border-dark-line cursor-pointer hover:bg-bg dark:hover:bg-dark-bg transition flex flex-col gap-1
                  ${!isCurrentMonth ? 'opacity-40 bg-bg/30 dark:bg-dark-bg/30' : ''}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-petrol text-bg font-bold' : 'text-ink dark:text-dark-ink'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                  {dayDemandas.slice(0, 3).map(d => (
                    <div key={d.id} className="text-[10px] truncate px-1 border-l-2 bg-bg/50 dark:bg-dark-bg/50 text-ink dark:text-dark-ink" style={{ borderLeftColor: d.categorias?.cor || 'var(--color-petrol)' }}>
                      {d.titulo}
                    </div>
                  ))}
                  {dayDemandas.length > 3 && <span className="text-[10px] text-ink-faint dark:text-dark-inkSoft pl-1">+{dayDemandas.length - 3} mais</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSemanal = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="flex flex-col md:flex-row gap-px bg-line-strong dark:bg-dark-line border border-line-strong dark:border-dark-line">
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const dayDemandas = demandas.filter(d => d.data === format(day, 'yyyy-MM-dd'));
          
          return (
            <div key={day.toString()} className="flex-1 bg-surface dark:bg-dark-surface min-w-[140px] flex flex-col">
              <div className={`p-3 text-center border-b border-line dark:border-dark-line ${isToday ? 'bg-petrol/10' : 'bg-bg/30 dark:bg-dark-bg/30'}`}>
                <div className="label-mono text-petrol-deep dark:text-petrol">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className={`font-serif text-xl mt-1 ${isToday ? 'text-petrol font-bold' : 'text-ink dark:text-dark-ink'}`}>{format(day, 'dd')}</div>
              </div>
              <div className="p-2 flex flex-col gap-2 flex-1">
                {dayDemandas.length === 0 ? (
                  <span className="text-xs text-ink-faint dark:text-dark-inkSoft text-center mt-4 italic">Vazio</span>
                ) : (
                  dayDemandas.map(d => (
                    <div key={d.id} className="p-2 border border-line dark:border-dark-line bg-bg/50 dark:bg-dark-bg/50 text-xs text-ink dark:text-dark-ink">
                      {d.hora_inicio && <span className="block font-mono text-[10px] text-petrol mb-1">{d.hora_inicio.slice(0,5)}</span>}
                      <span className="block leading-tight">{d.titulo}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDiaria = () => {
    const dayDemandas = demandas.filter(d => d.data === format(currentDate, 'yyyy-MM-dd'));

    return (
      <div className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line p-6 min-h-[400px]">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-6 border-b border-line dark:border-dark-line pb-2">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>
        
        {dayDemandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-faint dark:text-dark-inkSoft">
            <p className="label-mono">nada agendado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayDemandas.map(d => (
              <div key={d.id} className="flex gap-4 group relative">
                <div className="w-16 flex-shrink-0 text-right pt-1">
                  <span className="font-mono text-sm text-petrol">{d.hora_inicio ? d.hora_inicio.slice(0,5) : '—'}</span>
                </div>
                <div className="flex-1 border-l-2 pl-4 pb-4 relative" style={{ borderColor: d.categorias?.cor || 'var(--color-line-strong)' }}>
                  <div className="absolute w-2 h-2 rounded-full -left-[5px] top-2" style={{ backgroundColor: d.categorias?.cor || 'var(--color-line-strong)' }} />
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[15px] font-medium leading-tight text-ink dark:text-dark-ink">{d.titulo}</h3>
                      <div className="flex gap-2 mt-1">
                        {d.categorias && <span className="label-mono text-petrol">{d.categorias.nome}</span>}
                        {d.obras && <span className="label-mono text-ink-soft dark:text-dark-inkSoft">• {d.obras.nome}</span>}
                        {d.revisao && <span className="label-mono text-terra">• {d.revisao}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(d.id, d.parent_id)} className="text-ink-faint hover:text-terra md:opacity-0 group-hover:opacity-100 transition p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line w-fit">
          {(['mensal', 'semanal', 'diaria'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm capitalize transition ${view === v ? 'bg-petrol text-bg' : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'}`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={goToday} className="label-mono border border-line-strong dark:border-dark-line px-3 py-1 hover:bg-surface dark:hover:bg-dark-surface transition text-ink dark:text-dark-ink">Hoje</button>
          <div className="flex items-center border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface">
            <button onClick={prev} className="px-3 py-1 hover:bg-line/30 dark:hover:bg-dark-line/30 transition text-ink dark:text-dark-ink">←</button>
            <span className="font-serif text-lg w-48 text-center capitalize text-ink dark:text-dark-ink">{getHeaderTitle()}</span>
            <button onClick={next} className="px-3 py-1 hover:bg-line/30 dark:hover:bg-dark-line/30 transition text-ink dark:text-dark-ink">→</button>
          </div>
        </div>
      </div>

      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
        {view === 'mensal' && renderMensal()}
        {view === 'semanal' && renderSemanal()}
        {view === 'diaria' && renderDiaria()}
      </div>
    </div>
  );
}
