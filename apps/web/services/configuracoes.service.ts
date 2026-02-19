import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface EmpresaConfig {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  logo: string | null
}

export interface ConfiguracaoEmpresaConfig {
  textoContrato: string | null
  observacoesPadrao: string | null
  multaPorAtraso: number
  diasCarencia: number
  dadosBancarios: string | null
}

export interface UsuarioItem {
  id: string
  nome: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'ATENDENTE'
  ativo: boolean
  createdAt: string
}

export interface ConfiguracoesResponse {
  empresa: EmpresaConfig
  configuracao: ConfiguracaoEmpresaConfig | null
  usuarios: UsuarioItem[]
}

export async function getConfiguracoes(): Promise<ConfiguracoesResponse> {
  const session = await getSessionOrThrow()
  const empresaId = session.empresaId

  const [empresa, configuracao, usuarios] = await Promise.all([
    prisma.empresa.findUniqueOrThrow({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true,
        cep: true,
        logo: true,
      },
    }),
    prisma.configuracaoEmpresa.findUnique({
      where: { empresaId },
      select: {
        textoContrato: true,
        observacoesPadrao: true,
        multaPorAtraso: true,
        diasCarencia: true,
        dadosBancarios: true,
      },
    }),
    prisma.usuario.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    }),
  ])

  return {
    empresa,
    configuracao: configuracao
      ? {
          ...configuracao,
          multaPorAtraso: Number(configuracao.multaPorAtraso),
          diasCarencia: configuracao.diasCarencia,
        }
      : null,
    usuarios: usuarios.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  }
}
