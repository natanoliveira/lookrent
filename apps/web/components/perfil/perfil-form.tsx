'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { uploadAvatar, updateProfile } from '@/services/mutations'
import { validateAndNormalizeEmail } from '@lookrent/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@lookrent/ui'
import type { ProfileData } from '@/services/profile.service'

const schema = z
  .object({
    nome: z.string().min(2),
    email: z.string().email(),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
      .regex(/[0-9]/, 'Inclua pelo menos um número.')
      .regex(/[^a-zA-Z0-9]/, 'Inclua pelo menos um símbolo.')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.newPassword && !data.confirmPassword) return true
      return Boolean(data.newPassword && data.confirmPassword)
    },
    {
      message: 'Para alterar a senha, preencha nova senha e confirmação.',
      path: ['confirmPassword'],
    },
  )
  .refine((data) => {
    if (!data.newPassword && !data.confirmPassword) return true
    return data.newPassword === data.confirmPassword
  }, {
    message: 'A confirmação da senha não confere.',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function PerfilForm({ profile }: { profile: ProfileData }) {
  const PREVIEW_SIZE = 112
  const OUTPUT_SIZE = 512
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    resetField,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: profile.nome,
      email: profile.email,
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { onBlur: onEmailBlur, ...emailReg } = register('email')
  const newPassword = watch('newPassword') ?? ''

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const payload = {
        nome: data.nome,
        email: data.email,
        ...(data.newPassword
          ? {
              newPassword: data.newPassword,
            }
          : {}),
      }

      const result = await updateProfile(payload)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      resetField('newPassword')
      resetField('confirmPassword')
      toast.success('Perfil atualizado!')
    })
  }

  function handleAvatarChange(file: File | null) {
    if (!file) return
    setPendingFile(file)
    setPreviewScale(1)
    setPreviewPan({ x: 0, y: 0 })
    setIsAvatarModalOpen(true)
  }

  async function handleAvatarUpload() {
    if (!pendingFile) return
    setUploading(true)
    try {
      const cropped = await cropAvatarFile(pendingFile)
      const result = await uploadAvatar(cropped)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setAvatarUrl(result.avatarUrl)
      await fetch('/api/auth/refresh', { method: 'POST' })
      router.refresh()
      toast.success('Avatar atualizado!')
      setIsAvatarModalOpen(false)
      setPendingFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  function handleAvatarCancel() {
    setIsAvatarModalOpen(false)
    setPendingFile(null)
    setPreviewUrl(null)
    setPreviewScale(1)
    setPreviewPan({ x: 0, y: 0 })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile])

  const passwordStrength = useMemo(() => {
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

  function clampPan(value: number, max: number) {
    if (value > max) return max
    if (value < -max) return -max
    return value
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (previewScale <= 1) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current = { ...previewPan }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragStartRef.current || !panStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    const maxOffset = ((previewScale - 1) * 112) / 2
    setPreviewPan({
      x: clampPan(panStartRef.current.x + deltaX, maxOffset),
      y: clampPan(panStartRef.current.y + deltaY, maxOffset),
    })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    setIsDragging(false)
    dragStartRef.current = null
    panStartRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  async function cropAvatarFile(file: File): Promise<File> {
    const imageUrl = previewUrl ?? URL.createObjectURL(file)
    const image = new Image()
    image.src = imageUrl

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Erro ao carregar imagem.'))
    })

    const imgW = image.naturalWidth
    const imgH = image.naturalHeight
    const coverScale = Math.max(PREVIEW_SIZE / imgW, PREVIEW_SIZE / imgH)
    const finalScale = coverScale * previewScale
    const cropW = PREVIEW_SIZE / finalScale
    const cropH = PREVIEW_SIZE / finalScale
    const cropX = (0 - previewPan.x - PREVIEW_SIZE / 2) / finalScale + imgW / 2
    const cropY = (0 - previewPan.y - PREVIEW_SIZE / 2) / finalScale + imgH / 2

    const safeX = Math.max(0, Math.min(imgW - cropW, cropX))
    const safeY = Math.max(0, Math.min(imgH - cropH, cropY))

    const canvasSize = OUTPUT_SIZE
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas não disponível.')

    ctx.drawImage(
      image,
      safeX,
      safeY,
      cropW,
      cropH,
      0,
      0,
      canvasSize,
      canvasSize,
    )

    const mime =
      file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/jpeg'
        ? file.type
        : 'image/jpeg'
    const quality = mime === 'image/jpeg' ? 0.9 : undefined

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), mime, quality)
    })

    if (!blob) throw new Error('Falha ao gerar o recorte.')

    if (!previewUrl) URL.revokeObjectURL(imageUrl)

    const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    return new File([blob], file.name.replace(/\.[a-zA-Z0-9]+$/, `.${extension}`), {
      type: mime,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.nome} />}
          <AvatarFallback className="text-sm">
            {getInitials(profile.nome)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label className="text-xs font-medium">Avatar</Label>
          <div className="mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Escolher avatar
            </Button>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
              ref={fileInputRef}
              disabled={uploading}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG ou WEBP {uploading ? '• Enviando avatar...' : ''}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Nome</Label>
          <Input {...register('nome')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">E-mail</Label>
          <Input
            type="email"
            {...emailReg}
            onBlur={(e) => {
              onEmailBlur(e)
              const result = validateAndNormalizeEmail(e.target.value, { strict: false })
              if (result.suggestion && result.normalized !== e.target.value) {
                setValue('email', result.normalized, { shouldValidate: true })
                toast.message(`Corrigimos o domínio do e-mail para ${result.normalized}`)
              }
              if (!result.isValid) {
                toast.error(result.reason ?? 'E-mail inválido.')
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Alterar senha</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Nova senha
              </Label>
              <Input type="password" {...register('newPassword')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Confirmar
              </Label>
              <Input type="password" {...register('confirmPassword')} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Sugestão: mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.
            {passwordStrength ? ` Força: ${passwordStrength}.` : ''}
          </p>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <Dialog
        open={isAvatarModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleAvatarCancel()
          } else {
            setIsAvatarModalOpen(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-visualizar avatar</DialogTitle>
          <DialogDescription>
              Confira a imagem antes de enviar. Você pode aproximar para ver detalhes.
          </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <div
                className={`h-28 w-28 overflow-hidden rounded-full border ${
                  previewScale > 1 ? 'cursor-grab' : 'cursor-default'
                } ${isDragging ? 'cursor-grabbing' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {previewUrl ? (
                  // Only visual zoom; upload stays original.
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="h-full w-full object-cover transition-transform"
                    style={{
                      transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewScale})`,
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Avatar
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Aproximação</Label>
              <Input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={previewScale}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setPreviewScale(next)
                  if (next <= 1) setPreviewPan({ x: 0, y: 0 })
                }}
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(previewScale * 100)}%
              </p>
              {previewScale > 1 && (
                <p className="text-xs text-muted-foreground">
                  Arraste para ajustar o enquadramento.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewPan({ x: 0, y: 0 })}
                disabled={!previewUrl}
              >
                Centralizar
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleAvatarCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAvatarUpload} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar avatar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
