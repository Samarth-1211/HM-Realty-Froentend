import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * "Lead date … to …" for lead lists: the days leads were received between.
 * Each end is a YYYY-MM-DD day ('' = open-ended); read the pair with
 * `matchesLeadDateRange` (lib/lead-channel).
 */
export function LeadDateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Lead date</span>
      <Input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
        aria-label="Lead date from"
        title="Show leads received on or after this date"
        className="w-[150px]"
      />
      <span className="text-sm text-slate-400">to</span>
      <Input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="Lead date to"
        title="Show leads received on or before this date"
        className="w-[150px]"
      />
      {(from || to) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ from: '', to: '' })} title="Clear the lead date range">
          <X className="size-4" />
          Clear dates
        </Button>
      )}
    </div>
  )
}
