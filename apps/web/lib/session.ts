import { cookies } from 'next/headers'
import { verifyAccessToken, type JWTPayload } from './auth'

export const ACCESS_TOKEN_COOKIE = 'access_token'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'
export const ACTIVE_EMPRESA_COOKIE = 'empresa_ativa'

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) return null
  const session = await verifyAccessToken(token)
  if (!session) return null
  if (session.role === 'SUPER_ADMIN') {
    const activeEmpresa = cookieStore.get(ACTIVE_EMPRESA_COOKIE)?.value
    if (activeEmpresa) {
      return { ...session, empresaIdOriginal: session.empresaId, empresaId: activeEmpresa }
    }
  }
  return session
}

export async function getSessionOrThrow(): Promise<JWTPayload> {
  const session = await getSession()
  if (!session) throw new Error('Não autenticado')
  return session
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}
