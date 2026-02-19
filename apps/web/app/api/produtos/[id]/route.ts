import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const updateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  referencia: z.string().optional(),
  codigoInterno: z.string().optional(),
  tamanho: z.string().optional(),
  quantidadeTotal: z.coerce.number().int().min(1, 'Quantidade deve ser ao menos 1').optional(),
  valorLocacao: z.coerce.number().min(0.01, 'Informe o valor de locação').optional(),
  valorCusto: z.coerce.number().min(0).optional(),
  ativo: z.boolean().optional(),
  removido: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'produtos',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const { id } = await params

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

  const { data } = parsed

  try {
    const existing = await prisma.produto.findUnique({
      where: { id, empresaId: guard.session.empresaId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Ajusta quantidadeDisponivel proporcionalmente à mudança de quantidadeTotal
    const updateData: Record<string, unknown> = { ...data }
    if (data.quantidadeTotal !== undefined) {
      const diff = data.quantidadeTotal - existing.quantidadeTotal
      updateData.quantidadeDisponivel = Math.max(0, existing.quantidadeDisponivel + diff)
    }

    await prisma.produto.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/produtos/[id]]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar produto.' }, { status: 500 })
  }
}
