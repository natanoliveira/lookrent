import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function Loading() {
  return <TableSkeleton rows={10} cols={6} />
}
