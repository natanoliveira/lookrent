import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuardWithPermission } from '@/lib/api-guard'
import { onlyDigits } from '@lookrent/utils'

const createSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  logradouro: z.string().min(2, 'Logradouro inválido'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro inválido'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  cep: z.string().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithPermission(req, {
    limit: 15,
    windowMs: 60_000,
    resource: 'clientes',
    scope: 'manage',
  })
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { data } = parsed
  const cpf = onlyDigits(data.cpf)

  try {
    const existing = await prisma.cliente.findUnique({
      where: { cpf_empresaId: { cpf, empresaId: guard.session.empresaId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este CPF cadastrado.' },
        { status: 409 },
      )
    }

    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        cpf,
        cep: onlyDigits(data.cep ?? ''),
        telefone: onlyDigits(data.telefone),
        email: data.email || null,
        complemento: data.complemento || null,
        empresaId: guard.session.empresaId,
      },
    })

    return NextResponse.json({ success: true, id: cliente.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return NextResponse.json({ error: 'Erro interno ao cadastrar cliente.' }, { status: 500 })
  }
}
