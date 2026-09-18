import {
  Building2,
  LayoutDashboard,
  Users2,
  UserCog,
  FolderKanban,
  Contact,
  BarChart3,
  UsersRound,
  Webhook,
  CalendarCheck,
  Target,
  CircleUserRound,
  MessageCircle,
  ListChecks,
  Sheet,
} from 'lucide-react'
import { UserRole } from '@/types'
import { ASSIGNER_ROLES, EMPLOYEE_MODULE_ROLES, ORG_OVERSIGHT_ROLES } from '@/lib/constants'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
  /** Shown in the mobile bottom bar (max 5 recommended). */
  mobilePrimary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: Object.values(UserRole),
    mobilePrimary: true,
  },
  {
    to: '/organizations',
    label: 'Organizations',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN],
    mobilePrimary: true,
  },
  {
    to: '/managers',
    label: 'Managers',
    icon: UserCog,
    roles: [UserRole.ADMIN],
    mobilePrimary: true,
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: FolderKanban,
    roles: [UserRole.ADMIN],
    mobilePrimary: true,
  },
  {
    to: '/team',
    label: 'My Team',
    icon: UsersRound,
    roles: [UserRole.MANAGER],
    mobilePrimary: true,
  },
  {
    to: '/leads',
    label: 'Leads',
    icon: Contact,
    roles: Object.values(UserRole),
    mobilePrimary: true,
  },
  {
    to: '/lead-sheet',
    label: 'Lead Sheet',
    icon: Sheet,
    roles: ASSIGNER_ROLES,
  },
  {
    to: '/todo',
    label: 'My To-Do',
    icon: ListChecks,
    roles: Object.values(UserRole),
    mobilePrimary: true,
  },
  {
    to: '/messaging',
    label: 'WhatsApp Inbox',
    icon: MessageCircle,
    roles: Object.values(UserRole),
  },
  {
    to: '/attendance',
    label: 'Attendance',
    icon: CalendarCheck,
    roles: EMPLOYEE_MODULE_ROLES,
    mobilePrimary: true,
  },
  {
    to: '/org-attendance',
    label: 'Org Attendance',
    icon: CalendarCheck,
    roles: ORG_OVERSIGHT_ROLES,
    mobilePrimary: true,
  },
  {
    to: '/targets',
    label: 'Targets',
    icon: Target,
    roles: EMPLOYEE_MODULE_ROLES,
  },
  {
    to: '/profile',
    label: 'My Profile',
    icon: CircleUserRound,
    roles: EMPLOYEE_MODULE_ROLES,
  },
  {
    to: '/users',
    label: 'Users',
    icon: Users2,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    to: '/integrations',
    label: 'Integrations',
    icon: Webhook,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: Object.values(UserRole),
    mobilePrimary: true,
  },
]

export function navForRole(role: UserRole) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
