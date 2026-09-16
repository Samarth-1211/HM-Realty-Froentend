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
} from 'lucide-react'
import { UserRole } from '@/types'

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
