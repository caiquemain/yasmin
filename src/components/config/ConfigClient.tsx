'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2, Bell, BellRing } from 'lucide-react';
import { PageTour } from '@/components/ui/PageTour';

export function ConfigClient({ profile, escritorios: initialEscritorios, categorias: initialCategorias, userId }: any) {
  const supabase = createClient();
  const [nome, setNome] = useState(profile?.nome || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [testandoPush, setTestandoPush] = useState(false);

  const [novoEscritorio, setNovoEscritorio] = useState('');
  const [escritorios, setEscritorios] = useState(initialEscritorios);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categorias, setCategorias] = useState(initialCategorias);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') setIsSubscribed(true);
  }, []);

  const savePerfil = async () => {
    setLoadingPerfil(true);
    await supabase.from('profiles').update({ nome }).eq('id', userId);
    setLoadingPerfil(false);
    window.location.reload();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const filePath = `${userId}/${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const ativarNotificacoes = async () => {
    try {
      setLoadingPush(true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert('Você precisa permitir as notificações nas configurações do navegador.'); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY });
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
      setIsSubscribed(true);
    } catch (error: any) { alert('Erro ao ativar notificações: ' + error.message); } finally { setLoadingPush(false); }
  };

  const testarNotificacao = async () => {
    setTestandoPush(true);
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (data.error) alert(data.error);
    setTestandoPush(false);
  };

  const addEscritorio = async (e: React.FormEvent) => {
    e.preventDefault(); if (!novoEscritorio) return;
    const { data, error } = await supabase.from('escritorios').insert([{ user_id: userId, nome: novoEscritorio }]).select().single();
    if (!error && data) { setEscritorios([...escritorios, data]); setNovoEscritorio(''); }
  };

  const archiveEscritorio = async (id: string) => {
    if (!confirm('Arquivar este escritório?')) return;
    await supabase.from('escritorios').update({ arquivado: true }).eq('id', id);
    setEscritorios(escritorios.filter((e: any) => e.id !== id));
  };

  const addCategoria = async (e: React.FormEvent) => {
    e.preventDefault(); if (!novaCategoria) return;
    const { data, error } = await supabase.from('categorias').insert([{ user_id: userId, nome: novaCategoria, cor: '#C85A7E' }]).select().single();
    if (!error && data) { setCategorias([...categorias, data]); setNovaCategoria(''); }
  };

  const deleteCategoria = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    await supabase.from('categorias').delete().eq('id', id);
    setCategorias(categorias.filter((c: any) => c.id !== id));
  };

  const exportarDados = async () => {
    setExportando(true);
    const [dem, obr, cli, esc, cat] = await Promise.all([
      supabase.from('demandas').select('*'), supabase.from('obras').select('*'), supabase.from('clientes').select('*'), supabase.from('escritorios').select('*'), supabase.from('categorias').select('*')
    ]);
    const backup = { demandas: dem.data, obras: obr.data, clientes: cli.data, escritorios: esc.data, categorias: cat.data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `yasmin-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
    setExportando(false);
  };

  const urlICS = typeof window !== 'undefined' && profile?.calendar_token ? `${window.location.origin}/api/calendar/${profile.calendar_token}` : '';

  const tourSteps = [
    { element: 'body', popover: { title: 'Configurações', description: 'Aqui você ajusta o seu perfil e o comportamento do app.' } },
    { element: '[data-tour="config-push"]', popover: { title: 'Notificações Push', description: 'Ative para receber lembretes no celular, mesmo com o app fechado!', side: 'bottom' as const, align: 'start' as const } },
    { element: '[data-tour="config-perfil"]', popover: { title: 'Seu Perfil', description: 'Clique na foto para trocá-la e altere como quer ser chamada.', side: 'top' as const, align: 'start' as const } },
    { element: '[data-tour="config-escritorios"]', popover: { title: 'Escritórios', description: 'Cadastre os escritórios onde você presta serviço. Isso organiza o filtro no topo do app.', side: 'top' as const, align: 'start' as const } },
    { element: '[data-tour="config-categorias"]', popover: { title: 'Categorias', description: 'As categorias servem para organizar suas tarefas (Obras, Faculdade, Pessoal).', side: 'top' as const, align: 'start' as const } },
    { element: '[data-tour="config-agenda"]', popover: { title: 'Sincronizar Agenda', description: 'Copie o link e adicione no Google Agenda. Suas tarefas vão aparecer lá automaticamente.', side: 'top' as const, align: 'start' as const } },
    { element: '[data-tour="config-dados"]', popover: { title: 'Backup', description: 'Baixe um arquivo com todos os seus dados para nunca perder nada.', side: 'top' as const, align: 'start' as const } }
  ];

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      <PageTour storageKey="tour_config_v1" steps={tourSteps} />

      <section data-tour="config-push" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Notificações Push</h2>
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft mb-6">Ative para receber lembretes no celular mesmo com o app fechado.</p>
        <div className="flex flex-col md:flex-row gap-3">
          {!isSubscribed ? (
            <button onClick={ativarNotificacoes} disabled={loadingPush} className="flex-1 flex items-center justify-center gap-2 py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50"><Bell size={18} /> {loadingPush ? 'Ativando...' : 'Ativar Notificações'}</button>
          ) : (
            <button onClick={testarNotificacao} disabled={testandoPush} className="flex-1 flex items-center justify-center gap-2 py-3 border border-line-strong dark:border-dark-line text-petrol-deep dark:text-petrol text-sm font-medium hover:bg-bg dark:hover:bg-dark-bg transition disabled:opacity-50"><BellRing size={18} /> {testandoPush ? 'Enviando...' : 'Enviar Notificação de Teste'}</button>
          )}
        </div>
      </section>

      <section data-tour="config-perfil" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-6">Perfil</h2>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-full bg-petrol text-bg flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-petrol transition">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <span className="font-serif text-3xl">{nome?.[0]?.toUpperCase() ?? 'Y'}</span>}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              {uploadingAvatar ? <Loader2 className="text-white animate-spin" size={20} /> : <Camera className="text-white" size={20} />}
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
          </div>
          <div className="flex-1 w-full space-y-3">
            <label className="label-mono block">Como você quer ser chamada?</label>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full">
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
              <button onClick={savePerfil} disabled={loadingPerfil} className="w-full md:w-auto px-6 py-2 bg-petrol-deep text-bg label-mono hover:bg-petrol transition flex-shrink-0">{loadingPerfil ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      </section>

      <section data-tour="config-escritorios" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Escritórios</h2>
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft mb-6">Onde você presta serviço como calculista.</p>
        <ul className="space-y-2 mb-6 w-full">
          {escritorios.map((e: any) => (
            <li key={e.id} className="flex flex-wrap justify-between items-center py-2 border-b border-dotted border-line dark:border-dark-line last:border-0 text-ink dark:text-dark-ink gap-2">
              <span className="font-medium truncate max-w-[70%]">{e.nome}</span>
              <button onClick={() => archiveEscritorio(e.id)} className="label-mono text-terra hover:underline text-xs">Arquivar</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addEscritorio} className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full">
          <div className="flex-1 space-y-1 w-full"><label className="label-mono">Novo escritório</label><input type="text" value={novoEscritorio} onChange={e => setNovoEscritorio(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm text-ink dark:text-dark-ink focus:outline-none focus:border-petrol placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Escritório de Arquitetura" /></div>
          <button type="submit" className="w-full md:w-auto px-4 py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition text-ink dark:text-dark-ink flex-shrink-0">Adicionar</button>
        </form>
      </section>

      <section data-tour="config-categorias" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Categorias</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 w-full">
          {categorias.map((c: any) => (
            <li key={c.id} className="flex justify-between items-center py-2 border-b border-dotted border-line dark:border-dark-line">
              <div className="flex items-center gap-2 truncate pr-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} /><span className="text-sm text-ink dark:text-dark-ink truncate">{c.nome}</span></div>
              <button onClick={() => deleteCategoria(c.id)} className="text-xs text-ink-faint dark:text-dark-inkSoft hover:text-terra transition flex-shrink-0">excluir</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addCategoria} className="flex flex-col md:flex-row gap-3 items-start md:items-end w-full">
          <div className="flex-1 space-y-1 w-full"><label className="label-mono">Nova categoria</label><input type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm text-ink dark:text-dark-ink focus:outline-none focus:border-petrol placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Reuniões" /></div>
          <button type="submit" className="w-full md:w-auto px-4 py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition text-ink dark:text-dark-ink flex-shrink-0">Adicionar</button>
        </form>
      </section>

      <section data-tour="config-agenda" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Sincronizar Agenda</h2>
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft mb-6">Adicione o link abaixo no seu Google Agenda (Outros calendários &gt; De URL).</p>
        <div className="flex flex-col md:flex-row gap-3 w-full">
          <input readOnly value={urlICS} className="flex-1 min-w-0 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line p-2 text-xs font-mono text-ink-soft dark:text-dark-inkSoft focus:outline-none" />
          <button onClick={() => { navigator.clipboard.writeText(urlICS); alert('Link seguro copiado!'); }} className="w-full md:w-auto px-4 py-2 bg-petrol text-bg label-mono hover:bg-petrol-deep transition flex-shrink-0">Copiar</button>
        </div>
      </section>

      <section data-tour="config-dados" className="bg-surface dark:bg-dark-surface p-5 md:p-6 border border-line-strong dark:border-dark-line w-full">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Dados</h2>
        <button onClick={exportarDados} disabled={exportando} className="w-full md:w-auto mt-4 px-6 py-2 bg-petrol text-bg label-mono hover:bg-petrol-deep transition">{exportando ? 'Gerando...' : 'Baixar Backup (JSON)'}</button>
      </section>
    </div>
  );
}
