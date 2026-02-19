'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lookrent/ui'
import { formatCurrency } from '@lookrent/utils'
import type { ProdutoListItem } from '@/services/produtos.service'
import { ProdutoEditForm } from './produto-edit-form'
import { updateProduto } from '@/services/mutations'
import { UserX, Trash2, Loader2 } from 'lucide-react'

interface Props {
  produtos: ProdutoListItem[]
  isAdmin: boolean
}

function stockColor(disponivel: number, total: number) {
  if (disponivel === 0) return 'text-red-600'
  if (disponivel / total < 0.5) return 'text-amber-600'
  return 'text-emerald-600'
}

// ─── Card mobile ─────────────────────────────────────────────────────────────

function ProdutoCard({
  produto,
  isAdmin,
  onInativar,
  onRemover,
  isPending,
}: {
  produto: ProdutoListItem
  isAdmin: boolean
  onInativar: (id: string) => void
  onRemover: (id: string) => void
  isPending: boolean
}) {
  const cor = stockColor(produto.quantidadeDisponivel, produto.quantidadeTotal)

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{produto.nome}</p>
          {produto.codigoInterno && (
            <p className="text-xs font-mono text-muted-foreground">{produto.codigoInterno}</p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {produto.tamanho && (
            <Badge variant="outline" className="text-xs">{produto.tamanho}</Badge>
          )}
          <div className="flex items-center gap-1">
            {!produto.ativo ? (
              <Badge variant="destructive">Inativo</Badge>
            ) : produto.quantidadeDisponivel === 0 ? (
              <Badge variant="secondary">Indisponível</Badge>
            ) : (
              <Badge variant="success">Disponível</Badge>
            )}
            <ProdutoEditForm produto={produto} />
            <ConfirmDialog
              title="Inativar produto?"
              description={`Tem certeza que deseja inativar ${produto.nome}?`}
              confirmLabel="Confirmar"
              onConfirm={() => onInativar(produto.id)}
              disabled={isPending}
              trigger={
                <button
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Inativar produto"
                >
                  <UserX className="h-4 w-4" />
                </button>
              }
            />
            {!isAdmin && (
              <ConfirmDialog
                title="Remover produto?"
                description="Esta ação remove o produto da listagem."
                confirmLabel="Remover"
                confirmVariant="destructive"
                onConfirm={() => onRemover(produto.id)}
                disabled={isPending}
                trigger={
                  <button
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    title="Remover produto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Referência</p>
          <p className="text-muted-foreground">{produto.referencia ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estoque</p>
          <p>
            <span className={`font-semibold ${cor}`}>{produto.quantidadeDisponivel}</span>
            <span className="text-muted-foreground text-xs"> / {produto.quantidadeTotal}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Locação</p>
          <p className="font-semibold">{formatCurrency(Number(produto.valorLocacao))}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tabela desktop ───────────────────────────────────────────────────────────

function ProdutosTable({
  produtos,
  isAdmin,
  onInativar,
  onRemover,
  isPending,
}: {
  produtos: ProdutoListItem[]
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
          <TableHead>Ref. / Código</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead className="text-center">Estoque</TableHead>
          <TableHead>Valor Locação</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              Nenhum produto cadastrado ainda.
            </TableCell>
          </TableRow>
        ) : (
          produtos.map((produto) => {
            const cor = stockColor(produto.quantidadeDisponivel, produto.quantidadeTotal)
            return (
              <TableRow key={produto.id}>
                <TableCell>
                  <p className="font-medium">{produto.nome}</p>
                  {produto.codigoInterno && (
                    <p className="text-xs font-mono text-muted-foreground">{produto.codigoInterno}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {produto.referencia ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{produto.tamanho ?? '—'}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-semibold ${cor}`}>
                    {produto.quantidadeDisponivel}
                  </span>
                  <span className="text-xs text-muted-foreground"> / {produto.quantidadeTotal}</span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(Number(produto.valorLocacao))}
                </TableCell>
                <TableCell>
                  {!produto.ativo ? (
                    <Badge variant="destructive">Inativo</Badge>
                  ) : produto.quantidadeDisponivel === 0 ? (
                    <Badge variant="secondary">Indisponível</Badge>
                  ) : (
                    <Badge variant="success">Disponível</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ProdutoEditForm produto={produto} />
                    <ConfirmDialog
                      title="Inativar produto?"
                      description={`Tem certeza que deseja inativar ${produto.nome}?`}
                      confirmLabel="Confirmar"
                      onConfirm={() => onInativar(produto.id)}
                      disabled={isPending}
                      trigger={
                        <button
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Inativar produto"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      }
                    />
                    {!isAdmin && (
                      <ConfirmDialog
                        title="Remover produto?"
                        description="Esta ação remove o produto da listagem."
                        confirmLabel="Remover"
                        confirmVariant="destructive"
                        onConfirm={() => onRemover(produto.id)}
                        disabled={isPending}
                        trigger={
                          <button
                            className="rounded p-1 text-destructive hover:bg-destructive/10"
                            title="Remover produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                    )}
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

export function ProdutosList({ produtos, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleInativar(id: string) {
    startTransition(async () => {
      const result = await updateProduto(id, { ativo: false })
      if ('error' in result) return
      router.refresh()
    })
  }

  function handleRemover(id: string) {
    startTransition(async () => {
      const result = await updateProduto(id, { removido: true })
      if ('error' in result) return
      router.refresh()
    })
  }

  if (produtos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum produto cadastrado ainda.
      </p>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-3 p-4">
        {produtos.map((p) => (
          <ProdutoCard
            key={p.id}
            produto={p}
            isAdmin={isAdmin}
            onInativar={handleInativar}
            onRemover={handleRemover}
            isPending={isPending}
          />
        ))}
      </div>
      <div className="hidden md:block">
        <ProdutosTable
          produtos={produtos}
          isAdmin={isAdmin}
          onInativar={handleInativar}
          onRemover={handleRemover}
          isPending={isPending}
        />
      </div>
    </>
  )
}
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
