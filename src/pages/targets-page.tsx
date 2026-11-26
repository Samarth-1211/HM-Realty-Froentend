import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { TargetProgressCard } from '@/components/targets/target-progress-card'
import { TeamTargetsTable } from '@/components/targets/team-targets-table'
import { TargetStatusPanel } from '@/components/targets/target-status-panel'
import { currentPeriod, formatPeriod, shiftPeriod, type TargetPeriod } from '@/components/targets/target-utils'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'

type TeamTab = 'status' | 'set'

export function TargetsPage() {
  const user = useAuthStore((s) => s.user)
  const [period, setPeriod] = useState<TargetPeriod>(currentPeriod)
  const [teamTab, setTeamTab] = useState<TeamTab>('status')

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
            ? 'Set day, week, month or custom-date targets, and see who has completed them and who hasn’t.'
            : setsTargets
              ? 'Your targets, and the targets you set for your team.'
              : 'Your targets — your check-out report counts toward them, and you can add the leads behind your work.'
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
        {setsTargets && (
          <div className="flex flex-col gap-4">
            <Tabs
              tabs={[
                { value: 'status', label: 'Target status' },
                { value: 'set', label: isAdmin ? 'Set targets' : 'Team targets' },
              ]}
              active={teamTab}
              onChange={(v) => setTeamTab(v as TeamTab)}
            />
            {teamTab === 'status' ? (
              <TargetStatusPanel period={period} />
            ) : (
              <TeamTargetsTable period={period} isAdmin={isAdmin} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
