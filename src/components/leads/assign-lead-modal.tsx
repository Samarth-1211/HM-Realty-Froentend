import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/queries/use-users'
import { useManagers } from '@/hooks/queries/use-managers'
import { usePeerManagers } from '@/hooks/queries/use-team'
import { useAssignLead } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { STAFF_ROLES } from '@/lib/constants'
import { LeadIntakeChannel, UserRole, type Lead } from '@/types'

interface Candidate {
  id: string
  label: string
}

export function AssignLeadModal({
  open,
  onClose,
  lead,
  onHandedOver,
}: {
  open: boolean
  onClose: () => void
  lead: Lead | null
  /** A Manager passed the lead to another Manager — it's no longer theirs to see. */
  onHandedOver?: () => void
}) {
  const [selected, setSelected] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  // Hot leads from platforms are a Manager's to follow up — the backend only
  // lets them go to a Manager, so only Managers are offered.
  const isHot = lead?.intakeChannel === LeadIntakeChannel.PLATFORM
  const isAdmin = currentUser?.role === UserRole.ADMIN
  const isManager = currentUser?.role === UserRole.MANAGER
  // A Manager's user list only holds their own team.
  const { data: users } = useUsers(open && !isHot)
  const { data: managers } = useManagers(open && isAdmin && isHot)
  // Handing a lead over to another Manager is the one thing a Manager can do across teams.
  const { data: peers } = usePeerManagers(open && isManager)
  const assign = useAssignLead()

  if (!lead) return null

  const staff: Candidate[] = isHot
    ? []
    : (users ?? [])
        .filter((u) => STAFF_ROLES.includes(u.role) && u.isActive)
        .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.role})` }))

  const groups: { label: string | null; candidates: Candidate[] }[] = isManager
    ? [
        {
          label: 'You & your team',
          candidates: [
            { id: currentUser.id, label: `${currentUser.firstName} ${currentUser.lastName} (you)` },
            ...staff,
          ],
        },
        {
          label: 'Hand over to another manager',
          candidates: (peers ?? []).map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName} (Manager)` })),
        },
      ]
    : [
        {
          label: null,
          candidates: isHot
            ? isAdmin
              ? (managers ?? [])
                  .filter((m) => m.isActive)
                  .map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName} (Manager)` }))
              : []
            : staff,
        },
      ]

  const isHandover = isManager && (peers ?? []).some((m) => m.id === selected)

  return (
    <Modal open={open} onClose={onClose} title="Assign lead" subtitle={lead.fullName} size="sm">
      <div className="flex flex-col gap-4">
        {isHot && (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
            This is a hot lead from a platform — it’s followed up by a manager, not presales.
          </p>
        )}
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{isHot ? 'Select a manager…' : 'Select who takes this lead…'}</option>
          {groups.map((group) =>
            group.label ? (
              group.candidates.length > 0 && (
                <optgroup key={group.label} label={group.label}>
                  {group.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              )
            ) : (
              group.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))
            ),
          )}
        </Select>
        {isHandover && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The lead moves to that manager, and you and your team will no longer see it.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            loading={assign.isPending}
            onClick={() =>
              assign.mutate(
                { id: lead.id, assignedToId: selected, handover: isHandover },
                {
                  onSuccess: () => {
                    onClose()
                    if (isHandover) onHandedOver?.()
                  },
                },
              )
            }
          >
            {isHandover ? 'Hand over' : 'Assign'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
