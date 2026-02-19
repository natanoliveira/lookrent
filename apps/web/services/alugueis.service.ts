import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface MovimentacaoListItem {
  id: string
  tipo: 'RETIRADA' | 'DEVOLUCAO'
  data: string
  observacao: string | null
  contrato: {
    numeroContrato: string
    dataInicio: string
    dataFim: string
    status: string
    cliente: { nomeCompleto: string }
  }
}

export interface AlugueisResumo {
  retiradas: number
  devolucoes: number
}

export interface AlugueisResponse {
  data: MovimentacaoListItem[]
  total: number
  page: number
  totalPages: number
  resumo: AlugueisResumo
}

export async function getAlugueis(params: {
  page?: number
  perPage?: number
} = {}): Promise<AlugueisResponse> {
  const { page = 1, perPage = 20 } = params
  try {
    const session = await getSessionOrThrow()
    const skip = (page - 1) * perPage

    const [data, total, resumo] = await Promise.all([
      prisma.movimentacaoAluguel.findMany({
        where: { contrato: { empresaId: session.empresaId } },
        orderBy: { data: 'desc' },
        include: {
          contrato: {
            select: {
              numeroContrato: true,
              dataInicio: true,
              dataFim: true,
              status: true,
              cliente: { select: { nomeCompleto: true } },
            },
          },
        },
        skip,
        take: perPage,
      }),
      prisma.movimentacaoAluguel.count({
        where: { contrato: { empresaId: session.empresaId } },
      }),
      prisma.movimentacaoAluguel.groupBy({
        by: ['tipo'],
        where: { contrato: { empresaId: session.empresaId } },
        _count: true,
      }),
    ])

    const countRetirada = resumo.find((r) => r.tipo === 'RETIRADA')?._count ?? 0
    const countDevolucao = resumo.find((r) => r.tipo === 'DEVOLUCAO')?._count ?? 0

    return {
      data: data as unknown as MovimentacaoListItem[],
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      resumo: { retiradas: countRetirada, devolucoes: countDevolucao },
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar aluguéis')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
