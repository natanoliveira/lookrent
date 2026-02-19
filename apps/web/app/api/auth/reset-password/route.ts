import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@lookrent/db'

const schema = z.object({
  token: z.string().min(10),
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
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
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { token, newPassword } = parsed.data
  const tokenHash = hashToken(token)

  const reset = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { usuario: { select: { id: true, empresaId: true } } },
  })

  if (!reset) {
    return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 })
  }

  const senhaHash = await hash(newPassword, 10)

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: reset.usuarioId, empresaId: reset.usuario.empresaId },
      data: { senhaHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
