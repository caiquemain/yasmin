'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function EmptyStateObras() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const seed = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('seed_exemplo');
    if (error) alert('Erro ao criar exemplo: ' + error.message);
    else window.location.reload();
    setLoading(false);
  };

  return (
    <div className="p-8 border border-line dark:border-dark-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface text-center flex flex-col items-center justify-center">
      <p className="text-sm text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft mb-4">Você ainda não tem nenhuma obra cadastrada.</p>
      <button onClick={seed} disabled={loading} className="px-6 py-2 bg-petrol text-bg label-mono hover:bg-petrol-deep transition">
        {loading ? 'Criando...' : 'Criar Obra de Exemplo'}
      </button>
    </div>
  );
}
