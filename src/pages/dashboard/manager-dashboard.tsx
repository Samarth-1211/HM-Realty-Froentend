import { PhoneCall, TrendingUp, UsersRound } from 'lucide-react'
import { useTeamSummary } from '@/hooks/queries/use-employees'
import { useLeads } from '@/hooks/queries/use-leads'
import { StatCard } from '@/components/dashboard/stat-card'
import { WorkloadBar } from '@/components/dashboard/workload-bar'
import { RecentLeadsTable } from '@/components/dashboard/recent-leads-table'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button-link'
import { PageLoader } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'

export function ManagerDashboard() {
  const { data: team, isLoading: loadingTeam } = useTeamSummary()
  const { data: leads = [], isLoading: loadingLeads } = useLeads()

  if (loadingTeam || loadingLeads) return <PageLoader label="Loading your team overview…" />

  const members = team ?? []
  const totalActiveLeads = members.reduce((sum, m) => sum + m.activeLeadCount, 0)
  const totalCalls = members.reduce((sum, m) => sum + m.totalCallsMock, 0)
  const chartData = members.map((m) => ({ name: m.fullName.split(' ')[0], leads: m.activeLeadCount }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Team members" value={members.length} icon={UsersRound} tone="brand" delay={0} />
        <StatCard label="Active leads (team)" value={totalActiveLeads} icon={TrendingUp} tone="violet" delay={0.05} />
        <StatCard label="Calls logged (mock)" value={totalCalls} icon={PhoneCall} tone="sky" delay={0.1} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Team workload" subtitle="Active leads per team member" />
          <CardBody>
            <WorkloadBar data={chartData} />
          </CardBody>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader
            title="Team"
            subtitle="Direct reports and their current load"
            action={
              <ButtonLink to="/team" variant="secondary" size="sm">
                Manage team
              </ButtonLink>
            }
          />
          <CardBody className="flex flex-col gap-1 p-3">
            {members.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-slate-400">No team members yet.</p>
            )}
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50">
                <Avatar firstName={m.fullName.split(' ')[0] ?? ''} lastName={m.fullName.split(' ')[1] ?? ''} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{m.fullName}</p>
                  <p className="text-xs text-slate-400">{m.role}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{m.activeLeadCount} active</p>
                  <p>{m.totalCallsMock} calls</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent leads"
          subtitle="Latest leads across the organization"
          action={
            <ButtonLink to="/leads" variant="secondary" size="sm">
              View all leads
            </ButtonLink>
          }
        />
        <CardBody className="p-0 pt-4">
          <RecentLeadsTable leads={leads.slice(0, 6)} />
        </CardBody>
      </Card>
    </div>
  )
}
