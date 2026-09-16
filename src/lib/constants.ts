import { UserRole } from '@/types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

/** Live-data refresh cadence for TanStack Query (smart polling). */
export const REFRESH_INTERVAL_MS = 20_000

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  PRESALES: 'Presales',
  POSTSALES: 'Postsales',
  AGENT: 'Agent',
}

/** Who each role is allowed to create, per the backend's CREATION_MATRIX. */
export const CREATION_MATRIX: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: [UserRole.ADMIN],
  ADMIN: [UserRole.MANAGER],
  MANAGER: [UserRole.PRESALES, UserRole.POSTSALES, UserRole.AGENT],
  PRESALES: [],
  POSTSALES: [],
  AGENT: [],
}

export const STAFF_ROLES: UserRole[] = [UserRole.PRESALES, UserRole.POSTSALES, UserRole.AGENT]

export const ASSIGNER_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]

/** Admin/Super Admin org-wide oversight (attendance + leave applications across the whole org). */
export const ORG_OVERSIGHT_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN]

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  ASSIGNED: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  IN_PROGRESS: 'bg-violet-100 text-violet-700 ring-violet-600/20',
  CONVERTED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  LOST: 'bg-rose-100 text-rose-700 ring-rose-600/20',
}

export const ORG_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  SUSPENDED: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  ARCHIVED: 'bg-slate-200 text-slate-600 ring-slate-500/20',
}

/** Roles this Employee Management module targets — matches the spec's
 * "Presales/Postsales/Agent/Manager" list; Admins/Super Admins run the org
 * rather than clock in themselves. */
export const EMPLOYEE_MODULE_ROLES: UserRole[] = [
  UserRole.MANAGER,
  UserRole.PRESALES,
  UserRole.POSTSALES,
  UserRole.AGENT,
]

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  HALF_DAY: 'Half-day',
  ON_SITE_VISIT: 'On-site visit',
  ON_LEAVE: 'On leave',
  ABSENT: 'Absent',
}

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  HALF_DAY: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  ON_SITE_VISIT: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  ON_LEAVE: 'bg-violet-100 text-violet-700 ring-violet-600/20',
  ABSENT: 'bg-rose-100 text-rose-700 ring-rose-600/20',
}

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  APPROVED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-rose-100 text-rose-700 ring-rose-600/20',
  CANCELLED: 'bg-slate-200 text-slate-600 ring-slate-500/20',
}
