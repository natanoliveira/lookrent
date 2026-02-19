import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs/promises'
import { prisma } from '@lookrent/db'
import { apiGuard } from '@/lib/api-guard'

export const runtime = 'nodejs'

const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req)
  if (!guard.ok) return guard.response

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES.get(file.type)
  if (!ext) {
    return NextResponse.json({ error: 'Formato de imagem inválido.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${guard.session.sub}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
  const filePath = path.join(uploadDir, fileName)

  try {
    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(filePath, buffer)

    const avatarUrl = `/uploads/avatars/${fileName}`
    await prisma.usuario.update({
      where: { id: guard.session.sub, empresaId: guard.session.empresaId },
      data: { avatarUrl },
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (err) {
    console.error('[POST /api/me/avatar]', err)
    return NextResponse.json({ error: 'Erro ao salvar avatar.' }, { status: 500 })
  }
}
