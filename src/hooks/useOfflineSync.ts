'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getQueue, clearQueue } from '@/lib/offline/syncManager';

export function useOfflineSync() {
  const supabase = createClient();

  useEffect(() => {
    // Função que varre a fila e envia para o Supabase
    const syncQueue = async () => {
      const queue = getQueue();
      if (queue.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Processa item por item
      for (const action of queue) {
        if (action.type === 'create_demanda') {
          const payload = { ...action.payload, user_id: user.id };
          const { error } = await supabase.from('demandas').insert([payload]);
          
          // Se deu erro, pula esse item para tentar de novo na próxima
          if (error) {
            console.error('Falha ao sincronizar item:', error);
            return; // Para o loop para não perder dados
          }
        }
      }

      // Se chegou até aqui, tudo foi sincronizado com sucesso
      clearQueue();
      
      // Opcional: forçar um refresh na tela para aparecer as tarefas novas
      if (window.location.pathname === '/' || window.location.pathname === '/agenda') {
        window.location.reload();
      }
    };

    // Executa ao abrir o app
    if (navigator.onLine) syncQueue();

    // Fica ouvindo o evento de reconexão
    const handleOnline = () => {
      syncQueue();
    };
    window.addEventListener('online', handleOnline);

    // Intervalo de segurança a cada 30s
    const interval = setInterval(() => {
      if (navigator.onLine) syncQueue();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [supabase]);
}
