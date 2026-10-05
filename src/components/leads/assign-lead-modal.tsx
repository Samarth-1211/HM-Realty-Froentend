import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/queries/use-users'
import { usePeerManagers } from '@/hooks/queries/use-team'
import { useAssignLead, useBulkAssignLeads } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { STAFF_ROLES } from '@/lib/constants'
import { UserRole, type Lead, type User } from '@/types'

interface Candidate {
  id: string
  label: string
}

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`

/**
 * Everyone an Admin can hand a lead to, grouped by team: each Manager
 * followed by their sales team, then sales people without a manager.
 */
function teamGroups(users: User[]): { label: string; candidates: Candidate[] }[] {
  const active = users.filter((u) => u.isActive && (u.role === UserRole.MANAGER || STAFF_ROLES.includes(u.role)))
  const byName = (a: User, b: User) => fullName(a).localeCompare(fullName(b))
  const managers = active.filter((u) => u.role === UserRole.MANAGER).sort(byName)
  const managerIds = new Set(managers.map((m) => m.id))
  const staffOf = (managerId: string | null) =>
    active
      .filter((u) => STAFF_ROLES.includes(u.role) && (managerId ? u.managerId === managerId : !u.managerId || !managerIds.has(u.managerId)))
      .sort(byName)
      .map((u) => ({ id: u.id, label: `${fullName(u)} (${u.role})` }))

  const groups = managers.map((m) => ({
    label: `${fullName(m)}’s team`,
    candidates: [{ id: m.id, label: `${fullName(m)} (Manager)` }, ...staffOf(m.id)],
  }))
  const unteamed = staffOf(null)
  if (unteamed.length > 0) groups.push({ label: 'Not in a team', candidates: unteamed })
  return groups
}

/**
 * Assign one lead (`lead`) or a whole selection (`leads`) to someone.
 *
 * Hot leads from platforms are auto-assigned to a Manager, but after that
 * they move like any other lead: an Admin can hand any lead to anyone in the
 * organization, across teams; a Manager to themselves, their own team, or
 * another Manager.
 */
export function AssignLeadModal({
  open,
  onClose,
  lead,
  leads,
  onHandedOver,
  onAssigned,
}: {
  open: boolean
  onClose: () => void
  lead?: Lead | null
  /** Bulk mode: every selected lead goes to the one person picked. */
  leads?: Lead[]
  /** A Manager passed the lead to another Manager — it's no longer theirs to see. */
  onHandedOver?: () => void
  /** Bulk mode: called once the selection has been assigned. */
  onAssigned?: () => void
}) {
  const [selected, setSelected] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  const targets = leads ?? (lead ? [lead] : [])
  const isBulk = !!leads
  const isManager = currentUser?.role === UserRole.MANAGER
  // An Admin's user list is the whole org; a Manager's only their own team.
  const { data: users } = useUsers(open)
  // Handing a lead over to another Manager is the one thing a Manager can do across teams.
  const { data: peers } = usePeerManagers(open && isManager)
  const assign = useAssignLead()
  const bulkAssign = useBulkAssignLeads()

  // Each opening starts with nobody picked, so a previous pick isn't reused for another lead.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setSelected('')
  }

  if (targets.length === 0 || !currentUser) return null

  const groups: { label: string; candidates: Candidate[] }[] = isManager
    ? [
        {
          label: 'You & your team',
          candidates: [
            { id: currentUser.id, label: `${fullName(currentUser)} (you)` },
            ...(users ?? [])
              .filter((u) => STAFF_ROLES.includes(u.role) && u.isActive)
              .map((u) => ({ id: u.id, label: `${fullName(u)} (${u.role})` })),
          ],
        },
        {
          label: 'Hand over to another manager',
          candidates: (peers ?? []).map((m) => ({ id: m.id, label: `${fullName(m)} (Manager)` })),
        },
      ]
    : teamGroups(users ?? [])

  const isHandover = isManager && (peers ?? []).some((m) => m.id === selected)
  const pending = assign.isPending || bulkAssign.isPending

  const submit = () => {
    if (isBulk) {
      bulkAssign.mutate(
        { leadIds: targets.map((l) => l.id), assignedToId: selected },
        {
          onSuccess: () => {
            onClose()
            onAssigned?.()
          },
        },
      )
      return
    }
    assign.mutate(
      { id: targets[0].id, assignedToId: selected, handover: isHandover },
      {
        onSuccess: () => {
          onClose()
          if (isHandover) onHandedOver?.()
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isBulk ? `Assign ${targets.length.toLocaleString('en-IN')} lead${targets.length === 1 ? '' : 's'}` : 'Assign lead'}
      subtitle={isBulk ? undefined : targets[0].fullName}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{isBulk ? 'Select who takes these leads…' : 'Select who takes this lead…'}</option>
          {groups.map(
            (group) =>
              group.candidates.length > 0 && (
                <optgroup key={group.label} label={group.label}>
                  {group.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ),
          )}
        </Select>
        {isHandover && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {isBulk ? 'The leads move' : 'The lead moves'} to that manager, and you and your team will no longer see{' '}
            {isBulk ? 'them' : 'it'}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected} loading={pending} onClick={submit}>
            {isHandover ? 'Hand over' : 'Assign'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
