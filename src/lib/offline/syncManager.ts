export type OfflineAction = {
  id: string;
  type: 'create_demanda';
  payload: any;
  timestamp: number;
};

const STORAGE_KEY = 'yasmin_offline_queue';

// Adiciona uma ação na fila
export function enqueueAction(type: 'create_demanda', payload: any) {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// Pega a fila inteira
export function getQueue(): OfflineAction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Limpa a fila após sincronizar
export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

// Remove item específico (se der erro de conflito por exemplo)
export function removeAction(id: string) {
  const queue = getQueue().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}
