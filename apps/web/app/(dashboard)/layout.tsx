import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getSessionOrThrow } from '@/lib/session'
import { getEmpresasResumo, getEmpresaAtivaNome } from '@/services/empresas.service'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionOrThrow()
  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  const isSuperAdmin = session.role === 'SUPER_ADMIN'
  const empresas = isSuperAdmin ? await getEmpresasResumo() : undefined
  const empresaAtivaNome = isSuperAdmin
    ? empresas?.find((empresa) => empresa.id === session.empresaId)?.nome ?? null
    : await getEmpresaAtivaNome(session.empresaId)

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        empresas={empresas}
        empresaAtivaId={session.empresaId}
        empresaAtivaNome={empresaAtivaNome}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          empresas={empresas}
          empresaAtivaId={session.empresaId}
          empresaAtivaNome={empresaAtivaNome}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
