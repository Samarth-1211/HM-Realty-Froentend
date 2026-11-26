import { useState } from 'react'
import { Plus, Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useMyTargets } from '@/hooks/queries/use-targets'
import { AddProgressModal } from './add-progress-modal'
import { TargetDetailModal } from './target-detail-modal'
import { TargetRow } from './target-row'
import { formatPeriod, isRunningToday, periodRange, type TargetPeriod } from './target-utils'
import type { TargetProgress } from '@/types'

/** The signed-in employee's own targets for a month, with "Add progress" on the ones running today. */
export function TargetProgressCard({ period }: { period: TargetPeriod }) {
  const { data: targets = [], isLoading } = useMyTargets(periodRange(period))
  const [adding, setAdding] = useState<TargetProgress | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  // Running ones first, then upcoming, then the finished ones.
  const order = { IN_PROGRESS: 0, UPCOMING: 1, COMPLETED: 2, NOT_COMPLETED: 3 }
  const sorted = [...targets].sort(
    (a, b) => Number(!isRunningToday(a)) - Number(!isRunningToday(b)) || order[a.status] - order[b.status],
  )

  return (
    <Card>
      <CardHeader
        title="My targets"
        subtitle={`${formatPeriod(period)} — your check-out report counts toward them automatically`}
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={TargetIcon} title="No targets" description="No target has been set for you for this month yet." />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {sorted.map((t) => (
              <TargetRow
                key={t.id}
                target={t}
                actions={
                  <>
                    {isRunningToday(t) && (
                      <Button size="sm" onClick={() => setAdding(t)}>
                        <Plus className="size-4" />
                        Add progress
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setViewing(t.id)}>
                      Details
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </CardBody>
      <AddProgressModal target={adding} onClose={() => setAdding(null)} />
      <TargetDetailModal targetId={viewing} onClose={() => setViewing(null)} />
    </Card>
  )
}
