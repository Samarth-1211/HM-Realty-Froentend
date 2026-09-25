import { useState } from 'react'
import { CheckCircle2, TrendingUp, UsersRound } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { PageLoader } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { EmployeeActivityReport } from '@/components/reports/employee-activity-report'
import { TeamPerformanceReport } from '@/components/reports/team-performance-report'
import { useEmployeeSummary, useTeamSummary } from '@/hooks/queries/use-employees'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES } from '@/lib/constants'
import { UserRole, type TeamSummaryItem } from '@/types'
import { formatRoleLabel } from '@/lib/utils'

const REPORT_TABS = [
  { value: 'PIPELINE', label: 'Pipeline' },
  { value: 'ACTIVITY', label: 'Daily / Weekly / Monthly Activity' },
  { value: 'TEAM_PERFORMANCE', label: 'Team Performance' },
] as const

export function ReportsPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<(typeof REPORT_TABS)[number]['value']>('PIPELINE')
  if (!user) return null

  const canSeeTeamPerformance = ASSIGNER_ROLES.includes(user.role)
  const tabs = REPORT_TABS.filter((t) => t.value !== 'TEAM_PERFORMANCE' || canSeeTeamPerformance)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Pipeline performance and day-by-day activity, per employee."
        actions={<Tabs tabs={[...tabs]} active={tab} onChange={(v) => setTab(v as typeof tab)} />}
      />

      {tab === 'ACTIVITY' ? (
        <EmployeeActivityReport />
      ) : tab === 'TEAM_PERFORMANCE' && canSeeTeamPerformance ? (
        <TeamPerformanceReport />
      ) : user.role === UserRole.MANAGER ? (
        <ManagerReports />
      ) : user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? (
        <PrivilegedReports />
      ) : (
        <SelfReport userId={user.id} />
      )}
    </div>
  )
}

function ManagerReports() {
  const { data: team, isLoading } = useTeamSummary()
  const [selected, setSelected] = useState<string | null>(null)
  const { data: summary } = useEmployeeSummary(selected ?? undefined)

  const columns: Column<TeamSummaryItem>[] = [
    {
      key: 'name',
      header: 'Team member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={m.fullName.split(' ')[0] ?? ''} lastName={m.fullName.split(' ')[1] ?? ''} size="sm" />
          <div>
            <p className="font-medium text-slate-800">{m.fullName}</p>
            <p className="text-xs text-slate-400">{formatRoleLabel(m.role)}</p>
          </div>
        </div>
      ),
    },
    { key: 'active', header: 'Active leads', render: (m) => <span className="font-medium text-slate-700">{m.activeLeadCount}</span> },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader title="Team summary" subtitle="Click a row to see full status breakdown" />
        <CardBody className="p-0 pt-4">
          <DataTable
            columns={columns}
            data={team ?? []}
            isLoading={isLoading}
            rowKey={(m) => m.userId}
            onRowClick={(m) => setSelected(m.userId)}
            emptyIcon={UsersRound}
            emptyTitle="No team members yet"
          />
        </CardBody>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader title={selected ? summary?.fullName ?? 'Loading…' : 'Select a member'} subtitle="Lead status breakdown" />
        <CardBody>
          {selected && summary ? (
            <StatusDonut data={summary.statusBreakdown} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              Pick a team member from the table to see their pipeline.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function PrivilegedReports() {
  const { data: users } = useUsers()
  const [selected, setSelected] = useState('')
  const { data: summary, isLoading } = useEmployeeSummary(selected || undefined)
  const staff = (users ?? []).filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN')

  return (
    <Card>
      <CardHeader
        title="Employee lookup"
        action={
          <Select value={selected} onChange={(e) => setSelected(e.target.value)} className="max-w-[220px]">
            <option value="">Select an employee…</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
        }
      />
      <CardBody>
        {!selected && (
          <p className="py-10 text-center text-sm text-slate-400">
            Select an employee above to view their performance summary.
          </p>
        )}
        {selected && isLoading && <PageLoader label="Loading summary…" />}
        {selected && summary && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Active workload" value={summary.activeWorkload} icon={TrendingUp} tone="brand" />
              <StatCard label="Conversions" value={summary.totalConversions} icon={CheckCircle2} tone="emerald" />
            </div>
            <StatusDonut data={summary.statusBreakdown} />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function SelfReport({ userId }: { userId: string }) {
  const { data: summary, isLoading } = useEmployeeSummary(userId)

  if (isLoading || !summary) return <PageLoader label="Loading your report…" />

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Active workload" value={summary.activeWorkload} icon={TrendingUp} tone="brand" />
        <StatCard label="Conversions" value={summary.totalConversions} icon={CheckCircle2} tone="emerald" />
      </div>
      <Card className="mt-6">
        <CardHeader title="Pipeline breakdown" />
        <CardBody>
          <StatusDonut data={summary.statusBreakdown} />
        </CardBody>
      </Card>
    </div>
  )
}
