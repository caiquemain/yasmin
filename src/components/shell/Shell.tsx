'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { EscritorioFilter } from './EscritorioFilter';
import { QuickAdd } from '../ui/QuickAdd';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useState } from 'react';
import { Home, CalendarDays, Building2, Settings, AlertCircle, Plus } from 'lucide-react';

const items = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/obras', label: 'Obras', icon: Building2 },
  { href: '/config', label: 'Config', icon: Settings },
];

export function Shell({ profile, escritorios, children, badges = {} }: any) {
  const pathname = usePathname();
  const search = useSearchParams();
  const escAtual = search.get('esc') ?? 'todos';
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="min-h-[100dvh] flex bg-bg dark:bg-dark-bg dark:bg-dark-bg text-ink dark:text-dark-ink dark:text-dark-ink transition-colors duration-300">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-60 bg-surface dark:bg-dark-surface dark:bg-dark-surface border-r border-line dark:border-dark-line-strong dark:border-dark-line dark:border-dark-line flex-col py-6 shrink-0 transition-colors">
        <div className="flex items-center justify-between px-6 pb-5 border-b border-line dark:border-dark-line dark:border-dark-line mb-4">
          <div className="font-logo text-2xl text-petrol-deep dark:text-petrol dark:text-petrol">Yasmin<span className="text-terra dark:text-terra">.</span></div>
          <ThemeToggle />
        </div>
        
        <nav className="flex flex-col gap-1 px-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link key={it.href} href={it.href} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition ${active(it.href) ? 'bg-petrol/10 text-petrol-deep dark:text-petrol dark:text-petrol font-medium' : 'text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft dark:text-dark-inkSoft hover:text-ink dark:text-dark-ink dark:hover:text-dark-ink'}`}>
                <Icon size={18} strokeWidth={1.5} />
                <span>{it.label}</span>
              </Link>
            );
          })}
          <Link href="/pendencias" className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition ${active('/pendencias') ? 'bg-petrol/10 text-petrol-deep dark:text-petrol dark:text-petrol font-medium' : 'text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft dark:text-dark-inkSoft hover:text-ink dark:text-dark-ink dark:hover:text-dark-ink'}`}>
            <AlertCircle size={18} strokeWidth={1.5} />
            <span className="flex-1">Pendências</span>
            {badges.pendencias > 0 && <span className="font-mono text-2xs bg-terra text-white px-1.5 py-0.5 tracking-wider">{badges.pendencias}</span>}
          </Link>
        </nav>

        <div className="mt-auto px-6 pt-4 border-t border-line dark:border-dark-line dark:border-dark-line flex items-center gap-2 label-mono">
          <span className="w-7 h-7 flex items-center justify-center bg-petrol text-bg font-serif text-sm tracking-normal">{profile?.nome?.[0]?.toUpperCase() ?? 'Y'}</span>
          <span className="truncate">{profile?.nome ?? 'Yasmin'}</span>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        {/* Header Mobile (apenas para o filtro e o Toggle) */}
        <div className="border-b border-line dark:border-dark-line dark:border-dark-line bg-bg dark:bg-dark-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 py-2">
          {escritorios.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="label-mono hidden sm:inline">Escritório</span>
              <EscritorioFilter escritorios={escritorios} atual={escAtual} />
            </div>
          ) : <div />}
          <div className="md:hidden"><ThemeToggle /></div>
        </div>

        {children}
      </main>

      {/* Bottom Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface dark:bg-dark-surface dark:bg-dark-surface border-t border-line dark:border-dark-line-strong dark:border-dark-line dark:border-dark-line flex items-center justify-between px-2 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active(it.href);
          return (
            <Link key={it.href} href={it.href} className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition ${isActive ? 'text-petrol-deep dark:text-petrol dark:text-petrol' : 'text-ink dark:text-dark-ink-faint dark:text-dark-inkSoft dark:text-dark-inkSoft'}`}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="label-mono text-[9px]">{it.label}</span>
            </Link>
          );
        })}
        
        {/* FAB Central Mobile */}
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <button onClick={() => setIsQuickAddOpen(true)} className="absolute -top-5 w-14 h-14 bg-petrol-deep dark:bg-petrol text-bg flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Plus size={24} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* FAB Desktop */}
      <button onClick={() => setIsQuickAddOpen(true)} className="hidden md:flex fixed bottom-8 right-8 w-12 h-12 bg-petrol-deep dark:bg-petrol text-bg items-center justify-center shadow-xl hover:bg-petrol dark:hover:bg-petrol-deep transition z-40">
        <Plus size={24} strokeWidth={2} />
      </button>

      <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  );
}
