import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/queries/use-users'
import { useManagers } from '@/hooks/queries/use-managers'
import { useAssignLead } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { STAFF_ROLES } from '@/lib/constants'
import { LeadIntakeChannel, UserRole, type Lead } from '@/types'

export function AssignLeadModal({
  open,
  onClose,
  lead,
}: {
  open: boolean
  onClose: () => void
  lead: Lead | null
}) {
  const [selected, setSelected] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  // Hot leads from platforms are a Manager's to follow up — the backend only
  // lets them go to a Manager, so only Managers are offered.
  const isHot = lead?.intakeChannel === LeadIntakeChannel.PLATFORM
  const isAdmin = currentUser?.role === UserRole.ADMIN
  const { data: users } = useUsers(open && !isHot)
  // A Manager's user list only holds their own team, so they can take a hot lead themselves.
  const { data: managers } = useManagers(open && isHot && isAdmin)
  const assign = useAssignLead()

  if (!lead) return null

  const candidates = isHot
    ? isAdmin
      ? (managers ?? []).filter((m) => m.isActive).map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName} (Manager)` }))
      : currentUser?.role === UserRole.MANAGER
        ? [{ id: currentUser.id, label: `${currentUser.firstName} ${currentUser.lastName} (you)` }]
        : []
    : (users ?? [])
        .filter((u) => STAFF_ROLES.includes(u.role) && u.isActive)
        .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.role})` }))

  return (
    <Modal open={open} onClose={onClose} title="Assign lead" subtitle={lead.fullName} size="sm">
      <div className="flex flex-col gap-4">
        {isHot && (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
            This is a hot lead from a platform — it’s followed up by a manager, not presales.
          </p>
        )}
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{isHot ? 'Select a manager…' : 'Select a team member…'}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            loading={assign.isPending}
            onClick={() => assign.mutate({ id: lead.id, assignedToId: selected }, { onSuccess: onClose })}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  )
}
