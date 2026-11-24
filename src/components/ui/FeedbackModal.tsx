'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Bug, Lightbulb, CheckCircle2 } from 'lucide-react';

export function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [tipo, setTipo] = useState<'bug' | 'sugestao'>('bug');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<{ number?: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErro(null);
    setEnviado(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    setTitulo('');
    setDescricao('');
    setErro(null);
    setEnviado(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!titulo.trim()) {
      setErro('Escreva um resumo rápido antes de enviar.');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          rota: pathname + (window.location.search || ''),
          tela: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error || 'Erro ao enviar. Tente novamente.');
        setLoading(false);
        return;
      }

      setEnviado({ number: data.number });
      setTitulo('');
      setDescricao('');
    } catch {
      setErro('Sem conexão com a internet. Tente novamente quando reconectar.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 transition-opacity" onClick={handleClose} />
      <div className="fixed z-50 flex flex-col bg-bg dark:bg-dark-surface border-line-strong dark:border-dark-line shadow-2xl overflow-hidden inset-x-0 bottom-0 h-auto max-h-[92dvh] border-t md:inset-y-0 md:right-0 md:left-auto md:w-[440px] md:h-full md:max-h-none md:border-l md:border-t-0 animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-dark-line">
          <h2 className="font-serif text-xl text-petrol-deep dark:text-petrol">
            Reportar problema ou ideia
          </h2>
          <button onClick={handleClose} className="text-ink-soft dark:text-dark-inkSoft hover:text-ink transition">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {enviado ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <CheckCircle2 size={44} className="text-olive" strokeWidth={1.5} />
            <div>
              <h3 className="font-serif text-2xl text-petrol-deep dark:text-petrol mb-1">
                Enviado com sucesso!
              </h3>
              <p className="text-sm text-ink-soft dark:text-dark-inkSoft max-w-xs">
                Seu relato foi registrado{enviado.number ? ` (#${enviado.number})` : ''} e já está na fila de melhorias.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface dark:bg-dark-bg border border-line-strong dark:border-dark-line">
              <button
                type="button"
                onClick={() => setTipo('bug')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-mono uppercase tracking-wider transition ${
                  tipo === 'bug'
                    ? 'bg-terra text-bg'
                    : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'
                }`}
              >
                <Bug size={14} /> Problema
              </button>
              <button
                type="button"
                onClick={() => setTipo('sugestao')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-mono uppercase tracking-wider transition ${
                  tipo === 'sugestao'
                    ? 'bg-petrol text-bg'
                    : 'text-ink-soft dark:text-dark-inkSoft hover:bg-line/50 dark:hover:bg-dark-line/50'
                }`}
              >
                <Lightbulb size={14} /> Sugestão
              </button>
            </div>

            <div className="space-y-1">
              <label className="label-mono">Resumo</label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={tipo === 'bug' ? 'Ex: Tarefa sumiu ao marcar concluída' : 'Ex: Poder anexar comprovante no pagamento'}
                className="w-full bg-transparent border-b border-line-strong dark:border-dark-line py-2 text-base focus:outline-none focus:border-petrol text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
              />
            </div>

            <div className="space-y-1">
              <label className="label-mono">O que aconteceu? (opcional)</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte com suas palavras o que tentou fazer ou o que gostaria de melhorar..."
                className="w-full bg-transparent border border-line-strong dark:border-dark-line p-3 text-sm focus:outline-none focus:border-petrol min-h-[120px] resize-none text-ink dark:text-dark-ink placeholder:text-ink-faint dark:placeholder:text-dark-inkSoft"
              />
            </div>

            <p className="text-xs text-ink-faint dark:text-dark-inkSoft leading-relaxed">
              A página atual (<span className="font-mono">{pathname}</span>) e o modelo do aparelho são enviados automaticamente para ajudar a resolver mais rápido.
            </p>

            {erro && (
              <div className="p-3 border border-terra bg-terra/10 text-terra text-xs">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-petrol-deep text-bg text-sm font-medium hover:bg-petrol transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar relato'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
