'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lookrent/ui'
import { LogoutDialog } from './logout-dialog'
import { LogOut, UserCircle } from 'lucide-react'
import Link from 'next/link'

interface UserMenuProps {
  nome: string
  email: string
  role: string
  avatarUrl?: string | null
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  GERENTE: 'Gerente',
  ATENDENTE: 'Atendente',
}

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function UserMenu({ nome, email, role, avatarUrl }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="hidden sm:flex">
        {roleLabels[role] ?? role}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted focus:outline-none">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{nome}</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[140px]">{email}</p>
            </div>
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={nome} />}
              <AvatarFallback className="bg-brand-blue text-white text-xs">
                {getInitials(nome)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{nome}</p>
            <p className="text-xs font-normal text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/perfil" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <LogoutDialog
              trigger={
                <div className="flex w-full items-center gap-2 text-destructive px-2">
                  <LogOut className="h-4 w-4" />
                  Sair do sistema
                </div>
              }
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
