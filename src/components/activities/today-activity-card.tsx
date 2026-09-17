import { useState } from 'react'
import { ClipboardList, Contact, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { LogActivityModal } from './log-activity-modal'
import { useMyActivities } from '@/hooks/queries/use-activities'
import { useTodayAttendance } from '@/hooks/queries/use-attendance'
import { EMPLOYEE_ACTIVITY_OPTIONS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'

export function TodayActivityCard() {
  const { data: activities, isLoading } = useMyActivities()
  const { data: today } = useTodayAttendance()
  const [logOpen, setLogOpen] = useState(false)

  const canLog = !!today?.checkInAt && !today?.checkOutAt
  const gateReason = !today?.checkInAt
    ? 'Check in first to start logging activity for today.'
    : 'You have checked out for today — no more activity can be logged.'

  return (
    <Card>
      <CardHeader
        title="Today's activity"
        subtitle="What you've done today — calls, visits, follow-ups…"
        action={
          <Button size="sm" onClick={() => setLogOpen(true)} disabled={!canLog} title={canLog ? undefined : gateReason}>
            <Plus className="size-4" />
            Log activity
          </Button>
        }
      />
      <CardBody>
        {!canLog && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{gateReason}</p>}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : !activities || activities.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nothing logged yet today" description="Log a call, visit, or follow-up as you go." />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {activities.map((activity) => {
              const preset = EMPLOYEE_ACTIVITY_OPTIONS.find((o) => o.value === activity.type)
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2.5">
                  <span className="text-lg leading-none">{preset?.emoji ?? '•'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{preset?.label ?? activity.type}</p>
                    {activity.description && <p className="mt-0.5 text-xs text-slate-500">{activity.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400">{formatDateTime(activity.occurredAt)}</span>
                      {activity.lead && (
                        <Badge variant="brand">
                          <Contact className="size-3" />
                          {activity.lead.fullName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
      <LogActivityModal open={logOpen} onClose={() => setLogOpen(false)} />
    </Card>
  )
}
