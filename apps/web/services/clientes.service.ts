import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface ClienteListItem {
  id: string
  nomeCompleto: string
  cpf: string
  telefone: string
  email: string | null
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  ativo: boolean
  removido: boolean
  createdAt: string
  _count: { contratos: number }
}

export interface ClientesResponse {
  data: ClienteListItem[]
  total: number
  page: number
  totalPages: number
}

export async function getClientes(params: {
  page?: number
  perPage?: number
} = {}): Promise<ClientesResponse> {
  const { page = 1, perPage = 15 } = params
  try {
    const session = await getSessionOrThrow()
    const skip = (page - 1) * perPage
    const where = {
      empresaId: session.empresaId,
      ...(session.role !== 'ADMIN' ? { removido: false } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { contratos: true } } },
        skip,
        take: perPage,
      }),
      prisma.cliente.count({ where }),
    ])

    return {
      data: data as unknown as ClienteListItem[],
      total,
      page,
      totalPages: Math.ceil(total / perPage),
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar clientes')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
