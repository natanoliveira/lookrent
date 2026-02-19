import { Suspense } from 'react'
import { TruckIcon, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lookrent/ui'
import { getAlugueis } from '@/services/alugueis.service'
import { AlugueisList } from '@/components/alugueis/alugueis-list'
import { Pagination } from '@/components/ui/pagination'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Aluguéis' }

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AlugueisPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { data: movimentacoes, total, totalPages, resumo } =
    await getAlugueis({ page, perPage: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aluguéis</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de retiradas e devoluções de produtos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10">
                <ArrowUpFromLine className="h-4 w-4 text-brand-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Retiradas</p>
                <p className="text-xl font-bold">{resumo.retiradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Devoluções</p>
                <p className="text-xl font-bold">{resumo.devolucoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <TruckIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Histórico de Movimentações</CardTitle>
          <CardDescription>Retiradas e devoluções registradas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <AlugueisList movimentacoes={movimentacoes} />

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} totalItems={total} perPage={20} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
