import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  cnpj: z.string().min(11).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(6).optional(),
  logradouro: z.string().min(2).optional(),
  numero: z.string().min(1).optional(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().min(2).optional(),
  cidade: z.string().min(2).optional(),
  estado: z.string().min(2).optional(),
  cep: z.string().min(5).optional(),
  logo: z.string().optional().nullable(),
  plano: z.enum(['BASICO', 'PROFISSIONAL', 'ENTERPRISE']).optional(),
  statusAssinatura: z.enum(['ATIVA', 'TRIAL', 'INADIMPLENTE', 'CANCELADA', 'PAUSADA']).optional(),
  trialAte: z.string().optional().nullable(),
  assinaturaAte: z.string().optional().nullable(),
  limiteUsuarios: z.number().int().min(1).optional(),
  limiteContratos: z.number().int().min(1).optional(),
  ativo: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuard(req, { requiredAction: 'manage:empresa' })
  if (!guard.ok) return guard.response
  if (guard.session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const data = parsed.data

  const empresa = await prisma.empresa.update({
    where: { id },
    data: {
      ...data,
      trialAte: data.trialAte ? new Date(data.trialAte) : data.trialAte === null ? null : undefined,
      assinaturaAte: data.assinaturaAte
        ? new Date(data.assinaturaAte)
        : data.assinaturaAte === null
          ? null
          : undefined,
    },
  })

  await logAudit({
    actorUserId: guard.session.sub,
    action: 'empresa.update',
    targetType: 'empresa',
    targetId: empresa.id,
    meta: {
      nome: empresa.nome,
      plano: empresa.plano,
      statusAssinatura: empresa.statusAssinatura,
      ativo: empresa.ativo,
    },
  })

  return NextResponse.json({ empresa })
}
