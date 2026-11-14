'use client';
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2 } from 'lucide-react';

export function ConfigClient({ profile, escritorios: initialEscritorios, categorias: initialCategorias, userId }: any) {
  const supabase = createClient();
  const [nome, setNome] = useState(profile?.nome || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [novoEscritorio, setNovoEscritorio] = useState('');
  const [escritorios, setEscritorios] = useState(initialEscritorios);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categorias, setCategorias] = useState(initialCategorias);
  const [exportando, setExportando] = useState(false);

  const savePerfil = async () => {
    setLoadingPerfil(true);
    await supabase.from('profiles').update({ nome }).eq('id', userId);
    setLoadingPerfil(false);
    window.location.reload();
  };

  // Função para fazer o upload da foto
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      // Faz upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pega a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Salva a URL no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
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

  const urlICS = typeof window !== 'undefined' && profile?.calendar_token
    ? `${window.location.origin}/api/calendar/${profile.calendar_token}`
    : '';

  return (
    <div className="space-y-10">
      {/* Perfil */}
      <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-6">Perfil</h2>
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
          {/* Avatar Upload */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-full bg-petrol text-bg flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-petrol transition">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-3xl">{nome?.[0]?.toUpperCase() ?? 'Y'}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              {uploadingAvatar ? <Loader2 className="text-white animate-spin" size={20} /> : <Camera className="text-white" size={20} />}
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
          </div>

          <div className="flex-1 w-full space-y-1">
            <label className="label-mono">Como você quer ser chamada?</label>
            <div className="flex gap-4 items-end">
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="flex-1 bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-lg focus:outline-none focus:border-petrol text-ink dark:text-dark-ink" />
              <button onClick={savePerfil} disabled={loadingPerfil} className="px-6 py-2 bg-petrol-deep text-bg label-mono hover:bg-petrol transition">{loadingPerfil ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Escritórios */}
      <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Escritórios</h2>
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft mb-6">Onde você presta serviço como calculista.</p>
        <ul className="space-y-2 mb-6">
          {escritorios.map((e: any) => (
            <li key={e.id} className="flex justify-between items-center py-2 border-b border-dotted border-line dark:border-dark-line last:border-0 text-ink dark:text-dark-ink">
              <span className="font-medium">{e.nome}</span>
              <button onClick={() => archiveEscritorio(e.id)} className="label-mono text-terra hover:underline">Arquivar</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addEscritorio} className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="label-mono">Novo escritório</label>
            <input type="text" value={novoEscritorio} onChange={e => setNovoEscritorio(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm text-ink dark:text-dark-ink focus:outline-none focus:border-petrol placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Escritório de Arquitetura Silva" />
          </div>
          <button type="submit" className="px-4 py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition text-ink dark:text-dark-ink">Adicionar</button>
        </form>
      </section>

      {/* Categorias */}
      <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Categorias</h2>
        <ul className="grid grid-cols-2 gap-2 mb-6">
          {categorias.map((c: any) => (
            <li key={c.id} className="flex justify-between items-center py-2 border-b border-dotted border-line dark:border-dark-line">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor }} /><span className="text-sm text-ink dark:text-dark-ink">{c.nome}</span></div>
              <button onClick={() => deleteCategoria(c.id)} className="text-xs text-ink-faint dark:text-dark-inkSoft hover:text-terra transition">excluir</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addCategoria} className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="label-mono">Nova categoria</label>
            <input type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm text-ink dark:text-dark-ink focus:outline-none focus:border-petrol placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft" placeholder="Ex: Reuniões" />
          </div>
          <button type="submit" className="px-4 py-2 border border-line-strong dark:border-dark-line label-mono hover:bg-bg dark:hover:bg-dark-bg transition text-ink dark:text-dark-ink">Adicionar</button>
        </form>
      </section>

      {/* Sincronizar Agenda */}
      <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Sincronizar Agenda</h2>
        <p className="text-sm text-ink-soft dark:text-dark-inkSoft mb-6">Adicione o link abaixo no seu Google Agenda (Outros calendários &gt; De URL).</p>
        <div className="flex gap-2">
          <input readOnly value={urlICS} className="flex-1 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line p-2 text-xs font-mono text-ink-soft dark:text-dark-inkSoft focus:outline-none" />
          <button onClick={() => { navigator.clipboard.writeText(urlICS); alert('Link seguro copiado!'); }} className="px-4 py-2 bg-petrol text-bg label-mono hover:bg-petrol-deep transition">Copiar</button>
        </div>
      </section>

      {/* Dados */}
      <section className="bg-surface dark:bg-dark-surface p-6 border border-line-strong dark:border-dark-line">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">Dados</h2>
        <button onClick={exportarDados} disabled={exportando} className="mt-4 px-6 py-2 bg-petrol text-bg label-mono hover:bg-petrol-deep transition">{exportando ? 'Gerando...' : 'Baixar Backup (JSON)'}</button>
      </section>
    </div>
  );
}
