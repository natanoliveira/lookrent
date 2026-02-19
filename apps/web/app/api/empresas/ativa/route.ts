import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'
import { ACTIVE_EMPRESA_COOKIE, cookieOptions } from '@/lib/session'
import { logAudit } from '@/lib/audit'

const schema = z.object({
  empresaId: z.string().min(1),
})

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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 })
  }

  const { empresaId } = parsed.data
  const exists = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true },
  })

  if (!exists) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(ACTIVE_EMPRESA_COOKIE, empresaId, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  })

  await logAudit({
    actorUserId: guard.session.sub,
    action: 'empresa.set_active',
    targetType: 'empresa',
    targetId: empresaId,
  })

  return res
}
