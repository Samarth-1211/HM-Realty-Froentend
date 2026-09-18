// ---------------------------------------------------------------------------
// Enums (mirrors prisma/schema.prisma — see project_info__1.md §4)
// ---------------------------------------------------------------------------

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PRESALES: 'PRESALES',
  POSTSALES: 'POSTSALES',
  AGENT: 'AGENT',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const LeadStatus = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus]

export const LeadActivityType = {
  CREATED: 'CREATED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  ASSIGNED: 'ASSIGNED',
  REASSIGNED: 'REASSIGNED',
  NOTE_ADDED: 'NOTE_ADDED',
} as const
export type LeadActivityType = (typeof LeadActivityType)[keyof typeof LeadActivityType]

export const LeadProgressStage = {
  CONTACTED: 'CONTACTED',
  FOLLOW_UP_SENT: 'FOLLOW_UP_SENT',
  NEGOTIATION: 'NEGOTIATION',
  SITE_VISIT_SCHEDULED: 'SITE_VISIT_SCHEDULED',
  DOCUMENTATION_PENDING: 'DOCUMENTATION_PENDING',
  AWAITING_DECISION: 'AWAITING_DECISION',
  OTHER: 'OTHER',
} as const
export type LeadProgressStage = (typeof LeadProgressStage)[keyof typeof LeadProgressStage]

export const LeadTemperature = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD',
} as const
export type LeadTemperature = (typeof LeadTemperature)[keyof typeof LeadTemperature]

export const LeadPurpose = {
  SELF_USE: 'SELF_USE',
  INVESTMENT: 'INVESTMENT',
  RENTAL: 'RENTAL',
  OTHER: 'OTHER',
} as const
export type LeadPurpose = (typeof LeadPurpose)[keyof typeof LeadPurpose]

export const VisitStatus = {
  NOT_SCHEDULED: 'NOT_SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
} as const
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus]

export const BookingStatus = {
  NOT_BOOKED: 'NOT_BOOKED',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export const EmployeeActivityType = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  MEETING: 'MEETING',
  SITE_VISIT: 'SITE_VISIT',
  TRAVEL: 'TRAVEL',
  FOLLOW_UP: 'FOLLOW_UP',
  NOTE: 'NOTE',
  DOCUMENTATION: 'DOCUMENTATION',
  PAYMENT: 'PAYMENT',
  PROPERTY_VISIT: 'PROPERTY_VISIT',
  MARKETING: 'MARKETING',
  REPORTING: 'REPORTING',
  INTERNAL_MEETING: 'INTERNAL_MEETING',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER',
} as const
export type EmployeeActivityType = (typeof EmployeeActivityType)[keyof typeof EmployeeActivityType]

export const TaskType = {
  FOLLOW_UP: 'FOLLOW_UP',
  SITE_VISIT: 'SITE_VISIT',
  CALL: 'CALL',
  MEETING: 'MEETING',
  OTHER: 'OTHER',
} as const
export type TaskType = (typeof TaskType)[keyof typeof TaskType]

export const TaskStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const TaskPriority = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  VERY_URGENT: 'VERY_URGENT',
  TOP_PRIORITY: 'TOP_PRIORITY',
} as const
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export const NotificationType = {
  TASK_REMINDER: 'TASK_REMINDER',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  GENERIC: 'GENERIC',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const OrganizationStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus]

export const SubscriptionPlan = {
  TRIAL: 'TRIAL',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan]

export const PlotSizeUnit = {
  SQFT: 'SQFT',
  SQYD: 'SQYD',
  ACRE: 'ACRE',
  HECTARE: 'HECTARE',
} as const
export type PlotSizeUnit = (typeof PlotSizeUnit)[keyof typeof PlotSizeUnit]

