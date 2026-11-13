'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function ObraDetailClient({ obra, checklist: initialChecklist, initialParcelas }: { obra: any, checklist: any[], initialParcelas: any[] }) {
  const supabase = createClient();
  
  // Checklist state
  const [checklist, setChecklist] = useState(initialChecklist);
  
  // Parcelas state
  const [parcelas, setParcelas] = useState(initialParcelas);
  const [isParcelaModalOpen, setIsParcelaModalOpen] = useState(false);
  const [formParcela, setFormParcela] = useState({ descricao: '', valor: '', data_prevista: '' });
  
  const [loading, setLoading] = useState(false);
  const [loadingParcela, setLoadingParcela] = useState(false);

  // Premissas state
  const [premissas, setPremissas] = useState({
    fck: obra.premissa_fck || '',
    caa: obra.premissa_caa || '',
    sigma_solo: obra.premissa_sigma_solo || '',
    cobrimento: obra.premissa_cobrimento || '',
    outras: obra.premissa_outras || '',
  });

  const toggleChecklist = async (id: string, concluido: boolean) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido: !concluido } : c));
    await supabase.from('obra_checklist').update({ 
      concluido: !concluido, 
      concluido_em: !concluido ? new Date().toISOString() : null 
    }).eq('id', id);
  };

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

    if (error) {
      alert(error.message);
    } else {
      setParcelas([...parcelas, data]);
      setIsParcelaModalOpen(false);
      setFormParcela({ descricao: '', valor: '', data_prevista: '' });
    }
    setLoadingParcela(false);
  };

  const progresso = checklist.length ? Math.round((checklist.filter(c => c.concluido).length / checklist.length) * 100) : 0;
  
  // Cálculos financeiros
  const totalPago = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPendente = parcelas.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalGeral = totalPago + totalPendente;

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      {/* Header */}
      <div className="mb-10">
        <Link href="/obras" className="label-mono text-petrol hover:underline mb-4 inline-block">← Voltar para Obras</Link>
        <h1 className="font-serif text-4xl text-petrol-deep mb-2">{obra.nome}</h1>
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
            <div className="flex items-end justify-between border-b border-line pb-2 mb-4">
              <h2 className="font-serif text-2xl text-petrol-deep">Checklist de Cálculo</h2>
              <span className="label-mono">{progresso}% concluído</span>
            </div>
            <ul className="space-y-1">
              {checklist.map((item, i) => (
                <li key={item.id} className="flex items-center gap-4 py-3 border-b border-dotted border-line last:border-0 group cursor-pointer" onClick={() => toggleChecklist(item.id, item.concluido)}>
                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${item.concluido ? 'bg-petrol border-petrol' : 'border-line-strong group-hover:border-petrol'}`}>
                    {item.concluido && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-bg" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <span className={`text-[14.5px] flex-1 transition-opacity ${item.concluido ? 'opacity-50 line-through' : ''}`}>
                    <span className="font-mono text-xs text-ink-faint mr-2">0{i+1}</span>
                    {item.titulo}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Financeiro */}
          <section>
            <div className="flex items-end justify-between border-b border-line pb-2 mb-4">
              <h2 className="font-serif text-2xl text-petrol-deep">Financeiro</h2>
              <button onClick={() => setIsParcelaModalOpen(true)} className="label-mono text-petrol hover:underline">+ Adicionar Parcela</button>
            </div>
            
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-3 gap-px bg-line border border-line-strong mb-6">
              <div className="bg-surface p-4">
                <span className="label-mono block mb-1">Total</span>
                <span className="font-serif text-lg text-petrol-deep">{formatBRL(totalGeral)}</span>
              </div>
              <div className="bg-surface p-4">
                <span className="label-mono block mb-1">Recebido</span>
                <span className="font-serif text-lg text-petrol">{formatBRL(totalPago)}</span>
              </div>
              <div className="bg-surface p-4">
                <span className="label-mono block mb-1">A Receber</span>
                <span className="font-serif text-lg text-terra">{formatBRL(totalPendente)}</span>
              </div>
            </div>

            {/* Lista de Parcelas */}
            {parcelas.length === 0 ? (
              <p className="text-sm text-ink-soft italic">Nenhuma parcela cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {parcelas.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 p-3 border border-line-strong bg-surface group">
                    <button onClick={() => toggleParcela(p.id, p.status)} className={`w-5 h-5 border flex flex-shrink-0 items-center justify-center transition-colors ${p.status === 'pago' ? 'bg-petrol border-petrol' : 'border-line-strong group-hover:border-petrol'}`}>
                      {p.status === 'pago' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-bg" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </button>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <span className={`text-[14.5px] block ${p.status === 'pago' ? 'opacity-50 line-through' : ''}`}>{p.descricao}</span>
                        {p.data_prevista && <span className="label-mono text-ink-faint">Previsto: {new Date(p.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <span className={`font-mono text-sm ${p.status === 'pago' ? 'text-petrol' : 'text-ink-soft'}`}>
                        {formatBRL(Number(p.valor))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-8">
          <section className="bg-surface p-6 border border-line-strong sticky top-20">
            <h2 className="font-serif text-xl text-petrol-deep mb-6">Premissas de Cálculo</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="label-mono">fck (MPa)</label>
                <select value={premissas.fck} onChange={e => setPremissas({...premissas, fck: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-1 text-sm focus:outline-none focus:border-petrol">
                  <option value="">Não definido</option>
                  {[20,25,30,35,40].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">CAA (NBR 6118)</label>
                <select value={premissas.caa} onChange={e => setPremissas({...premissas, caa: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-1 text-sm focus:outline-none focus:border-petrol">
                  <option value="">Não definido</option>
                  {['I','II','III','IV'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">σsolo (kPa)</label>
                  <input type="number" value={premissas.sigma_solo} onChange={e => setPremissas({...premissas, sigma_solo: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-1 text-sm focus:outline-none focus:border-petrol" />
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Cobr. (mm)</label>
                  <input type="number" value={premissas.cobrimento} onChange={e => setPremissas({...premissas, cobrimento: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-1 text-sm focus:outline-none focus:border-petrol" />
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <label className="label-mono">Outras Notas</label>
                <textarea value={premissas.outras} onChange={e => setPremissas({...premissas, outras: e.target.value})} className="w-full bg-transparent border border-line-strong p-2 text-sm focus:outline-none focus:border-petrol min-h-[80px] resize-none" placeholder="Ex: Presença de rocha no solo..." />
              </div>
              <button onClick={savePremissas} disabled={loading} className="w-full py-2 mt-2 bg-petrol text-bg text-sm font-medium hover:bg-petrol-deep transition">
                {loading ? 'Salvando...' : 'Salvar Premissas'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Nova Parcela */}
      {isParcelaModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsParcelaModalOpen(false)} />
          <div className="fixed z-50 bg-bg inset-x-0 bottom-0 h-auto border-t border-line-strong p-6 md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right">
            <h2 className="font-serif text-xl text-petrol-deep mb-6">Nova Parcela</h2>
            <form onSubmit={handleCreateParcela} className="space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Descrição</label>
                <input required value={formParcela.descricao} onChange={e => setFormParcela({...formParcela, descricao: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-2 text-lg focus:outline-none focus:border-petrol" placeholder="Ex: Entrega de formas" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Valor (R$)</label>
                <input required type="number" step="0.01" value={formParcela.valor} onChange={e => setFormParcela({...formParcela, valor: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-2 text-lg focus:outline-none focus:border-petrol" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Data Prevista (Opcional)</label>
                <input type="date" value={formParcela.data_prevista} onChange={e => setFormParcela({...formParcela, data_prevista: e.target.value})} className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol" />
              </div>
              <button type="submit" disabled={loadingParcela} className="w-full py-3 mt-4 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
                {loadingParcela ? 'Salvando...' : 'Adicionar Parcela'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
