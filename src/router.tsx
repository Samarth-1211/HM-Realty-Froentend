import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/root-layout'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'
import { LoginPage } from '@/pages/login-page'
import { SuperAdminLoginPage } from '@/pages/super-admin-login-page'
import { VerifyEmailPage } from '@/pages/verify-email-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { OrganizationsPage } from '@/pages/organizations-page'
import { ManagersPage } from '@/pages/managers-page'
import { ProjectsPage } from '@/pages/projects-page'
import { TeamPage } from '@/pages/team-page'
import { UsersPage } from '@/pages/users-page'
import { UserDetailPage } from '@/pages/user-detail-page'
import { LeadsPage } from '@/pages/leads-page'
import { LeadDetailPage } from '@/pages/lead-detail-page'
import { LeadSheetPage } from '@/pages/lead-sheet-page'
import { LostLeadsPage } from '@/pages/lost-leads-page'
import { ReportsPage } from '@/pages/reports-page'
import { IntegrationsPage } from '@/pages/integrations-page'
import { WhatsAppInboxPage } from '@/pages/whatsapp-inbox-page'
import { AttendancePage } from '@/pages/attendance-page'
import { OrgAttendancePage } from '@/pages/org-attendance-page'
import { TargetsPage } from '@/pages/targets-page'
import { ProfilePage } from '@/pages/profile-page'
import { TodoPage } from '@/pages/todo-page'
import { UnauthorizedPage } from '@/pages/unauthorized-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { ASSIGNER_ROLES, EMPLOYEE_MODULE_ROLES, ORG_OVERSIGHT_ROLES } from '@/lib/constants'

function requireAuth() {
  if (!useAuthStore.getState().isAuthenticated()) {
    throw redirect({ to: '/login' })
  }
}

function requireGuest() {
  if (useAuthStore.getState().isAuthenticated()) {
    throw redirect({ to: '/dashboard' })
  }
}

function requireRole(roles: UserRole[]) {
  return () => {
    const user = useAuthStore.getState().user
    if (!user || !roles.includes(user.role)) {
      throw redirect({ to: '/unauthorized' })
    }
  }
}

export const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: useAuthStore.getState().isAuthenticated() ? '/dashboard' : '/login' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: requireGuest,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
  beforeLoad: requireGuest,
})

// No auth guard: an already-logged-in admin may click a verification link
// addressed to a different account than the one they're signed in as.
const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  component: VerifyEmailPage,
})

// Undocumented, unlinked entry point for the super admin portal. The path segment
// itself is the shared secret — it is never linked from the UI, so it only works
// for whoever has this exact URL. Treat it as a credential: rotate it if it leaks.
const SUPER_ADMIN_PORTAL_PATH = '/portal-1fae5f8a20f5c22909678acd19df95b947934abd'

const superAdminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SUPER_ADMIN_PORTAL_PATH,
  component: SuperAdminLoginPage,
  beforeLoad: requireGuest,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  component: AppShell,
  beforeLoad: requireAuth,
})

const unauthorizedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/unauthorized',
  component: UnauthorizedPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const organizationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/organizations',
  component: OrganizationsPage,
  beforeLoad: requireRole([UserRole.SUPER_ADMIN]),
})

const managersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/managers',
  component: ManagersPage,
  beforeLoad: requireRole([UserRole.ADMIN]),
})

const projectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects',
  component: ProjectsPage,
  beforeLoad: requireRole([UserRole.ADMIN]),
})

const teamRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/team',
  component: TeamPage,
  beforeLoad: requireRole([UserRole.MANAGER]),
})

const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]),
})

// Access is re-checked server-side: Admins see anyone in their org, Managers
// only their own direct reports.
const userDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users/$userId',
  component: UserDetailPage,
  beforeLoad: requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]),
})

const leadsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leads',
  component: LeadsPage,
})

const leadDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/leads/$leadId',
  component: LeadDetailPage,
})

const leadSheetRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/lead-sheet',
  component: LeadSheetPage,
  beforeLoad: requireRole(ASSIGNER_ROLES),
})

const lostLeadsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/lost-leads',
  component: LostLeadsPage,
  beforeLoad: requireRole(ASSIGNER_ROLES),
})

const whatsappInboxRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/messaging',
  component: WhatsAppInboxPage,
})

const reportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reports',
  component: ReportsPage,
})

const integrationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/integrations',
  component: IntegrationsPage,
  beforeLoad: requireRole([UserRole.ADMIN, UserRole.MANAGER]),
})

const attendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/attendance',
  component: AttendancePage,
  beforeLoad: requireRole(EMPLOYEE_MODULE_ROLES),
})

const orgAttendanceRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/org-attendance',
  component: OrgAttendancePage,
  beforeLoad: requireRole(ORG_OVERSIGHT_ROLES),
})

const targetsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/targets',
  component: TargetsPage,
  beforeLoad: requireRole(EMPLOYEE_MODULE_ROLES),
})

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
  beforeLoad: requireRole(EMPLOYEE_MODULE_ROLES),
})

const todoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/todo',
  component: TodoPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forgotPasswordRoute,
  verifyEmailRoute,
  superAdminLoginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    organizationsRoute,
    managersRoute,
    projectsRoute,
    teamRoute,
    usersRoute,
    userDetailRoute,
    leadsRoute,
    leadDetailRoute,
    leadSheetRoute,
    lostLeadsRoute,
    whatsappInboxRoute,
    reportsRoute,
    integrationsRoute,
    attendanceRoute,
    orgAttendanceRoute,
    targetsRoute,
    profileRoute,
    todoRoute,
    unauthorizedRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
