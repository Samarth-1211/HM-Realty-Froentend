import { PageHeader } from '@/components/ui/page-header'
import { TargetProgressCard } from '@/components/targets/target-progress-card'
import { TeamTargetsTable } from '@/components/targets/team-targets-table'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'

export function TargetsPage() {
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === UserRole.MANAGER

  return (
    <div>
      <PageHeader title="Targets" description="Monthly targets and actual-vs-target progress." />

      <div className="flex flex-col gap-6">
        <TargetProgressCard />
        {isManager && <TeamTargetsTable />}
      </div>
    </div>
  )
}
