import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/input'
import { Select, Textarea } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useLogActivity } from '@/hooks/queries/use-activities'
import { useLeads } from '@/hooks/queries/use-leads'
import { EMPLOYEE_ACTIVITY_OPTIONS } from '@/lib/constants'
import { EmployeeActivityType } from '@/types'

export function LogActivityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logActivity = useLogActivity()
  const { data: leads } = useLeads()

  const [type, setType] = useState<EmployeeActivityType>(EmployeeActivityType.CALL)
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState('')

  useEffect(() => {
    if (open) {
      setType(EmployeeActivityType.CALL)
      setDescription('')
      setLeadId('')
    }
  }, [open])

  const isOther = type === EmployeeActivityType.OTHER

  return (
    <Modal open={open} onClose={onClose} title="Log today's activity" subtitle="Helps your Manager/Admin see what you've been up to" size="sm">
      <div className="flex flex-col gap-4">
        <Field label="What did you do?" required>
          <Select value={type} onChange={(e) => setType(e.target.value as EmployeeActivityType)}>
            {EMPLOYEE_ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Related lead" hint="Optional — link this activity to a specific lead">
          <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">No specific lead</option>
            {(leads ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullName}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description" required={isOther} hint={isOther ? undefined : 'Optional details'}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isOther ? 'Describe what you did' : 'e.g. Called Rahul about the Bandra listing'}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={logActivity.isPending}>
            Cancel
          </Button>
          <Button
            loading={logActivity.isPending}
            disabled={isOther && !description.trim()}
            onClick={() =>
              logActivity.mutate(
                { type, description: description.trim() || undefined, leadId: leadId || undefined },
                { onSuccess: onClose },
              )
            }
          >
            Log activity
          </Button>
        </div>
      </div>
    </Modal>
  )
}
