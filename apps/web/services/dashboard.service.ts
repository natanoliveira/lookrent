import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface ContratoRecenteItem {
  id: string
  numeroContrato: string
  dataInicio: string
  dataFim: string
  valorTotal: number
  status: string
  cliente: { nomeCompleto: string }
}

export interface VencimentoItem {
  id: string
  numeroContrato: string
  dataFim: string
  cliente: { nomeCompleto: string }
}

export interface TopClienteItem {
  clienteId: string
  nomeCompleto: string
  totalPago: number
}

export interface DashboardData {
  contratosAtivos: number
  totalClientes: number
  receitaPeriodo: number
  inadimplentes: number
  produtosDisponiveis: number
  contratosRecentes: ContratoRecenteItem[]
  proximosVencimentos: VencimentoItem[]
  topClientes: TopClienteItem[]
}

export async function getDashboardData(params: {
  period?: '30' | '90' | '180' | 'month' | 'year'
} = {}): Promise<DashboardData> {
  try {
    const session = await getSessionOrThrow()
    const empresaId = session.empresaId
    const agora = new Date()
    const period = params.period ?? 'month'
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioAno = new Date(agora.getFullYear(), 0, 1)
    const startDate =
      period === '30'
        ? new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
        : period === '90'
          ? new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000)
          : period === '180'
            ? new Date(agora.getTime() - 180 * 24 * 60 * 60 * 1000)
            : period === 'year'
              ? inicioAno
              : inicioMes

    const [
      contratosAtivos,
      totalClientes,
      receitaPeriodo,
      inadimplentes,
      contratosRecentes,
      produtosDisponiveis,
      proximosVencimentos,
      pagamentosMes,
    ] = await Promise.all([
      prisma.contrato.count({ where: { empresaId, status: 'ATIVO' } }),
      prisma.cliente.count({ where: { empresaId } }),
      prisma.pagamento.aggregate({
        where: { empresaId, status: 'PAGO', dataPagamento: { gte: startDate } },
        _sum: { valor: true },
      }),
      prisma.contaReceber.count({ where: { empresaId, status: 'VENCIDA' } }),
      prisma.contrato.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { cliente: { select: { nomeCompleto: true } } },
      }),
      prisma.produto.count({
        where: { empresaId, quantidadeDisponivel: { gt: 0 }, ativo: true },
      }),
      prisma.contrato.findMany({
        where: {
          empresaId,
          status: 'ATIVO',
          dataFim: {
            gte: agora,
            lte: new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { dataFim: 'asc' },
        take: 5,
        include: { cliente: { select: { nomeCompleto: true } } },
      }),
      prisma.pagamento.findMany({
        where: { empresaId, status: 'PAGO', dataPagamento: { gte: startDate } },
        select: {
          valor: true,
          contrato: { select: { cliente: { select: { id: true, nomeCompleto: true } } } },
        },
      }),
    ])

    const topClientesMap = new Map<string, TopClienteItem>()
    for (const p of pagamentosMes) {
      const cliente = p.contrato.cliente
      const atual = topClientesMap.get(cliente.id) ?? {
        clienteId: cliente.id,
        nomeCompleto: cliente.nomeCompleto,
        totalPago: 0,
      }
      atual.totalPago += Number(p.valor)
      topClientesMap.set(cliente.id, atual)
    }
    const topClientes = Array.from(topClientesMap.values())
      .sort((a, b) => b.totalPago - a.totalPago)
      .slice(0, 5)

    const contratosRecentesSerialized: ContratoRecenteItem[] = contratosRecentes.map((c) => ({
      id: c.id,
      numeroContrato: c.numeroContrato,
      dataInicio: c.dataInicio.toISOString(),
      dataFim: c.dataFim.toISOString(),
      valorTotal: Number(c.valorTotal),
      status: c.status,
      cliente: c.cliente,
    }))

    const proximosVencimentosSerialized: VencimentoItem[] = proximosVencimentos.map((c) => ({
      id: c.id,
      numeroContrato: c.numeroContrato,
      dataFim: c.dataFim.toISOString(),
      cliente: c.cliente,
    }))

    return {
      contratosAtivos,
      totalClientes,
      receitaPeriodo: Number(receitaPeriodo._sum.valor ?? 0),
      inadimplentes,
      contratosRecentes: contratosRecentesSerialized,
      produtosDisponiveis,
      proximosVencimentos: proximosVencimentosSerialized,
      topClientes,
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar dados do dashboard')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
