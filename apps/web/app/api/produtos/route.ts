import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const createSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  referencia: z.string().optional(),
  codigoInterno: z.string().optional(),
  tamanho: z.string().optional(),
  quantidadeTotal: z.coerce.number().int().min(1, 'Quantidade deve ser ao menos 1'),
  valorLocacao: z.coerce.number().min(0.01, 'Informe o valor de locação'),
  valorCusto: z.coerce.number().min(0).optional(),
})

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'produtos',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { data } = parsed

  try {
    const produto = await prisma.produto.create({
      data: {
        nome: data.nome,
        referencia: data.referencia || null,
        codigoInterno: data.codigoInterno || null,
        tamanho: data.tamanho || null,
        quantidadeTotal: data.quantidadeTotal,
        quantidadeDisponivel: data.quantidadeTotal,
        valorLocacao: data.valorLocacao,
        valorCusto: data.valorCusto ?? null,
        empresaId: guard.session.empresaId,
      },
    })

    return NextResponse.json({ success: true, id: produto.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/produtos]', err)
    return NextResponse.json({ error: 'Erro interno ao cadastrar produto.' }, { status: 500 })
  }
}
