import { Select } from '@/components/ui/select'
import { useUpdateLeadStatus } from '@/hooks/queries/use-leads'
import { formatEnumLabel } from '@/lib/utils'
import { LeadStatus, type Lead } from '@/types'

const STATUS_OPTIONS = Object.values(LeadStatus)

export function LeadStatusControl({ lead }: { lead: Lead }) {
  const updateStatus = useUpdateLeadStatus()

  return (
    <Select
      value={lead.status}
      disabled={updateStatus.isPending}
      onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value as LeadStatus })}
      className="max-w-[170px]"
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {formatEnumLabel(status)}
        </option>
      ))}
    </Select>
  )
}
