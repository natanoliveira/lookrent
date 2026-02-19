export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += parseInt(digits[i]) * (len + 1 - i)
    }
    const rem = (sum * 10) % 11
    return rem === 10 || rem === 11 ? 0 : rem
  }

  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10])
}

export function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false

  const calcDigit = (d: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + parseInt(d[i]) * w, 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  return (
    calcDigit(digits, w1) === parseInt(digits[12]) &&
    calcDigit(digits, w2) === parseInt(digits[13])
  )
}

const COMMON_EMAIL_DOMAINS = [
  // Global
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'proton.me',
  'protonmail.com',
  // BR
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'ig.com.br',
  'globo.com',
  'globomail.com',
  'r7.com',
  'zipmail.com.br',
  'superig.com.br',
  'outlook.com.br',
  'hotmail.com.br',
  'gmail.com.br',
  'yahoo.com.br',
]

const DOMAIN_TYPO_MAP: Record<string, string> = {
  gemail: 'gmail.com',
  gmai: 'gmail.com',
  gmal: 'gmail.com',
  gmial: 'gmail.com',
  gmil: 'gmail.com',
  gmail: 'gmail.com',
  hotmal: 'hotmail.com',
  hotmial: 'hotmail.com',
  hotmai: 'hotmail.com',
  hotmail: 'hotmail.com',
  otlook: 'outlook.com',
  outlok: 'outlook.com',
  outlook: 'outlook.com',
  outra: 'outlook.com',
  outrolook: 'outlook.com',
  yaho: 'yahoo.com',
  yhoo: 'yahoo.com',
  yahho: 'yahoo.com',
  iclud: 'icloud.com',
  icludm: 'icloud.com',
  icloud: 'icloud.com',
  bol: 'bol.com.br',
  uol: 'uol.com.br',
  terra: 'terra.com.br',
  globo: 'globo.com',
}

export interface EmailValidationResult {
  isValid: boolean
  normalized: string
  suggestion?: string
  reason?: string
}

export function validateAndNormalizeEmail(
  email: string,
  options: { strict?: boolean } = {},
): EmailValidationResult {
  const trimmed = email.trim()
  if (!trimmed) return { isValid: true, normalized: '' }

  const [local, domainRaw] = trimmed.split('@')
  if (!local || !domainRaw) {
    return { isValid: false, normalized: trimmed, reason: 'Formato de e-mail inválido' }
  }

  const domain = domainRaw.toLowerCase()
  const domainKey = domain.split('.')[0]
  const mapped = DOMAIN_TYPO_MAP[domain] ?? DOMAIN_TYPO_MAP[domainKey]

  if (mapped) {
    const normalized = `${local}@${mapped}`
    return {
      isValid: true,
      normalized,
      suggestion: normalized,
      reason: 'Domínio corrigido automaticamente',
    }
  }

  const isCommon = COMMON_EMAIL_DOMAINS.includes(domain)
  if (!isCommon) {
    return {
      isValid: true,
      normalized: trimmed,
      reason: 'Domínio pouco provável. Verifique se está correto.',
    }
  }

  return { isValid: true, normalized: trimmed }
}
