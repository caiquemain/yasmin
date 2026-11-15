# Yasmin · Caderno Técnico Digital

Aplicação web progressiva (PWA) de organização pessoal e gestão de projetos estruturais, desenvolvida sob medida para engenheira calculista.

Deploy: yasmin-sepia.vercel.app

---

## Stack Técnica

- Framework: Next.js 16 (App Router, Turbopack, React 19)
- Estilização: Tailwind CSS v3 + Design System customizado (Tema Rosa Editorial)
- Banco de Dados & Auth: Supabase (PostgreSQL, RLS, Auth com Google e Magic Link)
- Deploy: Vercel

Bibliotecas principais:
- @supabase/ssr — Autenticação server-side
- date-fns — Manipulação de datas (pt-BR)
- recharts — Gráficos do módulo financeiro
- jspdf + jspdf-autotable — Geração de PDF da obra
- driver.js — Tours guiados
- lucide-react — Ícones
- web-push — Notificações push
- cmdk — Busca global (Cmd+K)

---

## Funcionalidades

### Núcleo
- Home (Dashboard): Saudação dinâmica, resumo do dia, tarefas, obras em andamento e bloqueadas
- Agenda: Visões mensal, semanal e diária
- CRM Técnico: Hierarquia Cliente → Obra, com ficha técnica completa
- Ficha da Obra: Checklist de cálculo (7 etapas automáticas + customizáveis), premissas técnicas (fck, CAA, σsolo, cobrimento), controle de ART e financeiro
- Criação Rápida (FAB): Modal com recorrência e vínculo a obra/cliente
- Pendências: Tela dedicada a tarefas "Aguardando terceiros"
- Financeiro Global: Gráfico de evolução mensal e lista de parcelas
- Configurações: Perfil, escritórios, categorias, backup e Google Agenda

### Fase 2 e 3
- PWA instalável: Splash screen animada, ícone maskable, manifest completo
- Modo Offline (Write-Only): Criar tarefas sem internet com fila de sincronização
- Dark Mode: Tema rosa editorial e modo escuro completo
- Notificações Push: Web Push via VAPID
- Exportação em PDF: Ficha técnica client-side com jspdf
- Sincronização Google Agenda: Feed .ics público via token único
- Busca Global: Atalho Cmd+K / Ctrl+K
- Tours Guiados: driver.js por página
- Atalho ESC: Fecha modais no desktop

---

## Como rodar localmente

    git clone https://github.com/caiquemain/yasmin.git
    cd yasmin
    npm install
    npm run dev

Acesse http://localhost:3000

---

## Variáveis de ambiente

Crie um arquivo .env.local na raiz do projeto:

    NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica

    NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica-vapid
    VAPID_PRIVATE_KEY=sua-chave-privada-vapid

Para gerar as chaves VAPID (necessárias para Web Push):

    npx web-push generate-vapid-keys

---

## Estrutura do Banco de Dados

Tabelas principais (todas com RLS ativo):

| Tabela | Descrição |
|---|---|
| profiles | Dados do usuário (nome, avatar, token de calendário, tutorial) |
| escritorios | Escritórios onde a usuária presta serviço |
| clientes | Arquitetos, construtoras, clientes finais |
| obras | Projetos com premissas técnicas e status |
| obra_checklist | Etapas de cálculo (padrão + customizadas) |
| obra_parcelas | Financeiro da obra |
| demandas | Tarefas e compromissos |
| categorias | Categorias coloridas |
| push_subscriptions | Inscrições de Web Push |

Função RPC: get_calendar_demandas(p_token uuid) — SECURITY DEFINER para permitir que o Google Agenda leia o feed .ics sem autenticação.

---

## Segurança

- Row Level Security (RLS) ativo em todas as tabelas
- Headers de segurança via next.config.ts: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Bucket de Storage (avatars): público para leitura, upload restrito ao próprio usuário, máximo 2MB e apenas image/png, image/jpeg, image/webp
- Service Worker: updateViaCache none para evitar cache poisoning
- Feed de calendário: protegido por token UUID único por usuário
- Nenhuma chave secreta no frontend — apenas a anon key do Supabase

---

