'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

export function Tutorial({ userId, concluido }: { userId: string, concluido: boolean }) {
  const [run, setRun] = useState(!concluido);
  const supabase = createClient();

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="font-serif text-2xl text-petrol-deep mb-2">Bem-vinda ao Yasmin!</h2>
          <p className="text-sm text-ink">Este é o seu caderno técnico digital. Vamos fazer um tour rápido para você explorar tudo o que ele pode fazer pelo seu dia.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="home"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Início</h3>
          <p className="text-sm text-ink">Aqui você vê o resumo do seu dia: tarefas, obras em andamento e o que está bloqueado esperando terceiros.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="fab"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Criação Rápida</h3>
          <p className="text-sm text-ink">Use este botão sempre que precisar criar uma tarefa, compromisso ou lembrete. Você pode até configurar para repetir toda semana!</p>
        </div>
      ),
    },
    {
      target: '[data-tour="agenda"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Agenda</h3>
          <p className="text-sm text-ink">Sua agenda completa, com visões mensal, semanal e diária. Tudo o que você cria cai aqui automaticamente.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="obras"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Obras & Clientes</h3>
          <p className="text-sm text-ink">O coração do app. Cadastre clientes e obras, e dentro de cada obra acesse o Checklist, Premissas de Cálculo, ART e Financeiro.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="financeiro"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Financeiro</h3>
          <p className="text-sm text-ink">Saiba exatamente quanto você tem para receber de todas as obras, com gráficos de evolução mês a mês.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="pendencias"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Pendências</h3>
          <p className="text-sm text-ink">Aqui ficam as tarefas com status <strong>"Aguardando terceiros"</strong>. Perfeito para ver o que está travado esperando o arquiteto ou o cliente.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="config"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Configurações</h3>
          <p className="text-sm text-ink">Aqui você muda sua foto, gerencia escritórios, ativa notificações e pega o link para sincronizar com o Google Agenda.</p>
        </div>
      ),
    },
    {
      target: '[data-tour="avatar"]',
      content: (
        <div>
          <h3 className="font-serif text-lg text-petrol-deep mb-1">Seu Perfil</h3>
          <p className="text-sm text-ink">Sua foto e nome no app. Sinta-se em casa!</p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="font-serif text-2xl text-petrol-deep mb-2">Tudo pronto! 🚀</h2>
          <p className="text-sm text-ink">Agora você tem o controle total do seu dia e dos seus projetos. Bom trabalho!</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      await supabase.from('profiles').update({ tutorial_concluido: true }).eq('id', userId);
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      disableOverlayClose
      callback={handleJoyrideCallback}
      locale={{ back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular tutorial' }}
      styles={{
        options: {
          primaryColor: '#C85A7E',
          backgroundColor: '#FDF6F8',
          textColor: '#4A2330',
          arrowColor: '#FDF6F8',
          overlayColor: 'rgba(26, 18, 20, 0.8)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 4,
          border: '1px solid #D4AEB8',
          padding: '20px',
        },
        buttonNext: {
          backgroundColor: '#C85A7E',
          color: '#FDF6F8',
          borderRadius: 0,
          fontFamily: 'var(--font-plex-mono)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#A88C95',
          marginRight: '12px',
          fontFamily: 'var(--font-plex-mono)',
          fontSize: '12px',
        },
        buttonSkip: {
          color: '#A88C95',
          fontFamily: 'var(--font-plex-mono)',
          fontSize: '12px',
        },
      }}
    />
  );
}
