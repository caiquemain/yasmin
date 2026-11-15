import { createClient } from '@/lib/supabase/server';
import { ObraDetailClient } from '@/components/obras/ObraDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: obra } = await supabase
    .from('obras')
    .select('*, clientes(nome)')
    .eq('id', id)
    .single();

  if (!obra) return notFound();

  const [{ data: checklist }, { data: parcelas }] = await Promise.all([
    supabase.from('obra_checklist').select('*').eq('obra_id', id).order('ordem'),
    supabase.from('obra_parcelas').select('*').eq('obra_id', id).order('ordem')
  ]);

  return <ObraDetailClient obra={obra} checklist={checklist ?? []} initialParcelas={parcelas ?? []} userId={user.id} />;
}
