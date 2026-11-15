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
          const payload = { ...action.payload, user_id: user.id };
          const { error } = await supabase.from('demandas').insert([payload]);
          if (error) {
            console.error('Falha ao sincronizar create:', error);
            return;
          }
        } else if (action.type === 'complete_demanda') {
          const { error } = await supabase
            .from('demandas')
            .update({ status: 'concluida', concluida_em: new Date().toISOString() })
            .eq('id', action.payload.demandaId);
          if (error) {
            console.error('Falha ao sincronizar complete:', error);
            return;
          }
        } else if (action.type === 'delete_demanda') {
          const { demandaId, parentId } = action.payload;
          const query = parentId
            ? supabase.from('demandas').delete().eq('parent_id', parentId)
            : supabase.from('demandas').delete().eq('id', demandaId);
          const { error } = await query;
          if (error) {
            console.error('Falha ao sincronizar delete:', error);
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
