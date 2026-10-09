import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, ListOrdered, Plus, TriangleAlert, UserCheck, Users, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import { Field, Input, Label } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { leadsApi, type LeadImportAllocationChoice } from '@/api/leads.api'
import { useAssignablePeople } from '@/hooks/queries/use-assignable-people'
import { useImportLeads, useLeadImport, usePreviewLeadImport } from '@/hooks/queries/use-leads'
import { usePeerManagers } from '@/hooks/queries/use-team'
import { useAuthStore } from '@/store/auth-store'
import { extractErrorMessage } from '@/lib/api-client'
import { downloadBlob } from '@/lib/export-csv'
import { uploadSharedWithLabel } from '@/lib/lead-channel'
import { cn } from '@/lib/utils'
import {
  LeadImportAllocationMode,
  LeadImportStatus,
  UserRole,
  type LeadImportAllocation,
  type LeadImportBatch,
  type LeadImportIssue,
  type LeadImportPreview,
} from '@/types'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ROWS_LISTED = 8

const count = (n: number) => n.toLocaleString('en-IN')

type Scope = 'everyone' | 'managers' | 'custom'

/** One line of a custom split: a person and how many leads they get (as typed). */
interface Share {
  key: number
  userId: string
  count: string
}

let shareKey = 0
const emptyShare = (): Share => ({ key: ++shareKey, userId: '', count: '' })

/**
 * "Upload Excel" for leads, for Admins and Managers: pick a sheet (its
 * leads are counted straight away) and who gets them — every team, picked
 * managers with or without their teams, or a custom split of so many leads
 * per person → upload it (progress by bytes) → the server imports its rows
 * (progress by rows, polled) → summary of what was imported, who got it,
 * and which rows were skipped and why.
 */
