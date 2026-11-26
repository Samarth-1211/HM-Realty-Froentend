import { apiClient } from '@/lib/api-client'
import type {
  BookingStatus,
  LeadProgressStage,
  LeadPurpose,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  VisitStatus,
  WhatsAppMessageStatus,
} from '@/types'

/** Stand-ins accepted in projectIds / assignedToIds (see the backend's FollowUpLeadFiltersDto). */
export const NO_PROJECT = 'none'
export const UNASSIGNED = 'unassigned'

export type FollowUpDue = 'OVERDUE' | 'TODAY' | 'NEXT_7_DAYS' | 'NOT_SET'

export interface FollowUpFilters {
  q?: string
  projectIds?: string[]
  statuses?: LeadStatus[]
  progressStages?: LeadProgressStage[]
  temperatures?: LeadTemperature[]
  assignedToIds?: string[]
  sources?: LeadSource[]
  purposes?: LeadPurpose[]
  visitStatuses?: VisitStatus[]
  bookingStatuses?: BookingStatus[]
  followUpDue?: FollowUpDue
  nextFollowUpFrom?: string
  nextFollowUpTo?: string
  notContactedForDays?: number
  noFollowUpSentForDays?: number
  createdFrom?: string
  createdTo?: string
  budgetMin?: number
  budgetMax?: number
  city?: string
  unitType?: string
  whatsappChat?: 'HAS_CHAT' | 'NO_CHAT'
  includeOptedOut?: boolean
}

export type FollowUpSortField = 'nextFollowUpAt' | 'lastContactedAt' | 'createdAt' | 'fullName' | 'budgetMax' | 'leadTemperature'

export interface FollowUpLead {
  id: string
  leadNumber: number
  fullName: string
  phone: string
  status: LeadStatus
  progressStage: LeadProgressStage | null
  leadTemperature: LeadTemperature | null
  source: LeadSource
  city: string | null
  unitType: string | null
  budgetMin: number | null
  budgetMax: number | null
  visitStatus: VisitStatus | null
  nextFollowUpAt: string | null
  lastContactedAt: string | null
  createdAt: string
  whatsappOptedOut: boolean
  project: { id: string; name: string; hasBrochure: boolean; brochureMimeType: string | null } | null
  assignedTo: { id: string; firstName: string; lastName: string } | null
  /** Digits with country code — null when the lead can't be messaged. */
  whatsappNumber: string | null
  /** They messaged in the last 24 hours. */
  chatWindowOpen: boolean
  lastFollowUpSentAt: string | null
}

export interface FollowUpLeadsPage {
  items: FollowUpLead[]
  total: number
  page: number
  pageSize: number
}

