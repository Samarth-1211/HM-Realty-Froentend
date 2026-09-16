import { LEAD_STATUS_COLORS, ORG_STATUS_COLORS } from '@/lib/constants'
import { formatEnumLabel } from '@/lib/utils'
import { StatusPill } from '@/components/ui/badge'

export function LeadStatusBadge({ status }: { status: string }) {
  return <StatusPill label={formatEnumLabel(status)} className={LEAD_STATUS_COLORS[status] ?? ''} />
}

export function OrgStatusBadge({ status }: { status: string }) {
  return <StatusPill label={formatEnumLabel(status)} className={ORG_STATUS_COLORS[status] ?? ''} />
}
