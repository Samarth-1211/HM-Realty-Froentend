import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { UsersRound } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { WorkReport } from './work-report'
import { useOrgAttendance, useTeamAttendance } from '@/hooks/queries/use-attendance'
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { cn, formatRoleLabel, formatTime } from '@/lib/utils'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const BADGE_VARIANT: Record<string, 'success' | 'warning' | 'brand' | 'danger' | 'neutral'> = {
  PRESENT: 'success',
  HALF_DAY: 'warning',
  ON_SITE_VISIT: 'brand',
  ON_LEAVE: 'brand',
  ABSENT: 'danger',
}

export function TeamAttendanceTable({ scope = 'team' }: { scope?: 'team' | 'org' }) {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayIso())
  const teamQuery = useTeamAttendance(date, scope === 'team')
  const orgQuery = useOrgAttendance(date, scope === 'org')
  const { data: rows, isLoading } = scope === 'org' ? orgQuery : teamQuery
  const isToday = date === todayIso()

  return (
    <Card>
      <CardHeader
        title={scope === 'org' ? 'Organization attendance' : 'Team attendance'}
        subtitle={
          scope === 'org'
            ? 'Everyone across the org for the selected day — click someone for their full details'
            : "Your direct reports' attendance for the selected day"
        }
        action={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[160px]" />}
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !rows || rows.length === 0 ? (
          <EmptyState icon={UsersRound} title="No team members yet" />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((r) => (
              <div
                key={r.userId}
                onClick={scope === 'org' ? () => navigate({ to: '/users/$userId', params: { userId: r.userId } }) : undefined}
                className={cn('py-2.5', scope === 'org' && '-mx-2 cursor-pointer rounded-xl px-2 hover:bg-slate-50')}
              >
                <div className="flex items-center gap-3">
                  <Avatar firstName={r.fullName.split(' ')[0] ?? ''} lastName={r.fullName.split(' ')[1] ?? ''} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{r.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {formatRoleLabel(r.role)}
                      {r.checkInAt && ` · In ${formatTime(r.checkInAt)}`}
                      {r.checkOutAt && ` · Out ${formatTime(r.checkOutAt)}`}
                    </p>
                  </div>
                  {r.status ? (
                    <Badge variant={BADGE_VARIANT[r.status] ?? 'neutral'}>
                      {ATTENDANCE_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">{isToday ? 'Not checked in yet' : 'No record'}</Badge>
                  )}
                </div>
                <WorkReport summary={r.checkOutSummary} workedLeads={r.workedLeads} className="mt-1.5 pl-10" />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
