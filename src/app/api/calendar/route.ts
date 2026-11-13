import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatICSDate(date: string, time?: string | null) {
  const d = date.replace(/-/g, '');
  if (!time) return `${d}T120000Z`;
  const t = time.replace(/:/g, '').slice(0, 4);
  return `${d}T${t}00Z`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: demandas } = await supabase.from('demandas').select('*, obras(nome)').neq('status', 'concluida');

  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Yasmin//PT-BR//EN\r\nCALSCALE:GREGORIAN\r\n`;

  demandas?.forEach(d => {
    ics += `BEGIN:VEVENT\r\n`;
    ics += `UID:${d.id}@yasmin.app\r\n`;
    ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
    ics += `DTSTART:${formatICSDate(d.data, d.hora_inicio)}\r\n`;
    if (d.hora_fim) ics += `DTEND:${formatICSDate(d.data, d.hora_fim)}\r\n`;
    ics += `SUMMARY:${d.titulo}${d.revisao ? ` (${d.revisao})` : ''}\r\n`;
    if (d.obras?.nome) ics += `DESCRIPTION:Obra: ${d.obras.nome}\r\n`;
    ics += `END:VEVENT\r\n`;
  });

  ics += `END:VCALENDAR\r\n`;

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="yasmin.ics"',
    },
  });
}
