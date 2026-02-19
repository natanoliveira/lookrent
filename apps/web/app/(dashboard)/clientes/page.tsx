import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lookrent/ui'
import { getClientes } from '@/services/clientes.service'
import { ClientesList } from '@/components/clientes/clientes-list'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { Pagination } from '@/components/ui/pagination'
import { Printer } from 'lucide-react'
import { getSessionOrThrow } from '@/lib/session'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clientes' }

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const session = await getSessionOrThrow()
  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'

  const { data: clientes, total, totalPages } = await getClientes({ page, perPage: 15 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/imprimir/clientes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Printer className="h-4 w-4" />
            Imprimir Lista
          </a>
          <ClienteForm />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Lista de Clientes</CardTitle>
          <CardDescription>Todos os clientes cadastrados na sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <ClientesList clientes={clientes} isAdmin={isAdmin} />

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} totalItems={total} perPage={15} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
