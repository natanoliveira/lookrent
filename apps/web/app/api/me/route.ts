import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/)
    .optional(),
})

export async function PATCH(req: NextRequest) {
  const guard = await apiGuard(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const data = parsed.data

  try {
    if (data.email) {
      const exists = await prisma.usuario.findFirst({
        where: {
          empresaId: guard.session.empresaId,
          email: data.email,
          NOT: { id: guard.session.sub },
        },
        select: { id: true },
      })
      if (exists) {
        return NextResponse.json({ error: 'E-mail já em uso nesta empresa.' }, { status: 409 })
      }
    }

    const senhaHash = data.newPassword ? await hash(data.newPassword, 10) : undefined

    await prisma.usuario.update({
      where: { id: guard.session.sub, empresaId: guard.session.empresaId },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.email && { email: data.email }),
        ...(senhaHash && { senhaHash }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/me]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil.' }, { status: 500 })
  }
}
