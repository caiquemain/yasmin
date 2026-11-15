export type OfflineAction =
  | { id: string; type: 'create_demanda'; payload: any; timestamp: number }
  | { id: string; type: 'complete_demanda'; payload: { demandaId: string }; timestamp: number }
  | { id: string; type: 'delete_demanda'; payload: { demandaId: string; parentId: string | null }; timestamp: number };

const STORAGE_KEY = 'yasmin_offline_queue';

export function enqueueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = getQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  } as OfflineAction);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueue(): OfflineAction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export function removeAction(id: string) {
  const queue = getQueue().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// Verifica se uma tarefa foi criada offline (ainda não foi para o servidor)
export function hasPendingCreateFor(demandaId: string): boolean {
  return getQueue().some(a => a.type === 'create_demanda' && a.payload.id === demandaId);
}

// Remove um create da fila (usado quando o usuário deleta uma tarefa criada offline)
export function removeCreateFromQueue(demandaId: string) {
  const queue = getQueue().filter(
    a => !(a.type === 'create_demanda' && a.payload.id === demandaId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}
