import { useState } from 'react'
import { CalendarOff, Check, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { StatusPill } from '@/components/ui/badge'
import { useApproveLeave, useOrgLeaveRequests, useRejectLeave, useTeamPendingLeave } from '@/hooks/queries/use-leave'
import { LEAVE_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatEnumLabel } from '@/lib/utils'
import { LeaveStatus } from '@/types'

const STATUS_FILTERS: { value: LeaveStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: LeaveStatus.PENDING, label: 'Pending' },
  { value: LeaveStatus.APPROVED, label: 'Approved' },
  { value: LeaveStatus.REJECTED, label: 'Rejected' },
  { value: LeaveStatus.CANCELLED, label: 'Cancelled' },
]

export function LeaveApprovalsList({ scope = 'team' }: { scope?: 'team' | 'org' }) {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL')
  const teamQuery = useTeamPendingLeave(scope === 'team')
  const orgQuery = useOrgLeaveRequests(statusFilter === 'ALL' ? undefined : statusFilter, scope === 'org')
  const { data: requests, isLoading } = scope === 'org' ? orgQuery : teamQuery
  const approve = useApproveLeave()
  const reject = useRejectLeave()

  return (
    <Card>
      <CardHeader
        title={scope === 'org' ? 'All leave applications' : 'Pending leave approvals'}
        subtitle={scope === 'org' ? 'Every leave request across the org' : 'Requests from your direct reports'}
        action={
          scope === 'org' && (
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'ALL')}
              className="max-w-[160px]"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          )
        }
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !requests || requests.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title={scope === 'org' ? 'No leave requests found' : 'No pending leave requests'}
            description={scope === 'org' ? 'Try a different status filter.' : "You're all caught up."}
          />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <Avatar
                  firstName={r.user?.firstName ?? ''}
                  lastName={r.user?.lastName ?? ''}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Team member'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)} · {r.reason}
                  </p>
                </div>
                {r.status === LeaveStatus.PENDING ? (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={approve.isPending}
                      onClick={() => approve.mutate({ id: r.id })}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={reject.isPending}
                      onClick={() => reject.mutate({ id: r.id })}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <StatusPill label={formatEnumLabel(r.status)} className={LEAVE_STATUS_COLORS[r.status] ?? ''} />
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