export interface SearchFollowUpLeadsPayload {
  filters?: FollowUpFilters
  sortBy?: FollowUpSortField
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type BrochureSlot = 'DOCUMENT' | 'IMAGE'

export interface FollowUpTemplate {
  name: string
  language: string
  category: string | null
  parameterFormat: 'NAMED' | 'POSITIONAL'
  header: { format: string; text: string | null; variables: string[] } | null
  body: string
  bodyVariables: string[]
  footer: string | null
  buttons: { type: string; text: string }[]
  brochureSlot: BrochureSlot | null
  supported: boolean
  unsupportedReason: string | null
  /** How the blanks were set up when the template was made in the CRM (send window starts from these). */
  crmDefaults?: Record<string, ParameterSetting> | null
}

export type ParameterSource =
  | 'LEAD_NAME'
  | 'LEAD_FIRST_NAME'
  | 'PROJECT_NAME'
  | 'PROJECT_LOCATION'
  | 'ASSIGNEE_NAME'
  | 'SENDER_NAME'
  | 'ORGANIZATION_NAME'
  | 'CUSTOM'

export interface ParameterSetting {
  source: ParameterSource
  /** The value for CUSTOM; for the others, what's used when the lead has none. */
  text?: string
}

export interface FollowUpSelection {
  leadIds?: string[]
  filters?: FollowUpFilters
  excludeLeadIds?: string[]
}

export interface CreateBroadcastPayload {
  selection: FollowUpSelection
  templateName: string
  templateLanguage: string
  parameters: Record<string, ParameterSetting>
  attachBrochure: boolean
  projectId?: string | null
  nextFollowUpInDays?: number | null
}

export interface BroadcastPreview {
  template: FollowUpTemplate
  total: number
  willSend: number
  skipped: { reason: string; count: number }[]
  samples: { leadId: string; leadName: string; toPhone: string | null; text: string | null }[]
}

export type BroadcastStatus = 'QUEUED' | 'SENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
export type RecipientStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'SKIPPED'

export interface BroadcastStats {
  total: number
  pending: number
  sent: number
  delivered: number
  read: number
  failed: number
  skipped: number
  replied: number
}

export interface Broadcast {
  id: string
  templateName: string
  templateLanguage: string
  templateCategory: string | null
  templateBody: string
  attachBrochure: boolean
  nextFollowUpInDays: number | null
  status: BroadcastStatus
  lastError: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  createdById: string
  project: { id: string; name: string } | null
  createdBy: { id: string; firstName: string; lastName: string }
  stats: BroadcastStats
}

export interface BroadcastRecipient {
  id: string
  status: RecipientStatus
  skipReason: string | null
  errorMessage: string | null
  toPhone: string | null
  sentAt: string | null
  lead: { id: string; fullName: string; leadNumber: number; phone: string }
  messageStatus: WhatsAppMessageStatus | null
  replied: boolean
}

export interface BroadcastsPage {
  items: Broadcast[]
  total: number
  page: number
  pageSize: number
}

// --- Templates tab (Admins) -------------------------------------------------

export type TemplateHeaderType = 'NONE' | 'TEXT' | 'DOCUMENT' | 'IMAGE'
export type TemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'

export interface TemplateButton {
  type: TemplateButtonType
  text: string
  url?: string
  phoneNumber?: string
}

export interface TemplateVariable {
  source: ParameterSource
  text?: string
  /** What WhatsApp's reviewers see in its place. */
  sample: string
}

export interface TemplateDraft {
  name: string
  language: string
  category: 'MARKETING' | 'UTILITY'
  headerType: TemplateHeaderType
  headerText?: string
  sampleProjectId?: string
  body: string
  footer?: string
  buttons: TemplateButton[]
  variables: Record<string, TemplateVariable>
}

export interface ManagedTemplate {
  metaTemplateId: string | null
  name: string
  language: string
  category: string | null
  /** Meta's word: PENDING, APPROVED, REJECTED, PAUSED, DISABLED, IN_APPEAL… (DELETED = gone from WhatsApp). */
  status: string
  rejectionReason: string | null
  /** As WhatsApp has it — null when it couldn't be read. */
  template: FollowUpTemplate | null
  /** Set when the template was made in the CRM. */
  crm: {
    id: string
    submittedBy: { id: string; firstName: string; lastName: string }
    submittedAt: string
    approvedAt: string | null
    statusUpdatedAt: string | null
    requestedCategory: string
    headerType: TemplateHeaderType
    headerText: string | null
    body: string
    footer: string | null
    buttons: TemplateButton[]
    variables: Record<string, TemplateVariable>
    sampleProjectId: string | null
  } | null
  missingOnWhatsApp: boolean
}

export interface ManagedTemplatesResponse {
  items: ManagedTemplate[]
  /** Set when WhatsApp couldn't be reached — the list then shows the CRM's last known statuses. */
  metaError: string | null
}

export const whatsappTemplatesApi = {
  list: () => apiClient.get<ManagedTemplatesResponse>('/follow-ups/manage-templates').then((r) => r.data),
  create: (draft: TemplateDraft) => apiClient.post('/follow-ups/manage-templates', draft).then((r) => r.data),
  resubmit: (id: string, draft: TemplateDraft) => apiClient.put(`/follow-ups/manage-templates/${id}`, draft).then((r) => r.data),
  remove: (metaTemplateId: string) =>
    apiClient.delete<{ deleted: boolean; name: string }>(`/follow-ups/manage-templates/meta/${metaTemplateId}`).then((r) => r.data),
}

export const followUpsApi = {
  searchLeads: (payload: SearchFollowUpLeadsPayload) =>
    apiClient.post<FollowUpLeadsPage>('/follow-ups/leads/search', payload).then((r) => r.data),

  listTemplates: () => apiClient.get<FollowUpTemplate[]>('/follow-ups/templates').then((r) => r.data),

  preview: (payload: CreateBroadcastPayload) =>
    apiClient.post<BroadcastPreview>('/follow-ups/broadcasts/preview', payload).then((r) => r.data),

  create: (payload: CreateBroadcastPayload) =>
    apiClient.post<Broadcast>('/follow-ups/broadcasts', payload).then((r) => r.data),

  list: (page: number, pageSize = 20) =>
    apiClient.get<BroadcastsPage>('/follow-ups/broadcasts', { params: { page, pageSize } }).then((r) => r.data),

  get: (id: string) => apiClient.get<Broadcast>(`/follow-ups/broadcasts/${id}`).then((r) => r.data),

  recipients: (id: string) =>
    apiClient.get<BroadcastRecipient[]>(`/follow-ups/broadcasts/${id}/recipients`).then((r) => r.data),

  cancel: (id: string) => apiClient.post<Broadcast>(`/follow-ups/broadcasts/${id}/cancel`).then((r) => r.data),
}
