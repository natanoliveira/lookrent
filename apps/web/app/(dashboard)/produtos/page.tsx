import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lookrent/ui'
import { getProdutos } from '@/services/produtos.service'
import { ProdutosList } from '@/components/produtos/produtos-list'
import { ProdutoForm } from '@/components/produtos/produto-form'
import { Pagination } from '@/components/ui/pagination'
import { getSessionOrThrow } from '@/lib/session'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos' }

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const session = await getSessionOrThrow()
  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'

  const { data: produtos, total, totalPages, resumo } = await getProdutos({ page, perPage: 20 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {total} iten{total !== 1 ? 's' : ''} · {resumo.totalDisponivel} disponíve{resumo.totalDisponivel !== 1 ? 'is' : 'l'} · {resumo.totalLocado} locado{resumo.totalLocado !== 1 ? 's' : ''}
          </p>
        </div>
        <ProdutoForm />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponíveis</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{resumo.totalDisponivel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Locados</p>
            <p className="mt-1 text-2xl font-bold text-brand-blue">{resumo.totalLocado}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="mt-1 text-2xl font-bold">{resumo.totalGeral}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Catálogo de Produtos</CardTitle>
          <CardDescription>Controle de estoque em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <ProdutosList produtos={produtos} isAdmin={isAdmin} />

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} totalItems={total} perPage={20} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
