import { LayoutGrid } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useTeamRollup } from '@/hooks/queries/use-employees'
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '@/lib/constants'
import { formatEnumLabel, formatRoleLabel } from '@/lib/utils'

export function TeamRollupPanel() {
  const { data: rows, isLoading } = useTeamRollup()

  return (
    <Card>
      <CardHeader
        title="Today's team pulse"
        subtitle="Attendance, lead snapshot, and target progress — one view per team member"
      />
      <CardBody className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={LayoutGrid} title="No team members yet" />
          </div>
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Team member</th>
                  <th className="px-5 py-3 font-medium">Attendance today</th>
                  <th className="px-5 py-3 font-medium">Active leads</th>
                  <th className="px-5 py-3 font-medium">Converted</th>
                  <th className="px-5 py-3 font-medium">Target progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.userId}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={r.fullName.split(' ')[0] ?? ''} lastName={r.fullName.split(' ')[1] ?? ''} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800">{r.fullName}</p>
                          <p className="text-xs text-slate-400">{formatRoleLabel(r.role)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {r.attendanceToday ? (
                        <Badge className={ATTENDANCE_STATUS_COLORS[r.attendanceToday]} variant="neutral">
                          {ATTENDANCE_STATUS_LABELS[r.attendanceToday] ?? r.attendanceToday}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Not checked in yet</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.leadSnapshot.inProgress}</td>
                    <td className="px-5 py-3 text-slate-600">{r.leadSnapshot.converted}</td>
                    <td className="px-5 py-3">
                      {r.target?.metric ? (
                        r.target.callTrackingComingSoon ? (
                          <Badge variant="warning">Calls — coming soon</Badge>
                        ) : (
                          <span className="text-slate-600">
                            {formatEnumLabel(r.target.metric)}: {r.target.actualValue} / {r.target.targetValue}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">No target set</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
