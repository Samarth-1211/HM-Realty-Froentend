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
