import { createClient } from '@/lib/supabase/server';
import { ConfigClient } from '@/components/config/ConfigClient';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: escritorios }, { data: categorias }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('escritorios').select('*').eq('arquivado', false).order('ordem'),
    supabase.from('categorias').select('*').order('ordem')
  ]);

  return (
    <div className="max-w-[800px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-10">
        <h1 className="font-serif text-3xl text-petrol-deep mb-2">Configurações</h1>
        <p className="label-mono">Preferências da conta e gestão</p>
      </header>

      <ConfigClient 
        profile={profile} 
        escritorios={escritorios ?? []} 
        categorias={categorias ?? []} 
        userId={user!.id} 
      />
    </div>
  );
}
