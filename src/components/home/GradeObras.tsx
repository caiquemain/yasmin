const statusLabel: Record<string, string> = {
  orcamento: 'Orçamento', concepcao: 'Concepção', calculo: 'Cálculo',
  detalhamento: 'Detalhamento', aguardando_arquitetura: 'Aguard. arquitetura',
  entregue: 'Entregue', execucao: 'Em execução',
};

export function GradeObras({ obras }: { obras: any[] }) {
  return (
    <section>
      <h2 className="label-mono border-b border-line dark:border-dark-line pb-2 mb-0 !tracking-[0.14em]">Obras em andamento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 border border-line dark:border-dark-line-strong dark:border-dark-line">
        {obras.map((o, i) => {
          const total = o.obra_checklist?.length ?? 0;
          const done = o.obra_checklist?.filter((c: any) => c.concluido).length ?? 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <a key={o.id} href={`/obras/${o.id}`} className={`p-4 border-line dark:border-dark-line hover:bg-surface dark:bg-dark-surface transition ${i % 2 === 0 ? 'sm:border-r' : ''} border-b last:border-b-0`}>
              <div className="font-serif text-[15px] font-semibold text-petrol-deep dark:text-petrol leading-tight">{o.nome}</div>
              <div className="label-mono mt-1">
                {o.clientes?.escritorios?.nome && <span className="text-petrol">{o.clientes.escritorios.nome} · </span>}
                {statusLabel[o.status_obra]}
              </div>
              <div className="h-[2px] bg-line mt-3 relative"><div className="absolute inset-y-0 left-0 bg-petrol" style={{ width: `${pct}%` }} /></div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
