import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { prisma } from '@lookrent/db'

const schema = z.object({
  email: z.string().email(),
})

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  const { email } = parsed.data

  const usuario = await prisma.usuario.findFirst({
    where: { email, ativo: true },
    select: { id: true },
  })

  // Resposta genérica para não revelar se o e-mail existe.
  if (!usuario) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(24).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      usuarioId: usuario.id,
      tokenHash,
      expiresAt,
    },
  })

  return NextResponse.json({ success: true, resetToken: token })
}
