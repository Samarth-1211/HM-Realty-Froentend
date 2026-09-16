import { Building2, CheckCircle2, PauseCircle, Archive } from 'lucide-react'
import { useOrganizations } from '@/hooks/queries/use-organizations'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { OrgStatusBadge } from '@/components/leads/lead-status-badge'
import { ButtonLink } from '@/components/ui/button-link'
import { PageLoader } from '@/components/ui/spinner'
import type { Organization } from '@/types'
import { formatDate, formatEnumLabel } from '@/lib/utils'

export function SuperAdminDashboard() {
  const { data: orgs, isLoading } = useOrganizations()

  if (isLoading) return <PageLoader label="Loading platform overview…" />

  const list = orgs ?? []
  const active = list.filter((o) => o.status === 'ACTIVE').length
  const suspended = list.filter((o) => o.status === 'SUSPENDED').length
  const archived = list.filter((o) => o.status === 'ARCHIVED').length

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'Organization',
      render: (o) => (
        <div>
          <p className="font-medium text-slate-800">{o.name}</p>
          <p className="text-xs text-slate-400">{o.contactEmail}</p>
        </div>
      ),
    },
    { key: 'plan', header: 'Plan', render: (o) => <span className="text-slate-500">{formatEnumLabel(o.plan)}</span> },
    { key: 'status', header: 'Status', render: (o) => <OrgStatusBadge status={o.status} /> },
    { key: 'created', header: 'Created', render: (o) => <span className="text-slate-400">{formatDate(o.createdAt)}</span> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Organizations" value={list.length} icon={Building2} tone="brand" delay={0} />
        <StatCard label="Active" value={active} icon={CheckCircle2} tone="emerald" delay={0.05} />
        <StatCard label="Suspended" value={suspended} icon={PauseCircle} tone="amber" delay={0.1} />
        <StatCard label="Archived" value={archived} icon={Archive} tone="rose" delay={0.15} />
      </div>

      <Card>
        <CardHeader
          title="Recent organizations"
          subtitle="Tenants onboarded onto the platform"
          action={
            <ButtonLink to="/organizations" variant="secondary" size="sm">
              Manage all
            </ButtonLink>
          }
        />
        <CardBody className="p-0 pt-4">
          <DataTable
            columns={columns}
            data={list.slice(0, 6)}
            rowKey={(o) => o.id}
            emptyIcon={Building2}
            emptyTitle="No organizations yet"
            emptyDescription="Create your first tenant organization to get started."
          />
        </CardBody>
      </Card>
    </div>
  )
}
