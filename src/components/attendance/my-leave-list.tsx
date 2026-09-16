import { useState } from 'react'
import { CalendarOff, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { ApplyLeaveModal } from './apply-leave-modal'
import { useMyLeaveRequests } from '@/hooks/queries/use-leave'
import { LEAVE_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatEnumLabel } from '@/lib/utils'

export function MyLeaveList() {
  const { data: requests, isLoading } = useMyLeaveRequests()
  const [applyOpen, setApplyOpen] = useState(false)

  return (
    <Card>
      <CardHeader
        title="My leave requests"
        subtitle="Applied leave and its approval status"
        action={
          <Button size="sm" onClick={() => setApplyOpen(true)}>
            <Plus className="size-4" />
            Apply for leave
          </Button>
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
            title="No leave requests yet"
            description="Apply for leave and your Manager will review it here."
          />
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </p>
                  <p className="truncate text-xs text-slate-400">{r.reason}</p>
                  {r.reviewComment && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">Manager: {r.reviewComment}</p>
                  )}
                </div>
                <Badge className={LEAVE_STATUS_COLORS[r.status]} variant="neutral">
                  {formatEnumLabel(r.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
      <ApplyLeaveModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </Card>
  )
}
