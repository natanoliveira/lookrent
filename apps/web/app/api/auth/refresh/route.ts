import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lookrent/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from '@/lib/session'

/** Sanitiza o parâmetro `next` para evitar Open Redirect. */
function safePath(next: string | null): string {
  if (!next) return '/dashboard'
  // Aceita apenas caminhos relativos que começam com '/' mas não com '//'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

async function doRefresh(request: NextRequest): Promise<{
  success: boolean
  userId?: string
  response?: NextResponse
}> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return { success: false }

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload?.sub) return { success: false }

  const usuario = await prisma.usuario.findFirst({
    where: { id: payload.sub, ativo: true },
    select: {
      id: true,
      empresaId: true,
      role: true,
      nome: true,
      email: true,
      avatarUrl: true,
      empresa: { select: { ativo: true } },
    },
  })

  if (!usuario || !usuario.empresa.ativo) return { success: false }

  const newAccessToken = await signAccessToken({
    sub: usuario.id,
    empresaId: usuario.empresaId,
    role: usuario.role,
    nome: usuario.nome,
    email: usuario.email,
    avatarUrl: usuario.avatarUrl,
  })

  const newRefreshToken = await signRefreshToken(usuario.id)

  return { success: true, userId: usuario.id, response: buildResponse(newAccessToken, newRefreshToken) }
}

function buildResponse(accessToken: string, refreshToken: string): NextResponse {
  const res = NextResponse.json({ message: 'Token renovado' })
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 60 })
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 })
  return res
}

// GET — acionado pelo redirect do middleware: /api/auth/refresh?next=/dashboard
export async function GET(request: NextRequest) {
  const next = safePath(request.nextUrl.searchParams.get('next'))

  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
    if (!refreshToken) return NextResponse.redirect(new URL('/login', request.url))

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload?.sub) return NextResponse.redirect(new URL('/login', request.url))

    const usuario = await prisma.usuario.findFirst({
      where: { id: payload.sub, ativo: true },
      select: {
        id: true,
        empresaId: true,
        role: true,
        nome: true,
        email: true,
        avatarUrl: true,
        empresa: { select: { ativo: true } },
      },
    })

    if (!usuario || !usuario.empresa.ativo) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const newAccessToken = await signAccessToken({
      sub: usuario.id,
      empresaId: usuario.empresaId,
      role: usuario.role,
      nome: usuario.nome,
      email: usuario.email,
      avatarUrl: usuario.avatarUrl,
    })
    const newRefreshToken = await signRefreshToken(usuario.id)

    const response = NextResponse.redirect(new URL(next, request.url))
    response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, { ...cookieOptions, maxAge: 60 * 60 })
    response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error('[AUTH/REFRESH GET]', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// POST — chamado programaticamente pelo cliente
export async function POST(request: NextRequest) {
  try {
    const result = await doRefresh(request)
    if (!result.success) {
      return NextResponse.json({ message: 'Refresh token inválido ou expirado' }, { status: 401 })
    }
    return result.response!
  } catch (error) {
    console.error('[AUTH/REFRESH POST]', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}
