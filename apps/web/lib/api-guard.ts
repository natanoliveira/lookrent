/**
 * apiGuard — proteção centralizada para Route Handlers (POST /api/*).
 *
 * Camadas de defesa:
 *  1. Autenticação JWT (session obrigatória)
 *  2. Verificação de origem CSRF (Origin vs Host)
 *  3. Rate limiting por usuário + método + rota
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'
import { hasPermission, type Action } from '@/lib/rbac'

const PERMISSIONS = {
  empresa: { manage: 'manage:empresa' },
  usuarios: { manage: 'manage:usuarios' },
  produtos: { manage: 'manage:produtos', view: 'view:produtos' },
  clientes: { manage: 'manage:clientes', view: 'view:clientes' },
  contratos: { manage: 'manage:contratos', view: 'view:contratos' },
  pagamentos: { manage: 'manage:pagamentos', view: 'view:pagamentos' },
  financeiro: { view: 'view:financeiro' },
  configuracoes: { manage: 'manage:configuracoes' },
} as const

export type PermissionResource = keyof typeof PERMISSIONS
export type PermissionScope<R extends PermissionResource> = keyof (typeof PERMISSIONS)[R]

export function permissionAction<R extends PermissionResource>(
  resource: R,
  scope: PermissionScope<R>,
): Action {
  return PERMISSIONS[resource][scope] as Action
}

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>

export interface GuardOptions {
  /** Máximo de requisições por janela. Default: 20 */
  limit?: number
  /** Janela de tempo em ms. Default: 60 s */
  windowMs?: number
  /** Verificar cabeçalho Origin para prevenção de CSRF. Default: true */
  csrf?: boolean
  /** Permissão exigida para acessar a rota */
  requiredAction?: Action
}

export type GuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

export interface GuardPermissionOptions<R extends PermissionResource = PermissionResource> {
  resource: R
  scope: PermissionScope<R>
  limit?: number
  windowMs?: number
  csrf?: boolean
}

export async function apiGuard(
  req: NextRequest,
  options: GuardOptions = {},
): Promise<GuardResult> {
  const { limit = 20, windowMs = 60_000, csrf = true, requiredAction } = options

  // ── 1. Autenticação ────────────────────────────────────────────────────────
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    }
  }

  if (requiredAction && !hasPermission(session.role, requiredAction)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    }
  }

  // ── 2. Prevenção de CSRF (verifica Origin === Host) ────────────────────────
  // Mutations devem sempre ter cabeçalho Origin (navegadores sempre enviam em fetch)
  const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (csrf && MUTATION_METHODS.includes(req.method)) {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')

    if (!origin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Cabeçalho Origin ausente' },
          { status: 403 },
        ),
      }
    }

    if (host) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return {
            ok: false,
            response: NextResponse.json(
              { error: 'Origem da requisição inválida' },
              { status: 403 },
            ),
          }
        }
      } catch {
        return {
          ok: false,
          response: NextResponse.json(
            { error: 'Origem da requisição inválida' },
            { status: 403 },
          ),
        }
      }
    }
  }

  // ── 3. Rate limiting (por usuário + método + rota) ─────────────────────────
  const key = `${session.sub}:${req.method}:${req.nextUrl.pathname}`
  const rl = checkRateLimit(key, limit, windowMs)

  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      ),
    }
  }

  return { ok: true, session }
}

export async function apiGuardWithPermission<R extends PermissionResource>(
  req: NextRequest,
  options: GuardPermissionOptions<R>,
): Promise<GuardResult> {
  const { resource, scope, ...rest } = options
  return apiGuard(req, { ...rest, requiredAction: permissionAction(resource, scope) })
}
