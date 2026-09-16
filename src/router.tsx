import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/root-layout'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { OrganizationsPage } from '@/pages/organizations-page'
import { ManagersPage } from '@/pages/managers-page'
import { ProjectsPage } from '@/pages/projects-page'
import { TeamPage } from '@/pages/team-page'
import { UsersPage } from '@/pages/users-page'
import { LeadsPage } from '@/pages/leads-page'
import { LeadDetailPage } from '@/pages/lead-detail-page'
import { ReportsPage } from '@/pages/reports-page'
import { IntegrationsPage } from '@/pages/integrations-page'
import { UnauthorizedPage } from '@/pages/unauthorized-page'
import { NotFoundPage } from '@/pages/not-found-page'

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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    organizationsRoute,
    managersRoute,
    projectsRoute,
    teamRoute,
    usersRoute,
    leadsRoute,
    leadDetailRoute,
    reportsRoute,
    integrationsRoute,
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
