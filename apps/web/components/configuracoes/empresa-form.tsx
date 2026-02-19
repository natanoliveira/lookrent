'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { onlyDigits, maskCEP, maskPhone, validateAndNormalizeEmail, maskCNPJ } from '@lookrent/utils'
import {
  Button, Input, Label, Textarea,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lookrent/ui'
import type { ConfiguracaoEmpresaConfig, EmpresaConfig } from '@/services/configuracoes.service'
import { UFS } from '@/lib/ufs'
import { Loader2, MapPin } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().min(11),
  email: z.string().email(),
  telefone: z.string().min(8),
  logradouro: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  // cep: z.string().optional().or(z.literal('')),
  cep: z.string().length(9, 'CEP inválido').optional().or(z.literal('')),
  textoContrato: z.string().optional(),
  observacoesPadrao: z.string().optional(),
  multaPorAtraso: z.coerce.number().min(0),
  diasCarencia: z.coerce.number().int().min(0),
  dadosBancarios: z.string().optional(),
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
  empresa: EmpresaConfig
  configuracao: ConfiguracaoEmpresaConfig | null
}

export function EmpresaForm({ empresa, configuracao }: Props) {
  const [isPending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      logradouro: empresa.logradouro,
      numero: empresa.numero,
      complemento: empresa.complemento ?? '',
      bairro: empresa.bairro,
      cidade: empresa.cidade,
      estado: empresa.estado,
      cep: empresa.cep,
      textoContrato: configuracao?.textoContrato ?? '',
      observacoesPadrao: configuracao?.observacoesPadrao ?? '',
      multaPorAtraso: configuracao?.multaPorAtraso ?? 0,
      diasCarencia: configuracao?.diasCarencia ?? 0,
      dadosBancarios: configuracao?.dadosBancarios ?? '',
    },
  })
  
  const estadoValue = watch('estado');

  const { onChange: onCnpjChange, ...cnpjReg } = register('cnpj')
  const { onChange: onPhoneChange, ...phoneReg } = register('telefone')
  // const { onChange: onCepChange, ...cepReg } = register('cep')
  const { onChange: onCepChange, onBlur: onCepBlur, ...cepReg } = register('cep')
  const { onBlur: onEmailBlur, ...emailReg } = register('email')

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
        toast.warning('Não foi possível buscar o CEP. Preencha o endereço manualmente.')
      } finally {
        setIsCepLoading(false)
      }
    }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/configuracoes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa: {
              nome: data.nome,
              cnpj: onlyDigits(data.cnpj),
              email: data.email,
              telefone: onlyDigits(data.telefone),
              logradouro: data.logradouro,
              numero: data.numero,
              complemento: data.complemento || null,
              bairro: data.bairro,
              cidade: data.cidade,
              estado: data.estado,
              cep: onlyDigits(data.cep ?? ''),
              logo: null,
            },
            configuracao: {
              textoContrato: data.textoContrato || null,
              observacoesPadrao: data.observacoesPadrao || null,
              multaPorAtraso: data.multaPorAtraso,
              diasCarencia: data.diasCarencia,
              dadosBancarios: data.dadosBancarios || null,
            },
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error ?? 'Erro ao salvar configurações')
          return
        }
        toast.success('Configurações salvas com sucesso!')
        setDirty(false)
      } catch {
        toast.error('Erro de conexão. Tente novamente.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onChange={() => setDirty(true)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome da empresa">
          <Input {...register('nome')} />
        </Field>
        <Field label="CNPJ *" error={errors.cnpj?.message}>
          <Input {...cnpjReg} 
          onChange={(e) => {
            e.target.value = maskCNPJ(e.target.value)
            onCnpjChange(e)
          }} />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            {...emailReg}
            onBlur={(e) => {
              onEmailBlur(e)
              const result = validateAndNormalizeEmail(e.target.value, { strict: false })
              if (result.suggestion && result.normalized !== e.target.value) {
                setValue('email', result.normalized, { shouldValidate: true })
                toast.message(`Corrigimos o domínio do e-mail para ${result.normalized}`)
              }
              if (!result.isValid) {
                toast.error(result.reason ?? 'E-mail inválido.')
              }
            }}
          />
        </Field>
        <Field label="Telefone">
          <Input
            {...phoneReg}
            onChange={(e) => {
              e.target.value = maskPhone(e.target.value)
              onPhoneChange(e)
            }}
          />
        </Field>
        <Field label="CEP">
          {/* <Input
            {...cepReg}
            onChange={(e) => {
              e.target.value = maskCEP(e.target.value)
              onCepChange(e)
            }}
          /> */}
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
        <Field label="Estado">
          {/* <Input {...register('estado')} maxLength={2} /> */}
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
        <Field label="Cidade">
          <Input {...register('cidade')} />
        </Field>
        <Field label="Bairro">
          <Input {...register('bairro')} />
        </Field>
        <Field label="Logradouro">
          <Input {...register('logradouro')} />
        </Field>
        <Field label="Número">
          <Input {...register('numero')} />
        </Field>
        <Field label="Complemento">
          <Input {...register('complemento')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Multa por atraso (%)">
          <Input type="number" step="0.01" min={0} {...register('multaPorAtraso')} />
        </Field>
        <Field label="Dias de carência">
          <Input type="number" min={0} {...register('diasCarencia')} />
        </Field>
        <Field label="Observações padrão">
          <Input {...register('observacoesPadrao')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Texto do contrato">
          <Textarea rows={5} {...register('textoContrato')} />
        </Field>
        <Field label="Dados bancários">
          <Textarea rows={3} {...register('dadosBancarios')} />
        </Field>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !dirty}>
          {isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </DialogFooter>
    </form>
  )
}
