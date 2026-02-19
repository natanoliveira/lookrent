import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/session'

export async function POST(req: NextRequest) {
  // Verificação de CSRF: garante que o logout só pode ser iniciado pela própria origem
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  if (origin && host) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Origem da requisição inválida' }, { status: 403 })
    }
  }

  const response = NextResponse.json({ message: 'Logout realizado com sucesso' })

  // Expira os cookies com as mesmas opções usadas na criação
  const cookieOpts = { path: '/', maxAge: 0 }
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', cookieOpts)
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', cookieOpts)

  return response
}
