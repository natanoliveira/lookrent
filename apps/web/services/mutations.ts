/**
 * Funções de mutação (POST) — seguras para Client Components.
 * Não importam nenhum módulo server-only (next/headers, prisma, etc.).
 */

// ── Clientes ──────────────────────────────────────────────────────────────────

export interface CreateClienteData {
  nomeCompleto: string
  cpf: string
  telefone: string
  email?: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep?: string
}

export async function createCliente(
  data: CreateClienteData,
): Promise<{ success: true; id: string } | { error: string }> {
  try {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao cadastrar cliente' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Produtos ──────────────────────────────────────────────────────────────────

export interface CreateProdutoData {
  nome: string
  referencia?: string
  codigoInterno?: string
  tamanho?: string
  quantidadeTotal: number
  valorLocacao: number
  valorCusto?: number
}

export async function createProduto(
  data: CreateProdutoData,
): Promise<{ success: true; id: string } | { error: string }> {
  try {
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao cadastrar produto' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Clientes (update) ─────────────────────────────────────────────────────────

export interface UpdateClienteData {
  nomeCompleto?: string
  telefone?: string
  email?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  ativo?: boolean
  removido?: boolean
}

export async function updateCliente(
  id: string,
  data: UpdateClienteData,
): Promise<{ success: true } | { error: string }> {
  try {
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao atualizar cliente' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Produtos (update) ─────────────────────────────────────────────────────────

export interface UpdateProdutoData {
  nome?: string
  referencia?: string
  codigoInterno?: string
  tamanho?: string
  quantidadeTotal?: number
  valorLocacao?: number
  valorCusto?: number
  ativo?: boolean
  removido?: boolean
}

export async function updateProduto(
  id: string,
  data: UpdateProdutoData,
): Promise<{ success: true } | { error: string }> {
  try {
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao atualizar produto' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Usuários ─────────────────────────────────────────────────────────────────

export interface CreateUsuarioData {
  nome: string
  email: string
  senha: string
  role: 'ADMIN' | 'GERENTE' | 'ATENDENTE'
}

export async function createUsuario(
  data: CreateUsuarioData,
): Promise<{ success: true; id: string } | { error: string }> {
  try {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao criar usuário' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

export interface UpdateUsuarioData {
  nome?: string
  email?: string
  role?: 'ADMIN' | 'GERENTE' | 'ATENDENTE'
  ativo?: boolean
}

export async function updateUsuario(
  id: string,
  data: UpdateUsuarioData,
): Promise<{ success: true } | { error: string }> {
  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao atualizar usuário' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Perfil ──────────────────────────────────────────────────────────────────

export interface UpdateProfileData {
  nome?: string
  email?: string
  newPassword?: string
}

export async function updateProfile(
  data: UpdateProfileData,
): Promise<{ success: true } | { error: string }> {
  try {
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao atualizar perfil' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

export async function uploadAvatar(
  file: File,
): Promise<{ success: true; avatarUrl: string } | { error: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/me/avatar', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao enviar avatar' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Contratos ─────────────────────────────────────────────────────────────────

export interface CreateContratoData {
  clienteId: string
  dataInicio: string
  dataFim: string
  observacoes?: string
  itens: Array<{ produtoId: string; quantidade: number }>
}

export interface UpdateContratoData {
  status?: 'ATIVO' | 'FINALIZADO' | 'PENDENTE' | 'CANCELADO'
  dataFim?: string
  observacoes?: string
}

export async function updateContrato(
  id: string,
  data: UpdateContratoData,
): Promise<{ success: true } | { error: string }> {
  try {
    const res = await fetch(`/api/contratos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao atualizar contrato' }
    return { success: true }
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

export async function createContrato(
  data: CreateContratoData,
): Promise<{ success: true; numeroContrato: string } | { error: string }> {
  try {
    const res = await fetch('/api/contratos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao criar contrato' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}

// ── Pagamentos ───────────────────────────────────────────────────────────────

export interface PagamentoItemInput {
  formaPagamentoId: string
  valor: number
  parcelas?: number
}

export async function pagarContrato(
  contratoId: string,
  pagamentos: PagamentoItemInput[],
): Promise<
  | { success: true; contaReceber: { valorOriginal: number; valorPago: number; status: string } }
  | { error: string }
> {
  try {
    const res = await fetch(`/api/contratos/${contratoId}/pagamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagamentos }),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error ?? 'Erro ao registrar pagamento' }
    return json
  } catch {
    return { error: 'Erro de conexão. Verifique sua rede e tente novamente.' }
  }
}
