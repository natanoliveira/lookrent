'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PackagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createProduto } from '@/services/mutations'
import {
  Button, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@lookrent/ui'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  referencia: z.string().optional(),
  codigoInterno: z.string().optional(),
  tamanho: z.string().optional(),
  quantidadeTotal: z.coerce.number().int().min(1, 'Mínimo 1'),
  valorLocacao: z.coerce.number().min(0.01, 'Informe o valor de locação'),
  valorCusto: z.coerce.number().min(0).optional(),
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

export function ProdutoForm() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantidadeTotal: 1 },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const result = await createProduto(data)

        if ('error' in result) {
          toast.error(result.error)
          return
        }

        toast.success('Produto cadastrado com sucesso!')
        reset()
        setOpen(false)
        router.refresh()
      } catch {
        toast.error('Erro inesperado. Verifique sua conexão e tente novamente.')
      } finally {
        // isPending é gerenciado automaticamente pelo useTransition
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PackagePlus className="h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nome do produto *" error={errors.nome?.message}>
            <Input placeholder="Vestido de festa longo" {...register('nome')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Referência" error={errors.referencia?.message}>
              <Input placeholder="REF-001" {...register('referencia')} />
            </Field>
            <Field label="Código interno" error={errors.codigoInterno?.message}>
              <Input placeholder="COD-001" {...register('codigoInterno')} />
            </Field>
          </div>

          <Field label="Tamanho" error={errors.tamanho?.message}>
            <Input placeholder="P / M / G / GG / 38 / 40..." {...register('tamanho')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Qtd. em estoque *" error={errors.quantidadeTotal?.message}>
              <Input type="number" min={1} {...register('quantidadeTotal')} />
            </Field>
            <Field label="Valor de locação *" error={errors.valorLocacao?.message}>
              <Input type="number" step="0.01" min="0" placeholder="0,00" {...register('valorLocacao')} />
            </Field>
          </div>

          <Field label="Valor de custo" error={errors.valorCusto?.message}>
            <Input type="number" step="0.01" min="0" placeholder="0,00 (opcional)" {...register('valorCusto')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Cadastrar Produto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
