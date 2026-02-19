import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface EmpresaResumo {
  id: string
  nome: string
}

export interface EmpresaDetalhe {
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
  plano: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'
  statusAssinatura: 'ATIVA' | 'TRIAL' | 'INADIMPLENTE' | 'CANCELADA' | 'PAUSADA'
  trialAte: string | null
  assinaturaAte: string | null
  limiteUsuarios: number
  limiteContratos: number
  ativo: boolean
  createdAt: string
}

export async function getEmpresasAdmin(): Promise<EmpresaDetalhe[]> {
  const session = await getSessionOrThrow()
  if (session.role !== 'SUPER_ADMIN') {
    return []
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return empresas.map((empresa) => ({
    ...empresa,
    createdAt: empresa.createdAt.toISOString(),
    trialAte: empresa.trialAte ? empresa.trialAte.toISOString() : null,
    assinaturaAte: empresa.assinaturaAte ? empresa.assinaturaAte.toISOString() : null,
  }))
}

export async function getEmpresasResumo(): Promise<EmpresaResumo[]> {
  const session = await getSessionOrThrow()
  if (session.role !== 'SUPER_ADMIN') {
    return []
  }

  return prisma.empresa.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
}

export async function getEmpresaAtivaNome(empresaId: string): Promise<string | null> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nome: true },
  })
  return empresa?.nome ?? null
}
