'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lookrent/ui'
import { formatCPF, formatPhone, formatDate } from '@lookrent/utils'
import type { ClienteListItem } from '@/services/clientes.service'
import { ClienteEditForm } from './cliente-edit-form'
import { updateCliente } from '@/services/mutations'
import { UserX, Trash2, Loader2 } from 'lucide-react'

interface Props {
  clientes: ClienteListItem[]
  isAdmin: boolean
}

// ─── Card mobile ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  disabled,
  trigger,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'default' | 'destructive'
  onConfirm: () => void
  disabled: boolean
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant={confirmVariant ?? 'default'}
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
            disabled={disabled}
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClienteCard({
  cliente,
  isAdmin,
  onInativar,
  onRemover,
  isPending,
}: {
  cliente: ClienteListItem
  isAdmin: boolean
  onInativar: (id: string) => void
  onRemover: (id: string) => void
  isPending: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{cliente.nomeCompleto}</p>
          {cliente.email && (
            <p className="text-xs text-muted-foreground truncate">{cliente.email}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Badge variant={cliente._count.contratos > 0 ? 'default' : 'outline'}>
            {cliente._count.contratos} contrato{cliente._count.contratos !== 1 ? 's' : ''}
          </Badge>
          <ClienteEditForm cliente={cliente} />
          <ConfirmDialog
            title="Inativar cliente?"
            description={`Tem certeza que deseja inativar ${cliente.nomeCompleto}?`}
            confirmLabel="Confirmar"
            onConfirm={() => onInativar(cliente.id)}
            disabled={isPending}
            trigger={
              <button
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Inativar cliente"
              >
                <UserX className="h-4 w-4" />
              </button>
            }
          />
          {!isAdmin && (
            <ConfirmDialog
              title="Remover cliente?"
              description="Esta ação remove o cliente da listagem."
              confirmLabel="Remover"
              confirmVariant="destructive"
              onConfirm={() => onRemover(cliente.id)}
              disabled={isPending}
              trigger={
                <button
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                  title="Remover cliente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">CPF</p>
          <p className="font-mono">{formatCPF(cliente.cpf)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Telefone</p>
          <p>{formatPhone(cliente.telefone)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cidade</p>
          <p>{cliente.cidade} <span className="text-muted-foreground">/ {cliente.estado}</span></p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cadastro</p>
          <p className="text-muted-foreground">{formatDate(cliente.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tabela desktop ───────────────────────────────────────────────────────────

function ClientesTable({
  clientes,
  isAdmin,
  onInativar,
  onRemover,
  isPending,
}: {
  clientes: ClienteListItem[]
  isAdmin: boolean
  onInativar: (id: string) => void
  onRemover: (id: string) => void
  isPending: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead className="text-center">Contratos</TableHead>
          <TableHead>Cadastro</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </TableCell>
          </TableRow>
        ) : (
          clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>
                <p className="font-medium">{cliente.nomeCompleto}</p>
                {cliente.email && (
                  <p className="text-xs text-muted-foreground">{cliente.email}</p>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCPF(cliente.cpf)}
              </TableCell>
              <TableCell>{formatPhone(cliente.telefone)}</TableCell>
              <TableCell>
                {cliente.cidade}
                <span className="ml-1 text-xs text-muted-foreground">/ {cliente.estado}</span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={cliente._count.contratos > 0 ? 'default' : 'outline'}>
                  {cliente._count.contratos}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(cliente.createdAt)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <ClienteEditForm cliente={cliente} />
                  <ConfirmDialog
                    title="Inativar cliente?"
                    description={`Tem certeza que deseja inativar ${cliente.nomeCompleto}?`}
                    confirmLabel="Confirmar"
                    onConfirm={() => onInativar(cliente.id)}
                    disabled={isPending}
                    trigger={
                      <button
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Inativar cliente"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    }
                  />
                  {!isAdmin && (
                    <ConfirmDialog
                      title="Remover cliente?"
                      description="Esta ação remove o cliente da listagem."
                      confirmLabel="Remover"
                      confirmVariant="destructive"
                      onConfirm={() => onRemover(cliente.id)}
                      disabled={isPending}
                      trigger={
                        <button
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                          title="Remover cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      }
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ─── Export: responsivo ───────────────────────────────────────────────────────

export function ClientesList({ clientes, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleInativar(id: string) {
    startTransition(async () => {
      const result = await updateCliente(id, { ativo: false })
      if ('error' in result) return
      router.refresh()
    })
  }

  function handleRemover(id: string) {
    startTransition(async () => {
      const result = await updateCliente(id, { removido: true })
      if ('error' in result) return
      router.refresh()
    })
  }

  if (clientes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum cliente encontrado.
      </p>
    )
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3 p-4">
        {clientes.map((c) => (
          <ClienteCard
            key={c.id}
            cliente={c}
            isAdmin={isAdmin}
            onInativar={handleInativar}
            onRemover={handleRemover}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <ClientesTable
          clientes={clientes}
          isAdmin={isAdmin}
          onInativar={handleInativar}
          onRemover={handleRemover}
          isPending={isPending}
        />
      </div>
    </>
  )
}
