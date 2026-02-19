import { prisma, type StatusContrato } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface ContratoListItem {
  id: string
  numeroContrato: string
  dataInicio: string
  dataFim: string
  valorTotal: number
  status: string
  cliente: { id: string; nomeCompleto: string; telefone: string }
  _count: { itens: number }
  contaReceber?: {
    valorOriginal: number
    valorPago: number
    status: string
  }
  pagamentos?: Array<{
    id: string
    valor: number
    parcelas?: number | null
    dataPagamento: string
    formaPagamento: { nome: string }
  }>
}

export interface ClienteOption {
  id: string
  nomeCompleto: string
}

export interface ProdutoOption {
  id: string
  nome: string
  tamanho: string | null
  valorLocacao: number
  quantidadeDisponivel: number
}

export interface FormaPagamentoOption {
  id: string
  nome: string
}

export interface ContratosResponse {
  data: ContratoListItem[]
  total: number
  page: number
  totalPages: number
  porStatus: Record<string, number>
  clientes: ClienteOption[]
  produtos: ProdutoOption[]
  formasPagamento: FormaPagamentoOption[]
}

export async function getContratos(params: {
  page?: number
  perPage?: number
  status?: string
  clienteId?: string
  dataInicio?: string
  dataFim?: string
} = {}): Promise<ContratosResponse> {
  const { page = 1, perPage = 15, status, clienteId, dataInicio, dataFim } = params
  try {
    const session = await getSessionOrThrow()
    const skip = (page - 1) * perPage

    const where: {
      empresaId: string
      status?: StatusContrato
      clienteId?: string
      dataInicio?: { gte?: Date }
      dataFim?: { lte?: Date }
    } = { empresaId: session.empresaId }

    if (status) where.status = status as StatusContrato
    if (clienteId) where.clienteId = clienteId
    if (dataInicio) where.dataInicio = { gte: new Date(dataInicio) }
    if (dataFim) where.dataFim = { lte: new Date(dataFim) }

    const [data, total, contagens, clientes, produtos, formasPagamento] = await Promise.all([
      prisma.contrato.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nomeCompleto: true, telefone: true } },
          _count: { select: { itens: true } },
          pagamentos: {
            orderBy: { dataPagamento: 'desc' },
            select: {
              id: true,
              valor: true,
              parcelas: true,
              dataPagamento: true,
              formaPagamento: { select: { nome: true } },
            },
          },
          contasReceber: {
            select: { valorOriginal: true, valorPago: true, status: true },
            orderBy: { vencimento: 'desc' },
            take: 1,
          },
        },
        skip,
        take: perPage,
      }),
      prisma.contrato.count({ where }),
      prisma.contrato.groupBy({
        by: ['status'],
        where: { empresaId: session.empresaId },
        _count: true,
      }),
      prisma.cliente.findMany({
        where: { empresaId: session.empresaId },
        select: { id: true, nomeCompleto: true },
        orderBy: { nomeCompleto: 'asc' },
      }),
      prisma.produto.findMany({
        where: { empresaId: session.empresaId, ativo: true },
        select: {
          id: true,
          nome: true,
          tamanho: true,
          valorLocacao: true,
          quantidadeDisponivel: true,
        },
        orderBy: { nome: 'asc' },
      }),
      prisma.formaPagamento.findMany({
        where: { empresaId: session.empresaId, ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
    ])

    const porStatus = Object.fromEntries(contagens.map((c) => [c.status, c._count]))

    const dataSerialized: ContratoListItem[] = data.map((c) => ({
      id: c.id,
      numeroContrato: c.numeroContrato,
      dataInicio: c.dataInicio.toISOString(),
      dataFim: c.dataFim.toISOString(),
      valorTotal: Number(c.valorTotal),
      status: c.status,
      cliente: c.cliente,
      _count: c._count,
      pagamentos: c.pagamentos.map((p) => ({
        id: p.id,
        valor: Number(p.valor),
        parcelas: p.parcelas ?? null,
        dataPagamento: p.dataPagamento.toISOString(),
        formaPagamento: p.formaPagamento,
      })),
      contaReceber: c.contasReceber[0]
        ? {
            valorOriginal: Number(c.contasReceber[0].valorOriginal),
            valorPago: Number(c.contasReceber[0].valorPago),
            status: c.contasReceber[0].status,
          }
        : undefined,
    }))

    return {
      data: dataSerialized,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      porStatus,
      clientes,
      produtos: produtos.map((p) => ({ ...p, valorLocacao: Number(p.valorLocacao) })),
      formasPagamento,
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('Erro inesperado ao buscar contratos')
  } finally {
    // nada a liberar — placeholder para instrumentação futura
  }
}
