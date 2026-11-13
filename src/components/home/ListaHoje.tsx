const prioClass: Record<string, string> = { alta: 'text-terra', media: 'text-ink-soft', baixa: 'text-ink-faint' };

export function ListaHoje({ items }: { items: any[] }) {
  return (
    <section className="mb-9">
      <h2 className="label-mono border-b border-line pb-2 mb-3 !tracking-[0.14em]">Hoje</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft py-4">nada hoje.</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li key={t.id} className="grid grid-cols-[56px_1fr_auto_auto] gap-3 items-baseline py-3 border-b border-dotted border-line last:border-0">
              <span className="font-mono text-[12px] text-petrol">{t.hora_inicio?.slice(0, 5) ?? '—'}</span>
              <span className="text-[14.5px]">{t.titulo}</span>
              <span className="label-mono truncate max-w-[160px]">
                {t.escritorios?.nome && <span className="text-petrol">{t.escritorios.nome} · </span>}
                {t.categorias?.nome ?? ''}{t.revisao ? ` · ${t.revisao}` : ''}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${prioClass[t.prioridade]}`}>{t.prioridade === 'media' ? '—' : t.prioridade}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
