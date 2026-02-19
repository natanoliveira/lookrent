import { Skeleton } from '@lookrent/ui'

interface TableSkeletonProps {
  rows?: number
  cols?: number
  hasHeader?: boolean
}

export function TableSkeleton({ rows = 8, cols = 5, hasHeader = true }: TableSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {hasHeader && (
          <div className="border-b px-4 py-4">
            <Skeleton className="h-5 w-36" />
          </div>
        )}
        <div className="divide-y">
          {/* Table header row */}
          <div className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-4 px-4 py-4">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <Skeleton
                  key={colIdx}
                  className={`h-4 flex-1 ${colIdx === 0 ? 'max-w-[180px]' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-8 rounded-md" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
