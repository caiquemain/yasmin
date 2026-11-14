'use client';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Checa o status inicial
    setIsOffline(!navigator.onLine);

    // Fica ouvindo as mudanças de rede
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-terra text-bg px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider shadow-md animate-in slide-in-from-top duration-300">
      <WifiOff size={14} />
      Você está offline. Conecte-se para salvar alterações.
    </div>
  );
}
