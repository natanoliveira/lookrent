---
Etapas de Implementação

1. Scaffold do Monorepo

- Criar package.json raiz com workspaces e scripts Turborepo
- Criar pnpm-workspace.yaml
- Criar turbo.json com pipelines: build, dev, lint, typecheck

2. Package: packages/config

- tsconfig/base.json e tsconfig/nextjs.json
- tailwind/index.ts — preset com paleta de marca e font
- eslint/index.js — base ESLint config

3. Package: packages/utils

- cn.ts — clsx + tailwind-merge
- format.ts — formatadores de moeda (BRL), datas (pt-BR), CPF/CNPJ
- validators.ts — validação CPF e CNPJ

4. Package: packages/db

- schema.prisma completo com todas as entidades do spec
- src/index.ts — singleton PrismaClient (dev hot-reload safe)
- Script db:generate, db:push, db:migrate

5. Package: packages/ui

- Instalar shadcn/ui (CLI init)
- Re-exportar componentes base: Button, Input, Card, Table, Badge, Dialog, Form, Label, Select, Textarea, Separator, Skeleton, Toast/Sonner,
Avatar, DropdownMenu

6. App: apps/web — Setup

- Next.js 14+ com App Router e TypeScript
- TailwindCSS com preset de @lookrent/config
- Importar @lookrent/ui, @lookrent/db, @lookrent/utils
- Variáveis de ambiente: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NEXT_PUBLIC_APP_URL

7. Autenticação (JWT + HTTPOnly Cookies)

- lib/auth.ts — signAccessToken(), signRefreshToken(), verifyToken()
- lib/session.ts — getSession() lê cookie do request/headers
- lib/rbac.ts — hasPermission(role, action) e constante de permissões por role
- app/api/auth/login/route.ts — valida credenciais, seta cookies HTTPOnly (access_token, refresh_token)
- app/api/auth/logout/route.ts — limpa cookies
- app/api/auth/refresh/route.ts — valida refresh token e emite novo access token

8. Middleware de Proteção de Rotas

- middleware.ts — intercepta todas as rotas exceto /(auth) e /api/auth
- Lê access_token do cookie, verifica JWT
- Redireciona para /login se inválido ou expirado
- Tenta refresh automático se access token expirado

9. Layout do Dashboard

- (dashboard)/layout.tsx — sidebar + header + main content area
- components/layout/sidebar.tsx — nav com links: Dashboard, Aluguéis, Clientes, Produtos, Contratos, Financeiro, Configurações
- components/layout/header.tsx — nome da empresa, avatar usuário, logout
- Cores da marca aplicadas

10. Página de Login

- Layout dividido: esquerda = formulário, direita = descrição + diferenciais
- components/auth/login-form.tsx — form com Zod + react-hook-form, chama /api/auth/login
- Responsivo (mobile: só o formulário)

11. Páginas Stub (rotas vazias com placeholder)

- Uma página para cada rota do dashboard com título e descrição do módulo
- Permite navegar e verificar RBAC sem precisar de features completas

---
Schema Prisma — Entidades

Todas as entidades do prompt.md:
- Empresa, Usuario (role: ADMIN/GERENTE/ATENDENTE)
- Cliente (índice cpf + empresaId)
- Produto (quantidadeTotal, quantidadeDisponivel)
- Contrato (numeroContrato, qrCode, status)
- ItemContrato
- MovimentacaoAluguel (tipo: RETIRADA/DEVOLUCAO)
- FormaPagamento
- Pagamento (status: PENDENTE/PAGO/CANCELADO)
- ContaReceber
- Ticket
- ConfiguracaoEmpresa

---
Variáveis de Ambiente Necessárias

DATABASE_URL=          # Neon PostgreSQL connection string
JWT_SECRET=            # 32+ char random string
JWT_REFRESH_SECRET=    # 32+ char random string (diferente)
NEXT_PUBLIC_APP_URL=   # ex: http://localhost:3000

---
Verificação

1. pnpm install na raiz instala todos os workspaces
2. pnpm dev inicia apps/web em http://localhost:3000
3. / redireciona para /login
4. Login com credenciais válidas seta cookies e redireciona para /dashboard
5. Acesso direto a /dashboard sem cookie redireciona para /login
6. Logout limpa cookies e redireciona para /login
7. pnpm --filter @lookrent/db db:push aplica schema no Neon
8. TypeScript sem erros em todos os packages

---
Arquivos Críticos

- /apps/web/middleware.ts — proteção de rotas
- /apps/web/lib/auth.ts — JWT helpers
- /apps/web/app/api/auth/login/route.ts — login endpoint
- /packages/db/prisma/schema.prisma — schema completo
- /packages/config/tailwind/index.ts — preset de tema
- /turbo.json — pipelines do monorepo
- /pnpm-workspace.yaml — workspace config