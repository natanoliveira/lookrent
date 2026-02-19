import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lookrent/ui'
import { formatDate, formatDateTime } from '@lookrent/utils'
import type { MovimentacaoListItem } from '@/services/alugueis.service'

interface Props {
  movimentacoes: MovimentacaoListItem[]
}

const contratoStatusVariant: Record<string, 'default' | 'success' | 'warning' | 'outline' | 'destructive'> = {
  ATIVO: 'success', PENDENTE: 'warning', CANCELADO: 'destructive', FINALIZADO: 'outline',
}
const contratoStatusLabel: Record<string, string> = {
  ATIVO: 'Ativo', PENDENTE: 'Pendente', CANCELADO: 'Cancelado', FINALIZADO: 'Finalizado',
}

// ─── Card mobile ─────────────────────────────────────────────────────────────

function MovimentacaoCard({ mov }: { mov: MovimentacaoListItem }) {
  const isRetirada = mov.tipo === 'RETIRADA'

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{mov.contrato.cliente.nomeCompleto}</p>
          <p className="font-mono text-sm text-muted-foreground">{mov.contrato.numeroContrato}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {isRetirada ? (
            <Badge variant="default" className="gap-1">
              <ArrowUpFromLine className="h-3 w-3" />
              Retirada
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <ArrowDownToLine className="h-3 w-3" />
              Devolução
            </Badge>
          )}
          <Badge variant={contratoStatusVariant[mov.contrato.status] ?? 'outline'} className="text-xs">
            {contratoStatusLabel[mov.contrato.status]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Período do contrato</p>
          <p className="text-xs">
            {formatDate(mov.contrato.dataInicio)} → {formatDate(mov.contrato.dataFim)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Registrado em</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(mov.data)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tabela desktop ───────────────────────────────────────────────────────────

function AlugueisTable({ movimentacoes }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Período</TableHead>
          <TableHead>Status Contrato</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimentacoes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              Nenhuma movimentação registrada ainda.
            </TableCell>
          </TableRow>
        ) : (
          movimentacoes.map((mov) => (
            <TableRow key={mov.id}>
              <TableCell>
                {mov.tipo === 'RETIRADA' ? (
                  <Badge variant="default" className="gap-1">
                    <ArrowUpFromLine className="h-3 w-3" />Retirada
                  </Badge>
                ) : (
                  <Badge variant="success" className="gap-1">
                    <ArrowDownToLine className="h-3 w-3" />Devolução
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm font-semibold">
                {mov.contrato.numeroContrato}
              </TableCell>
              <TableCell className="font-medium">{mov.contrato.cliente.nomeCompleto}</TableCell>
              <TableCell>
                <p className="text-xs text-muted-foreground">
                  {formatDate(mov.contrato.dataInicio)} → {formatDate(mov.contrato.dataFim)}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant={contratoStatusVariant[mov.contrato.status] ?? 'outline'}>
                  {contratoStatusLabel[mov.contrato.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(mov.data)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ─── Export: responsivo ───────────────────────────────────────────────────────

export function AlugueisList({ movimentacoes }: Props) {
  if (movimentacoes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma movimentação registrada ainda.
      </p>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-3 p-4">
        {movimentacoes.map((m) => <MovimentacaoCard key={m.id} mov={m} />)}
      </div>
      <div className="hidden md:block">
        <AlugueisTable movimentacoes={movimentacoes} />
      </div>
    </>
  )
}
