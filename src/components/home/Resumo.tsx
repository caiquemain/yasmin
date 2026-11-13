export function Resumo({ obras, bloqueadas, tarefas }: { obras: number; bloqueadas: number; tarefas: number }) {
  const Item = ({ n, l, warn }: { n: number; l: string; warn?: boolean }) => (
    <div className="flex items-baseline gap-3">
      <span className={`font-serif text-2xl font-semibold ${warn && n > 0 ? 'text-terra' : 'text-petrol-deep'}`}>{n}</span>
      <span className="label-mono">{l}</span>
    </div>
  );
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3 py-5 my-7 border-y border-line">
      <Item n={obras} l="obras em andamento" />
      <Item n={bloqueadas} l="bloqueadas" warn />
      <Item n={tarefas} l="tarefas hoje" />
    </div>
  );
}
