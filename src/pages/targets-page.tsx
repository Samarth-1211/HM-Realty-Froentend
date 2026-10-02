import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { TargetProgressCard } from '@/components/targets/target-progress-card'
import { TeamTargetsTable } from '@/components/targets/team-targets-table'
import { currentPeriod, formatPeriod, shiftPeriod, type TargetPeriod } from '@/components/targets/target-utils'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'

export function TargetsPage() {
  const user = useAuthStore((s) => s.user)
  const [period, setPeriod] = useState<TargetPeriod>(currentPeriod)

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
  const setsTargets = isAdmin || user?.role === UserRole.MANAGER
  const now = currentPeriod()
  const isCurrent = period.year === now.year && period.month === now.month

  return (
    <div>
      <PageHeader
        title="Targets"
        description={
          isAdmin
            ? 'Set monthly targets for Managers and their teams, and track actual vs target.'
            : 'Monthly targets and actual-vs-target progress.'
        }
        actions={
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <Button variant="ghost" size="icon" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} title="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium text-slate-700">{formatPeriod(period)}</span>
            <Button variant="ghost" size="icon" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} title="Next month">
              <ChevronRight className="size-4" />
            </Button>
            {!isCurrent && (
              <Button variant="ghost" size="sm" onClick={() => setPeriod(now)}>
                This month
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Admins set targets rather than carry one. */}
        {!isAdmin && <TargetProgressCard period={period} />}
        {setsTargets && <TeamTargetsTable period={period} isAdmin={isAdmin} />}
      </div>
    </div>
  )
}
