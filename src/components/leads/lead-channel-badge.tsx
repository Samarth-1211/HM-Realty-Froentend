import { FileSpreadsheet, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { uploadedByLabel } from '@/lib/lead-channel'
import { LeadIntakeChannel, type Lead } from '@/types'

/**
 * Flags the two kinds of lead that are handled differently: hot leads from
 * portals/ads (followed up by a Manager) and leads an Admin provided in an
 * Excel upload. Renders nothing for any other lead.
 */
export function LeadChannelBadge({ lead }: { lead: Pick<Lead, 'intakeChannel' | 'importBatch'> }) {
  if (lead.intakeChannel === LeadIntakeChannel.PLATFORM) {
    return (
      <Badge className="whitespace-nowrap bg-orange-50 text-orange-700 ring-orange-600/20">
        <Flame className="size-3" />
        Hot lead
      </Badge>
    )
  }

  if (lead.intakeChannel === LeadIntakeChannel.BULK_UPLOAD) {
    return (
      <span title={`Provided by Admin ${uploadedByLabel(lead)}`}>
        <Badge className="whitespace-nowrap bg-violet-50 text-violet-700 ring-violet-600/20">
          <FileSpreadsheet className="size-3" />
          By Admin
        </Badge>
      </span>
    )
  }

  return null
}
