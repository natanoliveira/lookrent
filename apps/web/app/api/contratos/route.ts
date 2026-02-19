import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const itemSchema = z.object({
  produtoId: z.string().min(1, 'Selecione o produto'),
  quantidade: z.coerce.number().int().min(1, 'Mínimo 1'),
})

const createSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  dataInicio: z.string().min(1, 'Informe a data de início'),
  dataFim: z.string().min(1, 'Informe a data de término'),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um produto'),
})

function gerarNumeroContrato(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `CTR-${year}-${rand}`
}

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithPermission(req, {
    limit: 10,
    windowMs: 60_000,
    resource: 'contratos',
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
    const cliente = await prisma.cliente.findFirst({
      where: { id: data.clienteId, empresaId: guard.session.empresaId },
      select: { id: true },
    })
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
    }

    // Busca preços e valida estoque
    const produtosDB = await prisma.produto.findMany({
      where: {
        id: { in: data.itens.map((i) => i.produtoId) },
        empresaId: guard.session.empresaId,
      },
      select: { id: true, valorLocacao: true, quantidadeDisponivel: true, nome: true },
    })

    const produtoMap = new Map(produtosDB.map((p) => [p.id, p]))

    for (const item of data.itens) {
      const produto = produtoMap.get(item.produtoId)
      if (!produto) {
        return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })
      }
      if (produto.quantidadeDisponivel < item.quantidade) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidadeDisponivel}`,
          },
          { status: 422 },
        )
      }
    }

    const itensData = data.itens.map((item) => {
      const produto = produtoMap.get(item.produtoId)!
      const valorUnitario = Number(produto.valorLocacao)
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        valorUnitario,
        subtotal: valorUnitario * item.quantidade,
      }
    })

    const valorTotal = itensData.reduce((acc, i) => acc + i.subtotal, 0)
    const valorVenda = valorTotal

    // Gera número único de contrato
    let numeroContrato = gerarNumeroContrato()
    for (let tries = 0; tries < 5; tries++) {
      const exists = await prisma.contrato.findUnique({
        where: {
          numeroContrato_empresaId: {
            numeroContrato,
            empresaId: guard.session.empresaId,
          },
        },
      })
      if (!exists) break
      numeroContrato = gerarNumeroContrato()
    }

    // Cria contrato em transação atômica
    await prisma.$transaction(async (tx) => {
      const contrato = await tx.contrato.create({
        data: {
          empresaId: guard.session.empresaId,
          clienteId: data.clienteId,
          numeroContrato,
          dataInicio: new Date(data.dataInicio),
          dataFim: new Date(data.dataFim),
          valorTotal,
          valorVenda,
          status: 'PENDENTE',
          observacoes: data.observacoes || null,
          itens: { create: itensData },
        },
      })

      for (const item of data.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { quantidadeDisponivel: { decrement: item.quantidade } },
        })
      }

      await tx.contaReceber.create({
        data: {
          empresaId: guard.session.empresaId,
          contratoId: contrato.id,
          valorOriginal: valorVenda,
          valorPago: 0,
          vencimento: new Date(data.dataFim),
          status: 'ABERTA',
        },
      })
    })

    return NextResponse.json({ success: true, numeroContrato }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/contratos]', err)
    return NextResponse.json({ error: 'Erro interno ao criar contrato.' }, { status: 500 })
  }
}
