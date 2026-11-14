import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatICSDate(date: string, time?: string | null) {
  const d = date.replace(/-/g, '');
  if (!time) return `${d}`;
  const t = time.replace(/:/g, '').slice(0, 4);
  return `${d}T${t}00Z`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Chama a função RPC segura no banco de dados
  const { data: demandas, error } = await supabase.rpc('get_calendar_demandas', {
    p_token: token
  });

  // Se a função não retornar nada, o token é inválido
  if (error || !demandas || demandas.length === 0) {
    return new NextResponse('Calendar not found or empty', { status: 404 });
  }

  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Yasmin//PT-BR//EN\r\nCALSCALE:GREGORIAN\r\n`;

  demandas.forEach((d: any) => {
    ics += `BEGIN:VEVENT\r\n`;
    ics += `UID:${d.id}@yasmin.app\r\n`;
    ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
    
    if (d.hora_inicio) {
      ics += `DTSTART:${formatICSDate(d.data, d.hora_inicio)}\r\n`;
      if (d.hora_fim) ics += `DTEND:${formatICSDate(d.data, d.hora_fim)}\r\n`;
    } else {
      ics += `DTSTART;VALUE=DATE:${formatICSDate(d.data)}\r\n`;
    }
    
    ics += `SUMMARY:${d.titulo}${d.revisao ? ` (${d.revisao})` : ''}\r\n`;
    if (d.obra_nome) ics += `DESCRIPTION:Obra: ${d.obra_nome}\r\n`;
    ics += `END:VEVENT\r\n`;
  });

  ics += `END:VCALENDAR\r\n`;

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="yasmin.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
