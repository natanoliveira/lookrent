/**
 * Remove todos os caracteres não numéricos de uma string.
 * Ideal para sanitizar CPF, CNPJ, telefone, CEP antes de persistir no banco.
 *
 * @example
 * onlyDigits('123.456.789-00') // '12345678900'
 * onlyDigits('(11) 98765-4321') // '11987654321'
 * onlyDigits('01310-100')       // '01310100'
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Máscara progressiva de CPF: 000.000.000-00
 * Aplica a formatação conforme o usuário digita; limita a 11 dígitos.
 */
export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Máscara progressiva de telefone: (00) 0000-0000 ou (00) 00000-0000
 * Detecta automaticamente fixo (10 dígitos) ou celular (11 dígitos).
 */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/**
 * Máscara progressiva de CEP: 00000-000
 * Limita a 8 dígitos.
 */
export function maskCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/**
 * Máscara progressiva de CNPJ: 00.000.000/0000-00
 * Aplica a formatação conforme o usuário digita; limita a 14 dígitos.
 */
export function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
