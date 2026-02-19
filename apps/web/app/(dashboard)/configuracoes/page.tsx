import { Settings } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@lookrent/ui'
import { getSessionOrThrow } from '@/lib/session'
import { getConfiguracoes } from '@/services/configuracoes.service'
import { ConfigTabs } from '@/components/configuracoes/config-tabs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações' }

export default async function ConfiguracoesPage() {
  const session = await getSessionOrThrow()
  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Acesso restrito ao administrador.</p>
        </div>
      </div>
    )
  }

  const { empresa, configuracao, usuarios } = await getConfiguracoes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Configure sua empresa e preferências do sistema</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-brand-blue" />
            <div>
              <CardTitle>Configurações da Empresa</CardTitle>
              <CardDescription>
                Gerencie dados da empresa e usuários do sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ConfigTabs empresa={empresa} configuracao={configuracao} usuarios={usuarios} />
    </div>
  )
}
