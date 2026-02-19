import type { NextConfig } from 'next'

const securityHeaders = [
  // Impede MIME-sniffing do Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Bloqueia carregamento em iframes externos (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Proteção XSS nativa do browser (legacy, mas inofensivo)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Controla informações enviadas no cabeçalho Referer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desabilita features de browser desnecessárias
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Força HTTPS por 1 ano (HSTS) — ativo apenas em produção
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ['@lookrent/ui', '@lookrent/utils', '@lookrent/db'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.neon.tech',
      },
    ],
  },
}

export default nextConfig
