'use client';
import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getQueue } from '@/lib/offline/syncManager';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Inicializa o sincronizador global
  useOfflineSync();

  useEffect(() => {
    // Checa status e itens pendentes
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
      setPendingCount(getQueue().length);
    };
    
    updateStatus();

    const goOnline = () => { updateStatus(); };
    const goOffline = () => { updateStatus(); };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Atualiza o contador a cada 5s (para quando criar uma tarefa offline)
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div className={`fixed top-0 inset-x-0 z-[100] px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider shadow-md animate-in slide-in-from-top duration-300 ${isOffline ? 'bg-terra text-bg' : 'bg-amber text-bg'}`}>
      {isOffline ? (
        <>
          <WifiOff size={14} />
          Você está offline. As alterações serão salvas localmente.
        </>
      ) : (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Sincronizando {pendingCount} alteração(ões) pendente(s)...
        </>
      )}
    </div>
  );
}
