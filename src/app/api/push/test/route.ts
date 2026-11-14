import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export const runtime = 'nodejs'; // Web Push precisa do Node, não pode ser Edge

export async function POST() {
  webpush.setVapidDetails(
    'mailto:contato@yasmin.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: subs } = await supabase.from('push_subscriptions').select('subscription').eq('user_id', user.id);
  if (!subs || subs.length === 0) return NextResponse.json({ error: 'Nenhuma inscrição encontrada' }, { status: 404 });

  try {
    await webpush.sendNotification(
      subs[0].subscription,
      JSON.stringify({
        title: 'Yasmin',
        body: 'Olha só! As notificações estão funcionando perfeitamente. 🚀',
        url: '/'
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
