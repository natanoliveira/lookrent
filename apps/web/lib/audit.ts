import { prisma } from '@lookrent/db'

export async function logAudit(params: {
  actorUserId: string
  action: string
  targetType: string
  targetId?: string | null
  meta?: Record<string, unknown>
}) {
  const { actorUserId, action, targetType, targetId, meta } = params
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        targetType,
        targetId: targetId ?? null,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
      },
    })
  } catch (err) {
    console.error('[AUDIT]', err)
  }
}
