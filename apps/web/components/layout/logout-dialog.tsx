'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@lookrent/ui'

interface LogoutDialogProps {
  trigger?: React.ReactNode
}

export function LogoutDialog({ trigger }: LogoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLogout() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Sessão encerrada com sucesso')
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        )}
      </div>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sair do sistema</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja encerrar a sessão? Você precisará fazer login novamente para
            acessar o sistema.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleLogout} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {isPending ? 'Saindo...' : 'Sim, sair'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
