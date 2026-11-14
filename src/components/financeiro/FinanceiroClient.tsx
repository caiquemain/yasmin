'use client';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FinanceiroClient({ parcelas }: { parcelas: any[] }) {
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago'>('todos');

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalGeral = parcelas.reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPago = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPendente = parcelas.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor), 0);

  const chartData = useMemo(() => {
    const agrupado: Record<string, { mes: string; pago: number; pendente: number }> = {};

    parcelas.forEach(p => {
      const dataRef = p.data_prevista ? parseISO(p.data_prevista) : parseISO(p.created_at);
      const mesAno = format(dataRef, 'MMM/yy', { locale: ptBR });
      
      if (!agrupado[mesAno]) {
        agrupado[mesAno] = { mes: mesAno, pago: 0, pendente: 0 };
      }

      if (p.status === 'pago') {
        agrupado[mesAno].pago += Number(p.valor);
      } else {
        agrupado[mesAno].pendente += Number(p.valor);
      }
    });

    return Object.values(agrupado);
  }, [parcelas]);

  const parcelasFiltradas = parcelas.filter(p => filtro === 'todos' ? true : p.status === filtro);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line dark:bg-dark-line border border-line-strong dark:border-dark-line">
        <div className="bg-surface dark:bg-dark-surface p-6">
          <span className="label-mono block mb-2">Total Geral</span>
          <span className="font-serif text-3xl text-petrol-deep dark:text-petrol">{formatBRL(totalGeral)}</span>
        </div>
        <div className="bg-surface dark:bg-dark-surface p-6">
          <span className="label-mono block mb-2">Total Recebido</span>
          <span className="font-serif text-3xl text-olive">{formatBRL(totalPago)}</span>
        </div>
        <div className="bg-surface dark:bg-dark-surface p-6">
          <span className="label-mono block mb-2">A Receber</span>
          <span className="font-serif text-3xl text-terra">{formatBRL(totalPendente)}</span>
        </div>
      </div>

      <section className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line p-6">
        <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-6">Evolução Mensal</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2DDE2" />
              <XAxis 
                dataKey="mes" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A88C95', fontSize: 12, fontFamily: 'monospace' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A88C95', fontSize: 12, fontFamily: 'monospace' }}
                tickFormatter={(value) => `R$${value/1000}k`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(200, 90, 126, 0.05)' }}
                contentStyle={{ backgroundColor: '#FCEFF2', borderColor: '#D4AEB8', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}
                formatter={(value: any) => formatBRL(Number(value))}
              />
              <Bar dataKey="pago" name="Recebido" stackId="a" fill="#C85A7E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pendente" name="A Receber" stackId="a" fill="#E08EA8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#C85A7E]"></div><span className="label-mono">Recebido</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#E08EA8]"></div><span className="label-mono">A Receber</span></div>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-line dark:border-dark-line pb-2 mb-4 gap-4">
          <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol">Detalhamento</h2>
          <div className="flex gap-2 p-1 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line w-fit">
            {(['todos', 'pendente', 'pago'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 text-xs capitalize transition ${filtro === f ? 'bg-petrol text-bg' : 'text-ink-soft hover:bg-line/50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {parcelasFiltradas.map(p => (
            <li key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface gap-4">
              <div>
                <span className={`text-[15px] block ${p.status === 'pago' ? 'line-through opacity-50' : ''}`}>{p.descricao}</span>
                <span className="label-mono text-ink-soft dark:text-dark-inkSoft">
                  {p.obras?.nome} • {p.obras?.clientes?.nome}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {p.data_prevista && (
                  <span className="label-mono hidden md:block">
                    {new Date(p.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
                <span className={`font-mono text-sm ${p.status === 'pago' ? 'text-olive' : 'text-terra'}`}>
                  {formatBRL(Number(p.valor))}
                </span>
                <span className={`label-mono px-2 py-1 ${p.status === 'pago' ? 'bg-olive/10 text-olive' : 'bg-terra/10 text-terra'}`}>
                  {p.status}
                </span>
              </div>
            </li>
          ))}
          {parcelasFiltradas.length === 0 && (
            <p className="text-sm text-ink-soft italic py-4">Nenhuma parcela encontrada para este filtro.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
