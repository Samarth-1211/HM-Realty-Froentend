import { useState } from 'react'
import { CalendarCheck, Clock, MapPinned } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCheckIn, useCheckOut, useTodayAttendance } from '@/hooks/queries/use-attendance'
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { AttendanceStatus } from '@/types'

const DAY_TYPES: { value: string; label: string }[] = [
  { value: AttendanceStatus.PRESENT, label: 'Present' },
  { value: AttendanceStatus.HALF_DAY, label: 'Half-day' },
  { value: AttendanceStatus.ON_SITE_VISIT, label: 'On-site visit' },
]

export function CheckInCard() {
  const { data: today, isLoading } = useTodayAttendance()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const [dayType, setDayType] = useState<string>(AttendanceStatus.PRESENT)
  const [confirmCheckOut, setConfirmCheckOut] = useState(false)

  return (
    <Card>
      <CardHeader
        title="Today's attendance"
        subtitle={new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date())}
      />
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : today ? (
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="size-5" />
            </div>
            <div className="flex-1">
              <Badge variant="success">{ATTENDANCE_STATUS_LABELS[today.status] ?? today.status}</Badge>
              {today.checkInAt && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="size-3" />
                  Checked in at{' '}
                  {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(today.checkInAt),
                  )}
                </p>
              )}
              {today.checkOutAt ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="size-3" />
                  Checked out at{' '}
                  {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(today.checkOutAt),
                  )}
                </p>
              ) : (
                today.markedBy === 'EMPLOYEE' && (
                  <Button
                    variant="danger"
                    className="mt-2"
                    loading={checkOut.isPending}
                    onClick={() => setConfirmCheckOut(true)}
                  >
                    Check Out
                  </Button>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">You haven't checked in yet today.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={dayType} onChange={(e) => setDayType(e.target.value)} className="sm:max-w-[200px]">
                {DAY_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
              <Button
                loading={checkIn.isPending}
                onClick={() => checkIn.mutate({ dayType: dayType as 'PRESENT' | 'HALF_DAY' | 'ON_SITE_VISIT' })}
              >
                <MapPinned className="size-4" />
                Check In
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Not checked in by end of day counts as{' '}
              <span className={`rounded px-1 py-0.5 font-medium ${ATTENDANCE_STATUS_COLORS.ABSENT}`}>Absent</span>.
            </p>
          </div>
        )}
      </CardBody>
      <ConfirmDialog
        open={confirmCheckOut}
        onClose={() => setConfirmCheckOut(false)}
        onConfirm={() => {
          checkOut.mutate()
          setConfirmCheckOut(false)
        }}
        loading={checkOut.isPending}
        title="Check out for today?"
        description="You won't be able to log any more activity against today's attendance after this."
        confirmLabel="Check Out"
        variant="danger"
      />
    </Card>
  )
}
