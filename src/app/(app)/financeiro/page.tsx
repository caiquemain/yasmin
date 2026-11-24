import { createClient } from '@/lib/supabase/server';
import { FinanceiroClient } from '@/components/financeiro/FinanceiroClient';

export const dynamic = 'force-dynamic';

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [parcelasRes, despesasRes, escritoriosRes, obrasRes] = await Promise.all([
    supabase
      .from('obra_parcelas')
      .select('*, obras(nome, clientes(nome))')
      .order('data_prevista', { ascending: true }),
    supabase
      .from('despesas')
      .select('*, escritorios(nome), obras(nome)')
      .order('data_vencimento', { ascending: false }),
    supabase
      .from('escritorios')
      .select('id, nome')
      .eq('arquivado', false)
      .order('ordem'),
    supabase
      .from('obras')
      .select('id, nome, clientes(nome)')
      .order('created_at', { ascending: false }),
  ]);

  // Se a tabela despesas ainda não foi criada via migration no Supabase, degrada graciosamente
  const despesasDisponivel = !despesasRes.error;

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-petrol-deep dark:text-petrol mb-2">Financeiro</h1>
        <p className="label-mono">Contas a receber, pagamentos realizados e fluxo de caixa</p>
      </header>

      <FinanceiroClient
        initialParcelas={parcelasRes.data ?? []}
        initialDespesas={despesasDisponivel ? (despesasRes.data ?? []) : []}
        despesasDisponivel={despesasDisponivel}
        escritorios={escritoriosRes.data ?? []}
        obras={obrasRes.data ?? []}
        userId={user!.id}
      />
    </div>
  );
}
