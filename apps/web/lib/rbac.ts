export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'ATENDENTE'

export type Action =
  | 'manage:empresa'
  | 'manage:usuarios'
  | 'manage:produtos'
  | 'view:produtos'
  | 'manage:clientes'
  | 'view:clientes'
  | 'manage:contratos'
  | 'view:contratos'
  | 'manage:pagamentos'
  | 'view:pagamentos'
  | 'view:financeiro'
  | 'manage:configuracoes'

const permissions: Record<Role, Action[]> = {
  SUPER_ADMIN: [
    'manage:empresa',
    'manage:usuarios',
    'manage:produtos',
    'view:produtos',
    'manage:clientes',
    'view:clientes',
    'manage:contratos',
    'view:contratos',
    'manage:pagamentos',
    'view:pagamentos',
    'view:financeiro',
    'manage:configuracoes',
  ],
  ADMIN: [
    'manage:empresa',
    'manage:usuarios',
    'manage:produtos',
    'view:produtos',
    'manage:clientes',
    'view:clientes',
    'manage:contratos',
    'view:contratos',
    'manage:pagamentos',
    'view:pagamentos',
    'view:financeiro',
    'manage:configuracoes',
  ],
  GERENTE: [
    'manage:produtos',
    'view:produtos',
    'manage:clientes',
    'view:clientes',
    'manage:contratos',
    'view:contratos',
    'manage:pagamentos',
    'view:pagamentos',
    'view:financeiro',
  ],
  ATENDENTE: [
    'view:produtos',
    'manage:clientes',
    'view:clientes',
    'manage:contratos',
    'view:contratos',
    'view:pagamentos',
  ],
}

export function hasPermission(role: Role, action: Action): boolean {
  return permissions[role]?.includes(action) ?? false
}

export function getPermissions(role: Role): Action[] {
  return permissions[role] ?? []
}
