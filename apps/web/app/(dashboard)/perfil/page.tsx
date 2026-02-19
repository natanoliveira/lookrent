import type { Metadata } from 'next'
import { UserCircle } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@lookrent/ui'
import { getProfile } from '@/services/profile.service'
import { PerfilForm } from '@/components/perfil/perfil-form'

export const metadata: Metadata = { title: 'Meu Perfil' }

export default async function PerfilPage() {
  const profile = await getProfile()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-brand-blue" />
            <div>
              <CardTitle>Dados do Usuário</CardTitle>
              <CardDescription>Atualize nome, e-mail e avatar.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <PerfilForm profile={profile} />
    </div>
  )
}
