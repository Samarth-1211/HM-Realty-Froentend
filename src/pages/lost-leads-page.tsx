import { useState } from 'react'
import { Shuffle, UserPlus, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SpreadsheetTable, type SheetColumn } from '@/components/ui/spreadsheet-table'
import { AssignLeadModal } from '@/components/leads/assign-lead-modal'
import { useLeads } from '@/hooks/queries/use-leads'
import { useLeadAllocationSettings, useShuffleLostLeads, useUpdateLostLeadReallocation } from '@/hooks/queries/use-lead-allocation'
import { useAuthStore } from '@/store/auth-store'
import { formatDateTime, formatEnumLabel } from '@/lib/utils'
import { UserRole, type Lead } from '@/types'

export function LostLeadsPage() {
  const authUser = useAuthStore((s) => s.user)
  const isAdmin = authUser?.role === UserRole.ADMIN

  const { data: leads = [], isLoading } = useLeads({ status: 'LOST' })
  const { data: settings } = useLeadAllocationSettings()
  const updateMode = useUpdateLostLeadReallocation()
  const shuffle = useShuffleLostLeads()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingMode, setPendingMode] = useState<boolean | null>(null)
  const [confirmShuffle, setConfirmShuffle] = useState<'selected' | 'all' | null>(null)
  const [assignLead, setAssignLead] = useState<Lead | null>(null)

  const autoMode = settings?.autoReallocateLostLeads ?? false

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))))
  }

  const runShuffle = () => {
    const leadIds = confirmShuffle === 'selected' ? [...selected] : undefined
    shuffle.mutate(leadIds, {
      onSuccess: () => {
        setSelected(new Set())
        setConfirmShuffle(null)
      },
    })
  }

  const columns: SheetColumn<Lead>[] = [
    {
      id: 'select',
      header: '',
      sortable: false,
      accessor: () => '',
      cell: (l) => (
        <input
          type="checkbox"
          checked={selected.has(l.id)}
          onChange={() => toggleRow(l.id)}
          onClick={(e) => e.stopPropagation()}
          className="size-4 rounded border-slate-300"
        />
      ),
      minWidth: '40px',
    },
    { id: 'customerName', header: 'Customer Name', accessor: (l) => l.fullName, sticky: true, minWidth: '160px' },
    { id: 'mobile', header: 'Mobile No.', accessor: (l) => l.phone, minWidth: '120px' },
    { id: 'lostBy', header: 'Lost By', accessor: (l) => (l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '—'), minWidth: '150px' },
    { id: 'source', header: 'Lead Source', accessor: (l) => l.source, cell: (l) => formatEnumLabel(l.source), minWidth: '140px' },
    { id: 'project', header: 'Project', accessor: (l) => l.project?.name ?? '', minWidth: '140px' },
    { id: 'lostDate', header: 'Lost Date', accessor: (l) => l.updatedAt, cell: (l) => formatDateTime(l.updatedAt), minWidth: '160px' },
    { id: 'mainObjection', header: 'Main Objection', accessor: (l) => l.mainObjection ?? '', minWidth: '180px' },
    { id: 'lostReason', header: 'Lost/Nurture Reason', accessor: (l) => l.lostNurtureReason ?? '', minWidth: '200px' },
    {
      id: 'actions',
      header: '',
      sortable: false,
      accessor: () => '',
      cell: (l) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setAssignLead(l)
          }}
        >
          <UserPlus className="size-4" />
          Assign
        </Button>
      ),
      minWidth: '110px',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lost Leads"
        description="Every lead currently marked as lost — reassign by hand, or shuffle them out to a different team member."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmShuffle('selected')} disabled={selected.size === 0}>
              <Shuffle className="size-4" />
              Shuffle Selected ({selected.size})
            </Button>
            <Button variant="secondary" onClick={() => setConfirmShuffle('all')} disabled={leads.length === 0}>
              <Shuffle className="size-4" />
              Shuffle All
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader
          title="Reallocation mode"
          subtitle={
            isAdmin
              ? 'Manual: shuffle lost leads yourself, whenever you choose. Auto-shuffle: the instant a lead is marked lost, it is immediately reassigned to someone else.'
              : 'Set by your organization admin.'
          }
          action={<Badge variant={autoMode ? 'success' : 'neutral'}>{autoMode ? 'Auto-shuffle & allocation' : 'Manual shuffle'}</Badge>}
        />
        {isAdmin && (
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-shuffle & auto-allocation</p>
                <p className="mt-0.5 max-w-md text-xs text-slate-500">
                  When on, a lead is reassigned the moment it's marked lost — never back to whoever lost it. When off, use the
                  Shuffle buttons above whenever you're ready.
                </p>
              </div>
              <Toggle checked={autoMode} onChange={setPendingMode} disabled={updateMode.isPending} />
            </div>
          </CardBody>
        )}
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3 p-4">
          {leads.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={selected.size === leads.length} onChange={toggleAll} className="size-4 rounded border-slate-300" />
              Select all {leads.length} lost lead(s)
            </label>
          )}
          <SpreadsheetTable
            columns={columns}
            data={leads}
            isLoading={isLoading}
            rowKey={(l) => l.id}
            emptyIcon={XCircle}
            emptyTitle="No lost leads"
            emptyDescription="Leads marked as lost will show up here."
          />
        </CardBody>
      </Card>

      <AssignLeadModal open={!!assignLead} onClose={() => setAssignLead(null)} lead={assignLead} />

      <ConfirmDialog
        open={pendingMode !== null}
        onClose={() => setPendingMode(null)}
        onConfirm={() => {
          if (pendingMode === null) return
          updateMode.mutate(pendingMode, { onSettled: () => setPendingMode(null) })
        }}
        loading={updateMode.isPending}
        title={pendingMode ? 'Turn on auto-shuffle & allocation?' : 'Switch to manual shuffle?'}
        description={
          pendingMode
            ? 'From now on, every lead marked LOST will be instantly reassigned to a different eligible team member.'
            : 'Lost leads will stay with whoever lost them until you shuffle them by hand.'
        }
        confirmLabel={pendingMode ? 'Enable auto-shuffle' : 'Switch to manual'}
        variant={pendingMode ? 'primary' : 'danger'}
      />

      <ConfirmDialog
        open={confirmShuffle !== null}
        onClose={() => setConfirmShuffle(null)}
        onConfirm={runShuffle}
        loading={shuffle.isPending}
        title={confirmShuffle === 'selected' ? `Shuffle ${selected.size} selected lead(s)?` : `Shuffle all ${leads.length} lost lead(s)?`}
        description="Each lead will be reassigned to a different eligible team member — never back to whoever lost it."
        confirmLabel="Shuffle"
        variant="primary"
      />

      {(updateMode.isPending || shuffle.isPending) && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
          <Spinner className="size-4 text-white" />
          Working…
        </div>
      )}
    </div>
  )
}
