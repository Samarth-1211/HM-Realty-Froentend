import { useEffect, useMemo, useState } from 'react'
import { BellRing, FileText, MessageCircle, Send, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { StatusPill } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { FollowUpFiltersPanel } from '@/components/follow-ups/follow-up-filters'
import { SendFollowUpModal } from '@/components/follow-ups/send-follow-up-modal'
import { BroadcastHistory } from '@/components/follow-ups/broadcast-history'
import { TemplatesTab } from '@/components/follow-ups/templates-tab'
import { useFollowUpLeads } from '@/hooks/queries/use-follow-ups'
import { useProjects } from '@/hooks/queries/use-projects'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth-store'
import { LEAD_PROGRESS_STAGE_LABELS, LEAD_TEMPERATURE_COLORS, LEAD_TEMPERATURE_LABELS } from '@/lib/constants'
import { cn, formatDate, formatDateTime, formatLeadNumber } from '@/lib/utils'
import type { FollowUpFilters, FollowUpLead, FollowUpSelection, FollowUpSortField } from '@/api/follow-ups.api'
import { UserRole } from '@/types'

/** Most leads one follow-up can go to (the backend's MAX_BROADCAST_RECIPIENTS). */
const MAX_RECIPIENTS = 5000
const PAGE_SIZE = 50
const checkboxClass = 'size-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500'

const SORTS: { value: string; label: string; sortBy: FollowUpSortField; sortDir: 'asc' | 'desc' }[] = [
  { value: 'next-asc', label: 'Next follow-up — soonest first', sortBy: 'nextFollowUpAt', sortDir: 'asc' },
  { value: 'next-desc', label: 'Next follow-up — latest first', sortBy: 'nextFollowUpAt', sortDir: 'desc' },
  { value: 'contacted-asc', label: 'Last contacted — longest ago first', sortBy: 'lastContactedAt', sortDir: 'asc' },
  { value: 'created-desc', label: 'Newest leads first', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'created-asc', label: 'Oldest leads first', sortBy: 'createdAt', sortDir: 'asc' },
  { value: 'name-asc', label: 'Name A–Z', sortBy: 'fullName', sortDir: 'asc' },
  { value: 'budget-desc', label: 'Budget — highest first', sortBy: 'budgetMax', sortDir: 'desc' },
  { value: 'temp-asc', label: 'Temperature — hot first', sortBy: 'leadTemperature', sortDir: 'asc' },
]

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function FollowUpsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const canFilterByPerson = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER

  // Templates speak for the whole company — only Admins write and submit them.
  const isAdmin = currentUser?.role === UserRole.ADMIN
  const [tab, setTab] = useState<'send' | 'history' | 'templates'>('send')
  const [openBroadcastId, setOpenBroadcastId] = useState<string | null>(null)

  const [filters, setFilters] = useState<FollowUpFilters>({})
  const appliedFilters = useDebounced(filters, 350)
  const [sort, setSort] = useState(SORTS[0].value)
  const [page, setPage] = useState(1)
  const sortDef = SORTS.find((s) => s.value === sort) ?? SORTS[0]

  // Selection: a hand-picked set, or "every lead matching the filters" minus a few.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [allMatching, setAllMatching] = useState(false)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [composeOpen, setComposeOpen] = useState(false)

  const { data, isLoading, isFetching } = useFollowUpLeads({
    filters: appliedFilters,
    sortBy: sortDef.sortBy,
    sortDir: sortDef.sortDir,
    page,
    pageSize: PAGE_SIZE,
  })
  const leads = data?.items ?? []
  const total = data?.total ?? 0

  const { data: projects = [] } = useProjects()
  const { data: users = [] } = useUsers(canFilterByPerson)
  const people = useMemo(() => {
    const list = users
      .filter((u) => u.isActive && u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.ADMIN)
      .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName}` }))
    if (currentUser && !list.some((p) => p.id === currentUser.id)) {
      list.unshift({ id: currentUser.id, label: `${currentUser.firstName} ${currentUser.lastName} (me)` })
    }
    return list.sort((a, b) => a.label.localeCompare(b.label))
  }, [users, currentUser])

  // New filters or sort → back to page 1 with nothing selected.
  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
    setAllMatching(false)
    setExcludedIds(new Set())
  }, [appliedFilters, sort])

  const isSelected = (id: string) => (allMatching ? !excludedIds.has(id) : selectedIds.has(id))
  const selectedCount = allMatching ? Math.max(0, total - excludedIds.size) : selectedIds.size
  const pageAllSelected = leads.length > 0 && leads.every((l) => isSelected(l.id))

  const setOne = (id: string, on: boolean) => {
    const update = (prev: Set<string>, add: boolean) => {
      const next = new Set(prev)
      if (add) next.add(id)
      else next.delete(id)
      return next
    }
    if (allMatching) setExcludedIds((prev) => update(prev, !on))
    else setSelectedIds((prev) => update(prev, on))
  }
  const setMany = (ids: string[], on: boolean) => ids.forEach((id) => setOne(id, on))
  const clearSelection = () => {
    setSelectedIds(new Set())
    setAllMatching(false)
    setExcludedIds(new Set())
  }

  const selection: FollowUpSelection = allMatching
    ? { filters: appliedFilters, ...(excludedIds.size ? { excludeLeadIds: [...excludedIds] } : {}) }
    : { leadIds: [...selectedIds] }
  const sampleLead = leads.find((l) => isSelected(l.id)) ?? leads[0]
  const tooMany = selectedCount > MAX_RECIPIENTS

  const columns: Column<FollowUpLead>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className={checkboxClass}
          checked={pageAllSelected}
          onChange={(e) => setMany(leads.map((l) => l.id), e.target.checked)}
          aria-label="Select every lead on this page"
        />
      ),
      headerClassName: 'w-10 pr-0',
      className: 'w-10 pr-0',
      render: (l) => (
        <input
          type="checkbox"
          className={checkboxClass}
          checked={isSelected(l.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setOne(l.id, e.target.checked)}
          aria-label={`Select ${l.fullName}`}
        />
      ),
    },
    {
      key: 'lead',
      header: 'Lead',
      render: (l) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-slate-800">{l.fullName}</p>
          <p className="whitespace-nowrap text-xs text-slate-400">
            {formatLeadNumber(l.leadNumber)} · {l.phone}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {l.whatsappOptedOut && <MiniTag className="bg-rose-50 text-rose-700">Opted out</MiniTag>}
            {!l.whatsappNumber && <MiniTag className="bg-amber-50 text-amber-700">No valid mobile</MiniTag>}
            {l.chatWindowOpen && (
              <MiniTag className="bg-emerald-50 text-emerald-700">
                <MessageCircle className="size-3" /> Chatting now
              </MiniTag>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (l) =>
        l.project ? (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            {l.project.name}
            {l.project.hasBrochure && (
              <span title={`Has a brochure (${l.project.brochureMimeType === 'application/pdf' ? 'PDF' : 'picture'})`}>
                <FileText className="size-3.5 text-slate-400" />
              </span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
          <LeadStatusBadge status={l.status} />
          {l.progressStage && <span className="text-xs text-slate-500">{LEAD_PROGRESS_STAGE_LABELS[l.progressStage]}</span>}
        </div>
      ),
    },
    {
      key: 'temperature',
      header: 'Temp.',
      render: (l) =>
        l.leadTemperature ? (
          <StatusPill label={LEAD_TEMPERATURE_LABELS[l.leadTemperature]} className={LEAD_TEMPERATURE_COLORS[l.leadTemperature]} />
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'next',
      header: 'Next follow-up',
      render: (l) => {
        const overdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() < Date.now()
        return (
          <span className={cn('whitespace-nowrap', overdue ? 'font-medium text-rose-600' : 'text-slate-600')}>
            {l.nextFollowUpAt ? formatDateTime(l.nextFollowUpAt) : '—'}
            {overdue && <span className="block text-[11px]">Overdue</span>}
          </span>
        )
      },
    },
    {
      key: 'contacted',
      header: 'Last contacted',
      render: (l) => (
        <div className="whitespace-nowrap text-slate-500">
          {formatDate(l.lastContactedAt)}
          {l.lastFollowUpSentAt && (
            <span className="block text-[11px] text-emerald-700">WhatsApp follow-up {formatDate(l.lastFollowUpSentAt)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned to',
      render: (l) =>
        l.assignedTo ? (
          <span className="text-slate-600">
            {l.assignedTo.firstName} {l.assignedTo.lastName}
          </span>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        ),
    },
  ]

  return (
    <div className="pb-24">
      <PageHeader
        title="Follow-ups"
        description="Pick leads by project, status, follow-up date and more, then send them a WhatsApp follow-up — with the brochure if you like — in one go."
      />

      <div className="mb-4 max-w-md">
        <Tabs
          tabs={[
            { value: 'send', label: 'Send follow-ups' },
            { value: 'history', label: 'History' },
            ...(isAdmin ? [{ value: 'templates', label: 'Templates' }] : []),
          ]}
          active={tab}
          onChange={(v) => setTab(v as 'send' | 'history' | 'templates')}
        />
      </div>

      {tab === 'templates' && isAdmin ? (
        <TemplatesTab projects={projects} />
      ) : tab === 'history' ? (
        <BroadcastHistory openId={openBroadcastId} onOpen={setOpenBroadcastId} />
      ) : (
        <Card>
          <FollowUpFiltersPanel
            value={filters}
            onChange={setFilters}
            projects={projects}
            people={people}
            showAssignee={canFilterByPerson}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{total.toLocaleString('en-IN')}</span> lead{total === 1 ? '' : 's'}
              {isFetching && !isLoading && <span className="ml-2 text-xs text-slate-400">updating…</span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by</span>
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 min-w-[260px]">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {!allMatching && pageAllSelected && total > leads.length && (
            <div className="flex flex-wrap items-center justify-center gap-2 bg-brand-50/60 px-4 py-2 text-sm text-slate-700">
              All {leads.length} leads on this page are selected.
              <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => setAllMatching(true)}>
                Select all {total.toLocaleString('en-IN')} matching leads
              </button>
            </div>
          )}
          {allMatching && (
            <div className="flex flex-wrap items-center justify-center gap-2 bg-brand-50/60 px-4 py-2 text-sm text-slate-700">
              All {selectedCount.toLocaleString('en-IN')} matching leads are selected.
              <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
          )}

          <DataTable
            columns={columns}
            data={leads}
            isLoading={isLoading}
            rowKey={(l) => l.id}
            onRowClick={(l) => setOne(l.id, !isSelected(l.id))}
            rowClassName={(l) => isSelected(l.id) && 'bg-brand-50/50'}
            emptyIcon={BellRing}
            emptyTitle="No leads match"
            emptyDescription="Try fewer filters. Leads who replied STOP are hidden unless you turn on “Show leads who opted out”."
          />
          {total > PAGE_SIZE && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
        </Card>
      )}

      {tab === 'send' && selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:pl-64">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
            <span className="text-sm">
              <span className="font-semibold">{selectedCount.toLocaleString('en-IN')}</span> lead{selectedCount === 1 ? '' : 's'} selected
            </span>
            {tooMany && <span className="text-xs text-amber-300">One follow-up can go to at most {MAX_RECIPIENTS.toLocaleString('en-IN')}</span>}
            <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800 hover:text-white" onClick={clearSelection}>
              <X className="size-4" />
              Clear
            </Button>
            <Button size="sm" onClick={() => setComposeOpen(true)} disabled={tooMany}>
              <Send className="size-4" />
              Send WhatsApp follow-up
            </Button>
          </div>
        </div>
      )}

      <SendFollowUpModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        selection={selection}
        selectedCount={selectedCount}
        sampleLead={sampleLead}
        projects={projects}
        onSent={(broadcast) => {
          setComposeOpen(false)
          clearSelection()
          setTab('history')
          setOpenBroadcastId(broadcast.id)
        }}
      />
    </div>
  )
}

function MiniTag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium', className)}>{children}</span>
}
