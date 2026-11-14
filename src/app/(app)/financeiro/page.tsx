import { createClient } from '@/lib/supabase/server';
import { FinanceiroClient } from '@/components/financeiro/FinanceiroClient';

export const dynamic = 'force-dynamic';

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Busca todas as parcelas de todas as obras do usuário
  const { data: parcelas } = await supabase
    .from('obra_parcelas')
    .select('*, obras(nome, clientes(nome))')
    .order('data_prevista', { ascending: true });

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-petrol-deep dark:text-petrol mb-2">Financeiro</h1>
        <p className="label-mono">Contas a receber e fluxo de caixa</p>
      </header>

      <FinanceiroClient parcelas={parcelas ?? []} />
    </div>
  );
}
