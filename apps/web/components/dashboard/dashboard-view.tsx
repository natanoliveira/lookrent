'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, Users, DollarSign, AlertTriangle, TrendingUp, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Skeleton } from '@lookrent/ui'
import { formatCurrency, formatDate, cn } from '@lookrent/utils'
import { PeriodFilter, type PeriodValue } from './period-filter'
import type { DashboardData } from '@/services/dashboard.service'

interface Props {
  data: DashboardData
  period: PeriodValue
  userFirstName: string
}

const statusLabel: Record<string, string> = {
  ATIVO: 'Ativo',
  FINALIZADO: 'Finalizado',
  PENDENTE: 'Pendente',
  CANCELADO: 'Cancelado',
}

const statusVariant: Record<
  string,
  'default' | 'success' | 'warning' | 'outline' | 'destructive'
> = {
  ATIVO: 'success',
  FINALIZADO: 'outline',
  PENDENTE: 'warning',
  CANCELADO: 'destructive',
}

export function DashboardView({ data, period, userFirstName }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function setPeriod(value: PeriodValue) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'month') {
      params.delete('period')
    } else {
      params.set('period', value)
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const kpis = [
    {
      label: 'Contratos Ativos',
      value: data.contratosAtivos,
      icon: ShoppingBag,
      color: 'text-brand-blue',
      bg: 'bg-blue-50',
      desc: 'em andamento agora',
    },
    {
      label: 'Clientes Cadastrados',
      value: data.totalClientes,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      desc: 'no total',
    },
    {
      label: 'Receita do Período',
      value: formatCurrency(data.receitaPeriodo),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: 'pagamentos confirmados',
    },
    {
      label: 'Contas Vencidas',
      value: data.inadimplentes,
      icon: AlertTriangle,
      color: data.inadimplentes > 0 ? 'text-red-600' : 'text-muted-foreground',
      bg: data.inadimplentes > 0 ? 'bg-red-50' : 'bg-muted',
      desc: 'a receber em atraso',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {userFirstName}. Aqui está o resumo do dia.
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} isPending={isPending} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  {isPending ? (
                    <Skeleton className="mt-2 h-6 w-24" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
                  )}
                  {isPending ? (
                    <Skeleton className="mt-2 h-3 w-20" />
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
                  )}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-blue" />
              <CardTitle className="text-base">Contratos Recentes</CardTitle>
            </div>
            <CardDescription>Últimas movimentações registradas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className={cn('divide-y', isPending && 'opacity-60')}>
              {data.contratosRecentes.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum contrato ainda.</p>
              ) : (
                data.contratosRecentes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.cliente.nomeCompleto}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.numeroContrato} · {formatDate(c.dataInicio)} → {formatDate(c.dataFim)}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1">
                      <Badge variant={statusVariant[c.status] ?? 'outline'}>
                        {statusLabel[c.status] ?? c.status}
                      </Badge>
                      <span className="text-xs font-medium">{formatCurrency(Number(c.valorTotal))}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Vencimentos nos Próximos 7 Dias</CardTitle>
            </div>
            <CardDescription>Contratos com devolução prevista em breve</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.proximosVencimentos.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum vencimento próximo.</p>
            ) : (
              <div className={cn('divide-y', isPending && 'opacity-60')}>
                {data.proximosVencimentos.map((c) => {
                  const diasRestantes = Math.ceil(
                    (new Date(c.dataFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  )
                  return (
                    <div key={c.id} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.cliente.nomeCompleto}</p>
                        <p className="text-xs text-muted-foreground">{c.numeroContrato}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium">{formatDate(c.dataFim)}</p>
                        <p className={cn('text-xs font-medium', diasRestantes <= 2 ? 'text-red-600' : 'text-amber-600')}>
                          {diasRestantes === 0
                            ? 'Vence hoje'
                            : `${diasRestantes}d restante${diasRestantes > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Top Clientes do Período</CardTitle>
            </div>
            <CardDescription>Clientes com maior faturamento</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isPending ? (
              <div className="space-y-2 px-6 py-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : data.topClientes.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum pagamento no período.</p>
            ) : (
              <div className="divide-y">
                {data.topClientes.map((c) => (
                  <div key={c.clienteId} className="flex items-center justify-between px-6 py-3">
                    <p className="truncate text-sm font-medium">{c.nomeCompleto}</p>
                    <span className="text-xs font-medium">{formatCurrency(c.totalPago)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{data.produtosDisponiveis} produtos com estoque disponível para locação</span>
      </div>
    </div>
  )
}
