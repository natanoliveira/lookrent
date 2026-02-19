'use client'

import { useMemo, useState, useTransition } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'
import { validateAndNormalizeEmail } from '@lookrent/utils'
import { createUsuario, updateUsuario } from '@/services/mutations'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lookrent/ui'
import type { UsuarioItem } from '@/services/configuracoes.service'

const createSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(['ADMIN', 'GERENTE', 'ATENDENTE']),
})

type CreateForm = z.infer<typeof createSchema>

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  )
}

export function UsuariosManager({ usuarios }: { usuarios: UsuarioItem[] }) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, setValue } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'ATENDENTE' },
  })

  const { onBlur: onEmailBlur, ...emailReg } = register('email')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return usuarios
    return usuarios.filter((u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [usuarios, filter])

  function isEditableRole(role: UsuarioItem['role']): role is 'ADMIN' | 'GERENTE' | 'ATENDENTE' {
    return role === 'ADMIN' || role === 'GERENTE' || role === 'ATENDENTE'
  }

  function onSubmit(data: CreateForm) {
    startTransition(async () => {
      const result = await createUsuario(data)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Usuário criado com sucesso!')
      reset({ role: 'ATENDENTE' })
      setOpen(false)
      router.refresh()
    })
  }

  function toggleAtivo(id: string, ativo: boolean) {
    startTransition(async () => {
      const result = await updateUsuario(id, { ativo })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Usuário atualizado!')
      router.refresh()
    })
  }

  function updateRole(id: string, role: 'ADMIN' | 'GERENTE' | 'ATENDENTE') {
    startTransition(async () => {
      const result = await updateUsuario(id, { role })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Função atualizada!')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
        <Input
          placeholder="Buscar usuário..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <Input placeholder="Nome completo" {...register('nome')} />
                </Field>
                <Field label="E-mail">
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
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
                <Field label="Senha">
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...register('senha')} />
                </Field>
                <Field label="Função">
                  <Select defaultValue="ATENDENTE" onValueChange={(v) => setValue('role', v as CreateForm['role'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="GERENTE">Gerente</SelectItem>
                      <SelectItem value="ATENDENTE">Atendente</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {!isEditableRole(u.role) ? (
                    <span className="text-sm font-medium">Super Admin</span>
                  ) : (
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v as CreateForm['role'])}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="GERENTE">Gerente</SelectItem>
                        <SelectItem value="ATENDENTE">Atendente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>{u.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant={u.ativo ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleAtivo(u.id, !u.ativo)}
                    disabled={isPending}
                  >
                    {u.ativo ? 'Inativar' : 'Ativar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
