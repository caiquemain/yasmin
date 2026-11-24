'use client';
import { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, isValid, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Plus, X, Trash2, Pencil, Search } from 'lucide-react';
import { PageTour } from '@/components/ui/PageTour';

type AbaFinanceiro = 'resumo' | 'despesas' | 'receber';

const CATEGORIAS_DESPESA = [
  'Software / Assinatura',
  'Cursos / Mentoria',
  'ART / CREA',
  'Impostos / Contabilidade',
  'Equipamentos',
  'Terceirização',
  'Outros',
];

export function FinanceiroClient({
  initialParcelas,
  initialDespesas,
  despesasDisponivel,
  escritorios,
  obras,
  userId,
}: {
  initialParcelas: any[];
  initialDespesas: any[];
  despesasDisponivel: boolean;
  escritorios: any[];
  obras: any[];
  userId: string;
}) {
  const supabase = createClient();
  const [aba, setAba] = useState<AbaFinanceiro>('resumo');
  const [parcelas, setParcelas] = useState(initialParcelas);
  const [despesas, setDespesas] = useState(initialDespesas);

  const [filtroReceber, setFiltroReceber] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [filtroDespesa, setFiltroDespesa] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [buscaDespesa, setBuscaDespesa] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoDespesa, setEditandoDespesa] = useState<any | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const hojeStr = new Date().toLocaleDateString('sv-SE');
  const [form, setForm] = useState({
    descricao: '',
    fornecedor: '',
    categoria: 'Software / Assinatura',
    valor: '',
    status: 'pago' as 'pendente' | 'pago',
    data_vencimento: hojeStr,
    data_pago: hojeStr,
    parcelas_mensais: '1',
    escritorio_id: '',
    obra_id: '',
    observacoes: '',
  });

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalRecebido = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalAReceber = parcelas.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor), 0);

  const totalDespesasPagas = despesas.filter(d => d.status === 'pago').reduce((acc, d) => acc + Number(d.valor), 0);
  const totalDespesasPendentes = despesas.filter(d => d.status === 'pendente').reduce((acc, d) => acc + Number(d.valor), 0);
  const saldoLiquido = totalRecebido - totalDespesasPagas;

  const chartData = useMemo(() => {
    const agrupado: Record<string, { chave: string; mes: string; recebido: number; aReceber: number; pagoDespesa: number }> = {};

    const garantirMes = (dataRef: Date) => {
      const chave = format(dataRef, 'yyyy-MM');
      const mes = format(dataRef, 'MMM/yy', { locale: ptBR });
      if (!agrupado[chave]) {
        agrupado[chave] = { chave, mes, recebido: 0, aReceber: 0, pagoDespesa: 0 };
      }
      return agrupado[chave];
    };

    parcelas.forEach(p => {
      let dataRef = new Date();
      if (p.data_prevista) dataRef = parseISO(p.data_prevista);
      else if (p.created_at) {
        const parsed = parseISO(p.created_at.replace(' ', 'T'));
        if (isValid(parsed)) dataRef = parsed;
      }
      if (!isValid(dataRef)) return;
      const bucket = garantirMes(dataRef);
      if (p.status === 'pago') bucket.recebido += Number(p.valor);
      else bucket.aReceber += Number(p.valor);
    });

    despesas.forEach(d => {
      const dataStr = d.data_pago || d.data_vencimento;
      if (!dataStr) return;
      const dataRef = parseISO(dataStr);
      if (!isValid(dataRef)) return;
      const bucket = garantirMes(dataRef);
      bucket.pagoDespesa += Number(d.valor);
    });

    return Object.values(agrupado).sort((a, b) => a.chave.localeCompare(b.chave));
  }, [parcelas, despesas]);

  const parcelasFiltradas = parcelas.filter(p => filtroReceber === 'todos' ? true : p.status === filtroReceber);

  const despesasFiltradas = useMemo(() => {
    const termo = buscaDespesa.trim().toLowerCase();
    return despesas.filter(d => {
      if (filtroDespesa !== 'todos' && d.status !== filtroDespesa) return false;
      if (termo) {
        const texto = `${d.descricao ?? ''} ${d.fornecedor ?? ''} ${d.categoria ?? ''} ${d.observacoes ?? ''} ${d.obras?.nome ?? ''}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });
  }, [despesas, filtroDespesa, buscaDespesa]);

  const totalDespesasFiltradas = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0);

  const openNovaDespesa = () => {
    setEditandoDespesa(null);
    setForm({
      descricao: '',
      fornecedor: '',
      categoria: 'Software / Assinatura',
      valor: '',
      status: 'pago',
      data_vencimento: hojeStr,
      data_pago: hojeStr,
      parcelas_mensais: '1',
      escritorio_id: '',
      obra_id: '',
      observacoes: '',
    });
    setIsModalOpen(true);
  };

  const openEditarDespesa = (d: any) => {
    setEditandoDespesa(d);
    setForm({
      descricao: d.descricao || '',
      fornecedor: d.fornecedor || '',
      categoria: d.categoria || 'Software / Assinatura',
      valor: String(d.valor ?? ''),
      status: d.status || 'pendente',
      data_vencimento: d.data_vencimento || hojeStr,
      data_pago: d.data_pago || hojeStr,
      parcelas_mensais: '1',
      escritorio_id: d.escritorio_id || '',
      obra_id: d.obra_id || '',
      observacoes: d.observacoes || '',
    });
    setIsModalOpen(true);
  };

  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);

    try {
      if (editandoDespesa) {
        const payload = {
          descricao: form.descricao.trim(),
          fornecedor: form.fornecedor.trim() || null,
          categoria: form.categoria,
          valor: Number(form.valor),
          status: form.status,
          data_vencimento: form.data_vencimento,
          data_pago: form.status === 'pago' ? (form.data_pago || hojeStr) : null,
          escritorio_id: form.escritorio_id || null,
          obra_id: form.obra_id || null,
          observacoes: form.observacoes.trim() || null,
        };
        const { data, error } = await supabase
          .from('despesas')
          .update(payload)
          .eq('id', editandoDespesa.id)
          .select('*, escritorios(nome), obras(nome)')
          .single();

        if (error) {
          alert('Erro ao salvar pagamento: ' + error.message);
        } else if (data) {
          setDespesas(prev => prev.map(item => item.id === data.id ? data : item));
          setIsModalOpen(false);
        }
      } else {
        const qtd = Math.max(1, Number(form.parcelas_mensais) || 1);
        const parentId = qtd > 1 ? crypto.randomUUID() : null;
        const dataBase = parseISO(`${form.data_vencimento}T12:00:00`);
        const payloads = [];

        for (let i = 0; i < qtd; i++) {
          const dataParcela = format(addMonths(dataBase, i), 'yyyy-MM-dd');
          const statusParcela = i === 0 ? form.status : 'pendente';
          payloads.push({
            user_id: userId,
            descricao: qtd > 1 ? `${form.descricao.trim()} (${i + 1}/${qtd})` : form.descricao.trim(),
            fornecedor: form.fornecedor.trim() || null,
            categoria: form.categoria,
            valor: Number(form.valor),
            status: statusParcela,
            data_vencimento: dataParcela,
            data_pago: statusParcela === 'pago' ? (form.data_pago || dataParcela) : null,
            recorrencia: qtd > 1 ? 'monthly' : 'none',
            parent_id: parentId,
            escritorio_id: form.escritorio_id || null,
            obra_id: form.obra_id || null,
            observacoes: form.observacoes.trim() || null,
          });
        }

        const { data, error } = await supabase
          .from('despesas')
          .insert(payloads)
          .select('*, escritorios(nome), obras(nome)');

        if (error) {
          alert('Erro ao registrar pagamento: ' + error.message);
        } else if (data) {
          setDespesas(prev =>
            [...data, ...prev].sort((a, b) => (b.data_vencimento || '').localeCompare(a.data_vencimento || ''))
          );
          setIsModalOpen(false);
        }
      }
    } finally {
      setSalvando(false);
    }
  };

  const toggleDespesaStatus = async (d: any) => {
    const isPago = d.status === 'pago';
    const novoStatus = isPago ? 'pendente' : 'pago';
    const novaDataPago = isPago ? null : hojeStr;

    setDespesas(prev => prev.map(item => item.id === d.id ? { ...item, status: novoStatus, data_pago: novaDataPago } : item));
    const { error } = await supabase
      .from('despesas')
      .update({ status: novoStatus, data_pago: novaDataPago })
      .eq('id', d.id);

    if (error) {
      setDespesas(prev => prev.map(item => item.id === d.id ? d : item));
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  const deleteDespesa = async (d: any) => {
    if (!confirm(`Excluir o registro "${d.descricao}"?`)) return;
    const anterior = despesas;
    setDespesas(prev => prev.filter(item => item.id !== d.id));
    const { error } = await supabase.from('despesas').delete().eq('id', d.id);
    if (error) {
      setDespesas(anterior);
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const toggleParcelaStatus = async (p: any) => {
    const isPago = p.status === 'pago';
    const novoStatus = isPago ? 'pendente' : 'pago';
    const novaDataPago = isPago ? null : hojeStr;

    setParcelas(prev => prev.map(item => item.id === p.id ? { ...item, status: novoStatus, data_pago: novaDataPago } : item));
    const { error } = await supabase
      .from('obra_parcelas')
      .update({ status: novoStatus, data_pago: novaDataPago })
      .eq('id', p.id);

    if (error) {
      setParcelas(prev => prev.map(item => item.id === p.id ? p : item));
      alert('Erro ao atualizar parcela: ' + error.message);
    }
  };

  const tourSteps = [
    { element: 'body', popover: { title: 'Financeiro', description: 'Aqui você acompanha contas a receber das obras, pagamentos/despesas realizados e o saldo do seu caixa.' } },
    { element: '[data-tour="fin-cards"]', popover: { title: 'Resumo', description: 'Total recebido, pagamentos feitos, saldo líquido e valores em aberto.', side: 'bottom' as const, align: 'start' as const } },
    { element: '[data-tour="fin-grafico"]', popover: { title: 'Evolução Mensal', description: 'O gráfico compara receitas e pagamentos mês a mês.', side: 'top' as const, align: 'start' as const } },
  ];

  return (
    <div className="space-y-8">
      <PageTour storageKey="tour_financeiro_v1" steps={tourSteps} />

      {/* Navegação por abas + botão rápido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line w-fit">
          {([
            { id: 'resumo', label: 'Visão Geral' },
            { id: 'despesas', label: `Pagamentos (${despesas.length})` },
            { id: 'receber', label: `A Receber (${parcelas.length})` },
          ] as { id: AbaFinanceiro; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`px-3.5 py-1.5 text-xs md:text-sm transition ${
                aba === tab.id
                  ? 'bg-petrol text-bg'
                  : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {despesasDisponivel && (
          <button
            onClick={() => { setAba('despesas'); openNovaDespesa(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-petrol-deep text-bg text-xs font-mono uppercase tracking-wider hover:bg-petrol transition"
          >
            <Plus size={14} /> Novo Pagamento
          </button>
        )}
      </div>

      {/* Cards de resumo (sempre visíveis na Visão Geral) */}
      {aba === 'resumo' && (
        <>
          <div data-tour="fin-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line dark:bg-dark-line border border-line-strong dark:border-dark-line">
            <div className="bg-surface dark:bg-dark-surface p-5">
              <span className="label-mono block mb-2">Recebido</span>
              <span className="font-serif text-2xl md:text-3xl text-olive">{formatBRL(totalRecebido)}</span>
              <span className="label-mono block mt-1 text-ink-faint dark:text-dark-inkSoft">A receber: {formatBRL(totalAReceber)}</span>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-5">
              <span className="label-mono block mb-2">Pagamentos Feitos</span>
              <span className="font-serif text-2xl md:text-3xl text-terra">{formatBRL(totalDespesasPagas)}</span>
              <span className="label-mono block mt-1 text-ink-faint dark:text-dark-inkSoft">A pagar: {formatBRL(totalDespesasPendentes)}</span>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-5">
              <span className="label-mono block mb-2">Saldo Líquido</span>
              <span className={`font-serif text-2xl md:text-3xl ${saldoLiquido >= 0 ? 'text-petrol-deep dark:text-petrol' : 'text-terra'}`}>
                {formatBRL(saldoLiquido)}
              </span>
              <span className="label-mono block mt-1 text-ink-faint dark:text-dark-inkSoft">Recebido − Pago</span>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-5">
              <span className="label-mono block mb-2">Em Aberto</span>
              <span className="font-serif text-2xl md:text-3xl text-amber">{formatBRL(totalAReceber - totalDespesasPendentes)}</span>
              <span className="label-mono block mt-1 text-ink-faint dark:text-dark-inkSoft">Previsão líquida</span>
            </div>
          </div>

          <section data-tour="fin-grafico" className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line p-6">
            <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-6">Evolução Mensal</h2>
            <div className="h-[300px] w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2DDE2" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#A88C95', fontSize: 12, fontFamily: 'monospace' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A88C95', fontSize: 12, fontFamily: 'monospace' }} tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(200, 90, 126, 0.05)' }} contentStyle={{ backgroundColor: '#FCEFF2', borderColor: '#D4AEB8', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }} formatter={(value: any) => formatBRL(Number(value))} />
                    <Bar dataKey="recebido" name="Recebido" stackId="a" fill="#C85A7E" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="aReceber" name="A Receber" stackId="a" fill="#E08EA8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pagoDespesa" name="Pagamentos" fill="#A04632" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="w-full h-full flex items-center justify-center"><span className="label-mono">Carregando gráfico...</span></div>}
            </div>
            <div className="flex flex-wrap gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#C85A7E]"></div><span className="label-mono">Recebido</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#E08EA8]"></div><span className="label-mono">A Receber</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#A04632]"></div><span className="label-mono">Pagamentos</span></div>
            </div>
          </section>
        </>
      )}

      {/* Aba Pagamentos / Despesas */}
      {aba === 'despesas' && (
        <section className="space-y-6">
          {!despesasDisponivel ? (
            <div className="p-6 border border-amber bg-surface dark:bg-dark-surface space-y-2">
              <h3 className="font-serif text-xl text-petrol-deep dark:text-petrol">Tabela de pagamentos pendente no Supabase</h3>
              <p className="text-sm text-ink-soft dark:text-dark-inkSoft">
                Execute a migration <code className="font-mono text-xs">supabase/migrations/20261124000000_despesas.sql</code> no SQL Editor do Supabase para habilitar o registro de pagamentos e despesas (ex: BIM Estruture).
              </p>
            </div>
          ) : (
            <>
              <div className="bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-dark-inkSoft" />
                  <input
                    type="text"
                    value={buscaDespesa}
                    onChange={(e) => setBuscaDespesa(e.target.value)}
                    placeholder="Filtrar pagamentos (ex: BIM Estruture, software, ART...)"
                    className="w-full pl-9 pr-3 py-2 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line text-sm text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft focus:outline-none focus:border-petrol"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1 p-1 bg-bg dark:bg-dark-bg border border-line-strong dark:border-dark-line">
                    {(['todos', 'pendente', 'pago'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFiltroDespesa(f)}
                        className={`px-3 py-1 text-xs capitalize transition ${filtroDespesa === f ? 'bg-petrol text-bg' : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-sm text-petrol-deep dark:text-petrol font-medium">
                    Total: {formatBRL(totalDespesasFiltradas)}
                  </span>
                </div>
              </div>

              {despesasFiltradas.length === 0 ? (
                <div className="p-10 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface text-center space-y-3">
                  <p className="label-mono text-ink-faint dark:text-dark-inkSoft">
                    Nenhum pagamento registrado para este filtro.
                  </p>
                  <button
                    onClick={openNovaDespesa}
                    className="px-4 py-2 border border-petrol text-petrol label-mono hover:bg-petrol hover:text-bg transition"
                  >
                    + Registrar primeiro pagamento
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {despesasFiltradas.map(d => {
                    const isPago = d.status === 'pago';
                    return (
                      <li
                        key={d.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface group"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => toggleDespesaStatus(d)}
                            title={isPago ? 'Marcar como pendente' : 'Marcar como pago'}
                            className={`mt-0.5 w-5 h-5 border flex flex-shrink-0 items-center justify-center transition-colors ${
                              isPago ? 'bg-olive border-olive' : 'border-line-strong dark:border-dark-line hover:border-petrol'
                            }`}
                          >
                            {isPago && <Check size={13} className="text-bg" strokeWidth={3} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span className="text-[15px] block text-ink dark:text-dark-ink font-medium">
                              {d.descricao}
                            </span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                              {d.fornecedor && <span className="label-mono text-petrol">{d.fornecedor}</span>}
                              {d.categoria && <span className="label-mono text-ink-soft dark:text-dark-inkSoft">{d.categoria}</span>}
                              {d.obras?.nome && <span className="label-mono text-ink-soft dark:text-dark-inkSoft">• {d.obras.nome}</span>}
                              {d.data_vencimento && (
                                <span className="label-mono text-ink-faint dark:text-dark-inkSoft">
                                  Venc: {new Date(d.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {isPago && d.data_pago && (
                                <span className="label-mono text-olive">
                                  Pago em {new Date(d.data_pago + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {d.observacoes && (
                              <p className="text-xs text-ink-soft dark:text-dark-inkSoft mt-1.5">{d.observacoes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
                          <span className={`font-mono text-sm font-medium ${isPago ? 'text-olive' : 'text-terra'}`}>
                            {formatBRL(Number(d.valor))}
                          </span>
                          <span className={`label-mono px-2 py-1 ${isPago ? 'bg-olive/10 text-olive' : 'bg-terra/10 text-terra'}`}>
                            {d.status}
                          </span>
                          <button
                            onClick={() => openEditarDespesa(d)}
                            title="Editar pagamento"
                            className="p-1 text-ink-faint hover:text-petrol transition"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteDespesa(d)}
                            title="Excluir pagamento"
                            className="p-1 text-ink-faint hover:text-terra transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      {/* Aba Contas a Receber (Obras) */}
      {aba === 'receber' && (
        <section data-tour="fin-lista">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-line dark:border-dark-line pb-2 mb-4 gap-4">
            <h2 className="font-serif text-2xl text-petrol-deep dark:text-petrol">Parcelas das Obras</h2>
            <div className="flex gap-2 p-1 bg-surface dark:bg-dark-surface border border-line-strong dark:border-dark-line w-fit">
              {(['todos', 'pendente', 'pago'] as const).map(f => (
                <button key={f} onClick={() => setFiltroReceber(f)} className={`px-3 py-1 text-xs capitalize transition ${filtroReceber === f ? 'bg-petrol text-bg' : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50'}`}>{f}</button>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {parcelasFiltradas.map(p => (
              <li key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-line-strong dark:border-dark-line bg-surface dark:bg-dark-surface gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleParcelaStatus(p)}
                    title={p.status === 'pago' ? 'Marcar como pendente' : 'Marcar como recebido'}
                    className={`mt-0.5 w-5 h-5 border flex flex-shrink-0 items-center justify-center transition-colors ${
                      p.status === 'pago' ? 'bg-petrol border-petrol' : 'border-line-strong dark:border-dark-line hover:border-petrol'
                    }`}
                  >
                    {p.status === 'pago' && <Check size={13} className="text-bg" strokeWidth={3} />}
                  </button>
                  <div>
                    <span className={`text-[15px] block text-ink dark:text-dark-ink ${p.status === 'pago' ? 'line-through opacity-60' : ''}`}>{p.descricao}</span>
                    <span className="label-mono text-ink-soft dark:text-dark-inkSoft">{p.obras?.nome} • {p.obras?.clientes?.nome}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {p.data_prevista && <span className="label-mono hidden md:block">{new Date(p.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                  <span className={`font-mono text-sm ${p.status === 'pago' ? 'text-olive' : 'text-terra'}`}>{formatBRL(Number(p.valor))}</span>
                  <span className={`label-mono px-2 py-1 ${p.status === 'pago' ? 'bg-olive/10 text-olive' : 'bg-terra/10 text-terra'}`}>{p.status}</span>
                </div>
              </li>
            ))}
            {parcelasFiltradas.length === 0 && <p className="text-sm text-ink-soft italic py-4">Nenhuma parcela encontrada para este filtro.</p>}
          </ul>
        </section>
      )}

      {/* Drawer de Novo / Editar Pagamento */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsModalOpen(false)} />
          <div className="fixed z-50 flex flex-col bg-bg dark:bg-dark-surface border-line-strong dark:border-dark-line shadow-2xl overflow-hidden inset-x-0 bottom-0 h-[92dvh] border-t md:inset-y-0 md:right-0 md:left-auto md:w-[460px] md:h-full md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-dark-line">
              <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">
                {editandoDespesa ? 'Editar Pagamento' : 'Novo Pagamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarDespesa} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-1">
                <label className="label-mono">Descrição</label>
                <input
                  required
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Pagamento mensal BIM Estruture"
                  className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-base focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">Fornecedor / Destino</label>
                  <input
                    value={form.fornecedor}
                    onChange={e => setForm({ ...form, fornecedor: e.target.value })}
                    placeholder="Ex: BIM Estruture"
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                    placeholder="0,00"
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                  >
                    {CATEGORIAS_DESPESA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label-mono">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as 'pendente' | 'pago' })}
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                  >
                    <option value="pago">Já pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label-mono">Data de Vencimento</label>
                  <input
                    required
                    type="date"
                    value={form.data_vencimento}
                    onChange={e => setForm({ ...form, data_vencimento: e.target.value })}
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                  />
                </div>
                {form.status === 'pago' && (
                  <div className="space-y-1">
                    <label className="label-mono">Data do Pagamento</label>
                    <input
                      type="date"
                      value={form.data_pago}
                      onChange={e => setForm({ ...form, data_pago: e.target.value })}
                      className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                    />
                  </div>
                )}
              </div>

              {!editandoDespesa && (
                <div className="space-y-1">
                  <label className="label-mono">Repetir mensalmente</label>
                  <select
                    value={form.parcelas_mensais}
                    onChange={e => setForm({ ...form, parcelas_mensais: e.target.value })}
                    className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                  >
                    <option value="1">Pagamento único</option>
                    <option value="3">Mensal (3 meses)</option>
                    <option value="6">Mensal (6 meses)</option>
                    <option value="12">Mensal (12 meses)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {escritorios.length > 0 && (
                  <div className="space-y-1">
                    <label className="label-mono">Escritório (opcional)</label>
                    <select
                      value={form.escritorio_id}
                      onChange={e => setForm({ ...form, escritorio_id: e.target.value })}
                      className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                    >
                      <option value="">Nenhum</option>
                      {escritorios.map(esc => <option key={esc.id} value={esc.id}>{esc.nome}</option>)}
                    </select>
                  </div>
                )}
                {obras.length > 0 && (
                  <div className="space-y-1">
                    <label className="label-mono">Obra (opcional)</label>
                    <select
                      value={form.obra_id}
                      onChange={e => setForm({ ...form, obra_id: e.target.value })}
                      className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-sm focus:outline-none focus:border-petrol text-ink dark:text-dark-ink"
                    >
                      <option value="">Nenhuma</option>
                      {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="label-mono">Observações (opcional)</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Ex: Pago via Pix, comprovante salvo no Drive..."
                  className="w-full bg-transparent border border-line-strong dark:border-dark-line p-2 text-sm focus:outline-none focus:border-petrol min-h-[72px] resize-none text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : (editandoDespesa ? 'Salvar alterações' : 'Registrar Pagamento')}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
