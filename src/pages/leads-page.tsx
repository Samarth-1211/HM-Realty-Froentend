import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Contact, FileSpreadsheet, ListChecks, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
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
import { BulkDeleteLeadsDialog, type SheetToDelete } from '@/components/leads/bulk-delete-leads-dialog'
import { LeadEditModal } from '@/components/leads/lead-edit-modal'
import { ImportLeadsModal } from '@/components/leads/import-leads-modal'
import { LeadChannelBadge } from '@/components/leads/lead-channel-badge'
import { useLeads, useMarkLeadsSeenWhileOpen } from '@/hooks/queries/use-leads'
import { useAuthStore } from '@/store/auth-store'
import { ASSIGNER_ROLES } from '@/lib/constants'
import { canManageLeadRecord, LEAD_CHANNEL_LABELS, lostLeadsLast } from '@/lib/lead-channel'
import { LeadIntakeChannel, LeadSource, LeadStatus, UserRole, type Lead } from '@/types'
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils'

const checkboxClass = 'size-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500'

export function LeadsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [channel, setChannel] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [sheet, setSheet] = useState('')
  const [page, setPage] = useState(1)
  // Bulk selection: the checkboxes only show once "Select" is pressed.
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [sheetToDelete, setSheetToDelete] = useState<SheetToDelete | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const pageSize = 10

  // Viewing the list is what "seeing" new leads means — clears the nav dot.
  useMarkLeadsSeenWhileOpen()

  const canAssign = currentUser && ASSIGNER_ROLES.includes(currentUser.role)
  // Managers upload too — like Admins, they choose who the sheet is shared with.
  const canImport = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER
  // Managers see their own and their team's leads; hot leads are assigned to them personally.
  const isManager = currentUser?.role === UserRole.MANAGER

  // The backend only filters by status server-side; the other filters and
  // pagination happen client-side since GET /leads returns a plain array.
  const { data: allLeads = [], isLoading } = useLeads({
    status: (status || undefined) as LeadStatus | undefined,
  })

  // Every uploaded Excel sheet the visible leads came from, newest first.
  const sheets = useMemo(() => {
    const byId = new Map<string, NonNullable<Lead['importBatch']>>()
    for (const l of allLeads) if (l.importBatch) byId.set(l.importBatch.id, l.importBatch)
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [allLeads])

  const filtered = useMemo(() => {
    const matching = allLeads.filter(
      (l) =>
        (!source || l.source === source) &&
        (!channel || l.intakeChannel === channel) &&
        (!sheet || l.importBatchId === sheet) &&
        (!onlyMine || l.assignedToId === currentUser?.id),
    )
    return status ? matching : lostLeadsLast(matching)
  }, [allLeads, status, source, channel, sheet, onlyMine, currentUser?.id])
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // A filter change starts over on page 1 with nothing selected.
  const changeFilter = (apply: () => void) => {
    apply()
    setPage(1)
    setSelectedIds(new Set())
  }

  const selectedLeads = useMemo(() => allLeads.filter((l) => selectedIds.has(l.id)), [allLeads, selectedIds])
  const pageAllSelected = paged.length > 0 && paged.every((l) => selectedIds.has(l.id))
  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))
  const toggle = (ids: string[], on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  const clearSelection = () => setSelectedIds(new Set())
  const stopSelecting = () => {
    setSelecting(false)
    clearSelection()
  }

  const selectedSheet = sheets.find((b) => b.id === sheet)
  const sheetLeadCount = sheet ? allLeads.filter((l) => l.importBatchId === sheet).length : 0

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
    ...(selecting
      ? [
          {
            key: 'select',
            header: (
              <input
                type="checkbox"
                className={checkboxClass}
                checked={pageAllSelected}
                onChange={(e) => toggle(paged.map((l) => l.id), e.target.checked)}
                aria-label="Select every lead on this page"
                title="Select every lead on this page"
              />
            ),
            headerClassName: 'w-12 text-right',
            className: 'w-12 text-right',
            render: (l: Lead) => (
              <input
                type="checkbox"
                className={checkboxClass}
                checked={selectedIds.has(l.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => toggle([l.id], e.target.checked)}
                aria-label={`Select ${l.fullName}`}
              />
            ),
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
            {canAssign && (
              <Button
                variant={selecting ? 'ghost' : 'secondary'}
                onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
                title="Select several leads to assign or delete them together"
              >
                {selecting ? <X className="size-4" /> : <ListChecks className="size-4" />}
                {selecting ? 'Cancel selection' : 'Select'}
              </Button>
            )}
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
            onChange={(e) => changeFilter(() => setStatus(e.target.value))}
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
            onChange={(e) => changeFilter(() => setSource(e.target.value))}
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
            onChange={(e) => changeFilter(() => setChannel(e.target.value))}
            className="sm:max-w-[200px]"
          >
            <option value="">All channels</option>
            {Object.values(LeadIntakeChannel).map((c) => (
              <option key={c} value={c}>
                {LEAD_CHANNEL_LABELS[c]}
              </option>
            ))}
          </Select>
          {sheets.length > 0 && (
            <Select
              value={sheet}
              onChange={(e) => changeFilter(() => setSheet(e.target.value))}
              className="sm:max-w-[240px]"
              title="Show only the leads from one uploaded Excel sheet"
            >
              <option value="">All Excel sheets</option>
              {sheets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fileName} · {formatDate(b.createdAt)}
                </option>
              ))}
            </Select>
          )}
          {isManager && (
            <Select
              value={onlyMine ? 'mine' : ''}
              onChange={(e) => changeFilter(() => setOnlyMine(e.target.value === 'mine'))}
              className="sm:max-w-[190px]"
            >
              <option value="">My team’s leads</option>
              <option value="mine">Assigned to me</option>
            </Select>
          )}
        </div>

        {selectedSheet && canImport && sheetLeadCount > 0 && (
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-violet-50/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-violet-900">
              <FileSpreadsheet className="mr-1.5 inline size-4 text-violet-500" />
              {sheetLeadCount.toLocaleString('en-IN')} lead{sheetLeadCount === 1 ? '' : 's'} from{' '}
              <span className="font-medium">{selectedSheet.fileName}</span>
              {isManager ? ' in your team' : ''}
            </p>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setSheetToDelete({ id: selectedSheet.id, fileName: selectedSheet.fileName, count: sheetLeadCount })}
            >
              <Trash2 className="size-4" />
              Delete all leads from this sheet
            </Button>
          </div>
        )}

        {selecting && (
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-brand-50/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-slate-800">
                {selectedIds.size > 0
                  ? `${selectedIds.size.toLocaleString('en-IN')} selected`
                  : 'Tick the leads you want, using the boxes on the right'}
              </span>
              {filtered.length > 0 && !allFilteredSelected && (
                <button
                  type="button"
                  className="text-brand-700 underline-offset-2 hover:underline"
                  onClick={() => toggle(filtered.map((l) => l.id), true)}
                >
                  Select all {filtered.length.toLocaleString('en-IN')} matching leads
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={selectedIds.size === 0} onClick={() => setBulkAssignOpen(true)}>
                <UserPlus className="size-4" />
                Assign
              </Button>
              <Button size="sm" variant="danger" disabled={selectedIds.size === 0} onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
              {selectedIds.size > 0 && (
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={paged}
          isLoading={isLoading}
          rowKey={(l) => l.id}
          rowClassName={(l) => selecting && selectedIds.has(l.id) && 'bg-brand-50/50'}
          // While selecting, clicking a row ticks it instead of opening the lead.
          onRowClick={(l) =>
            selecting ? toggle([l.id], !selectedIds.has(l.id)) : navigate({ to: '/leads/$leadId', params: { leadId: l.id } })
          }
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
      <AssignLeadModal
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        leads={selectedLeads}
        onAssigned={stopSelecting}
      />
      {bulkDeleteOpen && (
        <BulkDeleteLeadsDialog leads={selectedLeads} onClose={() => setBulkDeleteOpen(false)} onDeleted={stopSelecting} />
      )}
      {sheetToDelete && (
        <BulkDeleteLeadsDialog
          sheet={sheetToDelete}
          onClose={() => setSheetToDelete(null)}
          onDeleted={() => changeFilter(() => setSheet(''))}
        />
      )}
      <LeadEditModal lead={editLead} onClose={() => setEditLead(null)} />
    </div>
  )
}
