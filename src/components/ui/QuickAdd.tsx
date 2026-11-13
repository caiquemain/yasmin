'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function QuickAdd({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);

  const [form, setForm] = useState({
    tipo: 'tarefa',
    titulo: '',
    descricao: '',
    categoria_id: '',
    obra_id: '',
    revisao: '',
    status: 'a_fazer',
    prioridade: 'media',
    data: new Date().toLocaleDateString('sv-SE'),
    hora_inicio: '',
  });

  useEffect(() => {
    if (isOpen) {
      supabase.from('categorias').select('id, nome').order('ordem').then(({ data }) => setCategorias(data || []));
      supabase.from('obras').select('id, nome, clientes(nome)').order('created_at', { ascending: false }).then(({ data }) => setObras(data || []));
    }
  }, [isOpen, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Pega o usuário logado para preencher o user_id
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id, // <-- AQUI ESTÁ A CORREÇÃO
      tipo: form.tipo,
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria_id: form.categoria_id || null,
      obra_id: form.obra_id || null,
      revisao: form.revisao || null,
      status: form.status,
      prioridade: form.prioridade,
      data: form.data,
      hora_inicio: form.hora_inicio || null,
    };

    const { error } = await supabase.from('demandas').insert([payload]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setForm({ ...form, titulo: '', descricao: '', revisao: '', hora_inicio: '' });
      onClose();
      window.location.reload(); 
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed z-50 flex flex-col bg-bg border-line-strong shadow-2xl overflow-hidden inset-x-0 bottom-0 h-[90vh] border-t md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="font-serif text-xl text-petrol-deep">Nova demanda</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-2 p-1 bg-surface border border-line-strong">
            {['tarefa', 'compromisso'].map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                className={`flex-1 py-1.5 text-sm capitalize transition ${form.tipo === t ? 'bg-petrol text-bg' : 'text-ink-soft hover:bg-line/50'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="label-mono">Título</label>
            <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full bg-transparent border-b border-line-strong py-2 text-lg focus:outline-none focus:border-petrol placeholder:text-ink-faint"
              placeholder="Ex: Revisar pranchas Ed. Aurora" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-mono">Categoria</label>
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol">
                <option value="">Nenhuma</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-mono">Vincular Obra</label>
              <select value={form.obra_id} onChange={(e) => setForm({ ...form, obra_id: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol">
                <option value="">Nenhuma</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.clientes?.nome} - {o.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-mono">Revisão</label>
              <input value={form.revisao} onChange={(e) => setForm({ ...form, revisao: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol placeholder:text-ink-faint"
                placeholder="Ex: R01" />
            </div>
            <div className="space-y-1">
              <label className="label-mono">Prioridade</label>
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-mono">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol">
              <option value="a_fazer">A fazer</option>
              <option value="em_andamento">Em andamento</option>
              <option value="aguardando_terceiros">Aguardando terceiros</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-mono">Data</label>
              <input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol" />
            </div>
            <div className="space-y-1">
              <label className="label-mono">Hora (opcional)</label>
              <input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong py-2 text-sm focus:outline-none focus:border-petrol" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-mono">Notas / Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full bg-transparent border border-line-strong p-2 text-sm focus:outline-none focus:border-petrol min-h-[100px] resize-none"
              placeholder="Detalhes adicionais..." />
          </div>
        </form>

        <div className="p-4 border-t border-line bg-surface">
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar demanda'}
          </button>
        </div>
      </div>
    </>
  );
}
