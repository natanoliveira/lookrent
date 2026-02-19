import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'
import { onlyDigits } from '@lookrent/utils'

const configSchema = z.object({
  empresa: z.object({
    nome: z.string().min(2),
    cnpj: z.string().min(11),
    email: z.string().email(),
    telefone: z.string().min(8),
    logradouro: z.string().min(2),
    numero: z.string().min(1),
    complemento: z.string().optional().nullable(),
    bairro: z.string().min(2),
    cidade: z.string().min(2),
    estado: z.string().length(2),
    cep: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
  }),
  configuracao: z.object({
    textoContrato: z.string().optional().nullable(),
    observacoesPadrao: z.string().optional().nullable(),
    multaPorAtraso: z.coerce.number().min(0),
    diasCarencia: z.coerce.number().int().min(0),
    dadosBancarios: z.string().optional().nullable(),
  }),
})

export async function PATCH(req: NextRequest) {
  const guard = await apiGuardWithPermission(req, {
    limit: 20,
    windowMs: 60_000,
    resource: 'configuracoes',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = configSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { empresa, configuracao } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      await tx.empresa.update({
        where: { id: guard.session.empresaId },
        data: {
          ...empresa,
          cnpj: onlyDigits(empresa.cnpj),
          telefone: onlyDigits(empresa.telefone),
          cep: onlyDigits(empresa.cep ?? ''),
        },
      })

      await tx.configuracaoEmpresa.upsert({
        where: { empresaId: guard.session.empresaId },
        update: configuracao,
        create: {
          empresaId: guard.session.empresaId,
          ...configuracao,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/configuracoes]', err)
    return NextResponse.json({ error: 'Erro interno ao salvar configurações.' }, { status: 500 })
  }
}
