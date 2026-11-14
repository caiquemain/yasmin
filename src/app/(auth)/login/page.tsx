'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

  const google = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl } });

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl } });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="hidden lg:flex w-[42%] bg-petrol-deep text-bg p-16 flex-col justify-between">
        <div className="font-logo text-4xl">Yasmin<span className="text-terra">.</span></div>
        <div>
          <p className="label-mono !text-petrol-soft mb-4">Organização pessoal · gestão de obras</p>
          <h1 className="font-logo text-4xl leading-tight">Um caderno técnico<br />para o seu dia.</h1>
          <p className="mt-6 text-sm text-bg/70 max-w-sm">Tarefas, agenda e o prontuário de cada obra — num só lugar.</p>
        </div>
        <p className="label-mono !text-bg/40">© Yasmin · 2026</p>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden font-logo text-3xl text-petrol-deep mb-8">Yasmin<span className="text-terra">.</span></div>
          <h2 className="font-serif text-2xl text-petrol-deep mb-1">Entrar</h2>
          <p className="text-sm text-ink-soft mb-8">Sem senha. Google ou link no email.</p>

          <button onClick={google} className="w-full flex items-center justify-center gap-3 py-3 border border-line-strong bg-surface hover:bg-bg text-sm font-medium transition">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Entrar com Google
          </button>

          <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-line" /><span className="label-mono">ou</span><div className="flex-1 h-px bg-line" /></div>

          {sent ? (
            <div className="p-4 bg-surface border border-line-strong text-sm">Link enviado para <strong>{email}</strong>. Abra o email para entrar.</div>
          ) : (
            <form onSubmit={magic} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-3 py-3 border border-line-strong bg-surface text-sm focus:outline-none focus:border-petrol" />
              <button type="submit" disabled={loading} className="w-full py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50">{loading ? 'Enviando…' : 'Enviar link de acesso'}</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
