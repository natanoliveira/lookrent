'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  FileText,
  DollarSign,
  Settings,
  Building2,
} from 'lucide-react'
import { NavItem } from './nav-item'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '@lookrent/ui'
import { LogoutDialog } from './logout-dialog'
import { useTransition } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alugueis', label: 'Aluguéis', icon: ShoppingBag },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
]

export function SidebarContent({
  onNavigate,
  isAdmin,
  isSuperAdmin,
  empresas,
  empresaAtivaId,
  empresaAtivaNome,
}: {
  onNavigate?: () => void
  isAdmin?: boolean
  isSuperAdmin?: boolean
  empresas?: Array<{ id: string; nome: string }>
  empresaAtivaId?: string | null
  empresaAtivaNome?: string | null
}) {
  const [, startTransition] = useTransition()

  function handleEmpresaChange(value: string) {
    startTransition(async () => {
      await fetch('/api/empresas/ativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: value }),
      })
      onNavigate?.()
      window.location.reload()
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
            <span className="text-sm font-bold text-white">LR</span>
          </div>
          <span className="text-lg font-bold text-brand-navy dark:text-white">LookRent</span>
        </Link>
      </div>

      <Separator />

      {isSuperAdmin && empresas && (
        <div className="space-y-2 px-4 py-4">
          <Label className="text-xs font-medium text-muted-foreground">Empresa ativa</Label>
          <Select value={empresaAtivaId ?? undefined} onValueChange={handleEmpresaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!isSuperAdmin && empresaAtivaNome && (
        <div className="space-y-2 px-4 py-4">
          <Label className="text-xs font-medium text-muted-foreground">Empresa</Label>
          <Select value={empresaAtivaId ?? undefined} disabled>
            <SelectTrigger>
              <SelectValue placeholder={empresaAtivaNome} />
            </SelectTrigger>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={onNavigate} />
        ))}
        {isSuperAdmin && (
          <NavItem href="/empresas" label="Empresas" icon={Building2} onClick={onNavigate} />
        )}
      </nav>

      <Separator />

      {/* Bottom */}
      <div className="space-y-1 p-4">
        {isAdmin && (
          <NavItem href="/configuracoes" label="Configurações" icon={Settings} onClick={onNavigate} />
        )}
        <LogoutDialog />
      </div>
    </div>
  )
}

export function Sidebar({
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
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
      <SidebarContent
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        empresas={empresas}
        empresaAtivaId={empresaAtivaId}
        empresaAtivaNome={empresaAtivaNome}
      />
    </aside>
  )
}
