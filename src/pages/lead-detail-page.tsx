import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Contact,
  Mail,
  MapPin,
  Phone,
  Tag,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { AssignLeadModal } from '@/components/leads/assign-lead-modal'
import { useLead } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES } from '@/lib/constants'
import { formatCurrency, formatDateTime, formatEnumLabel } from '@/lib/utils'

const ACTIVITY_LABELS: Record<string, string> = {
  CREATED: 'Lead created',
  STATUS_UPDATED: 'Status updated',
  ASSIGNED: 'Assigned',
  REASSIGNED: 'Reassigned',
  NOTE_ADDED: 'Note added',
}

export function LeadDetailPage() {
  const { leadId } = useParams({ from: '/_app/leads/$leadId' })
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { data: lead, isLoading } = useLead(leadId)
  const [assignOpen, setAssignOpen] = useState(false)

  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)

  if (isLoading || !lead) return <PageLoader label="Loading lead…" />

  const infoRows = [
    { icon: Phone, label: 'Phone', value: lead.phone },
    { icon: Mail, label: 'Email', value: lead.email ?? '—' },
    { icon: Tag, label: 'Property interest', value: lead.propertyInterest ?? '—' },
    { icon: MapPin, label: 'City', value: lead.city ?? '—' },
    { icon: Wallet, label: 'Budget', value: lead.budgetMin || lead.budgetMax
      ? `${formatCurrency(lead.budgetMin)} – ${formatCurrency(lead.budgetMax)}`
      : '—' },
    { icon: Calendar, label: 'Received', value: formatDateTime(lead.receivedAt ?? lead.createdAt) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/leads' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-slate-900">{lead.fullName}</h2>
          <p className="text-sm text-slate-500">{formatEnumLabel(lead.source)} lead</p>
        </div>
        <LeadStatusBadge status={lead.status} />
        {canAssign && (
          <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
            <UserPlus className="size-4" />
            Assign
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Lead details" />
          <CardBody className="flex flex-col gap-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <row.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">{row.label}</p>
                  <p className="text-sm font-medium text-slate-700">{row.value}</p>
                </div>
              </div>
            ))}
            {lead.message && (
              <div className="mt-2 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-400">Message</p>
                <p className="mt-1 text-sm text-slate-600">{lead.message}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Activity timeline" subtitle="Full history for this lead" />
          <CardBody>
            {lead.activityLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Contact className="size-8 text-slate-300" />
                <p className="text-sm text-slate-400">No activity recorded yet.</p>
              </div>
            ) : (
              <ol className="relative flex flex-col gap-6 pl-5 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-slate-100">
                {lead.activityLogs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-5 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-brand-500 ring-4 ring-brand-100" />
                    <p className="text-sm font-semibold text-slate-800">
                      {ACTIVITY_LABELS[log.type] ?? formatEnumLabel(log.type)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{log.description}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="size-3" />
                      {formatDateTime(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      <AssignLeadModal open={assignOpen} onClose={() => setAssignOpen(false)} lead={lead} />
    </div>
  )
}
