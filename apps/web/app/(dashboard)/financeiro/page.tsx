import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@lookrent/ui'
import { getFinanceiroData } from '@/services/financeiro.service'
import { formatCurrency, formatDate } from '@lookrent/utils'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Printer } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Financeiro' }

const statusPagLabel: Record<string, string> = { PENDENTE: 'Pendente', PAGO: 'Pago', CANCELADO: 'Cancelado' }
const statusPagVariant: Record<string, 'default' | 'success' | 'warning' | 'outline' | 'destructive'> = {
  PAGO: 'success', PENDENTE: 'warning', CANCELADO: 'destructive',
}
const statusContaVariant: Record<string, 'default' | 'success' | 'warning' | 'outline' | 'destructive'> = {
  PAGA: 'success', ABERTA: 'outline', VENCIDA: 'destructive', CANCELADA: 'outline',
}
const statusContaLabel: Record<string, string> = {
  ABERTA: 'Aberta', PAGA: 'Paga', VENCIDA: 'Vencida', CANCELADA: 'Cancelada',
}

export default async function FinanceiroPage() {
  const data = await getFinanceiroData()

  const variacaoMes =
    data.recebidoMesPassado > 0
      ? ((data.recebidoMes - data.recebidoMesPassado) / data.recebidoMesPassado) * 100
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Conciliação de pagamentos e contas a receber</p>
        </div>
        <a
          href="/imprimir/financeiro"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <Printer className="h-4 w-4" />
          Imprimir Relatório
        </a>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Recebido este mês</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(data.recebidoMes)}</p>
                {variacaoMes !== null && (
                  <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${variacaoMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {variacaoMes >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(variacaoMes).toFixed(1)}% vs mês anterior
                  </p>
                )}
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-100 fill-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Mês anterior</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(data.recebidoMesPassado)}</p>
                <p className="mt-1 text-xs text-muted-foreground">total recebido</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">A receber (em aberto)</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(data.pendente)}</p>
                <p className="mt-1 text-xs text-muted-foreground">contas abertas</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-100 fill-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Inadimplência</p>
                <p className={`mt-1 text-2xl font-bold ${data.vencido > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {formatCurrency(data.vencido)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">contas vencidas</p>
              </div>
              <TrendingDown className={`h-8 w-8 ${data.vencido > 0 ? 'text-red-100 fill-red-500' : 'text-muted-foreground/30'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Pagamentos Recentes */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Últimos Pagamentos</CardTitle>
            <CardDescription>Movimentações financeiras recentes</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            {/* Mobile: cards */}
            <div className="md:hidden divide-y">
              {data.pagamentosRecentes.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum pagamento.</p>
              ) : (
                data.pagamentosRecentes.map((pag) => (
                  <div key={pag.id} className="px-4 py-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{pag.contrato.cliente.nomeCompleto}</p>
                        <p className="text-xs font-mono text-muted-foreground">{pag.contrato.numeroContrato}</p>
                      </div>
                      <Badge variant={statusPagVariant[pag.status] ?? 'outline'}>{statusPagLabel[pag.status]}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pag.formaPagamento.nome} · {formatDate(pag.dataPagamento)}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(Number(pag.valor))}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente / Contrato</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pagamentosRecentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                        Nenhum pagamento registrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.pagamentosRecentes.map((pag) => (
                      <TableRow key={pag.id}>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[160px]">{pag.contrato.cliente.nomeCompleto}</p>
                          <p className="text-xs font-mono text-muted-foreground">{pag.contrato.numeroContrato}</p>
                        </TableCell>
                        <TableCell className="text-sm">{pag.formaPagamento.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(pag.dataPagamento)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(pag.valor))}</TableCell>
                        <TableCell>
                          <Badge variant={statusPagVariant[pag.status] ?? 'outline'}>{statusPagLabel[pag.status]}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Contas Vencidas */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              Contas Vencidas
              {data.contasVencidas.length > 0 && (
                <Badge variant="destructive">{data.contasVencidas.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Cobranças em atraso que precisam de atenção</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            {data.contasVencidas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">Nenhuma conta vencida</p>
                <p className="text-xs text-muted-foreground">Tudo em dia!</p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="md:hidden divide-y">
                  {data.contasVencidas.map((conta) => {
                    const diasAtraso = Math.floor(
                      (Date.now() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div key={conta.id} className="px-4 py-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{conta.contrato.cliente.nomeCompleto}</p>
                            <p className="text-xs font-mono text-muted-foreground">{conta.contrato.numeroContrato}</p>
                          </div>
                          <span className="shrink-0 font-semibold text-red-600 text-sm">
                            {formatCurrency(Number(conta.valorOriginal))}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 font-medium">
                          Venceu em {formatDate(conta.vencimento)} · {diasAtraso}d em atraso
                        </p>
                      </div>
                    )
                  })}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.contasVencidas.map((conta) => {
                        const diasAtraso = Math.floor(
                          (Date.now() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24)
                        )
                        return (
                          <TableRow key={conta.id}>
                            <TableCell>
                              <p className="text-sm font-medium truncate max-w-[140px]">
                                {conta.contrato.cliente.nomeCompleto}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground">
                                {conta.contrato.numeroContrato}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{formatDate(conta.vencimento)}</p>
                              <p className="text-xs text-red-600 font-medium">{diasAtraso}d em atraso</p>
                            </TableCell>
                            <TableCell className="font-semibold text-red-600">
                              {formatCurrency(Number(conta.valorOriginal))}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusContaVariant[conta.status] ?? 'outline'}>
                                {statusContaLabel[conta.status]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
