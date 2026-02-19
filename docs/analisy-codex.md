# Análise de Segurança e Arquitetura — LookRent

Data: 2026-02-18

## Escopo analisado
- Monorepo pnpm + Turbo (`package.json`, `turbo.json`, `pnpm-workspace.yaml`).
- App Next.js em `apps/web` (App Router, API Routes, middleware, auth, serviços, UI).
- Banco Prisma em `packages/db` (schema e seed).
- Utilitários e UI compartilhada em `packages/utils` e `packages/ui`.

## Visão geral da arquitetura
- Frontend e backend estão no mesmo app Next.js (`apps/web`), com API Routes para operações de negócio (`/api/*`).
- Autenticação via JWT (access/refresh) com cookies HTTP-only (`apps/web/lib/auth.ts`, `apps/web/lib/session.ts`).
- Middleware de proteção global para rotas privadas (`apps/web/middleware.ts`).
- Prisma como camada de persistência (`packages/db/prisma/schema.prisma`).
- Pacotes compartilhados para UI, utilitários e configurações (`packages/ui`, `packages/utils`, `packages/config`).

## Pontos positivos
- Uso de bcrypt para senha (`apps/web/app/api/auth/login/route.ts`).
- Cookies `httpOnly`, `sameSite=lax`, `secure` condicionado ao ambiente (`apps/web/lib/session.ts`).
- Security headers globais no Next (`apps/web/next.config.ts`).
- Rate limiting básico em login e APIs (`apps/web/lib/rate-limit.ts`).
- Validação de payloads com Zod nas rotas críticas (`apps/web/app/api/*`).
- Multi-tenant modelado com `empresaId` nas entidades do Prisma.

## Achados e riscos (ordenados por severidade)

### 1) Autorização por papel (RBAC) não aplicada nas rotas
- O RBAC existe em `apps/web/lib/rbac.ts`, mas não é usado nas rotas (`/api/produtos`, `/api/clientes`, `/api/contratos`).
- Hoje, qualquer usuário autenticado pode executar operações administrativas (ex: criar produto ou contrato).

Impacto: risco de abuso interno e violações de permissão.

### 2) Refresh token sem revogação e sem persistência
- Refresh tokens são totalmente stateless e não há registro em banco.
- Logout apenas limpa cookies; um refresh token roubado permanece válido até expirar.

Impacto: sessão pode ser reativada mesmo após logout.

### 3) CSRF parcial no fluxo de refresh
- `apiGuard` protege rotas de mutação, mas o refresh via `GET /api/auth/refresh` altera cookies.
- O mesmo endpoint pode ser acionado por um terceiro contexto (embora `sameSite=lax` mitigue bastante).

Impacto: risco baixo, mas existe superfície de CSRF com cookies sendo renovados.

### 4) Validação de multi-tenant incompleta no contrato
- Na criação de contrato (`apps/web/app/api/contratos/route.ts`), o `clienteId` não é validado contra `empresaId`.
- Um usuário poderia referenciar um cliente de outra empresa se obtiver o ID.

Impacto: violação de isolamento de tenant.

### 5) Concorrência e consistência de estoque
- A redução de estoque usa `decrement` sem verificação atômica por quantidade disponível.
- Conflitos simultâneos podem gerar estoque negativo em cenários concorrentes.

Impacto: inconsistência de dados.

### 6) Rate limiting em memória
- O rate limiter é in-memory e não é compartilhado entre instâncias.
- Em deploys serverless ou com múltiplas instâncias, a proteção pode ser contornada.

Impacto: proteção parcial contra força bruta e abuso.

## Sugestões de melhoria (priorizadas)

### Alta prioridade
1. Aplicar RBAC nas rotas de API.
   - Criar um helper para checar `guard.session.role` com `hasPermission`.
   - Exigir permissões específicas por endpoint (ex: `manage:produtos` para criar produto).

2. Garantir isolamento multi-tenant na criação de contratos.
   - Validar se `clienteId` pertence à mesma `empresaId` antes de criar.
   - Preferir query única no Prisma verificando `clienteId` + `empresaId`.

3. Tornar refresh token revogável.
   - Persistir refresh tokens com `jti`, `userId`, `expiresAt`, `revokedAt`.
   - Invalidar no logout e fazer rotação segura (token novo invalida o anterior).

### Média prioridade
4. Ajustar o fluxo de refresh para POST-only (ou exigir CSRF token).
   - Evitar mutação de cookies via GET.
   - Para o redirect do middleware, usar uma página intermediária que faz POST via fetch.

5. Implementar controle de estoque atômico.
   - Alternativas: `updateMany` com condição `quantidadeDisponivel >= qtd` ou transação com bloqueio.

6. Substituir rate limiter por Redis/Upstash.
   - Importante para ambientes com múltiplas instâncias.

### Baixa prioridade
7. Gerar número de contrato com sequência única.
   - Evitar colisões e loops de tentativa.

8. Melhorar validação de CPF/telefone.
   - Usar validadores específicos e normalização consistente.

9. Condicionar HSTS apenas em produção.
   - Evita efeitos colaterais em ambientes locais HTTP.

## Observações adicionais
- Não encontrei testes automatizados no repositório. Recomendo iniciar pelos fluxos críticos (login, criação de contrato, redução de estoque) para evitar regressões.
- O seed define senha padrão (`senha123`). Isso é aceitável em ambientes locais, mas não deve ser usado em produção.

## Conclusão
A base está bem estruturada para um SaaS multi-tenant simples e já possui medidas de segurança relevantes (JWT, cookies seguros, rate limiting, headers). As maiores lacunas estão em autorização por papel, revogação de refresh token e validações de isolamento de tenant. Com esses pontos ajustados, o projeto fica bem mais alinhado a requisitos de segurança e escalabilidade.
