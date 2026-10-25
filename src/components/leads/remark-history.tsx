import { History } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { LeadActivityLog } from '@/types'

interface RemarkEntry {
  id: string
  /** null when the remarks were cleared. */
  text: string | null
  by: string
  at: string
}

/**
 * Every value a lead's remarks have had, newest first, read from the
 * follow-up saves in its activity log. Saves that left the remarks as they
 * were are skipped.
 */
export function getRemarkHistory(logs: LeadActivityLog[]): RemarkEntry[] {
  const entries: RemarkEntry[] = []
  let previous: string | null = null
  for (const log of [...logs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (!log.metadata || !Object.hasOwn(log.metadata, 'remarks')) continue
    const raw = log.metadata.remarks
    const text = typeof raw === 'string' && raw.trim() ? raw.trim() : null
    if (text === previous) continue
    previous = text
    entries.push({
      id: log.id,
      text,
      by: log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}`.trim() : 'Someone',
      at: log.createdAt,
    })
  }
  return entries.reverse()
}

/** The lead's remarks over time — who wrote each one and when — with the current one marked. */
export function RemarkHistory({ logs, currentRemarks }: { logs: LeadActivityLog[]; currentRemarks: string | null }) {
  const entries = getRemarkHistory(logs)
  if (entries.length === 0) return null

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <History className="size-3.5" />
        Remark history
      </p>
      <ol className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
        {entries.map((entry, i) => {
          const isCurrent = i === 0 && entry.text !== null && entry.text === currentRemarks?.trim()
          return (
            <li
              key={entry.id}
              className={isCurrent ? 'rounded-xl bg-brand-50 p-3 ring-1 ring-inset ring-brand-100' : 'rounded-xl bg-slate-50 p-3'}
            >
              {entry.text ? (
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{entry.text}</p>
              ) : (
                <p className="text-sm italic text-slate-400">Remarks cleared</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {entry.by} · {formatDateTime(entry.at)}
                {isCurrent && <span className="ml-1.5 font-medium text-brand-600">Current</span>}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
