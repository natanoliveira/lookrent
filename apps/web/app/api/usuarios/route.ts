import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const createSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(['ADMIN', 'GERENTE', 'ATENDENTE']),
})

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithPermission(req, {
    limit: 10,
    windowMs: 60_000,
    resource: 'usuarios',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const exists = await prisma.usuario.findFirst({
      where: { email: parsed.data.email, empresaId: guard.session.empresaId },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json({ error: 'E-mail já cadastrado nesta empresa.' }, { status: 409 })
    }

    const senhaHash = await hash(parsed.data.senha, 10)
    const usuario = await prisma.usuario.create({
      data: {
        empresaId: guard.session.empresaId,
        nome: parsed.data.nome,
        email: parsed.data.email,
        senhaHash,
        role: parsed.data.role,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, id: usuario.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/usuarios]', err)
    return NextResponse.json({ error: 'Erro interno ao criar usuário.' }, { status: 500 })
  }
}
