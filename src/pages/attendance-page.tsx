import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { CheckInCard } from '@/components/attendance/check-in-card'
import { AttendanceHistoryList } from '@/components/attendance/attendance-history-list'
import { MyLeaveList } from '@/components/attendance/my-leave-list'
import { TeamAttendanceTable } from '@/components/attendance/team-attendance-table'
import { LeaveApprovalsList } from '@/components/attendance/leave-approvals-list'
import { useAuthStore } from '@/store/auth-store'
import { UserRole } from '@/types'

export function AttendancePage() {
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === UserRole.MANAGER
  const [tab, setTab] = useState('mine')

  return (
    <div>
      <PageHeader title="Attendance" description="Check in daily, apply for leave, and track your record." />

      {isManager && (
        <div className="mb-5">
          <Tabs
            tabs={[
              { value: 'mine', label: 'My Attendance' },
              { value: 'team', label: 'Team Attendance' },
              { value: 'approvals', label: 'Leave Approvals' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>
      )}

      {(!isManager || tab === 'mine') && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CheckInCard />
            <MyLeaveList />
          </div>
          <AttendanceHistoryList />
        </div>
      )}

      {isManager && tab === 'team' && <TeamAttendanceTable />}
      {isManager && tab === 'approvals' && <LeaveApprovalsList />}
    </div>
  )
}
