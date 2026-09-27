import { LeadIntakeChannel, type Lead } from '@/types'

export const LEAD_CHANNEL_LABELS: Record<LeadIntakeChannel, string> = {
  PLATFORM: 'Hot lead (platform)',
  BULK_UPLOAD: 'Admin Excel upload',
  MANUAL: 'Manual entry',
  WHATSAPP: 'WhatsApp',
}

/** "Priya Shah (leads-sept.xlsx)" for a lead from an Admin's Excel upload; null for any other lead. */
export function uploadedByLabel(lead: Pick<Lead, 'intakeChannel' | 'importBatch'>): string | null {
  if (lead.intakeChannel !== LeadIntakeChannel.BULK_UPLOAD) return null
  const batch = lead.importBatch
  if (!batch) return 'an Admin'
  return `${batch.uploadedBy.firstName} ${batch.uploadedBy.lastName} (${batch.fileName})`
}

/** One-line provenance for the Lead Sheet's "Provided By" column. */
export function providedByLabel(lead: Pick<Lead, 'intakeChannel' | 'importBatch'>): string {
  if (lead.intakeChannel === LeadIntakeChannel.BULK_UPLOAD) return `Admin · ${uploadedByLabel(lead)}`
  return lead.intakeChannel ? LEAD_CHANNEL_LABELS[lead.intakeChannel] : ''
}
