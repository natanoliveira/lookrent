import test from 'node:test'
import assert from 'node:assert/strict'
import { permissionAction } from '../api-guard'
import { hasPermission } from '../rbac'

test('permissionAction maps resource + scope to an Action', () => {
  assert.equal(permissionAction('produtos', 'manage'), 'manage:produtos')
  assert.equal(permissionAction('clientes', 'view'), 'view:clientes')
})

test('hasPermission enforces role permissions', () => {
  const manageProdutos = permissionAction('produtos', 'manage')
  const viewClientes = permissionAction('clientes', 'view')

  assert.equal(hasPermission('ADMIN', manageProdutos), true)
  assert.equal(hasPermission('ATENDENTE', manageProdutos), false)
  assert.equal(hasPermission('ATENDENTE', viewClientes), true)
})
