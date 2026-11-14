import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await req.json();

  // Deleta inscrições antigas desse usuário para não acumular
  await supabase.from('push_subscriptions').delete().eq('user_id', user.id);

  // Insere a nova
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    subscription
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
