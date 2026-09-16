import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from './empty-state'
import { Spinner } from './spinner'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey,
  onRowClick,
}: {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-7" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400',
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-slate-50 last:border-0 hover:bg-brand-50/40',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-5 py-3.5 align-middle', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
