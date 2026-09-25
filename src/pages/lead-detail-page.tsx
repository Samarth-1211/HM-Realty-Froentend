import { useState, type ReactNode } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  Contact,
  Flame,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Tag,
  Target,
  ThumbsDown,
  Trash2,
  User,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { LeadStatusControl } from '@/components/leads/lead-status-control'
import { AssignLeadModal } from '@/components/leads/assign-lead-modal'
import { WhatsAppChatPanel } from '@/components/leads/whatsapp-chat-panel'
import { FollowUpModal } from '@/components/leads/follow-up-modal'
import { DeleteLeadDialog } from '@/components/leads/delete-lead-dialog'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { useLead } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import {
  ASSIGNER_ROLES,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  LEAD_PROGRESS_STAGE_LABELS,
  LEAD_PURPOSE_LABELS,
  LEAD_TEMPERATURE_COLORS,
  LEAD_TEMPERATURE_LABELS,
  ORG_OVERSIGHT_ROLES,
  VISIT_STATUS_COLORS,
  VISIT_STATUS_LABELS,
} from '@/lib/constants'
import { LeadStatus, UserRole } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils'

const ACTIVITY_LABELS: Record<string, string> = {
  CREATED: 'Lead created',
  STATUS_UPDATED: 'Status updated',
  ASSIGNED: 'Assigned',
  REASSIGNED: 'Reassigned',
  NOTE_ADDED: 'Note added',
  RE_ENQUIRED: 'Enquired again',
}

export function LeadDetailPage() {
  const { leadId } = useParams({ from: '/_app/leads/$leadId' })
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { data: lead, isLoading } = useLead(leadId)
  const [assignOpen, setAssignOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  const canDelete = currentUser && ORG_OVERSIGHT_ROLES.includes(currentUser.role)

  if (isLoading || !lead) return <PageLoader label="Loading lead…" />

  const canChangeStatus =
    !!currentUser &&
    (currentUser.id === lead.assignedToId ||
      (currentUser.role === UserRole.MANAGER && lead.assignedTo?.managerId === currentUser.id) ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN)

  const infoRows = [
    {
      icon: User,
      label: 'Assigned to',
      value: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned',
    },
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500">{formatEnumLabel(lead.source)} lead</p>
            {lead.status === LeadStatus.IN_PROGRESS && lead.progressStage && (
              <Badge variant="brand">
                {lead.progressStage === 'OTHER' ? lead.progressStageNote : LEAD_PROGRESS_STAGE_LABELS[lead.progressStage]}
              </Badge>
            )}
          </div>
        </div>
        {canChangeStatus ? <LeadStatusControl lead={lead} /> : <LeadStatusBadge status={lead.status} />}
        {canAssign && (
          <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
            <UserPlus className="size-4" />
            Assign
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
          <CheckSquare className="size-4" />
          Add Task
        </Button>
        {canChangeStatus && (
          <Button size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}>
            <NotebookPen className="size-4" />
            Follow-up
          </Button>
        )}
        {canDelete && (
          <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Delete
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
            {lead.referredByName && (
              <div className="mt-2 flex items-start gap-3 rounded-xl bg-brand-50 p-3">
                <UserRound className="mt-0.5 size-4 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs font-medium text-brand-500">Referred by</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">{lead.referredByName}</p>
                  {lead.referredByPhone && <p className="text-xs text-slate-500">{lead.referredByPhone}</p>}
                  {lead.referredByEmail && <p className="text-xs text-slate-500">{lead.referredByEmail}</p>}
                </div>
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

      <Card>
        <CardHeader
          title="Follow-up & booking"
          subtitle="Contact cadence, site visit, objections, and booking status"
          action={
            canChangeStatus && (
              <Button size="sm" variant="ghost" onClick={() => setFollowUpOpen(true)}>
                <NotebookPen className="size-4" />
                Edit
              </Button>
            )
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <FollowUpStat icon={Flame} label="Temperature">
              {lead.leadTemperature ? (
                <Badge className={LEAD_TEMPERATURE_COLORS[lead.leadTemperature]}>{LEAD_TEMPERATURE_LABELS[lead.leadTemperature]}</Badge>
              ) : (
                '—'
              )}
            </FollowUpStat>
            <FollowUpStat icon={Tag} label="Purpose" value={lead.purpose ? LEAD_PURPOSE_LABELS[lead.purpose] : '—'} />
            <FollowUpStat icon={Clock} label="Last contacted" value={formatDateTime(lead.lastContactedAt)} />
            <FollowUpStat icon={Calendar} label="Next follow-up" value={formatDateTime(lead.nextFollowUpAt)} />
            <FollowUpStat icon={Calendar} label="Site visit date" value={formatDate(lead.siteVisitDate)} />
            <FollowUpStat icon={Target} label="Visit status">
              {lead.visitStatus ? (
                <Badge className={VISIT_STATUS_COLORS[lead.visitStatus]}>{VISIT_STATUS_LABELS[lead.visitStatus]}</Badge>
              ) : (
                '—'
              )}
            </FollowUpStat>
            <FollowUpStat icon={Target} label="Booking probability" value={lead.bookingProbability != null ? `${lead.bookingProbability}%` : '—'} />
            <FollowUpStat icon={Wallet} label="Booking status">
              {lead.bookingStatus ? (
                <Badge className={BOOKING_STATUS_COLORS[lead.bookingStatus]}>{BOOKING_STATUS_LABELS[lead.bookingStatus]}</Badge>
              ) : (
                '—'
              )}
            </FollowUpStat>
            <FollowUpStat icon={Wallet} label="Booking value" value={lead.bookingValue ? formatCurrency(lead.bookingValue) : '—'} />
          </div>
          {lead.mainObjection && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3">
              <ThumbsDown className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-amber-600">Main objection</p>
                <p className="mt-0.5 text-sm text-slate-700">{lead.mainObjection}</p>
              </div>
            </div>
          )}
          {lead.lostNurtureReason && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3">
              <p className="text-xs font-medium text-rose-600">Lost / nurture reason</p>
              <p className="mt-0.5 text-sm text-slate-700">{lead.lostNurtureReason}</p>
            </div>
          )}
          {lead.remarks && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-400">Remarks</p>
              <p className="mt-0.5 text-sm text-slate-700">{lead.remarks}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {(lead.source === 'WHATSAPP' || lead._count.whatsappMessages > 0) && (
        <Card>
          <CardHeader title="WhatsApp conversation" subtitle="Full chat history with this lead — reply directly from here" />
          <CardBody>
            <WhatsAppChatPanel leadId={lead.id} />
          </CardBody>
        </Card>
      )}

      <AssignLeadModal open={assignOpen} onClose={() => setAssignOpen(false)} lead={lead} />
      <TaskFormModal open={taskOpen} onClose={() => setTaskOpen(false)} lead={{ id: lead.id, fullName: lead.fullName }} />
      {canChangeStatus && <FollowUpModal open={followUpOpen} onClose={() => setFollowUpOpen(false)} lead={lead} />}
      {deleteOpen && (
        <DeleteLeadDialog lead={lead} onClose={() => setDeleteOpen(false)} onDeleted={() => navigate({ to: '/leads' })} />
      )}
    </div>
  )
}

function FollowUpStat({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Flame
  label: string
  value?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-700">{value ?? children}</div>
      </div>
    </div>
  )
}
