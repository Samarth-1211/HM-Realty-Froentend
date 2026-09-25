import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Contact,
  FolderKanban,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { PageLoader } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { EmployeeActivityReport } from '@/components/reports/employee-activity-report'
import { UserAttendanceTab } from '@/components/users/user-attendance-tab'
import { UserLeadsTab } from '@/components/users/user-leads-tab'
import { useEmployeeOverview } from '@/hooks/queries/use-employees'
import {
  LEAVE_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_TYPE_LABELS,
} from '@/lib/constants'
import { formatDate, formatDateTime, formatEnumLabel, formatRoleLabel } from '@/lib/utils'
import type { EmployeeOverview } from '@/types'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'attendance', label: 'Check-in / Check-out' },
  { value: 'leads', label: 'Leads assigned' },
  { value: 'activity', label: 'Activity' },
  { value: 'leave-tasks', label: 'Leave & Tasks' },
] as const

type TabValue = (typeof TABS)[number]['value']

/** Admin view of everything about one user: profile, attendance reports, leads, activity, leave and tasks. */
export function UserDetailPage() {
  const { userId } = useParams({ from: '/_app/users/$userId' })
  const navigate = useNavigate()
  const { data, isLoading, isError } = useEmployeeOverview(userId)
  const [tab, setTab] = useState<TabValue>('overview')

  if (isLoading) return <PageLoader label="Loading user…" />
  if (isError || !data) {
    return (
      <EmptyState
        icon={UserRound}
        title="User not found"
        description="They may have been deleted, or you don't have access to their details."
        action={
          <Button variant="secondary" onClick={() => navigate({ to: '/users' })}>
            Back to users
          </Button>
        }
      />
    )
  }

  const { profile, leadSummary } = data
  const [firstName = '', ...rest] = profile.fullName.split(' ')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/users' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar firstName={firstName} lastName={rest.join(' ')} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-slate-900">{profile.fullName}</h2>
          <p className="truncate text-sm text-slate-500">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="brand">{formatRoleLabel(profile.role)}</Badge>
            <Badge variant={profile.isActive ? 'success' : 'neutral'}>{profile.isActive ? 'Active' : 'Inactive'}</Badge>
            <Badge variant={profile.isVerified ? 'success' : 'warning'}>
              {profile.isVerified ? 'Email verified' : 'Verification pending'}
            </Badge>
            {profile.isTemporaryPassword && <Badge variant="warning">Temporary password</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads assigned" value={leadSummary.total} icon={Contact} tone="brand" />
        <StatCard label="In progress" value={leadSummary.activeWorkload} icon={TrendingUp} tone="violet" delay={0.05} />
        <StatCard label="Converted" value={leadSummary.conversions} icon={CheckCircle2} tone="emerald" delay={0.1} />
        <StatCard label="Overdue follow-ups" value={leadSummary.overdueFollowUps} icon={AlertTriangle} tone="rose" delay={0.15} />
      </div>

      <Tabs
        tabs={TABS.map((t) => ({ ...t, count: t.value === 'leads' ? leadSummary.total : undefined }))}
        active={tab}
        onChange={(v) => setTab(v as TabValue)}
      />

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'attendance' && <UserAttendanceTab userId={userId} fullName={profile.fullName} />}
      {tab === 'leads' && <UserLeadsTab leads={data.leads} fullName={profile.fullName} />}
      {tab === 'activity' && <EmployeeActivityReport fixedEmployeeId={userId} />}
      {tab === 'leave-tasks' && <LeaveAndTasksTab data={data} />}
    </div>
  )
}

