'use client';
import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getQueue } from '@/lib/offline/syncManager';
import { useRouter } from 'next/navigation';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState(false);
  const router = useRouter();
  
  useOfflineSync();

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
      setPendingCount(getQueue().length);
    };
    updateStatus();

    const goOnline = () => updateStatus();
    const goOffline = () => updateStatus();

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Quando o sync terminar, mostra "Sincronizado" e atualiza a página
    const handleSynced = () => {
      setJustSynced(true);
      setPendingCount(0);
      // Atualiza a página via router (mais suave que reload)
      router.refresh();
      setTimeout(() => setJustSynced(false), 4000);
    };
    window.addEventListener('offline-sync-complete', handleSynced);
    
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('offline-sync-complete', handleSynced);
      clearInterval(interval);
    };
  }, [router]);

  if (!isOffline && pendingCount === 0 && !justSynced) return null;

  return (
    <div className={`fixed top-0 inset-x-0 z-[100] px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider shadow-md animate-in slide-in-from-top duration-300 ${isOffline ? 'bg-terra text-bg' : justSynced ? 'bg-olive text-bg' : 'bg-amber text-bg'}`}>
      {isOffline ? (
        <>
          <WifiOff size={14} />
          Offline · {pendingCount > 0 ? `${pendingCount} alteração(ões) pendente(s)` : 'As alterações serão salvas localmente'}
        </>
      ) : justSynced ? (
        <>
          <CheckCircle size={14} />
          Tudo sincronizado!
        </>
      ) : (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Sincronizando {pendingCount} alteração(ões)...
        </>
      )}
    </div>
  );
}
