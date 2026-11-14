'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function UpdateToast() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);

        // Se já existe um worker esperando para ser ativado
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Fica ouvindo se uma nova versão for baixada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    setIsReloading(true);
    if (registration && registration.waiting) {
      // Manda o Service Worker novo assumir e recarrega a página
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Um pequeno delay para o SW processar a mensagem antes de recarregar
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line shadow-xl p-4 flex items-center gap-4 rounded-none">
        <div className="w-10 h-10 bg-petrol/10 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="text-petrol" size={20} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-ink dark:text-dark-ink leading-tight">Nova versão disponível</h3>
          <p className="text-xs text-ink-soft dark:text-dark-inkSoft mt-0.5">Atualize para ver as novidades.</p>
        </div>

        <button 
          onClick={handleUpdate} 
          disabled={isReloading}
          className="px-4 py-2 bg-petrol-deep text-bg text-xs font-medium hover:bg-petrol transition disabled:opacity-50 flex-shrink-0"
        >
          {isReloading ? 'Atualizando...' : 'Atualizar'}
        </button>
        
        <button onClick={() => setShowUpdate(false)} className="text-ink-faint hover:text-ink transition">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
