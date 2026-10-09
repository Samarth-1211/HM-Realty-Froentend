import { useUsers } from './use-users'
import { usePeerManagers } from './use-team'
import { useAuthStore } from '@/store/auth-store'
import { STAFF_ROLES } from '@/lib/constants'
import { UserRole, type User } from '@/types'

export interface AssignableGroup {
  label: string
  candidates: { id: string; label: string }[]
}

const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`

/**
 * Everyone an Admin can hand a lead to, grouped by team: each Manager
 * followed by their sales team, then sales people without a manager.
 */
function teamGroups(users: User[]): AssignableGroup[] {
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
 * Who the signed-in user may hand leads to, grouped for a picker: an Admin
 * anyone in the organization, team by team; a Manager themselves, their own
 * team, or another Manager (`peerIds` — handing over to one takes the leads
 * out of the Manager's view).
 */
export function useAssignablePeople(enabled = true): { groups: AssignableGroup[]; peerIds: Set<string> } {
  const currentUser = useAuthStore((s) => s.user)
  const isManager = currentUser?.role === UserRole.MANAGER
  // An Admin's user list is the whole org; a Manager's only their own team.
  const { data: users } = useUsers(enabled)
  const { data: peers } = usePeerManagers(enabled && isManager)

  if (!currentUser) return { groups: [], peerIds: new Set() }
  if (!isManager) return { groups: teamGroups(users ?? []), peerIds: new Set() }

  return {
    groups: [
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
    ],
    peerIds: new Set((peers ?? []).map((m) => m.id)),
  }
}
