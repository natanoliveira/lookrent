import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@lookrent/ui'
import { getContratos } from '@/services/contratos.service'
import { ContratosList } from '@/components/contratos/contratos-list'
import { ContratoForm } from '@/components/contratos/contrato-form'
import { Pagination } from '@/components/ui/pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contratos' }

const statusLabel: Record<string, string> = {
  ATIVO: 'Ativo', FINALIZADO: 'Finalizado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado',
}
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'outline' | 'destructive'> = {
  ATIVO: 'success', FINALIZADO: 'outline', PENDENTE: 'warning', CANCELADO: 'destructive',
}


interface PageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    clienteId?: string
    dataInicio?: string
    dataFim?: string
  }>
}

export default async function ContratosPage({ searchParams }: PageProps) {
  const { page: pageParam, status, clienteId, dataInicio, dataFim } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const statusFilter = status && status !== 'all' ? status : undefined
  const clienteFilter = clienteId && clienteId !== 'all' ? clienteId : undefined

  const { data: contratos, total, totalPages, porStatus, clientes, produtos, formasPagamento } =
    await getContratos({
      page,
      perPage: 15,
      status: statusFilter,
      clienteId: clienteFilter,
      dataInicio,
      dataFim,
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            {total} contrato{total !== 1 ? 's' : ''} no total
          </p>
        </div>
        <ContratoForm clientes={clientes} produtos={produtos} />
      </div>

      {/* Contadores por status (geral) */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {(['ATIVO', 'PENDENTE', 'FINALIZADO', 'CANCELADO'] as const).map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{statusLabel[status]}</p>
                  <p className="mt-1 text-xl font-bold">{porStatus[status] ?? 0}</p>
                </div>
                <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Lista de Contratos</CardTitle>
          <CardDescription>Todos os contratos de locação registrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <ContratosList contratos={contratos} clientes={clientes} formasPagamento={formasPagamento} />

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} totalItems={total} perPage={15} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
