import { AgendaClient } from '@/components/agenda/AgendaClient';

export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  return (
    <div className="max-w-[1000px] px-6 md:px-[52px] py-8 md:py-11">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-petrol-deep dark:text-petrol mb-2">Agenda</h1>
        <p className="label-mono">Planejamento e prazos de entrega</p>
      </header>
      <AgendaClient />
    </div>
  );
}