export function ImportLeadsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const isManager = user?.role === UserRole.MANAGER
  const [file, setFile] = useState<File | null>(null)
  const [scope, setScope] = useState<Scope>(isManager ? 'managers' : 'everyone')
  const [managerIds, setManagerIds] = useState<string[]>([])
  const [withTeams, setWithTeams] = useState(true)
  const [shares, setShares] = useState<Share[]>(() => [emptyShare()])
  const [uploadPercent, setUploadPercent] = useState(0)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  // The org's other managers; an Admin isn't one, so for them it's all of them.
  const { data: peers = [] } = usePeerManagers(open)
  // Everyone the uploader may hand leads to — the people a custom split can name.
  const { groups: people, peerIds } = useAssignablePeople(open)
  const preview = usePreviewLeadImport()
  const upload = useImportLeads()
  const { data: batch } = useLeadImport(batchId)
  // A Manager can take a share themselves, so they head their own list.
  const managerOptions = [...(isManager && user ? [user.id] : []), ...peers.map((p) => p.id)]
  const managerName = (id: string) => {
    if (id === user?.id) return `${user.firstName} ${user.lastName} (you)`
    const m = peers.find((p) => p.id === id)
    return m ? `${m.firstName} ${m.lastName}` : 'Manager'
  }
  const everyone = scope === 'everyone'

  // A custom split can give out at most the sheet's new leads; anything left over isn't given to anyone named.
  const available = preview.data?.newLeadCount ?? null
  const givenOut = shares.reduce((sum, s) => sum + (Number(s.count) || 0), 0)
  const sharesComplete = shares.every((s) => s.userId && Number(s.count) >= 1)
  const overBy = available != null ? givenOut - available : 0
  const taken = new Set(shares.map((s) => s.userId).filter(Boolean))
  const updateShare = (key: number, change: Partial<Share>) =>
    setShares((rows) => rows.map((s) => (s.key === key ? { ...s, ...change } : s)))

  const sharedBeyondOwnTeam =
    isManager &&
    (everyone ||
      (scope === 'managers' && managerIds.some((id) => id !== user?.id)) ||
      (scope === 'custom' && shares.some((s) => peerIds.has(s.userId))))
  const ready =
    !!file &&
    !!preview.data &&
    (everyone ||
      (scope === 'managers' && managerIds.length > 0) ||
      (scope === 'custom' && sharesComplete && overBy <= 0))

  const processing = !!batchId && (!batch || batch.status === LeadImportStatus.PROCESSING)
  const finished = !!batch && batch.status !== LeadImportStatus.PROCESSING

  // Starts where uploads used to go: every team for an Admin, their own team for a Manager.
  const reset = () => {
    setFile(null)
    preview.reset()
    setScope(isManager ? 'managers' : 'everyone')
    setShares([emptyShare()])
    setManagerIds(isManager && user ? [user.id] : [])
    setWithTeams(true)
    setUploadPercent(0)
    setBatchId(null)
    upload.reset()
  }

  // Reopening shows an import that's still running; otherwise it starts fresh.
  useEffect(() => {
    if (open && !processing && !upload.isPending) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on opening
  }, [open])

  // The sheet is counted as soon as it's picked; one that can't be read is dropped again.
  const chooseFile = (next: File | null) => {
    setFile(next)
    preview.reset()
    if (next) preview.mutate(next, { onError: () => setFile(null) })
  }

  const allocation = (): LeadImportAllocationChoice => {
    if (everyone) return { allocationMode: LeadImportAllocationMode.ALL_TEAMS, managerIds: [] }
    if (scope === 'custom') {
      return {
        allocationMode: LeadImportAllocationMode.CUSTOM,
        managerIds: [],
        customAllocations: shares.map((s) => ({ userId: s.userId, count: Number(s.count) })),
      }
    }
    return {
      allocationMode: withTeams ? LeadImportAllocationMode.MANAGERS_AND_TEAMS : LeadImportAllocationMode.MANAGERS_ONLY,
      managerIds,
    }
  }

  const start = () => {
    if (!file) return
    setUploadPercent(0)
    upload.mutate(
      { file, allocation: allocation(), onProgress: setUploadPercent },
      { onSuccess: (created) => setBatchId(created.id) },
    )
  }

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      downloadBlob(await leadsApi.importTemplate(), 'lead-upload-template.xlsx')
    } catch (error) {
      toast.error('Could not download the template', { description: extractErrorMessage(error) })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload leads from Excel"
      subtitle="Choose who gets the leads — every team, the managers you pick, or your own split"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {!batchId && (
          <>
            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Use the same columns as the Lead Sheet — <span className="font-medium text-slate-800">Customer Name</span> and{' '}
                <span className="font-medium text-slate-800">Mobile No.</span> are required. An exported Lead Sheet works as it is.
                <span className="mt-1 block text-xs text-slate-500">
                  Several numbers for one lead? Put them in the same Mobile No. cell separated by commas (9876543210, 9123456789),
                  with the column formatted as Text.
                </span>
              </p>
              <Button variant="secondary" size="sm" className="shrink-0" onClick={downloadTemplate} loading={downloading}>
                {!downloading && <Download className="size-4" />}
                Template
              </Button>
            </div>

            <FileDropZone
              accept=".xlsx,.csv"
              maxBytes={MAX_FILE_BYTES}
              file={file}
              onFile={chooseFile}
              onClear={() => chooseFile(null)}
              disabled={upload.isPending}
              icon={<FileSpreadsheet className="size-5" />}
              title="Choose or drop an Excel sheet"
              hint=".xlsx or .csv · up to 5,000 leads · 10 MB"
            />

            {file && preview.isPending && <p className="-mt-2 text-xs text-slate-500">Counting the leads in this sheet…</p>}
            {file && preview.data && <SheetCount preview={preview.data} />}

            <div>
              <Label>Who gets these leads?</Label>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                <AllocationChoice
                  selected={everyone}
                  onSelect={() => setScope('everyone')}
                  disabled={upload.isPending}
                  icon={<Users className="size-4" />}
                  title="Everyone"
                  description="Auto-allocated across every manager’s presales team"
                />
                <AllocationChoice
                  selected={scope === 'managers'}
                  onSelect={() => setScope('managers')}
                  disabled={upload.isPending}
                  icon={<UserCheck className="size-4" />}
                  title="Specific managers"
                  description="Shared equally among the managers you pick"
                />
                <AllocationChoice
                  selected={scope === 'custom'}
                  onSelect={() => setScope('custom')}
                  disabled={upload.isPending}
                  icon={<ListOrdered className="size-4" />}
                  title="Custom split"
                  description="You decide how many leads each person gets"
                />
              </div>
            </div>

            {scope === 'custom' && (
              <div className="flex flex-col gap-2">
                <Label className="mb-0">How many leads does each person get?</Label>
                {shares.map((share) => (
                  <div key={share.key} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Select
                        value={share.userId}
                        onChange={(e) => updateShare(share.key, { userId: e.target.value })}
                        disabled={upload.isPending}
                      >
                        <option value="">Select a person…</option>
                        {people.map(
                          (group) =>
                            group.candidates.length > 0 && (
                              <optgroup key={group.label} label={group.label}>
                                {group.candidates.map((c) => (
                                  <option key={c.id} value={c.id} disabled={taken.has(c.id) && c.id !== share.userId}>
                                    {c.label}
                                  </option>
                                ))}
                              </optgroup>
                            ),
                        )}
                      </Select>
                    </div>
                    <div className="w-28 shrink-0">
                      <Input
                        inputMode="numeric"
                        placeholder="Leads"
                        aria-label="Number of leads"
                        value={share.count}
                        onChange={(e) => updateShare(share.key, { count: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        disabled={upload.isPending}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Remove this person"
                      disabled={shares.length === 1 || upload.isPending}
                      onClick={() => setShares((rows) => rows.filter((s) => s.key !== share.key))}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={upload.isPending}
                    onClick={() => setShares((rows) => [...rows, emptyShare()])}
                  >
                    <Plus className="size-4" />
                    Add person
                  </Button>
                  <p className={cn('text-xs', overBy > 0 ? 'font-medium text-rose-600' : 'text-slate-500')}>
                    {available == null
                      ? 'Choose a sheet to see how many leads there are to give out.'
                      : overBy > 0
                        ? `That’s ${count(overBy)} more than the ${count(available)} new leads in this sheet.`
                        : `${count(givenOut)} of ${count(available)} new leads given out${
                            overBy < 0 ? ` · ${count(-overBy)} left over` : ' · none left over'
                          }`}
                  </p>
                </div>
              </div>
            )}

            {scope === 'managers' && (
              <>
                <Field label="Managers" hint="Each picked manager gets an equal share of the sheet.">
                  <MultiSelect
                    options={managerOptions}
                    value={managerIds}
                    onChange={setManagerIds}
                    formatLabel={managerName}
                    placeholder="Pick one or more managers"
                    searchable
                    searchPlaceholder="Search managers…"
                    emptyLabel="No managers in your organization yet"
                  />
                </Field>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Share with their team members too</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {withTeams
                        ? 'On — each manager’s share is spread across the manager and their presales team.'
                        : 'Off — the leads go only to the picked managers themselves.'}
                    </p>
                  </div>
                  <Toggle checked={withTeams} onChange={setWithTeams} disabled={upload.isPending} />
                </div>
              </>
            )}

            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              <li>Every uploaded lead is marked as provided by you.</li>
              {sharedBeyondOwnTeam && (
                <li>Leads that go to another manager or their team won’t show in your Leads list — only that manager and the Admin see them.</li>
              )}
              {scope === 'custom' ? (
                <li>
                  Each person gets the number you enter, even if they’re absent today — fewer only if the sheet turns out
                  short. Leads left over {isManager ? 'come to you' : 'stay unassigned for you to hand out'}.
                </li>
              ) : (
                <li>
                  Anyone absent or on leave today isn’t given any. If nobody is available, the leads{' '}
                  {isManager ? 'come to you' : 'stay unassigned for you to hand out'}.
                </li>
              )}
              <li>The Admin can see this upload — who uploaded it, when, who it was shared with — and download the sheet.</li>
              <li>Numbers already in the CRM are skipped, not duplicated.</li>
            </ul>

            {upload.isPending && (
              <ProgressBar
                value={uploadPercent < 100 ? uploadPercent : null}
                label={uploadPercent < 100 ? `Uploading ${file?.name ?? 'file'}` : 'Checking the sheet…'}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={start} disabled={!ready} loading={upload.isPending}>
                Upload
              </Button>
            </div>
          </>
        )}

        {processing && (
          <div className="flex flex-col gap-4">
            <ProgressBar
              value={batch && batch.totalRows > 0 ? (batch.processedRows / batch.totalRows) * 100 : null}
              label={batch ? `Importing leads from ${batch.fileName}` : 'Starting the import…'}
              detail={batch ? `${count(batch.processedRows)} of ${count(batch.totalRows)} rows` : ''}
            />
            {batch && (
              <p className="text-xs text-slate-500">
                {count(batch.createdCount)} imported · {count(batch.duplicateCount)} already in the CRM ·{' '}
                {count(batch.failedCount)} not imported
              </p>
            )}
            <p className="text-xs text-slate-400">You can close this window — the import keeps running.</p>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {finished && batch && (
          <>
            <ImportSummary batch={batch} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset}>
                Upload another
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/** What the chosen sheet holds, counted by the server before anything is uploaded. */
function SheetCount({ preview }: { preview: LeadImportPreview }) {
  return (
    <p className="-mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <span className="font-semibold tabular-nums">{count(preview.newLeadCount)}</span> new lead
      {preview.newLeadCount === 1 ? '' : 's'} in this sheet
      <span className="text-emerald-700/80">
        {' '}
        · {count(preview.totalRows)} rows
        {preview.duplicateCount > 0 && ` · ${count(preview.duplicateCount)} already in the CRM or repeated`}
        {preview.invalidCount > 0 && ` · ${count(preview.invalidCount)} can’t be read`}
      </span>
    </p>
  )
}

function AllocationChoice({
  selected,
  onSelect,
  disabled,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-xl p-3 text-left ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        selected ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-slate-200 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
        )}
      >
        {icon}
      </span>
      <span>
        <span className={cn('block text-sm font-medium', selected ? 'text-brand-700' : 'text-slate-800')}>{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
    </button>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className={cn('rounded-xl px-3 py-2.5', tones[tone])}>
      <p className="text-xl font-semibold tabular-nums">{count(value)}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}

function groupByTeam(allocation: LeadImportAllocation[]) {
  const teams = new Map<
    string,
    { managerName: string; managerAlone: boolean; total: number; members: LeadImportAllocation[] }
  >()
  for (const row of allocation) {
    const key = row.managerId ?? ''
    const team = teams.get(key) ?? { managerName: row.managerName ?? 'No manager', managerAlone: true, total: 0, members: [] }
    team.total += row.count
    team.members.push(row)
    // The manager's own row carries their id as its managerId.
    team.managerAlone = team.managerAlone && row.userId === row.managerId
    teams.set(key, team)
  }
  return [...teams.values()]
}

function teamLabel(team: { managerName: string; managerAlone: boolean }) {
  if (team.managerName === 'No manager') return 'Presales without a manager'
  return team.managerAlone ? team.managerName : `${team.managerName}’s team`
}

const ISSUE_STYLES: Record<LeadImportIssue['level'], { dot: string; label: string; order: number }> = {
  error: { dot: 'bg-rose-500', label: 'Not imported', order: 0 },
  duplicate: { dot: 'bg-amber-500', label: 'Skipped', order: 1 },
  warning: { dot: 'bg-slate-400', label: 'Imported', order: 2 },
}

/** Same message on many rows (e.g. one unknown project name) shows once, with its rows. */
function groupIssues(issues: LeadImportIssue[]) {
  const groups = new Map<string, { level: LeadImportIssue['level']; message: string; rows: number[] }>()
  for (const issue of issues) {
    const key = `${issue.level}|${issue.message}`
    const group = groups.get(key) ?? { level: issue.level, message: issue.message, rows: [] }
    group.rows.push(issue.row)
    groups.set(key, group)
  }
  return [...groups.values()].sort(
    (a, b) => ISSUE_STYLES[a.level].order - ISSUE_STYLES[b.level].order || a.rows[0] - b.rows[0],
  )
}

function rowsLabel(rows: number[]) {
  if (rows.length === 1) return `Row ${rows[0]}`
  const extra = rows.length - ROWS_LISTED
  return `Rows ${rows.slice(0, ROWS_LISTED).join(', ')}${extra > 0 ? ` +${count(extra)} more` : ''}`
}

export function ImportSummary({ batch }: { batch: LeadImportBatch }) {
  const failed = batch.status === LeadImportStatus.FAILED
  const allocation = batch.allocation ?? []
  const teams = groupByTeam(allocation)
  const assigned = allocation.reduce((sum, r) => sum + r.count, 0)
  const unassigned = batch.createdCount - assigned
  const issueGroups = groupIssues(batch.issues ?? [])

  return (
    <div className="flex flex-col gap-4">
      {failed ? (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <p>{batch.error ?? 'The upload stopped before it finished.'}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" />
          {batch.fileName} — upload finished
        </div>
      )}

      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-600">Shared with:</span> {uploadSharedWithLabel(batch)}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Imported" value={batch.createdCount} tone="success" />
        <Stat label="Already in the CRM" value={batch.duplicateCount} tone="warning" />
        <Stat label="Not imported" value={batch.failedCount} tone="danger" />
      </div>

      {teams.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Who got the leads</p>
          <ul className="flex flex-col gap-2">
            {teams.map((team) => (
              <li key={team.managerName} className="rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-sm font-medium text-slate-800">
                  {teamLabel(team)}
                  <span className="ml-1.5 font-normal text-slate-400">· {count(team.total)} leads</span>
                </p>
                {!team.managerAlone && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {team.members.map((m) => `${m.name} (${m.count})`).join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {unassigned > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            {batch.allocationMode === LeadImportAllocationMode.CUSTOM
              ? `${count(unassigned)} lead${unassigned === 1 ? ' was' : 's were'} left over after everyone got their number.`
              : `${count(unassigned)} lead${unassigned === 1 ? '' : 's'} couldn’t be assigned — nobody the sheet was shared with was available today.`}{' '}
            Assign {unassigned === 1 ? 'it' : 'them'} from the Leads list.
          </p>
        </div>
      )}

      {batch.ignoredColumns.length > 0 && (
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Columns not imported:</span> {batch.ignoredColumns.join(', ')}. The
          CRM sets lead IDs, stages and assignees itself.
        </p>
      )}

      {issueGroups.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Row details</p>
          <ul className="scrollbar-thin max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {issueGroups.map((group) => (
              <li key={`${group.level}|${group.message}`} className="flex items-start gap-2.5 px-3 py-2 text-xs">
                <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', ISSUE_STYLES[group.level].dot)} />
                <div className="min-w-0">
                  <p className="text-slate-700">
                    <span className="text-slate-400">{ISSUE_STYLES[group.level].label} · </span>
                    {group.message}
                  </p>
                  <p className="mt-0.5 tabular-nums text-slate-400">{rowsLabel(group.rows)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
