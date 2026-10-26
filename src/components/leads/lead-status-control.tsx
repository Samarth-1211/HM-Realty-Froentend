import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { useUpdateLeadStatus } from '@/hooks/queries/use-leads'
import { formatEnumLabel } from '@/lib/utils'
import { LeadProgressStage, LeadStatus, type Lead } from '@/types'
import { LeadProgressStageModal } from './lead-progress-stage-modal'
import { SiteVisitDoneModal } from './site-visit-done-modal'

const STATUS_OPTIONS = Object.values(LeadStatus)

export function LeadStatusControl({ lead }: { lead: Lead }) {
  const updateStatus = useUpdateLeadStatus()
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [visitFormOpen, setVisitFormOpen] = useState(false)

  const handleChange = (status: LeadStatus) => {
    if (status === LeadStatus.IN_PROGRESS) {
      setStageModalOpen(true)
      return
    }
    updateStatus.mutate({ id: lead.id, status })
  }

  const handleConfirmStage = (progressStage: LeadProgressStage, progressStageNote?: string, siteVisitAt?: string) => {
    // "Site visit done" is saved by the visit form, together with its photo.
    if (progressStage === LeadProgressStage.SITE_VISIT_DONE) {
      setStageModalOpen(false)
      setVisitFormOpen(true)
      return
    }
    updateStatus.mutate(
      { id: lead.id, status: LeadStatus.IN_PROGRESS, progressStage, progressStageNote, siteVisitAt },
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
        initialVisitAt={lead.siteVisitDate}
      />
      <SiteVisitDoneModal lead={lead} open={visitFormOpen} onClose={() => setVisitFormOpen(false)} />
    </>
  )
}
