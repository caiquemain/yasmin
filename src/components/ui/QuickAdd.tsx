'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import { enqueueAction } from '@/lib/offline/syncManager';

export function QuickAdd({ 
  isOpen, 
  onClose, 
  userId, 
  demanda, 
  defaults 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: string; 
  demanda?: any; 
  defaults?: { obra_id?: string; cliente_id?: string } 
}) {
  const supabase = createClient();
  const isEditing = !!demanda;
  
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [savedOffline, setSavedOffline] = useState(false);

  const [form, setForm] = useState({
    tipo: 'tarefa', titulo: '', descricao: '', categoria_id: '', obra_id: '', revisao: '',
    status: 'a_fazer', prioridade: 'media', data: new Date().toLocaleDateString('sv-SE'),
    hora_inicio: '', recorrencia: 'none',
  });

  useEffect(() => {
    if (isOpen && demanda) {
      setForm({
        tipo: demanda.tipo || 'tarefa',
        titulo: demanda.titulo || '',
        descricao: demanda.descricao || '',
        categoria_id: demanda.categoria_id || '',
        obra_id: demanda.obra_id || '',
        revisao: demanda.revisao || '',
        status: demanda.status || 'a_fazer',
        prioridade: demanda.prioridade || 'media',
        data: demanda.data || new Date().toLocaleDateString('sv-SE'),
        hora_inicio: demanda.hora_inicio ? demanda.hora_inicio.slice(0, 5) : '',
        recorrencia: demanda.recorrencia || 'none',
      });
    } else if (isOpen && !demanda) {
      setForm({
        tipo: 'tarefa', titulo: '', descricao: '', categoria_id: '',
        obra_id: defaults?.obra_id || '',
        revisao: '', status: 'a_fazer', prioridade: 'media',
        data: new Date().toLocaleDateString('sv-SE'),
        hora_inicio: '', recorrencia: 'none',
      });
    }
  }, [isOpen, demanda, defaults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setSavedOffline(false);

    const loadDependencies = async () => {
      const cachedCat = localStorage.getItem('yasmin_cached_categorias');
      const cachedObra = localStorage.getItem('yasmin_cached_obras');
      if (cachedCat) setCategorias(JSON.parse(cachedCat));
      if (cachedObra) setObras(JSON.parse(cachedObra));

      if (navigator.onLine) {
        const [catRes, obraRes] = await Promise.all([
          supabase.from('categorias').select('id, nome').order('ordem'),
          supabase.from('obras').select('id, nome, clientes(nome)').order('created_at', { ascending: false })
        ]);
        if (catRes.data) {
          setCategorias(catRes.data);
          localStorage.setItem('yasmin_cached_categorias', JSON.stringify(catRes.data));
        }
        if (obraRes.data) {
          setObras(obraRes.data);
          localStorage.setItem('yasmin_cached_obras', JSON.stringify(obraRes.data));
        }
      }
    };
    loadDependencies();
  }, [isOpen, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!form.titulo.trim()) { alert('Por favor, preencha o título.'); return; }

    setLoading(true);

    try {
      const basePayload = {
        user_id: userId,
        tipo: form.tipo,
        titulo: form.titulo,
        descricao: form.descricao || null,
        categoria_id: form.categoria_id || null,
        obra_id: form.obra_id || null,
        revisao: form.revisao || null,
        status: form.status,
        prioridade: form.prioridade,
        hora_inicio: form.hora_inicio || null,
        recorrencia: form.recorrencia,
        data: form.data,
      };

      if (isEditing) {
        if (!navigator.onLine) {
          alert('Edição requer conexão com a internet.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.from('demandas').update(basePayload).eq('id', demanda.id);
        if (error) { alert('Erro ao salvar: ' + error.message); setLoading(false); return; }
        onClose();
        window.location.reload();
        return;
      }

      const dataBase = new Date(form.data + 'T12:00:00');
      const parentId = crypto.randomUUID();
      const payloads: any[] = [];

      if (form.recorrencia === 'none') {
        payloads.push({ ...basePayload, parent_id: parentId });
      } else {
        for (let i = 0; i < 4; i++) {
          let novaData = dataBase;
          if (form.recorrencia === 'daily') novaData = addDays(dataBase, i);
          if (form.recorrencia === 'weekly') novaData = addWeeks(dataBase, i);
          if (form.recorrencia === 'monthly') novaData = addMonths(dataBase, i);
          payloads.push({ ...basePayload, data: format(novaData, 'yyyy-MM-dd'), parent_id: parentId });
        }
      }

      if (!navigator.onLine) {
        payloads.forEach(p => enqueueAction('create_demanda', p));
        setSavedOffline(true);
        setLoading(false);
        setTimeout(() => onClose(), 1500);
        return;
      }

      const { error } = await supabase.from('demandas').insert(payloads);
      if (error) {
        if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
          payloads.forEach(p => enqueueAction('create_demanda', p));
          setSavedOffline(true);
          setLoading(false);
          setTimeout(() => onClose(), 1500);
          return;
        }
        alert('Erro ao salvar: ' + error.message);
        setLoading(false);
        return;
      }

      onClose();
      window.location.reload();
    } catch (err: any) {
      alert('Erro inesperado: ' + (err?.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const msg = demanda.parent_id
      ? 'Esta tarefa faz parte de uma série recorrente. Deseja excluir TODAS as futuras desta série?'
      : 'Excluir esta tarefa?';
    if (!confirm(msg)) return;

    setLoading(true);
    if (demanda.parent_id && confirm('Confirmar exclusão de TODA a série recorrente?')) {
      await supabase.from('demandas').delete().eq('parent_id', demanda.parent_id);
    } else {
      await supabase.from('demandas').delete().eq('id', demanda.id);
    }
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed z-50 flex flex-col bg-bg dark:bg-dark-surface border-line-strong dark:border-dark-line shadow-2xl overflow-hidden inset-x-0 bottom-0 h-[100dvh] border-t md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-dark-line">
          <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">
            {isEditing ? 'Editar demanda' : 'Nova demanda'}
          </h2>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={handleDelete} className="text-ink-faint hover:text-terra transition p-1" title="Excluir">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink transition"><X size={20} strokeWidth={1.5} /></button>
          </div>
        </div>

        {savedOffline ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber/20 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 className="font-serif text-xl text-petrol-deep dark:text-petrol mb-2">Salvo localmente!</h3>
            <p className="text-sm text-ink-soft dark:text-dark-inkSoft max-w-xs">Sua tarefa foi guardada. Assim que a internet voltar, será sincronizada.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex gap-2 p-1 bg-surface dark:bg-dark-bg border border-line-strong dark:border-dark-line">
              {['tarefa', 'compromisso'].map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, tipo: t })}
                  className={`flex-1 py-1.5 text-sm capitalize transition ${form.tipo === t ? 'bg-petrol text-bg' : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="label-mono">Título</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                placeholder="Ex: Revisar pranchas Ed. Aurora" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label-mono">Categoria</label>
                <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Nenhuma</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Vincular Obra</label>
                <select value={form.obra_id} onChange={(e) => setForm({ ...form, obra_id: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="">Nenhuma</option>
                  {obras.map(o => <option key={o.id} value={o.id}>{o.clientes?.nome} - {o.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label-mono">Revisão</label>
                <input value={form.revisao} onChange={(e) => setForm({ ...form, revisao: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                  placeholder="Ex: R01" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Prioridade</label>
                <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label-mono">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="a_fazer">A fazer</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="aguardando_terceiros">Aguardando terceiros</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-mono">Repetir</label>
                <select value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink">
                  <option value="none">Nunca</option>
                  <option value="daily">Diariamente (4x)</option>
                  <option value="weekly">Semanalmente (4x)</option>
                  <option value="monthly">Mensalmente (4x)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="label-mono">Data</label>
                <input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
              </div>
              <div className="space-y-1">
                <label className="label-mono">Hora</label>
                <input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="label-mono">Notas / Descrição</label>
              <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full bg-transparent border border-line-strong dark:border-dark-line p-2 text-sm focus:outline-none focus:border-petrol min-h-[80px] resize-none text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                placeholder="Detalhes adicionais..." />
            </div>
          </form>
        )}

        {!savedOffline && (
          <div className="p-4 border-t border-line dark:border-dark-line bg-surface dark:bg-dark-surface">
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">
              {loading ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar demanda')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
