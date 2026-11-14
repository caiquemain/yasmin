'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { EscritorioFilter } from './EscritorioFilter';
import { QuickAdd } from '../ui/QuickAdd';
import { useState } from 'react';

const items = [
  { href: '/', label: 'Início' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/obras', label: 'Obras' },
  { href: '/config', label: 'Config' },
];

export function Shell({ profile, escritorios, children, badges = {} }: any) {
  const pathname = usePathname();
  const search = useSearchParams();
  const escAtual = search.get('esc') ?? 'todos';
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-bg text-ink">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-60 bg-surface border-r border-line-strong flex-col py-6 shrink-0">
        <div className="font-logo text-2xl text-petrol-deep px-6 pb-5 border-b border-line mb-4">Yasmin<span className="text-terra">.</span></div>
        <nav className="flex flex-col">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className={`flex justify-between items-center px-6 py-2.5 text-sm border-l-2 transition ${active(it.href) ? 'border-petrol bg-petrol/[0.04] text-petrol-deep font-medium' : 'border-transparent text-ink-soft hover:text-ink'}`}>
              <span>{it.label}</span>
            </Link>
          ))}
          <Link href="/pendencias" className="flex justify-between items-center px-6 py-2.5 text-sm border-l-2 border-transparent text-ink-soft hover:text-ink transition">
            <span>Pendências</span>
            {badges.pendencias > 0 && <span className="font-mono text-2xs bg-terra text-white px-1.5 py-0.5 tracking-wider">{badges.pendencias}</span>}
          </Link>
        </nav>
        <div className="mt-auto px-6 pt-4 border-t border-line flex items-center gap-2 label-mono">
          <span className="w-7 h-7 flex items-center justify-center bg-petrol text-bg font-serif text-sm tracking-normal">{profile?.nome?.[0]?.toUpperCase() ?? 'Y'}</span>
          <span className="truncate">{profile?.nome ?? 'Yasmin'}</span>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {escritorios.length > 0 && (
          <div className="border-b border-line bg-bg/60 backdrop-blur-sm sticky top-0 z-30">
            <div className="max-w-[1000px] px-6 md:px-[52px] py-2 flex items-center gap-4">
              <span className="label-mono">Escritório</span>
              <EscritorioFilter escritorios={escritorios} atual={escAtual} />
            </div>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Bar (Mobile) - 4 Abas + FAB */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-line-strong flex items-end justify-between px-2 z-40 pb-safe pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link href="/" className={`flex-1 flex flex-col items-center py-2 label-mono ${active('/') ? 'text-petrol-deep' : ''}`}>Início</Link>
        <Link href="/agenda" className={`flex-1 flex flex-col items-center py-2 label-mono ${active('/agenda') ? 'text-petrol-deep' : ''}`}>Agenda</Link>
        
        {/* FAB Central */}
        <div className="relative flex-1 flex justify-center -top-4">
          <button onClick={() => setIsQuickAddOpen(true)} className="w-14 h-14 bg-petrol-deep text-bg flex items-center justify-center rounded-none shadow-lg active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        <Link href="/obras" className={`flex-1 flex flex-col items-center py-2 label-mono ${active('/obras') ? 'text-petrol-deep' : ''}`}>Obras</Link>
        <Link href="/config" className={`flex-1 flex flex-col items-center py-2 label-mono ${active('/config') ? 'text-petrol-deep' : ''}`}>Config</Link>
      </nav>

      {/* FAB Desktop */}
      <button onClick={() => setIsQuickAddOpen(true)} className="hidden md:flex fixed bottom-8 right-8 w-12 h-12 bg-petrol-deep text-bg items-center justify-center shadow-xl hover:bg-petrol transition z-40">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 5v14M5 12h14"/></svg>
      </button>

      <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
    </div>
  );
}
