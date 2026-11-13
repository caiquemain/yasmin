'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function ObraDetailClient({ obra, checklist: initialChecklist }: { obra: any, checklist: any[] }) {
  const supabase = createClient();
  const [checklist, setChecklist] = useState(initialChecklist);
  const [loading, setLoading] = useState(false);

  // Premissas (estado local)
  const [premissas, setPremissas] = useState({
    fck: obra.premissa_fck || '',
    caa: obra.premissa_caa || '',
    sigma_solo: obra.premissa_sigma_solo || '',
    cobrimento: obra.premissa_cobrimento || '',
    outras: obra.premissa_outras || '',
  });

  const toggleChecklist = async (id: string, concluido: boolean) => {
    // Atualiza otimista na tela
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, concluido: !concluido } : c));
    
    // Salva no banco
    await supabase.from('obra_checklist').update({ 
      concluido: !concluido, 
      concluido_em: !concluido ? new Date().toISOString() : null 
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

  const progresso = checklist.length ? Math.round((checklist.filter(c => c.concluido).length / checklist.length) * 100) : 0;

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      {/* Header da Obra */}
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
        {/* Coluna Esquerda: Checklist e Financeiro */}
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

          {/* Financeiro Placeholder */}
          <section>
            <h2 className="font-serif text-2xl text-petrol-deep border-b border-line pb-2 mb-4">Financeiro</h2>
            <div className="p-4 bg-surface border border-line-strong flex justify-between items-center">
              <div>
                <span className="label-mono block">Honorários Totais</span>
                <span className="font-serif text-xl">R$ {obra.honorarios_total?.toLocaleString('pt-BR') || '0,00'}</span>
              </div>
              <button className="px-4 py-2 border border-line-strong label-mono hover:bg-bg">+ Adicionar Parcela</button>
            </div>
          </section>
        </div>

        {/* Coluna Direita: Premissas e ART */}
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

          <section className="bg-surface p-6 border border-line-strong">
            <h2 className="font-serif text-xl text-petrol-deep mb-4">ART</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="label-mono">Status</span>
                <span className="font-mono text-2xs uppercase bg-amber/20 text-amber px-2 py-0.5">{obra.art_status}</span>
              </div>
              <button className="w-full py-2 border border-line-strong label-mono hover:bg-bg">Gerenciar ART</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
