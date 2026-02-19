'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FilePlus, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createContrato } from '@/services/mutations'
import {
  Button, Input, Label, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lookrent/ui'

const schema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  dataInicio: z.string().min(1, 'Informe a data de início'),
  dataFim: z.string().min(1, 'Informe a data de término'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, 'Selecione o produto'),
    quantidade: z.coerce.number().int().min(1, 'Mínimo 1'),
  })).min(1, 'Adicione ao menos um produto'),
})

type FormData = z.infer<typeof schema>
type Item = { produtoId: string; quantidade: number }

type ClienteOption = { id: string; nomeCompleto: string }
type ProdutoOption = {
  id: string
  nome: string
  tamanho: string | null
  valorLocacao: number
  quantidadeDisponivel: number
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface ContratoFormProps {
  clientes: ClienteOption[]
  produtos: ProdutoOption[]
}

export function ContratoForm({ clientes, produtos }: ContratoFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [itens, setItens] = useState<Item[]>([{ produtoId: '', quantidade: 1 }])
  const router = useRouter()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { clienteId: '', dataInicio: '', dataFim: '', observacoes: '', itens: [{ produtoId: '', quantidade: 1 }] },
  })

  const selectedClienteId = watch('clienteId')
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteOpen, setClienteOpen] = useState(false)

  const filteredClientes = useMemo(() => {
    const q = clienteQuery.trim().toLowerCase()
    if (q.length < 3) return []
    return clientes.filter((c) => c.nomeCompleto.toLowerCase().includes(q))
  }, [clienteQuery, clientes])

  useEffect(() => {
    if (!selectedClienteId) return
    const selected = clientes.find((c) => c.id === selectedClienteId)
    if (selected) setClienteQuery(selected.nomeCompleto)
  }, [selectedClienteId, clientes])

  function updateItem(index: number, field: keyof Item, value: string | number) {
    const updated = itens.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    setItens(updated)
    setValue(`itens.${index}.${field}` as 'itens.0.produtoId', value as never)
  }

  function addItem() {
    const newItens = [...itens, { produtoId: '', quantidade: 1 }]
    setItens(newItens)
    setValue('itens', newItens as never)
  }

  function removeItem(index: number) {
    const newItens = itens.filter((_, i) => i !== index)
    setItens(newItens)
    setValue('itens', newItens as never)
  }

  const total = itens.reduce((acc, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId)
    return produto ? acc + produto.valorLocacao * (item.quantidade || 0) : acc
  }, 0)

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const result = await createContrato({ ...data, itens })

        if ('error' in result) {
          toast.error(result.error)
          return
        }

        toast.success(`Contrato ${result.numeroContrato} criado com sucesso!`)
        handleClose()
        router.refresh()
      } catch {
        toast.error('Erro inesperado. Verifique sua conexão e tente novamente.')
      } finally {
        // isPending é gerenciado automaticamente pelo useTransition
      }
    })
  }

  function handleClose() {
    setOpen(false)
    reset()
    setItens([{ produtoId: '', quantidade: 1 }])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FilePlus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cliente &amp; Período
            </p>

            <Field label="Cliente *" error={errors.clienteId?.message}>
              <input type="hidden" {...register('clienteId')} />
              <div className="relative">
                <Input
                  value={clienteQuery}
                  onChange={(e) => {
                    setClienteQuery(e.target.value)
                    setClienteOpen(true)
                    setValue('clienteId', '', { shouldValidate: true })
                  }}
                  onFocus={() => setClienteOpen(true)}
                  onBlur={() => setTimeout(() => setClienteOpen(false), 120)}
                  placeholder="Digite ao menos 3 caracteres"
                />

                {clienteOpen && clienteQuery.trim().length >= 3 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow">
                    {filteredClientes.length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Nenhum cliente encontrado
                      </div>
                    )}

                    {filteredClientes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-center rounded-sm px-2 py-1 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setValue('clienteId', c.id, { shouldValidate: true })
                          setClienteQuery(c.nomeCompleto)
                          setClienteOpen(false)
                        }}
                      >
                        {c.nomeCompleto}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de início *" error={errors.dataInicio?.message}>
                <Input type="date" {...register('dataInicio')} />
              </Field>
              <Field label="Data de término *" error={errors.dataFim?.message}>
                <Input type="date" {...register('dataFim')} />
              </Field>
            </div>

            <Field label="Observações" error={errors.observacoes?.message}>
              <Textarea placeholder="Informações adicionais..." rows={2} {...register('observacoes')} />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produtos</p>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
                <Plus className="h-3 w-3" />
                Adicionar produto
              </Button>
            </div>

            {errors.itens?.message && (
              <p className="text-xs text-destructive">{errors.itens.message}</p>
            )}

            <div className="space-y-2">
              {itens.map((item, index) => {
                const produto = produtos.find((p) => p.id === item.produtoId)
                const subtotal = produto ? produto.valorLocacao * (item.quantidade || 0) : 0

                return (
                  <div key={index} className="rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Field label={`Produto ${index + 1} *`}>
                          <Select value={item.produtoId} onValueChange={(v) => updateItem(index, 'produtoId', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                            <SelectContent>
                              {produtos.map((p) => (
                                <SelectItem key={p.id} value={p.id} disabled={p.quantidadeDisponivel === 0}>
                                  {p.nome}{p.tamanho ? ` (${p.tamanho})` : ''} — {p.quantidadeDisponivel} disp.
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>

                        <div className="flex items-center gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Quantidade *</Label>
                            <Input
                              type="number"
                              min={1}
                              max={produto?.quantidadeDisponivel}
                              value={item.quantidade}
                              onChange={(e) => updateItem(index, 'quantidade', Number(e.target.value))}
                              className="w-24"
                            />
                          </div>
                          {produto && subtotal > 0 && (
                            <p className="mt-5 text-xs text-muted-foreground">
                              = R$ {subtotal.toFixed(2).replace('.', ',')}
                            </p>
                          )}
                        </div>
                      </div>

                      {itens.length > 1 && (
                        <Button
                          type="button" variant="ghost" size="sm"
                          className="mt-5 h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2">
              <span className="text-sm font-medium">Total do contrato</span>
              <span className="text-base font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Contrato'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
