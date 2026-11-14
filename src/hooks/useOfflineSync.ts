'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getQueue, clearQueue } from '@/lib/offline/syncManager';

export function useOfflineSync() {
  const supabase = createClient();

  useEffect(() => {
    const syncQueue = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const action of queue) {
        if (action.type === 'create_demanda') {
          // O payload já tem user_id agora (vem do QuickAdd)
          const payload = { ...action.payload, user_id: user.id };
          const { error } = await supabase.from('demandas').insert([payload]);
          
          if (error) {
            console.error('Falha ao sincronizar item:', error);
            return;
          }
        }
      }

      clearQueue();
      window.dispatchEvent(new CustomEvent('offline-sync-complete'));
    };

    if (navigator.onLine) syncQueue();

    const handleOnline = () => syncQueue();
    window.addEventListener('online', handleOnline);

    const interval = setInterval(() => {
      if (navigator.onLine) syncQueue();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [supabase]);
}
