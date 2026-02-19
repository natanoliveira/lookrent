import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@lookrent/ui'
import { getSessionOrThrow } from '@/lib/session'
import { getEmpresasAdmin } from '@/services/empresas.service'
import { EmpresasManager } from '@/components/empresas/empresas-manager'

export const metadata: Metadata = { title: 'Empresas' }

export default async function EmpresasPage() {
  const session = await getSessionOrThrow()

  if (session.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">Acesso restrito ao super admin.</p>
        </div>
      </div>
    )
  }

  const empresas = await getEmpresasAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground">Gerencie empresas e assinaturas.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-brand-blue" />
            <div>
              <CardTitle>Gestão de Empresas</CardTitle>
              <CardDescription>
                Cadastre, atualize planos e controle assinaturas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EmpresasManager empresas={empresas} />
    </div>
  )
}
