import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface ProdutoListItem {
  id: string
  nome: string
  referencia: string | null
  codigoInterno: string | null
  tamanho: string | null
  quantidadeTotal: number
  quantidadeDisponivel: number
  valorLocacao: number
  ativo: boolean
  removido: boolean
}

export interface ProdutosResumo {
  totalDisponivel: number
  totalLocado: number
  totalGeral: number
}

export interface ProdutosResponse {
  data: ProdutoListItem[]
  total: number
  page: number
  totalPages: number
  resumo: ProdutosResumo
}

export async function getProdutos(params: {
  page?: number
  perPage?: number
} = {}): Promise<ProdutosResponse> {
  const { page = 1, perPage = 20 } = params
  try {
    const session = await getSessionOrThrow()
    const skip = (page - 1) * perPage
    const where = {
      empresaId: session.empresaId,
      ...(session.role !== 'ADMIN' ? { removido: false } : {}),
    }

    const [data, total, aggregate] = await Promise.all([
      prisma.produto.findMany({
        where,
        orderBy: [{ referencia: 'asc' }, { tamanho: 'asc' }],
        skip,
        take: perPage,
      }),
      prisma.produto.count({ where }),
      prisma.produto.aggregate({
        where,
        _sum: { quantidadeDisponivel: true, quantidadeTotal: true },
      }),
    ])

    const totalDisponivel = aggregate._sum.quantidadeDisponivel ?? 0
    const totalGeral = aggregate._sum.quantidadeTotal ?? 0

    return {
      data: data.map((p) => ({ ...p, valorLocacao: Number(p.valorLocacao) })),
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      resumo: {
        totalDisponivel,
        totalLocado: totalGeral - totalDisponivel,
        totalGeral,
      },
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar produtos')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
