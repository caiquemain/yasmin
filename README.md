# Yasmin - Caderno Técnico Digital

Aplicação web progressiva (PWA) de organização pessoal e gestão de projetos estruturais, desenvolvida sob medida para engenheira calculista.

## 🚀 Stack Técnica
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Estilização:** Tailwind CSS v3 + Design System customizado (Tema Rosa Editorial)
- **Banco de Dados & Auth:** Supabase (PostgreSQL, RLS, Auth com Google/Magic Link)
- **Deploy:** Vercel
- **Bibliotecas:** `@supabase/ssr`, `date-fns`, `recharts`, `jspdf`, `driver.js`, `lucide-react`, `web-push`

## ✨ Funcionalidades Principais
- **Dashboard (Home):** Resumo do dia, obras em andamento e pendências bloqueadas.
- **Agenda:** Visões mensal, semanal e diária.
- **CRM Técnico:** Gestão hierárquica de Clientes → Obras.
- **Ficha da Obra:** Checklist de cálculo, Premissas Técnicas (fck, CAA, etc.), controle de ART e Financeiro.
- **Exportações:** Ficha da obra em PDF e sincronização com Google Agenda via feed `.ics`.
- **PWA:** Instalável, suporte a Dark Mode, Notificações Push e Service Worker com auto-update.
- **Extras:** Busca global (Cmd+K), tutorial guiado por página e backup de dados em JSON.

## 🛠️ Como rodar localmente
1. Clone o repositório: `git clone ...`
2. Instale as dependências: `npm install`
3. Configure o `.env.local` com as chaves do Supabase (URL, ANON_KEY, e VAPID keys do Web Push).
4. Rode o projeto: `npm run dev`

## 🔐 Segurança
- Row Level Security (RLS) ativado em todas as tabelas do banco.
- Headers de segurança (CSP, HSTS, X-Frame-Options) configurados no Next.js.
- Bucket de Storage (avatares) restrito a imagens de até 2MB.
