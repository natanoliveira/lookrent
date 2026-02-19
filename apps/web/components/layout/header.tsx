import { getSessionOrThrow } from '@/lib/session'
import { UserMenu } from './user-menu'
import { MobileSidebar } from './mobile-sidebar'

export async function Header({
  isAdmin,
  isSuperAdmin,
  empresas,
  empresaAtivaId,
  empresaAtivaNome,
}: {
  isAdmin?: boolean
  isSuperAdmin?: boolean
  empresas?: Array<{ id: string; nome: string }>
  empresaAtivaId?: string | null
  empresaAtivaNome?: string | null
}) {
  const session = await getSessionOrThrow()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          empresas={empresas}
          empresaAtivaId={empresaAtivaId}
          empresaAtivaNome={empresaAtivaNome}
        />
        <span className="hidden text-sm font-medium text-muted-foreground lg:block">
          Sistema de Gestão de Locação
        </span>
      </div>
      <UserMenu
        nome={session.nome}
        email={session.email}
        role={session.role}
        avatarUrl={session.avatarUrl ?? null}
      />
    </header>
  )
}
