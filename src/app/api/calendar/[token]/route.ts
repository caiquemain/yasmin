import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Formata a data. Para evitar problemas de fuso, usamos o formato flutuante (sem o Z no final)
function formatICSDate(date: string, time?: string | null) {
  const d = date.replace(/-/g, ''); // '2026-11-20' -> '20261120'
  if (!time) return `${d}`;
  const t = time.replace(/:/g, '').slice(0, 4); // '18:09:00' -> '1809'
  return `${d}T${t}00`; 
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

  if (error) {
    console.error("Erro RPC:", error);
    return NextResponse.json({ erro_no_banco: error.message }, { status: 500 });
  }

  // Se o token for válido mas não tiver tarefas, retorna um calendário vazio válido
  if (!demandas) {
    return new NextResponse('Calendar not found', { status: 404 });
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
      'Content-Disposition': 'inline; filename="yasmin.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
