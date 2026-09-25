import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Contact, Plus, Trash2, UserPlus } from 'lucide-react'
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
import { useLeads } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES, ORG_OVERSIGHT_ROLES } from '@/lib/constants'
import { LeadSource, LeadStatus, type Lead } from '@/types'
import { formatDateTime, formatEnumLabel } from '@/lib/utils'

export function LeadsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const pageSize = 10

  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  const canDelete = currentUser && ORG_OVERSIGHT_ROLES.includes(currentUser.role)

  // The backend only filters by status server-side; source filtering and
  // pagination happen client-side since GET /leads returns a plain array.
  const { data: allLeads = [], isLoading } = useLeads({
    status: (status || undefined) as LeadStatus | undefined,
  })

  const filtered = useMemo(
    () => (source ? allLeads.filter((l) => l.source === source) : allLeads),
    [allLeads, source],
  )
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
    { key: 'source', header: 'Source', render: (l) => <span className="text-slate-500">{formatEnumLabel(l.source)}</span> },
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
            headerClassName: canDelete ? 'w-20' : 'w-10',
            className: canDelete ? 'w-20' : 'w-10',
            render: (l: Lead) => (
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
                {canDelete && (
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
            ),
          },
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every inbound lead, from portals, ads and walk-ins."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add lead
          </Button>
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
      <AssignLeadModal open={!!assignLead} onClose={() => setAssignLead(null)} lead={assignLead} />
      {deleteLead && <DeleteLeadDialog lead={deleteLead} onClose={() => setDeleteLead(null)} />}
    </div>
  )
}
