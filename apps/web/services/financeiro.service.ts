import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface PagamentoItem {
  id: string
  valor: number
  dataPagamento: string
  status: string
  contrato: {
    numeroContrato: string
    cliente: { nomeCompleto: string }
  }
  formaPagamento: { nome: string }
}

export interface ContaReceberItem {
  id: string
  valorOriginal: number
  vencimento: string
  status: string
  contrato: {
    numeroContrato: string
    cliente: { nomeCompleto: string }
  }
}

export interface FinanceiroData {
  recebidoMes: number
  recebidoMesPassado: number
  pendente: number
  vencido: number
  pagamentosRecentes: PagamentoItem[]
  contasVencidas: ContaReceberItem[]
}

export async function getFinanceiroData(): Promise<FinanceiroData> {
  try {
    const session = await getSessionOrThrow()
    const empresaId = session.empresaId
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0)

    const [
      totalRecebido,
      totalRecebidoMesPassado,
      totalPendente,
      totalVencido,
      pagamentosRecentes,
      contasVencidas,
    ] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { empresaId, status: 'PAGO', dataPagamento: { gte: inicioMes } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: {
          empresaId,
          status: 'PAGO',
          dataPagamento: { gte: inicioMesPassado, lte: fimMesPassado },
        },
        _sum: { valor: true },
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId, status: 'ABERTA' },
        _sum: { valorOriginal: true },
      }),
      prisma.contaReceber.aggregate({
        where: { empresaId, status: 'VENCIDA' },
        _sum: { valorOriginal: true },
      }),
      prisma.pagamento.findMany({
        where: { empresaId },
        orderBy: { dataPagamento: 'desc' },
        take: 10,
        include: {
          contrato: {
            select: {
              numeroContrato: true,
              cliente: { select: { nomeCompleto: true } },
            },
          },
          formaPagamento: { select: { nome: true } },
        },
      }),
      prisma.contaReceber.findMany({
        where: { empresaId, status: 'VENCIDA' },
        orderBy: { vencimento: 'asc' },
        take: 8,
        include: {
          contrato: {
            select: {
              numeroContrato: true,
              cliente: { select: { nomeCompleto: true } },
            },
          },
        },
      }),
    ])

    return {
      recebidoMes: Number(totalRecebido._sum.valor ?? 0),
      recebidoMesPassado: Number(totalRecebidoMesPassado._sum.valor ?? 0),
      pendente: Number(totalPendente._sum.valorOriginal ?? 0),
      vencido: Number(totalVencido._sum.valorOriginal ?? 0),
      pagamentosRecentes: pagamentosRecentes as unknown as PagamentoItem[],
      contasVencidas: contasVencidas as unknown as ContaReceberItem[],
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar dados financeiros')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
