import { useState } from 'react'
import { ClipboardList, Contact } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useOrgActivities, useTeamActivities } from '@/hooks/queries/use-activities'
import { EMPLOYEE_ACTIVITY_OPTIONS } from '@/lib/constants'
import { formatDateTime, formatRoleLabel } from '@/lib/utils'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function TeamActivityList({ scope = 'team' }: { scope?: 'team' | 'org' }) {
  const [date, setDate] = useState(todayIso())
  const teamQuery = useTeamActivities(date, scope === 'team')
  const orgQuery = useOrgActivities(date, scope === 'org')
  const { data: rows, isLoading } = scope === 'org' ? orgQuery : teamQuery

  return (
    <Card>
      <CardHeader
        title={scope === 'org' ? 'Organization activity' : 'Team activity'}
        subtitle={
          scope === 'org'
            ? "What everyone across the org logged for the selected day"
            : "What your direct reports logged for the selected day"
        }
        action={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[160px]" />}
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !rows || rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No team members yet" />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.userId} className="flex items-start gap-3 py-3">
                <Avatar firstName={r.fullName.split(' ')[0] ?? ''} lastName={r.fullName.split(' ')[1] ?? ''} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{r.fullName}</p>
                  <p className="text-xs text-slate-400">{formatRoleLabel(r.role)}</p>
                  {r.activities.length === 0 ? (
                    <p className="mt-1.5 text-xs text-slate-400">Nothing logged</p>
                  ) : (
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {r.activities.map((activity) => {
                        const preset = EMPLOYEE_ACTIVITY_OPTIONS.find((o) => o.value === activity.type)
                        return (
                          <div key={activity.id} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                            <span>{preset?.emoji}</span>
                            <span className="font-medium">{preset?.label ?? activity.type}</span>
                            {activity.description && <span className="text-slate-400">— {activity.description}</span>}
                            {activity.lead && (
                              <Badge variant="brand">
                                <Contact className="size-3" />
                                {activity.lead.fullName}
                              </Badge>
                            )}
                            <span className="text-slate-300">{formatDateTime(activity.occurredAt)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
