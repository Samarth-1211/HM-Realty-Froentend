import { Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useMyTarget } from '@/hooks/queries/use-targets'
import { formatEnumLabel } from '@/lib/utils'

export function TargetProgressCard() {
  const { data: progress, isLoading } = useMyTarget()

  const monthLabel = progress
    ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
        new Date(progress.periodYear, progress.periodMonth - 1, 1),
      )
    : ''

  return (
    <Card>
      <CardHeader title="This month's target" subtitle={monthLabel} />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !progress?.metric || progress.targetValue === null ? (
          <EmptyState
            icon={TargetIcon}
            title="No target set yet"
            description="Your Manager hasn't set a target for you this month."
          />
        ) : progress.callTrackingComingSoon ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-600">
              Target: <span className="font-semibold text-slate-800">{progress.targetValue} calls</span>
            </p>
            <Badge variant="warning">Call tracking coming soon — actuals not available yet</Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900">
                {progress.actualValue} <span className="text-sm font-normal text-slate-400">/ {progress.targetValue}</span>
              </p>
              <Badge variant="brand">{formatEnumLabel(progress.metric)}</Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{
                  width: `${Math.min(100, Math.round(((progress.actualValue ?? 0) / progress.targetValue) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
