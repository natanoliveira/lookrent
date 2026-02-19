'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateCliente } from '@/services/mutations'
import { UFS } from '@/lib/ufs'
import { onlyDigits, maskPhone, maskCEP } from '@lookrent/utils'
import {
  Button, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lookrent/ui'
import type { ClienteListItem } from '@/services/clientes.service'

const schema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(14, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cep: z.string().length(9, 'CEP inválido').optional().or(z.literal('')),
  logradouro: z.string().min(2, 'Logradouro inválido'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro inválido'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Selecione o estado'),
})

type FormData = z.infer<typeof schema>

interface ViaCEPResponse {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
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

interface Props {
  cliente: ClienteListItem
}

export function ClienteEditForm({ cliente }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isCepLoading, setIsCepLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: cliente.nomeCompleto,
      telefone: maskPhone(cliente.telefone),
      email: cliente.email ?? '',
      cep: maskCEP(cliente.cep),
      logradouro: cliente.logradouro,
      numero: cliente.numero,
      complemento: cliente.complemento ?? '',
      bairro: cliente.bairro,
      cidade: cliente.cidade,
      estado: cliente.estado,
    },
  })

  const estadoValue = watch('estado')

  const { onChange: onPhoneChange, ...phoneReg } = register('telefone')
  const { onChange: onCepChange, onBlur: onCepBlur, ...cepReg } = register('cep')

  async function lookupCEP(value: string) {
    const digits = onlyDigits(value)
    if (digits.length !== 8) return

    setIsCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!res.ok) throw new Error()

      const data: ViaCEPResponse = await res.json()
      if (data.erro) {
        toast.warning('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      if (data.logradouro) setValue('logradouro', data.logradouro, { shouldValidate: true })
      if (data.bairro) setValue('bairro', data.bairro, { shouldValidate: true })
      if (data.localidade) setValue('cidade', data.localidade, { shouldValidate: true })
      if (data.uf) setValue('estado', data.uf, { shouldValidate: true })

      toast.success('Endereço preenchido automaticamente.')
    } catch {
      toast.warning('Não foi possível buscar o CEP.')
    } finally {
      setIsCepLoading(false)
    }
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const result = await updateCliente(cliente.id, data)

        if ('error' in result) {
          toast.error(result.error)
          return
        }

        toast.success('Cliente atualizado com sucesso!')
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
      nomeCompleto: cliente.nomeCompleto,
      telefone: maskPhone(cliente.telefone),
      email: cliente.email ?? '',
      cep: maskCEP(cliente.cep),
      logradouro: cliente.logradouro,
      numero: cliente.numero,
      complemento: cliente.complemento ?? '',
      bairro: cliente.bairro,
      cidade: cliente.cidade,
      estado: cliente.estado,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Editar cliente"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados Pessoais</p>
            <Field label="Nome completo *" error={errors.nomeCompleto?.message}>
              <Input placeholder="Maria da Silva" {...register('nomeCompleto')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone *" error={errors.telefone?.message}>
                <Input
                  {...phoneReg}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  inputMode="numeric"
                  onChange={(e) => {
                    e.target.value = maskPhone(e.target.value)
                    onPhoneChange(e)
                  }}
                />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" placeholder="maria@email.com" {...register('email')} />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="CEP" error={errors.cep?.message}>
                <div className="relative">
                  <Input
                    {...cepReg}
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    className="pr-8"
                    onChange={(e) => {
                      e.target.value = maskCEP(e.target.value)
                      onCepChange(e)
                    }}
                    onBlur={(e) => {
                      onCepBlur(e)
                      void lookupCEP(e.target.value)
                    }}
                  />
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isCepLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <MapPin className="h-3.5 w-3.5" />
                    }
                  </div>
                </div>
              </Field>
              <Field label="Número *" error={errors.numero?.message}>
                <Input placeholder="123" {...register('numero')} />
              </Field>
            </div>

            <Field label="Logradouro *" error={errors.logradouro?.message}>
              <Input placeholder="Rua das Flores" {...register('logradouro')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Complemento" error={errors.complemento?.message}>
                <Input placeholder="Apto 4" {...register('complemento')} />
              </Field>
              <Field label="Bairro *" error={errors.bairro?.message}>
                <Input placeholder="Centro" {...register('bairro')} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade *" error={errors.cidade?.message}>
                <Input placeholder="São Paulo" {...register('cidade')} />
              </Field>
              <Field label="Estado *" error={errors.estado?.message}>
                <Select
                  value={estadoValue ?? ''}
                  onValueChange={(v) => setValue('estado', v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf.sigla} value={uf.sigla}>
                        {uf.sigla} — {uf.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isCepLoading}>
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
