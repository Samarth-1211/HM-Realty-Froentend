import { useState } from 'react'
import { CalendarOff, Check, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { StatusPill } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useApproveLeave, useOrgLeaveRequests, useRejectLeave, useTeamPendingLeave } from '@/hooks/queries/use-leave'
import { LEAVE_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatEnumLabel } from '@/lib/utils'
import { LeaveStatus, type LeaveRequest } from '@/types'

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
  const [review, setReview] = useState<{ action: 'approve' | 'reject'; request: LeaveRequest } | null>(null)

  const reviewName = review?.request.user
    ? `${review.request.user.firstName} ${review.request.user.lastName}`
    : 'this team member'
  const reviewDates = review ? `${formatDate(review.request.startDate)} – ${formatDate(review.request.endDate)}` : ''

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
                      onClick={() => setReview({ action: 'approve', request: r })}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setReview({ action: 'reject', request: r })}
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

      {review && (
        <ConfirmDialog
          open
          onClose={() => setReview(null)}
          title={review.action === 'approve' ? `Approve leave for ${reviewName}?` : `Reject leave for ${reviewName}?`}
          description={
            review.action === 'approve'
              ? `${reviewDates} will be marked as approved leave on their attendance record. This decision is final — it cannot be changed afterwards.`
              : `${reviewDates} will be marked as rejected and they will need to re-apply. This decision is final — it cannot be changed afterwards.`
          }
          confirmLabel={review.action === 'approve' ? 'Approve' : 'Reject'}
          variant={review.action === 'approve' ? 'primary' : 'danger'}
          requireReason
          reasonLabel={review.action === 'approve' ? 'Comment (optional)' : 'Reason for rejection (optional)'}
          loading={approve.isPending || reject.isPending}
          onConfirm={(comment) => {
            const mutation = review.action === 'approve' ? approve : reject
            mutation.mutate(
              { id: review.request.id, payload: comment ? { comment } : undefined },
              { onSuccess: () => setReview(null) },
            )
          }}
        />
      )}
    </Card>
  )
}