function OverviewTab({ data }: { data: EmployeeOverview }) {
  const navigate = useNavigate()
  const { profile, leadSummary, target, projects, directReports } = data

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader title="Profile" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email" value={profile.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phone ?? '—'} />
          <InfoRow icon={IdCard} label="Employee code" value={profile.employeeCode ?? '—'} />
          <InfoRow icon={UserRound} label="Reports to" value={profile.managerName ?? '—'} />
          <InfoRow icon={CalendarClock} label="Joined" value={formatDate(profile.joiningDate)} />
          <InfoRow icon={ShieldCheck} label="Account" value={profile.isActive ? 'Active' : 'Deactivated'} />
          <InfoRow icon={Mail} label="Email verification" value={profile.isVerified ? 'Verified' : 'Pending'} />
          <InfoRow
            icon={KeyRound}
            label="Password"
            value={profile.isTemporaryPassword ? 'Temporary (not changed yet)' : 'Set by user'}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Lead pipeline" subtitle={`${leadSummary.total} leads currently assigned`} />
        <CardBody>
          <StatusDonut data={leadSummary.statusBreakdown} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="This month's target" />
        <CardBody>
          {target.metric === null ? (
            <p className="text-sm text-slate-400">No target set for this month.</p>
          ) : (
            <div className="text-sm text-slate-600">
              <p>
                {formatEnumLabel(target.metric)} target:{' '}
                <span className="font-semibold text-slate-800">{target.targetValue}</span>
              </p>
              <p className="mt-1">
                Achieved:{' '}
                <span className="font-semibold text-slate-800">
                  {target.actualValue ?? 'Not tracked yet'}
                </span>
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Projects" subtitle="Projects this user is assigned to" />
        <CardBody className="flex flex-col gap-2">
          {projects.length === 0 && <p className="text-sm text-slate-400">Not assigned to any project.</p>}
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <FolderKanban className="size-4 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                  <MapPin className="size-3" />
                  {p.location ?? '—'} · {p.assignedAs.join(', ')}
                </p>
              </div>
              {!p.isActive && <Badge variant="neutral">Inactive</Badge>}
            </div>
          ))}
        </CardBody>
      </Card>

      {directReports.length > 0 && (
        <Card className="xl:col-span-2">
          <CardHeader title="Direct reports" subtitle="Click a team member to open their details" />
          <CardBody className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {directReports.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => navigate({ to: '/users/$userId', params: { userId: u.id } })}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50"
              >
                <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-400">{formatRoleLabel(u.role)}</p>
                </div>
                {!u.isActive && <Badge variant="neutral">Inactive</Badge>}
              </button>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function LeaveAndTasksTab({ data }: { data: EmployeeOverview }) {
  const navigate = useNavigate()
  const { leaveRequests, tasks } = data

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader title="Leave requests" subtitle={`${leaveRequests.length} total`} />
        <CardBody className="flex flex-col divide-y divide-slate-100 py-2">
          {leaveRequests.length === 0 && <p className="py-4 text-sm text-slate-400">No leave requests.</p>}
          {leaveRequests.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(l.startDate)} – {formatDate(l.endDate)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{l.reason}</p>
                {l.reviewedBy && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    Reviewed by {l.reviewedBy.firstName} {l.reviewedBy.lastName}
                    {l.reviewComment ? ` — “${l.reviewComment}”` : ''}
                  </p>
                )}
              </div>
              <StatusPill label={formatEnumLabel(l.status)} className={LEAVE_STATUS_COLORS[l.status] ?? ''} />
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tasks" subtitle={`${tasks.filter((t) => t.status === 'PENDING').length} pending`} />
        <CardBody className="flex flex-col divide-y divide-slate-100 py-2">
          {tasks.length === 0 && <p className="py-4 text-sm text-slate-400">No tasks.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {t.taskType ? `${TASK_TYPE_LABELS[t.taskType]} · ` : ''}
                  {t.dueAt ? `Due ${formatDateTime(t.dueAt)}` : 'No due date'}
                  {t.lead && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        onClick={() => navigate({ to: '/leads/$leadId', params: { leadId: t.lead!.id } })}
                        className="text-brand-600 hover:underline"
                      >
                        {t.lead.fullName}
                      </button>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill label={formatEnumLabel(t.status)} className={TASK_STATUS_COLORS[t.status] ?? ''} />
                {t.priority !== 'NORMAL' && (
                  <StatusPill label={TASK_PRIORITY_LABELS[t.priority]} className={TASK_PRIORITY_COLORS[t.priority] ?? ''} />
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
