'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function EscritorioFilter({ escritorios, atual }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const onChange = (val: string) => {
    const params = new URLSearchParams(search.toString());
    if (val === 'todos') params.delete('esc');
    else params.set('esc', val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select value={atual} onChange={(e) => onChange(e.target.value)} className="font-mono text-2xs uppercase tracking-[0.1em] bg-transparent border border-line-strong px-2 py-1 text-petrol-deep focus:outline-none focus:border-petrol">
      <option value="todos">Todos</option>
      {escritorios.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}
    </select>
  );
}
