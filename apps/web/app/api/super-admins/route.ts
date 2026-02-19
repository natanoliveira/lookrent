import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  empresaId: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req, { requiredAction: 'manage:empresa' })
  if (!guard.ok) return guard.response

  if (guard.session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { nome, email, password, empresaId } = parsed.data
  const targetEmpresaId = empresaId ?? guard.session.empresaId

  const exists = await prisma.usuario.findFirst({
    where: { email },
    select: { id: true },
  })
  if (exists) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
  }

  const senhaHash = await hash(password, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      role: 'SUPER_ADMIN',
      empresaId: targetEmpresaId,
      ativo: true,
    },
    select: { id: true, nome: true, email: true },
  })

  await logAudit({
    actorUserId: guard.session.sub,
    action: 'super_admin.create',
    targetType: 'usuario',
    targetId: usuario.id,
    meta: { email: usuario.email, empresaId: targetEmpresaId },
  })

  return NextResponse.json({ usuario })
}
