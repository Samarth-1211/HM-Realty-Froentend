import { Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useMyTarget } from '@/hooks/queries/use-targets'
import { formatPeriod, TARGET_METRIC_HINTS, TARGET_METRIC_LABELS, targetPercent, type TargetPeriod } from './target-utils'

export function TargetProgressCard({ period }: { period?: TargetPeriod }) {
  const { data: progress, isLoading } = useMyTarget(period ?? {})

  const monthLabel = progress ? formatPeriod({ year: progress.periodYear, month: progress.periodMonth }) : ''

  return (
    <Card>
      <CardHeader title="My target" subtitle={monthLabel} />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !progress?.metric || progress.targetValue === null ? (
          <EmptyState icon={TargetIcon} title="No target set" description="No target has been set for you for this month yet." />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900">
                {progress.actualValue ?? 0} <span className="text-sm font-normal text-slate-400">/ {progress.targetValue}</span>
              </p>
              <Badge variant="brand">{TARGET_METRIC_LABELS[progress.metric]}</Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${Math.min(100, targetPercent(progress))}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {targetPercent(progress)}% · {TARGET_METRIC_HINTS[progress.metric]}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
