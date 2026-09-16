import { FolderKanban, UserCog, Users2, Contact } from 'lucide-react'
import { useManagers } from '@/hooks/queries/use-managers'
import { useProjects } from '@/hooks/queries/use-projects'
import { useUsers } from '@/hooks/queries/use-users'
import { useLeads } from '@/hooks/queries/use-leads'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { RecentLeadsTable } from '@/components/dashboard/recent-leads-table'
import { LeadAllocationCard } from '@/components/dashboard/lead-allocation-card'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button-link'
import { PageLoader } from '@/components/ui/spinner'
import type { LeadStatus } from '@/types'

export function AdminDashboard() {
  const { data: managers, isLoading: loadingManagers } = useManagers()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: users, isLoading: loadingUsers } = useUsers()
  const { data: leads = [], isLoading: loadingLeads } = useLeads()

  if (loadingManagers || loadingProjects || loadingUsers || loadingLeads) {
    return <PageLoader label="Loading organization overview…" />
  }

  const statusBreakdown = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1
      return acc
    },
    {} as Record<LeadStatus, number>,
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Managers" value={managers?.length ?? 0} icon={UserCog} tone="brand" delay={0} />
        <StatCard label="Projects" value={projects?.length ?? 0} icon={FolderKanban} tone="violet" delay={0.05} />
        <StatCard label="Org Users" value={users?.length ?? 0} icon={Users2} tone="sky" delay={0.1} />
        <StatCard label="Total leads" value={leads.length} icon={Contact} tone="emerald" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Lead pipeline" subtitle="Status breakdown across the organization" />
          <CardBody>
            <StatusDonut data={statusBreakdown} />
          </CardBody>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader
            title="Recent leads"
            subtitle="Latest activity across your organization"
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

      <LeadAllocationCard />
    </div>
  )
}
