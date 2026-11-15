'use client';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { EscritorioFilter } from './EscritorioFilter';
import { QuickAdd } from '../ui/QuickAdd';
import { SearchModal } from '../ui/SearchModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Tutorial } from '../ui/Tutorial';
import { useState, useEffect } from 'react';
import { Home, CalendarDays, Building2, Settings, AlertCircle, Plus, Wallet, Search, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTrackRoute } from '@/hooks/useTrackRoute';

const items = [
  { href: '/', label: 'Início', icon: Home, tour: 'home' },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays, tour: 'agenda' },
  { href: '/obras', label: 'Obras', icon: Building2, tour: 'obras' },
  { href: '/config', label: 'Config', icon: Settings, tour: 'config' },
];

export function Shell({ profile, escritorios, children, badges = {}, userId }: any) {
  const pathname = usePathname();
  const search = useSearchParams();
  const escAtual = search.get('esc') ?? 'todos';
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [demandaParaEditar, setDemandaParaEditar] = useState<any>(null);
  const [demandaDefaults, setDemandaDefaults] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  useTrackRoute();

  useEffect(() => {
    const handleOpenEditor = async (e: any) => {
      const { demandaId } = e.detail;
      const { data } = await supabase.from('demandas').select('*').eq('id', demandaId).single();
      if (data) {
        setDemandaParaEditar(data);
        setDemandaDefaults(null);
        setIsQuickAddOpen(true);
      }
    };
    const handleOpenNew = (e: any) => {
      setDemandaParaEditar(null);
      setDemandaDefaults(e.detail?.defaults || null);
      setIsQuickAddOpen(true);
    };
    window.addEventListener('open-demanda-editor', handleOpenEditor);
    window.addEventListener('open-demanda-new', handleOpenNew);
    return () => {
      window.removeEventListener('open-demanda-editor', handleOpenEditor);
      window.removeEventListener('open-demanda-new', handleOpenNew);
    };
  }, [supabase]);

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    if (!confirm('Tem certeza que quer sair?')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCloseQuickAdd = () => {
    setIsQuickAddOpen(false);
    setDemandaParaEditar(null);
    setDemandaDefaults(null);
  };

  const handleOpenCreate = () => {
    setDemandaParaEditar(null);
    setDemandaDefaults(null);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="min-h-[100dvh] flex bg-bg dark:bg-dark-bg text-ink dark:text-dark-ink transition-colors duration-300">
      <Tutorial userId={userId} concluido={profile?.tutorial_concluido ?? false} />

      <aside className="hidden md:flex w-60 bg-surface dark:bg-dark-surface border-r border-line-strong dark:border-dark-line flex-col py-6 shrink-0 transition-colors">
        <div className="flex items-center justify-between px-6 pb-5 border-b border-line dark:border-dark-line mb-4">
          <div className="font-logo text-2xl text-petrol-deep dark:text-petrol">Yasmin<span className="text-terra dark:text-terra">.</span></div>
          <ThemeToggle />
        </div>

        <div className="px-4 mb-4">
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))} 
            className="w-full flex items-center justify-between px-3 py-2 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line text-ink-soft dark:text-dark-inkSoft hover:border-petrol transition rounded-sm text-xs"
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>Buscar...</span>
            </div>
            <kbd className="font-mono text-[10px] opacity-50">⌘K</kbd>
          </button>
        </div>
        
        <nav className="flex flex-col gap-1 px-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link key={it.href} href={it.href} data-tour={it.tour} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition ${active(it.href) ? 'bg-petrol/10 text-petrol-deep dark:text-petrol font-medium' : 'text-ink-soft dark:text-dark-inkSoft hover:text-ink dark:hover:text-dark-ink'}`}>
                <Icon size={18} strokeWidth={1.5} />
                <span>{it.label}</span>
              </Link>
            );
          })}
          <Link href="/financeiro" data-tour="financeiro" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition ${active('/financeiro') ? 'bg-petrol/10 text-petrol-deep dark:text-petrol font-medium' : 'text-ink-soft dark:text-dark-inkSoft hover:text-ink dark:hover:text-dark-ink'}`}>
            <Wallet size={18} strokeWidth={1.5} />
            <span>Financeiro</span>
          </Link>
          <Link href="/pendencias" data-tour="pendencias" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition ${active('/pendencias') ? 'bg-petrol/10 text-petrol-deep dark:text-petrol font-medium' : 'text-ink-soft dark:text-dark-inkSoft hover:text-ink dark:hover:text-dark-ink'}`}>
            <AlertCircle size={18} strokeWidth={1.5} />
            <span className="flex-1">Pendências</span>
            {badges.pendencias > 0 && <span className="font-mono text-2xs bg-terra text-white px-1.5 py-0.5 tracking-wider">{badges.pendencias}</span>}
          </Link>
        </nav>

        <div className="mt-auto px-4 pt-4 border-t border-line dark:border-dark-line">
          <div className="flex items-center justify-between" data-tour="avatar">
            <div className="flex items-center gap-3 label-mono min-w-0">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-petrol text-bg font-serif text-sm tracking-normal overflow-hidden rounded-full">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : profile?.nome?.[0]?.toUpperCase() ?? 'Y'}
              </div>
              <span className="truncate">{profile?.nome ?? 'Yasmin'}</span>
            </div>
            <button onClick={handleLogout} title="Sair da conta" className="text-ink-faint hover:text-terra transition p-1">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        <div className="border-b border-line dark:border-dark-line bg-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 py-2 pt-[calc(env(safe-area-inset-top)+8px)]">
          {escritorios.length > 0 ? (
            <div className="flex items-center gap-2 max-w-[60%]">
              <span className="label-mono hidden sm:inline">Escritório</span>
              <EscritorioFilter escritorios={escritorios} atual={escAtual} />
            </div>
          ) : <div />}
          
          <div className="md:hidden flex items-center gap-3 flex-shrink-0">
            <Link href="/financeiro" className={`p-1 transition-colors ${active('/financeiro') ? 'text-petrol' : 'text-ink-soft dark:text-dark-inkSoft'}`}>
              <Wallet size={20} strokeWidth={1.5} />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface dark:bg-dark-surface border-t border-line-strong dark:border-dark-line flex items-center justify-between px-2 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
        {items.slice(0, 2).map((it) => {
          const Icon = it.icon;
          const isActive = active(it.href);
          return (
            <Link key={it.href} href={it.href} data-tour={`${it.tour}-mobile`} className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition ${isActive ? 'text-petrol-deep dark:text-petrol' : 'text-ink-faint dark:text-dark-inkSoft'}`}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="label-mono text-[9px]">{it.label}</span>
            </Link>
          );
        })}
        
        <div className="flex-1 flex flex-col items-center justify-center min-h-[56px]" data-tour="fab-mobile">
          <button onClick={handleOpenCreate} className="w-[36px] h-[36px] bg-petrol-deep dark:bg-petrol text-bg flex items-center justify-center rounded-full shadow-sm active:scale-95 transition-transform">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {items.slice(2, 4).map((it) => {
          const Icon = it.icon;
          const isActive = active(it.href);
          return (
            <Link key={it.href} href={it.href} data-tour={`${it.tour}-mobile`} className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition ${isActive ? 'text-petrol-deep dark:text-petrol' : 'text-ink-faint dark:text-dark-inkSoft'}`}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="label-mono text-[9px]">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={handleOpenCreate} className="hidden md:flex fixed bottom-8 right-8 w-12 h-12 bg-petrol-deep dark:bg-petrol text-bg items-center justify-center shadow-xl hover:bg-petrol dark:hover:bg-petrol-deep transition z-40" data-tour="fab">
        <Plus size={24} strokeWidth={2} />
      </button>

      <SearchModal />
      <QuickAdd 
        isOpen={isQuickAddOpen} 
        onClose={handleCloseQuickAdd} 
        userId={userId} 
        demanda={demandaParaEditar} 
        defaults={demandaDefaults}
      />
    </div>
  );
}
