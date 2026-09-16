import { CalendarOff, Check, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useApproveLeave, useRejectLeave, useTeamPendingLeave } from '@/hooks/queries/use-leave'
import { formatDate } from '@/lib/utils'

export function LeaveApprovalsList() {
  const { data: requests, isLoading } = useTeamPendingLeave()
  const approve = useApproveLeave()
  const reject = useRejectLeave()

  return (
    <Card>
      <CardHeader title="Pending leave approvals" subtitle="Requests from your direct reports" />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !requests || requests.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No pending leave requests" description="You're all caught up." />
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
                  <Button size="sm" variant="danger" loading={reject.isPending} onClick={() => reject.mutate({ id: r.id })}>
                    <X className="size-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