export const LeadSource = {
  MANUAL: 'MANUAL',
  NINETYNINE_ACRES: 'NINETYNINE_ACRES',
  MAGIC_BRICKS: 'MAGIC_BRICKS',
  HOUSING_COM: 'HOUSING_COM',
  NOBROKER: 'NOBROKER',
  SQUARE_YARDS: 'SQUARE_YARDS',
  PROP_TIGER: 'PROP_TIGER',
  REAL_ESTATE_INDIA: 'REAL_ESTATE_INDIA',
  MAKAAN: 'MAKAAN',
  COMMON_FLOOR: 'COMMON_FLOOR',
  OLX: 'OLX',
  HOME_ONLINE: 'HOME_ONLINE',
  TATA_HOUSING: 'TATA_HOUSING',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  META_LEAD_ADS: 'META_LEAD_ADS',
  META_CLICK_TO_WHATSAPP: 'META_CLICK_TO_WHATSAPP',
  GOOGLE_ADS: 'GOOGLE_ADS',
  GOOGLE_SEARCH: 'GOOGLE_SEARCH',
  GOOGLE_BUSINESS_PROFILE: 'GOOGLE_BUSINESS_PROFILE',
  YOUTUBE_ADS: 'YOUTUBE_ADS',
  WEBSITE: 'WEBSITE',
  WHATSAPP: 'WHATSAPP',
  PHONE_CALL: 'PHONE_CALL',
  WALK_IN: 'WALK_IN',
  CHANNEL_PARTNER: 'CHANNEL_PARTNER',
  BROKER: 'BROKER',
  PROPERTY_CONSULTANT: 'PROPERTY_CONSULTANT',
  REFERRAL: 'REFERRAL',
  CUSTOMER_REFERRAL: 'CUSTOMER_REFERRAL',
  EMPLOYEE_REFERRAL: 'EMPLOYEE_REFERRAL',
  PROPERTY_EXHIBITION: 'PROPERTY_EXHIBITION',
  PROPERTY_EXPO: 'PROPERTY_EXPO',
  OPEN_HOUSE: 'OPEN_HOUSE',
  INVESTOR_MEET: 'INVESTOR_MEET',
  NEWSPAPER: 'NEWSPAPER',
  MAGAZINE: 'MAGAZINE',
  HOARDING: 'HOARDING',
  BILLBOARD: 'BILLBOARD',
  RADIO: 'RADIO',
  TELEVISION: 'TELEVISION',
  SMS_CAMPAIGN: 'SMS_CAMPAIGN',
  EMAIL_CAMPAIGN: 'EMAIL_CAMPAIGN',
  COLD_CALLING: 'COLD_CALLING',
  EXISTING_DATABASE: 'EXISTING_DATABASE',
  OTHER: 'OTHER',
} as const
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource]

export const LEAD_SOURCE_OPTIONS = Object.values(LeadSource)

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  HALF_DAY: 'HALF_DAY',
  ON_SITE_VISIT: 'ON_SITE_VISIT',
  ON_LEAVE: 'ON_LEAVE',
  ABSENT: 'ABSENT',
} as const
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const
export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus]

