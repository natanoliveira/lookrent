import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from '@/lib/session'
import { checkRateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export async function POST(request: NextRequest) {
  // Rate limiting por IP — 5 tentativas por minuto (proteção contra brute force)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rl = checkRateLimit(`login:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { message: 'Muitas tentativas de login. Aguarde um momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: result.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { email, password } = result.data

    const usuario = await prisma.usuario.findFirst({
      where: { email, ativo: true },
      select: {
        id: true,
        empresaId: true,
        nome: true,
        email: true,
        role: true,
        senhaHash: true,
        avatarUrl: true,
        empresa: { select: { id: true, nome: true, ativo: true } },
      },
    })

    // Resposta genérica para não revelar se o e-mail existe
    if (!usuario || !usuario.empresa.ativo) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }

    const passwordMatch = await compare(password, usuario.senhaHash)
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }

    const accessToken = await signAccessToken({
      sub: usuario.id,
      empresaId: usuario.empresaId,
      role: usuario.role,
      nome: usuario.nome,
      email: usuario.email,
      avatarUrl: usuario.avatarUrl,
    })

    const refreshToken = await signRefreshToken(usuario.id)

    const response = NextResponse.json({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresa: { id: usuario.empresa.id, nome: usuario.empresa.nome },
      },
    })

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60, // 1 hora
    })

    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return response
  } catch (error) {
    console.error('[AUTH/LOGIN]', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}
