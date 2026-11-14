'use client';
import { useEffect } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { createClient } from '@/lib/supabase/client';

export function Tutorial({ userId, concluido }: { userId: string, concluido: boolean }) {
  const supabase = createClient();

  useEffect(() => {
    if (concluido) return;

    const isMobile = window.innerWidth < 768;

    const timer = setTimeout(() => {
      const steps: DriveStep[] = [
        {
          element: 'body',
          popover: {
            title: 'Bem-vinda ao Yasmin!',
            description: 'Este é o seu caderno técnico digital. Vamos fazer um tour rápido para você explorar tudo o que ele pode fazer pelo seu dia.',
          }
        },
        {
          element: isMobile ? '[data-tour="home-mobile"]' : '[data-tour="home"]',
          popover: {
            title: 'Início',
            description: 'Aqui você vê o resumo do seu dia: tarefas, obras em andamento e o que está bloqueado esperando terceiros.',
            side: isMobile ? 'top' : 'right',
            align: 'start'
          }
        },
        {
          element: isMobile ? '[data-tour="fab-mobile"]' : '[data-tour="fab"]',
          popover: {
            title: 'Criação Rápida',
            description: 'Use este botão sempre que precisar criar uma tarefa, compromisso ou lembrete. Você pode até configurar para repetir toda semana!',
            side: isMobile ? 'top' : 'left',
            align: 'center'
          }
        },
        {
          element: isMobile ? '[data-tour="agenda-mobile"]' : '[data-tour="agenda"]',
          popover: {
            title: 'Agenda',
            description: 'Sua agenda completa, com visões mensal, semanal e diária. Tudo o que você cria cai aqui automaticamente.',
            side: isMobile ? 'top' : 'right',
            align: 'start'
          }
        },
        {
          element: isMobile ? '[data-tour="obras-mobile"]' : '[data-tour="obras"]',
          popover: {
            title: 'Obras & Clientes',
            description: 'O coração do app. Cadastre clientes e obras, e dentro de cada obra acesse o Checklist, Premissas, ART e Financeiro.',
            side: isMobile ? 'top' : 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="financeiro"]',
          popover: {
            title: 'Financeiro',
            description: 'Saiba exatamente quanto você tem para receber de todas as obras, com gráficos de evolução mês a mês.',
            side: isMobile ? 'bottom' : 'right',
            align: 'start'
          }
        }
      ];

      if (!isMobile) {
        steps.push({
          element: '[data-tour="pendencias"]',
          popover: {
            title: 'Pendências',
            description: 'Aqui ficam as tarefas com status "Aguardando terceiros". Perfeito para ver o que está travado esperando o arquiteto.',
            side: 'right',
            align: 'start'
          }
        });
      }

      steps.push({
        element: isMobile ? '[data-tour="config-mobile"]' : '[data-tour="config"]',
        popover: {
          title: 'Configurações',
          description: 'Aqui você muda sua foto, gerencia escritórios, ativa notificações e sincroniza com o Google Agenda.',
          side: isMobile ? 'top' : 'right',
          align: 'start'
        }
      });

      if (!isMobile) {
        steps.push({
          element: '[data-tour="avatar"]',
          popover: {
            title: 'Seu Perfil',
            description: 'Sua foto e nome no app. Sinta-se em casa!',
            side: 'right',
            align: 'center'
          }
        });
      }

      steps.push({
        element: 'body',
        popover: {
          title: 'Tudo pronto! 🚀',
          description: 'Agora você tem o controle total do seu dia e dos seus projetos. Bom trabalho!',
        }
      });

      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Concluir',
        progressText: '{{current}} de {{total}}',
        popoverClass: 'yasmin-tour-theme',
        steps,
        onDestroyed: async () => {
          await supabase.from('profiles').update({ tutorial_concluido: true }).eq('id', userId);
        }
      });

      driverObj.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, [concluido, supabase, userId]);

  return null;
}
