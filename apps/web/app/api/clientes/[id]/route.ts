import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'
import { onlyDigits } from '@lookrent/utils'

const updateSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  logradouro: z.string().min(2, 'Logradouro inválido').optional(),
  numero: z.string().min(1, 'Número obrigatório').optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro inválido').optional(),
  cidade: z.string().min(2, 'Cidade inválida').optional(),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)').optional(),
  cep: z.string().optional().or(z.literal('')),
  ativo: z.boolean().optional(),
  removido: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'clientes',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { data } = parsed

  try {
    const existing = await prisma.cliente.findUnique({
      where: { id, empresaId: guard.session.empresaId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    await prisma.cliente.update({
      where: { id },
      data: {
        ...data,
        ...(data.telefone !== undefined && { telefone: onlyDigits(data.telefone) }),
        ...(data.cep !== undefined && { cep: onlyDigits(data.cep ?? '') }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.complemento !== undefined && { complemento: data.complemento || null }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/clientes/[id]]', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar cliente.' }, { status: 500 })
  }
}
