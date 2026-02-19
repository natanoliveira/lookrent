'use client'

import { useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lookrent/ui'
import { formatCurrency, formatDate } from '@lookrent/utils'
import { FileText, Receipt } from 'lucide-react'
import type { ContratoListItem, FormaPagamentoOption } from '@/services/contratos.service'
import { ContratoEditForm } from './contrato-edit-form'
import { ContratoPayForm } from './contrato-pay-form'

interface Props {
  contratos: ContratoListItem[]
  clientes: { id: string; nomeCompleto: string }[]
  formasPagamento: FormaPagamentoOption[]
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const

const statusLabel: Record<string, string> = {
  ATIVO: 'Ativo', FINALIZADO: 'Finalizado', PENDENTE: 'Pendente', CANCELADO: 'Cancelado',
}
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'outline' | 'destructive'> = {
  ATIVO: 'success', FINALIZADO: 'outline', PENDENTE: 'warning', CANCELADO: 'destructive',
}

// ─── Card mobile ─────────────────────────────────────────────────────────────

function ContratoCard({
  contrato,
  formasPagamento,
}: {
  contrato: ContratoListItem
  formasPagamento: FormaPagamentoOption[]
}) {
  const hoje = new Date()
  const vencido = contrato.status === 'ATIVO' && new Date(contrato.dataFim) < hoje

  return (
    <div className={`rounded-lg border bg-card p-4 space-y-3 ${vencido ? 'border-red-200' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{contrato.numeroContrato}</p>
          <p className="font-medium truncate">{contrato.cliente.nomeCompleto}</p>
          <p className="text-xs text-muted-foreground">{contrato.cliente.telefone}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <Badge variant={statusVariant[contrato.status] ?? 'outline'}>
            {statusLabel[contrato.status]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {contrato._count.itens} iten{contrato._count.itens !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Início</p>
          <p>{formatDate(contrato.dataInicio)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Término</p>
          <p className={vencido ? 'font-semibold text-red-600' : ''}>
            {formatDate(contrato.dataFim)}
            {vencido && <span className="ml-1 text-xs">· Vencido</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">Valor total</span>
        <span className="font-semibold">{formatCurrency(Number(contrato.valorTotal))}</span>
      </div>

      <div className="flex gap-2 border-t pt-2">
        <a
          href={`/imprimir/contratos/${contrato.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          <FileText className="h-3.5 w-3.5" />
          Contrato
        </a>
        <a
          href={`/imprimir/contratos/${contrato.id}/recibo`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          <Receipt className="h-3.5 w-3.5" />
          Recibo
        </a>
        <div className="flex flex-1 items-center justify-center">
          <ContratoEditForm contrato={contrato} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <ContratoPayForm contrato={contrato} formasPagamento={formasPagamento} />
        </div>
      </div>
    </div>
  )
}

// ─── Tabela desktop ───────────────────────────────────────────────────────────

function ContratosTable({
  contratos,
  formasPagamento,
}: {
  contratos: ContratoListItem[]
  formasPagamento: FormaPagamentoOption[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº Contrato</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Período</TableHead>
          <TableHead className="text-center">Itens</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contratos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              Nenhum contrato registrado ainda.
            </TableCell>
          </TableRow>
        ) : (
          contratos.map((contrato) => {
            const hoje = new Date()
            const vencido = contrato.status === 'ATIVO' && new Date(contrato.dataFim) < hoje
            return (
              <TableRow key={contrato.id}>
                <TableCell className="font-mono text-sm font-semibold">
                  {contrato.numeroContrato}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{contrato.cliente.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground">{contrato.cliente.telefone}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{formatDate(contrato.dataInicio)}</p>
                  <p className={`text-xs ${vencido ? 'font-semibold text-red-600' : 'text-muted-foreground'}`}>
                    até {formatDate(contrato.dataFim)}{vencido && ' · Vencido'}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{contrato._count.itens}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(Number(contrato.valorTotal))}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[contrato.status] ?? 'outline'}>
                    {statusLabel[contrato.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <a
                      href={`/imprimir/contratos/${contrato.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Imprimir contrato"
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                    <a
                      href={`/imprimir/contratos/${contrato.id}/recibo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Imprimir recibo"
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Receipt className="h-4 w-4" />
                    </a>
                    <ContratoEditForm contrato={contrato} />
                    <ContratoPayForm contrato={contrato} formasPagamento={formasPagamento} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}

// ─── Export: responsivo ───────────────────────────────────────────────────────

export function ContratosList({ contratos, clientes, formasPagamento }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const status = searchParams.get('status') ?? 'all'
  const clienteId = searchParams.get('clienteId') ?? 'all'
  const dataInicio = searchParams.get('dataInicio') ?? ''
  const dataFim = searchParams.get('dataFim') ?? ''

  const clientesOptions = useMemo(
    () => [...clientes].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)),
    [clientes],
  )

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set('page', '1')
    startTransition(() => {
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }
  
  return (
    <>
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={(v) => updateParam('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Cliente</label>
          <Select value={clienteId} onValueChange={(v) => updateParam('clienteId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clientesOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nomeCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Início</label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => updateParam('dataInicio', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Fim</label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => updateParam('dataFim', e.target.value)}
            />
          </div>
        </div>
      </div>

      {contratos.length === 0 ? (
        <p className="px-4 pb-6 text-sm text-muted-foreground">
          {status !== 'all' || clienteId !== 'all' || dataInicio || dataFim
            ? 'Nenhum contrato encontrado com os filtros.'
            : 'Nenhum contrato registrado ainda.'}
        </p>
      ) : (
        <>
          <div className="md:hidden space-y-3 p-4">
            {contratos.map((c) => (
              <ContratoCard key={c.id} contrato={c} formasPagamento={formasPagamento} />
            ))}
          </div>
          <div className="hidden md:block">
            <ContratosTable contratos={contratos} formasPagamento={formasPagamento} />
          </div>
        </>
      )}
    </>
  )
}
