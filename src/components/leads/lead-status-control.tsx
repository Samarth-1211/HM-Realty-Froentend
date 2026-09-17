import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { useUpdateLeadStatus } from '@/hooks/queries/use-leads'
import { formatEnumLabel } from '@/lib/utils'
import { LeadStatus, type Lead, type LeadProgressStage } from '@/types'
import { LeadProgressStageModal } from './lead-progress-stage-modal'

const STATUS_OPTIONS = Object.values(LeadStatus)

export function LeadStatusControl({ lead }: { lead: Lead }) {
  const updateStatus = useUpdateLeadStatus()
  const [stageModalOpen, setStageModalOpen] = useState(false)

  const handleChange = (status: LeadStatus) => {
    if (status === LeadStatus.IN_PROGRESS) {
      setStageModalOpen(true)
      return
    }
    updateStatus.mutate({ id: lead.id, status })
  }

  const handleConfirmStage = (progressStage: LeadProgressStage, progressStageNote?: string) => {
    updateStatus.mutate(
      { id: lead.id, status: LeadStatus.IN_PROGRESS, progressStage, progressStageNote },
      { onSuccess: () => setStageModalOpen(false) },
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={lead.status}
          disabled={updateStatus.isPending}
          onChange={(e) => handleChange(e.target.value as LeadStatus)}
          className="max-w-[170px]"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </Select>
        {lead.status === LeadStatus.IN_PROGRESS && (
          <button
            type="button"
            onClick={() => setStageModalOpen(true)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Update stage
          </button>
        )}
      </div>
      <LeadProgressStageModal
        open={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        onConfirm={handleConfirmStage}
        loading={updateStatus.isPending}
        initialStage={lead.status === LeadStatus.IN_PROGRESS ? lead.progressStage : undefined}
        initialNote={lead.status === LeadStatus.IN_PROGRESS ? lead.progressStageNote : undefined}
      />
    </>
  )
}
