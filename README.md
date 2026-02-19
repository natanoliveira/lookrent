# LookRent

Sistema de gestão de locação (MVP) para empresas, com foco em contratos, clientes, produtos, pagamentos e financeiro.

## Principais módulos
- Dashboard com indicadores
- Clientes e Produtos
- Contratos e pagamentos
- Financeiro
- Configurações da empresa e usuários
- Perfil do usuário com avatar
- Gestão de empresas (Super Admin)

## Stack
- Next.js (App Router)
- Prisma + PostgreSQL
- Turbo + PNPM (monorepo)
- React Hook Form + Zod

## Estrutura
- `apps/web` — aplicação web
- `packages/db` — Prisma schema e client
- `packages/ui` — componentes de UI
- `packages/utils` — utilitários

## Scripts
- `pnpm dev` — desenvolvimento
- `pnpm build` — build

