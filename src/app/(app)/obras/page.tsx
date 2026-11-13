import { createClient } from '@/lib/supabase/server';
import { ObrasClient } from '@/components/obras/ObrasClient';

export const dynamic = 'force-dynamic';

export default async function ObrasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: clientes }, { data: escritorios }] = await Promise.all([
    supabase.from('clientes').select(`
      id, nome, tipo, escritorios(nome),
      obras(id, nome, status_obra, area_m2, tipologias, obra_checklist(concluido))
    `).order('nome'),
    supabase.from('escritorios').select('id, nome').eq('arquivado', false).order('ordem')
  ]);

  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-10">
        <h1 className="font-serif text-3xl text-petrol-deep mb-2">Obras & Clientes</h1>
        <p className="label-mono">Caderno de projetos e prontuários técnicos</p>
      </header>

      <ObrasClient 
        clientes={clientes ?? []} 
        escritorios={escritorios ?? []} 
        userId={user!.id} 
      />
    </div>
  );
}
