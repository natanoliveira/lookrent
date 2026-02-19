import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { getSession } from '@/lib/session'
import { LoginForm } from '@/components/auth/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Login' }

const diferenciais = [
  'Controle inteligente de estoque por período',
  'Gestão de inadimplência com alertas automáticos',
  'Dashboard financeiro estratégico em tempo real',
  'Impressão de contratos com QR Code integrado',
  'Multi-filial com isolamento de dados por empresa',
  'Conciliação financeira automatizada',
]

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      {/* Left — Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right — Presentation */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center bg-brand-navy px-12 py-16">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-3">
            Gestão de locação simples e eficiente
          </h2>
          <p className="text-brand-gray mb-10 text-lg">
            Controle seus aluguéis, clientes e estoque em um único sistema moderno e seguro.
          </p>

          <ul className="space-y-4">
            {diferenciais.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-purple mt-0.5 shrink-0" />
                <span className="text-brand-gray text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/70 text-sm italic">
              &ldquo;Reduziu o tempo de registro de contratos em 70% e acabou com as perdas por inadimplência.&rdquo;
            </p>
            <p className="text-white/50 text-xs mt-2">— Cliente LookRent</p>
          </div>
        </div>
      </div>
    </div>
  )
}
