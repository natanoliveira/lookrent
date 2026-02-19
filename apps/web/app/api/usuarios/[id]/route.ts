import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'GERENTE', 'ATENDENTE']).optional(),
  ativo: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuardWithPermission(req, {
    limit: 10,
    windowMs: 60_000,
    resource: 'usuarios',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const existing = await prisma.usuario.findUnique({
      where: { id, empresaId: guard.session.empresaId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    await prisma.usuario.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/usuarios/[id]]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar usuário.' }, { status: 500 })
  }
}