export const TargetMetric = {
  CALLS: 'CALLS',
  CONVERSIONS: 'CONVERSIONS',
} as const
export type TargetMetric = (typeof TargetMetric)[keyof typeof TargetMetric]

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  organizationId: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface User {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  isDeleted: boolean
  deletedAt: string | null
  createdById: string | null
  managerId: string | null
  phone: string | null
  employeeCode: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  contactEmail: string
  contactPhone: string | null
  address: string | null
  gstNumber: string | null
  status: OrganizationStatus
  plan: SubscriptionPlan
  maxUsers: number
  maxLeadsPerMonth: number
  suspendedAt: string | null
  suspendedReason: string | null
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

export interface ManagerSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: string
  createdById: string | null
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string | null
  location: string | null
  price: string | null
  plotSize: number | null
  plotSizeUnit: PlotSizeUnit | null
  activePlatforms: LeadSource[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectManagerLink {
  id: string
  projectId: string
  managerId: string
  assignedById: string | null
  assignedAt: string
  manager?: {
    id: string
    email: string
    firstName: string
    lastName: string
    isActive: boolean
  }
}

export interface ProjectAssignment {
  id: string
  projectId: string
  userId: string
  assignedById: string | null
  assignedAt: string
  project: Project
}

export interface TeamMember {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  managerId: string | null
  phone: string | null
  employeeCode: string | null
  photoUrl: string | null
  projectAssignments: ProjectAssignment[]
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  organizationId: string
  source: LeadSource
  sourceLeadId: string | null
  fullName: string
  phone: string
  email: string | null
  projectId: string | null
  project: { id: string; name: string } | null
  propertyInterest: string | null
  budgetMin: string | null
  budgetMax: string | null
  unitType: string | null
  city: string | null
  message: string | null
  receivedAt: string | null
  rawPayload: unknown
  status: LeadStatus
  assignedToId: string | null
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    managerId: string | null
  } | null
  referredByName: string | null
  referredByEmail: string | null
  referredByPhone: string | null
  progressStage: LeadProgressStage | null
  progressStageNote: string | null
  leadNumber: number
  plotSizeSqFt: number | null
  purpose: LeadPurpose | null
  leadTemperature: LeadTemperature | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  siteVisitDate: string | null
  visitStatus: VisitStatus | null
  mainObjection: string | null
  bookingProbability: number | null
  bookingStatus: BookingStatus | null
  bookingValue: string | null
  lostNurtureReason: string | null
  remarks: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadActivityLog {
  id: string
  leadId: string
  type: LeadActivityType
  description: string
  performedById: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface LeadWithActivity extends Lead {
  activityLogs: LeadActivityLog[]
}

export interface TeamSummaryItem {
  userId: string
  fullName: string
  role: UserRole
  activeLeadCount: number
  totalCallsMock: number
  totalTalkTimeMinutesMock: number
}

export interface EmployeeSummary {
  userId: string
  fullName: string
  role: UserRole
  activeWorkload: number
  totalConversions: number
  statusBreakdown: Record<LeadStatus, number>
}

export interface Attendance {
  id: string
  organizationId: string
  userId: string
  date: string
  status: AttendanceStatus
  markedBy: 'EMPLOYEE' | 'SYSTEM' | 'MANAGER'
  checkInAt: string | null
  checkOutAt: string | null
  leaveRequestId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TeamAttendanceItem {
  userId: string
  fullName: string
  role: UserRole
  managerId?: string | null
  status: AttendanceStatus | null
  checkInAt: string | null
  checkOutAt: string | null
  notes: string | null
}

export interface LeaveRequest {
  id: string
  organizationId: string
  userId: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  reviewedById: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; firstName: string; lastName: string; role: UserRole }
}

export interface Target {
  id: string
  organizationId: string
  userId: string
  periodYear: number
  periodMonth: number
  metric: TargetMetric
  targetValue: number
  setById: string
  createdAt: string
  updatedAt: string
}

export interface TargetProgress {
  userId: string
  fullName: string
  periodYear: number
  periodMonth: number
  metric: TargetMetric | null
  targetValue: number | null
  actualValue: number | null
  callTrackingComingSoon: boolean
}

export interface EmployeeProfile {
  userId: string
  fullName: string
  email: string
  role: UserRole
  phone: string | null
  employeeCode: string | null
  photoUrl: string | null
  joiningDate: string
  isActive: boolean
  managerId: string | null
  managerName: string | null
}

export interface TeamRollupItem {
  userId: string
  fullName: string
  role: UserRole
  attendanceToday: AttendanceStatus | null
  leadSnapshot: {
    inProgress: number
    converted: number
    lost: number
    statusBreakdown: Record<LeadStatus, number>
  }
  target: TargetProgress | null
}

export interface EmployeeActivity {
  id: string
  organizationId: string
  userId: string
  type: EmployeeActivityType
  description: string | null
  leadId: string | null
  lead: { id: string; fullName: string } | null
  occurredAt: string
  createdAt: string
}

export interface TeamActivityItem {
  userId: string
  fullName: string
  role: UserRole
  managerId: string | null
  activities: EmployeeActivity[]
}

export interface Task {
  id: string
  organizationId: string
  userId: string
  title: string
  description: string | null
  taskType: TaskType | null
  priority: TaskPriority
  dueAt: string | null
  leadId: string | null
  lead: { id: string; fullName: string; phone: string } | null
  user: { id: string; firstName: string; lastName: string; role: UserRole } | null
  status: TaskStatus
  completedAt: string | null
  createdById: string
  createdBy: { id: string; firstName: string; lastName: string; role: UserRole } | null
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  organizationId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  taskId: string | null
  task: { id: string; title: string; leadId: string | null; status: TaskStatus } | null
  isRead: boolean
  createdAt: string
}

export const WhatsAppIntegrationStatus = {
  PENDING: 'PENDING',
  CONNECTED: 'CONNECTED',
  FAILED: 'FAILED',
  DISABLED: 'DISABLED',
} as const
export type WhatsAppIntegrationStatus = (typeof WhatsAppIntegrationStatus)[keyof typeof WhatsAppIntegrationStatus]

export const WhatsAppMessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const
export type WhatsAppMessageDirection = (typeof WhatsAppMessageDirection)[keyof typeof WhatsAppMessageDirection]

export const WhatsAppMessageStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const
export type WhatsAppMessageStatus = (typeof WhatsAppMessageStatus)[keyof typeof WhatsAppMessageStatus]

export interface WhatsAppIntegration {
  id: string
  organizationId: string
  wabaId: string
  phoneNumberId: string
  displayPhoneNumber: string | null
  businessName: string | null
  businessManagerId: string | null
  webhookUrl: string
  verifyToken?: string
  status: WhatsAppIntegrationStatus
  verifiedAt: string | null
  lastError: string | null
  lastInboundAt: string | null
  lastOutboundAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  organizationId: string
  integrationId: string
  leadId: string
  waMessageId: string | null
  direction: WhatsAppMessageDirection
  fromPhone: string
  toPhone: string
  messageType: string
  textBody: string | null
  mediaId: string | null
  mediaMimeType: string | null
  status: WhatsAppMessageStatus
  errorCode: string | null
  errorMessage: string | null
  sentByUserId: string | null
  waTimestamp: string | null
  createdAt: string
}

export interface WhatsAppThread {
  lead: { id: string; fullName: string; phone: string; source: LeadSource }
  messages: WhatsAppMessage[]
  windowOpenUntil: string | null
  withinServiceWindow: boolean
}

export interface PlatformIntegration {
  id: string
  platform: LeadSource
  webhookUrl: string
  webhookSecret?: string
  rmName: string | null
  rmEmail: string | null
  rmPhone: string | null
  isActive: boolean
  lastReceivedAt: string | null
  fieldMapping: Record<string, string> | null
  createdAt: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorShape {
  statusCode: number
  error: string
  message: string | string[]
  path: string
  timestamp: string
}
