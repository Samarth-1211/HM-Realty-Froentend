import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { ROLE_LABELS } from '@/lib/constants'
import { SuperAdminDashboard } from './super-admin-dashboard'
import { AdminDashboard } from './admin-dashboard'
import { ManagerDashboard } from './manager-dashboard'
import { StaffDashboard } from './staff-dashboard'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description={`${ROLE_LABELS[user.role]} workspace — live data, refreshed automatically.`}
      />
      {user.role === UserRole.SUPER_ADMIN && <SuperAdminDashboard />}
      {user.role === UserRole.ADMIN && <AdminDashboard />}
      {user.role === UserRole.MANAGER && <ManagerDashboard />}
      {(user.role === UserRole.PRESALES ||
        user.role === UserRole.POSTSALES ||
        user.role === UserRole.AGENT) && <StaffDashboard />}
    </div>
  )
}
