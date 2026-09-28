import { LeadIntakeChannel, UserRole, type Lead } from '@/types'

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
