import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from './empty-state'
import { Spinner } from './spinner'

export interface SheetColumn<T> {
  id: string
  header: string
  /** Raw value used for sorting and CSV export. */
  accessor: (row: T) => string | number | null | undefined
  /** Optional custom render; falls back to the accessor's value. */
  cell?: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Default true. */
  sortable?: boolean
  /** Freezes this column on horizontal scroll — use on one leading column. */
  sticky?: boolean
  minWidth?: string
}

/**
 * A dense, Excel-like table: sortable columns, a sticky header, an optional
 * frozen leading column, and zebra striping. Shared by the Lead Sheet,
 * Employee Report, and Team Performance views — pass the same `columns` to
 * `rowsForExport` (see lib/export-csv) to keep the on-screen and exported
 * columns in sync.
 */
export function SpreadsheetTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  maxHeight = '70vh',
}: {
  columns: SheetColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription?: string
  maxHeight?: string
}) {
  const [sortId, setSortId] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortId) return data
    const col = columns.find((c) => c.id === sortId)
    if (!col) return data

    const copy = [...data]
    copy.sort((a, b) => {
      const av = col.accessor(a)
      const bv = col.accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv))
    })
    if (sortDir === 'desc') copy.reverse()
    return copy
  }, [data, sortId, sortDir, columns])

  const toggleSort = (id: string) => {
    if (sortId !== id) {
      setSortId(id)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortId(null)
    }
  }

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
    <div className="overflow-auto rounded-xl border border-slate-200" style={{ maxHeight }}>
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                onClick={() => col.sortable !== false && toggleSort(col.id)}
                style={{ minWidth: col.minWidth }}
                className={cn(
                  'whitespace-nowrap border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0',
                  col.sortable !== false && 'cursor-pointer select-none hover:bg-slate-100',
                  col.sticky && 'sticky left-0 z-20',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable !== false &&
                    (sortId === col.id ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-slate-300" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const rowBg = i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
            return (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn('border-b border-slate-100 last:border-0', onRowClick && 'cursor-pointer hover:bg-brand-50/40')}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      'whitespace-nowrap border-r border-slate-100 px-3 py-2 text-slate-700 last:border-r-0',
                      rowBg,
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.sticky && 'sticky left-0 z-[1] shadow-[1px_0_0_0_theme(colors.slate.200)]',
                    )}
                  >
                    {col.cell ? col.cell(row) : (col.accessor(row) ?? '—')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Maps rows through the same column defs used on-screen, for CSV export. */
export function rowsForExport<T>(columns: SheetColumn<T>[], data: T[]): (string | number | null | undefined)[][] {
  return data.map((row) => columns.map((col) => col.accessor(row)))
}
