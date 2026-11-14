'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const statusLabel: Record<string, string> = {
  orcamento: 'Orçamento', concepcao: 'Concepção', calculo: 'Cálculo',
  detalhamento: 'Detalhamento', aguardando_arquitetura: 'Aguard. arquitetura',
  entregue: 'Entregue', execucao: 'Em execução',
};

const tipoLabel: Record<string, string> = {
  arquiteto: 'Arquiteto', construtora: 'Construtora', cliente_final: 'Cliente Final'
};

export function ObrasClient({ clientes, escritorios, userId }: { clientes: any[], escritorios: any[], userId: string }) {
  const supabase = createClient();
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formCliente, setFormCliente] = useState({ nome: '', tipo: 'arquiteto', escritorio_id: escritorios[0]?.id || '', contato: '' });
  const [formObra, setFormObra] = useState({ nome: '', cliente_id: '', area_m2: '', status_obra: 'orcamento', honorarios: '' });

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from('clientes').insert([{ ...formCliente, user_id: userId }]);
    if (error) alert(error.message); else { setIsClienteModalOpen(false); window.location.reload(); }
    setLoading(false);
  };

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const payload = {
      user_id: userId,
      cliente_id: formObra.cliente_id,
      nome: formObra.nome,
      area_m2: formObra.area_m2 ? Number(formObra.area_m2) : null,
      status_obra: formObra.status_obra,
      honorarios_total: formObra.honorarios ? Number(formObra.honorarios) : null,
    };
    const { data, error } = await supabase.from('obras').insert([payload]).select('id').single();
    
    if (error) alert(error.message); 
    else { 
      await supabase.rpc('gerar_checklist_padrao', { p_obra_id: data.id });
      setIsObraModalOpen(false); window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <button onClick={() => setIsClienteModalOpen(true)} className="px-4 py-2 border border-line dark:border-dark-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface hover:bg-bg dark:bg-dark-bg dark:hover:bg-dark-bg transition label-mono text-petrol-deep dark:text-petrol">
          + Novo Cliente
        </button>
        <button onClick={() => setIsObraModalOpen(true)} className="px-4 py-2 bg-petrol-deep text-bg hover:bg-petrol transition label-mono">
          + Nova Obra
        </button>
      </div>

      {clientes.length === 0 ? (
        <p className="text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft text-sm">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="space-y-10">
          {clientes.map(cliente => (
            <div key={cliente.id} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-line dark:border-dark-line pb-2">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol">{cliente.nome}</h2>
                  <span className="label-mono">{tipoLabel[cliente.tipo] || cliente.tipo}</span>
                </div>
                {cliente.escritorios?.nome && <span className="label-mono text-petrol">{cliente.escritorios.nome}</span>}
              </div>

              {cliente.obras?.length === 0 ? (
                <p className="text-sm text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft italic pl-4">Nenhuma obra vinculada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-strong border border-line dark:border-dark-line-strong dark:border-dark-line">
                  {cliente.obras.map((obra: any) => {
                    const total = obra.obra_checklist?.length ?? 0;
                    const done = obra.obra_checklist?.filter((c: any) => c.concluido).length ?? 0;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <Link key={obra.id} href={`/obras/${obra.id}`} className="bg-surface dark:bg-dark-surface p-5 hover:bg-bg dark:bg-dark-bg dark:hover:bg-dark-bg transition group block">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-serif text-lg font-semibold text-petrol-deep dark:text-petrol group-hover:text-petrol transition">{obra.nome}</h3>
                          {obra.area_m2 && <span className="font-mono text-2xs text-ink dark:text-dark-ink-faint dark:text-dark-inkSoft">{obra.area_m2} m²</span>}
                        </div>
                        <div className="label-mono mb-4">{statusLabel[obra.status_obra]}</div>
                        <div className="h-[2px] bg-line relative">
                          <div className="absolute inset-y-0 left-0 bg-petrol transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isClienteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsClienteModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-bg inset-x-0 bottom-0 h-auto border-t border-line dark:border-dark-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol mb-6">Novo Cliente</h2>
            <form onSubmit={handleCreateCliente} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Nome</label>
                <input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol" placeholder="Nome do cliente" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Tipo</label>
                <select value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol">
                  <option value="arquiteto">Arquiteto</option>
                  <option value="construtora">Construtora</option>
                  <option value="cliente_final">Cliente Final</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Escritório</label>
                <select value={formCliente.escritorio_id} onChange={e => setFormCliente({...formCliente, escritorio_id: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol">
                  <option value="">Nenhum (Pessoal)</option>
                  {escritorios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
                {loading ? 'Salvando...' : 'Criar Cliente'}
              </button>
            </form>
          </div>
        </>
      )}

      {isObraModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsObraModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-bg inset-x-0 bottom-0 h-[80vh] overflow-y-auto border-t border-line dark:border-dark-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol mb-6">Nova Obra</h2>
            <form onSubmit={handleCreateObra} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Cliente</label>
                <select required value={formObra.cliente_id} onChange={e => setFormObra({...formObra, cliente_id: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol">
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Nome da Obra</label>
                <input required value={formObra.nome} onChange={e => setFormObra({...formObra, nome: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol" placeholder="Ex: Edifício Aurora" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">Área (m²)</label>
                  <input type="number" step="0.01" value={formObra.area_m2} onChange={e => setFormObra({...formObra, area_m2: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol" placeholder="Opcional" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Honorários (R$)</label>
                  <input type="number" step="0.01" value={formObra.honorarios} onChange={e => setFormObra({...formObra, honorarios: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol" placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Status Inicial</label>
                <select value={formObra.status_obra} onChange={e => setFormObra({...formObra, status_obra: e.target.value})} className="w-full bg-transparent border-b border-line dark:border-dark-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol">
                  <option value="orcamento">Orçamento / Proposta</option>
                  <option value="concepcao">Em Concepção</option>
                  <option value="calculo">Em Cálculo</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
                {loading ? 'Criando e gerando checklist...' : 'Criar Obra'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
