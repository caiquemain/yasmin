'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageTour } from '@/components/ui/PageTour';
import { Pencil, Trash2, X } from 'lucide-react';

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
  const router = useRouter();
  
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<any>(null);
  const [obraParaEditar, setObraParaEditar] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formCliente, setFormCliente] = useState({ nome: '', tipo: 'arquiteto', escritorio_id: escritorios[0]?.id || '', contato: '' });
  const [formObra, setFormObra] = useState({ nome: '', cliente_id: '', area_m2: '', status_obra: 'orcamento', honorarios: '' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsClienteModalOpen(false); setIsObraModalOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---- CLIENTES ----
  const openNewCliente = () => {
    setClienteParaEditar(null);
    setFormCliente({ nome: '', tipo: 'arquiteto', escritorio_id: escritorios[0]?.id || '', contato: '' });
    setIsClienteModalOpen(true);
  };

  const openEditCliente = (c: any) => {
    setClienteParaEditar(c);
    setFormCliente({
      nome: c.nome,
      tipo: c.tipo,
      escritorio_id: c.escritorio_id || '',
      contato: c.contato || '',
    });
    setIsClienteModalOpen(true);
  };

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (clienteParaEditar) {
      const { error } = await supabase.from('clientes').update(formCliente).eq('id', clienteParaEditar.id);
      if (error) alert(error.message);
      else { setIsClienteModalOpen(false); window.location.reload(); }
    } else {
      const { error } = await supabase.from('clientes').insert([{ ...formCliente, user_id: userId }]);
      if (error) alert(error.message);
      else { setIsClienteModalOpen(false); window.location.reload(); }
    }
    setLoading(false);
  };

  const handleDeleteCliente = async (cliente: any) => {
    const numObras = cliente.obras?.length || 0;
    const msg = numObras > 0
      ? `⚠️ Este cliente tem ${numObras} obra(s) vinculada(s).\n\nExcluir o cliente vai EXCLUIR PERMANENTEMENTE todas as obras, checklists e parcelas financeiras.\n\nTem certeza que quer excluir?`
      : `Excluir o cliente "${cliente.nome}"?`;
    if (!confirm(msg)) return;
    if (numObras > 0 && !confirm('Tem CERTEZA? Esta ação não pode ser desfeita.')) return;
    
    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);
    if (error) alert(error.message);
    else window.location.reload();
  };

  // ---- OBRAS ----
  const openNewObra = () => {
    setObraParaEditar(null);
    setFormObra({ nome: '', cliente_id: '', area_m2: '', status_obra: 'orcamento', honorarios: '' });
    setIsObraModalOpen(true);
  };

  const openEditObra = (o: any) => {
    setObraParaEditar(o);
    setFormObra({
      nome: o.nome,
      cliente_id: o.cliente_id,
      area_m2: o.area_m2?.toString() || '',
      status_obra: o.status_obra,
      honorarios: o.honorarios_total?.toString() || '',
    });
    setIsObraModalOpen(true);
  };

  const handleSaveObra = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      cliente_id: formObra.cliente_id,
      nome: formObra.nome,
      area_m2: formObra.area_m2 ? Number(formObra.area_m2) : null,
      status_obra: formObra.status_obra,
      honorarios_total: formObra.honorarios ? Number(formObra.honorarios) : null,
    };

    if (obraParaEditar) {
      const { error } = await supabase.from('obras').update(payload).eq('id', obraParaEditar.id);
      if (error) alert(error.message);
      else { setIsObraModalOpen(false); window.location.reload(); }
    } else {
      const { data, error } = await supabase.from('obras').insert([{ ...payload, user_id: userId }]).select('id').single();
      if (error) alert(error.message);
      else {
        await supabase.rpc('gerar_checklist_padrao', { p_obra_id: data.id });
        setIsObraModalOpen(false);
        window.location.reload();
      }
    }
    setLoading(false);
  };

  const handleDeleteObra = async (obra: any) => {
    const msg = `⚠️ Excluir a obra "${obra.nome}"?\n\nIsso vai remover PERMANENTEMENTE o checklist, as parcelas financeiras e todas as demandas vinculadas.\n\nTem certeza?`;
    if (!confirm(msg)) return;
    if (!confirm('Tem CERTEZA mesmo? Esta ação não pode ser desfeita.')) return;

    const { error } = await supabase.from('obras').delete().eq('id', obra.id);
    if (error) alert(error.message);
    else window.location.reload();
  };

  const tourSteps = [
    { element: 'body', popover: { title: 'Obras & Clientes', description: 'Aqui é o coração do app. Você cadastra os clientes e as obras vinculadas a eles.' } },
    { element: '[data-tour="obras-novo-cliente"]', popover: { title: 'Novo Cliente', description: 'Cadastre arquitetos, construtoras ou clientes finais. Cada cliente pode ter várias obras.', side: 'bottom' as const, align: 'start' as const } },
    { element: '[data-tour="obras-nova-obra"]', popover: { title: 'Nova Obra', description: 'Crie uma obra vinculada a um cliente. O checklist de 7 etapas é gerado automaticamente!', side: 'bottom' as const, align: 'start' as const } },
    { element: '[data-tour="obras-lista"]', popover: { title: 'Prontuários', description: 'Clique em qualquer obra para abrir a Ficha Técnica. Passe o mouse para ver os botões de editar e excluir.', side: 'top' as const, align: 'start' as const } }
  ];

  return (
    <div className="space-y-12">
      <PageTour storageKey="tour_obras_v1" steps={tourSteps} />

      <div className="flex flex-wrap gap-3">
        <button data-tour="obras-novo-cliente" onClick={openNewCliente} className="flex-1 md:flex-none px-4 py-2 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface hover:bg-bg dark:hover:bg-dark-bg transition label-mono text-petrol-deep dark:text-petrol">
          + Novo Cliente
        </button>
        <button data-tour="obras-nova-obra" onClick={openNewObra} className="flex-1 md:flex-none px-4 py-2 bg-petrol-deep text-bg hover:bg-petrol transition label-mono">
          + Nova Obra
        </button>
      </div>

      <div data-tour="obras-lista">
        {clientes.length === 0 ? (
          <p className="text-ink-soft dark:text-dark-inkSoft text-sm">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="space-y-10">
            {clientes.map(cliente => (
              <div key={cliente.id} className="space-y-4">
                {/* Header do Cliente com botões de editar/deletar */}
                <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-line dark:border-dark-line pb-3 gap-2 group/cliente">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                    <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol leading-tight">{cliente.nome}</h2>
                    <span className="label-mono">{tipoLabel[cliente.tipo] || cliente.tipo}</span>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {cliente.escritorios?.nome && (
                      <span className="label-mono text-petrol md:text-right mr-2">
                        {cliente.escritorios.nome}
                      </span>
                    )}
                    <button
                      onClick={() => openEditCliente(cliente)}
                      className="text-ink-faint hover:text-petrol transition p-1 opacity-60 md:opacity-0 group-hover/cliente:opacity-100"
                      title="Editar cliente"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente)}
                      className="text-ink-faint hover:text-terra transition p-1 opacity-60 md:opacity-0 group-hover/cliente:opacity-100"
                      title="Excluir cliente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {cliente.obras?.length === 0 ? (
                  <p className="text-sm text-ink-soft dark:text-dark-inkSoft italic pl-2">Nenhuma obra vinculada.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-strong dark:bg-dark-line border border-line-strong dark:border-dark-line">
                    {cliente.obras.map((obra: any) => {
                      const total = obra.obra_checklist?.length ?? 0;
                      const done = obra.obra_checklist?.filter((c: any) => c.concluido).length ?? 0;
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <div key={obra.id} className="relative group/obra bg-surface dark:bg-dark-surface">
                          <Link
                            href={`/obras/${obra.id}`}
                            className="block p-4 md:p-5 hover:bg-bg dark:hover:bg-dark-bg transition"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className="font-serif text-lg font-semibold text-petrol-deep dark:text-petrol group-hover/obra:text-petrol transition leading-tight break-words pr-16">
                                {obra.nome}
                              </h3>
                              {obra.area_m2 && <span className="font-mono text-2xs text-ink-faint dark:text-dark-inkSoft whitespace-nowrap pt-1">{obra.area_m2} m²</span>}
                            </div>
                            <div className="label-mono mb-4">{statusLabel[obra.status_obra]}</div>
                            <div className="h-[2px] bg-line dark:bg-dark-line relative">
                              <div className="absolute inset-y-0 left-0 bg-petrol transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </Link>

                          {/* Botões flutuantes de editar/excluir obra */}
                          <div className="absolute top-3 right-3 flex gap-1 opacity-60 md:opacity-0 group-hover/obra:opacity-100 transition">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditObra(obra); }}
                              className="bg-surface dark:bg-dark-surface p-1.5 border border-line dark:border-dark-line text-ink-faint hover:text-petrol transition"
                              title="Editar obra"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteObra(obra); }}
                              className="bg-surface dark:bg-dark-surface p-1.5 border border-line dark:border-dark-line text-ink-faint hover:text-terra transition"
                              title="Excluir obra"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Cliente (Novo / Editar) */}
      {isClienteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsClienteModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-surface inset-x-0 bottom-0 h-auto border-t border-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">
                {clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setIsClienteModalOpen(false)} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCliente} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Nome</label>
                <input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Nome do cliente" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Tipo</label>
                <select value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="arquiteto">Arquiteto</option>
                  <option value="construtora">Construtora</option>
                  <option value="cliente_final">Cliente Final</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Escritório</label>
                <select value={formCliente.escritorio_id} onChange={e => setFormCliente({...formCliente, escritorio_id: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Nenhum (Pessoal)</option>
                  {escritorios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
                {loading ? 'Salvando...' : (clienteParaEditar ? 'Salvar alterações' : 'Criar Cliente')}
              </button>
            </form>
          </div>
        </>
      )}

      {/* MODAL: Obra (Nova / Editar) */}
      {isObraModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsObraModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-surface inset-x-0 bottom-0 h-[100dvh] overflow-y-auto border-t border-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">
                {obraParaEditar ? 'Editar Obra' : 'Nova Obra'}
              </h2>
              <button onClick={() => setIsObraModalOpen(false)} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveObra} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Cliente</label>
                <select required value={formObra.cliente_id} onChange={e => setFormObra({...formObra, cliente_id: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Nome da Obra</label>
                <input required value={formObra.nome} onChange={e => setFormObra({...formObra, nome: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Edifício Aurora" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">Área (m²)</label>
                  <input type="number" step="0.01" value={formObra.area_m2} onChange={e => setFormObra({...formObra, area_m2: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Opcional" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Honorários (R$)</label>
                  <input type="number" step="0.01" value={formObra.honorarios} onChange={e => setFormObra({...formObra, honorarios: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Status</label>
                <select value={formObra.status_obra} onChange={e => setFormObra({...formObra, status_obra: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="orcamento">Orçamento / Proposta</option>
                  <option value="concepcao">Em Concepção</option>
                  <option value="calculo">Em Cálculo</option>
                  <option value="detalhamento">Detalhamento</option>
                  <option value="aguardando_arquitetura">Aguardando Arquitetura</option>
                  <option value="entregue">Entregue</option>
                  <option value="execucao">Em Execução</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
                {loading ? (obraParaEditar ? 'Salvando...' : 'Criando e gerando checklist...') : (obraParaEditar ? 'Salvar alterações' : 'Criar Obra')}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
