'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@lookrent/ui'
import { SidebarContent } from './sidebar'

export function MobileSidebar({
  isAdmin,
  isSuperAdmin,
  empresas,
  empresaAtivaId,
  empresaAtivaNome,
}: {
  isAdmin?: boolean
  isSuperAdmin?: boolean
  empresas?: Array<{ id: string; nome: string }>
  empresaAtivaId?: string | null
  empresaAtivaNome?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <SidebarContent
          onNavigate={() => setOpen(false)}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          empresas={empresas}
          empresaAtivaId={empresaAtivaId}
          empresaAtivaNome={empresaAtivaNome}
        />
      </SheetContent>
    </Sheet>
  )
}
