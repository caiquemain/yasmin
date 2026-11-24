import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const token = process.env.GITHUB_ISSUES_TOKEN;
  const repo = process.env.GITHUB_ISSUES_REPO || 'caiquemain/yasmin';
  if (!token) {
    return NextResponse.json(
      { error: 'Integração com GitHub ainda não configurada (GITHUB_ISSUES_TOKEN).' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const tipo = body?.tipo === 'sugestao' ? 'sugestao' : 'bug';
  const titulo = String(body?.titulo ?? '').trim().slice(0, 160);
  const descricao = String(body?.descricao ?? '').trim().slice(0, 4000);
  const rota = String(body?.rota ?? '').trim().slice(0, 200);
  const tela = String(body?.tela ?? '').trim().slice(0, 60);
  const userAgent = String(body?.userAgent ?? req.headers.get('user-agent') ?? '').trim().slice(0, 300);

  if (!titulo) {
    return NextResponse.json({ error: 'Por favor, informe um resumo do problema ou sugestão.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single();

  const autor = profile?.nome || user.email || 'Usuária';
  const prefixo = tipo === 'bug' ? '[Bug]' : '[Sugestão]';
  const label = tipo === 'bug' ? 'bug' : 'enhancement';
  const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const issueBody = [
    `## ${tipo === 'bug' ? 'Relato de problema' : 'Sugestão de melhoria'}`,
    '',
    descricao || '_Sem detalhes adicionais informados._',
    '',
    '---',
    '',
    '### Contexto automático',
    `- **Enviado por:** ${autor}`,
    `- **Página:** \`${rota || '/'}\``,
    `- **Data/hora (BRT):** ${dataHora}`,
    tela ? `- **Tela:** ${tela}` : null,
    userAgent ? `- **Dispositivo/Navegador:** \`${userAgent}\`` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const ghRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'yasmin-app-feedback',
    },
    body: JSON.stringify({
      title: `${prefixo} ${titulo}`,
      body: issueBody,
      labels: [label],
    }),
  });

  if (!ghRes.ok) {
    const errText = await ghRes.text().catch(() => '');
    console.error('GitHub issue creation failed:', ghRes.status, errText);
    return NextResponse.json(
      { error: 'Não foi possível abrir a issue no GitHub. Tente novamente.' },
      { status: 502 }
    );
  }

  const issue = await ghRes.json();
  return NextResponse.json({
    success: true,
    number: issue.number,
    url: issue.html_url,
  });
}
