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

export const LEAD_PROGRESS_STAGE_LABELS: Record<string, string> = {
  CONTACTED: 'Contacted',
  FOLLOW_UP_SENT: 'Follow-up sent',
  NEGOTIATION: 'Negotiation',
  SITE_VISIT_SCHEDULED: 'Site visit scheduled',
  DOCUMENTATION_PENDING: 'Documentation pending',
  AWAITING_DECISION: 'Awaiting decision',
  OTHER: 'Other',
}

export const LEAD_TEMPERATURE_LABELS: Record<string, string> = {
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
}

export const LEAD_TEMPERATURE_COLORS: Record<string, string> = {
  HOT: 'bg-rose-100 text-rose-700 ring-rose-600/20',
  WARM: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  COLD: 'bg-sky-100 text-sky-700 ring-sky-600/20',
}

export const LEAD_PURPOSE_LABELS: Record<string, string> = {
  SELF_USE: 'Self use',
  INVESTMENT: 'Investment',
  RENTAL: 'Rental',
  OTHER: 'Other',
}

export const VISIT_STATUS_LABELS: Record<string, string> = {
  NOT_SCHEDULED: 'Not scheduled',
  SCHEDULED: 'Scheduled',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
}

export const VISIT_STATUS_COLORS: Record<string, string> = {
  NOT_SCHEDULED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  SCHEDULED: 'bg-sky-100 text-sky-700 ring-sky-600/20',
  DONE: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-600/20',
  RESCHEDULED: 'bg-amber-100 text-amber-700 ring-amber-600/20',
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  NOT_BOOKED: 'Not booked',
  BOOKED: 'Booked',
  CANCELLED: 'Cancelled',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  NOT_BOOKED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  BOOKED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-100 text-rose-700 ring-rose-600/20',
}

export const EMPLOYEE_ACTIVITY_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'CALL', label: 'Called lead', emoji: '📞' },
  { value: 'WHATSAPP', label: 'Replied on WhatsApp', emoji: '💬' },
  { value: 'MEETING', label: 'Met client', emoji: '👥' },
  { value: 'SITE_VISIT', label: 'Client site visit', emoji: '🏠' },
  { value: 'TRAVEL', label: 'Travelled to site', emoji: '🚗' },
  { value: 'FOLLOW_UP', label: 'Follow-up', emoji: '📋' },
  { value: 'NOTE', label: 'Added client notes', emoji: '📝' },
  { value: 'DOCUMENTATION', label: 'Uploaded documentation', emoji: '📄' },
  { value: 'PAYMENT', label: 'Collected payment', emoji: '💰' },
  { value: 'PROPERTY_VISIT', label: 'Inspected property', emoji: '🏢' },
  { value: 'MARKETING', label: 'Posted property/marketing', emoji: '📣' },
  { value: 'REPORTING', label: 'Updated pipeline/report', emoji: '📊' },
  { value: 'INTERNAL_MEETING', label: 'Internal/sales team meeting', emoji: '🤝' },
  { value: 'TRAINING', label: 'Training', emoji: '📚' },
  { value: 'OTHER', label: 'Other', emoji: '✏️' },
]

export const TASK_TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: 'Follow-up',
  SITE_VISIT: 'Site visit',
  CALL: 'Call',
  MEETING: 'Meeting',
  OTHER: 'Other',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  COMPLETED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-slate-200 text-slate-600 ring-slate-500/20',
}

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  VERY_URGENT: 'Very urgent',
  TOP_PRIORITY: 'Top priority',
}

/** Ordered low -> high, for sort/rank use in the UI. */
export const TASK_PRIORITY_ORDER: string[] = ['NORMAL', 'URGENT', 'VERY_URGENT', 'TOP_PRIORITY']

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  NORMAL: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  URGENT: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  VERY_URGENT: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  TOP_PRIORITY: 'bg-rose-100 text-rose-700 ring-rose-600/20',
}

/** Preset reminder offsets (minutes before due) shown as quick-toggle chips. */
export const REMINDER_PRESETS: { label: string; minutes: number }[] = [
  { label: '1 day before', minutes: 1440 },
  { label: '6 hours before', minutes: 360 },
  { label: '1 hour before', minutes: 60 },
  { label: '30 minutes before', minutes: 30 },
]
