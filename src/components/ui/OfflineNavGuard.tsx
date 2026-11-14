'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

const CACHED_ROUTES_KEY = 'yasmin_cached_routes';

// Grava qual rota o usuário visitou (para saber o que está cacheado)
export function trackVisitedRoute(path: string) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHED_ROUTES_KEY) || '[]');
    if (!cached.includes(path)) {
      cached.push(path);
      localStorage.setItem(CACHED_ROUTES_KEY, JSON.stringify(cached));
    }
  } catch (e) {}
}

export function isRouteCached(path: string) {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHED_ROUTES_KEY) || '[]');
    return cached.includes(path);
  } catch (e) {
    return false;
  }
}

export function OfflineNavGuard() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navigator.onLine) return;

      // Procura o link mais próximo do clique
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;

      // Se a rota já foi visitada, deixa navegar (está cacheada)
      if (isRouteCached(href)) return;

      // Bloqueia e avisa
      e.preventDefault();
      e.stopPropagation();
      setToast(`Você está offline. A página "${href}" ainda não foi carregada no dispositivo. Conecte-se à internet primeiro.`);
      setTimeout(() => setToast(null), 4000);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom fade-in duration-300">
      <div className="bg-terra text-bg p-4 flex items-start gap-3 shadow-xl">
        <WifiOff size={18} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm leading-snug">{toast}</p>
      </div>
    </div>
  );
}
