'use client'

import { useEffect } from 'react'

/**
 * Dispara window.print() automaticamente após a página carregar.
 * Renderiza invisível — o botão "Imprimir" na página tem classe `no-print`
 * e desaparece quando a janela de impressão é acionada.
 */
export function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 600)
    return () => clearTimeout(id)
  }, [])

  return null
}
