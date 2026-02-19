'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lookrent/ui'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginValues = z.infer<typeof loginSchema>

const recoverSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

const resetSchema = z
  .object({
    token: z.string().min(10, 'Token inválido'),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
      .regex(/[0-9]/, 'Inclua pelo menos um número.')
      .regex(/[^a-zA-Z0-9]/, 'Inclua pelo menos um símbolo.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação da senha não confere.',
    path: ['confirmPassword'],
  })

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [isPeding, setUseTransition] = useTransition();
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverToken, setRecoverToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoverStep, setRecoverStep] = useState<'request' | 'reset'>('request')
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [serverToken, setServerToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginValues) {
    setUseTransition( async () => {
      try {

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })
        
        if (!res.ok) {
          const body = await res.json()
          toast.error(body.message ?? 'Credenciais inválidas')
          return
        }
        
        router.push(callbackUrl)
        router.refresh()
      } catch {
        toast.error('Erro ao conectar com o servidor')
      } finally {
      }
    })
  }

  async function handleRequestToken() {
    const parsed = recoverSchema.safeParse({ email: recoverEmail })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'E-mail inválido')
      return
    }

    setRecoverLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoverEmail }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao solicitar token')
        return
      }
      if (json.resetToken) {
        setServerToken(json.resetToken)
        setRecoverToken(json.resetToken)
      } else {
        setServerToken(null)
      }
      setRecoverStep('reset')
      toast.success('Token gerado. Use para redefinir sua senha.')
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setRecoverLoading(false)
    }
  }

  async function handleResetPassword() {
    const parsed = resetSchema.safeParse({
      token: recoverToken,
      newPassword,
      confirmPassword,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }

    setResetLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoverToken, newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao redefinir senha')
        return
      }
      toast.success('Senha redefinida! Faça login.')
      setRecoverOpen(false)
      setRecoverStep('request')
      setRecoverEmail('')
      setRecoverToken('')
      setNewPassword('')
      setConfirmPassword('')
      setServerToken(null)
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setResetLoading(false)
    }
  }

  const strength = useMemo(() => {
    if (!newPassword) return null
    let score = 0
    if (newPassword.length >= 8) score += 1
    if (/[a-z]/.test(newPassword)) score += 1
    if (/[A-Z]/.test(newPassword)) score += 1
    if (/[0-9]/.test(newPassword)) score += 1
    if (/[^a-zA-Z0-9]/.test(newPassword)) score += 1
    if (score <= 2) return 'Fraca'
    if (score <= 4) return 'Boa'
    return 'Forte'
  }, [newPassword])

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue">
            <span className="text-sm font-bold text-white">LR</span>
          </div>
          <span className="text-xl font-bold text-brand-navy">LookRent</span>
        </div>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPeding}>
            {isPeding && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPeding ? 'Autenticando' : 'Entrar'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => setRecoverOpen(true)}
          >
            Esqueci minha senha
          </Button>
        </form>
      </CardContent>

      <Dialog open={recoverOpen} onOpenChange={setRecoverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Gere um token e redefina sua senha. (MVP sem envio de e-mail)
            </DialogDescription>
          </DialogHeader>

          {recoverStep === 'request' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="recover-email">E-mail</Label>
                <Input
                  id="recover-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleRequestToken}
                  disabled={recoverLoading}
                >
                  {recoverLoading ? 'Gerando...' : 'Gerar token'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              {serverToken && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs">
                  Token gerado: <span className="font-mono">{serverToken}</span>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="recover-token">Token</Label>
                <Input
                  id="recover-token"
                  type="text"
                  placeholder="Cole o token aqui"
                  value={recoverToken}
                  onChange={(e) => setRecoverToken(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirmar</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sugestão: mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.
                {strength ? ` Força: ${strength}.` : ''}
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRecoverStep('request')}
                >
                  Voltar
                </Button>
                <Button type="button" onClick={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? 'Redefinindo...' : 'Redefinir senha'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
