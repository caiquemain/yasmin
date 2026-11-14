'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Check, Plus, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export function ObraDetailClient({ obra, checklist: initialChecklist, initialParcelas }: { obra: any, checklist: any[], initialParcelas: any[] }) {
  const supabase = createClient();
  
  const [checklist, setChecklist] = useState(initialChecklist);
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  
  const [parcelas, setParcelas] = useState(initialParcelas);
  const [isParcelaModalOpen, setIsParcelaModalOpen] = useState(false);
  const [formParcela, setFormParcela] = useState({ descricao: '', valor: '', data_prevista: '' });
  
  const [loading, setLoading] = useState(false);
  const [loadingParcela, setLoadingParcela] = useState(false);

  const [isArtModalOpen, setIsArtModalOpen] = useState(false);
  const [artNumero, setArtNumero] = useState(obra.art_numero || '');
  const [artStatus, setArtStatus] = useState(obra.art_status || 'nao_emitida');

  const [premissas, setPremissas] = useState({
    fck: obra.premissa_fck || '',
    caa: obra.premissa_caa || '',
    sigma_solo: obra.premissa_sigma_solo || '',
    cobrimento: obra.premissa_cobrimento || '',
    outras: obra.premissa_outras || '',
  });

  // ===== LÓGICA DO CHECKLIST (ORDENAÇÃO E EXCLUSÃO) =====

  // Função auxiliar para salvar a nova ordem no banco e na tela
  const syncChecklistOrder = async (newList: any[]) => {
    // Reordena os itens (1, 2, 3...)
    const updatedList = newList.map((item, idx) => ({ ...item, ordem: idx + 1 }));
    setChecklist(updatedList);

    // Salva no banco em paralelo
    const promises = updatedList.map(item => 
      supabase.from('obra_checklist').update({ ordem: item.ordem }).eq('id', item.id)
    );
    await Promise.all(promises);
  };

  const toggleChecklist = async (id: string, concluido: boolean) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido: !concluido } : c));
    await supabase.from('obra_checklist').update({ 
      concluido: !concluido, 
      concluido_em: !concluido ? new Date().toISOString() : null 
    }).eq('id', id);
  };

  const addChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItemChecklist) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('obra_checklist').insert([{
      user_id: user.id,
      obra_id: obra.id,
      titulo: novoItemChecklist,
      ordem: checklist.length + 1
    }]).select().single();

    if (data) {
      setChecklist([...checklist, data]);
      setNovoItemChecklist('');
    }
  };

  const deleteChecklistItem = async (id: string) => {
    if (!confirm('Excluir esta etapa do checklist?')) return;
    
    const newList = checklist.filter(c => c.id !== id);
    await syncChecklistOrder(newList); // Reordena o resto
    await supabase.from('obra_checklist').delete().eq('id', id); // Deleta do banco
  };

  const moveChecklistItem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === checklist.length - 1) return;

    const newList = [...checklist];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Troca as posições no array
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    
    await syncChecklistOrder(newList);
  };

  // ===== OUTRAS FUNÇÕES =====

  const toggleParcela = async (id: string, statusAtual: string) => {
    const isPago = statusAtual === 'pago';
    const novoStatus = isPago ? 'pendente' : 'pago';
    setParcelas(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
    await supabase.from('obra_parcelas').update({ 
      status: novoStatus,
      data_pago: !isPago ? new Date().toISOString() : null
    }).eq('id', id);
  };

  const savePremissas = async () => {
    setLoading(true);
    await supabase.from('obras').update({
      premissa_fck: premissas.fck ? Number(premissas.fck) : null,
      premissa_caa: premissas.caa || null,
      premissa_sigma_solo: premissas.sigma_solo ? Number(premissas.sigma_solo) : null,
      premissa_cobrimento: premissas.cobrimento ? Number(premissas.cobrimento) : null,
      premissa_outras: premissas.outras || null,
    }).eq('id', obra.id);
    setLoading(false);
    alert('Premissas salvas!');
  };

  const saveArt = async () => {
    setLoading(true);
    await supabase.from('obras').update({
      art_numero: artNumero || null,
      art_status: artStatus
    }).eq('id', obra.id);
    setLoading(false);
    setIsArtModalOpen(false);
    window.location.reload();
  };

  const handleCreateParcela = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingParcela(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      obra_id: obra.id,
      descricao: formParcela.descricao,
      valor: Number(formParcela.valor),
      data_prevista: formParcela.data_prevista || null,
      ordem: parcelas.length,
      status: 'pendente'
    };

    const { data, error } = await supabase.from('obra_parcelas').insert([payload]).select().single();
    if (error) alert(error.message);
    else {
      setParcelas([...parcelas, data]);
      setIsParcelaModalOpen(false);
      setFormParcela({ descricao: '', valor: '', data_prevista: '' });
    }
    setLoadingParcela(false);
  };

  const progresso = checklist.length ? Math.round((checklist.filter(c => c.concluido).length / checklist.length) * 100) : 0;
  const totalPago = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPendente = parcelas.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalGeral = totalPago + totalPendente;
  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <div className="mb-10">
        <Link href="/obras" className="label-mono text-petrol hover:underline mb-4 inline-block">← Voltar para Obras</Link>
        <h1 className="font-serif text-4xl text-petrol-deep dark:text-petrol mb-2">{obra.nome}</h1>
        <div className="flex gap-4 label-mono">
          <span>{obra.clientes.nome}</span>
          {obra.area_m2 && <span>{obra.area_m2} m²</span>}
          <span className="text-petrol">{obra.status_obra}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Coluna Esquerda */}
        <div className="space-y-10">
          {/* Checklist */}
          <section>
            <div className="flex items-end justify-between border-b border-line dark:border-dark-line pb-2 mb-4">
              <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol">Checklist de Cálculo</h2>
              <span className="label-mono">{progresso}% concluído</span>
            </div>
            
            <ul className="space-y-1 mb-4">
              {checklist.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 py-2 border-b border-dotted border-line dark:border-dark-line last:border-0 group">
                  {/* Checkbox */}
                  <div 
                    onClick={() => toggleChecklist(item.id, item.concluido)}
                    className={`w-5 h-5 flex-shrink-0 border cursor-pointer flex items-center justify-center transition-colors ${item.concluido ? 'bg-petrol border-petrol' : 'border-line-strong dark:border-dark-line hover:border-petrol'}`}
                  >
                    {item.concluido && <Check size={14} className="text-bg" strokeWidth={3} />}
                  </div>
                  
                  {/* Título */}
                  <span 
                    onClick={() => toggleChecklist(item.id, item.concluido)}
                    className={`text-[14.5px] flex-1 cursor-pointer transition-opacity ${item.concluido ? 'opacity-50 line-through' : 'text-ink dark:text-dark-ink'}`}
                  >
                    <span className="font-mono text-xs text-ink-faint dark:text-dark-inkSoft mr-2">{String(i+1).padStart(2, '0')}</span>
                    {item.titulo}
                  </span>

                  {/* Ações (Só aparecem no hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveChecklistItem(i, 'up'); }} disabled={i === 0} className="p-1 text-ink-faint hover:text-petrol disabled:opacity-30">
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveChecklistItem(i, 'down'); }} disabled={i === checklist.length - 1} className="p-1 text-ink-faint hover:text-petrol disabled:opacity-30">
                      <ChevronDown size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteChecklistItem(item.id); }} className="p-1 text-ink-faint hover:text-terra ml-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            
            <form onSubmit={addChecklistItem} className="flex gap-2">
              <input type="text" value={novoItemChecklist} onChange={e => setNovoItemChecklist(e.target.value)} placeholder="Adicionar etapa customizada..." className="flex-1 bg-transparent border-b border-line-strong dark:border-dark-line py-1 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" />
              <button type="submit" className="px-3 py-1 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line text-petrol hover:bg-bg dark:hover:bg-dark-bg transition"><Plus size={16} /></button>
            </form>
          </section>

          {/* Financeiro */}
          <section>
            <div className="flex items-end justify-between border-b border-line dark:border-dark-line pb-2 mb-4">
              <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol">Financeiro</h2>
              <button onClick={() => setIsParcelaModalOpen(true)} className="label-mono text-petrol hover:underline">+ Adicionar Parcela</button>
            </div>
            <div className="grid grid-cols-3 gap-px bg-line dark:bg-dark-line border border-line-strong dark:border-dark-line mb-6">
              <div className="bg-surface dark:bg-dark-surface p-4">
                <span className="label-mono block mb-1">Total</span>
                <span className="font-serif text-lg text-petrol-deep dark:text-petrol">{formatBRL(totalGeral)}</span>
              </div>
              <div className="bg-surface dark:bg-dark-surface p-4">
                <span className="label-mono block mb-1">Recebido</span>
                <span className="font-serif text-lg text-olive">{formatBRL(totalPago)}</span>
              </div>
              <div className="bg-surface dark:bg-dark-surface p-4">
                <span className="label-mono block mb-1">A Receber</span>
                <span className="font-serif text-lg text-terra">{formatBRL(totalPendente)}</span>
              </div>
            </div>
            {parcelas.length > 0 && (
              <ul className="space-y-2">
                {parcelas.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 p-3 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface group">
                    <button onClick={() => toggleParcela(p.id, p.status)} className={`w-5 h-5 border flex flex-shrink-0 items-center justify-center transition-colors ${p.status === 'pago' ? 'bg-petrol border-petrol' : 'border-line-strong dark:border-dark-line group-hover:border-petrol'}`}>
                      {p.status === 'pago' && <Check size={14} className="text-bg" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <span className={`text-[14.5px] block ${p.status === 'pago' ? 'opacity-50 line-through text-ink dark:text-dark-ink' : 'text-ink dark:text-dark-ink'}`}>{p.descricao}</span>
                        {p.data_prevista && <span className="label-mono text-ink-faint dark:text-dark-inkSoft">Previsto: {new Date(p.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <span className={`font-mono text-sm ${p.status === 'pago' ? 'text-petrol' : 'text-ink-soft dark:text-dark-inkSoft'}`}>{formatBRL(Number(p.valor))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-8">
          <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line sticky top-20">
            <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol mb-6">Premissas de Cálculo</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="label-mono">fck (MPa)</label>
                <select value={premissas.fck} onChange={e => setPremissas({...premissas, fck: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-1 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Não definido</option>
                  {[20,25,30,35,40].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">CAA (NBR 6118)</label>
                <select value={premissas.caa} onChange={e => setPremissas({...premissas, caa: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-1 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Não definido</option>
                  {['I','II','III','IV'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">σsolo (kPa)</label>
                  <input type="number" value={premissas.sigma_solo} onChange={e => setPremissas({...premissas, sigma_solo: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-1 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Cobr. (mm)</label>
                  <input type="number" value={premissas.cobrimento} onChange={e => setPremissas({...premissas, cobrimento: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-1 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <label className="label-mono">Outras Notas</label>
                <textarea value={premissas.outras} onChange={e => setPremissas({...premissas, outras: e.target.value})} className="w-full bg-transparent border border-line-strong dark:border-dark-line p-2 text-sm focus:outline-none focus:border-petrol min-h-[80px] resize-none text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Presença de rocha no solo..." />
              </div>
              <button onClick={savePremissas} disabled={loading} className="w-full py-2 mt-2 bg-petrol text-bg text-sm font-medium hover:bg-petrol-deep transition">{loading ? 'Salvando...' : 'Salvar Premissas'}</button>
            </div>
          </section>

          <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
            <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol mb-4">ART</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-ink dark:text-dark-ink">
                <span className="label-mono">Status</span>
                <span className="font-mono text-2xs uppercase bg-amber/20 text-amber px-2 py-0.5">{obra.art_status.replace('_', ' ')}</span>
              </div>
              {obra.art_numero && <div className="text-sm"><span className="label-mono block">Número</span><span className="font-mono text-ink dark:text-dark-ink">{obra.art_numero}</span></div>}
              <button onClick={() => setIsArtModalOpen(true)} className="w-full py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition text-ink dark:text-dark-ink">Gerenciar ART</button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Nova Parcela */}
      {isParcelaModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsParcelaModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-surface inset-x-0 bottom-0 h-auto border-t border-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">Nova Parcela</h2>
              <button onClick={() => setIsParcelaModalOpen(false)} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateParcela} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Descrição</label>
                <input required value={formParcela.descricao} onChange={e => setFormParcela({...formParcela, descricao: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Entrega de formas" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Valor (R$)</label>
                <input required type="number" step="0.01" value={formParcela.valor} onChange={e => setFormParcela({...formParcela, valor: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Data Prevista (Opcional)</label>
                <input type="date" value={formParcela.data_prevista} onChange={e => setFormParcela({...formParcela, data_prevista: e.target.value})} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
              </div>
              <button type="submit" disabled={loadingParcela} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">{loadingParcela ? 'Salvando...' : 'Adicionar Parcela'}</button>
            </form>
          </div>
        </>
      )}

      {/* Modal ART */}
      {isArtModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsArtModalOpen(false)} />
          <div className="fixed z-50 bg-bg dark:bg-dark-surface inset-x-0 bottom-0 h-auto border-t border-line-strong dark:border-dark-line p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">Gerenciar ART</h2>
              <button onClick={() => setIsArtModalOpen(false)} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink"><X size={20}/></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Número da ART</label>
                <input value={artNumero} onChange={e => setArtNumero(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: 1234567890" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Status</label>
                <select value={artStatus} onChange={e => setArtStatus(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="nao_emitida">Não emitida</option>
                  <option value="emitida">Emitida</option>
                  <option value="paga">Paga</option>
                </select>
              </div>
              <button onClick={saveArt} disabled={loading} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar ART'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
