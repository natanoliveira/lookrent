import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const updateSchema = z.object({
  status: z.enum(['ATIVO', 'FINALIZADO', 'PENDENTE', 'CANCELADO']).optional(),
  dataFim: z.string().optional(),
  observacoes: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'contratos',
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
    const existing = await prisma.contrato.findUnique({
      where: { id, empresaId: guard.session.empresaId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      const nextStatus = data.status ?? existing.status

      await tx.contrato.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.dataFim && { dataFim: new Date(data.dataFim) }),
          ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
        },
      })

      if (data.status && data.status !== existing.status) {
        if (nextStatus === 'ATIVO') {
          const already = await tx.movimentacaoAluguel.findFirst({
            where: { contratoId: id, tipo: 'RETIRADA' },
            select: { id: true },
          })
          if (!already) {
            await tx.movimentacaoAluguel.create({
              data: {
                contratoId: id,
                tipo: 'RETIRADA',
                observacao: 'Contrato ativado',
              },
            })
          }
        }

        if (nextStatus === 'FINALIZADO') {
          const already = await tx.movimentacaoAluguel.findFirst({
            where: { contratoId: id, tipo: 'DEVOLUCAO' },
            select: { id: true },
          })
          if (!already) {
            await tx.movimentacaoAluguel.create({
              data: {
                contratoId: id,
                tipo: 'DEVOLUCAO',
                observacao: 'Contrato finalizado',
              },
            })
          }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/contratos/[id]]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar contrato.' }, { status: 500 })
  }
}
