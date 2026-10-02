import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Contact, FileSpreadsheet, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { LeadFormModal } from '@/components/leads/lead-form-modal'
import { AssignLeadModal } from '@/components/leads/assign-lead-modal'
import { DeleteLeadDialog } from '@/components/leads/delete-lead-dialog'
import { LeadEditModal } from '@/components/leads/lead-edit-modal'
import { ImportLeadsModal } from '@/components/leads/import-leads-modal'
import { LeadChannelBadge } from '@/components/leads/lead-channel-badge'
import { useLeads, useMarkLeadsSeenWhileOpen } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES } from '@/lib/constants'
import { canManageLeadRecord, LEAD_CHANNEL_LABELS, lostLeadsLast } from '@/lib/lead-channel'
import { LeadIntakeChannel, LeadSource, LeadStatus, UserRole, type Lead } from '@/types'
import { formatDateTime, formatEnumLabel } from '@/lib/utils'

export function LeadsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [channel, setChannel] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const pageSize = 10

  // Viewing the list is what "seeing" new leads means — clears the nav dot.
  useMarkLeadsSeenWhileOpen()

  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  // Managers upload too — shared with their own team and any managers they pick to collaborate with.
  const canImport = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER
  // Managers see their own and their team's leads; hot leads are assigned to them personally.
  const isManager = currentUser?.role === UserRole.MANAGER

  // The backend only filters by status server-side; the other filters and
  // pagination happen client-side since GET /leads returns a plain array.
  const { data: allLeads = [], isLoading } = useLeads({
    status: (status || undefined) as LeadStatus | undefined,
  })

  const filtered = useMemo(() => {
    const matching = allLeads.filter(
      (l) =>
        (!source || l.source === source) &&
        (!channel || l.intakeChannel === channel) &&
        (!onlyMine || l.assignedToId === currentUser?.id),
    )
    return status ? matching : lostLeadsLast(matching)
  }, [allLeads, status, source, channel, onlyMine, currentUser?.id])
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const columns: Column<Lead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      render: (l) => (
        <div>
          <p className="font-medium text-slate-800">{l.fullName}</p>
          <p className="text-xs text-slate-400">{l.phone}</p>
        </div>
      ),
    },
    {
      key: 'interest',
      header: 'Interest',
      render: (l) => <span className="text-slate-500">{l.propertyInterest ?? '—'}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (l) => (
        <div className="flex flex-col items-start gap-1">
          <span className="text-slate-500">{formatEnumLabel(l.source)}</span>
          <LeadChannelBadge lead={l} />
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (l) => <LeadStatusBadge status={l.status} /> },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (l) =>
        l.assignedTo ? (
          <span className="text-slate-600">
            {l.assignedTo.firstName} {l.assignedTo.lastName}
          </span>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        ),
    },
    { key: 'received', header: 'Received', render: (l) => <span className="text-slate-400">{formatDateTime(l.createdAt)}</span> },
    ...(canAssign
      ? [
          {
            key: 'actions',
            header: '',
            headerClassName: 'w-28',
            className: 'w-28',
            render: (l: Lead) => {
              const canManage = canManageLeadRecord(currentUser, l)
              return (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAssignLead(l)
                    }}
                    title="Assign"
                  >
                    <UserPlus className="size-4" />
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditLead(l)
                      }}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteLead(l)
                      }}
                      title="Delete"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every inbound lead, from portals, ads and walk-ins. Hot leads from platforms go straight to a manager."
        actions={
          <div className="flex flex-wrap gap-2">
            {canImport && (
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <FileSpreadsheet className="size-4" />
                Upload Excel
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add lead
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="sm:max-w-[170px]"
          >
            <option value="">All statuses</option>
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setPage(1)
            }}
            className="sm:max-w-[190px]"
          >
            <option value="">All sources</option>
            {Object.values(LeadSource).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </Select>
          <Select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value)
              setPage(1)
            }}
            className="sm:max-w-[200px]"
          >
            <option value="">All channels</option>
            {Object.values(LeadIntakeChannel).map((c) => (
              <option key={c} value={c}>
                {LEAD_CHANNEL_LABELS[c]}
              </option>
            ))}
          </Select>
          {isManager && (
            <Select
              value={onlyMine ? 'mine' : ''}
              onChange={(e) => {
                setOnlyMine(e.target.value === 'mine')
                setPage(1)
              }}
              className="sm:max-w-[190px]"
            >
              <option value="">My team’s leads</option>
              <option value="mine">Assigned to me</option>
            </Select>
          )}
        </div>

        <DataTable
          columns={columns}
          data={paged}
          isLoading={isLoading}
          rowKey={(l) => l.id}
          onRowClick={(l) => navigate({ to: '/leads/$leadId', params: { leadId: l.id } })}
          emptyIcon={Contact}
          emptyTitle="No leads found"
          emptyDescription="Try adjusting your filters, or add a new lead."
        />
        {filtered.length > 0 && (
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        )}
      </Card>

      <LeadFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {canImport && <ImportLeadsModal open={importOpen} onClose={() => setImportOpen(false)} />}
      <AssignLeadModal open={!!assignLead} onClose={() => setAssignLead(null)} lead={assignLead} />
      {deleteLead && <DeleteLeadDialog lead={deleteLead} onClose={() => setDeleteLead(null)} />}
      <LeadEditModal lead={editLead} onClose={() => setEditLead(null)} />
    </div>
  )
}
