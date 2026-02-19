'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateContrato } from '@/services/mutations'
import {
  Button, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lookrent/ui'
import type { ContratoListItem } from '@/services/contratos.service'

const statusOptions = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const

const schema = z.object({
  status: z.enum(['ATIVO', 'FINALIZADO', 'PENDENTE', 'CANCELADO']),
  dataFim: z.string().min(1, 'Data de término obrigatória'),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface Props {
  contrato: ContratoListItem
}

// Converte data ISO/string para o formato YYYY-MM-DD usado em <input type="date">
function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export function ContratoEditForm({ contrato }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: contrato.status as FormData['status'],
      dataFim: toDateInput(contrato.dataFim),
      observacoes: '',
    },
  })

  const statusValue = watch('status')

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const result = await updateContrato(contrato.id, data)

        if ('error' in result) {
          toast.error(result.error)
          return
        }

        toast.success('Contrato atualizado com sucesso!')
        setOpen(false)
        router.refresh()
      } catch {
        toast.error('Erro inesperado. Tente novamente.')
      }
    })
  }

  function handleClose() {
    setOpen(false)
    reset({
      status: contrato.status as FormData['status'],
      dataFim: toDateInput(contrato.dataFim),
      observacoes: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Editar contrato"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Contrato {contrato.numeroContrato}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Cliente: <span className="font-medium text-foreground">{contrato.cliente.nomeCompleto}</span>
          </div>

          <Field label="Status" error={errors.status?.message}>
            <Select
              value={statusValue}
              onValueChange={(v) => setValue('status', v as FormData['status'], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Data de término" error={errors.dataFim?.message}>
            <Input type="date" {...register('dataFim')} />
          </Field>

          <Field label="Observações" error={errors.observacoes?.message}>
            <Input placeholder="Observação opcional..." {...register('observacoes')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
