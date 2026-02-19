import { prisma } from '@lookrent/db'
import { getSessionOrThrow } from '@/lib/session'

export interface ProfileData {
  id: string
  nome: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'ATENDENTE'
  avatarUrl: string | null
}

export async function getProfile(): Promise<ProfileData> {
  const session = await getSessionOrThrow()
  const user = await prisma.usuario.findUniqueOrThrow({
    where: { id: session.sub, empresaId: session.empresaId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  })

  return {
    ...user,
  }
}
