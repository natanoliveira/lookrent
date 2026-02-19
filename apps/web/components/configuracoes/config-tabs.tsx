'use client'

import { useState } from 'react'
import type { ConfiguracaoEmpresaConfig, EmpresaConfig, UsuarioItem } from '@/services/configuracoes.service'
import { cn } from '@lookrent/utils'
import { EmpresaForm } from './empresa-form'
import { UsuariosManager } from './usuarios-manager'

interface Props {
  empresa: EmpresaConfig
  configuracao: ConfiguracaoEmpresaConfig | null
  usuarios: UsuarioItem[]
}

const tabs = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'usuarios', label: 'Usuários' },
] as const

type TabId = (typeof tabs)[number]['id']

export function ConfigTabs({ empresa, configuracao, usuarios }: Props) {
  const [active, setActive] = useState<TabId>('empresa')

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active === t.id ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActive(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'empresa' ? (
        <EmpresaForm empresa={empresa} configuracao={configuracao} />
      ) : (
        <UsuariosManager usuarios={usuarios} />
      )}
    </div>
  )
}
