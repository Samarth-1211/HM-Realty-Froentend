import { CalendarDays } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useMyAttendance } from '@/hooks/queries/use-attendance'
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

const BADGE_VARIANT: Record<string, 'success' | 'warning' | 'brand' | 'danger'> = {
  PRESENT: 'success',
  HALF_DAY: 'warning',
  ON_SITE_VISIT: 'brand',
  ON_LEAVE: 'brand',
  ABSENT: 'danger',
}

export function AttendanceHistoryList() {
  const { data: records, isLoading } = useMyAttendance()

  return (
    <Card>
      <CardHeader title="This month's attendance" subtitle="Your day-by-day record" />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !records || records.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No attendance recorded yet"
            description="Check in from your dashboard to start building your attendance record."
          />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium text-slate-700">{formatDate(r.date)}</p>
                <div className="flex items-center gap-3">
                  {r.checkInAt && (
                    <span className="text-xs text-slate-400">
                      {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(
                        new Date(r.checkInAt),
                      )}
                    </span>
                  )}
                  <Badge variant={BADGE_VARIANT[r.status] ?? 'brand'}>
                    {ATTENDANCE_STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
