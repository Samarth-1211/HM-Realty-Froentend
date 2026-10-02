import { useState } from 'react'
import { Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { SetTargetModal } from './set-target-modal'
import { currentPeriod, TARGET_METRIC_LABELS, targetPercent, type TargetPeriod } from './target-utils'
import { useTeamTargets } from '@/hooks/queries/use-targets'
import { formatRoleLabel } from '@/lib/utils'
import type { TargetProgress } from '@/types'

export function TeamTargetsTable({ period = currentPeriod(), isAdmin = false }: { period?: TargetPeriod; isAdmin?: boolean }) {
  const { data: rows, isLoading } = useTeamTargets(period)
  const [selected, setSelected] = useState<TargetProgress | null>(null)

  return (
    <Card>
      <CardHeader
        title={isAdmin ? 'Organization targets' : 'Team targets'}
        subtitle={isAdmin ? 'Every Manager and sales executive — target vs actual' : 'Target vs actual per team member'}
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !rows || rows.length === 0 ? (
          <EmptyState icon={TargetIcon} title={isAdmin ? 'No Managers or executives yet' : 'No team members yet'} />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((r) => {
              const percent = targetPercent(r)
              return (
                <div key={r.userId} className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
                  <Avatar firstName={r.fullName.split(' ')[0] ?? ''} lastName={r.fullName.split(' ')[1] ?? ''} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {r.fullName}
                      {isAdmin && <span className="ml-1.5 text-xs font-normal text-slate-400">{formatRoleLabel(r.role)}</span>}
                    </p>
                    {r.metric ? (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={percent >= 100 ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-brand-600'}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">
                          {TARGET_METRIC_LABELS[r.metric]}: {r.actualValue ?? 0} / {r.targetValue}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No target set</p>
                    )}
                  </div>
                  {r.metric && percent >= 100 && <Badge variant="success">Achieved</Badge>}
                  <Button size="sm" variant="secondary" onClick={() => setSelected(r)}>
                    {r.metric ? 'Update' : 'Set target'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
      <SetTargetModal open={!!selected} onClose={() => setSelected(null)} employee={selected} period={period} />
    </Card>
  )
}
