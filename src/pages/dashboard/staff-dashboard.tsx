import { CheckCircle2, Contact, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useEmployeeSummary } from '@/hooks/queries/use-employees'
import { useLeads } from '@/hooks/queries/use-leads'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { RecentLeadsTable } from '@/components/dashboard/recent-leads-table'
import { CheckInCard } from '@/components/attendance/check-in-card'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ButtonLink } from '@/components/ui/button-link'
import { PageLoader } from '@/components/ui/spinner'

export function StaffDashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: summary, isLoading: loadingSummary } = useEmployeeSummary(user?.id)
  const { data: leads = [], isLoading: loadingLeads } = useLeads()

  if (loadingSummary || loadingLeads) return <PageLoader label="Loading your workspace…" />

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active workload"
          value={summary?.activeWorkload ?? 0}
          icon={TrendingUp}
          tone="brand"
          delay={0}
        />
        <StatCard
          label="Conversions"
          value={summary?.totalConversions ?? 0}
          icon={CheckCircle2}
          tone="emerald"
          delay={0.05}
        />
        <StatCard label="My leads" value={leads.length} icon={Contact} tone="sky" delay={0.1} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <CheckInCard />
        </div>

        <Card className="xl:col-span-3">
          <CardHeader title="My pipeline" subtitle="Status breakdown of your leads" />
          <CardBody>
            <StatusDonut data={summary?.statusBreakdown ?? {}} />
          </CardBody>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader
            title="My recent leads"
            subtitle="Leads currently assigned to you"
            action={
              <ButtonLink to="/leads" variant="secondary" size="sm">
                View all
              </ButtonLink>
            }
          />
          <CardBody className="p-0 pt-4">
            <RecentLeadsTable leads={leads.slice(0, 6)} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
