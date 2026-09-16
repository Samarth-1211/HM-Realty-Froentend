import { useState } from 'react'
import { Target as TargetIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { SetTargetModal } from './set-target-modal'
import { useTeamTargets } from '@/hooks/queries/use-targets'
import { formatEnumLabel } from '@/lib/utils'

export function TeamTargetsTable() {
  const { data: rows, isLoading } = useTeamTargets()
  const [selected, setSelected] = useState<{ userId: string; fullName: string } | null>(null)

  return (
    <Card>
      <CardHeader title="Team targets" subtitle="Current month — target vs actual per team member" />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !rows || rows.length === 0 ? (
          <EmptyState icon={TargetIcon} title="No team members yet" />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.userId} className="flex items-center gap-3 py-3">
                <Avatar firstName={r.fullName.split(' ')[0] ?? ''} lastName={r.fullName.split(' ')[1] ?? ''} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.fullName}</p>
                  {r.metric ? (
                    r.callTrackingComingSoon ? (
                      <p className="text-xs text-slate-400">
                        {formatEnumLabel(r.metric)} target: {r.targetValue}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {formatEnumLabel(r.metric)}: {r.actualValue} / {r.targetValue}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-slate-400">No target set</p>
                  )}
                </div>
                {r.callTrackingComingSoon && <Badge variant="warning">Coming soon</Badge>}
                <Button size="sm" variant="secondary" onClick={() => setSelected({ userId: r.userId, fullName: r.fullName })}>
                  {r.metric ? 'Update' : 'Set target'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
      <SetTargetModal open={!!selected} onClose={() => setSelected(null)} employee={selected} />
    </Card>
  )
}
