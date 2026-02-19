import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'
import { logAudit } from '@/lib/audit'

const empresaSchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().min(11),
  email: z.string().email(),
  telefone: z.string().min(6),
  logradouro: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional().nullable(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().min(2),
  cep: z.string().min(5),
  logo: z.string().optional().nullable(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']),
  statusAssinatura: z.enum(['ATIVA', 'TRIAL', 'INADIMPLENTE', 'CANCELADA', 'PAUSADA']),
  trialAte: z.string().optional().nullable(),
  assinaturaAte: z.string().optional().nullable(),
  limiteUsuarios: z.number().int().min(1),
  limiteContratos: z.number().int().min(1),
  ativo: z.boolean(),
})

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, { requiredAction: 'manage:empresa' })
  if (!guard.ok) return guard.response
  if (guard.session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ empresas })
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req, { requiredAction: 'manage:empresa' })
  if (!guard.ok) return guard.response
  if (guard.session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = empresaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const data = parsed.data

  const empresa = await prisma.empresa.create({
    data: {
      ...data,
      trialAte: data.trialAte ? new Date(data.trialAte) : null,
      assinaturaAte: data.assinaturaAte ? new Date(data.assinaturaAte) : null,
    },
  })

  await logAudit({
    actorUserId: guard.session.sub,
    action: 'empresa.create',
    targetType: 'empresa',
    targetId: empresa.id,
    meta: { nome: empresa.nome, plano: empresa.plano },
  })

  return NextResponse.json({ empresa })
}
