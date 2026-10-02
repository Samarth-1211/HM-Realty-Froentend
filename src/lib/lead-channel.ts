import { LeadIntakeChannel, LeadSource, LeadStatus, UserRole, type AuthUser, type Lead } from '@/types'

/**
 * For "All statuses" lists: lost leads sink below everything still in play.
 * Each group keeps its order (newest first, as the API returns them).
 */
export function lostLeadsLast<T extends Pick<Lead, 'status'>>(leads: T[]): T[] {
  return [...leads.filter((l) => l.status !== LeadStatus.LOST), ...leads.filter((l) => l.status === LeadStatus.LOST)]
}

/** Keyed in by hand or brought in from an Excel sheet (older untracked leads count when their source is Manual). */
export function isManuallyAddedLead(lead: Pick<Lead, 'intakeChannel' | 'source'>): boolean {
  if (lead.intakeChannel === null) return lead.source === LeadSource.MANUAL
  return lead.intakeChannel === LeadIntakeChannel.MANUAL || lead.intakeChannel === LeadIntakeChannel.BULK_UPLOAD
}

/**
 * Whether the user may edit or delete this lead's record — mirrors the
 * backend: Admins any lead; Managers manually added / Excel-uploaded leads
 * held by them or their team.
 */
export function canManageLeadRecord(
  user: Pick<AuthUser, 'id' | 'role'> | null | undefined,
  lead: Pick<Lead, 'intakeChannel' | 'source' | 'assignedToId' | 'assignedTo'>,
): boolean {
  if (!user) return false
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) return true
  if (user.role !== UserRole.MANAGER || !isManuallyAddedLead(lead)) return false
  return lead.assignedToId === user.id || lead.assignedTo?.managerId === user.id
}

export const LEAD_CHANNEL_LABELS: Record<LeadIntakeChannel, string> = {
  PLATFORM: 'Hot lead (platform)',
  BULK_UPLOAD: 'Excel upload',
  MANUAL: 'Manual entry',
  WHATSAPP: 'WhatsApp',
}

/** Who uploaded an Excel-uploaded lead: "Manager" or "Admin" (older leads without a batch count as the Admin's). */
export function uploaderRoleLabel(lead: Pick<Lead, 'importBatch'>): 'Manager' | 'Admin' {
  return lead.importBatch?.uploadedBy.role === UserRole.MANAGER ? 'Manager' : 'Admin'
}

/** "Priya Shah (leads-sept.xlsx)" for a lead from an Excel upload; null for any other lead. */
export function uploadedByLabel(lead: Pick<Lead, 'intakeChannel' | 'importBatch'>): string | null {
  if (lead.intakeChannel !== LeadIntakeChannel.BULK_UPLOAD) return null
  const batch = lead.importBatch
  if (!batch) return 'an Admin'
  return `${batch.uploadedBy.firstName} ${batch.uploadedBy.lastName} (${batch.fileName})`
}

/** One-line provenance for the Lead Sheet's "Provided By" column. */
export function providedByLabel(lead: Pick<Lead, 'intakeChannel' | 'importBatch'>): string {
  if (lead.intakeChannel === LeadIntakeChannel.BULK_UPLOAD) return `${uploaderRoleLabel(lead)} · ${uploadedByLabel(lead)}`
  return lead.intakeChannel ? LEAD_CHANNEL_LABELS[lead.intakeChannel] : ''
}
