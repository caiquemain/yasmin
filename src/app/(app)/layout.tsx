import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: escritorios }, { count: pendCount }] = await Promise.all([
    supabase.from('profiles').select('nome').eq('id', user.id).single(),
    supabase.from('escritorios').select('id,nome').eq('arquivado', false).order('ordem'),
    supabase.from('demandas').select('*', { count: 'exact', head: true }).eq('status', 'aguardando_terceiros'),
  ]);

  return <Shell profile={profile} escritorios={escritorios ?? []} badges={{ pendencias: pendCount ?? 0 }}>{children}</Shell>;
}
