'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@lookrent/ui'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Algo deu errado</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {process.env.NODE_ENV === 'development'
            ? (error.message ?? 'Ocorreu um erro inesperado ao carregar esta página.')
            : 'Ocorreu um erro inesperado ao carregar esta página.'}
        </p>
      </div>
      <Button variant="outline" className="gap-2" onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
