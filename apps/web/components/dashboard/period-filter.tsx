'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@lookrent/utils'

const options = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '180', label: '180 dias' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
] as const

export type PeriodValue = (typeof options)[number]['value']

export function PeriodFilter({
  value,
  onChange,
  isPending,
}: {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  isPending: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border bg-muted p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={isPending}
          className={cn(
            'rounded-md px-3 py-2 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-background shadow'
              : 'text-muted-foreground hover:text-foreground',
            isPending && 'opacity-60',
          )}
        >
          {opt.label}
        </button>
      ))}
      </div>
      {/* {isPending && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </span>
      )} */}
    </div>
  )
}
