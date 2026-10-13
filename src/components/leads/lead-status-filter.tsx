import { Select, type SelectProps } from '@/components/ui/select'
import { LEAD_PROGRESS_STAGE_LABELS } from '@/lib/constants'
import { formatEnumLabel } from '@/lib/utils'
import { LeadProgressStage, LeadStatus } from '@/types'

/**
 * Status dropdown for lead lists, with each in-progress stage listed under
 * "In Progress". Its value is read with `parseLeadStatusFilter` /
 * `matchesLeadStatusFilter` (lib/lead-channel).
 */
export function LeadStatusFilter({ allLabel, ...props }: Omit<SelectProps, 'children'> & { allLabel: string }) {
  return (
    <Select {...props}>
      <option value="">{allLabel}</option>
      {Object.values(LeadStatus).flatMap((s) => [
        <option key={s} value={s}>
          {formatEnumLabel(s)}
          {s === LeadStatus.IN_PROGRESS ? ' (any stage)' : ''}
        </option>,
        ...(s === LeadStatus.IN_PROGRESS
          ? Object.values(LeadProgressStage).map((stage) => (
              <option key={stage} value={`${s}:${stage}`}>
                {'\u00a0\u00a0\u00a0'}↳ {LEAD_PROGRESS_STAGE_LABELS[stage]}
              </option>
            ))
          : []),
      ])}
    </Select>
  )
}