## Estrutura do projeto

    src/
    ├── app/
    │   ├── (app)/                    Rotas autenticadas
    │   ├── (auth)/login/             Tela de login
    │   ├── api/
    │   │   ├── calendar/[token]/     Feed .ics por usuário
    │   │   └── push/                 Subscribe e teste de push
    │   ├── auth/callback/            Callback OAuth
    │   ├── icon.tsx                  Favicon dinâmico
    │   ├── apple-icon.tsx            Ícone iOS
    │   ├── icon-maskable.tsx         Ícone maskable Android
    │   └── opengraph-image.tsx       Preview ao compartilhar link
    ├── components/
    │   ├── agenda/                   AgendaClient
    │   ├── config/                   ConfigClient
    │   ├── financeiro/               FinanceiroClient + gráfico
    │   ├── home/                     Componentes da Home
    │   ├── obras/                    ObrasClient + ObraDetailClient
    │   ├── pendencias/               PendenciasClient
    │   ├── shell/                    Shell, EscritorioFilter
    │   └── ui/                       QuickAdd, SearchModal, Tutorial, etc.
    ├── hooks/
    │   ├── useOfflineSync.ts         Sincronização de fila offline
    │   ├── useTrackRoute.ts          Rastreamento de rotas cacheadas
    │   └── useEscape.ts              Atalho ESC
    ├── lib/
    │   ├── supabase/                 Clients browser e server
    │   ├── offline/                  syncManager (fila localStorage)
    │   └── generateObraPDF.ts        Geração de PDF
    └── proxy.ts                      Middleware de autenticação

---

## Build de produção

    npm run build
    npm run start

O projeto usa Turbopack e TypeScript em modo estrito. Qualquer erro de tipagem quebra o build.

---

## Deploy

Deploy automático na Vercel ao dar push na branch main do GitHub. As variáveis de ambiente devem estar configuradas em Vercel → Project Settings → Environment Variables.

Após o deploy, atualizar no Supabase (Authentication → URL Configuration):

- Site URL: https://seu-dominio.vercel.app
- Redirect URLs: https://seu-dominio.vercel.app/auth/callback

---

## Documentação adicional

- MANUAL_DA_YASMIN.md — Guia completo de uso do app para a usuária final
- FAQ.md — Perguntas frequentes

---


---

## Backlog / Próximos Passos

Estas são as funcionalidades e melhorias que ficaram **fora do escopo do MVP** e que podem ser implementadas no futuro, conforme o uso real revelar necessidade.

### Features opcionais

| Feature | Complexidade | Quando faz sentido |
|---|---|---|
| Notificações push automáticas de vencimento (Cron Job às 8h) | Baixa | Após 2-4 semanas de uso, se a Yasmin esquecer tarefas |
| Edição de tarefa no modo offline (UI otimista) | Alta | Se ela reclamar de não poder editar no canteiro sem sinal |
| Domínio próprio (yasmin.app.br) | Baixa | Antes de compartilhar com clientes (credibilidade) |
| Google Agenda Two-Way (OAuth real) | Alta | Se ela reclamar que precisa editar eventos pelo Google |
| Relatório mensal em PDF (faturamento por escritório) | Média | Se ela tiver muitos clientes e precisar formalizar |
| Multi-usuário (convidar estagiário/sócio) | Alta | Se ela montar equipe |
| Upload de anexos (DWG, IFC, PDF) | Média | Se ela quiser centralizar arquivos no app (hoje usa Drive) |
| Customização de tipologias estruturais | Baixa | Se ela precisar de protensão, pré-moldado, madeira etc |
| Filtro de tarefas por data/prioridade na Home | Baixa | Quando o volume de tarefas crescer |

### Limitações conhecidas

- **Offline (Write-Only):** criar/concluir/deletar funcionam offline. Editar requer conexão. Visualizar lista antiga também requer conexão.
- **Google Agenda:** sincronização é one-way (app → Google via ICS). Latência de algumas horas.
- **Notificações push:** funcionam com o app fechado, mas exigem permissão ativada manualmente em Configurações.
- **Magic Link (email):** no plano free do Supabase, o envio de email tem limite de 2/hora. Por isso o Google OAuth é o método recomendado.
- **Supabase free tier:** o projeto pausa se ficar 7 dias sem acesso. Basta acessar uma vez por semana para manter ativo.

### Ideias para fase 5+

- Dashboard com KPI de produtividade semanal
- Integração com Trello/Notion (importar/exportar)
- Análise de rentabilidade por obra (honorários vs horas gastas)
- Templates de checklist por tipologia estrutural
- Modo apresentação (para mostrar obra ao cliente)
- Assinatura digital de documentos (ART, contratos)

---

## Autor

Desenvolvido por Caique Main (https://github.com/caiquemain) para uso pessoal de uma engenheira calculista.
