'use client';
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { openDemandaEditor } from '@/hooks/useEditarDemanda';

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<{ obras: any[], demandas: any[] }>({ obras: [], demandas: [] });
  const supabase = createClient();
  const router = useRouter();

  // Lógica do atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Busca no banco de dados quando o usuário digita
  useEffect(() => {
    if (!query || query.length < 2) {
      setResultados({ obras: [], demandas: [] });
      return;
    }

    const fetchResults = async () => {
      const [obrasRes, demandasRes] = await Promise.all([
        supabase.from('obras').select('id, nome').ilike('nome', `%${query}%`).limit(5),
        supabase.from('demandas').select('id, titulo, data, status').ilike('titulo', `%${query}%`).order('data', { ascending: false }).limit(8)
      ]);
      
      setResultados({
        obras: obrasRes.data || [],
        demandas: demandasRes.data || []
      });
    };

    const timer = setTimeout(fetchResults, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query, supabase]);

  if (!open) return null;

  const closeAndNavigate = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  const closeAndOpenDemanda = (id: string) => {
    setOpen(false);
    setQuery('');
    openDemandaEditor(id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm px-4" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-xl bg-bg dark:bg-dark-surface border border-line-strong dark:border-dark-line shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full flex flex-col" shouldFilter={false}>
          <div className="flex items-center px-4 border-b border-line dark:border-dark-line">
            <Search className="w-5 h-5 text-ink-soft dark:text-dark-inkSoft mr-3" />
            <Command.Input 
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar obras, tarefas..." 
              className="flex-1 bg-transparent py-4 text-sm focus:outline-none text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
              autoFocus
            />
            <kbd className="hidden sm:inline-block px-2 py-1 bg-surface dark:bg-dark-bg border border-line-strong dark:border-dark-line rounded text-[10px] font-mono text-ink-soft">ESC</kbd>
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            {!query && (
              <div className="py-8 text-center text-sm text-ink-soft dark:text-dark-inkSoft label-mono">
                Digite para buscar no app...
              </div>
            )}

            {query && resultados.obras.length === 0 && resultados.demandas.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm text-ink-soft dark:text-dark-inkSoft">
                Nenhum resultado encontrado.
              </Command.Empty>
            )}

            {resultados.obras.length > 0 && (
              <Command.Group heading="Obras" className="mb-2">
                <div className="px-2 py-1 text-xs label-mono text-petrol mb-1">OBRAS</div>
                {resultados.obras.map(o => (
                  <Command.Item 
                    key={o.id} 
                    onSelect={() => closeAndNavigate(`/obras/${o.id}`)}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-petrol/10 aria-selected:bg-petrol/10 text-ink dark:text-dark-ink transition-colors"
                  >
                    <Briefcase size={16} className="text-petrol" />
                    <span>{o.nome}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {resultados.demandas.length > 0 && (
              <Command.Group heading="Tarefas">
                <div className="px-2 py-1 text-xs label-mono text-petrol mb-1 mt-2">TAREFAS</div>
                {resultados.demandas.map(d => {
                  const isConcluida = d.status === 'concluida';
                  return (
                    <Command.Item 
                      key={d.id} 
                      onSelect={() => closeAndOpenDemanda(d.id)}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer hover:bg-petrol/10 aria-selected:bg-petrol/10 text-ink dark:text-dark-ink transition-colors"
                    >
                      {isConcluida ? (
                        <CheckCircle2 size={16} className="text-olive flex-shrink-0" />
                      ) : (
                        <Calendar size={16} className="text-terra flex-shrink-0" />
                      )}
                      <span className={isConcluida ? 'line-through opacity-60 truncate' : 'truncate'}>{d.titulo}</span>
                      {isConcluida && <span className="font-mono text-[10px] uppercase text-olive bg-olive/10 px-1.5 py-0.5 flex-shrink-0">Concluída</span>}
                      <span className="ml-auto text-xs text-ink-faint font-mono flex-shrink-0">{d.data}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
