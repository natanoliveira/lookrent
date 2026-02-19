/**
 * Sliding-window in-memory rate limiter.
 * Para ambientes multi-instância, substitua por Redis (@upstash/ratelimit).
 */

interface Entry {
  count: number
  reset: number // timestamp (ms) do fim da janela
}

const store = new Map<string, Entry>()

// Limpeza automática a cada 5 min para evitar vazamento de memória
const timer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key)
  }
}, 5 * 60 * 1000)

// Não impedir que o processo Node encerre normalmente
if (typeof timer === 'object' && 'unref' in timer) timer.unref()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number // segundos até liberar novamente
}

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.reset - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 }
}
