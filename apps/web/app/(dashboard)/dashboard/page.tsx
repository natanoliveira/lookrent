import { getSessionOrThrow } from '@/lib/session'
import { getDashboardData } from '@/services/dashboard.service'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

interface PageProps {
  searchParams: Promise<{ period?: '30' | '90' | '180' | 'month' | 'year' }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getSessionOrThrow()
  const { period } = await searchParams
  const data = await getDashboardData({ period })

  const userFirstName = session.nome.split(' ')[0]

  return (
    <DashboardView
      data={data}
      period={period ?? 'month'}
      userFirstName={userFirstName}
    />
  )
}
