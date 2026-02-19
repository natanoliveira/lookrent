'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { CreditCard, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { pagarContrato } from '@/services/mutations'
import {
  Button, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lookrent/ui'
import { formatDate, formatCurrency } from '@lookrent/utils'
import type { ContratoListItem, FormaPagamentoOption } from '@/services/contratos.service'
import { formatCurrencyBr } from '@lookrent/utils'

const itemSchema = z.object({
  formaPagamentoId: z.string().min(1),
  valor: z.string().min(1),
  parcelas: z.coerce.number().int().min(1).optional(),
})

type PagamentoItem = z.infer<typeof itemSchema>

interface Props {
  contrato: ContratoListItem
  formasPagamento: FormaPagamentoOption[]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  )
}

export function ContratoPayForm({ contrato, formasPagamento }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([
    { formaPagamentoId: '', valor: '' },
  ])
  const router = useRouter()
  const conta = contrato.contaReceber
  const valorContrato = conta?.valorOriginal ?? contrato.valorTotal
  const valorPago = conta?.valorPago ?? 0
  const restante = Math.max(0, valorContrato - valorPago)

  function addPagamento() {
    setPagamentos((prev) => [...prev, { formaPagamentoId: '', valor: '' }])
  }

  function removePagamento(index: number) {
    setPagamentos((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePagamento(
    index: number,
    field: keyof PagamentoItem,
    value: string | number | undefined,
  ) {
    setPagamentos((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function parseCurrencyBR(value: string): number {
    const digits = value.replace(/\D/g, '')
    if (!digits) return 0
    return Number(digits) / 100
  }

  function formatCurrencyInput(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const number = Number(digits) / 100
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number)
  }

  const total = pagamentos.reduce((acc, p) => acc + parseCurrencyBR(p.valor), 0)

  function handleClose() {
    setOpen(false)
    setPagamentos([{ formaPagamentoId: '', valor: '' }])
  }

  function onSubmit() {
    const parsed = z.array(itemSchema).min(1).safeParse(pagamentos)
    if (!parsed.success) {
      toast.error('Preencha as formas de pagamento corretamente.')
      return
    }

    const payload = parsed.data.map((p) => ({
      formaPagamentoId: p.formaPagamentoId,
      valor: parseCurrencyBR(p.valor),
      parcelas: p.parcelas,
    }))

    if (payload.some((p) => !p.valor || p.valor <= 0)) {
      toast.error('Informe valores válidos para o pagamento.')
      return
    }

    startTransition(async () => {
      try {
        const result = await pagarContrato(contrato.id, payload)
        if ('error' in result) {
          toast.error(result.error)
          return
        }

        toast.success(
          `Pagamento registrado. Total pago: R$ ${formatCurrencyBr(result.contaReceber.valorPago)}`,
        )
        handleClose()
        router.refresh()
      } catch {
        toast.error('Erro inesperado. Tente novamente.')
      }
    })
  }

  const contaPaga = valorContrato == valorPago;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Registrar pagamento"
        >
          <CreditCard className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamento do Contrato {contrato.numeroContrato}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{contrato.cliente.nomeCompleto}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border px-3 py-2">
              <p className="text-muted-foreground">Valor do contrato</p>
              <p className="mt-1 text-sm font-semibold">R$ {formatCurrencyBr(valorContrato)}</p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="text-muted-foreground">Pago</p>
              <p className="mt-1 text-sm font-semibold">R$ {formatCurrencyBr(valorPago)}</p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="text-muted-foreground">Em aberto</p>
              <p className="mt-1 text-sm font-semibold">R$ {formatCurrencyBr(restante)}</p>
            </div>
          </div>

          {contrato.pagamentos && contrato.pagamentos.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">Pagamentos realizados</p>
              <div className="mt-2 space-y-2">
                {contrato.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm text-green-600 bg-green-50 rounded-lg p-2 border-green-200 border border-dashed">
                    <div className="min-w-0">
                      <p className="truncate">
                        {p.formaPagamento.nome}
                        {p.parcelas ? ` · ${p.parcelas}x` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground text-green-600">{formatDate(p.dataPagamento)}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!contaPaga && (
            <>
          <div className="space-y-3">
            {pagamentos.map((p, index) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Field label={`Forma ${index + 1}`}>
                      <Select
                        value={p.formaPagamentoId}
                        onValueChange={(v) => updatePagamento(index, 'formaPagamentoId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasPagamento.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Valor">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={p.valor}
                          onChange={(e) => updatePagamento(index, 'valor', formatCurrencyInput(e.target.value))}
                        />
                      </Field>
                      <Field label="Parcelas (opcional)">
                        <Input
                          type="number"
                          min={1}
                          value={p.parcelas ?? ''}
                          onChange={(e) =>
                            updatePagamento(
                              index,
                              'parcelas',
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  {pagamentos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6 h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removePagamento(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addPagamento} className="gap-1">
            <Plus className="h-3 w-3" />
            Adicionar forma
          </Button>
          </>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span>{!contaPaga ? 'Total a pagar' : 'Pagamento total'}</span>
            <span className="font-semibold">R$ {formatCurrencyBr(valorContrato ?? total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={(isPending && valorContrato >= valorPago) || contaPaga}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando
              </>
            ) : (
              'Registrar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
