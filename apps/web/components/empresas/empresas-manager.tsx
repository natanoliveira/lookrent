'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lookrent/ui'
import { toast } from 'sonner'
import type { EmpresaDetalhe } from '@/services/empresas.service'

type EmpresaForm = {
  id?: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  logo: string
  plano: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'
  statusAssinatura: 'ATIVA' | 'TRIAL' | 'INADIMPLENTE' | 'CANCELADA' | 'PAUSADA'
  trialAte: string
  assinaturaAte: string
  limiteUsuarios: number
  limiteContratos: number
  ativo: boolean
}

const emptyEmpresa: EmpresaForm = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  logo: '',
  plano: 'BASICO',
  statusAssinatura: 'ATIVA',
  trialAte: '',
  assinaturaAte: '',
  limiteUsuarios: 5,
  limiteContratos: 100,
  ativo: true,
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function EmpresasManager({ empresas }: { empresas: EmpresaDetalhe[] }) {
  const [data, setData] = useState(empresas)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EmpresaForm>(emptyEmpresa)
  const [superAdminOpen, setSuperAdminOpen] = useState(false)
  const [superAdminLoading, setSuperAdminLoading] = useState(false)
  const [superAdminForm, setSuperAdminForm] = useState({
    nome: '',
    email: '',
    password: '',
  })
  const [search, setSearch] = useState('')
  const [filterPlano, setFilterPlano] = useState<
    'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE' | 'ALL'
  >('ALL')
  const [filterStatus, setFilterStatus] = useState<
    'ATIVA' | 'TRIAL' | 'INADIMPLENTE' | 'CANCELADA' | 'PAUSADA' | 'ALL'
  >('ALL')

  const isEditing = Boolean(form.id)

  const planos = useMemo(() => ['BASICO', 'PROFISSIONAL', 'ENTERPRISE'] as const, [])
  const statusList = useMemo(
    () => ['ATIVA', 'TRIAL', 'INADIMPLENTE', 'CANCELADA', 'PAUSADA'] as const,
    [],
  )
  const filtered = useMemo(() => {
    return data
      .filter((empresa) => {
        const term = search.trim().toLowerCase()
        if (!term) return true
        return (
          empresa.nome.toLowerCase().includes(term) ||
          empresa.email.toLowerCase().includes(term) ||
          empresa.cnpj.toLowerCase().includes(term)
        )
      })
      .filter((empresa) => (filterPlano === 'ALL' ? true : empresa.plano === filterPlano))
      .filter((empresa) =>
        filterStatus === 'ALL' ? true : empresa.statusAssinatura === filterStatus,
      )
  }, [data, filterPlano, filterStatus, search])

  function openCreate() {
    setForm({ ...emptyEmpresa })
    setOpen(true)
  }

  function openEdit(empresa: EmpresaDetalhe) {
    setForm({
      id: empresa.id,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      logradouro: empresa.logradouro,
      numero: empresa.numero,
      complemento: empresa.complemento ?? '',
      bairro: empresa.bairro,
      cidade: empresa.cidade,
      estado: empresa.estado,
      cep: empresa.cep,
      logo: empresa.logo ?? '',
      plano: empresa.plano,
      statusAssinatura: empresa.statusAssinatura,
      trialAte: toDateInput(empresa.trialAte),
      assinaturaAte: toDateInput(empresa.assinaturaAte),
      limiteUsuarios: empresa.limiteUsuarios,
      limiteContratos: empresa.limiteContratos,
      ativo: empresa.ativo,
    })
    setOpen(true)
  }

  function handleChange<K extends keyof EmpresaForm>(key: K, value: EmpresaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSuperAdminChange(
    key: 'nome' | 'email' | 'password',
    value: string,
  ) {
    setSuperAdminForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    startTransition(async () => {
      const payload = {
        ...form,
        complemento: form.complemento || null,
        logo: form.logo || null,
        trialAte: form.trialAte ? new Date(form.trialAte).toISOString() : null,
        assinaturaAte: form.assinaturaAte ? new Date(form.assinaturaAte).toISOString() : null,
      }

      try {
        const res = await fetch(form.id ? `/api/empresas/${form.id}` : '/api/empresas', {
          method: form.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error ?? 'Erro ao salvar empresa')
          return
        }

        if (form.id) {
          setData((prev) => prev.map((item) => (item.id === json.empresa.id ? json.empresa : item)))
        } else {
          setData((prev) => [json.empresa, ...prev])
        }
        setOpen(false)
        toast.success('Empresa salva!')
      } catch {
        toast.error('Erro de conexão. Verifique sua rede.')
      }
    })
  }

  async function handleCreateSuperAdmin() {
    setSuperAdminLoading(true)
    try {
      const res = await fetch('/api/super-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superAdminForm),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar super admin')
        return
      }
      toast.success('Super admin criado!')
      setSuperAdminOpen(false)
      setSuperAdminForm({ nome: '', email: '', password: '' })
    } catch {
      toast.error('Erro de conexão. Verifique sua rede.')
    } finally {
      setSuperAdminLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Total de empresas: {data.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setSuperAdminOpen(true)}>
            Novo super admin
          </Button>
          <Button type="button" onClick={openCreate}>
            Nova empresa
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome, e-mail ou CNPJ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select
          value={filterPlano}
          onValueChange={(value) => setFilterPlano(value as typeof filterPlano)}
        >
          <SelectTrigger className="w-full sm:max-w-[180px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="BASICO">Básico</SelectItem>
            <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}
        >
          <SelectTrigger className="w-full sm:max-w-[200px]">
            <SelectValue placeholder="Status assinatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ATIVA">Ativa</SelectItem>
            <SelectItem value="TRIAL">Trial</SelectItem>
            <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
            <SelectItem value="PAUSADA">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <div className="font-medium">{empresa.nome}</div>
                  <div className="text-xs text-muted-foreground">{empresa.email}</div>
                </TableCell>
                <TableCell>{empresa.plano}</TableCell>
                <TableCell>{empresa.statusAssinatura}</TableCell>
                <TableCell>
                  {empresa.limiteUsuarios} usuários / {empresa.limiteContratos} contratos
                </TableCell>
                <TableCell>{empresa.ativo ? 'Sim' : 'Não'}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(empresa)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma empresa cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={superAdminOpen} onOpenChange={setSuperAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo super admin</DialogTitle>
            <DialogDescription>
              Crie um usuário com acesso global ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={superAdminForm.nome}
                onChange={(e) => handleSuperAdminChange('nome', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={superAdminForm.email}
                onChange={(e) => handleSuperAdminChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Senha</Label>
              <Input
                type="password"
                value={superAdminForm.password}
                onChange={(e) => handleSuperAdminChange('password', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuperAdminOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateSuperAdmin} disabled={superAdminLoading}>
              {superAdminLoading ? 'Criando...' : 'Criar super admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
            <DialogDescription>
              Preencha os dados e controles de assinatura.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => handleChange('telefone', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Logradouro</Label>
              <Input
                value={form.logradouro}
                onChange={(e) => handleChange('logradouro', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Número</Label>
              <Input value={form.numero} onChange={(e) => handleChange('numero', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Complemento</Label>
              <Input
                value={form.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => handleChange('bairro', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Input value={form.estado} onChange={(e) => handleChange('estado', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={(e) => handleChange('cep', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Plano</Label>
              <Select value={form.plano} onValueChange={(value) => handleChange('plano', value as EmpresaForm['plano'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano} value={plano}>
                      {plano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status assinatura</Label>
              <Select
                value={form.statusAssinatura}
                onValueChange={(value) =>
                  handleChange('statusAssinatura', value as EmpresaForm['statusAssinatura'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusList.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Trial até</Label>
              <Input
                type="date"
                value={form.trialAte}
                onChange={(e) => handleChange('trialAte', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Assinatura até</Label>
              <Input
                type="date"
                value={form.assinaturaAte}
                onChange={(e) => handleChange('assinaturaAte', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Limite usuários</Label>
              <Input
                type="number"
                value={form.limiteUsuarios}
                onChange={(e) => handleChange('limiteUsuarios', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Limite contratos</Label>
              <Input
                type="number"
                value={form.limiteContratos}
                onChange={(e) => handleChange('limiteContratos', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Ativo</Label>
              <Select
                value={form.ativo ? 'true' : 'false'}
                onValueChange={(value) => handleChange('ativo', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
