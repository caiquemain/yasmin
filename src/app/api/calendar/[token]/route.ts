import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatICSDate(date: string, time?: string | null) {
  // Remove os traços da data (YYYY-MM-DD -> YYYYMMDD)
  const d = date.replace(/-/g, '');
  if (!time) return `${d}`; // Dia inteiro
  
  // Para horários, remove os ':' (HH:MM -> HHMM) e adiciona os segundos e o Z (UTC)
  const t = time.replace(/:/g, '').slice(0, 4);
  return `${d}T${t}00Z`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Usamos o Service Role (ou a Anon Key) para buscar os dados do usuário dono do token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Busca o usuário pelo token único
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('calendar_token', token)
    .single();

  if (!profile) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Busca as demandas desse usuário específico
  const { data: demandas } = await supabase
    .from('demandas')
    .select('*, obras(nome)')
    .eq('user_id', profile.id)
    .neq('status', 'concluida');

  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Yasmin//PT-BR//EN\r\nCALSCALE:GREGORIAN\r\n`;

  demandas?.forEach(d => {
    ics += `BEGIN:VEVENT\r\n`;
    ics += `UID:${d.id}@yasmin.app\r\n`;
    ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
    
    // Formatação especial se tiver hora (Senão é dia inteiro)
    if (d.hora_inicio) {
      ics += `DTSTART:${formatICSDate(d.data, d.hora_inicio)}\r\n`;
      if (d.hora_fim) ics += `DTEND:${formatICSDate(d.data, d.hora_fim)}\r\n`;
    } else {
      ics += `DTSTART;VALUE=DATE:${formatICSDate(d.data)}\r\n`;
    }
    
    ics += `SUMMARY:${d.titulo}${d.revisao ? ` (${d.revisao})` : ''}\r\n`;
    if (d.obras?.nome) ics += `DESCRIPTION:Obra: ${d.obras.nome}\r\n`;
    ics += `END:VEVENT\r\n`;
  });

  ics += `END:VCALENDAR\r\n`;

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="yasmin.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Impede o Google de guardar em cache eterno
    },
  });
}
