import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { TeamAttendanceTable } from '@/components/attendance/team-attendance-table'
import { LeaveApprovalsList } from '@/components/attendance/leave-approvals-list'
import { TeamActivityList } from '@/components/activities/team-activity-list'

export function OrgAttendancePage() {
  const [tab, setTab] = useState('attendance')

  return (
    <div>
      <PageHeader
        title="Org Attendance"
        description="Organization-wide attendance and leave applications, including managers."
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { value: 'attendance', label: 'Org Attendance' },
            { value: 'activity', label: 'Org Activity' },
            { value: 'leave', label: 'All Leave Applications' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'attendance' && <TeamAttendanceTable scope="org" />}
      {tab === 'activity' && <TeamActivityList scope="org" />}
      {tab === 'leave' && <LeaveApprovalsList scope="org" />}
    </div>
  )
}
