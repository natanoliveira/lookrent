import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'

const pagamentoSchema = z.object({
  pagamentos: z.array(
    z.object({
      formaPagamentoId: z.string().min(1, 'Forma de pagamento obrigatória'),
      valor: z.coerce.number().positive('Valor deve ser maior que zero'),
      parcelas: z.coerce.number().int().min(1).optional(),
    }),
  ).min(1, 'Informe ao menos uma forma de pagamento'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'pagamentos',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = pagamentoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { pagamentos } = parsed.data

  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id, empresaId: guard.session.empresaId },
      select: { id: true },
    })
    if (!contrato) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    }

    const formas = await prisma.formaPagamento.findMany({
      where: {
        empresaId: guard.session.empresaId,
        ativo: true,
        id: { in: pagamentos.map((p) => p.formaPagamentoId) },
      },
      select: { id: true },
    })
    const formasSet = new Set(formas.map((f) => f.id))
    for (const p of pagamentos) {
      if (!formasSet.has(p.formaPagamentoId)) {
        return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
      }
    }

    // Busca a conta a receber mais recente do contrato
    const conta = await prisma.contaReceber.findFirst({
      where: { empresaId: guard.session.empresaId, contratoId: id },
      orderBy: { vencimento: 'desc' },
    })
    if (!conta) {
      return NextResponse.json({ error: 'Conta a receber não encontrada' }, { status: 404 })
    }
    // Soma os pagamentos em centavos para evitar erro de ponto flutuante
    const totalRecebidoCent = pagamentos.reduce(
      (acc, p) => acc + Math.round(Number(p.valor) * 100),
      0,
    )
    // Calcula o restante em aberto também em centavos
    const restanteCent =
      Math.round(Number(conta.valorOriginal) * 100) -
      Math.round(Number(conta.valorPago) * 100)

    // Impede que o pagamento informado ultrapasse o saldo em aberto
    if (totalRecebidoCent > restanteCent) {
      return NextResponse.json(
        { error: 'O valor informado excede o valor em aberto.' },
        { status: 400 },
      )
    }

    // Registra pagamentos e atualiza conta a receber de forma atômica
    const updated = await prisma.$transaction(async (tx) => {
      for (const p of pagamentos) {
        // Cria um pagamento por forma informada (pix/cartão/dinheiro etc.)
        await tx.pagamento.create({
          data: {
            empresaId: guard.session.empresaId,
            contratoId: id,
            formaPagamentoId: p.formaPagamentoId,
            valor: p.valor,
            parcelas: p.parcelas,
            status: 'PAGO',
          },
        })
      }

      // Atualiza o valor pago total em centavos
      const novoPagoCent =
        Math.round(Number(conta.valorPago) * 100) + totalRecebidoCent
      // Define se a conta foi quitada
      const quitado = novoPagoCent >= Math.round(Number(conta.valorOriginal) * 100)
      // Atualiza o status conforme quitação
      const novoStatus = quitado ? 'PAGA' : conta.status

      return tx.contaReceber.update({
        where: { id: conta.id },
        data: {
          // Persiste o valor pago convertendo de centavos para reais
          valorPago: novoPagoCent / 100,
          status: novoStatus,
        },
      })
    })

    return NextResponse.json({
      success: true,
      contaReceber: {
        valorOriginal: Number(updated.valorOriginal),
        valorPago: Number(updated.valorPago),
        status: updated.status,
      },
    })
  } catch (err) {
    console.error('[POST /api/contratos/[id]/pagamentos]', err)
    return NextResponse.json({ error: 'Erro interno ao registrar pagamento.' }, { status: 500 })
  }
}
